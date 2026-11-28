import { getTranslations, setRequestLocale } from 'next-intl/server';
import { translateContinent } from '@/lib/i18n/helpers';
import { SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata, buildAlternates } from '@/lib/utils/metadata';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { getContinents } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { LiveOpenCount } from '@/components/parks/live-open-count';
import { LiveRegionCards, type StaticRegionCard } from '@/components/parks/live-region-cards';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { ItemListStructuredData } from '@/components/seo/structured-data';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { collectParkCoordinates } from '@/lib/utils/distance-utils';
import type { Metadata } from 'next';
import { RouteMessages } from '@/i18n/route-messages';

interface ParksPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ParksPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isServableRoute(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'seo.parks' });

  const ogImageUrl = getOgImageUrl([locale, 'parks']);

  return {
    title: t('title'),
    description: t('description'),
    ...buildOpenGraphMetadata({
      locale,
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/parks`,
      ogImageUrl,
    }),
    alternates: buildAlternates(locale, () => '/parks'),
  };
}

export default async function ParksPage({ params }: ParksPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tExplore = await getTranslations('explore');

  // The open-park counts are layered on the client (<LiveOpenCount> / <LiveRegionCards>), as on
  // the continent pages: this shell is built from the geo structure and kept for its window, so a
  // count baked into it would stay as it was at the build.
  const continents = (await catchNonFatal(getContinents())) ?? [];

  const totalParks = continents.reduce((sum, c) => sum + c.parkCount, 0);
  const totalCountries = continents.reduce((sum, c) => sum + c.countryCount, 0);

  const tCommon = await getTranslations('common');

  const breadcrumbs = [{ name: tCommon('home'), url: '/' }];

  const tNav = await getTranslations('navigation');

  const itemListItems = continents.map((continent) => {
    const name = translateContinent(t, continent.slug, locale, continent.name);
    return { name, url: `/${locale}/parks/${continent.slug}` };
  });

  return (
    <RouteMessages route="/parks">
      <PageContainer>
        <ItemListStructuredData
          items={itemListItems}
          listName={tExplore('parksTitle')}
          pageUrl={`/${locale}/parks`}
        />
        <PageHeader
          breadcrumbs={breadcrumbs}
          currentPage={tNav('continents')}
          title={tExplore('parksTitle')}
          description={
            <>
              <span className="text-park-primary font-medium">
                <LiveOpenCount /> {t('open')}
              </span>{' '}
              / {totalParks} {tExplore('stats.park', { count: totalParks })} • {totalCountries}{' '}
              {tExplore('stats.country', { count: totalCountries })}
            </>
          }
        />

        <LiveRegionCards
          regions={continents.map((continent): StaticRegionCard => ({
            slug: continent.slug,
            name: translateContinent(t, continent.slug, locale, continent.name),
            href: `/parks/${continent.slug}`,
            totalParkCount: continent.parkCount,
            subtitle: `${continent.countryCount} ${tExplore('stats.country', { count: continent.countryCount })}`,
            // Bare [lat, lng] tuples for every park on the continent — the card computes the
            // distance to the nearest one on the client, once the visitor's position is known.
            parkCoordinates: collectParkCoordinates(continent),
          }))}
          headingAs="h2"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        />
      </PageContainer>
    </RouteMessages>
  );
}
