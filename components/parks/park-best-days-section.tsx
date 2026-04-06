import { getTranslations } from 'next-intl/server';
import { CalendarDays, TrendingDown, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import type { IntegratedCalendarResponse, CrowdLevel } from '@/lib/api/types';
import { analyzeBestDays } from '@/lib/utils/crowd-analysis';
import { getGermanArticle } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ParkBestDaysSectionProps {
  calendarData: IntegratedCalendarResponse;
  parkName: string;
  parkSlug: string;
  locale: string;
}

function scoreToCrowdLevel(score: number): CrowdLevel {
  if (score <= 1.5) return 'very_low';
  if (score <= 2.5) return 'low';
  if (score <= 3.5) return 'moderate';
  if (score <= 4.5) return 'high';
  if (score <= 5.5) return 'very_high';
  return 'extreme';
}

const CROWD_CHIP: Record<string, string> = {
  very_low: 'bg-crowd-very-low/20 text-crowd-very-low border border-crowd-very-low/30',
  low: 'bg-crowd-low/20 text-crowd-low border border-crowd-low/30',
  moderate: 'bg-crowd-moderate/20 text-crowd-moderate border border-crowd-moderate/30',
  high: 'bg-crowd-high/20 text-crowd-high border border-crowd-high/30',
  very_high: 'bg-crowd-very-high/20 text-crowd-very-high border border-crowd-very-high/30',
  extreme: 'bg-crowd-extreme/20 text-crowd-extreme border border-crowd-extreme/30',
};

function getDayShort(dayIndex: number, locale: string): string {
  const refMonday = new Date(2025, 0, 6);
  const date = new Date(refMonday);
  date.setDate(refMonday.getDate() + ((dayIndex - 1 + 7) % 7));
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace(/\.$/, '');
}

function localizedParkName(parkName: string, parkSlug: string, locale: string): string {
  if (locale !== 'de') return parkName;
  const nominative = getGermanArticle(parkName, parkSlug);
  const accusative = nominative === 'der' ? 'den' : nominative;
  return accusative ? `${accusative} ${parkName}` : parkName;
}

export async function ParkBestDaysSection({
  calendarData,
  parkName,
  parkSlug,
  locale,
}: ParkBestDaysSectionProps) {
  const t = await getTranslations('parks.bestDays');
  const analysis = analyzeBestDays(calendarData.days);

  if (analysis.totalDays < 7) return null;

  const hasBestDays = analysis.bestDaysOfWeek.length > 0;
  const hasUpcoming = analysis.upcomingQuietDays.length > 0;
  if (!hasBestDays && !hasUpcoming) return null;

  const displayName = localizedParkName(parkName, parkSlug, locale);

  return (
    <section aria-labelledby="best-days-heading" className="mt-8 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays className="text-primary h-5 w-5" aria-hidden="true" />
          <h2 id="best-days-heading" className="text-xl font-semibold">
            {t('title', { park: displayName })}
          </h2>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
      </div>

      <GlassCard variant="medium" className="grid gap-5 sm:grid-cols-2">
        {/* Best 3 days of week */}
        {hasBestDays && (
          <div className="space-y-2.5">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              {t('quietestDaysTitle')}
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.bestDaysOfWeek.map((stat) => {
                const level = scoreToCrowdLevel(stat.avgScore);
                return (
                  <span
                    key={stat.dayIndex}
                    className={cn(
                      'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium',
                      CROWD_CHIP[level]
                    )}
                  >
                    {getDayShort(stat.dayIndex, locale)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming quiet days */}
        <div className="space-y-2.5">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {t('upcomingQuietTitle')}
          </p>
          {hasUpcoming ? (
            <div className="flex flex-wrap gap-2">
              {analysis.upcomingQuietDays.map((day) => {
                const [y, m, d] = day.date.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                const label = new Intl.DateTimeFormat(locale, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })
                  .format(date)
                  .replace(/\.$/, '');
                const level = day.crowdLevel as CrowdLevel;
                return (
                  <span
                    key={day.date}
                    className={cn(
                      'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium',
                      CROWD_CHIP[level] ??
                        'bg-muted/20 text-muted-foreground border border-transparent'
                    )}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('noUpcomingQuiet')}</p>
          )}
        </div>
      </GlassCard>

      {analysis.schoolHolidaysAreBusy && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{t('schoolHolidayWarning', { park: displayName })}</p>
        </div>
      )}
    </section>
  );
}
