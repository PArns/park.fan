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
              <td className="max-w-0 px-2 py-1.5 text-sm">
                <Link
                  href={row.href}
                  prefetch={false}
                  className={cn(
                    'hover:text-primary block truncate transition-colors',
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
              <td className={cn(VALUE_CELL, 'text-muted-foreground/70 hidden sm:table-cell')}>
                {isPending && row.longestP50 == null ? (
                  <Skeleton className="ml-auto h-4 w-28" />
                ) : row.longestP50 == null ? (
                  <span className="text-muted-foreground/40">–</span>
                ) : (
                  <>
                    {row.longestP50} {labelMinutes}
                    <span className="text-muted-foreground/50"> · {row.longestName}</span>
                  </>
                )}
              </td>
              {showQuietest && (
                <td className={cn(VALUE_CELL, 'text-foreground/70')}>
                  {isPending && row.quietestP50 == null ? (
                    <Skeleton className="ml-auto h-4 w-20" />
                  ) : row.quietestDay == null || row.quietestP50 == null ? (
                    /* Not "no data" but "the data does not support naming a day" — an unevenly
                       measured week, a tie, or a flat one. The em dash says so without a footnote. */
                    <span className="text-muted-foreground/40">–</span>
                  ) : (
                    <>
                      <span className="text-status-operating">
                        {weekdayNames![row.quietestDay]}
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
