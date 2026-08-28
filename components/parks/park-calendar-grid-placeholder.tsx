import { Skeleton } from '@/components/ui/skeleton';

/**
 * The box the month grid stands in before it can draw itself.
 *
 * There are TWO waits in a row here, and until this component existed they disagreed about how
 * tall the grid would be. First `next/dynamic` shows its `loading` while the `ssr: false` chunk
 * downloads; then the chunk mounts and `useCalendarData` is still fetching, so the grid renders a
 * loading state of its own. Sampled at 1280 px on a throttled connection, one park, one month:
 *
 * ```
 *   1000 ms   898 px   dynamic loading  (the reservation)
 *   2500 ms   758 px   grid mounted, own skeleton — a hand-built 5×7 of h-32 cells
 *   4000 ms   829 px   grid drawn
 * ```
 *
 * So the page reserved the right box, then **collapsed 140 px** the moment the chunk arrived and
 * pushed back out 71 px when the data did — two shifts where the whole point of the reservation
 * was to have none. The second placeholder was built from a fixed five weeks of fixed-height
 * cells and could not know the month.
 *
 * One component for both waits fixes it by construction. The height comes from the same
 * `--cal-grid-h*` custom properties `ParkCalendarPanel` sets on the wrapper, so all three states
 * — chunk pending, data pending, drawn — agree to within the content variance documented in
 * `calendar-grid-geometry.ts`.
 */
export function ParkCalendarGridPlaceholder() {
  return (
    <Skeleton className="h-[var(--cal-grid-h)] w-full rounded-xl md:h-[var(--cal-grid-h-md)] lg:h-[var(--cal-grid-h-lg)]" />
  );
}
