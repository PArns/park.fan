import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Clock, TrendingUp, Sparkles, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGlobalStats, getGeoLiveStats } from '@/lib/api/analytics';
import { getGeoStructure } from '@/lib/api/discovery';
import { HeroSearchButton } from '@/components/search/hero-search-button';

import type { Metadata } from 'next';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.home' });

  return {
    title: t('title'),
    description: t('description'),
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
      {/* Hero Section */}
      <section className="from-background via-background to-muted/50 relative overflow-hidden bg-gradient-to-br px-4 py-20 md:py-32">
        <div className="from-park-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <div className="relative container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            {tHome('hero.badge')}
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">{tParks('title')}</h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
            {tParks('subtitle')}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/parks/europe">
                {tHome('hero.cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <HeroSearchButton label={tCommon('search')} />
          </div>
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {t('openParks')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.counts.openParks}</div>
                  <p className="text-muted-foreground text-xs">
                    {tCommon('of')} {stats.counts.parks} {tCommon('total')}
                  </p>
                </CardContent>
              </Card>

              {/* Total Attractions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {t('totalAttractions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.counts.attractions.toLocaleString()}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {stats.counts.openAttractions.toLocaleString()} {tCommon('operating')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Grid Layout: Second row - Parks */}
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              {/* Most Crowded Park */}
              {stats.mostCrowdedPark && (
                <Link
                  href={stats.mostCrowdedPark.url.replace('/v1/parks/', '/parks/')}
                  className="group"
                >
                  <Card className="hover:border-primary/50 h-full transition-all hover:shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                          {t('mostCrowded')}
                        </CardTitle>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="group-hover:text-primary mb-1 truncate text-lg font-semibold transition-colors">
                        {stats.mostCrowdedPark.name}
                      </div>
                      <p className="text-muted-foreground mb-2 truncate text-xs">
                        {stats.mostCrowdedPark.city},{' '}
                        {tGeo(`countries.${stats.mostCrowdedPark.countrySlug}` as string)}
                      </p>
                      {/* Wait Time */}
                      <div className="mb-2 flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">
                          {stats.mostCrowdedPark.averageWaitTime} {tCommon('minutes')} Ø
                        </span>
                        <div className="flex items-center gap-1">
                          {stats.mostCrowdedPark.comparedToTypical && (
                            <Badge variant="outline" className="h-5 gap-1 px-1 text-xs">
                              <Activity className="h-3 w-3" />
                              {tCommon(stats.mostCrowdedPark.comparedToTypical)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Operating Attractions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm font-medium">
                            {stats.mostCrowdedPark.operatingAttractions}/
                            {stats.mostCrowdedPark.totalAttractions}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {tCommon('operating')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Least Crowded Park */}
              {stats.leastCrowdedPark && (
                <Link
                  href={stats.leastCrowdedPark.url.replace('/v1/parks/', '/parks/')}
                  className="group"
                >
                  <Card className="hover:border-primary/50 h-full transition-all hover:shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                          {t('leastCrowded')}
                        </CardTitle>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="group-hover:text-primary mb-1 truncate text-lg font-semibold transition-colors">
                        {stats.leastCrowdedPark.name}
                      </div>
                      <p className="text-muted-foreground mb-2 truncate text-xs">
                        {stats.leastCrowdedPark.city},{' '}
                        {tGeo(`countries.${stats.leastCrowdedPark.countrySlug}` as string)}
                      </p>
                      {/* Wait Time */}
                      <div className="mb-2 flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">
                          {stats.leastCrowdedPark.averageWaitTime} {tCommon('minutes')} Ø
                        </span>
                        <div className="flex items-center gap-1">
                          {stats.leastCrowdedPark.comparedToTypical && (
                            <Badge variant="outline" className="h-5 gap-1 px-1 text-xs">
                              <Activity className="h-3 w-3" />
                              {tCommon(stats.leastCrowdedPark.comparedToTypical)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Operating Attractions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm font-medium">
                            {stats.leastCrowdedPark.operatingAttractions}/
                            {stats.leastCrowdedPark.totalAttractions}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {tCommon('operating')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
                  className="group"
                >
                  <Card className="hover:border-primary/50 h-full transition-all hover:shadow-lg">
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
                  className="group"
                >
                  <Card className="hover:border-primary/50 h-full transition-all hover:shadow-lg">
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
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
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
              Real-time park status across {continents.length} continents
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
                    <Card className="hover:border-primary/50 h-full transition-all hover:shadow-lg dark:bg-slate-950">
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
                          <span className="text-park-primary text-2xl font-bold">
                            {continent.openParkCount}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            / {continent.parkCount} {tCommon('open')}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div
                            className="bg-park-primary h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(continent.openParkCount / continent.parkCount) * 100}%`,
                            }}
                          />
                        </div>
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
                <Sparkles className="text-crowd-moderate h-8 w-8" />
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
