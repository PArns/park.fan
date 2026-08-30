import { getTranslations, getLocale } from 'next-intl/server';
import { BarChart3, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/common/stats-card';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { CompactNumberWithTooltip } from '@/components/common/compact-number-with-tooltip';
import { GlobalStatsLiveCounts } from '@/components/home/global-stats-live-counts';
import { ParkCard } from '@/components/parks/park-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import {
  getCardObjectPosition,
  getParkBackgroundImage,
  getAttractionBackgroundImage,
} from '@/lib/utils/park-assets';

/**
 * Global real-time stats + platform statistics — server-rendered into the homepage shell.
 *
 * The shell revalidates HOURLY (keeping ISR writes down — see app/[locale]/page.tsx), so the
 * two headline "right now" counts overlay themselves client-side ({@link GlobalStatsLiveCounts},
 * 5-min poll) on top of the baked seed. The highlighted park/ride cards stay fully baked (≤1h
 * stale): they are editorial highlights linking to live park pages, and re-resolving them
 * client-side would need per-park background lookups (a server-only fs resolve via
 * {@link getParkBackgroundImage}/{@link getAttractionBackgroundImage}). While the fetch is
 * pending the homepage <Suspense> shows its skeleton; on error the section is omitted.
 */
export async function GlobalStatsSection() {
  const [t, tCommon, tGeo, tStory, locale] = await Promise.all([
    getTranslations('stats'),
    getTranslations('common'),
    getTranslations('geo'),
    getTranslations('homeStory'),
    getLocale(),
  ]);
  const stats = await catchNonFatal(getGlobalStats());
  if (!stats) return null;

  const nowIso = new Date().toISOString();

  return (
    <>
      {/* Global Stats */}
      <section className="bg-muted/30 border-border border-t px-4 py-16 sm:py-18">
        <div className="container mx-auto">
          {/* The evidence for the six reasons above it, so it opens like every
            other chapter on this page rather than with a header of its own. */}
          <ChapterHeading
            variant="tile"
            icon={BarChart3}
            kicker={tStory('platform.statsKicker')}
            title={t('globalStats')}
            hint={t('globalStatsIntro')}
            id="zahlen"
          />

          {/* First row — the two headline "right now" counts, live via client overlay */}
          <GlobalStatsLiveCounts
            initialCounts={stats.counts}
            locale={locale}
            labels={{
              openParks: t('openParks'),
              of: tCommon('of'),
              total: tCommon('total'),
              totalAttractions: t('totalAttractions'),
              operating: tCommon('operating'),
            }}
          />

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
                  objectPosition={getCardObjectPosition(stats.mostCrowdedPark.slug)}
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
                  objectPosition={getCardObjectPosition(stats.leastCrowdedPark.slug)}
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
                  backgroundImage={getAttractionBackgroundImage(
                    stats.longestWaitRide.parkSlug,
                    stats.longestWaitRide.slug
                  )}
                  objectPosition={getCardObjectPosition(
                    stats.longestWaitRide.parkSlug,
                    stats.longestWaitRide.slug
                  )}
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
                          timestamp: nowIso,
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
                  backgroundImage={getAttractionBackgroundImage(
                    stats.shortestWaitRide.parkSlug,
                    stats.shortestWaitRide.slug
                  )}
                  objectPosition={getCardObjectPosition(
                    stats.shortestWaitRide.parkSlug,
                    stats.shortestWaitRide.slug
                  )}
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
                          timestamp: nowIso,
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
      <section className="px-4 py-16 sm:py-18">
        <div className="container mx-auto">
          <ChapterHeading
            variant="tile"
            icon={Database}
            kicker={tStory('platform.kicker')}
            title={t('platformStats')}
            hint={t('platformStatsDescription')}
          />

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
