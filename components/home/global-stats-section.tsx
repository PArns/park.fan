import { getTranslations } from 'next-intl/server';
import { BarChart3, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/common/stats-card';
import { CompactNumberWithTooltip } from '@/components/common/compact-number-with-tooltip';
import { ParkCard } from '@/components/parks/park-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { getParkBackgroundImage, getAttractionBackgroundImage } from '@/lib/utils/park-assets';

/**
 * Global real-time stats + platform statistics.
 *
 * Both blocks share a single `getGlobalStats` fetch, so they live in one
 * <Suspense> boundary. Rendered server-side (below the fold) and streamed in
 * after the hero — never blocking first paint.
 */
export async function GlobalStatsSection() {
  const [t, tCommon, tGeo, stats] = await Promise.all([
    getTranslations('stats'),
    getTranslations('common'),
    getTranslations('geo'),
    catchNonFatal(getGlobalStats()),
  ]);

  if (!stats) return null;

  return (
    <>
      {/* Global Stats */}
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

      {/* Platform Statistics */}
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
    </>
  );
}
