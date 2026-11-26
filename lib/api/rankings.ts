import { cache } from 'react';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { CACHE_TTL } from '@/lib/api/cache-config';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import { currentRankingYear } from '@/lib/rankings/year';
import { getGeoStructure } from '@/lib/api/discovery';

/** One ride's place in a country's year ranking, as `/v1/rankings/attractions` answers it. */
export interface RankedAttraction {
  /** 1 = longest waits. Ordered by the unrounded P90; never re-sort by the rounded figures. */
  rank: number;
  attractionSlug: string;
  attractionName: string;
  /** Absent when no land is known (the API strips nulls). */
  land?: string;
  parkSlug: string;
  parkName: string;
  continentSlug: string;
  countrySlug: string;
  citySlug: string;
  /** Average of the year's hourly P50 waits, minutes, rounded to 5. */
  avgWaitP50: number;
  /** Average of the year's hourly P90 waits, minutes, rounded to 5: what the ranking orders by. */
  avgWaitP90: number;
  /** Park-local days with measured waits in the year. */
  sampleDays: number;
}

/** A country's year ranking and how far its window reaches. */
export interface AttractionRanking {
  attractions: RankedAttraction[];
  meta: {
    year: number;
    continentSlug: string;
    countrySlug?: string;
    /** True once every ranked park's window reached 31 December. */
    yearComplete: boolean;
    /** Last measured day, park-local; absent when nothing is ranked. */
    dataTo?: string;
    /** Measured days a ride needs in the year to be ranked. */
    minAttractionDays: number;
    parkCount: number;
    /** Rides ranked before the `limit`. */
    totalRanked: number;
    generatedAt: string;
  };
}

/**
 * Below this many ranked rides a ranking page stays out of the index and the sitemap: a "ranking"
 * of two rides is a stub a searcher should not land on. It still renders for the links to it.
 */
export const RANKING_MIN_INDEXED_RIDES = 5;

/** Rides the ranking page lists; the ride pages read their place from the same request. */
export const RANKING_PAGE_LIMIT = 50;

/**
 * A country's ranking of one year, data-cached like the park statistics (the API recomputes it once
 * a day). One request per country and year serves the ranking page and every ride page of that
 * country, which read their own place from it.
 *
 * `null` when the API has no such scope (404) or does not answer: a ride page then shows no place
 * and the ranking page answers 404 for the day, rather than an error page. The route exists only
 * since PAR-1442, so `null` is also the answer of an API that has not been deployed with it yet.
 */
export const getCountryAttractionRanking = cache(async function getCountryAttractionRanking(
  continent: string,
  country: string,
  year: number
): Promise<AttractionRanking | null> {
  const url = `${getApiBaseUrl()}/v1/rankings/attractions/${continent}/${country}?year=${year}&limit=${RANKING_PAGE_LIMIT}`;
  try {
    const res = await fetch(url, {
      headers: getServerApiHeaders(),
      next: { revalidate: CACHE_TTL.stats, tags: ['parks'] },
    });
    if (!res.ok) return null;
    return (await res.json()) as AttractionRanking;
  } catch {
    return null;
  }
});

/**
 * How long a page that only quotes the ranking (a ride's place, the country page's link) waits for
 * it. The first request of the day computes the country across all its parks in the API; that page
 * renders without the quote and `withSeedTimeout` lets the fetch fill the cache for the next one.
 */
const RANKING_SEED_TIMEOUT_MS = 3000;

/**
 * The ranking of {@link currentRankingYear} for a page that quotes it, bounded by
 * {@link RANKING_SEED_TIMEOUT_MS}. `null` on a timeout as on a missing ranking: the quote is
 * optional, the page is not.
 */
export function getCurrentRankingSeed(
  continent: string,
  country: string
): Promise<AttractionRanking | null> {
  return withSeedTimeout(
    getCountryAttractionRanking(continent, country, currentRankingYear()),
    RANKING_SEED_TIMEOUT_MS
  );
}

/** A ride's entry in its country's ranking, or `null` when it is not among the listed rides. */
export function findRankedAttraction(
  ranking: AttractionRanking | null,
  parkSlug: string,
  attractionSlug: string
): RankedAttraction | null {
  return (
    ranking?.attractions.find(
      (a) => a.parkSlug === parkSlug && a.attractionSlug === attractionSlug
    ) ?? null
  );
}

/** A country that has a ranking in a year, with its ranking. */
export interface RankedCountry {
  continent: string;
  country: string;
  ranking: AttractionRanking;
}

/**
 * Every country of the geo tree whose ranking of `year` lists at least `minRides` rides, in the
 * tree's order. One data-cached request per country, the requests the ranking pages read, so the
 * hub, the ranking pages' links to each other and the sitemap agree on which pages exist.
 */
export const getRankedCountries = cache(async function getRankedCountries(
  year: number,
  minRides = 1
): Promise<RankedCountry[]> {
  const geo = await getGeoStructure().catch(() => null);
  if (!geo) return [];
  const scopes = geo.continents.flatMap((continent) =>
    continent.countries.map((country) => ({ continent: continent.slug, country: country.slug }))
  );
  const rankings = await Promise.all(
    scopes.map((scope) => getCountryAttractionRanking(scope.continent, scope.country, year))
  );
  return scopes.flatMap((scope, i) => {
    const ranking = rankings[i];
    return ranking && ranking.attractions.length >= minRides ? [{ ...scope, ranking }] : [];
  });
});

/**
 * {@link getRankedCountries} for a page that only links the rankings, bounded like the quotes: on
 * a cold cache the page renders without the links rather than wait for every country.
 */
export function getRankedCountriesSeed(year: number): Promise<RankedCountry[] | null> {
  return withSeedTimeout(getRankedCountries(year), RANKING_SEED_TIMEOUT_MS);
}
