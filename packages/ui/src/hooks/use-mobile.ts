import { useSyncExternalStore } from 'react';

/**
 * Matches Tailwind's `lg` breakpoint, and must stay above the `md` gates the
 * upstream `Sidebar` puts on its desktop branch (`../shadcn/sidebar.tsx`).
 *
 * `PageMobileNavigation` — the mobile top bar holding the sidebar trigger —
 * is hidden with `lg:hidden`, and `PageWithSidebar` hides the SSR desktop
 * sidebar below the same breakpoint (both in `../makerkit/page.tsx`). Moving
 * this constant without moving those leaves a band with two navigation
 * surfaces, or none.
 */
const MOBILE_BREAKPOINT = 1024;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);

  mql.addEventListener('change', onChange);

  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
