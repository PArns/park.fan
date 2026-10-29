import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { RouteMessages } from '@/i18n/route-messages';
import { buildOpenGraphMetadata, fitWithin, MAX_TITLE_LENGTH } from '@/lib/utils/metadata';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { translateCountry } from '@/lib/i18n/helpers';
import { getGeoStructure } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { brandParksByCountry, SIX_FLAGS, type BrandCountry } from '@/lib/parks/park-brands';
import {
  getCardObjectPosition,
  getParkBackgroundImage,
  getParkImageSet,
} from '@/lib/utils/park-assets';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { stripNewPrefix } from '@/lib/utils';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeading } from '@/components/common/section-heading';
import { Badge } from '@/components/ui/badge';
import { CountryParkGroups } from '@/components/parks/country-park-groups';
import { BreadcrumbStructuredData, ItemListStructuredData } from '@/components/seo/structured-data';

interface SixFlagsPageProps {
  params: Promise<{ locale: string }>;
}

const PATH = `/parks/${SIX_FLAGS.slug}`;

/** The brand's parks, or none when the geo tree could not be read. */
async function readCountries(): Promise<BrandCountry[]> {
  const geo = await catchNonFatal(getGeoStructure());
  return geo ? brandParksByCountry(geo, SIX_FLAGS) : [];
}

function parkCount(countries: BrandCountry[]): number {
  return countries.reduce((sum, country) => sum + country.parks.length, 0);
}

export async function generateMetadata({ params }: SixFlagsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'sixFlags' });

  const count = parkCount(await readCountries());
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
      url: `${SITE_URL}/${locale}${PATH}`,
      ogImageUrl: getOgImageUrl([locale, 'parks']),
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}${PATH}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${PATH}`),
        'x-default': `${SITE_URL}/en${PATH}`,
      },
    },
  };
}

/**
 * Every park with „Six Flags" in its name on one page, grouped by country, with the live status
 * the geo pages show: the page „six flags wait times" is meant to find. Membership is the name,
 * see `lib/parks/park-brands.ts`.
 */
export default async function SixFlagsPage({ params }: SixFlagsPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  const [t, tGeo, tCommon, tNav, countries] = await Promise.all([
    getTranslations('sixFlags'),
    getTranslations('geo'),
    getTranslations('common'),
    getTranslations('navigation'),
    readCountries(),
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
      parks: country.parks.map(({ park, city }) => ({
        id: park.id,
        name: stripNewPrefix(park.name),
        slug: park.slug,
        city: city.name,
        countryName,
        href: `/parks/${country.continentSlug}/${country.countrySlug}/${city.slug}/${park.slug}`,
        backgroundImage: getParkBackgroundImage(park.slug),
        backgroundPosition: getCardObjectPosition(park.slug),
        latitude: park.latitude,
        longitude: park.longitude,
      })),
    };
  });

  return (
    <RouteMessages route="/parks/six-flags">
      <PageContainer>
        <BreadcrumbStructuredData
          breadcrumbs={breadcrumbs}
          currentPage={{ name: t('breadcrumb'), url: PATH }}
          locale={locale}
        />
        <ItemListStructuredData
          items={groups.flatMap((group) =>
            group.parks.map((park) => ({
              name: park.name,
              url: `/${locale}${park.href}`,
              image: getParkImageSet(park.slug)[0],
            }))
          )}
          listName={t('listName')}
          pageUrl={`/${locale}${PATH}`}
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
          className="space-y-8"
          gridClassName="grid [grid-auto-rows:auto_1fr_auto] gap-4 max-sm:auto-rows-auto sm:grid-cols-2 lg:grid-cols-3"
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
    </RouteMessages>
  );
}
