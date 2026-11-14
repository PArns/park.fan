import { cn } from '@/lib/utils';
import type { TripRegionSceneProps } from '@/lib/trip-regions/registry';

/**
 * The planner band's picture of a region whose Parky scene is not drawn yet: sky, hills and a
 * shore in the 320 × 160 frame every scene shares, in both themes, so a tile has its height and
 * its fade before the drawing arrives. A region's own scene is a file beside this one,
 * `region-art/<slug>.tsx`, and its loader replaces this one in `lib/trip-regions/regions/`.
 * Decoration under the scene contract (`TripRegionSceneProps`): `aria-hidden`, nothing moves.
 */
export function RegionArtPlaceholder({ className }: TripRegionSceneProps) {
  return (
    <svg
      viewBox="0 0 320 160"
      preserveAspectRatio="xMaxYMid slice"
      className={cn('block', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="region-art-placeholder-sky" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            className="[stop-color:oklch(0.78_0.08_232)] dark:[stop-color:oklch(0.26_0.07_285)]"
          />
          <stop
            offset="1"
            className="[stop-color:oklch(0.93_0.05_215)] dark:[stop-color:oklch(0.4_0.09_320)]"
          />
        </linearGradient>
      </defs>
      <rect width="320" height="160" fill="url(#region-art-placeholder-sky)" />
      <path
        d="M0 104 Q40 82 84 98 T170 92 T252 96 T320 88 V160 H0 Z"
        className="fill-[oklch(0.7_0.08_160)] dark:fill-[oklch(0.3_0.05_300)]"
      />
      <path
        d="M0 122 Q70 110 150 120 T320 116 V160 H0 Z"
        className="fill-[oklch(0.76_0.07_220)] dark:fill-[oklch(0.25_0.05_275)]"
      />
      <path
        d="M0 140 Q90 132 180 140 T320 136 V160 H0 Z"
        className="fill-[oklch(0.93_0.04_85)] dark:fill-[oklch(0.33_0.04_60)]"
      />
    </svg>
  );
}
