import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';

/**
 * The plate the hero's left column sits on.
 *
 * Without it the headline, search and pills float loose on the photo while the world map to
 * their right is a defined panel, and the two halves read as unrelated. This gives the left
 * side the same footprint — matching corner radius, border and vertical extent — so the hero
 * is one composition of two panels.
 *
 * It is the SAME glass as the map panel — `GlassCard variant="heavy"`, not a hand-rolled
 * blur — because the two plates sit side by side and any difference in radius or tint reads
 * immediately as one of them being wrong. Sharing the variant is what keeps them from drifting
 * apart the next time either is touched.
 *
 * That glass is not free: a backdrop filter this large over the ken-burns photo is re-filtered
 * on every animation frame (measurements in docs/features/homepage-hero.md). The radius is not
 * what costs, though, so matching the map panel's 64 px is no more expensive than the 40 px it
 * replaced. Small things ON the plate still must not blur — each would re-filter the same
 * moving backdrop for no visual gain.
 */
export function HeroTextPanel({ children, className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <GlassCard
      variant="heavy"
      {...rest}
      className={cn(
        // min-w-0: the scrollable pill row inside must not widen this box past its grid column.
        'w-full min-w-0 rounded-3xl border p-6 shadow-xl sm:p-8',
        // Below 1280 px there is no map panel beside it, so the plate would otherwise sit narrow
        // and left-aligned against a wide empty half. It gets more width AND centres itself
        // there; from 1280 it goes back to hugging the left column next to the map.
        // The threshold is `@container/page` (app/[locale]/layout.tsx) and not `xl:`, because it
        // has to agree with the grid that puts the map beside it: with the planner open the
        // window said 2000 and the page had 1100, so the plate took the two-column branch
        // (`max-w-2xl`, left-aligned) in a single-column grid and came out 356 px wide.
        'mx-auto max-w-3xl @min-[1280px]/page:mx-0 @min-[1280px]/page:max-w-2xl',
        // While the search field has focus its dropdown covers the nearby pills. Fading them
        // out is what lets that dropdown be real glass: through 75% translucency the pills'
        // high-contrast text ghosts straight through the blur, and the only alternative was to
        // make the dropdown nearly opaque. `:has()` keeps this in CSS — no shared open state
        // between two sibling components — and browsers without it just keep the pills.
        '[&:has(input:focus)_[data-hero-bubbles]]:pointer-events-none [&:has(input:focus)_[data-hero-bubbles]]:opacity-0',
        // No forced height: the two columns are offset against each other rather than aligned,
        // so each is as tall as its own content.
        'xl:flex xl:flex-col',
        // …but a reserved MINIMUM from md up, which is where the search dropdown's resting list
        // starts occupying the flow. It stops the browser painting a short plate while the rest
        // of its markup is still streaming in. See --hero-plate-min-h for the measurements.
        'md:min-h-[var(--hero-plate-min-h)]',
        className
      )}
    >
      {children}
    </GlassCard>
  );
}
