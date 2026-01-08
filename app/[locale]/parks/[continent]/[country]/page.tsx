import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeader } from '@/components/common/section-header';
import type { Metadata } from 'next';

interface CountryPageProps {
  params: Promise<{ locale: string; continent: string; country: string }>;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { locale, continent, country } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.country' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });

  const countryName = tGeo.has(`countries.${country}`)
    ? tGeo(`countries.${country}`)
    : country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return {
    title: t('titleTemplate', { location: countryName }),
    description: t('metaDescriptionTemplate', { location: countryName }),
    openGraph: {
      title: t('titleTemplate', { location: countryName }),
      description: t('metaDescriptionTemplate', { location: countryName }),
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/parks/${continent}/${country}`,
      siteName: 'park.fan',
      images: [
        {
          url: 'https://park.fan/og-image.png',
          width: 1200,
          height: 630,
          alt: t('titleTemplate', { location: countryName }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('titleTemplate', { location: countryName }),
      description: t('metaDescriptionTemplate', { location: countryName }),
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
  const tCommon = await getTranslations('common');
  const tExplore = await getTranslations('explore');

  // Fetch cities with full park data
  const response = await getCitiesWithParks(continent, country).catch(() => null);

  if (!response || !response.data || response.data.length === 0) {
    notFound();
  }

  const { data: cities } = response;

  // Calculate totals
  const totalParks = cities.reduce((sum, c) => sum + c.parkCount, 0);

  // Get translated names
  const continentName = t.has(`continents.${continent}`)
    ? t(`continents.${continent}`)
    : continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');
  const countryName = t.has(`countries.${country}`)
    ? t(`countries.${country}`)
    : country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  // Generate breadcrumbs with translations
  const { generateCountryBreadcrumbs } = await import('@/lib/utils/breadcrumb-utils');
  const breadcrumbs = generateCountryBreadcrumbs({
    locale: locale as 'en' | 'de',
    continent,
    continentName,
    homeLabel: tCommon('home'),
  });

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={countryName}
        title={t('parksIn', { location: countryName })}
        description={
          <>
            {t('parkCount', { count: totalParks })} • {cities.length}{' '}
            {tExplore('stats.city', { count: cities.length })}
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
