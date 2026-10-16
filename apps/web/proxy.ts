import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import createNextIntlMiddleware from 'next-intl/middleware';

import { isSuperAdmin } from '@kit/admin';
import { routing } from '@kit/i18n/routing';
import { getSafeRedirectPath } from '@kit/shared/utils';
import { checkRequiresMultiFactorAuthentication } from '@kit/supabase/check-requires-mfa';
import { createMiddlewareClient } from '@kit/supabase/middleware-client';

import pathsConfig from '~/config/paths.config';

const NEXT_ACTION_HEADER = 'next-action';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|locales|assets|sitemaps(?:/|$)|sitemap.xml|robots.txt|api/*).*)',
  ],
};

// create i18n middleware once at module scope
const handleI18nRouting = createNextIntlMiddleware(routing);

const getUser = (request: NextRequest, response: NextResponse) => {
  const supabase = createMiddlewareClient(request, response);

  return supabase.auth.getClaims();
};

export default async function proxy(request: NextRequest) {
  // run next-intl middleware first to get the i18n-aware response
  const response = handleI18nRouting(request);

  // apply secure headers on top of the i18n response
  const secureHeadersResponse = await createResponseWithSecureHeaders(response);

  // set a unique request ID for each request
  // this helps us log and trace requests
  setRequestId(request);

  // Resolve missing directory URLs before streaming begins, preserving a true
  // HTTP 404 for crawlers instead of a streamed 200 with an error screen.
  const missingDirectoryPage = await isMissingDirectoryPage(
    request,
    secureHeadersResponse,
  );
  if (missingDirectoryPage) {
    return withPreviewRobots(
      new NextResponse(
        `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Página não encontrada | Selletive</title></head><body><main><p>Selletive</p><h1>Página não encontrada</h1><p>O perfil ou a categoria pode ter mudado.</p><a href="/categories">Explorar empresas</a></main></body></html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, follow',
          },
        },
      ),
    );
  }

  // handle patterns for specific routes
  const handlePattern = await matchUrlPattern(request);

  // if a pattern handler exists, call it
  if (handlePattern) {
    const patternHandlerResponse = await handlePattern(
      request,
      secureHeadersResponse,
    );

    // if a pattern handler returns a response, return it
    if (patternHandlerResponse) {
      return withPreviewRobots(patternHandlerResponse);
    }
  }

  // append the action path to the request headers
  // which is useful for knowing the action path in server actions
  if (isServerAction(request)) {
    secureHeadersResponse.headers.set(
      'x-action-path',
      request.nextUrl.pathname,
    );
  }

  // if no pattern handler returned a response,
  // return the session response
  return withPreviewRobots(secureHeadersResponse);
}

function withPreviewRobots(response: NextResponse) {
  if (process.env.SELLETIVE_DEPLOYMENT_STAGE === 'preview') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

function isServerAction(request: NextRequest) {
  const headers = new Headers(request.headers);

  return headers.has(NEXT_ACTION_HEADER);
}

async function adminMiddleware(request: NextRequest, response: NextResponse) {
  const { data, error } = await getUser(request, response);

  // If user is not logged in, redirect to sign in page.
  // This should never happen, but just in case.
  if (!data?.claims || error) {
    return NextResponse.redirect(
      new URL(pathsConfig.auth.signIn, request.nextUrl.origin).href,
    );
  }

  const client = createMiddlewareClient(request, response);
  const userIsSuperAdmin = await isSuperAdmin(client);

  // If user is not an admin, redirect to 404 page.
  if (!userIsSuperAdmin) {
    return NextResponse.redirect(new URL('/404', request.nextUrl.origin).href);
  }

  // in all other cases, return the response
  return response;
}

/**
 * Define URL patterns and their corresponding handlers.
 */
async function getPatterns() {
  let URLPattern = globalThis.URLPattern;

  if (!URLPattern) {
    const { URLPattern: polyfill } = await import('urlpattern-polyfill');
    URLPattern = polyfill as typeof URLPattern;
  }

  return [
    {
      pattern: new URLPattern({ pathname: '/admin/*?' }),
      handler: adminMiddleware,
    },
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: async (req: NextRequest, res: NextResponse) => {
        const { data } = await getUser(req, res);
        const normalizedPathname = getNormalizedPathname(req.nextUrl.pathname);

        // the user is logged out, so we don't need to do anything
        if (!data?.claims) {
          return;
        }

        // check if we need to verify MFA (user is authenticated but needs to verify MFA)
        const isVerifyMfa = normalizedPathname === pathsConfig.auth.verifyMfa;

        // If user is logged in and does not need to verify MFA,
        // redirect to home page.
        if (!isVerifyMfa) {
          const nextPath = getSafeRedirectPath(
            req.nextUrl.searchParams.get('next'),
            pathsConfig.app.home,
          );

          return NextResponse.redirect(
            new URL(nextPath, req.nextUrl.origin).href,
          );
        }
      },
    },
    {
      pattern: new URLPattern({ pathname: '/home/*?' }),
      handler: requireAuthenticatedUser,
    },
    {
      pattern: new URLPattern({ pathname: '/identities/*?' }),
      handler: requireAuthenticatedUser,
    },
    {
      pattern: new URLPattern({ pathname: '/update-password/*?' }),
      handler: requireAuthenticatedUser,
    },
    {
      // Match the page exactly rather than the whole subtree. A wildcard here
      // would also capture /join/accept, which is the route handler behind the
      // links we email out. That handler has to stay reachable while signed
      // out, because verifying the link signature and creating the session is
      // its whole job. Gating it would bounce the invitee to sign-up before it
      // ever ran.
      pattern: new URLPattern({ pathname: '/join' }),
      handler: joinTeamMiddleware,
    },
  ];
}

