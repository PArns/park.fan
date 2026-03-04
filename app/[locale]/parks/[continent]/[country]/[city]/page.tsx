import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { generateCityBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { findCityPageRedirect } from '@/lib/utils/redirect-utils';
import { stripNewPrefix } from '@/lib/utils';
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

  const countryName = translateCountry(tGeo, country, locale);

  const ogImageUrl = getOgImageUrl([locale, continent, country, citySlug]);

  return {
    title: t('titleTemplate', { city: cityName, country: countryName }),
    description: t('metaDescriptionTemplate', { city: cityName }),
    ...buildOpenGraphMetadata({
      locale,
      title: t('titleTemplate', { city: cityName, country: countryName }),
      description: t('metaDescriptionTemplate', { city: cityName }),
      url: `https://park.fan/${locale}/parks/${continent}/${country}/${citySlug}`,
      ogImageUrl,
    }),
    alternates: {
      canonical: `https://park.fan/${locale}/parks/${continent}/${country}/${citySlug}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/parks/${continent}/${country}/${citySlug}`),
        'x-default': `https://park.fan/en/parks/${continent}/${country}/${citySlug}`,
      },
    },
  };
}

export const revalidate = 300; // 5 minutes (matches API cache for live park stats)

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
    // Before returning 404, check if the "city" slug is actually a park
    // This handles malformed URLs like /parks/europe/germany/phantasialand
    // which should be /parks/europe/germany/bruehl/phantasialand
    const redirectUrl = await findCityPageRedirect(continent, country, citySlug);
    if (redirectUrl) {
      permanentRedirect(`/${locale}${redirectUrl}`);
    }
    notFound();
  }

  const { parks } = city;

  // Single-park cities are thin duplicates of the park page itself.
  // Redirect permanently so Google consolidates signals on the park page.
  if (parks.length === 1) {
    permanentRedirect(`/${locale}/parks/${continent}/${country}/${citySlug}/${parks[0].slug}`);
  }

  const continentName = translateContinent(t, continent, locale);
  const countryName = translateCountry(t, country, locale);

  // Generate breadcrumbs with translations
  const tNav = await getTranslations('navigation');
  const { breadcrumbs, currentPage: cityCurrentPage } = generateCityBreadcrumbs({
    continent,
    country,
    continentName,
    countryName,
    cityName: city.name,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  const itemListItems = parks.map((park) => ({
    name: stripNewPrefix(park.name),
    url: `/${locale}/parks/${continent}/${country}/${citySlug}/${park.slug}`,
  }));

  return (
    <PageContainer>
      <BreadcrumbStructuredData breadcrumbs={breadcrumbs} />
      <ItemListStructuredData
        items={itemListItems}
        listName={t('parksIn', { location: city.name })}
        pageUrl={`/${locale}/parks/${continent}/${country}/${citySlug}`}
      />
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={cityCurrentPage}
        title={t('parksIn', { location: city.name })}
        description={t('parkCount', { count: parks.length })}
      />

      {/* Parks Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {parks.map((park) => (
          <ParkCard
            key={park.id}
            name={stripNewPrefix(park.name)}
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
            timezone={park.timezone}
            todaySchedule={park.todaySchedule}
            nextSchedule={park.nextSchedule}
          />
        ))}
      </div>
    </PageContainer>
  );
}
