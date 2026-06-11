'use client';

import type { ReactNode } from 'react';
import { Sunrise, Clock, ChartColumn, TrendingDown, Moon, Info } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { GlassCard } from '@/components/common/glass-card';
import { Badge } from '@/components/ui/badge';
import { ParkTime } from '@/components/common/park-time';
import { cn } from '@/lib/utils';
import { isEveningBetter, troughWait } from '@/lib/utils/rope-drop';
import type { RopeDropInfo } from '@/lib/api/types';

interface RopeDropCardProps {
  ropeDrop: RopeDropInfo;
  timezone: string;
  /**
   * Today's closing time (UTC ISO). Recommendations pooled from longer
   * historical days can resolve past today's closing — times after closing
   * are never shown.
   */
  todayClosingUtc?: string | null;
  /**
   * Whether any attraction in this park carries a rope-drop or evening
   * recommendation. The "no need to rush" note only makes sense as a contrast
   * to recommended neighbors — in parks without any recommendation it would
   * appear on every headliner as noise.
   */
  parkHasRecommendations?: boolean;
  className?: string;
}

/**
 * Rope-drop recommendation panel for the attraction detail page. Three states:
 * worth → full panel with the minutes saved by riding at park opening, the
 * advantage window (concrete park time when the API resolved an opening time,
 * minutes-after-open otherwise) and the quieter evening alternative when the
 * day's trough isn't at opening. Evening-better → inverse recommendation (long
 * line right at opening, trough much later — ride late instead). Otherwise a
 * muted "no need to rush" note. Client Component: the concrete times render
 * via <ParkTime> (browser-timezone tooltip needs the client).
 */
