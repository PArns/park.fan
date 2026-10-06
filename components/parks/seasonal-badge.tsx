import { Snowflake, Sun, Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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
  className?: string;
}

/**
 * Badge for a seasonal ride or show: "Winter", "Summer" or "Seasonal" in season, and "Winter only",
 * "Summer only" or "Off-season", dimmed, out of it.
 */
export function SeasonalBadge({
  seasonMonths,
  isCurrentlyInSeason,
  className,
}: SeasonalBadgeProps) {
  const t = useTranslations('parks');
  const season = getSeasonLabel(seasonMonths ?? null);
  const offSeason = isCurrentlyInSeason === false;

  const Icon = season === 'winter' ? Snowflake : season === 'summer' ? Sun : Leaf;

  // What the badge says depends on whether the ride is running. Out of season the season name alone
  // did not connect to the card's „Geschlossen", so it says both halves: „Nur im Winter".
  const label = offSeason
    ? season === 'winter'
      ? t('seasonalWinterOnly')
      : season === 'summer'
        ? t('seasonalSummerOnly')
        : t('seasonalOffSeason')
    : season === 'winter'
      ? t('seasonalWinter')
      : season === 'summer'
        ? t('seasonalSummer')
        : t('seasonal');

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
      <Icon className="h-3 w-3 text-inherit" />
      {label}
    </Badge>
  );
}
