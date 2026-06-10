import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, locales, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { LiveParkGrid, type StaticPark } from '@/components/parks/live-park-grid';
import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { getCitiesWithParks, getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
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
  const response = await catchNonFatal(getCitiesWithParks(continent, country));
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
      url: `${SITE_URL}/${locale}/parks/${continent}/${country}/${citySlug}`,
      ogImageUrl,
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}/parks/${continent}/${country}/${citySlug}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/parks/${continent}/${country}/${citySlug}`),
        'x-default': `${SITE_URL}/en/parks/${continent}/${country}/${citySlug}`,
      },
    },
  };
}

export async function generateStaticParams() {
  const geoData = await getGeoStructure().catch(() => null);
  if (!geoData) return [];
  return locales.flatMap((locale) =>
    geoData.continents.flatMap((continent) =>
      continent.countries.flatMap((country) =>
        country.cities.map((city) => ({
          locale,
          continent: continent.slug,
          country: country.slug,
          city: city.slug,
        }))
      )
    )
  );
}

export default async function CityPage({ params }: CityPageProps) {
  const { locale, continent, country, city: citySlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tCommon = await getTranslations('common');
  const tExplore = await getTranslations('explore');

  // Fetch cities with parks
  const response = await catchNonFatal(getCitiesWithParks(continent, country));

  if (!response || !response.data) {
    notFound();
  }

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

  // Status-free seed for the cards: only fields that never change during the day. Live status,
  // crowd level, wait time and schedule are layered on the client by <LiveParkGrid>, so this
  // (per-locale) prerender carries no volatile data and stays valid for a day.
  const staticParks: StaticPark[] = parks.map((park) => ({
    id: park.id,
    name: stripNewPrefix(park.name),
    slug: park.slug,
    city: city.name,
    countryName,
    href: `/parks/${continent}/${country}/${citySlug}/${park.slug}`,
    backgroundImage: getParkBackgroundImage(park.slug),
  }));

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
      <BreadcrumbStructuredData breadcrumbs={breadcrumbs} locale={locale} />
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

      {/* Parks Grid — status-free shell (cacheable); live status overlaid client-side. */}
      <section aria-label={tExplore('parks')}>
        <h2 className="sr-only">{tExplore('parks')}</h2>
        <LiveParkGrid
          continent={continent}
          country={country}
          parks={staticParks}
          className="grid [grid-auto-rows:auto_1fr_auto] gap-4 md:grid-cols-2"
        />
      </section>
    </PageContainer>
  );
}