/**
 * Gating auth here rather than in the page means the redirect happens before
 * any HTML is sent, and the page can render its shell without waiting on the
 * session. Pages keep their own checks as defence in depth.
 */
async function requireAuthenticatedUser(req: NextRequest, res: NextResponse) {
  const { data } = await getUser(req, res);
  const { origin, pathname: next } = req.nextUrl;

  // If user is not logged in, redirect to sign in page.
  if (!data?.claims) {
    const signIn = pathsConfig.auth.signIn;
    const redirectPath = `${signIn}?next=${next}`;

    return NextResponse.redirect(new URL(redirectPath, origin).href);
  }

  const supabase = createMiddlewareClient(req, res);

  const requiresMultiFactorAuthentication =
    await checkRequiresMultiFactorAuthentication(supabase);

  // If user requires multi-factor authentication, redirect to MFA page.
  if (requiresMultiFactorAuthentication) {
    return NextResponse.redirect(
      new URL(pathsConfig.auth.verifyMfa, origin).href,
    );
  }
}

/**
 * Invitations differ from the generic gate: a logged-out visitor is sent to
 * sign-up rather than sign-in, and the invite token has to survive the round
 * trip. Token validation itself stays in the page.
 */
async function joinTeamMiddleware(req: NextRequest, res: NextResponse) {
  const token = req.nextUrl.searchParams.get('invite_token');
  const { origin } = req.nextUrl;

  // No token — let the page render its own not-found.
  if (!token) {
    return;
  }

  const { data } = await getUser(req, res);

  if (!data?.claims) {
    const params = new URLSearchParams({ invite_token: token });

    return NextResponse.redirect(
      new URL(`${pathsConfig.auth.signUp}?${params.toString()}`, origin).href,
    );
  }

  const supabase = createMiddlewareClient(req, res);

  const requiresMultiFactorAuthentication =
    await checkRequiresMultiFactorAuthentication(supabase);

  if (requiresMultiFactorAuthentication) {
    const email = req.nextUrl.searchParams.get('email') ?? '';

    const next = `${pathsConfig.app.joinTeam}?invite_token=${token}&email=${email}`;
    const params = new URLSearchParams({ next });

    return NextResponse.redirect(
      new URL(`${pathsConfig.auth.verifyMfa}?${params.toString()}`, origin)
        .href,
    );
  }
}

/**
 * Match URL patterns to specific handlers.
 * @param request
 */
async function matchUrlPattern(request: NextRequest) {
  const patterns = await getPatterns();
  const input = getNormalizedPathname(request.nextUrl.pathname);

  for (const pattern of patterns) {
    const patternResult = pattern.pattern.exec(input, request.nextUrl.origin);

    if (patternResult !== null && 'pathname' in patternResult) {
      return pattern.handler;
    }
  }
}

function getNormalizedPathname(pathname: string) {
  const localePrefix = getLocalePrefix(pathname);

  if (!localePrefix) {
    return pathname;
  }

  const normalizedPathname = pathname.slice(localePrefix.length);

  return normalizedPathname || '/';
}

function getLocalePrefix(pathname: string) {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;

    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return prefix;
    }
  }

  return null;
}

/**
 * Set a unique request ID for each request.
 * @param request
 */
function setRequestId(request: Request) {
  request.headers.set('x-correlation-id', crypto.randomUUID());
}

/**
 * @name createResponseWithSecureHeaders
 * @description Create a middleware with enhanced headers applied (if applied).
 * This is disabled by default. To enable set ENABLE_STRICT_CSP=true
 */
async function createResponseWithSecureHeaders(response: NextResponse) {
  const enableStrictCsp = process.env.ENABLE_STRICT_CSP ?? 'false';

  // we disable ENABLE_STRICT_CSP by default
  if (enableStrictCsp === 'false') {
    return response;
  }

  const { createCspResponse } = await import('./lib/create-csp-response');
  const cspResponse = await createCspResponse();

  // set the CSP headers on the i18n response
  if (cspResponse) {
    for (const [key, value] of cspResponse.headers.entries()) {
      response.headers.set(key, value);
    }
  }

  return response;
}

async function isMissingDirectoryPage(
  request: NextRequest,
  response: NextResponse,
) {
  if (!['GET', 'HEAD'].includes(request.method)) return false;
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  if (routing.locales.includes(segments[0] as never)) segments.shift();
  if (segments.length !== 2) return false;
  const [first, second] = segments;
  if (!first || !second) return false;
  const client = createMiddlewareClient(request, response);
  if (first === 'company' || first === 'categories') {
    const result =
      first === 'company'
        ? await client
            .from('businesses')
            .select('id')
            .eq('slug', second)
            .maybeSingle()
        : await client
            .from('categories')
            .select('id')
            .eq('slug', second)
            .eq('is_active', true)
            .maybeSingle();
    return !result.error && !result.data;
  }
  if (
    [
      'auth',
      'home',
      'admin',
      'api',
      'blog',
      'changelog',
      'docs',
      'claim',
      'sitemaps',
    ].includes(first)
  )
    return false;
  const [category, location] = await Promise.all([
    client
      .from('categories')
      .select('id')
      .eq('slug', first)
      .eq('is_active', true)
      .maybeSingle(),
    client.from('locations').select('id').eq('slug', second).maybeSingle(),
  ]);
  if (category.error || location.error) return false;
  if (!location.data) return true;
  if (category.data) return false;
  const alias = await client
    .from('category_aliases')
    .select('category_id')
    .eq('alias_slug', first)
    .maybeSingle();
  return !alias.error && !alias.data;
}
