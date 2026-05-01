import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, locales } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { Link } from '@/i18n/navigation';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';
import {
  Clock,
  TrendingUp,
  ChevronRight,
  Map as MapIcon,
  BookOpen,
  Tag,
  BarChart3,
  Database,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getGlobalStats, getGeoLiveStats, getTickerData } from '@/lib/api/analytics';
import { LiveWaitTicker } from '@/components/home/live-wait-ticker';
import { getGeoStructure } from '@/lib/api/discovery';

import nextDynamic from 'next/dynamic';
import { HeroBackground } from '@/components/layout/hero-background';
import { HERO_IMAGES } from '@/lib/hero-images';
import { HomepageFAQStructuredData } from '@/components/seo/homepage-faq-structured-data';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { GlassCard } from '@/components/common/glass-card';
import { translateGeoSlug } from '@/lib/utils/geo-translate';

const LocationBanner = nextDynamic(
  () => import('@/components/common/location-banner').then((m) => ({ default: m.LocationBanner })),
  { loading: () => null, ssr: true }
);

const FavoritesSection = nextDynamic(
  () =>
    import('@/components/parks/favorites-section').then((m) => ({ default: m.FavoritesSection })),
  { loading: () => null, ssr: true }
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
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { ParkCard } from '@/components/parks/park-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import { getParkBackgroundImage, getAttractionBackgroundImage } from '@/lib/utils/park-assets';
import { HeroImageInfo } from '@/components/layout/hero-image-info';
import { HERO_IMAGE_META } from '@/lib/hero-images-meta';
import { HeroWithNearby } from '@/components/home/hero-with-nearby';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { FeaturedParksSectionClient } from '@/components/home/featured-parks-section-client';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';

import { getOgImageUrl } from '@/lib/utils/og-image';
import { GlossaryInject } from '@/components/glossary/glossary-inject';

import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
  const glossaryPath = '/' + GLOSSARY_SEGMENTS[locale as Locale];

  const t = await getTranslations('stats');
  const tHome = await getTranslations('home');
  const tParks = await getTranslations('parks');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');
  const tExplore = await getTranslations('explore');

  // eslint-disable-next-line react-hooks/purity -- intentional per-request randomization
  const randomHeroImage = HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];

  // Fetch data in parallel (ML dashboard fetched inside MLStatsSection to keep Suspense boundaries clean)
  const [stats, geoData, liveStats, tickerData] = await Promise.all([
    getGlobalStats().catch(() => null),
    getGeoStructure(300).catch(() => null),
    getGeoLiveStats().catch(() => null),
    getTickerData().catch(() => null),
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
      {/* Preload LCP image — React 19 hoists <link> to <head> from Server Components */}
      <link rel="preload" as="image" href="/logo-big.svg" />
      <HomepageFAQStructuredData />
      {/* Hero Section – static default; when user is in a park (nearby), shows "Willkommen im [Park]" + park info */}
      <section className="relative isolate -mt-14 overflow-hidden px-6 pt-14 pb-14 sm:pb-20 md:pt-28 md:pb-24 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center lg:pt-16 lg:pb-24">
        <HeroBackground imageSrc={randomHeroImage} />
        <div className="relative container mx-auto">
          <div className="flex flex-col">
            {/* Row 1: Logo left + Title/Description right */}
            <GlassCard className="mx-auto flex w-full max-w-5xl flex-col items-center border-white/20 bg-white/25 px-4 py-4 shadow-2xl sm:py-6 lg:flex-row lg:items-center lg:gap-8 lg:py-8 lg:pr-8 lg:pl-4 dark:border-white/10 dark:bg-black/40">
              {/* Logo – light/dark variant based on theme */}
              <div className="relative hidden h-20 w-20 shrink-0 sm:block sm:h-36 sm:w-36 lg:h-64 lg:w-64">
                {/* SVGs don't benefit from next/image optimization — use <img> directly */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-big.svg"
                  alt="park.fan"
                  fetchPriority="high"
                  className="h-full w-full object-contain dark:hidden"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-big-dark.svg"
                  alt="park.fan"
                  className="hidden h-full w-full object-contain dark:block"
                />
              </div>
              {/* Title + Description + Search + Links */}
              <div className="w-full min-w-0 text-center lg:max-w-none lg:flex-1">
                <HeroWithNearby
                  searchPlaceholder={tHome('hero.searchPlaceholder')}
                  hideSearch
                  titleSlot={<GlossaryInject noUnderline>{tParks('title')}</GlossaryInject>}
                  introSlot={<GlossaryInject>{tHome('intro')}</GlossaryInject>}
                />
                <HeroSearchInput
                  placeholder={tHome('hero.searchPlaceholder')}
                  className="mt-5 w-full"
                />
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/howto" prefetch={false}>
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      {tHome('hero.howto')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href={glossaryPath} prefetch={false}>
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      {tHome('hero.glossary')}
                    </Link>
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Hero image attribution – park, city, country (+ attraction & area if known) */}
        {HERO_IMAGE_META[randomHeroImage] && (
          <HeroImageInfo meta={HERO_IMAGE_META[randomHeroImage]} />
        )}

        {/* Live wait times ticker */}
        {tickerData && tickerData.items.length > 0 && (
          <div className="absolute right-0 bottom-0 left-0">
            <LiveWaitTicker initialItems={tickerData.items} />
          </div>
        )}
      </section>

      {/* Announcement Section */}
      <AnnounceSection locale={locale} />

      {/* Location banner: not for snippet/indexing (data-nosnippet); show when user has not granted location */}
      <LocationBanner />

      {/* Nearby / In-Park – primary focus: nearest open park or quick park navigation when in park */}
      <section className="px-4 py-8">
        <div className="container mx-auto">
          <NearbyParksCard />
        </div>
      </section>

      {/* Favorites Section */}
      <FavoritesSection />

      {/* Featured Parks – locale-aware, direct park links for SEO */}
      <FeaturedParksSectionClient
        headingText={tHome('sections.featuredParks')}
        introText={tHome('sections.featuredParksIntro')}
        ctaText={tHome('hero.cta')}
        initialParks={extractFeaturedParks(geoData, locale as string)}
      />

      {/* Global Stats */}
      {stats && (
        <section className="bg-muted/30 px-4 py-12">
          <div className="container mx-auto">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="text-primary h-5 w-5" />
              <h2 className="text-xl font-bold">{t('globalStats')}</h2>
            </div>
            <p className="text-muted-foreground mb-8 text-sm">{t('globalStatsIntro')}</p>

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
                <div className="grid [grid-template-rows:auto_auto_1fr_auto] gap-4">
                  <h3 className="text-muted-foreground text-sm font-medium">{t('mostCrowded')}</h3>
                  <ParkCard
                    name={stats.mostCrowdedPark.name}
                    slug={stats.mostCrowdedPark.slug}
                    parkId={stats.mostCrowdedPark.id}
                    city={stats.mostCrowdedPark.city}
                    country={translateGeoSlug(
                      tGeo,
                      'countries',
                      stats.mostCrowdedPark.countrySlug,
                      stats.mostCrowdedPark.country
                    )}
                    href={convertApiUrlToFrontendUrl(stats.mostCrowdedPark.url) as '/'}
                    backgroundImage={getParkBackgroundImage(stats.mostCrowdedPark.slug)}
                    status="OPERATING"
                    timezone={stats.mostCrowdedPark.timezone}
                    crowdLevel={stats.mostCrowdedPark.crowdLevel ?? undefined}
                    averageWaitTime={stats.mostCrowdedPark.averageWaitTime ?? undefined}
                    operatingAttractions={stats.mostCrowdedPark.operatingAttractions}
                    totalAttractions={stats.mostCrowdedPark.totalAttractions}
                  />
                </div>
              )}
              {stats.leastCrowdedPark && (
                <div className="grid [grid-template-rows:auto_auto_1fr_auto] gap-4">
                  <h3 className="text-muted-foreground text-sm font-medium">{t('leastCrowded')}</h3>
                  <ParkCard
                    name={stats.leastCrowdedPark.name}
                    slug={stats.leastCrowdedPark.slug}
                    parkId={stats.leastCrowdedPark.id}
                    city={stats.leastCrowdedPark.city}
                    country={translateGeoSlug(
                      tGeo,
                      'countries',
                      stats.leastCrowdedPark.countrySlug,
                      stats.leastCrowdedPark.country
                    )}
                    href={convertApiUrlToFrontendUrl(stats.leastCrowdedPark.url) as '/'}
                    backgroundImage={getParkBackgroundImage(stats.leastCrowdedPark.slug)}
                    status="OPERATING"
                    timezone={stats.leastCrowdedPark.timezone}
                    crowdLevel={stats.leastCrowdedPark.crowdLevel ?? undefined}
                    averageWaitTime={stats.leastCrowdedPark.averageWaitTime ?? undefined}
                    operatingAttractions={stats.leastCrowdedPark.operatingAttractions}
                    totalAttractions={stats.leastCrowdedPark.totalAttractions}
                  />
                </div>
              )}
            </div>

            {/* Grid Layout: Third row - Attractions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.longestWaitRide && (
                <div className="grid [grid-template-rows:auto_auto_1fr_auto] gap-4">
                  <h3 className="text-muted-foreground text-sm font-medium">{t('longestWait')}</h3>
                  <AttractionCard
                    parkStatus="OPERATING"
                    showParkName
                    backgroundImage={
                      getAttractionBackgroundImage(
                        stats.longestWaitRide.parkSlug,
                        stats.longestWaitRide.slug
                      ) ?? getParkBackgroundImage(stats.longestWaitRide.parkSlug)
                    }
                    attraction={{
                      id: stats.longestWaitRide.id,
                      name: stats.longestWaitRide.name,
                      slug: stats.longestWaitRide.slug,
                      url: convertApiUrlToFrontendUrl(stats.longestWaitRide.url),
                      latitude: null,
                      longitude: null,
                      crowdLevel: stats.longestWaitRide.crowdLevel ?? undefined,
                      queues: [
                        {
                          queueType: 'STANDBY',
                          waitTime: stats.longestWaitRide.waitTime,
                          status: 'OPERATING',
                        },
                      ],
                      statistics: stats.longestWaitRide.sparkline.length
                        ? {
                            avgWaitToday: stats.longestWaitRide.avgWaitToday,
                            minWaitToday: stats.longestWaitRide.minWaitToday,
                            peakWaitToday: stats.longestWaitRide.peakWaitToday,
                            peakWaitTimestamp: stats.longestWaitRide.peakWaitTimestamp,
                            typicalWaitThisHour: stats.longestWaitRide.typicalWaitThisHour,
                            percentile95ThisHour: null,
                            currentVsTypical: stats.longestWaitRide.currentVsTypical,
                            dataPoints: stats.longestWaitRide.sparkline.length,
                            history: stats.longestWaitRide.sparkline,
                            timestamp: new Date().toISOString(),
                          }
                        : undefined,
                      park: {
                        id: '',
                        name: stats.longestWaitRide.parkName,
                        slug: stats.longestWaitRide.parkSlug,
                        timezone: stats.longestWaitRide.parkTimezone,
                        continent: null,
                        country: stats.longestWaitRide.parkCountrySlug,
                        city: stats.longestWaitRide.parkCity,
                      },
                    }}
                  />
                </div>
              )}
              {stats.shortestWaitRide && (
                <div className="grid [grid-template-rows:auto_auto_1fr_auto] gap-4">
                  <h3 className="text-muted-foreground text-sm font-medium">{t('shortestWait')}</h3>
                  <AttractionCard
                    parkStatus="OPERATING"
                    showParkName
                    backgroundImage={
                      getAttractionBackgroundImage(
                        stats.shortestWaitRide.parkSlug,
                        stats.shortestWaitRide.slug
                      ) ?? getParkBackgroundImage(stats.shortestWaitRide.parkSlug)
                    }
                    attraction={{
                      id: stats.shortestWaitRide.id,
                      name: stats.shortestWaitRide.name,
                      slug: stats.shortestWaitRide.slug,
                      url: convertApiUrlToFrontendUrl(stats.shortestWaitRide.url),
                      latitude: null,
                      longitude: null,
                      crowdLevel: stats.shortestWaitRide.crowdLevel ?? undefined,
                      queues: [
                        {
                          queueType: 'STANDBY',
                          waitTime: stats.shortestWaitRide.waitTime,
                          status: 'OPERATING',
                        },
                      ],
                      statistics: stats.shortestWaitRide.sparkline.length
                        ? {
                            avgWaitToday: stats.shortestWaitRide.avgWaitToday,
                            minWaitToday: stats.shortestWaitRide.minWaitToday,
                            peakWaitToday: stats.shortestWaitRide.peakWaitToday,
                            peakWaitTimestamp: stats.shortestWaitRide.peakWaitTimestamp,
                            typicalWaitThisHour: stats.shortestWaitRide.typicalWaitThisHour,
                            percentile95ThisHour: null,
                            currentVsTypical: stats.shortestWaitRide.currentVsTypical,
                            dataPoints: stats.shortestWaitRide.sparkline.length,
                            history: stats.shortestWaitRide.sparkline,
                            timestamp: new Date().toISOString(),
                          }
                        : undefined,
                      park: {
                        id: '',
                        name: stats.shortestWaitRide.parkName,
                        slug: stats.shortestWaitRide.parkSlug,
                        timezone: stats.shortestWaitRide.parkTimezone,
                        continent: null,
                        country: stats.shortestWaitRide.parkCountrySlug,
                        city: stats.shortestWaitRide.parkCity,
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Platform Statistics */}
      {stats && (
        <section className="px-4 py-12">
          <div className="container mx-auto">
            <div className="mb-2 flex items-center gap-2">
              <Database className="text-primary h-5 w-5" />
              <h2 className="text-xl font-bold">{t('platformStats')}</h2>
            </div>
            <p className="text-muted-foreground mb-8 text-sm">{t('platformStatsDescription')}</p>

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
      {/* ML / AI Stats */}
      <MLStatsSection />

      {/* Live Activity - Parks Open Now */}
      {continents.length > 0 && (
        <section className="px-4 py-12">
          <div className="container mx-auto">
            <div className="mb-2 flex items-center gap-2">
              <Globe className="text-primary h-5 w-5" />
              <h2 className="text-xl font-bold">{tHome('sections.liveNow')}</h2>
            </div>
            <p className="text-muted-foreground mb-8 text-sm">{tHome('sections.liveNowIntro')}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {continents.map((continent) => {
                const continentName = translateGeoSlug(
                  tGeo,
                  'continents',
                  continent.slug,
                  continent.name
                );

                return (
                  <Link
                    key={continent.slug}
                    href={`/parks/${continent.slug}`}
                    prefetch={false}
                    className="group block"
                  >
                    <Card className="bg-muted/50 hover:bg-muted/70 border-border hover:border-primary/50 h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
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
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            <h2 className="text-xl font-bold">
              <GlossaryInject>{tHome('sections.plan')}</GlossaryInject>
            </h2>
          </div>
          <p className="text-muted-foreground mb-12 text-sm leading-relaxed">
            <GlossaryInject>{tHome('sections.featuresIntro')}</GlossaryInject>
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-crowd-very-low/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <Clock className="text-crowd-very-low h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                <GlossaryInject>{tHome('features.realtime.title')}</GlossaryInject>
              </h3>
              <p className="text-muted-foreground text-sm">
                <GlossaryInject>{tHome('features.realtime.description')}</GlossaryInject>
              </p>
            </div>
            <div className="text-center">
              <div className="bg-park-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <TrendingUp className="text-park-primary h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                <GlossaryInject>{tHome('features.ml.title')}</GlossaryInject>
              </h3>
              <p className="text-muted-foreground text-sm">
                <GlossaryInject>{tHome('features.ml.description')}</GlossaryInject>
              </p>
            </div>
            <div className="text-center">
              <div className="bg-crowd-moderate/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <MapIcon className="text-crowd-moderate h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                <GlossaryInject>{tHome('features.calendar.title')}</GlossaryInject>
              </h3>
              <p className="text-muted-foreground text-sm">
                <GlossaryInject>{tHome('features.calendar.description')}</GlossaryInject>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section – editorial content for SEO word count */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-6 flex items-center gap-2">
            <BookOpen className="text-primary h-5 w-5" />
            <h2 className="text-xl font-bold">{tHome('about.title')}</h2>
          </div>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            <GlossaryInject>{tHome('about.p1')}</GlossaryInject>
          </p>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            <GlossaryInject>{tHome('about.p2')}</GlossaryInject>
          </p>

          <h3 className="mb-4 text-xl font-semibold">{tHome('about.coverageTitle')}</h3>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            <GlossaryInject>{tHome('about.p3')}</GlossaryInject>
          </p>

          <h3 className="mb-4 text-xl font-semibold">{tHome('about.howTitle')}</h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            <GlossaryInject>{tHome('about.p4')}</GlossaryInject>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <GlossaryInject>{tHome('about.p5')}</GlossaryInject>
          </p>

          <div className="mt-8">
            <Link
              href="/howto"
              prefetch={false}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
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
