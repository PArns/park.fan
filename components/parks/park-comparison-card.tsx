'use client';

import Link from 'next/link';
import { Scale } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useParkComparisonStats, type ComparisonPark } from '@/lib/hooks/use-park-comparison-stats';

interface ParkComparisonCardProps {
  parks: readonly ComparisonPark[];
  title: string;
  labelPark: string;
  labelParkAverage: string;
  labelLongest: string;
  labelMinutes: string;
  /**
   * Header for the quietest-weekday column. Omit it and the column is not rendered at all — a
   * post that argues about queue lengths does not want a weekday column in the middle of it.
   */
  labelQuietestDay?: string;
  /** Localised weekday names, Sunday first, matching `DayOfWeekStat.dayOfWeek` (0–6). */
  weekdayNames?: readonly string[];
}

const HEAD_CELL = 'px-2 py-1.5 text-xs font-medium text-muted-foreground/70';
const VALUE_CELL = 'px-2 py-1.5 text-right text-sm tabular-nums whitespace-nowrap';

/**
 * The park name is never the cell that gives way.
 *
 * `table-layout: auto` hands space to the widest unbreakable content, and the longest-queue cell
 * holds things like "34 Min. · Voltron Nevera powered by Rimac" — 39 unbreakable characters. With
 * `max-w-0` on the park column it was the park column that collapsed instead, so the six featured
 * parks on the best-time hub read "Europa-P…", "Phantasia…", "Disneylan…". The name is the row's
 * subject and its identity; a ride name is a detail of one column, so the shrinking belongs there.
 *
 * `max-w-0 w-full` (below) is what makes the longest-queue cell the flexible one: `w-full` asks
 * for everything left over, `max-w-0` lets it give all of it back, and the `truncate` inside then
 * has a box narrow enough to act on. Without the `max-w-0` the ride name never truncates at all —
 * it just widens the table until the page scrolls sideways.
 */
const PARK_CELL = 'px-2 py-1.5 text-sm whitespace-nowrap';

/**
 * Cross-park median comparison, fetched live instead of typed into the post by hand.
 *
 * Rows arrive in the order the post lists them and are NOT re-sorted: the argument a post builds
 * around this table ("a third of the crowd, nine minutes longer") depends on the sequence its
 * author chose, and a table that reorders itself when a median moves by one minute would silently
 * break the sentence underneath it.
 */
export function ParkComparisonCard({
  parks,
  title,
  labelPark,
  labelParkAverage,
  labelLongest,
  labelMinutes,
  labelQuietestDay,
  weekdayNames,
}: ParkComparisonCardProps) {
  const showQuietest = Boolean(labelQuietestDay && weekdayNames?.length === 7);
  const { rows, isPending } = useParkComparisonStats(parks);

  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Scale className="text-primary h-4 w-4" aria-hidden="true" />
        {title}
      </h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-border/40 border-b">
            <th scope="col" className={cn(HEAD_CELL, 'text-left')}>
              {labelPark}
            </th>
            <th scope="col" className={cn(HEAD_CELL, 'text-right')}>
              {labelParkAverage}
            </th>
            <th scope="col" className={cn(HEAD_CELL, 'hidden text-right sm:table-cell')}>
              {labelLongest}
            </th>
            {showQuietest && (
              <th scope="col" className={cn(HEAD_CELL, 'text-right')}>
                {labelQuietestDay}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug} className="hover:bg-primary/5 transition-colors">
              <td className={PARK_CELL}>
                <Link
                  href={row.href}
                  prefetch={false}
                  className={cn(
                    'hover:text-primary transition-colors',
                    row.highlight ? 'text-foreground font-semibold' : 'font-medium'
                  )}
                >
                  {row.name}
                </Link>
              </td>
              <td
                className={cn(VALUE_CELL, row.highlight ? 'font-semibold' : 'text-foreground/70')}
              >
                {/* A pending row shows a placeholder of the same height; a settled-but-empty one
                    shows an em dash, because "we have no readable data" and "still loading" must
                    not look alike. */}
                {isPending && row.parkP50 == null ? (
                  <Skeleton className="ml-auto h-4 w-12" />
                ) : row.parkP50 == null ? (
                  <span className="text-muted-foreground/40">–</span>
                ) : (
                  <>
                    {row.parkP50} {labelMinutes}
                  </>
                )}
              </td>
              <td
                className={cn(
                  VALUE_CELL,
                  'text-muted-foreground/70 hidden w-full max-w-0 sm:table-cell'
                )}
              >
                {isPending && row.longestP50 == null ? (
                  <Skeleton className="ml-auto h-4 w-28" />
                ) : row.longestP50 == null ? (
                  <span className="text-muted-foreground/40">–</span>
                ) : (
                  // The minutes never shrink and the ride name always may: "34 Min." is the
                  // number the column is named after, the ride is which queue it was.
                  <span className="flex items-baseline justify-end gap-1">
                    <span className="shrink-0">
                      {row.longestP50} {labelMinutes}
                    </span>
                    <span className="text-muted-foreground/50 truncate">· {row.longestName}</span>
                  </span>
                )}
              </td>
              {showQuietest && (
                <td className={cn(VALUE_CELL, 'text-foreground/70')}>
                  {isPending && row.quietestP50 == null ? (
                    <Skeleton className="ml-auto h-4 w-20" />
                  ) : row.quietestDays.length === 0 || row.quietestP50 == null ? (
                    /* Not "no data" but "the data does not support naming a day" — too few evenly
                       measured weekdays, or a week flat enough that three of them share its
                       minimum. The em dash says so without a footnote. */
                    <span className="text-muted-foreground/40">–</span>
                  ) : (
                    <>
                      {/* Two days at the same minute is a finding, not a failure to choose — the
                          list is joined rather than resolved to one. `·` already separates the day
                          from the wait, so the days join on a comma. */}
                      <span className="text-status-operating">
                        {row.quietestDays.map((d) => weekdayNames![d]).join(', ')}
                      </span>
                      <span className="text-muted-foreground/50">
                        {' '}
                        · {row.quietestP50} {labelMinutes}
                      </span>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
