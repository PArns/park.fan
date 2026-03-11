import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { Link } from '@/i18n/navigation';
import { Clock, TrendingUp, ChevronRight, Map as MapIcon, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGlobalStats, getGeoLiveStats } from '@/lib/api/analytics';
import { getGeoStructure } from '@/lib/api/discovery';

import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { HeroBackground } from '@/components/layout/hero-background';
import { HERO_IMAGES } from '@/lib/hero-images';
import { HomepageFAQStructuredData } from '@/components/seo/homepage-faq-structured-data';
import { OpenStatusProgress } from '@/components/common/open-status-progress';

const LocationBanner = nextDynamic(
  () => import('@/components/common/location-banner').then((m) => ({ default: m.LocationBanner })),
  { loading: () => null, ssr: true }
);

const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({ default: m.FavoritesSection })),
  {
    loading: () => (
      <section className="border-b px-4 py-8">
        <div className="container mx-auto">
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
        </div>
      </section>
    ),
    ssr: true,
  }
);

const NearbyParksCard = nextDynamic(
  () =>
    import('@/components/parks/nearby-parks-card').then((m) => ({ default: m.NearbyParksCard })),
  {
    loading: () => (
      <section className="bg-card min-h-[200px] rounded-xl border py-4">
        <div className="bg-muted mx-4 h-40 animate-pulse rounded-lg" />
      </section>
    ),
    ssr: true,
  }
);
import { StatsCard } from '@/components/common/stats-card';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { CompactNumberWithTooltip } from '@/components/common/compact-number-with-tooltip';
import { AnnounceSection } from '@/components/home/announce-section';
import { ParkStatCard } from '@/components/home/park-stat-card';
import { AttractionStatCard } from '@/components/home/attraction-stat-card';
import { ScrollIndicator } from '@/components/home/scroll-indicator';
import { HeroWithNearby } from '@/components/home/hero-with-nearby';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { FeaturedParksSection } from '@/components/home/featured-parks-section';

import { getOgImageUrl } from '@/lib/utils/og-image';

