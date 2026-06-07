import { getTranslations, setRequestLocale } from 'next-intl/server';
import { translateContinent } from '@/lib/i18n/helpers';
import { generateAlternateLanguages } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getContinents } from '@/lib/api/discovery';
import { catchNonFatal } from '@/lib/api/client';
import { LiveContinentCards } from '@/components/parks/live-continent-cards';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { ItemListStructuredData } from '@/components/seo/structured-data';
import { getOgImageUrl } from '@/lib/utils/og-image';
import type { Metadata } from 'next';

interface ParksPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ParksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.parks' });

  const ogImageUrl = getOgImageUrl([locale, 'parks']);

  return {
    title: t('title'),
    description: t('description'),
    ...buildOpenGraphMetadata({
      locale,
      title: t('title'),
      description: t('description'),
      url: `https://park.fan/${locale}/parks`,
      ogImageUrl,
    }),
    alternates: {
      canonical: `https://park.fan/${locale}/parks`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/parks`),
        'x-default': 'https://park.fan/en/parks',
      },
    },
  };
}

export default async function ParksPage({ params }: ParksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tExplore = await getTranslations('explore');

  // Structure only — live open-park counts are NOT read here. Baking getGeoLiveStats() into this
  // server render pinned the (6-locale) /parks shell to a 10-min ISR-write cadence; instead the grid
  // overlays the live counts on the client via <LiveContinentCards> (shared useGeoLiveStats batch),
  // exactly like the continent page's country cards, so the shell can revalidate daily.
  const continents = await catchNonFatal(getContinents()).then((r) => r ?? []);

  const continentItems = continents.map((continent) => ({
    ...continent,
    openParkCount: continent.openParkCount ?? 0,
  }));

  // Calculate totals
  const totalParks = continentItems.reduce((sum, c) => sum + c.parkCount, 0);
  const totalCountries = continentItems.reduce((sum, c) => sum + c.countryCount, 0);
  const totalOpenParks = continentItems.reduce((sum, c) => sum + (c.openParkCount || 0), 0);

  // Generate breadcrumbs using the helper if available, or manually
  // Using manual construction here as it's a top level page below home
  const tCommon = await getTranslations('common');

  // Note: We don't have a specific breadcrumb utility for the /parks root page exposed
  // in the same way as continents, but we can construct it easily.
  const breadcrumbs = [{ name: tCommon('home'), url: '/' }];

  const tNav = await getTranslations('navigation');

  const itemListItems = continentItems.map((continent) => {
    const name = translateContinent(t, continent.slug, locale, continent.name);
    return { name, url: `/${locale}/parks/${continent.slug}` };
  });

  return (
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
              {totalOpenParks} {t('open')}
            </span>{' '}
            / {totalParks} {tExplore('stats.park', { count: totalParks })} • {totalCountries}{' '}
            {tExplore('stats.country', { count: totalCountries })}
          </>
        }
      />

      <LiveContinentCards
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        continents={continentItems.map((continent) => ({
          slug: continent.slug,
          name: translateContinent(t, continent.slug, locale, continent.name),
          href: `/parks/${continent.slug}`,
          totalParkCount: continent.parkCount,
          subtitle: `${continent.countryCount} ${tExplore('stats.country', { count: continent.countryCount })}`,
        }))}
        seedOpenParkCount={Object.fromEntries(
          continentItems.map((continent) => [continent.slug, continent.openParkCount])
        )}
      />
    </PageContainer>
  );
}
