import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, locales, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata, fitWithin, MAX_TITLE_LENGTH } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { LiveParkGrid, type StaticPark } from '@/components/parks/live-park-grid';
import {
  getCardObjectPosition,
  getParkBackgroundImage,
  getParkImageSet,
} from '@/lib/utils/park-assets';
import { getCitiesWithParks, getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal, nullOnNotFound } from '@/lib/api/client';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { generateCityBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { findCityPageRedirect } from '@/lib/utils/redirect-utils';
import { stripNewPrefix } from '@/lib/utils';
import type { Metadata } from 'next';
import { RouteMessages } from '@/i18n/route-messages';
import { CitySummarySection } from '@/components/parks/city-summary-section';

interface CityPageProps {
  params: Promise<{ locale: string; continent: string; country: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { locale, continent, country, city: citySlug } = await params;
  if (!isServableRoute(locale, continent, country, citySlug)) return {};
  const t = await getTranslations({ locale, namespace: 'seo.city' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });

  const response = await catchNonFatal(getCitiesWithParks(continent, country));
  const city = response?.data?.find((c) => c.slug === citySlug);
  const cityName =
    city?.name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace(/-/g, ' ');

  const countryName = translateCountry(tGeo, country, locale);

  const ogImageUrl = getOgImageUrl([locale, continent, country, citySlug]);

  // City + country + template overruns the SERP cutoff for long pairs; the short form keeps
  // the city (the term people search) and drops the country.
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    t('titleTemplate', { city: cityName, country: countryName }),
    t('titleTemplateShort', { city: cityName })
  );
  const description = t('metaDescriptionTemplate', { city: cityName });

  return {
    title,
    description,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
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

/**
 * Only the cities that have a page, the ones with more than one park; a single-park city 308s to
 * its park, and prerendering it would build a redirect. The URL still renders on demand
 * (`dynamicParams`) and still 308s. Same predicate as `app/sitemap.ts` and `cityHasOwnPage()`:
 * change one, change the others.
 */
export async function generateStaticParams() {
  const geoData = await getGeoStructure().catch(() => null);
  if (!geoData) return [];
  return locales.flatMap((locale) =>
    geoData.continents.flatMap((continent) =>
      continent.countries.flatMap((country) =>
        country.cities
          .filter((city) => city.parks.length > 1)
          .map((city) => ({
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
  assertServableRoute(locale, continent, country, citySlug);
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tCommon = await getTranslations('common');
  const tExplore = await getTranslations('explore');

  // Only the API's own 404 may end in `notFound()` — see the continent page.
  const response = await nullOnNotFound(getCitiesWithParks(continent, country));

  if (!response || !response.data) {
    notFound();
  }

  const city = response.data.find((c) => c.slug === citySlug);

  if (!city || city.parks.length === 0) {
    // The "city" slug may be a park: /parks/europe/germany/phantasialand should be
    // /parks/europe/germany/bruehl/phantasialand.
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
    backgroundPosition: getCardObjectPosition(park.slug),
    // Static too — the distance to the visitor is computed client-side from these.
    latitude: park.latitude,
    longitude: park.longitude,
  }));

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
    image: getParkImageSet(park.slug)[0],
  }));

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]">
      <PageContainer>
        <BreadcrumbStructuredData
          breadcrumbs={breadcrumbs}
          currentPage={{ name: cityCurrentPage, url: `/parks/${continent}/${country}/${citySlug}` }}
          locale={locale}
        />
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

        <CitySummarySection
          cityName={city.name}
          parkNames={parks.map((park) => stripNewPrefix(park.name))}
          locale={locale}
        />

        {/* Status-free shell; live status is overlaid client-side. */}
        <section aria-label={tExplore('parks')}>
          <h2 className="sr-only">{tExplore('parks')}</h2>
          <LiveParkGrid
            continent={continent}
            country={country}
            parks={staticParks}
            className="grid [grid-auto-rows:auto_1fr_auto] gap-4 max-sm:auto-rows-auto md:grid-cols-2"
          />
        </section>
      </PageContainer>
    </RouteMessages>
  );
}
