'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ParkStatsCrowdCard } from '@/components/parks/park-stats-crowd-card';
import { ParkStatsAttractionsCard } from '@/components/parks/park-stats-attractions-card';
import { ParkStatsSectionSkeleton } from '@/components/parks/park-stats-section-skeleton';
import { useParkHistoricalStats } from '@/lib/hooks/use-park-historical-stats';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useMounted } from '@/lib/hooks/use-mounted';
import type { AttractionStatus, ParkHistoricalStats } from '@/lib/api/types';
import { getAttractionDisplayStatus } from '@/lib/utils/park-utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

interface ParkStatsSectionProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  locale: string;
  /**
   * The API's curated `liveWaitTimes.available` for this park, read through
   * `hasReadableWaitTimes()`. `false` suppresses the live "now" column: for a park that publishes
   * wait times only in its own app there is no number to compare against, and nothing in the live
   * payload says so — at 03:00 a sleeping park looks identical. Defaults to `true`, matching the
   * helper's rule that an absent flag means available, so a caller without the park object
   * (the blog widget) behaves as before.
   */
  hasLiveWaitTimes?: boolean;
}

/**
 * Client wrapper: fetches the 2-year historical aggregate client-side (via the CDN-cached
 * `/api/parks/.../stats` route), shows the skeleton while loading, then renders the stats
 * content. Moving this off the server render lets the park page stay statically prerenderable
 * (no `connection()` / dynamic hole). A failed fetch resolves to `null` → renders nothing,
 * mirroring the old server-side loadParkStats fallback.
 */
export function ParkStatsSection({
  continent,
  country,
  city,
  parkSlug,
  locale,
  hasLiveWaitTimes = true,
}: ParkStatsSectionProps) {
  // Browser-only query (disabled during SSR). Show the skeleton until mounted + loaded so the
  // static prerender renders the placeholder rather than an empty section.
  const mounted = useMounted();
  // `isPending` (not `isLoading`): the query starts DISABLED until useLoadLast releases it
  // (best-travel-time/stats load last). A disabled query is pending but not fetching, so
  // `isLoading` would be false and the section would vanish during the defer window.
  const { data: stats, isPending } = useParkHistoricalStats({
    continent,
    country,
    city,
    parkSlug,
  });

  if (!mounted || isPending) {
    return <ParkStatsSectionSkeleton />;
  }

  if (!stats || !stats.meta.displayable) return null;

  return (
    <StatsContent
      stats={stats}
      continent={continent}
      country={country}
      city={city}
      parkSlug={parkSlug}
      locale={locale}
      hasLiveWaitTimes={hasLiveWaitTimes}
    />
  );
}

