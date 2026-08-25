'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import {
  useRideWaitStats,
  type RideWaitPark,
  type RideWaitTarget,
} from '@/lib/hooks/use-ride-wait-stats';

export interface RideWaitTableLabels {
  title: string;
  /** Header over the ride column. */
  ride: string;
  park: string;
  land: string;
  type: string;
  /** "Typisch (Median)" */
  typical: string;
  /** "Spitze (P90)" */
  peak: string;
  /** "Messtage" */
  sampleDays: string;
  /** Localized minutes unit, shared with the wait-time overview. */
  minutes: string;
}

interface RideWaitTableProps {
  parks: readonly RideWaitPark[];
  labels: RideWaitTableLabels;
  /**
   * `park` takes the top of one park's ranking, `rides` a hand-picked list that usually spans
   * parks. See {@link useRideWaitStats} for why they share one payload.
   */
  options: { mode: 'park'; limit: number } | { mode: 'rides'; targets: readonly RideWaitTarget[] };
  /**
   * Columns beyond ride + typical. Requested by the post rather than always on: a park table
   * arguing about lands wants `land`, a cross-park one wants `park`, and both on one table is
   * six columns next to a ride name.
   */
  columns?: ReadonlyArray<'park' | 'land' | 'type' | 'peak' | 'days'>;
}

const HEAD_CELL = 'px-2 py-1.5 text-xs font-medium text-muted-foreground/70';
const VALUE_CELL = 'px-2 py-1.5 text-right text-sm tabular-nums whitespace-nowrap';
/**
 * The ride column, in the two widths a table can want it.
 *
 * SOLE: the ride name is the table's only text column, so it takes the slack the numbers do not
 * need. `w-full` asks for all of it, `max-w-0` lets it give any back, and `truncate` then has a
 * finite box to act on. Both classes are load-bearing — with `max-w-0` alone, `table-layout: auto`
 * splits the slack between every column in proportion, and at 1024 px "De Vliegende Hollander" was
 * clipped to "De Vliegende Holl…" while 400 px sat empty between the number columns.
 *
 * SHARED: a park or type column is beside it, so it must NOT claim the slack. When it did, it won
 * all of it and the neighbours collapsed onto their own width: "Multi-Launch, Stahl" wrapped onto
 * three lines in a 90 px column while 500 px sat empty under the ride names. Auto layout already
 * shares width between text columns sensibly; the job here is only to stay out of its way.
 */
const NAME_CELL_SOLE = 'w-full max-w-0 px-2 py-1.5 text-sm';
const NAME_CELL_SHARED = 'px-2 py-1.5 text-sm';

/** Park / land / type: sized by their content, never clipped. See above. */
const TEXT_CELL = 'hidden px-2 py-1.5 text-sm sm:table-cell';

const DEFAULT_COLUMNS = ['peak'] as const;

/**
 * The wait-time table a blog post used to type out by hand.
 *
 * Four posts across six locales carried twenty-two of these — ride, park, land, typical, peak,
 * measured days — as markdown, keyed off a spreadsheet at the time of writing. Nothing brought
 * them forward: the Efteling table said 34 minutes for Joris en de Draak while the same figure
 * on the park page had moved to 35, and the two Toverland tables in one post disagreed with each
 * other by a minute because they were written a week apart.
 *
 * Rows are NOT re-sorted in `rides` mode — see the hook. In `park` mode the order IS the data's,
 * because that table's whole claim is the ranking.
 *
 * Columns beyond the median are opt-in, because these tables sit inside running text: a post
 * arguing about queue length wants two numbers and a name, not the full aggregate.
 */
