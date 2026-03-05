import { getTranslations } from 'next-intl/server';
import { ParkCard } from '@/components/parks/park-card';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import type { GeoStructure } from '@/lib/api/types';

/**
 * Featured parks per locale — verified slugs from footer + API structure.
 * Ordered by visit relevance for each language audience.
 */
const FEATURED_PARK_SLUGS: Record<string, string[]> = {
  de: [
    'europa-park',
    'phantasialand',
    'heide-park',
    'movie-park-germany',
    'efteling',
    'attractiepark-toverland',
  ],
  en: [
    'magic-kingdom-park',
    'universal-studios-florida',
    'six-flags-magic-mountain',
    'tokyo-disneyland',
    'tokyo-disneysea',
    'universal-studios-japan',
  ],
  fr: [
    'disneyland-park', // Paris
    'walt-disney-studios-park',
    'parc-asterix',
    'futuroscope',
    'europa-park',
    'phantasialand',
  ],
  nl: [
    'efteling',
    'attractiepark-toverland',
    'walibi-belgium',
    'europa-park',
    'phantasialand',
    'disneyland-park', // Paris
  ],
  it: [
    'gardaland',
    'disneyland-park', // Paris
    'europa-park',
    'phantasialand',
    'magic-kingdom-park',
    'universal-studios-japan',
  ],
  es: [
    'portaventura-world',
    'disneyland-park', // Paris
    'europa-park',
    'magic-kingdom-park',
    'universal-studios-florida',
    'tokyo-disneyland',
  ],
};

interface FeaturedPark {
  name: string;
  slug: string;
  city: string;
  country: string;
  href: string;
}

function extractFeaturedParks(
  geoData: GeoStructure | null,
  locale: string
): FeaturedPark[] {
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
              city: city.name,
              country: country.name,
              href: `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
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

  const parks = extractFeaturedParks(geoData, locale);
  if (parks.length === 0) return null;

  return (
    <section className="border-b px-4 py-12">
      <div className="container mx-auto">
        <h2 className="mb-2 text-center text-2xl font-semibold">
          {tHome('sections.featuredParks')}
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          {tHome('sections.featuredParksIntro')}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parks.map((park) => (
            <ParkCard
              key={park.slug}
              name={park.name}
              slug={park.slug}
              city={park.city}
              country={park.country}
              href={park.href as '/'}
              variant="detailed"
            />
          ))}
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
