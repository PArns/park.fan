import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getContinents } from '@/lib/api/discovery';
import { getGeoLiveStats } from '@/lib/api/analytics';
import { GeoLocationCard } from '@/components/common/geo-location-card';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
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
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/parks`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `/${locale}/parks`,
      languages: {
        en: `/en/parks`,
        de: `/de/parks`,
        nl: `/nl/parks`,
        fr: `/fr/parks`,
        es: `/es/parks`,
      },
    },
  };
}

export const revalidate = 3600; // 1 hour

export default async function ParksPage({ params }: ParksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tExplore = await getTranslations('explore');

  // Fetch continents and live stats
  const [continents, liveStats] = await Promise.all([
    getContinents().catch(() => []),
    getGeoLiveStats().catch(() => null),
  ]);

  const continentItems = continents.map((continent) => {
    // Find live stats for this continent to get the most up-to-date open park count
    const continentStats = liveStats?.continents.find((c) => c.slug === continent.slug);

    return {
      ...continent,
      openParkCount: continentStats?.openParkCount ?? continent.openParkCount ?? 0,
    };
  });

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

  return (
    <PageContainer>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {continentItems.map((continent) => {
          const continentName = t(`continents.${continent.slug}` as string) || continent.name;

          return (
            <GeoLocationCard
              key={continent.slug}
              name={continentName}
              slug={continent.slug}
              href={`/parks/${continent.slug}`}
              openParkCount={continent.openParkCount}
              totalParkCount={continent.parkCount}
              subtitle={`${continent.countryCount} ${tExplore('stats.country', { count: continent.countryCount })}`}
              variant="continent"
            />
          );
        })}
      </div>
    </PageContainer>
  );
}