import type { Metadata } from 'next';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.home' });
  const ogImageUrl = getOgImageUrl([locale]);

  const fullTitle = `${t('title')} | park.fan`;

  return {
    title: { absolute: fullTitle },
    description: t('description'),
    ...buildOpenGraphMetadata({
      locale,
      title: fullTitle,
      description: t('description'),
      url: `https://park.fan/${locale}`,
      ogImageUrl,
    }),
    alternates: {
      canonical: `https://park.fan/${locale}`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}`),
        'x-default': 'https://park.fan/en',
      },
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('stats');
  const tHome = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');
  const tExplore = await getTranslations('explore');

  // eslint-disable-next-line react-hooks/purity -- intentional per-request randomization
  const randomHeroImage = HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];

  // Fetch data in parallel
  const [stats, geoData, liveStats] = await Promise.all([
    getGlobalStats().catch(() => null),
    getGeoStructure().catch(() => null),
    getGeoLiveStats().catch(() => null),
  ]);

  const continents =
    geoData?.continents.map((continent) => {
      const liveContinent = liveStats?.continents.find((c) => c.slug === continent.slug);
      return {
        ...continent,
        openParkCount: liveContinent?.openParkCount ?? continent.openParkCount,
      };
    }) || [];

  return (
    <div className="flex flex-col">
      <HomepageFAQStructuredData />
      {/* Hero Section – static default; when user is in a park (nearby), shows "Willkommen im [Park]" + park info */}
      <section className="relative isolate -mt-16 overflow-hidden px-4 pt-16 pb-16 sm:pb-20 md:pt-28 md:pb-24 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:pt-16 lg:pb-24">
        <HeroBackground imageSrc={randomHeroImage} />
        <div className="relative container mx-auto">
          <div className="flex flex-col">
            {/* Row 1: Logo left + Title/Description right */}
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center rounded-2xl bg-white/50 px-6 py-8 shadow-2xl backdrop-blur-md lg:mb-16 lg:flex-row lg:items-center lg:px-12 lg:py-10 dark:bg-black/40">
              {/* Logo – light/dark variant based on theme */}
              <div className="relative h-36 w-36 shrink-0 lg:h-72 lg:w-72">
                <Image
                  src="/logo-big.svg"
                  alt="park.fan"
                  fill
                  className="object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/logo-big-dark.svg"
                  alt="park.fan"
                  fill
                  className="hidden object-contain dark:block"
                  priority
                />
              </div>
              {/* Title + Description only (search rendered separately below) */}
              <div className="min-w-0 text-center lg:max-w-2xl">
                <HeroWithNearby searchPlaceholder={tHome('hero.searchPlaceholder')} hideSearch />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Search bar centered */}
        <HeroSearchInput placeholder={tHome('hero.searchPlaceholder')} howtoLabel={tHome('hero.howto')} />

        {/* Scroll indicator – desktop fullscreen only, fades out on scroll */}
        <ScrollIndicator />
      </section>

      {/* Announcement Section */}
      <AnnounceSection locale={locale} />

      {/* Location banner: not for snippet/indexing (data-nosnippet); show when user has not granted location */}
      <section
        className="border-b px-4 py-4"
        aria-label={tCommon('locationBannerLabel')}
        data-nosnippet
        data-noindex
      >
        <div className="container mx-auto">
          <LocationBanner />
        </div>
      </section>

      {/* Nearby / In-Park – primary focus: nearest open park or quick park navigation when in park */}
      <section className="border-b px-4 py-8">
        <div className="container mx-auto">
          <NearbyParksCard />
        </div>
      </section>

      {/* Favorites Section */}
      <FavoritesSection />

      {/* Featured Parks – locale-aware, direct park links for SEO */}
      <FeaturedParksSection locale={locale} geoData={geoData} />

      {/* Global Stats */}
      {stats && (
        <section className="bg-muted/30 border-b px-4 py-12">
          <div className="container mx-auto">
            <h2 className="mb-2 text-center text-2xl font-semibold">{t('globalStats')}</h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              {t('globalStatsIntro')}
            </p>

            {/* Grid Layout: First row - 2 static cards */}
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              {/* Open Parks */}
              <StatsCard
                title={t('openParks')}
                value={stats.counts.openParks}
                description={
                  <>
                    {tCommon('of')} {stats.counts.parks} {tCommon('total')}
                  </>
                }
              />

              {/* Total Attractions */}
              <StatsCard
                title={t('totalAttractions')}
                value={stats.counts.attractions.toLocaleString()}
                description={
                  <>
                    {stats.counts.openAttractions.toLocaleString()} {tCommon('operating')}
                  </>
                }
              />
            </div>

            {/* Grid Layout: Second row - Parks */}
            <div className="mb-3 grid gap-4 sm:grid-cols-2">
              {stats.mostCrowdedPark && (
                <ParkStatCard
                  label={t('mostCrowded')}
                  variant="high"
                  park={{
                    ...stats.mostCrowdedPark,
                    url: convertApiUrlToFrontendUrl(stats.mostCrowdedPark.url),
                    countryName: tGeo(`countries.${stats.mostCrowdedPark.countrySlug}` as string),
                  }}
                />
              )}
              {stats.leastCrowdedPark && (
                <ParkStatCard
                  label={t('leastCrowded')}
                  park={{
                    ...stats.leastCrowdedPark,
                    url: convertApiUrlToFrontendUrl(stats.leastCrowdedPark.url),
                    countryName: tGeo(`countries.${stats.leastCrowdedPark.countrySlug}` as string),
                  }}
                />
              )}
            </div>

            {/* Grid Layout: Third row - Attractions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.longestWaitRide && (
                <AttractionStatCard
                  label={t('longestWait')}
                  variant="high"
                  attraction={{
                    ...stats.longestWaitRide,
                    url: convertApiUrlToFrontendUrl(stats.longestWaitRide.url),
                    countryName:
                      tGeo(`countries.${stats.longestWaitRide.parkCountrySlug}` as string) ||
                      stats.longestWaitRide.parkCountry,
                  }}
                />
              )}
              {stats.shortestWaitRide && (
                <AttractionStatCard
                  label={t('shortestWait')}
                  variant="low"
                  attraction={{
                    ...stats.shortestWaitRide,
                    url: convertApiUrlToFrontendUrl(stats.shortestWaitRide.url),
                    countryName:
                      tGeo(`countries.${stats.shortestWaitRide.parkCountrySlug}` as string) ||
                      stats.shortestWaitRide.parkCountry,
                  }}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Platform Statistics */}
      {stats && (
        <section className="border-b px-4 py-12">
          <div className="container mx-auto">
            <h2 className="mb-2 text-center text-2xl font-semibold">{t('platformStats')}</h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              {t('platformStatsDescription')}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Total Wait Time */}
              {stats.counts.totalWaitTime != null && (
                <StatsCard
                  title={t('totalWaitTime')}
                  value={stats.counts.totalWaitTime.toLocaleString()}
                  description={
                    <>
                      {tCommon('minutes')} · ~{Math.round(stats.counts.totalWaitTime / 60)}{' '}
                      {tCommon('hours')}
                    </>
                  }
                />
              )}

              {/* Queue Data Records */}
              <StatsCard
                title={t('dataPoints')}
                value={<CompactNumberWithTooltip value={stats.counts.queueDataRecords} />}
                description={t('queueDataRecords')}
              />

              {/* Shows & Restaurants */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {t('alsoTracking')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.counts.shows}</span>
                    <span className="text-muted-foreground text-sm">{tCommon('shows')}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.counts.restaurants}</span>
                    <span className="text-muted-foreground text-sm">{tCommon('restaurants')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}
      {/* Live Activity - Parks Open Now */}
      {continents.length > 0 && (
        <section className="border-b px-4 py-12">
          <div className="container mx-auto">
            <h2 className="mb-2 text-center text-2xl font-semibold">{tHome('sections.liveNow')}</h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              {tHome('sections.liveNowIntro')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {continents.map((continent) => {
                const continentName =
                  tGeo(`continents.${continent.slug}` as string) || continent.name;

                return (
                  <Link
                    key={continent.slug}
                    href={`/parks/${continent.slug}`}
                    prefetch={false}
                    className="group block"
                  >
                    <Card className="bg-muted/50 hover:bg-muted/70 border-border hover:border-primary/50 h-full transition-all hover:shadow-lg">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium">{continentName}</CardTitle>
                          <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {continent.countryCount}{' '}
                          {tExplore('stats.country', { count: continent.countryCount })}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 flex items-baseline gap-2">
                          <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-3xl font-bold text-transparent">
                            {continent.openParkCount}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            / {continent.parkCount}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <OpenStatusProgress
                          openCount={continent.openParkCount}
                          totalCount={continent.parkCount}
                          showLabel={false}
                        />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="bg-muted/30 border-t px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-2 text-center text-2xl font-semibold">{tHome('sections.plan')}</h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-center text-sm leading-relaxed">
            {tHome('sections.featuresIntro')}
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-crowd-very-low/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <Clock className="text-crowd-very-low h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{tHome('features.realtime.title')}</h3>
              <p className="text-muted-foreground text-sm">
                {tHome('features.realtime.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="bg-park-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <TrendingUp className="text-park-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{tHome('features.ml.title')}</h3>
              <p className="text-muted-foreground text-sm">{tHome('features.ml.description')}</p>
            </div>
            <div className="text-center">
              <div className="bg-crowd-moderate/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <MapIcon className="text-crowd-moderate h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{tHome('features.calendar.title')}</h3>
              <p className="text-muted-foreground text-sm">
                {tHome('features.calendar.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section – editorial content for SEO word count */}
      <section className="border-t px-4 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-semibold">{tHome('about.title')}</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">{tHome('about.p1')}</p>
          <p className="text-muted-foreground mb-10 leading-relaxed">{tHome('about.p2')}</p>

          <h3 className="mb-4 text-xl font-semibold">{tHome('about.coverageTitle')}</h3>
          <p className="text-muted-foreground mb-10 leading-relaxed">{tHome('about.p3')}</p>

          <h3 className="mb-4 text-xl font-semibold">{tHome('about.howTitle')}</h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">{tHome('about.p4')}</p>
          <p className="text-muted-foreground leading-relaxed">{tHome('about.p5')}</p>

          <div className="mt-8">
            <Link
              href="/howto"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4" />
              {tHome('about.howtoLink')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
