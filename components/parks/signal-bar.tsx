import { cn } from '@/lib/utils';

/** One segment of a {@link SignalBar}: a signal's key and its colour class. */
export interface SignalSegment {
  key: string;
  className: string;
}

/**
 * A day's signals as one bar, a segment each (school break, public holiday, a region's storm
 * season, …), so a day shows all of them at once in the colours `DAY_SIGNAL_CLASS` and
 * `STORM_SIGNAL_CLASS` give. The crowd tile draws it along its top edge, the trip hub under each
 * date, so the same yellow means a school break in both calendars. Decoration: the tile's and the
 * date's names say what it marks. Without a segment it keeps its height and draws nothing, so a row
 * of dates stays level.
 */
export function SignalBar({
  segments,
  className,
}: {
  segments: readonly SignalSegment[];
  className?: string;
}) {
  return (
    <span aria-hidden className={cn('pointer-events-none flex h-[3px]', className)}>
      {segments.map((s) => (
        <span key={s.key} className={cn('h-full flex-1', s.className)} />
      ))}
    </span>
  );
}
