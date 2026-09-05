import { Skeleton } from '@/components/ui/skeleton';

/**
 * The box the ride's history calendar stands in until its data lands.
 *
 * Its height comes from the same `--ride-cal-h*` custom properties `AttractionHistoryPanel` sets
 * on the wrapper, so the wait and the grid reserve one box by construction rather than by two
 * sets of numbers agreeing — see `attraction-history-geometry.ts` for the arithmetic and why the
 * row count is the part a server can know.
 */
export function AttractionHistoryGridPlaceholder() {
  return (
    <Skeleton className="h-full min-h-[var(--ride-cal-h)] w-full rounded-xl @min-[1024px]/page:min-h-[var(--ride-cal-h-lg)]" />
  );
}
