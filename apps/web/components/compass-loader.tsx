import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import styles from './compass-loader.module.css';

const NEEDLE_PATH =
  'M211.38,382.324C211.126,380.748 210.039,379.356 208.428,378.79C208.428,378.79 198.289,375.058 190.906,362.269C189.664,360.118 186.909,359.38 184.759,360.622C183.267,361.483 182.455,363.071 182.511,364.681C182.504,364.786 182.5,364.893 182.5,365C182.5,379.33 175.988,387.572 175.603,388.047C175.416,388.262 175.248,388.497 175.102,388.75C174.879,389.135 174.719,389.545 174.62,389.965C174.444,390.709 174.465,391.463 174.654,392.165C174.841,392.867 175.2,393.53 175.724,394.086C176.02,394.401 176.364,394.675 176.75,394.898C177.002,395.044 177.265,395.163 177.535,395.256C178.106,395.474 187.866,399.356 195.031,411.767C195.085,411.86 195.141,411.95 195.2,412.038C195.957,413.46 197.454,414.429 199.176,414.429C201.66,414.429 203.676,412.412 203.676,409.929C203.676,395.162 210.591,386.86 210.591,386.86C211.703,385.564 211.948,383.816 211.38,382.324ZM190.277,376.505C194.217,380.736 198.109,383.463 200.964,385.115C199.317,387.973 197.31,392.281 196.014,397.915C192.205,393.739 188.413,390.98 185.531,389.25C187.162,386.31 189.066,382.025 190.277,376.505Z';

const RING_RADIUS = 126.8;
const RING_WIDTH = 33.4;

const SIZES = {
  sm: 'size-10',
  md: 'size-16',
};

/**
 * The Selletive mark as a compass: the needle spins, overshoots, settles on its
 * heading and the ring pings — "we found the right direction".
 *
 * CSS-only, so it paints from the server with nothing to hydrate. It stays
 * invisible for its first 250ms, so fast navigations never flash it.
 * With reduced motion the needle holds still and the mark gently fades instead.
 */
export function CompassLoader({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      role="status"
      data-test="compass-loader"
      className={cn(styles.root, SIZES[size], className)}
    >
      <svg viewBox="0 0 300 300" aria-hidden="true" className={styles.svg}>
        <circle
          className={styles.ping}
          cx="150"
          cy="150"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--compass-accent)"
          strokeWidth="10"
        />

        <circle
          cx="150"
          cy="150"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_WIDTH}
        />

        <g className={styles.needle}>
          <g transform="matrix(1.275491,0,0,1.275491,-41.323656,-41.323656)">
            <path
              fill="currentColor"
              fillRule="evenodd"
              transform="matrix(2.014412,1.272555,1.272555,-2.014412,-731.731339,684.30799)"
              d={NEEDLE_PATH}
            />
          </g>
        </g>
      </svg>

      <span className="sr-only">
        <Trans i18nKey="common.loading" />
      </span>
    </div>
  );
}

/** Centers the compass in the space a route segment leaves for its content. */
export function CompassPageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full flex-1 items-center justify-center py-16">
      <CompassLoader />
    </div>
  );
}