export function RopeDropCard({
  ropeDrop,
  timezone,
  todayClosingUtc,
  parkHasRecommendations = true,
  className,
}: RopeDropCardProps) {
  const t = useTranslations('attractions.ropeDrop');
  const locale = useLocale();

  // A best-slot instant past today's closing is an artifact of recommendations
  // computed on longer historical days — suppress it rather than show a time
  // the visitor can't act on.
  const closingMs = todayClosingUtc ? Date.parse(todayClosingUtc) : NaN;
  const bestSlotPlausible =
    !ropeDrop.bestSlotUtc ||
    !Number.isFinite(closingMs) ||
    Date.parse(ropeDrop.bestSlotUtc) <= closingMs;

  const timeTag = (iso: string) => {
    const tag = () => (
      <strong className="font-bold">
        <ParkTime isoTime={iso} parkTimezone={timezone} locale={locale} showSuffix />
      </strong>
    );
    return tag;
  };

  // Offset fallback when no concrete UTC instant is available: the trough is
  // often 10+ hours after opening, so switch to hours past 2 h for readability.
  const bestSlotOffsetNode = (key: 'bestSlotOffset' | 'eveningBestOffset'): ReactNode =>
    ropeDrop.bestSlotMinutesAfterOpen >= 120
      ? t(`${key}Hours`, { hours: Math.round(ropeDrop.bestSlotMinutesAfterOpen / 60) })
      : t(key, { minutes: ropeDrop.bestSlotMinutesAfterOpen });

  if (!ropeDrop.worth) {
    if (isEveningBetter(ropeDrop)) {
      const eveningTroughWait = troughWait(ropeDrop);

      const eveningBestNode: ReactNode = ropeDrop.bestSlotUtc
        ? eveningTroughWait != null
          ? t.rich('eveningBestAtWait', {
              wait: eveningTroughWait,
              time: timeTag(ropeDrop.bestSlotUtc),
            })
          : t.rich('eveningBestAt', { time: timeTag(ropeDrop.bestSlotUtc) })
        : bestSlotOffsetNode('eveningBestOffset');

      const eveningStats =
        eveningTroughWait != null
          ? [
              { icon: Clock, label: t('atOpening'), value: ropeDrop.openWait, highlight: false },
              {
                icon: ChartColumn,
                label: t('dayPeak'),
                value: ropeDrop.busyPeak,
                highlight: false,
              },
              { icon: Moon, label: t('eveningWait'), value: eveningTroughWait, highlight: true },
            ]
          : null;

      return (
        <GlassCard
          variant="medium"
          className={cn('border-indigo-500/30', className)}
          aria-label={t('eveningTitle')}
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Moon className="h-5 w-5 shrink-0 text-indigo-400" aria-hidden="true" />
              {t('eveningTitle')}
            </h2>
          </div>
          <p className="text-muted-foreground mb-3 text-sm">
            {t('eveningText', { openWait: ropeDrop.openWait, busyPeak: ropeDrop.busyPeak })}
          </p>
          {eveningStats && (
            <div className="mb-4 grid grid-cols-3 gap-3">
              {eveningStats.map(({ icon: Icon, label, value, highlight }) => (
                <div
                  key={label}
                  className={cn(
                    'rounded-lg border p-3 text-center',
                    highlight
                      ? 'border-indigo-500/30 bg-indigo-500/10'
                      : 'border-border/50 bg-background/40'
                  )}
                >
                  <div
                    className={cn(
                      'text-muted-foreground mx-auto mb-1 flex items-center justify-center gap-1 text-xs font-medium',
                      highlight && 'text-indigo-500 dark:text-indigo-300'
                    )}
                  >
                    <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {label}
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      highlight && 'text-indigo-500 dark:text-indigo-300'
                    )}
                  >
                    {value}
                    <span className="text-muted-foreground ml-1 text-xs font-medium">min</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {bestSlotPlausible && (
            <p className="flex items-center gap-2 text-sm font-medium">
              <Moon className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span suppressHydrationWarning>{eveningBestNode}</span>
            </p>
          )}
          {ropeDrop.confidence === 'low' && (
            <p className="text-muted-foreground mt-4 flex items-center gap-1 border-t pt-3 text-xs">
              <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
              {t('confidenceLow')}
            </p>
          )}
        </GlassCard>
      );
    }

    if (!parkHasRecommendations) return null;

    return (
      <GlassCard variant="light" className={cn('p-4', className)}>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Sunrise className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('notWorth', { openWait: ropeDrop.openWait })}
        </p>
      </GlassCard>
    );
  }

  // The day's absolute trough is only worth calling out when it lies outside
  // the opening advantage window (in ~69% of cases it does, often the evening).
  const showBestSlot =
    ropeDrop.bestSlotMinutesAfterOpen > ropeDrop.rideByMinutesAfterOpen && bestSlotPlausible;

  // Always-busy flagships have no real advantage window (the wait already
  // exceeds half the peak in the first 15-min bin → rideBy = 0). "Within the
  // first 0 min" reads broken — say "right at opening" instead.
  const rideAtOpening = ropeDrop.rideByMinutesAfterOpen < 15;

  const rideByNode: ReactNode = rideAtOpening
    ? ropeDrop.rideByUtc
      ? t.rich('rideAtOpeningAt', { time: timeTag(ropeDrop.rideByUtc) })
      : t('rideAtOpening')
    : ropeDrop.rideByUtc
      ? t.rich('rideWithinUntil', {
          minutes: ropeDrop.rideByMinutesAfterOpen,
          time: timeTag(ropeDrop.rideByUtc),
        })
      : t('rideWithin', { minutes: ropeDrop.rideByMinutesAfterOpen });

  const worthTroughWait = troughWait(ropeDrop);
  const bestSlotNode: ReactNode = ropeDrop.bestSlotUtc
    ? worthTroughWait != null
      ? t.rich('bestSlotAtWait', {
          wait: worthTroughWait,
          time: timeTag(ropeDrop.bestSlotUtc),
        })
      : t.rich('bestSlotAt', { time: timeTag(ropeDrop.bestSlotUtc) })
    : bestSlotOffsetNode('bestSlotOffset');

  const stats = [
    { icon: Clock, label: t('atOpening'), value: ropeDrop.openWait, highlight: false },
    { icon: ChartColumn, label: t('dayPeak'), value: ropeDrop.busyPeak, highlight: false },
    { icon: TrendingDown, label: t('savings'), value: ropeDrop.savings, highlight: true },
  ];

  return (
    <GlassCard
      variant="medium"
      className={cn('border-emerald-500/30', className)}
      aria-label={t('title')}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Sunrise className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
          {t('title')}
        </h2>
        <Badge
          className={cn(
            'font-semibold',
            ropeDrop.strength === 'high'
              ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
              : 'border border-teal-500/30 bg-teal-500/15 text-teal-600 dark:text-teal-300'
          )}
        >
          {ropeDrop.strength === 'high' ? t('strengthHigh') : t('strengthModerate')}
        </Badge>
      </div>

      <p className="text-muted-foreground mb-4 text-sm">{t('explainer')}</p>

      {/* Open wait vs day peak vs savings */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value, highlight }) => (
          <div
            key={label}
            className={cn(
              'rounded-lg border p-3 text-center',
              highlight
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-border/50 bg-background/40'
            )}
          >
            <div
              className={cn(
                'text-muted-foreground mx-auto mb-1 flex items-center justify-center gap-1 text-xs font-medium',
                highlight && 'text-emerald-600 dark:text-emerald-300'
              )}
            >
              <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
              {label}
            </div>
            <div
              className={cn(
                'text-2xl font-bold tabular-nums',
                highlight && 'text-emerald-600 dark:text-emerald-300'
              )}
            >
              {highlight && '−'}
              {value}
              <span className="text-muted-foreground ml-1 text-xs font-medium">min</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Sunrise className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span suppressHydrationWarning>{rideByNode}</span>
        </p>
        {showBestSlot && (
          <p className="text-muted-foreground flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span suppressHydrationWarning>{bestSlotNode}</span>
          </p>
        )}
      </div>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs">
        <span>
          {t('byDaytype', {
            weekend: ropeDrop.byDaytype.weekend.savings,
            weekday: ropeDrop.byDaytype.weekday.savings,
          })}
        </span>
        {ropeDrop.confidence === 'low' && (
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
            {t('confidenceLow')}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
