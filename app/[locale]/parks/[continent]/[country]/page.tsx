import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { LiveParkGrid } from '@/components/parks/live-park-grid';
import { getParkBackgroundImage, getParkImageSet } from '@/lib/utils/park-assets';
import { getCitiesWithParks, getGeoStructure, getCountrySummary } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeading } from '@/components/common/section-heading';
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
      url: `${SITE_URL}/${locale}/parks/${continent}/${country}`,
      ogImageUrl,
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}/parks/${continent}/${country}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/parks/${continent}/${country}`),
        'x-default': `${SITE_URL}/en/parks/${continent}/${country}`,
      },
    },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { locale, continent, country } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tCommon = await getTranslations('common');
  const tExplore = await getTranslations('explore');

  // Fetch cities and summary in parallel — summary failure is non-fatal
  const [response, summary] = await Promise.all([
    catchNonFatal(getCitiesWithParks(continent, country)),
    catchNonFatal(getCountrySummary(continent, country)),
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
      image: getParkImageSet(park.slug)[0],
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
            <SectionHeading
              variant="plain"
              icon={MapPin}
              title={city.name}
              badge={t('parkCount', { count: city.parkCount })}
            />

            {/* Status-free shell (cacheable); live status overlaid client-side. All cities on
                the page share one underlying /api/discovery call (React Query dedupe). */}
            <LiveParkGrid
              continent={continent}
              country={country}
              parks={city.parks.map((park) => ({
                id: park.id,
                name: stripNewPrefix(park.name),
                slug: park.slug,
                city: city.name,
                countryName,
                href: `/parks/${continent}/${country}/${city.slug}/${park.slug}`,
                backgroundImage: getParkBackgroundImage(park.slug),
              }))}
              className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
