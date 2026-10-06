import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import type { GeoStructure } from '@/lib/api/types';

/**
 * Featured parks per locale, ordered by wait-time search relevance for each language market (TEA
 * Global Experience Index and European attendance rankings). 'disneyland-park' resolves to Paris,
 * because Europe is traversed before North America.
 */
const FEATURED_PARK_SLUGS: Record<string, string[]> = {
  de: [
    'europa-park', // 6M visitors, #1 DACH by far
    'phantasialand', // 2M, #2 Germany
    'heide-park', // 1.4M, #3 Germany
    'movie-park-germany', // #4 Germany
    'efteling', // 5.6M, hugely popular with Germans (close to NRW border)
    'disneyland-park', // Paris — "Disneyland Paris Wartezeiten" is high-volume DE query
  ],
  en: [
    'magic-kingdom-park', // 17.8M, #1 worldwide
    'universal-studios-florida', // 9.5M, high US search volume
    'disneyland-park', // Paris — 10.2M, massive English search interest globally
    'tokyo-disneyland', // 15.1M, #4 worldwide, aspirational for EN speakers
    'tokyo-disneysea', // 12.4M, Fantasy Springs drove huge 2024 search interest
    'universal-studios-japan', // 16M, #3 worldwide
  ],
  fr: [
    'disneyland-park', // Paris — 10.2M, #1 Europe, dominant FR query
    'disney-adventure-world', // 5.6M, same resort
    'parc-asterix', // 2.84M, 2024 record, #1 French domestic after Disney
    'europa-park', // 6M, very popular with French-Swiss and Alsace visitors
    'futuroscope', // 2.05M, France's 3rd most visited domestic park
    'phantasialand', // 2M, known to French enthusiasts
  ],
  nl: [
    'efteling', // 5.6M, #1 NL by massive margin, deeply culturally embedded
    'attractiepark-toverland', // #2 NL domestic
    'walibi-belgium', // #1 Belgium, relevant for Flemish/Belgian Dutch speakers
    'europa-park', // top cross-border destination for Dutch
    'phantasialand', // popular with Dutch visitors to Germany
    'disneyland-park', // Paris — ~500K Dutch visitors/year
  ],
  it: [
    'gardaland', // 3M, #1 Italy by huge margin, dominant domestic search
    'disneyland-park', // Paris — top aspirational European park for Italians
    'europa-park', // 6M, frequently cited as best European park in Italian media
    'portaventura-park', // Spain is top Italian travel destination, well-searched in IT
    'efteling', // growing Italian fanbase, featured in Italian travel content
    'phantasialand', // known to Italian theme park enthusiasts
  ],
  es: [
    'portaventura-park', // 5.3M, Spain's #1, dominant domestic search
    'disneyland-park', // Paris — ~900K Spanish visitors/year, #2 source market
    'europa-park', // growing Spanish awareness, reachable via France
    'phantasialand', // more reachable for Spanish European travelers than Orlando
    'gardaland', // Italy is a top Spanish travel destination
    'efteling', // reachable European park; far more relevant than Tokyo/Orlando for ES users
  ],
};

/**
 * Day-stable, cacheable park fields only, with no live data (status, crowd, wait, schedule): those
 * overlay on the client via `useRegionParks` (see FeaturedParkCardsLive), so the geo fetch does not
 * pin every page with this section to a 5-minute ISR window.
 */
interface FeaturedPark {
  name: string;
  slug: string;
  parkId: string;
  city: string;
  continentSlug: string;
  countrySlug: string;
  countryName: string; // raw name, translated in component
  countryCode: string; // ISO code, for flags
  href: string;
  backgroundImage?: string | null;
  backgroundPosition?: string;
}

export { FEATURED_PARK_SLUGS };
export type { FeaturedPark };

/**
 * Returns the locale's hand-picked featured parks from the geo structure, in `FEATURED_PARK_SLUGS`
 * order, with day-stable fields only (no live data). Logs a warning for a slug the structure no
 * longer has.
 */
export function extractFeaturedParks(geoData: GeoStructure | null, locale: string): FeaturedPark[] {
  if (!geoData) return [];

  const slugs = FEATURED_PARK_SLUGS[locale] ?? FEATURED_PARK_SLUGS['en'];
  const slugSet = new Set(slugs);
  const slugMap = new Map<string, FeaturedPark>();

  for (const continent of geoData.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          if (slugMap.size < slugSet.size && slugSet.has(park.slug) && !slugMap.has(park.slug)) {
            slugMap.set(park.slug, {
              name: park.name,
              slug: park.slug,
              parkId: park.id,
              city: city.name,
              continentSlug: continent.slug,
              countrySlug: country.slug,
              countryName: country.name,
              countryCode: country.code,
              href: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
              backgroundImage: getParkBackgroundImage(park.slug),
              backgroundPosition: getCardObjectPosition(park.slug),
            });
          }
        }
      }
    }
  }

  // The list above is hand-curated, so a slug the geo structure does not have is a bug in it (or a
  // rename to follow): say so instead of silently shipping a shorter row.
  const missing = slugs.filter((slug) => !slugMap.has(slug));
  if (missing.length > 0) {
    console.warn(
      `[featured-parks] ${locale}: ${missing.length} slug(s) not in the geo structure — ` +
        `${missing.join(', ')}. Renamed upstream? Update FEATURED_PARK_SLUGS.`
    );
  }

  // Return in the defined locale order (preserves relevance ranking)
  return slugs.map((slug) => slugMap.get(slug)).filter((p): p is FeaturedPark => !!p);
}
