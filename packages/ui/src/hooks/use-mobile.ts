import { useSyncExternalStore } from 'react';

/**
 * The exact complement of Tailwind's `lg:` variant, which compiles to
 * `@media (min-width: 64rem)` — `max-lg:` compiles to its negation.
 *
 * Deliberately expressed in `rem` rather than px. In a media query `rem`
 * resolves against the browser's default font size (never `html { font-size }`),
 * so a reader who raises that setting moves every `lg:` gate in the app. A px
 * constant stays pinned at 1024 and drifts out of alignment by
 * `|1024 - 64 * default|` px — opening a band where `PageMobileNavigation`
 * (`lg:hidden`, `../makerkit/page.tsx`) still shows the menu button while the
 * guard in `SidebarProvider` has already hidden the only sidebar that button
 * can toggle, leaving no reachable navigation at all.
 *
 * `not all and (...)` rather than the shorter `not (...)`: the bare form is
 * Media Queries Level 4 syntax, and a browser that fails to parse it yields a
 * query that silently never matches — failing closed to "desktop" on exactly
 * the narrow viewports this is meant to catch.
 */
const MOBILE_QUERY = 'not all and (min-width: 64rem)';

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
