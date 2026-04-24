import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { ParkCard } from '@/components/parks/park-card';
import { getCitiesWithParks, getGeoStructure, getCountrySummary } from '@/lib/api/discovery';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeader } from '@/components/common/section-header';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { generateCountryBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { stripNewPrefix } from '@/lib/utils';
import { CountrySummarySection } from '@/components/parks/country-summary-section';
import type { Metadata } from 'next';

interface CountryPageProps {
  params: Promise<{ locale: string; continent: string; country: string }>;
}

export async function generateStaticParams() {
  const geo = await getGeoStructure().catch(() => null);

  if (!geo) {
    return [];
  }

  const params: { continent: string; country: string }[] = [];

  for (const continent of geo.continents) {
    for (const country of continent.countries) {
      params.push({
        continent: continent.slug,
        country: country.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { locale, continent, country } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.country' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });

  const countryName = translateCountry(tGeo, country, locale);

  const ogImageUrl = getOgImageUrl([locale, continent, country]);

  return {
    title: t('titleTemplate', { location: countryName }),
    description: t('metaDescriptionTemplate', { location: countryName }),
    ...buildOpenGraphMetadata({
      locale,
      title: t('titleTemplate', { location: countryName }),
      description: t('metaDescriptionTemplate', { location: countryName }),
      url: `https://park.fan/${locale}/parks/${continent}/${country}`,
      ogImageUrl,
    }),
    alternates: {
      canonical: `https://park.fan/${locale}/parks/${continent}/${country}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/parks/${continent}/${country}`),
        'x-default': `https://park.fan/en/parks/${continent}/${country}`,
      },
    },
  };
}

export const revalidate = 3600; // 1 hour — live data via React Query on client

export default async function CountryPage({ params }: CountryPageProps) {
  const { locale, continent, country } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tCommon = await getTranslations('common');
  const tExplore = await getTranslations('explore');

  // Fetch cities and summary in parallel — summary failure is non-fatal
  const [response, summary] = await Promise.all([
    getCitiesWithParks(continent, country).catch(() => null),
    getCountrySummary(continent, country).catch(() => null),
  ]);

  if (!response || !response.data || response.data.length === 0) {
    notFound();
  }

  const cities = response.data;

  // Calculate totals
  const totalParks = cities.reduce((sum, c) => sum + c.parkCount, 0);

  const continentName = translateContinent(t, continent, locale);
  const countryName = translateCountry(t, country, locale);

  // Generate breadcrumbs with translations
  const tNav = await getTranslations('navigation');
  const { breadcrumbs, currentPage: countryCurrentPage } = generateCountryBreadcrumbs({
    continent,
    continentName,
    countryName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  const itemListItems = cities.flatMap((city) =>
    city.parks.map((park) => ({
      name: stripNewPrefix(park.name),
      url: `/${locale}/parks/${continent}/${country}/${city.slug}/${park.slug}`,
    }))
  );

  return (
    <PageContainer>
      <BreadcrumbStructuredData breadcrumbs={breadcrumbs} locale={locale} />
      <ItemListStructuredData
        items={itemListItems}
        listName={t('parksIn', { location: countryName })}
        pageUrl={`/${locale}/parks/${continent}/${country}`}
      />
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={countryCurrentPage}
        title={t('parksIn', { location: countryName })}
        description={
          <>
            {t('parkCount', { count: totalParks })} • {cities.length}{' '}
            {tExplore('stats.city', { count: cities.length })}
          </>
        }
      />

      {/* Country summary — top parks + best months */}
      {summary && (
        <CountrySummarySection summary={summary} countryName={countryName} locale={locale} />
      )}

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
                  name={stripNewPrefix(park.name)}
                  slug={park.slug}
                  city={city.name}
                  country={countryName}
                  href={`/parks/${continent}/${country}/${city.slug}/${park.slug}`}
                  status={park.status}
                  crowdLevel={park.analytics?.statistics?.crowdLevel ?? park.currentLoad?.crowdLevel}
                  averageWaitTime={park.analytics?.statistics?.avgWaitTime}
                  operatingAttractions={park.analytics?.statistics?.operatingAttractions}
                  totalAttractions={park.analytics?.statistics?.totalAttractions}
                  showBackground={true}
                  variant="detailed"
                  timezone={park.timezone}
                  todaySchedule={park.todaySchedule}
                  nextSchedule={park.nextSchedule}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
