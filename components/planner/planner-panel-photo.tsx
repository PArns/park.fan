'use client';

import { backgroundPhotoUrl } from '@/lib/utils/image-loader';

/**
 * The park's photo behind the panel, or a drawn ground where there is none. The photo comes
 * resolved on the `/plan/day` payload, because `@/lib/media` is too large for a Client Component in
 * the layout. It sits in a negative layer (`-z-10`, inside the sheet's `isolate`), or it paints
 * over every in-flow row of the panel. See
 * docs/features/trip-planner.md#the-photo-behind-the-panel-sits-in-a-negative-layer.
 *
 * `rounded-[inherit]`, so the phone sheet's rounded top corners stay. Photo and ground are
 * alternatives, never stacked: the contrast budget below was measured off the photo composite.
 */
export function PlannerPanelPhoto({ src, position }: { src?: string | null; position?: string }) {
  if (!src) return <PlannerPanelGround />;

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.12]"
        style={{
          backgroundImage: `url(${backgroundPhotoUrl(src)})`,
          backgroundPosition: position ?? '50% 0%',
        }}
      />
      <div className="from-background/75 via-background/55 to-background/90 absolute inset-0 bg-gradient-to-b" />
    </div>
  );
}

/**
 * The mark's upper edge, as a percentage of the panel's height (`h-[54%]` hung off the foot with a
 * `-6%` bleed). Percentages, because these end up in a CSS string and fractions do not multiply
 * cleanly.
 */
const MARK_TOP_PCT = 100 + 6 - 54;
/** L1's ellipse, `<width> <height> at <x> <y>`, in percentages of the panel. */
const LIGHT_HEIGHT_PCT = 72;
const LIGHT_CENTER_Y_PCT = -8;
/**
 * A radial gradient is transparent from `centre + stop × radius`, so the stop that ends L1 exactly
 * at {@link MARK_TOP_PCT} is computed, not typed.
 */
const LIGHT_STOP_PCT = ((MARK_TOP_PCT - LIGHT_CENTER_Y_PCT) / LIGHT_HEIGHT_PCT) * 100;

/**
 * The ground for the panel that has no photo, which is nearly every panel (few parks carry a
 * background image, and many pages have no park at all).
 *
 * Not another park's photograph, which would be a claim about a park the plan is not about. It
 * draws the app: light from above and the park.fan pin, oversized and bled off the foot.
 *
 * The ink is `--park-primary`, the accent token that flips with the theme, so it buys more tint for
 * the same contrast than `--primary`, with no `dark:` utility. Every layer is held under the photo
 * composite's own worst case (head 18.10:1, muted rows 6.73:1), and in the light theme muted text
 * must stay above 4.5:1. L1 and L3 may not overlap, or the head drops below that bar, so L1 ends
 * exactly at {@link MARK_TOP_PCT}. The mark is a mask, so it takes its colour from the token in
 * both themes; without `mask-image` support it degrades to a soft corner wash.
 */
function PlannerPanelGround() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      {/* L1: light from above, over the head of the panel and no further. */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            `radial-gradient(125% ${LIGHT_HEIGHT_PCT}% at 14% ${LIGHT_CENTER_Y_PCT}%, ` +
            `var(--park-primary) 0%, transparent ${LIGHT_STOP_PCT.toFixed(2)}%)`,
        }}
      />

      {/* L2: the ground the mark stands in, from past the lower right corner up to a third of the
          panel, so the two lights meet. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_92%_104%,var(--park-primary)_0%,transparent_78%)] opacity-[0.03]" />

      {/* L3: the mark. `aspect-[90.03/124.21]` is the pin's viewBox, its measured ink box, so the
          mask fills the element without letterboxing. */}
      <div className="bg-park-primary absolute right-[-11%] bottom-[-6%] aspect-[90.03/124.21] h-[54%] mask-[url(/logo-small.svg)] mask-contain mask-center mask-no-repeat opacity-[0.085]" />
    </div>
  );
}
