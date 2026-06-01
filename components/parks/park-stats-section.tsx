import { getTranslations } from 'next-intl/server';
import { BarChart3 } from 'lucide-react';
import { ParkStatsCrowdCard } from '@/components/parks/park-stats-crowd-card';
import { ParkStatsAttractionsCard } from '@/components/parks/park-stats-attractions-card';
import type { ParkHistoricalStats } from '@/lib/api/types';

interface ParkStatsSectionProps {
  stats: ParkHistoricalStats | null;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  locale: string;
}

export async function ParkStatsSection({
  stats,
  continent,
  country,
  city,
  parkSlug,
  locale,
}: ParkStatsSectionProps) {
  const t = await getTranslations('parks.stats');

  if (!stats || !stats.meta.displayable) return null;

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
