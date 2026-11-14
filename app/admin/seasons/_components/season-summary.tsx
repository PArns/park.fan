import { SeasonKindIcon } from '@/components/parks/season-kind-icon';
import { cn } from '@/lib/utils';
import { formatSeasonRange, seasonTitle } from '../../_lib/seasons';
import type { ParkSeason } from '../../_lib/types';

/**
 * A season in one line, wherever the admin names one beside something else: its kind's icon, its
 * name and its dates („Wintertraum · 20. Nov. – 18. Jan. 2027 · 12 Termine“). The ride list's
 * binding and the ride page's binding switches read it, so both say a season the same way.
 */
export function SeasonSummary({
  season,
  className,
}: {
  season: Pick<ParkSeason, 'kind' | 'startDate' | 'endDate'> & {
    name?: string | null;
    dates?: string[] | null;
  };
  className?: string;
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-1', className)}>
      <SeasonKindIcon kind={season.kind} />
      <span className="truncate">
        {[
          seasonTitle({ name: season.name ?? null, kind: season.kind }),
          formatSeasonRange(season.startDate, season.endDate),
          season.dates?.length ? `${season.dates.length} Termine` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </span>
  );
}
