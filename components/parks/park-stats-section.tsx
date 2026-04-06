import { getTranslations } from 'next-intl/server';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getParkHistoricalStats } from '@/lib/api/stats';
import type { CrowdLevel } from '@/lib/api/types';
import { Link } from '@/i18n/navigation';

interface ParkStatsSectionProps {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  locale: string;
}

const CROWD_SCORE_TO_LEVEL = (score: number): CrowdLevel => {
  if (score <= 1.5) return 'very_low';
  if (score <= 2.5) return 'low';
  if (score <= 3.5) return 'moderate';
  if (score <= 4.5) return 'high';
  if (score <= 5.5) return 'very_high';
  return 'extreme';
};

export async function ParkStatsSection({
  continent,
  country,
  city,
  parkSlug,
  locale,
}: ParkStatsSectionProps) {
  const t = await getTranslations('parks.stats');

  const stats = await getParkHistoricalStats(continent, country, city, parkSlug).catch(() => null);

  if (!stats || stats.meta.totalSampleDays < 30) return null;

  const years = Math.round(
    (new Date(stats.meta.dataTo).getTime() - new Date(stats.meta.dataFrom).getTime()) /
      (365.25 * 24 * 3600 * 1000)
  );

  return (
    <section aria-labelledby="stats-heading" className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-primary h-5 w-5" aria-hidden="true" />
        <h2 id="stats-heading" className="text-xl font-semibold">
          {t('title')}
        </h2>
      </div>
      <p className="text-muted-foreground text-sm">
        {t('subtitle', { days: stats.meta.totalSampleDays, years: Math.max(years, 1) })}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* By Month */}
        {stats.byMonth.length > 0 && (
          <GlassCard variant="light" className="space-y-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="text-primary h-4 w-4" aria-hidden="true" />
              {t('byMonthTitle')}
            </h3>
            <ul className="space-y-1.5">
              {stats.byMonth.map((m) => {
                const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(
                  new Date(2024, m.month - 1, 1)
                );
                return (
                  <li key={m.month} className="flex items-center justify-between gap-2 text-sm">
                    <span className="w-24 shrink-0 capitalize">{monthName}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <CrowdLevelBadge
                        level={CROWD_SCORE_TO_LEVEL(m.avgCrowdScore)}
                        className="text-xs"
                      />
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        ø {m.avgWaitP50} / {m.avgWaitP90} min
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        )}

        {/* By Day of Week */}
        {stats.byDayOfWeek.length > 0 && (
          <GlassCard variant="light" className="space-y-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="text-primary h-4 w-4" aria-hidden="true" />
              {t('byDowTitle')}
            </h3>
            <ul className="space-y-1.5">
              {stats.byDayOfWeek.map((d) => {
                const refMonday = new Date(2025, 0, 6);
                const date = new Date(refMonday);
                date.setDate(refMonday.getDate() + ((d.dayOfWeek - 1 + 7) % 7));
                const dayName = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
                return (
                  <li key={d.dayOfWeek} className="flex items-center justify-between gap-2 text-sm">
                    <span className="w-24 shrink-0 capitalize">{dayName}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <CrowdLevelBadge
                        level={CROWD_SCORE_TO_LEVEL(d.avgCrowdScore)}
                        className="text-xs"
                      />
                      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                        ø {d.avgWaitP50} / {d.avgWaitP90} min
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        )}
      </div>

      {/* Top Attractions */}
      {stats.topAttractions.length > 0 && (
        <GlassCard variant="light" className="space-y-3 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="text-primary h-4 w-4" aria-hidden="true" />
            {t('topAttractionsTitle')}
          </h3>
          <ul className="divide-y">
            {stats.topAttractions.map((a, i) => (
              <li key={a.attractionSlug} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-muted-foreground w-5 shrink-0 text-center tabular-nums">
                  {i + 1}
                </span>
                <Link
                  href={`/parks/${continent}/${country}/${city}/${parkSlug}/${a.attractionSlug}`}
                  className="hover:text-primary flex-1 truncate transition-colors"
                >
                  {a.attractionName}
                </Link>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {t('p50')} {a.avgWaitP50} / {t('p90')} {a.avgWaitP90} min
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </section>
  );
}
