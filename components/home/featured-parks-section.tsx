import { getTranslations } from 'next-intl/server';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { ParkCard } from '@/components/parks/park-card';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import type { GeoStructure, ParkStatus, CrowdLevel, ScheduleSummary } from '@/lib/api/types';

/**
 * Featured parks per locale — verified slugs from footer + API structure.
 * Ordered by visit relevance for each language audience.
 */
// Sources: TEA 2024 Global Experience Index + European attendance rankings.
// Ordered by wait-time search relevance for each language market.
// Note: 'disneyland-park' resolves to Paris (Europe traversed before North America).
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
    'walt-disney-studios-park', // 5.6M, same resort
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
    'portaventura-world', // Spain is top Italian travel destination, well-searched in IT
    'efteling', // growing Italian fanbase, featured in Italian travel content
    'phantasialand', // known to Italian theme park enthusiasts
  ],
  es: [
    'portaventura-world', // 5.3M, Spain's #1, dominant domestic search
    'disneyland-park', // Paris — ~900K Spanish visitors/year, #2 source market
    'europa-park', // growing Spanish awareness, reachable via France
    'phantasialand', // more reachable for Spanish European travelers than Orlando
    'gardaland', // Italy is a top Spanish travel destination
    'efteling', // reachable European park; far more relevant than Tokyo/Orlando for ES users
  ],
};

interface FeaturedPark {
  name: string;
  slug: string;
  parkId: string;
  city: string;
  countrySlug: string;
  countryName: string; // raw name, translated in component
  href: string;
  // Live data from ParkReference
  status?: ParkStatus;
  crowdLevel?: CrowdLevel;
  averageWaitTime?: number;
  operatingAttractions?: number;
  totalAttractions?: number;
  timezone?: string;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
}

export { FEATURED_PARK_SLUGS };
export type { FeaturedPark };

export function extractFeaturedParks(geoData: GeoStructure | null, locale: string): FeaturedPark[] {
  if (!geoData) return [];

  const slugs = FEATURED_PARK_SLUGS[locale] ?? FEATURED_PARK_SLUGS['en'];
  const slugMap = new Map<string, FeaturedPark>();

  for (const continent of geoData.continents) {
    for (const country of continent.countries) {
      for (const city of country.cities) {
        for (const park of city.parks) {
          if (slugMap.size < slugs.length && slugs.includes(park.slug) && !slugMap.has(park.slug)) {
            slugMap.set(park.slug, {
              name: park.name,
              slug: park.slug,
              parkId: park.id,
              city: city.name,
              countrySlug: country.slug,
              countryName: country.name,
              href: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
              status: park.status,
              crowdLevel: park.currentLoad?.crowdLevel,
              averageWaitTime: park.analytics?.statistics?.avgWaitTime,
              operatingAttractions: park.analytics?.statistics?.operatingAttractions,
              totalAttractions: park.analytics?.statistics?.totalAttractions,
              timezone: park.timezone,
              todaySchedule: park.todaySchedule,
              nextSchedule: park.nextSchedule,
            });
          }
        }
      }
    }
  }

  // Return in the defined locale order (preserves relevance ranking)
  return slugs.map((slug) => slugMap.get(slug)).filter((p): p is FeaturedPark => !!p);
}

interface FeaturedParksSectionProps {
  locale: string;
  geoData: GeoStructure | null;
}

export async function FeaturedParksSection({ locale, geoData }: FeaturedParksSectionProps) {
  const tHome = await getTranslations('home');
  const tGeo = await getTranslations('geo');

  const parks = extractFeaturedParks(geoData, locale);
  if (parks.length === 0) return null;

  return (
    <section className="border-b px-4 py-12">
      <div className="container mx-auto">
        <h2 className="mb-2 text-center text-2xl font-semibold">
          {tHome('sections.featuredParks')}
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          <GlossaryInject>{tHome('sections.featuredParksIntro')}</GlossaryInject>
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parks.map((park) => {
            // Translate country name using geo translations (same pattern as ParkCardNearby)
            const normalizedCountry = park.countrySlug.toLowerCase().replace(/\s+/g, '-');
            const translatedCountry =
              tGeo(`countries.${normalizedCountry}` as string) || park.countryName;

            return (
              <ParkCard
                key={park.slug}
                name={park.name}
                slug={park.slug}
                parkId={park.parkId}
                city={park.city}
                country={translatedCountry}
                href={park.href as '/'}
                status={park.status}
                crowdLevel={park.crowdLevel}
                averageWaitTime={park.averageWaitTime}
                operatingAttractions={park.operatingAttractions}
                totalAttractions={park.totalAttractions}
                timezone={park.timezone}
                todaySchedule={park.todaySchedule}
                nextSchedule={park.nextSchedule}
                variant="detailed"
              />
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/parks"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          >
            {tHome('hero.cta')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
