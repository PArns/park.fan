import { Ticket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { SeasonKindIcon, knownSeasonKind } from '@/components/parks/season-kind-icon';
import { cn } from '@/lib/utils';
import type { ParkSeason, ParkSeasonStatus } from '@/lib/api/types';

/** The badge colour of each season status, from settled green to a struck-through grey. */
export const SEASON_STATUS_TONE: Record<ParkSeasonStatus, string> = {
  confirmed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  announced: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  expected: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  cancelled: 'border-border/60 bg-muted/50 text-muted-foreground',
};

type SeasonWords = Pick<ParkSeason, 'kind' | 'name' | 'status'>;

/**
 * Names a season: its own brand name, else its kind's label. `withStatus` adds how settled it is
 * where that is not `confirmed`, for a label that stands without the status badge.
 */
export function useSeasonLabel(): (season: SeasonWords, withStatus?: boolean) => string {
  const t = useTranslations('parks.seasons');
  return (season, withStatus = false) => {
    const name = season.name?.trim() || t(`kind.${knownSeasonKind(season.kind)}`);
    return withStatus && season.status !== 'confirmed'
      ? `${name} (${t(`status.${season.status}`)})`
      : name;
  };
}

/**
 * One season's line: its kind's icon, its name (struck through when cancelled), how settled it is
 * and whether it needs its own ticket, with the price where one is known. The park's season card
 * and the calendar day's dialog both open a season with it; the dialog passes `hideConfirmed`,
 * since there only a season short of `confirmed` needs saying.
 */
export function SeasonHeadline({
  season,
  hideConfirmed = false,
  className,
}: {
  season: SeasonWords & Pick<ParkSeason, 'separateTicket' | 'priceFrom' | 'priceCurrency'>;
  hideConfirmed?: boolean;
  className?: string;
}) {
  const t = useTranslations('parks.seasons');
  const label = useSeasonLabel();

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <SeasonKindIcon kind={season.kind} className="size-4" />
      <span
        className={cn('font-medium', season.status === 'cancelled' && 'line-through opacity-70')}
      >
        {label(season)}
      </span>
      {!(hideConfirmed && season.status === 'confirmed') && (
        <Badge variant="outline" className={SEASON_STATUS_TONE[season.status]}>
          {t(`status.${season.status}`)}
        </Badge>
      )}
      {season.separateTicket && (
        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
          <Ticket className="h-3 w-3" aria-hidden="true" />
          {season.priceFrom
            ? t('fromPrice', {
                price: `${season.priceFrom} ${season.priceCurrency ?? ''}`.trim(),
              })
            : t('separateTicket')}
        </span>
      )}
    </div>
  );
}
