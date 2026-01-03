import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { getCountriesInContinent, getContinents } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { GeoLocationCard } from '@/components/common/geo-location-card';
import type { Metadata } from 'next';

interface ContinentPageProps {
  params: Promise<{ locale: string; continent: string }>;
}

// Generate static params for all continents
export async function generateStaticParams() {
  const continents = await getContinents().catch(() => []);
  return continents.map((c) => ({ continent: c.slug }));
}

export async function generateMetadata({ params }: ContinentPageProps): Promise<Metadata> {
  const { continent } = await params;
  const continentName = continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');

  return {
    title: `Parks in ${continentName}`,
    description: `Explore theme parks in ${continentName} with real-time wait times and crowd predictions.`,
  };
}

export const revalidate = 3600; // 1 hour

export default async function ContinentPage({ params }: ContinentPageProps) {
  const { locale, continent } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tExplore = await getTranslations('explore');

  // Fetch countries in this continent
  const [rawCountries, liveStats] = await Promise.all([
    getCountriesInContinent(continent).catch(() => null),
    getGeoLiveStats().catch(() => null),
  ]);

  if (!rawCountries) {
    notFound();
  }

  // Deduplicate countries by translated name to handle different slugs (e.g. 'fr' vs 'france')
  const uniqueCountries = new Map();

  rawCountries.forEach((country) => {
    // Try to translate, fall back to API name
    // We try both the slug and potential known variations if needed, but usually slug is enough
    const name = t(`countries.${country.slug}` as string);
    const resolvedName = name === `countries.${country.slug}` ? country.name : name;

    // If we haven't seen this name yet, or if this entry has more parks (prefer the "main" entry), use it
    const existing = uniqueCountries.get(resolvedName);
    if (!existing || country.parkCount > existing.parkCount) {
      uniqueCountries.set(resolvedName, { ...country, displayName: resolvedName });
    }
  });

  const countries = Array.from(uniqueCountries.values()).map((country) => {
    // Find live stats for this country
    // Note: we might need to find by slug.
    // The liveStats structure is: continents -> countries.
    // We need to find the current continent in liveStats, then find the country.
    const continentStats = liveStats?.continents.find((c) => c.slug === continent);
    const countryStats = continentStats?.countries.find((c) => c.slug === country.slug);

    return {
      ...country,
      openParkCount: countryStats?.openParkCount ?? country.openParkCount ?? 0,
    };
  });

  // Calculate totals
  const totalParks = countries.reduce((sum, c) => sum + c.parkCount, 0);
  const totalCities = countries.reduce((sum, c) => sum + c.cityCount, 0);
  const totalOpenParks = countries.reduce((sum, c) => sum + (c.openParkCount || 0), 0);

  // Format continent name for display
  const continentName =
    t(`continents.${continent}` as 'continents.europe') ||
    continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
          <Link href="/" className="hover:text-foreground">
            {tExplore('breadcrumbs.home')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{continentName}</span>
        </nav>
        <h1 className="mb-2 text-3xl font-bold">
          {tExplore('title', { location: continentName })}
        </h1>
        <p className="text-muted-foreground">
          <span className="text-park-primary font-medium">
            {totalOpenParks} {t('open')}
          </span>{' '}
          / {totalParks} {tExplore('stats.park', { count: totalParks })} • {countries.length}{' '}
          {tExplore('stats.country', { count: countries.length })} • {totalCities}{' '}
          {tExplore('stats.city', { count: totalCities })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => {
          const countryName = t(`countries.${country.slug}` as 'countries.germany') || country.name;

          return (
            <GeoLocationCard
              key={country.slug}
              name={countryName}
              slug={country.slug}
              href={`/parks/${continent}/${country.slug}`}
              openParkCount={country.openParkCount}
              totalParkCount={country.parkCount}
              subtitle={`${country.cityCount} ${tExplore('stats.city', { count: country.cityCount })}`}
              variant="country"
            />
          );
        })}
      </div>
    </div>
  );
}
