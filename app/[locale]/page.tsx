import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Link } from '@/i18n/navigation';
import { Clock, TrendingUp, Sparkles, ChevronRight, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGlobalStats, getGeoLiveStats } from '@/lib/api/analytics';
import { getGeoStructure } from '@/lib/api/discovery';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { ParkCard } from '@/components/parks/park-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { NearbyParksCard } from '@/components/parks/nearby-parks-card';
import { FavoritesSection } from '@/components/parks/favorites-section';
import { HeroBackground } from '@/components/layout/hero-background';
import { OrganizationStructuredData } from '@/components/seo/structured-data';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { FavoriteStar } from '@/components/common/favorite-star';
import { StatsCard } from '@/components/common/stats-card';
import { HERO_IMAGES } from '@/lib/hero-images';

import { getOgImageUrl } from '@/lib/utils/og-image';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.home' });
  const ogImageUrl = getOgImageUrl([locale]);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}`,
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
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        de: '/de',
        nl: '/nl',
        fr: '/fr',
        es: '/es',
        'x-default': '/en',
      },
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('stats');
  const tHome = await getTranslations('home');
  const tParks = await getTranslations('parks');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');
  const tExplore = await getTranslations('explore');

  // Select random hero image server-side
  // eslint-disable-next-line react-hooks/purity
  const randomHeroImage = HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];

  const cookieStore = await cookies();
  const favoritesCookie = cookieStore.get('favorites');
  let initialHasFavorites = false;
  if (favoritesCookie) {
    try {
      const parsed = JSON.parse(favoritesCookie.value);
      initialHasFavorites =
        (Array.isArray(parsed.parks) && parsed.parks.length > 0) ||
        (Array.isArray(parsed.attractions) && parsed.attractions.length > 0) ||
        (Array.isArray(parsed.shows) && parsed.shows.length > 0) ||
        (Array.isArray(parsed.restaurants) && parsed.restaurants.length > 0);
    } catch {
      // Ignore parsing errors
    }
  }

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
      <OrganizationStructuredData />
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <HeroBackground imageSrc={randomHeroImage} />
        <div className="relative container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            {tHome('hero.badge')}
          </Badge>
          <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-6xl">{tParks('title')}</h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
            {tParks('subtitle', {
              parks: stats?.counts.parks ?? 50,
              attractions: stats?.counts.attractions ?? 2000,
              shows: stats?.counts.shows ?? 500,
              restaurants: stats?.counts.restaurants ?? 800,
            })}
          </p>
          <HeroSearchInput placeholder={tHome('hero.searchPlaceholder')} />
        </div>
      </section>

      {/* Favorites Section - Above Nearby Parks */}
      <FavoritesSection initialHasFavorites={initialHasFavorites} />

      {/* Nearby Parks - First section after hero */}
      <section className="border-b px-4 py-8">
        <div className="container mx-auto">
          <NearbyParksCard />
        </div>
      </section>

      {/* Global Stats */}
      {stats && (
        <section className="bg-muted/30 border-b px-4 py-12">
          <div className="container mx-auto">
            <h2 className="mb-8 text-center text-2xl font-semibold">{t('globalStats')}</h2>

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
              {/* Most Crowded Park */}
              {stats.mostCrowdedPark && (
                <ParkCard
                  name={stats.mostCrowdedPark.name}
                  slug={stats.mostCrowdedPark.slug}
                  city={stats.mostCrowdedPark.city}
                  country={tGeo(`countries.${stats.mostCrowdedPark.countrySlug}` as string)}
                  href={stats.mostCrowdedPark.url.replace('/v1/parks/', '/parks/')}
                  status="OPERATING"
                  crowdLevel={stats.mostCrowdedPark.crowdLevel ?? undefined}
                  averageWaitTime={stats.mostCrowdedPark.averageWaitTime ?? undefined}
                  operatingAttractions={stats.mostCrowdedPark.operatingAttractions}
                  totalAttractions={stats.mostCrowdedPark.totalAttractions}
                  parkId={stats.mostCrowdedPark.id}
                />
              )}

              {/* Least Crowded Park */}
              {stats.leastCrowdedPark && (
                <ParkCard
                  name={stats.leastCrowdedPark.name}
                  slug={stats.leastCrowdedPark.slug}
                  city={stats.leastCrowdedPark.city}
                  country={tGeo(`countries.${stats.leastCrowdedPark.countrySlug}` as string)}
                  href={stats.leastCrowdedPark.url.replace('/v1/parks/', '/parks/')}
                  status="OPERATING"
                  crowdLevel={stats.leastCrowdedPark.crowdLevel ?? undefined}
                  averageWaitTime={stats.leastCrowdedPark.averageWaitTime ?? undefined}
                  operatingAttractions={stats.leastCrowdedPark.operatingAttractions}
                  totalAttractions={stats.leastCrowdedPark.totalAttractions}
                  parkId={stats.leastCrowdedPark.id}
                />
              )}
            </div>

            {/* Grid Layout: Third row - Attractions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Longest Wait Ride */}
              {stats.longestWaitRide && (
                <Link
                  href={stats.longestWaitRide.url
                    .replace('/v1/parks/', '/parks/')
                    .replace('/attractions/', '/')}
                  className="group block min-w-0"
                >
                  <Card className="hover:border-primary/50 relative h-full transition-all hover:shadow-lg">
                    {/* Favorite Star */}
                    {stats.longestWaitRide.id && (
                      <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
                        <FavoriteStar type="attraction" id={stats.longestWaitRide.id} />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                          {t('longestWait')}
                        </CardTitle>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="group-hover:text-primary mb-1 truncate text-lg font-semibold transition-colors">
                        {stats.longestWaitRide.name}
                      </div>
                      <p className="text-muted-foreground mb-2 truncate text-xs">
                        {stats.longestWaitRide.parkName} · {stats.longestWaitRide.parkCity},{' '}
                        {tGeo(`countries.${stats.longestWaitRide.parkCountrySlug}` as string) ||
                          stats.longestWaitRide.parkCountry}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <Badge variant="secondary" className="bg-status-down/20 text-status-down">
                          {stats.longestWaitRide.waitTime} {tCommon('minutes')}
                        </Badge>
                        <CrowdLevelBadge
                          level={stats.longestWaitRide.crowdLevel}
                          className="h-5 px-1.5 text-[10px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Shortest Wait Ride */}
              {stats.shortestWaitRide && (
                <Link
                  href={stats.shortestWaitRide.url
                    .replace('/v1/parks/', '/parks/')
                    .replace('/attractions/', '/')}
                  className="group block min-w-0"
                >
                  <Card className="hover:border-primary/50 relative h-full transition-all hover:shadow-lg">
                    {/* Favorite Star */}
                    {stats.shortestWaitRide.id && (
                      <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
                        <FavoriteStar type="attraction" id={stats.shortestWaitRide.id} />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                          {t('shortestWait')}
                        </CardTitle>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="group-hover:text-primary mb-1 truncate text-lg font-semibold transition-colors">
                        {stats.shortestWaitRide.name}
                      </div>
                      <p className="text-muted-foreground mb-2 truncate text-xs">
                        {stats.shortestWaitRide.parkName} · {stats.shortestWaitRide.parkCity},{' '}
                        {tGeo(`countries.${stats.shortestWaitRide.parkCountrySlug}` as string) ||
                          stats.shortestWaitRide.parkCountry}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <Badge
                          variant="secondary"
                          className="bg-status-operating/20 text-status-operating"
                        >
                          {stats.shortestWaitRide.waitTime} {tCommon('minutes')}
                        </Badge>
                        <CrowdLevelBadge
                          level={stats.shortestWaitRide.crowdLevel}
                          className="h-5 px-1.5 text-[10px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
                value={(stats.counts.queueDataRecords / 1000).toFixed(1) + 'k'}
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
              {tCommon('parks')} weltweit - Live Status
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {continents.map((continent) => {
                const continentName =
                  tGeo(`continents.${continent.slug}` as string) || continent.name;

                return (
                  <Link
                    key={continent.slug}
                    href={`/parks/${continent.slug}`}
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
          <h2 className="mb-12 text-center text-2xl font-semibold">{tHome('sections.plan')}</h2>
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
    </div>
  );
}
