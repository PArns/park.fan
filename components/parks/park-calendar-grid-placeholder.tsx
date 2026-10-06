import { Skeleton } from '@/components/ui/skeleton';

/**
 * The box the month grid stands in for both waits: the `ssr: false` chunk and the calendar fetch.
 * Its height comes from the `--cal-grid-h*` properties `ParkCalendarPanel` sets, so chunk pending,
 * data pending and drawn agree within the variance documented in
 * `lib/parks/calendar-grid-geometry.ts`.
 *
 * The steps ask the window, not `@container/page`: they follow the layout <ParkCalendarGrid> picks
 * with `matchMedia`, which a container query cannot reach.
 */
export function ParkCalendarGridPlaceholder() {
  return (
    <Skeleton className="h-[var(--cal-grid-h)] w-full rounded-xl md:h-[var(--cal-grid-h-md)] lg:h-[var(--cal-grid-h-lg)]" />
  );
}
