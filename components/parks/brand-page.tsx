import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata, fitWithin, MAX_TITLE_LENGTH } from '@/lib/utils/metadata';
import { isServableRoute } from '@/lib/utils/route-guards';
import { translateCountry } from '@/lib/i18n/helpers';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { brandParksByCountry, type BrandCountry, type ParkBrand } from '@/lib/parks/park-brands';
import { parkListItem, toStaticPark } from '@/lib/parks/static-park';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { CountryParkGroups } from '@/components/parks/country-park-groups';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';

/** The props a brand's `page.tsx` receives and hands on. */
export interface BrandPageProps {
  params: Promise<{ locale: string }>;
}

/** The brand's parks from the geo tree; throws when the tree cannot be read. */
async function readCountries(brand: ParkBrand): Promise<BrandCountry[]> {
  return brandParksByCountry(await getGeoStructure(), brand);
}

function parkCount(countries: BrandCountry[]): number {
  return countries.reduce((sum, country) => sum + country.parks.length, 0);
}

/**
 * A brand page's metadata: the title names the park count and falls back to a count-less one when
 * the geo tree cannot be read; canonical and hreflang for six locales plus `x-default`.
 */
export async function brandPageMetadata(
  brand: ParkBrand,
  { params }: BrandPageProps
): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: brand.namespace });
  const path = `/parks/${brand.slug}`;

  const countries = await catchNonFatal(readCountries(brand));
  const count = countries ? parkCount(countries) : 0;
  const title = count
    ? fitWithin(MAX_TITLE_LENGTH, t('metaTitle', { count }), t('metaTitleShort'))
    : t('metaTitleShort');
  const description = t('metaDescription');

  return {
    title,
    description,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url: `${SITE_URL}/${locale}${path}`,
      ogImageUrl: getOgImageUrl([locale, 'parks']),
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}${path}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${path}`),
        'x-default': `${SITE_URL}/en${path}`,
      },
    },
  };
}

/**
 * Every park named for a brand on one page, grouped by country, with the live status the geo pages
 * show: the page "<brand> wait times" is meant to find. Membership is the name, see
 * `lib/parks/park-brands.ts` and docs/seo/brand-pages.md. The `page.tsx` checks the locale, sets
 * it and wraps this in its `RouteMessages`: `pnpm check:client-messages` looks for both there.
 */
export async function BrandPage({ brand, locale }: { brand: ParkBrand; locale: string }) {
  const path = `/parks/${brand.slug}` as const;

  const [t, tGeo, tCommon, tNav, countries] = await Promise.all([
    getTranslations(brand.namespace),
    getTranslations('geo'),
    getTranslations('common'),
    getTranslations('navigation'),
    // Not `catchNonFatal`: an API error must not become `notFound()`, which this prerendered
    // page would keep for its whole `revalidate`. Only a tree without the brand's parks is a 404.
    readCountries(brand),
  ]);
  if (countries.length === 0) notFound();

  const breadcrumbs = [
    { name: tCommon('home'), url: '/' },
    { name: tNav('continents'), url: '/parks' },
  ];
  const groups = countries.map((country) => {
    const countryName = translateCountry(tGeo, country.countrySlug, locale, country.countryName);
    return {
      key: country.countrySlug,
      countryName,
      region: `${country.continentSlug}/${country.countrySlug}`,
      parks: country.parks.map(({ park, city }) =>
        toStaticPark(park, {
          continent: country.continentSlug,
          country: country.countrySlug,
          citySlug: city.slug,
          cityName: city.name,
          countryName,
        })
      ),
    };
  });

  return (
    <PageContainer>
      <BreadcrumbStructuredData
        breadcrumbs={breadcrumbs}
        currentPage={{ name: t('breadcrumb'), url: path }}
        locale={locale}
      />
      <ItemListStructuredData
        items={groups.flatMap((group) => group.parks.map((park) => parkListItem(locale, park)))}
        listName={t('listName')}
        pageUrl={`/${locale}${path}`}
      />
      <PageHeader
        breadcrumbs={breadcrumbs}
        currentPage={t('breadcrumb')}
        title={t('title')}
        description={t('summary', { parks: parkCount(countries), countries: countries.length })}
      />
      <p className="text-muted-foreground -mt-4 mb-8 max-w-2xl leading-relaxed">{t('intro')}</p>

      {/* Status-free shell; the live status of every country on the page comes in one
            /api/parks/live call. */}
      <CountryParkGroups
        regions={groups.map((group) => group.region)}
        groups={groups.map((group) => ({
          key: group.key,
          heading: (
            <SectionHeading
              variant="plain"
              icon={MapPin}
              title={group.countryName}
              badge={
                <Badge variant="secondary">
                  {tGeo('parkCount', { count: group.parks.length })}
                </Badge>
              }
            />
          ),
          parks: group.parks,
        }))}
      />
    </PageContainer>
  );
}
