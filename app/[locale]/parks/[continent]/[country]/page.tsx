import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';

interface CountryPageProps {
  params: Promise<{ locale: string; continent: string; country: string }>;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country } = await params;
  const countryName = country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return {
    title: `Theme Parks in ${countryName}`,
    description: `Discover theme parks in ${countryName} with live wait times, crowd predictions, and schedules.`,
  };
}

export const revalidate = 300; // 5 minutes (matches live stats cache)

export default async function CountryPage({ params }: CountryPageProps) {
  const { locale, continent, country } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');

  // Fetch cities with full park data and breadcrumbs in a single call
  const response = await getCitiesWithParks(continent, country).catch(() => null);

  if (!response || !response.data || response.data.length === 0) {
    notFound();
  }

  const { data: cities, breadcrumbs } = response;

  // Calculate totals
  const totalParks = cities.reduce((sum, c) => sum + c.parkCount, 0);

  // Get country name from first park or translation
  const countryName = t.has(`countries.${country}`)
    ? t(`countries.${country}`)
    : country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={countryName} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t('parksIn', { location: countryName })}</h1>
        <p className="text-muted-foreground">
          {t('parkCount', { count: totalParks })} • {cities.length}{' '}
          {cities.length === 1 ? 'city' : 'cities'}
        </p>
      </div>

      {/* Cities with Parks */}
      <div className="space-y-8">
        {cities.map((city) => (
          <div key={city.slug}>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="text-primary h-5 w-5" />
              <h2 className="text-xl font-semibold">{city.name}</h2>
              <Badge variant="secondary">{t('parkCount', { count: city.parkCount })}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {city.parks.map((park) => (
                <ParkCard
                  key={park.id}
                  name={park.name}
                  slug={park.slug}
                  city={city.name}
                  country={countryName}
                  href={`/parks/${continent}/${country}/${city.slug}/${park.slug}`}
                  status={park.status}
                  crowdLevel={park.currentLoad?.crowdLevel}
                  averageWaitTime={park.analytics?.statistics?.avgWaitTime}
                  operatingAttractions={park.analytics?.statistics?.operatingAttractions}
                  totalAttractions={park.analytics?.statistics?.totalAttractions}
                  showBackground={true}
                  variant="detailed"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
