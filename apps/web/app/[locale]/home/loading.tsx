import { GlobalLoader } from '@kit/ui/global-loader';

/**
 * Not a skeleton on purpose: `getLayoutState()` picks sidebar vs header chrome
 * from a cookie, so the shape is unknown here. Guessing across the whole
 * viewport looks worse than a neutral indicator.
 */
export default function Loading() {
  return <GlobalLoader fullPage />;
}
