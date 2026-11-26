import { getTranslations } from 'next-intl/server';
import { findRankedAttraction, getCurrentRankingSeed } from '@/lib/api/rankings';
import { rankingPath } from '@/lib/rankings/segments';
import { translateCountry } from '@/lib/i18n/helpers';

/**
 * Down to which place a ride page names its place in the country's ranking. „Platz 3 in
 * Deutschland" tells a reader something about the ride; „Platz 47" tells them about the list.
 */
export const RIDE_RANK_SHOWN = 10;

/** A ride's place as its page quotes it, with the words and the link already resolved. */
export interface RideRank {
  rank: number;
  /** The ranking's year, as a string so ICU does not print „2.026". */
  year: string;
  /** The country's name in the reader's language. */
  country: string;
  /** Locale-relative path to the ranking page. */
  href: string;
}

/**
 * The ride's place in its country's current ranking, or `null` below {@link RIDE_RANK_SHOWN}, when
 * the ranking is not there yet (the seed timed out, or the API has no such route) or the ride is
 * not ranked. Shared by the ride page's metadata and its data card, which read one cached request.
 */
export async function getRideRank(
  locale: string,
  continent: string,
  country: string,
  parkSlug: string,
  attractionSlug: string
): Promise<RideRank | null> {
  const ranking = await getCurrentRankingSeed(continent, country);
  const ranked = findRankedAttraction(ranking, parkSlug, attractionSlug);
  if (!ranking || !ranked || ranked.rank > RIDE_RANK_SHOWN) return null;
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  return {
    rank: ranked.rank,
    year: String(ranking.meta.year),
    country: translateCountry(tGeo, country, locale),
    href: rankingPath(locale, continent, country, ranking.meta.year),
  };
}
