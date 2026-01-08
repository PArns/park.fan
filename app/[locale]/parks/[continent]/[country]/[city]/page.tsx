import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import type { Metadata } from 'next';

interface CityPageProps {
  params: Promise<{ locale: string; continent: string; country: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { locale, continent, country, city } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return {
    title: `Theme Parks in ${cityName}, ${countryName}`,
    description: `Live wait times and crowd levels for theme parks in ${cityName}. Plan your visit with real-time data.`,
    openGraph: {
      title: `Theme Parks in ${cityName}, ${countryName}`,
      description: `Live wait times and crowd levels for theme parks in ${cityName}. Plan your visit with real-time data.`,
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/parks/${continent}/${country}/${city}`,
      siteName: 'park.fan',
      images: [
        {
          url: 'https://park.fan/og-image.png',
          width: 1200,
          height: 630,
          alt: `Theme Parks in ${cityName}, ${countryName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Theme Parks in ${cityName}, ${countryName}`,
      description: `Live wait times and crowd levels for theme parks in ${cityName}. Plan your visit with real-time data.`,
      images: ['https://park.fan/og-image.png'],
    },
    alternates: {
      canonical: `/${locale}/parks/${continent}/${country}/${city}`,
      languages: {
        en: `/en/parks/${continent}/${country}/${city}`,
        de: `/de/parks/${continent}/${country}/${city}`,
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
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={city.name}
        title={t('parksIn', { location: city.name })}
        description={t('parkCount', { count: parks.length })}
      />

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
    </PageContainer>
  );
}
