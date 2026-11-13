'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Skeleton } from '@kit/ui/skeleton';
import { cn } from '@kit/ui/utils';

/**
 * Client ID of the Google OAuth client that Supabase's Google provider trusts.
 * When it is missing the caller's `fallback` (the redirect flow) renders instead.
 */
const GOOGLE_SIGN_IN_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN_CLIENT_ID;

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GIS_MAX_BUTTON_WIDTH = 400;

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce: string;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: 'signin' | 'signup' | 'use';
    ux_mode?: 'popup' | 'redirect';
    itp_support?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type: 'standard';
      theme: 'outline' | 'filled_blue' | 'filled_black';
      size: 'large';
      text: 'signin_with' | 'signup_with' | 'continue_with';
      shape: 'rectangular';
      logo_alignment: 'left' | 'center';
      width: number;
      locale?: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let gisScriptPromise: Promise<GoogleAccountsId> | null = null;

function loadGoogleIdentityServices() {
  gisScriptPromise ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const gis = window.google?.accounts?.id;

      if (gis) {
        resolve(gis);
      } else {
        reject(new Error('Google Identity Services did not initialise'));
      }
    };
    script.onerror = () =>
      reject(new Error('Google Identity Services failed to load'));

    document.head.appendChild(script);
  }).catch((error: unknown) => {
    gisScriptPromise = null;
    throw error;
  });

  return gisScriptPromise;
}

/**
 * Google gets the SHA-256 of the nonce inside the ID token; Supabase gets the
 * raw value and checks that it hashes to what Google signed.
 */
async function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw),
  );

  const hashed = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return { raw, hashed };
}

/**
 * @name GoogleIdTokenButton
 * @description Google sign-in rendered on our own domain (Google Identity
 * Services) and exchanged with Supabase through `signInWithIdToken`, so the
 * Google chooser names the application instead of the Supabase project domain.
 * The session is set in the browser; `onSignedIn` decides where to go next.
 */
export function GoogleIdTokenButton({
  fallback,
  disabled = false,
  text = 'continue_with',
  onBeforeSignIn,
  onSignedIn,
  onError,
}: {
  fallback: React.ReactNode;
  disabled?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onBeforeSignIn?: () => Promise<void>;
  onSignedIn: () => void;
  onError: (error: unknown) => void;
}) {
  const supabase = useSupabase();
  const language = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'failed';
    busy: boolean;
  }>({ status: 'loading', busy: false });


  const handleCredential = useEffectEvent(
    async (credential: string, nonce: string) => {
      setState((current) => ({ ...current, busy: true }));

      try {
        await onBeforeSignIn?.();

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
          nonce,
        });

        if (error) throw error;

        onSignedIn();
      } catch (error) {
        setState((current) => ({ ...current, busy: false }));
        onError(error);
      }
    },
  );

  // Google's script draws its button into a DOM node we own, so it has to be
  // loaded and rendered after mount.
  useEffect(() => {
    if (!GOOGLE_SIGN_IN_CLIENT_ID) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;

    Promise.all([loadGoogleIdentityServices(), createNonce()])
      .then(([gis, nonce]) => {
        const container = containerRef.current;
        const target = buttonRef.current;

        if (cancelled || !container || !target) return;

        gis.initialize({
          client_id: GOOGLE_SIGN_IN_CLIENT_ID,
          nonce: nonce.hashed,
          callback: (response) =>
            void handleCredential(response.credential, nonce.raw),
          auto_select: false,
          cancel_on_tap_outside: true,
          context: text === 'signin_with' ? 'signin' : 'signup',
          ux_mode: 'popup',
          itp_support: true,
          use_fedcm_for_button: true,
        });

        // Google's button has a fixed pixel width, so it is redrawn whenever
        // the container settles on a new width (it can be 0 mid-animation).
        let renderedWidth = 0;

        const render = () => {
          const width = Math.min(GIS_MAX_BUTTON_WIDTH, container.offsetWidth);

          if (width === 0 || width === renderedWidth) return;

          renderedWidth = width;
          target.replaceChildren();
          gis.renderButton(target, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text,
            shape: 'rectangular',
            logo_alignment: 'center',
            width,
            locale: language,
          });

          setState((current) => ({ ...current, status: 'ready' }));
        };

        resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(container);
        render();
      })
      .catch((error: unknown) => {
        console.error('Google sign-in button failed to load', error);

        if (!cancelled) {
          setState((current) => ({ ...current, status: 'failed' }));
        }
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [language, text]);

  if (!GOOGLE_SIGN_IN_CLIENT_ID || state.status === 'failed') {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={containerRef}
      data-test="google-id-token-button"
      aria-busy={state.busy}
      className={cn(
        'relative flex min-h-10 w-full justify-center transition-opacity',
        (disabled || state.busy) && 'pointer-events-none opacity-60',
      )}
    >
      {state.status === 'loading' && (
        <Skeleton className="absolute inset-0 h-10 rounded-lg" />
      )}

      <div ref={buttonRef} />

      {state.busy && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}
