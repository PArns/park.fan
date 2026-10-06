import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';

/**
 * The plate the hero's left column sits on, so the hero is one composition of two panels. The
 * same glass as the map panel (`GlassCard variant="heavy"`), so the two cannot drift apart. That
 * glass re-filters the ken-burns photo every frame (docs/features/homepage-hero.md), so small
 * things on the plate must not blur as well.
 */
export function HeroTextPanel({ children, className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <GlassCard
      variant="heavy"
      {...rest}
      className={cn(
        // min-w-0: the scrollable pill row inside must not widen this box past its grid column.
        'w-full min-w-0 rounded-3xl border p-6 shadow-xl sm:p-8',
        // Below 1280 px there is no map panel beside it, so the plate widens and centres itself.
        // The threshold is `@container/page`, not `xl:`, so it agrees with the grid even while the
        // planner narrows the page.
        'mx-auto max-w-3xl @min-[1280px]/page:mx-0 @min-[1280px]/page:max-w-2xl',
        // The pills fade while the search holds focus through `peer/hero-search` on the siblings
        // (app/[locale]/page.tsx), not a `:has()` rule here, see
        // docs/rules/no-has-selector-in-the-stylesheet.md. No forced height: each column is as
        // tall as its content.
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
