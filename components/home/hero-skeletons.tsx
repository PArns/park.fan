import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/common/glass-card';
import { HeroBubbleRow } from '@/components/home/hero-bubble-row';
import { cn } from '@/lib/utils';

/**
 * Placeholders for the hero's three client-loaded surfaces.
 *
 * They exist for one reason: everything live in the hero (open-park count, nearby pills, the
 * world panel) resolves at its own pace after load, and rendering nothing until each one lands
 * made the hero assemble itself piece by piece in front of the visitor. A skeleton in **exactly
 * the final box** replaces that with one settled layout — and, because the box never changes
 * size, contributes nothing to CLS.
 *
 * So: if you change a height here, change it in the real component too.
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
 * Stand-in for the world-map panel (same 540px box, same surface).
 *
 * Through {@link GlassCard}, not a copy of its classes: the first version hand-rolled the glass
 * and had already drifted from the real panel's light-mode opacity, so the swap popped.
 */
export function HeroWorldPanelSkeleton() {
  return (
    <GlassCard
      variant="heavy"
      className="border-border/50 h-[540px] overflow-hidden rounded-2xl p-0 shadow-2xl"
      aria-hidden="true"
    >
      <div className="border-border/40 flex items-start justify-between gap-4 border-b px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      {/* The real map is a full-width <svg> with viewBox "0 0 2000 857", so its height is
          the panel width over that ratio — not a fixed number. A `h-[232px]` box happened to
          match one viewport width and was wrong at every other, which moved the country chips
          under it when the map mounted. `aspect-[2000/857]` tracks the svg at any width; the
          margins go too, because the real map sits flush in its own tinted band. */}
      <div className="bg-muted/20 mt-6">
        <Skeleton className="aspect-[2000/857] w-full rounded-none" />
      </div>
      <div className="flex flex-wrap gap-2 px-5 pt-5">
        {['w-32', 'w-36', 'w-44', 'w-28', 'w-24'].map((w) => (
          <Skeleton key={w} className={cn('h-8 rounded-full', w)} />
        ))}
      </div>
    </GlassCard>
  );
}
