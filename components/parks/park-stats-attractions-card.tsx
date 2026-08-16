import { GlassCard } from '@/components/common/glass-card';
import { Clock } from 'lucide-react';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { TopAttractionStat } from '@/lib/api/types';

interface ParkStatsAttractionsCardProps {
  attractions: TopAttractionStat[];
  /**
   * Current standby wait per attraction slug, numeric entries only. A ride missing from it is
   * closed (or absent from the live payload) and renders a dash — see `ParkStatsSection` for
   * where it comes from and why an absent value is not the same as a zero.
   */
  currentWaits?: Map<string, number>;
  /**
   * Whether to render the live column at all. A park-level answer, decided by the section: an
   * open park keeps the column even when every ride in this table is still closed, so it does not
   * appear and disappear around opening time.
   */
  showCurrentWaits?: boolean;
  title: string;
  labelAttraction: string;
  labelNow: string;
  labelP50: string;
  labelP90: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/30',
  2: 'bg-zinc-400/20 text-zinc-400 ring-1 ring-zinc-400/30',
  3: 'bg-orange-600/20 text-orange-500 ring-1 ring-orange-500/30',
};

/** Numeric columns share one width so the three wait times line up as a column each. */
const VALUE_CELL = 'w-[4.5rem] py-1.5 pr-1 text-right tabular-nums';

/**
 * Top-ten ranking as a table: typical and peak wait side by side with what the ride is
 * showing right now, which is the comparison the historical numbers exist for.
 *
 * The narrow layout keeps only the peak column (rank · name · peak — exactly what it showed
 * before), because four numeric columns do not fit next to a ride name on a phone.
 */
export function ParkStatsAttractionsCard({
  attractions,
  currentWaits,
  showCurrentWaits = false,
  title,
  labelAttraction,
  labelNow,
  labelP50,
  labelP90,
  continent,
  country,
  city,
  parkSlug,
}: ParkStatsAttractionsCardProps) {
  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="text-primary h-4 w-4" aria-hidden="true" />
        {title}
      </h3>
      {/* border-separate: the collapsed default drops the rounded corners off the hovered row. */}
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-muted-foreground/60 text-xs font-medium">
            <th scope="col" className="w-8 pb-1 pl-2 text-left">
              <span className="sr-only">#</span>
            </th>
            <th scope="col" className="pb-1 text-left font-medium">
              {labelAttraction}
            </th>
            {showCurrentWaits && (
              <th scope="col" className={cn(VALUE_CELL, 'hidden pb-1 font-medium sm:table-cell')}>
                {labelNow}
              </th>
            )}
            <th scope="col" className={cn(VALUE_CELL, 'hidden pb-1 font-medium sm:table-cell')}>
              {labelP50}
            </th>
            <th scope="col" className={cn(VALUE_CELL, 'pr-2 pb-1 font-medium')}>
              {labelP90}
            </th>
          </tr>
        </thead>
        <tbody>
          {attractions.map((a) => {
            const rankStyle = RANK_STYLES[a.rank] ?? 'bg-muted/40 text-muted-foreground';
            const current = currentWaits?.get(a.attractionSlug);
            return (
              <tr
                key={a.attractionSlug}
                className="hover:bg-primary/5 transition-colors [&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg"
              >
                <td className="py-1.5 pl-2">
                  <span
                    className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                      rankStyle
                    )}
                  >
                    {a.rank}
                  </span>
                </td>
                {/* max-w-0 in an auto-layout `w-full` table: the cell shrinks to nothing so the
                  numeric columns get their width first, then absorbs what is left — which is
                  what gives `truncate` below something finite to truncate against. */}
                <td className="max-w-0 py-1.5 pr-3">
                  <Link
                    href={`/parks/${continent}/${country}/${city}/${parkSlug}/${a.attractionSlug}`}
                    prefetch={false}
                    className="hover:text-primary block truncate font-medium transition-colors"
                  >
                    {a.attractionName}
                  </Link>
                </td>
                {showCurrentWaits && (
                  <td className={cn(VALUE_CELL, 'hidden sm:table-cell')}>
                    {current == null ? (
                      <span className="text-muted-foreground/40">–</span>
                    ) : (
                      <>
                        <WaitTimeValue minutes={current} className="font-semibold" />
                        <span className="text-muted-foreground/60"> min</span>
                      </>
                    )}
                  </td>
                )}
                <td className={cn(VALUE_CELL, 'text-foreground/70 hidden sm:table-cell')}>
                  {a.avgWaitP50} min
                </td>
                <td className={cn(VALUE_CELL, 'text-foreground/70 pr-2')}>{a.avgWaitP90} min</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </GlassCard>
  );
}
