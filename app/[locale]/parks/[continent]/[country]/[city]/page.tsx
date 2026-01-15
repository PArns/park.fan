import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { getOgImageUrl } from '@/lib/utils/og-image';
import type { Metadata } from 'next';

interface CityPageProps {
  params: Promise<{ locale: string; continent: string; country: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { locale, continent, country, city: citySlug } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.city' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });

  // Try to get city name from API data, fallback to slug formatting
  const response = await getCitiesWithParks(continent, country).catch(() => null);
  const city = response?.data?.find((c) => c.slug === citySlug);
  const cityName =
    city?.name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace(/-/g, ' ');

  const countryName = tGeo.has(`countries.${country}`)
    ? tGeo(`countries.${country}`)
    : country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  const ogImageUrl = getOgImageUrl([locale, continent, country, citySlug]);

  return {
    title: t('titleTemplate', { city: cityName, country: countryName }),
    description: t('metaDescriptionTemplate', { city: cityName }),
    openGraph: {
      title: t('titleTemplate', { city: cityName, country: countryName }),
      description: t('metaDescriptionTemplate', { city: cityName }),
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/parks/${continent}/${country}/${citySlug}`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 420,
          alt: t('titleTemplate', { city: cityName, country: countryName }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('titleTemplate', { city: cityName, country: countryName }),
      description: t('metaDescriptionTemplate', { city: cityName }),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `/${locale}/parks/${continent}/${country}/${citySlug}`,
      languages: {
        en: `/en/parks/${continent}/${country}/${citySlug}`,
        de: `/de/parks/${continent}/${country}/${citySlug}`,
        nl: `/nl/parks/${continent}/${country}/${citySlug}`,
        fr: `/fr/parks/${continent}/${country}/${citySlug}`,
        es: `/es/parks/${continent}/${country}/${citySlug}`,
      },
    },
  };
}

export const revalidate = 300; // 5 minutes (matches live stats cache)

export default async function CityPage({ params }: CityPageProps) {
  const { locale, continent, country, city: citySlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tCommon = await getTranslations('common');

  // Fetch cities with parks
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

  // Get translated names
  const continentName = t.has(`continents.${continent}`)
    ? t(`continents.${continent}`)
    : continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');
  const countryName = t.has(`countries.${country}`)
    ? t(`countries.${country}`)
    : country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  // Generate breadcrumbs with translations
  const tNav = await getTranslations('navigation');
  const { generateCityBreadcrumbs } = await import('@/lib/utils/breadcrumb-utils');
  const breadcrumbs = generateCityBreadcrumbs({
    locale: locale as 'en' | 'de',
    continent,
    country,
    continentName,
    countryName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

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
