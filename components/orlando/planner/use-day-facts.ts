'use client';

import { useTranslations } from 'next-intl';
import { partySeason } from '@/lib/orlando/plan-week';
import type { PlanDay } from '@/lib/orlando/plan';
import type { TripCalendar, TripSeason } from '@/lib/orlando/types';

/**
 * A season's name as a visitor reads it: the park's own brand name, never translated, or the
 * label of its kind where nobody curated one (`parks.seasons.kind`, the park page's own labels).
 */
export function useSeasonName(): (season: Pick<TripSeason, 'name' | 'kind'>) => string {
  const t = useTranslations('parks.seasons.kind');
  return (season) => season.name ?? t(season.kind);
}

/**
 * The name of a park day's party night ("Mickey's Very Merry Christmas Party"), for the hatched
 * evening of the Week view and the day sheet; `null` where the day's last park has none.
 */
export function usePartyName(
  calendar: TripCalendar | undefined,
  day: PlanDay | undefined
): string | null {
  const name = useSeasonName();
  const last = day?.parks.at(-1);
  if (!day || !last) return null;
  const season = partySeason(calendar, last.slug, day.date);
  return season ? name(season) : null;
}
