import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getCountriesInContinent, getContinents } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { GeoLocationCard } from '@/components/common/geo-location-card';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
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

  const continentName = tGeo.has(`continents.${continent}`)
    ? tGeo(`continents.${continent}`)
    : continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');

  const ogImageUrl = getOgImageUrl([locale, continent]);

  return {
    title: t('titleTemplate', { location: continentName }),
    description: t('metaDescriptionTemplate', { location: continentName }),
    openGraph: {
      title: t('titleTemplate', { location: continentName }),
      description: t('metaDescriptionTemplate', { location: continentName }),
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/parks/${continent}`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 420,
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
      canonical: `/${locale}/parks/${continent}`,
      languages: {
        en: `/en/parks/${continent}`,
        de: `/de/parks/${continent}`,
        nl: `/nl/parks/${continent}`,
        fr: `/fr/parks/${continent}`,
        es: `/es/parks/${continent}`,
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
    // Try to translate, fall back to API name
    // We try both the slug and potential known variations if needed, but usually slug is enough
    const name = t(`countries.${country.slug}` as string);
    const resolvedName = name === `countries.${country.slug}` ? country.name : name;

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

  // Format continent name for display
  const continentName =
    t(`continents.${continent}` as 'continents.europe') ||
    continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');

  // Create breadcrumbs for continent page
  const tCommon = await getTranslations('common');
  const { generateContinentBreadcrumbs } = await import('@/lib/utils/breadcrumb-utils');
  const tNav = await getTranslations('navigation');
  const breadcrumbs = generateContinentBreadcrumbs({
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  return (
    <PageContainer>
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
          const countryName = t(`countries.${country.slug}` as 'countries.germany') || country.name;

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
