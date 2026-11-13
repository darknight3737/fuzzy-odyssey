import { CompassPageLoader } from '~/components/compass-loader';

/**
 * Not a skeleton on purpose: `getLayoutState()` picks sidebar vs header chrome
 * from a cookie, so the shape is unknown here. Guessing across the whole
 * viewport looks worse than the brand loader.
 */
export default CompassPageLoader;
