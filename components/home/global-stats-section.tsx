import type { ReactNode } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/common/stats-card';
import {
  getSectionHeadingLabels,
  GlobalStatsHeading,
  PlatformStatsHeading,
} from '@/components/home/section-headings';
import { STORY_SECTION, STORY_SECTION_TINTED } from '@/components/home/story/section-chrome';
import { CompactNumberWithTooltip } from '@/components/common/compact-number-with-tooltip';
import { GlobalStatsLiveCounts } from '@/components/home/global-stats-live-counts';
import { ParkCard } from '@/components/parks/park-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { getGlobalStats } from '@/lib/api/analytics';
import { catchNonFatal } from '@/lib/api/client';
import type { AttractionStatsItem, ParkStatsItem } from '@/lib/api/types';
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
  const [t, tCommon, tGeo, locale, headingLabels] = await Promise.all([
    getTranslations('stats'),
    getTranslations('common'),
    getTranslations('geo'),
    getLocale(),
    getSectionHeadingLabels(),
  ]);
  const stats = await catchNonFatal(getGlobalStats());
  if (!stats) return null;

  const nowIso = new Date().toISOString();

  return (
    <>
      {/* Global Stats */}
      <section className={STORY_SECTION_TINTED}>
        <div className="container mx-auto">
          {/* The evidence for the six reasons above it, so it opens like every
            other chapter on this page rather than with a header of its own.
            Shared with GlobalStatsSkeleton, which mounts the same node — see
            components/home/section-headings.tsx. */}
          <GlobalStatsHeading labels={headingLabels} />

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
              <ParkHighlight title={t('mostCrowded')} park={stats.mostCrowdedPark} tGeo={tGeo} />
            )}
            {stats.leastCrowdedPark && (
              <ParkHighlight title={t('leastCrowded')} park={stats.leastCrowdedPark} tGeo={tGeo} />
            )}
          </div>

          {/* Grid Layout: Third row - Attractions */}
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.longestWaitRide && (
              <RideHighlight
                title={t('longestWait')}
                ride={stats.longestWaitRide}
                nowIso={nowIso}
              />
            )}
            {stats.shortestWaitRide && (
              <RideHighlight
                title={t('shortestWait')}
                ride={stats.shortestWaitRide}
                nowIso={nowIso}
              />
            )}
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className={STORY_SECTION}>
        <div className="container mx-auto">
          <PlatformStatsHeading labels={headingLabels} />

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

function HighlightCell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid [grid-template-rows:auto_auto_1fr_auto] gap-4">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

function ParkHighlight({
  title,
  park,
  tGeo,
}: {
  title: string;
  park: ParkStatsItem;
  tGeo: Parameters<typeof translateGeoSlug>[0];
}) {
  return (
    <HighlightCell title={title}>
      <ParkCard
        name={park.name}
        slug={park.slug}
        parkId={park.id}
        city={park.city}
        country={translateGeoSlug(tGeo, 'countries', park.countrySlug, park.country)}
        href={convertApiUrlToFrontendUrl(park.url) as '/'}
        backgroundImage={getParkBackgroundImage(park.slug)}
        objectPosition={getCardObjectPosition(park.slug)}
        status="OPERATING"
        timezone={park.timezone}
        crowdLevel={park.crowdLevel ?? undefined}
        averageWaitTime={park.averageWaitTime ?? undefined}
        operatingAttractions={park.operatingAttractions}
        totalAttractions={park.totalAttractions}
      />
    </HighlightCell>
  );
}

function RideHighlight({
  title,
  ride,
  nowIso,
}: {
  title: string;
  ride: AttractionStatsItem;
  nowIso: string;
}) {
  return (
    <HighlightCell title={title}>
      <AttractionCard
        parkStatus="OPERATING"
        showParkName
        backgroundImage={getAttractionBackgroundImage(ride.parkSlug, ride.slug)}
        objectPosition={getCardObjectPosition(ride.parkSlug, ride.slug)}
        attraction={{
          id: ride.id,
          name: ride.name,
          slug: ride.slug,
          url: convertApiUrlToFrontendUrl(ride.url),
          latitude: null,
          longitude: null,
          crowdLevel: ride.crowdLevel ?? undefined,
          queues: [{ queueType: 'STANDBY', waitTime: ride.waitTime, status: 'OPERATING' }],
          statistics: ride.sparkline.length
            ? {
                avgWaitToday: ride.avgWaitToday,
                minWaitToday: ride.minWaitToday,
                peakWaitToday: ride.peakWaitToday,
                peakWaitTimestamp: ride.peakWaitTimestamp,
                typicalWaitThisHour: ride.typicalWaitThisHour,
                percentile95ThisHour: null,
                currentVsTypical: ride.currentVsTypical,
                dataPoints: ride.sparkline.length,
                history: ride.sparkline,
                timestamp: nowIso,
              }
            : undefined,
          park: {
            id: '',
            name: ride.parkName,
            slug: ride.parkSlug,
            timezone: ride.parkTimezone,
            continent: null,
            country: ride.parkCountrySlug,
            city: ride.parkCity,
          },
        }}
      />
    </HighlightCell>
  );
}
