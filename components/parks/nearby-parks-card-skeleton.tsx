import { Skeleton } from '@/components/ui/skeleton';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { HOME_NEARBY_LIMIT } from '@/lib/hooks/use-nearby-parks';
import { cn } from '@/lib/utils';

/**
 * Placeholder that mirrors the NearbyParksCard "nearby parks" layout 1:1 — heading + subtitle +
 * the same responsive card grid, including the mobile collapse to 2 cards (`hidden md:block`).
 * Reusing this for the `next/dynamic` loading fallback AND the component's own not-yet-mounted /
 * loading state keeps every placeholder identical and reserves the real grid height, so the swap
 * to live parks doesn't shift layout (the previous `min-h-[200px]` box under-reserved by ~1000px
 * on mobile, where 6 skeleton cards collapsed to 2 real cards).
 */
export function NearbyParksCardSkeleton({ className }: { className?: string }) {
  return (
    <section className={className} aria-hidden="true">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </h2>
      {/* Subtitle line ("nearest open park: …") — present in the live layout, so reserve it. */}
      <Skeleton className="mb-8 h-4 w-64" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: HOME_NEARBY_LIMIT }).map((_, i) => (
          // Match the live grid's mobile collapse: only the first two cards show below md.
          <li key={i} className={cn(i >= 2 && 'hidden md:block')}>
            <ParkCardNearbySkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}
