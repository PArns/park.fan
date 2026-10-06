import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/common/glass-card';
import { HeroBubbleRow } from '@/components/home/hero-bubble-row';
import { cn } from '@/lib/utils';

/**
 * Placeholders for the hero's three client-loaded surfaces, each in exactly the final box, so the
 * hero settles in one layout instead of assembling itself. Change a height here and in the real
 * component together.
 */

/** Stand-in for the nearby-park pill row — same {@link HeroBubbleRow} box as the real one. */
export function HeroBubblesSkeleton({ className }: { className?: string }) {
  const widths = ['w-40', 'w-32', 'w-44', 'w-36', 'w-28'];
  return (
    <HeroBubbleRow className={className} aria-hidden="true">
      {widths.map((w) => (
        <Skeleton key={w} className={cn('h-9 shrink-0 rounded-full', w)} />
      ))}
    </HeroBubbleRow>
  );
}

/**
 * Stand-in for the world-map panel, through {@link GlassCard} rather than a copy of its classes,
 * so the surface cannot drift from the real panel's.
 */
export function HeroWorldPanelSkeleton() {
  return (
    // No fixed height: the real panel is as tall as its header, map and chips make it, so this
    // mirrors the same rows.
    <GlassCard
      variant="heavy"
      className="border-border/50 overflow-hidden rounded-2xl p-0 shadow-2xl"
      aria-hidden="true"
    >
      <div className="border-border/40 flex items-start justify-between gap-4 border-b px-5 py-4">
        {/* Real: `text-lg font-bold` over `text-xs` with `mt-0.5` — 28 + 2 + 16, not 20 + 8 + 12. */}
        <div className="space-y-0.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      {/* The real map is a full-width <svg> with viewBox "0 0 2000 857", so `aspect-[2000/857]`
          tracks its height at any width. No margins: the map sits flush in its tinted band. */}
      <div className="bg-muted/20 relative">
        <Skeleton className="aspect-[2000/857] w-full rounded-none" />
      </div>
      {/* Country chips: same padding, same pill height (`px-3 py-1.5 text-sm` + border = 34px)
          and enough of them to wrap to the same number of rows the default continent fills. */}
      <div className="flex flex-wrap gap-2 px-5 pt-4 pb-2">
        {[
          'w-32',
          'w-36',
          'w-44',
          'w-28',
          'w-32',
          'w-40',
          'w-28',
          'w-24',
          'w-32',
          'w-28',
          'w-24',
        ].map((w, i) => (
          <Skeleton key={i} className={cn('h-[34px] rounded-full', w)} />
        ))}
      </div>

      {/* "See all parks in <continent>" — its row is part of the panel's height too. */}
      <div className="px-5 pt-1 pb-4">
        <Skeleton className="h-6 w-48" />
      </div>
    </GlassCard>
  );
}
