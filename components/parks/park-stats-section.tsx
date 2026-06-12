'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ParkStatsCrowdCard } from '@/components/parks/park-stats-crowd-card';
import { ParkStatsAttractionsCard } from '@/components/parks/park-stats-attractions-card';
import { ParkStatsSectionSkeleton } from '@/components/parks/park-stats-section-skeleton';
import { useParkHistoricalStats } from '@/lib/hooks/use-park-historical-stats';
import { useMounted } from '@/lib/hooks/use-mounted';
import type { ParkHistoricalStats } from '@/lib/api/types';

interface ParkStatsSectionProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  locale: string;
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
}: {
  stats: ParkHistoricalStats;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  locale: string;
}) {
  const t = useTranslations('parks.stats');

  const monthRows = stats.byMonth.map((m) => ({
    key: m.month,
    label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(
      new Date(2024, m.month - 1, 1)
    ),
    crowdLevel: m.avgCrowdLevel,
    p50: m.avgWaitP50,
    p90: m.avgWaitP90,
  }));

  const refMonday = new Date(2025, 0, 6);
  const dowRows = stats.byDayOfWeek
    .map((d) => {
      const offset = (d.dayOfWeek - 1 + 7) % 7;
      const date = new Date(refMonday);
      date.setDate(refMonday.getDate() + offset);
      return {
        key: d.dayOfWeek,
        sortKey: offset,
        label: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
        crowdLevel: d.avgCrowdLevel,
        p50: d.avgWaitP50,
        p90: d.avgWaitP90,
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

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
          title={t('topAttractionsTitle')}
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
