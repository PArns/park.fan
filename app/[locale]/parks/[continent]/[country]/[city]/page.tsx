import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';

interface CityPageProps {
  params: Promise<{ locale: string; continent: string; country: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city, country } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return {
    title: `Theme Parks in ${cityName}, ${countryName}`,
    description: `Live wait times and crowd levels for theme parks in ${cityName}. Plan your visit with real-time data.`,
    alternates: {
      canonical: `/${(await params).locale}/parks/${(await params).continent}/${country}/${city}`,
      languages: {
        en: `/en/parks/${(await params).continent}/${country}/${city}`,
        de: `/de/parks/${(await params).continent}/${country}/${city}`,
      },
    },
  };
}

export const revalidate = 300; // 5 minutes (matches live stats cache)

export default async function CityPage({ params }: CityPageProps) {
  const { locale, continent, country, city: citySlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');

  // Fetch cities with parks and breadcrumbs
  const response = await getCitiesWithParks(continent, country).catch(() => null);

  if (!response || !response.data) {
    notFound();
  }

  // Find the specific city we're looking for
  const city = response.data.find((c) => c.slug === citySlug);

  if (!city || city.parks.length === 0) {
    notFound();
  }

  const { parks } = city;
  const { breadcrumbs } = response;

  const countryName = t.has(`countries.${country}`)
    ? t(`countries.${country}`)
    : country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={city.name} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t('parksIn', { location: city.name })}</h1>
        <p className="text-muted-foreground">{t('parkCount', { count: parks.length })}</p>
      </div>

      {/* Parks Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {parks.map((park) => (
          <ParkCard
            key={park.id}
            name={park.name}
            slug={park.slug}
            city={city.name}
            country={countryName}
            href={`/parks/${continent}/${country}/${citySlug}/${park.slug}`}
            status={park.status}
            crowdLevel={park.currentLoad?.crowdLevel}
            averageWaitTime={park.analytics?.statistics?.avgWaitTime}
            operatingAttractions={park.analytics?.statistics?.operatingAttractions}
            totalAttractions={park.analytics?.statistics?.totalAttractions}
            variant="detailed"
          />
        ))}
      </div>
    </div>
  );
}