export function RideWaitTable({ parks, labels, options, columns }: RideWaitTableProps) {
  const cols = new Set(columns ?? DEFAULT_COLUMNS);
  const { rows, isPending, hasLand, hasType } = useRideWaitStats(parks, options);

  // A column the data cannot fill is not rendered at all. Queue-Times publishes no land for whole
  // parks, and a post asking for one there would otherwise get a header over six dashes.
  const showLand = cols.has('land') && hasLand;
  const showType = cols.has('type') && hasType;
  const showPark = cols.has('park');
  const showPeak = cols.has('peak');
  const showDays = cols.has('days');

  // Which of the two ride-column widths applies — see NAME_CELL_SOLE / NAME_CELL_SHARED.
  const nameCell = showPark || showLand || showType ? NAME_CELL_SHARED : NAME_CELL_SOLE;
  const nameLink = showPark || showLand || showType ? '' : 'block truncate';

  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="text-primary h-4 w-4" aria-hidden="true" />
        {labels.title}
      </h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-border/40 border-b">
            <th scope="col" className={cn(HEAD_CELL, 'text-left')}>
              {labels.ride}
            </th>
            {showPark && (
              <th scope="col" className={cn(HEAD_CELL, 'hidden text-left sm:table-cell')}>
                {labels.park}
              </th>
            )}
            {showLand && (
              <th scope="col" className={cn(HEAD_CELL, 'hidden text-left sm:table-cell')}>
                {labels.land}
              </th>
            )}
            {showType && (
              <th scope="col" className={cn(HEAD_CELL, 'hidden text-left sm:table-cell')}>
                {labels.type}
              </th>
            )}
            <th scope="col" className={cn(HEAD_CELL, 'text-right')}>
              {labels.typical}
            </th>
            {showPeak && (
              <th scope="col" className={cn(HEAD_CELL, 'text-right')}>
                {labels.peak}
              </th>
            )}
            {showDays && (
              <th scope="col" className={cn(HEAD_CELL, 'hidden text-right sm:table-cell')}>
                {labels.sampleDays}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {/* Before the first payload there are no rows at all, so the skeleton needs its own
              rows or the card collapses to a header and then grows by the height of the table
              once the fetch lands. The count is the one the caller asked for. */}
          {rows.length === 0 && isPending
            ? Array.from({
                length: options.mode === 'park' ? options.limit : options.targets.length,
              }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td className={nameCell}>
                    <Skeleton className="h-4 w-32" />
                  </td>
                  {showPark && (
                    <td className="hidden px-2 py-1.5 sm:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  )}
                  {showLand && (
                    <td className="hidden px-2 py-1.5 sm:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  )}
                  {showType && (
                    <td className="hidden px-2 py-1.5 sm:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  )}
                  <td className={VALUE_CELL}>
                    <Skeleton className="ml-auto h-4 w-12" />
                  </td>
                  {showPeak && (
                    <td className={VALUE_CELL}>
                      <Skeleton className="ml-auto h-4 w-12" />
                    </td>
                  )}
                  {showDays && (
                    <td className={cn(VALUE_CELL, 'hidden sm:table-cell')}>
                      <Skeleton className="ml-auto h-4 w-8" />
                    </td>
                  )}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={row.key} className="hover:bg-primary/5 transition-colors">
                  <td className={nameCell}>
                    <Link
                      href={row.href}
                      prefetch={false}
                      className={cn(
                        'hover:text-primary transition-colors',
                        nameLink,
                        row.highlight ? 'text-foreground font-semibold' : 'font-medium'
                      )}
                    >
                      {row.name}
                    </Link>
                  </td>
                  {showPark && (
                    <td className={cn(TEXT_CELL, 'text-muted-foreground/80 whitespace-nowrap')}>
                      <Link
                        href={row.parkHref}
                        prefetch={false}
                        className="hover:text-primary transition-colors"
                      >
                        {row.parkName}
                      </Link>
                    </td>
                  )}
                  {showLand && (
                    <td className={cn(TEXT_CELL, 'text-muted-foreground/70 whitespace-nowrap')}>
                      {row.land ?? <span className="text-muted-foreground/40">–</span>}
                    </td>
                  )}
                  {showType && (
                    // The one text column allowed to wrap: "Multi-Launch, Stahl" breaks at its
                    // own comma, which costs a line on a narrow table and beats "Mult…".
                    <td className={cn(TEXT_CELL, 'text-muted-foreground/70')}>
                      {row.type ?? <span className="text-muted-foreground/40">–</span>}
                    </td>
                  )}
                  <td
                    className={cn(
                      VALUE_CELL,
                      row.highlight ? 'font-semibold' : 'text-foreground/70'
                    )}
                  >
                    {/* Still loading and settled-but-unreadable must not look alike: one is a
                        placeholder of the row's own height, the other an em dash. */}
                    {isPending && row.p50 == null ? (
                      <Skeleton className="ml-auto h-4 w-12" />
                    ) : row.p50 == null ? (
                      <span className="text-muted-foreground/40">–</span>
                    ) : (
                      <>
                        {/* Percentiles interpolate; an API build that has not rounded
                            hands back 51. The park page's ranking card renders the same
                            two fields through the same helper. */}
                        {roundWaitTo5(row.p50)} {labels.minutes}
                      </>
                    )}
                  </td>
                  {showPeak && (
                    <td className={cn(VALUE_CELL, 'text-muted-foreground/70')}>
                      {isPending && row.p90 == null ? (
                        <Skeleton className="ml-auto h-4 w-12" />
                      ) : row.p90 == null ? (
                        <span className="text-muted-foreground/40">–</span>
                      ) : (
                        <>
                          {roundWaitTo5(row.p90)} {labels.minutes}
                        </>
                      )}
                    </td>
                  )}
                  {showDays && (
                    <td className={cn(VALUE_CELL, 'text-muted-foreground/50 hidden sm:table-cell')}>
                      {isPending && row.sampleDays == null ? (
                        <Skeleton className="ml-auto h-4 w-8" />
                      ) : (
                        (row.sampleDays ?? '–')
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
