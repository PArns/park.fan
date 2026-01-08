import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeader } from '@/components/common/section-header';
import type { Metadata } from 'next';

interface CountryPageProps {
  params: Promise<{ locale: string; continent: string; country: string }>;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { locale, continent, country } = await params;
  const countryName = country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return {
    title: `Theme Parks in ${countryName}`,
    description: `Discover theme parks in ${countryName} with live wait times, crowd predictions, and schedules.`,
    openGraph: {
      title: `Theme Parks in ${countryName}`,
      description: `Discover theme parks in ${countryName} with live wait times, crowd predictions, and schedules.`,
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/parks/${continent}/${country}`,
      siteName: 'park.fan',
      images: [
        {
          url: 'https://park.fan/og-image.png',
          width: 1200,
          height: 630,
          alt: `Theme Parks in ${countryName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Theme Parks in ${countryName}`,
      description: `Discover theme parks in ${countryName} with live wait times, crowd predictions, and schedules.`,
      images: ['https://park.fan/og-image.png'],
    },
    alternates: {
      canonical: `/${locale}/parks/${continent}/${country}`,
      languages: {
        en: `/en/parks/${continent}/${country}`,
        de: `/de/parks/${continent}/${country}`,
      },
    },
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
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={countryName}
        title={t('parksIn', { location: countryName })}
        description={
          <>
            {t('parkCount', { count: totalParks })} • {cities.length}{' '}
            {cities.length === 1 ? 'city' : 'cities'}
          </>
        }
      />

      {/* Cities with Parks */}
      <div className="space-y-8">
        {cities.map((city) => (
          <div key={city.slug}>
            <SectionHeader
              icon={MapPin}
              title={city.name}
              badge={t('parkCount', { count: city.parkCount })}
            />

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
    </PageContainer>
  );
}
