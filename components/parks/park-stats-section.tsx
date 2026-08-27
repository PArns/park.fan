'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ParkStatsHeader } from '@/components/parks/park-stats-header';
import { ParkStatsCrowdCard } from '@/components/parks/park-stats-crowd-card';
import { ParkStatsAttractionsCard } from '@/components/parks/park-stats-attractions-card';
import {
  ALL_STATS_CARDS,
  ParkStatsSectionSkeleton,
  type StatsCard,
} from '@/components/parks/park-stats-section-skeleton';
import { useParkHistoricalStats } from '@/lib/hooks/use-park-historical-stats';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useParkWaitTimes } from '@/lib/hooks/use-park-wait-times';
import { useMounted } from '@/lib/hooks/use-mounted';
import type { AttractionStatus, ParkHistoricalStats } from '@/lib/api/types';
import { getAttractionDisplayStatus } from '@/lib/utils/park-utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';

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
  /**
   * Which cards to render. The park page wants all three; a blog post argues from one table at a
   * time and would otherwise have to embed the whole bundle twice, 400 words apart from the prose
   * that discusses it. Defaults to all three, so every existing call site is unchanged.
   */
  show?: readonly StatsCard[];
  /** Blog posts sit under their own <h2>; a second one here would break the heading ladder. */
  hideHeading?: boolean;
  /**
   * Server-fetched aggregate (`getParkHistoricalStatsSeed`). Present → the pre-settle render
   * shows the REAL cards instead of a skeleton, which is what puts these numbers into the
   * crawlable first HTML. The client query still runs and replaces it exactly as before.
   *
   * The park page deliberately passes nothing: its stats were moved off the server render to
   * keep the route out of `no-store`, and that trade is unchanged here — only the statically
   * prerendered blog posts seed.
   */
  initialStats?: ParkHistoricalStats | null;
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
  show = ALL_STATS_CARDS,
  hideHeading = false,
  initialStats,
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
    // Render the seed when there is one. SSR and the first client render are byte-identical
    // because both read this prop rather than React Query state — the same arrangement (and the
    // same reason) as `initialCalendar` in ParkBestDaysSection.
    if (initialStats) {
      if (!initialStats.meta.displayable) return null;
      return (
        <StatsContent
          stats={initialStats}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          locale={locale}
          hasLiveWaitTimes={hasLiveWaitTimes}
          show={show}
          hideHeading={hideHeading}
        />
      );
    }
    // The placeholder mirrors what this caller will actually render, or a
    // `show={['attractions']} hideHeading` block collapses three cards to one.
    return <ParkStatsSectionSkeleton show={show} hideHeading={hideHeading} />;
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
      show={show}
      hideHeading={hideHeading}
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
  show,
  hideHeading,
}: {
  stats: ParkHistoricalStats;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  locale: string;
  hasLiveWaitTimes: boolean;
  show: ReadonlyArray<'attractions' | 'months' | 'weekdays'>;
  hideHeading: boolean;
}) {
  const t = useTranslations('parks.stats');
  const tParks = useTranslations('parks');

  // Live wait times for the "now" column — read from the SHARED cache, never fetched here:
  // `enabled: false` keeps this observer subscribed to `['park-live', …]` without ever issuing a
  // request of its own. On the park page `LiveParkData` already polls that key every 5 minutes,
  // so the column costs nothing on top of the page's API budget; where nothing else subscribes
  // (a blog post without a weather widget) this one stays empty and the fallback below answers.
  const { data: livePark } = useLiveParkData({
    continent,
    country,
    city,
    parkSlug,
    enabled: false,
  });

  // Second source, same deal: cache-only, `enabled: false`, no request of its own. A blog post
  // does not mount `LiveParkData`, so `['park-live', …]` is usually empty there — but a post that
  // names rides of this park has already filled `['park-wait-times', …]` through its `ref:`
  // references, and that 9 KB payload carries exactly what this column needs (park status, plus
  // status and standby wait per slug). Measured on `die-kunst-des-wartens`: eleven wait-time
  // fetches on the page, one of them for the very park its stats widget shows.
  const { live: waitTimes } = useParkWaitTimes(continent, country, city, parkSlug, false);

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
  const ridesBySlug = waitTimes?.ridesBySlug;
  const parkStatus = livePark?.status ?? waitTimes?.parkStatus;
  const currentWaits = useMemo(() => {
    const bySlug = new Map<string, number>();
    if (!hasLiveWaitTimes || (parkStatus && parkStatus !== 'OPERATING')) return bySlug;
    if (liveAttractions) {
      for (const attraction of liveAttractions) {
        const status =
          (attraction as { effectiveStatus?: AttractionStatus }).effectiveStatus ??
          getAttractionDisplayStatus(attraction, parkStatus);
        if (status !== 'OPERATING') continue;
        const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
        const waitTime = standby && 'waitTime' in standby ? standby.waitTime : null;
        if (typeof waitTime === 'number') bySlug.set(attraction.slug, waitTime);
      }
      return bySlug;
    }
    // The wait-times payload has no `effectiveStatus` — it is queue rows and nothing else. So a
    // ride whose feed went quiet keeps the wait it last published here, where the park page would
    // have caught it. Worth the trade: the alternative on a blog post is no live column at all.
    for (const [slug, ride] of Object.entries(ridesBySlug ?? {})) {
      if (ride.status !== 'OPERATING') continue;
      if (typeof ride.waitTime === 'number') bySlug.set(slug, ride.waitTime);
    }
    return bySlug;
  }, [liveAttractions, ridesBySlug, parkStatus, hasLiveWaitTimes]);

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
  const showCurrentWaits =
    hasLiveWaitTimes && (!!livePark || !!waitTimes) && parkStatus === 'OPERATING';

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
      days: m.sampleDays,
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
          days: d.sampleDays,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [stats.byDayOfWeek, locale]);

  const showMonths = show.includes('months') && monthRows.length > 0;
  const showWeekdays = show.includes('weekdays') && dowRows.length > 0;

  return (
    <section
      aria-labelledby={hideHeading ? undefined : 'stats-heading'}
      aria-label={hideHeading ? t('title') : undefined}
      className="mt-8 space-y-4"
    >
      <ParkStatsHeader
        hidden={hideHeading}
        subtitle={t('subtitle', {
          days: stats.meta.totalSampleDays,
          years: Math.max(stats.meta.windowYears, 1),
        })}
      />

      {show.includes('attractions') && stats.topAttractions.length > 0 && (
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

      {(showMonths || showWeekdays) && (
        // Two columns only when BOTH cards are there. `md:grid-cols-2` unconditionally left a
        // lone card sitting in the first of two tracks, at half the column width with nothing
        // beside it — which is what a blog post's `stats-widget show=weekdays` always renders,
        // and what the park page renders for a park whose window has one of the two tables.
        <div className={cn('grid gap-4', showMonths && showWeekdays && 'md:grid-cols-2')}>
          {showMonths && (
            <ParkStatsCrowdCard
              iconType="calendar"
              title={t('byMonthTitle')}
              rows={monthRows}
              labelP50={t('p50')}
              labelP90={t('p90')}
              labelDays={t('sampleDaysShort')}
            />
          )}
          {showWeekdays && (
            <ParkStatsCrowdCard
              iconType="layers"
              title={t('byDowTitle')}
              rows={dowRows}
              labelP50={t('p50')}
              labelP90={t('p90')}
              labelDays={t('sampleDaysShort')}
            />
          )}
        </div>
      )}
    </section>
  );
}
