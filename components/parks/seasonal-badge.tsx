import { Snowflake, Sun, Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SeasonKindIcon } from '@/components/parks/season-kind-icon';
import { useSeasonLabel } from '@/components/parks/season-headline';
import { formatSeasonRange, seasonRunsOn } from '@/lib/parks/park-season-days';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import type { BoundSeason } from '@/lib/api/types';

/**
 * Returns `winter` when every season month lies in November to February, `summer` when every one
 * lies in May to September, otherwise `null`.
 */
export function getSeasonLabel(months: number[] | null): 'winter' | 'summer' | null {
  if (!months) return null;
  const winter = [11, 12, 1, 2];
  const summer = [5, 6, 7, 8, 9];
  if (months.every((m) => winter.includes(m))) return 'winter';
  if (months.every((m) => summer.includes(m))) return 'summer';
  return null;
}

interface SeasonalBadgeProps {
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
  /** The park season the ride is bound to. Its name and days replace what the months would say. */
  boundSeason?: BoundSeason;
  /**
   * The park season the ride closes for. It names the next or the last one too, so only its days
   * around `todayIso` (the park's today) say the ride is paused; outside them it says nothing.
   */
  pausedBySeason?: BoundSeason;
  todayIso?: string | null;
  className?: string;
}

/**
 * Badge for a seasonal ride or show: "Winter", "Summer" or "Seasonal" in season, and "Winter only",
 * "Summer only" or "Off-season", dimmed, out of it. A ride bound to a park season names that season
 * with its kind's icon instead, and out of it says „Nur während Wintertraum" with the season's dates.
 * A ride a season pauses says „Pausiert während Wintertraum" with its dates on the season's days,
 * and nothing on the others, so its caller renders it for `pausedBySeason` as well as `isSeasonal`.
 */
export function SeasonalBadge({
  seasonMonths,
  isCurrentlyInSeason,
  boundSeason,
  pausedBySeason,
  todayIso,
  className,
}: SeasonalBadgeProps) {
  const t = useTranslations('parks.seasonal');
  const locale = useLocale();
  const seasonLabel = useSeasonLabel();
  const pausing =
    pausedBySeason && todayIso && seasonRunsOn(pausedBySeason, todayIso) ? pausedBySeason : null;
  if (pausedBySeason && !pausing && !boundSeason) return null;
  const season = boundSeason || pausing ? null : getSeasonLabel(seasonMonths ?? null);
  const offSeason = pausing !== null || isCurrentlyInSeason === false;

  const Icon = season === 'winter' ? Snowflake : season === 'summer' ? Sun : Leaf;

  // The season the badge names: the one pausing the ride today, else the one it runs in.
  const named = pausing ?? boundSeason;
  const bound = named && { ...named, name: named.name ?? null };
  const during = (key: 'pausedDuring' | 'onlyDuring', of: NonNullable<typeof bound>) =>
    [
      t(key, { season: seasonLabel(of, true) }),
      formatSeasonRange(locale, of.startDate, of.endDate),
    ].join(' · ');
  // What the badge says depends on whether the ride is running. Out of season the season name alone
  // did not connect to the card's „Geschlossen", so it says both halves: „Nur im Winter".
  const label = bound
    ? pausing
      ? during('pausedDuring', bound)
      : offSeason
        ? during('onlyDuring', bound)
        : seasonLabel(bound)
    : offSeason
      ? season === 'winter'
        ? t('winterOnly')
        : season === 'summer'
          ? t('summerOnly')
          : t('offSeason')
      : season === 'winter'
        ? t('winter')
        : season === 'summer'
          ? t('summer')
          : t('label');

  return (
    <Badge
      className={cn(
        'font-semibold backdrop-blur-md',
        // Dimmed, not faded out: this is the one badge on an off-season card
        // that is worth reading, and opacity-50 on top of a frosted panel took
        // it below the surrounding body text.
        offSeason && 'opacity-75',
        season === 'winter' &&
          'border border-sky-500/30 bg-sky-500/15 text-sky-400 dark:text-sky-300',
        season === 'summer' &&
          'border border-amber-500/30 bg-amber-500/15 text-amber-500 dark:text-amber-300',
        !season &&
          'border border-violet-500/30 bg-violet-500/15 text-violet-500 dark:text-violet-300',
        className
      )}
    >
      {bound ? (
        <SeasonKindIcon kind={bound.kind} className="h-3 w-3 text-inherit dark:text-inherit" />
      ) : (
        <Icon className="h-3 w-3 text-inherit" />
      )}
      {label}
    </Badge>
  );
}