function StatsContent({
  stats,
  continent,
  country,
  city,
  parkSlug,
  locale,
  hasLiveWaitTimes,
}: {
  stats: ParkHistoricalStats;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  locale: string;
  hasLiveWaitTimes: boolean;
}) {
  const t = useTranslations('parks.stats');
  const tParks = useTranslations('parks');

  // Live wait times for the "now" column — read from the SHARED cache, never fetched here:
  // `enabled: false` keeps this observer subscribed to `['park-live', …]` without ever issuing a
  // request of its own. On the park page `LiveParkData` already polls that key every 5 minutes,
  // so the column costs nothing on top of the page's API budget; where nothing else subscribes
  // (the blog stats widget) the cache stays empty and the column simply does not appear.
  const { data: livePark } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    enabled: false,
  });

  // Standby wait per attraction slug, for OPERATING rides only: a closed ride keeps publishing
  // `waitTime: 0` (River Quest and Black Mamba both did while the rest of Phantasialand ran), so
  // a walk-on and a shut ride would otherwise render as the same green zero.
  //
  // `effectiveStatus` first, exactly as `AttractionCard` decides it, and only then the shared
  // helper: a queue row keeps its last value when a source stops publishing, so a ride whose feed
  // went quiet mid-day still reads OPERATING with a stale wait while the API has already set
  // `effectiveStatus: CLOSED`. Reading the queue alone would print a wait here for a ride whose own
  // card on the same page says "closed".
  //
  // Read out here rather than as `livePark?.x` inside the memo: the React Compiler infers
  // `livePark` as the dependency then and refuses to preserve the memoization.
  const liveAttractions = livePark?.attractions;
  const liveParkStatus = livePark?.status;
  const currentWaits = useMemo(() => {
    const bySlug = new Map<string, number>();
    if (!hasLiveWaitTimes || (liveParkStatus && liveParkStatus !== 'OPERATING')) return bySlug;
    for (const attraction of liveAttractions ?? []) {
      const status =
        (attraction as { effectiveStatus?: AttractionStatus }).effectiveStatus ??
        getAttractionDisplayStatus(attraction, liveParkStatus);
      if (status !== 'OPERATING') continue;
      const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
      const waitTime = standby && 'waitTime' in standby ? standby.waitTime : null;
      if (typeof waitTime === 'number') bySlug.set(attraction.slug, waitTime);
    }
    return bySlug;
  }, [liveAttractions, liveParkStatus, hasLiveWaitTimes]);

  // Whether the column is there at all is a question about the PARK, not about the ten rides in
  // this table. Deriving it from "does any of them have a number" looked equivalent and is not:
  // Phantasialand at 09:37 has 14 rides open and every one of them is a carousel, so the whole
  // column vanished from a park that was running — and would have popped back in mid-session, one
  // layout jump, the moment Taron opened. A ride that is closed while the park is open gets a dash;
  // that is a fact about the ride and reads as one.
  //
  // The park being shut is the case with nothing to say, and so is a park whose wait times cannot
  // be read (`hasLiveWaitTimes`, from the API's curated flag) or one whose live snapshot has not
  // reached this observer's cache at all (the blog widget, where nothing else subscribes).
  const showCurrentWaits = hasLiveWaitTimes && !!livePark && liveParkStatus === 'OPERATING';

  // Memoized: this section re-renders on every background poll tick (useLoadLast subscribes
  // to the page-wide fetch count), and Intl.DateTimeFormat construction per row is the
  // expensive part.
  const monthRows = useMemo(() => {
    const fmt = getDateTimeFormat(locale, { month: 'long' });
    return stats.byMonth.map((m) => ({
      key: m.month,
      label: fmt.format(new Date(2024, m.month - 1, 1)),
      crowdLevel: m.avgCrowdLevel,
      p50: m.avgWaitP50,
      p90: m.avgWaitP90,
    }));
  }, [stats.byMonth, locale]);

  const dowRows = useMemo(() => {
    const refMonday = new Date(2025, 0, 6);
    const fmt = getDateTimeFormat(locale, { weekday: 'long' });
    return stats.byDayOfWeek
      .map((d) => {
        const offset = (d.dayOfWeek - 1 + 7) % 7;
        const date = new Date(refMonday);
        date.setDate(refMonday.getDate() + offset);
        return {
          key: d.dayOfWeek,
          sortKey: offset,
          label: fmt.format(date),
          crowdLevel: d.avgCrowdLevel,
          p50: d.avgWaitP50,
          p90: d.avgWaitP90,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [stats.byDayOfWeek, locale]);

  return (
    <section aria-labelledby="stats-heading" className="mt-8 space-y-4">
      <div className="bg-background/70 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-primary h-5 w-5" aria-hidden="true" />
          <h2 id="stats-heading" className="text-xl font-bold">
            {t('title')}
          </h2>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('subtitle', {
            days: stats.meta.totalSampleDays,
            years: Math.max(stats.meta.windowYears, 1),
          })}
        </p>
      </div>

      {stats.topAttractions.length > 0 && (
        <ParkStatsAttractionsCard
          attractions={stats.topAttractions}
          currentWaits={currentWaits}
          showCurrentWaits={showCurrentWaits}
          title={t('topAttractionsTitle')}
          labelAttraction={tParks('attractions')}
          labelMinutes={tParks('overview.minutesUnit')}
          labelNow={tParks('now')}
          labelP50={t('p50')}
          labelP90={t('p90')}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {monthRows.length > 0 && (
          <ParkStatsCrowdCard
            iconType="calendar"
            title={t('byMonthTitle')}
            rows={monthRows}
            labelP50={t('p50')}
            labelP90={t('p90')}
          />
        )}
        {dowRows.length > 0 && (
          <ParkStatsCrowdCard
            iconType="layers"
            title={t('byDowTitle')}
            rows={dowRows}
            labelP50={t('p50')}
            labelP90={t('p90')}
          />
        )}
      </div>
    </section>
  );
}
