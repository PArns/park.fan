import { getGeoStructure } from './discovery';
import { getParkWeatherNowcast } from './weather-nowcast';

/**
 * "Hottest parks" aggregation for the homepage heat banner.
 *
 * Weather is not part of the geo structure and there is no bulk endpoint, so we
 * derive a bounded candidate set from the geo tree (the biggest operating parks in
 * the target countries) and fetch each candidate's cached nowcast in parallel. The
 * per-park nowcast is cached 1h, so across the homepage's 5-min shell regenerations
 * these are almost all cache hits — and shared across all locales (temperature is
 * language-independent).
 *
 * If/when the backend grows a `/v1/weather/hottest` endpoint, this whole module can
 * be replaced by a single fetch without touching the section component.
 */

/** ISO 3166-1 alpha-2 codes of the countries the heat banner covers: DE, FR, IT, NL, BE. */
const HOT_COUNTRY_CODES = new Set(['DE', 'FR', 'IT', 'NL', 'BE']);

/**
 * Parks to keep out of the ranking (e.g. water parks — a heat headline pointing at
 * Rulantica, an indoor/outdoor water world, is off-message). Matched against both the
 * slug and the display name (lowercased substring) so a differing slug still excludes it.
 */
const EXCLUDED_TERMS = ['rulantica'];

function isExcludedPark(slug: string, name: string): boolean {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  return EXCLUDED_TERMS.some((term) => s === term || n.includes(term));
}

/** Cap candidates per country (biggest parks by attraction count) to bound weather lookups. */
const MAX_CANDIDATES_PER_COUNTRY = 8;

export interface HottestPark {
  name: string;
  slug: string;
  /** Frontend park URL, e.g. /parks/europe/germany/rust/europa-park */
  href: string;
  city: string;
  /** Country slug (for `geo.countries.*` translation) and raw name fallback. */
  countrySlug: string;
  countryName: string;
  /** Today's max temperature in °C — the ranking metric. */
  temperatureMaxC: number;
  temperatureMinC: number | null;
  currentTempC: number | null;
  weatherCode: number | null;
}

interface Candidate {
  continentSlug: string;
  countrySlug: string;
  countryName: string;
  citySlug: string;
  cityName: string;
  parkSlug: string;
  parkName: string;
  attractionCount: number;
}

/**
 * Top `limit` parks in DE/FR/IT/NL/BE whose today's max temperature is at or above
 * `minTempC`, sorted hottest-first. Returns `[]` when none qualify — the section then
 * renders nothing (the data-driven "expiry").
 */
export async function getHottestParks(minTempC: number, limit: number): Promise<HottestPark[]> {
  const geo = await getGeoStructure().catch(() => null);
  if (!geo) return [];

  // Collect the biggest operating parks per target country.
  const candidates: Candidate[] = [];
  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      if (!HOT_COUNTRY_CODES.has(country.code?.toUpperCase())) continue;

      const countryParks: Candidate[] = [];
      for (const city of country.cities) {
        for (const park of city.parks) {
          // Only parks actually OPERATING today — excludes off-season parks and
          // seasonal-event venues (e.g. Traumatica) that have a schedule but are
          // closed right now. A heat headline should point at places open today.
          if (park.todaySchedule?.scheduleType !== 'OPERATING') continue;
          if (isExcludedPark(park.slug, park.name)) continue;
          countryParks.push({
            continentSlug: continent.slug,
            countrySlug: country.slug,
            countryName: country.name,
            citySlug: city.slug,
            cityName: city.name,
            parkSlug: park.slug,
            parkName: park.name,
            attractionCount: park.attractionCount ?? 0,
          });
        }
      }
      // Biggest parks first (attraction count as a "major park" proxy), then cap.
      countryParks.sort((a, b) => b.attractionCount - a.attractionCount);
      candidates.push(...countryParks.slice(0, MAX_CANDIDATES_PER_COUNTRY));
    }
  }

  // Fetch each candidate's cached nowcast in parallel; failures drop to null.
  const weather = await Promise.all(
    candidates.map((c) =>
      getParkWeatherNowcast(c.continentSlug, c.countrySlug, c.citySlug, c.parkSlug).catch(
        () => null
      )
    )
  );

  const hot: HottestPark[] = [];
  candidates.forEach((c, i) => {
    const w = weather[i];
    if (!w) return;
    // Rank by today's max; fall back to the live temperature when max is missing.
    const maxC = w.temperatureMaxC ?? w.currentTemperatureC;
    if (maxC == null || maxC < minTempC) return;
    hot.push({
      name: c.parkName,
      slug: c.parkSlug,
      href: `/parks/${c.continentSlug}/${c.countrySlug}/${c.citySlug}/${c.parkSlug}`,
      city: c.cityName,
      countrySlug: c.countrySlug,
      countryName: c.countryName,
      temperatureMaxC: maxC,
      temperatureMinC: w.temperatureMinC,
      currentTempC: w.currentTemperatureC,
      weatherCode: w.currentWeatherCode,
    });
  });

  hot.sort((a, b) => b.temperatureMaxC - a.temperatureMaxC);
  return hot.slice(0, limit);
}
