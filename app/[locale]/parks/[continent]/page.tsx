import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound } from 'next/navigation';
import { getCountriesInContinent, getContinents } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { GeoLocationCard } from '@/components/common/geo-location-card';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';
import { getOgImageUrl } from '@/lib/utils/og-image';
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
  const { locale, continent } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.continent' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });

  const continentName = translateContinent(tGeo, continent, locale);

  const ogImageUrl = getOgImageUrl([locale, continent]);

  return {
    title: t('titleTemplate', { location: continentName }),
    description: t('metaDescriptionTemplate', { location: continentName }),
    openGraph: {
      title: t('titleTemplate', { location: continentName }),
      description: t('metaDescriptionTemplate', { location: continentName }),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/parks/${continent}`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('titleTemplate', { location: continentName }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('titleTemplate', { location: continentName }),
      description: t('metaDescriptionTemplate', { location: continentName }),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://park.fan/${locale}/parks/${continent}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/parks/${continent}`),
        'x-default': `/en/parks/${continent}`,
      },
    },
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
    const resolvedName = translateCountry(t, country.slug, locale, country.name);

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

  const continentName = translateContinent(t, continent, locale);

  // Create breadcrumbs for continent page
  const tCommon = await getTranslations('common');
  const { generateContinentBreadcrumbs } = await import('@/lib/utils/breadcrumb-utils');
  const tNav = await getTranslations('navigation');
  const breadcrumbs = generateContinentBreadcrumbs({
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  const itemListItems = countries.map((country) => {
    const name = translateCountry(t, country.slug, locale, country.name);
    return {
      name,
      url: `/${locale}/parks/${continent}/${country.slug}`,
    };
  });

  return (
    <PageContainer>
      <BreadcrumbStructuredData breadcrumbs={breadcrumbs} />
      <ItemListStructuredData
        items={itemListItems}
        listName={tExplore('title', { location: continentName })}
        pageUrl={`/${locale}/parks/${continent}`}
      />
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={continentName}
        title={tExplore('title', { location: continentName })}
        description={
          <>
            <span className="text-park-primary font-medium">
              {totalOpenParks} {t('open')}
            </span>{' '}
            / {totalParks} {tExplore('stats.park', { count: totalParks })} • {countries.length}{' '}
            {tExplore('stats.country', { count: countries.length })} • {totalCities}{' '}
            {tExplore('stats.city', { count: totalCities })}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => {
          const countryName = translateCountry(t, country.slug, locale, country.name);

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
    </PageContainer>
  );
}
