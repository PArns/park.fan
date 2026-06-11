'use client';

import type { ReactNode } from 'react';
import { Sunrise, Clock, ChartColumn, TrendingDown, Moon, Info } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { GlassCard } from '@/components/common/glass-card';
import { Badge } from '@/components/ui/badge';
import { ParkTime } from '@/components/common/park-time';
import { cn } from '@/lib/utils';
import type { RopeDropInfo } from '@/lib/api/types';

interface RopeDropCardProps {
  ropeDrop: RopeDropInfo;
  timezone: string;
  className?: string;
}

/**
 * Rope-drop recommendation panel for the attraction detail page. Shows the
 * minutes saved by riding at park opening, the advantage window (concrete park
 * time when the API resolved an opening time, minutes-after-open otherwise)
 * and the quieter evening alternative when the day's trough isn't at opening.
 * Client Component: the concrete times render via <ParkTime> (browser-timezone
 * tooltip needs the client).
 */
export function RopeDropCard({ ropeDrop, timezone, className }: RopeDropCardProps) {
  const t = useTranslations('attractions.ropeDrop');
  const locale = useLocale();

  if (!ropeDrop.worth) {
    return (
      <GlassCard variant="light" className={cn('p-4', className)}>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Sunrise className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('notWorth', { openWait: ropeDrop.openWait })}
        </p>
      </GlassCard>
    );
  }

  const timeTag = (iso: string) => {
    const tag = () => (
      <strong className="font-bold">
        <ParkTime isoTime={iso} parkTimezone={timezone} locale={locale} showSuffix />
      </strong>
    );
    return tag;
  };

  // The day's absolute trough is only worth calling out when it lies outside
  // the opening advantage window (in ~69% of cases it does, often the evening).
  const showBestSlot = ropeDrop.bestSlotMinutesAfterOpen > ropeDrop.rideByMinutesAfterOpen;

  const rideByNode: ReactNode = ropeDrop.rideByUtc
    ? t.rich('rideWithinUntil', {
        minutes: ropeDrop.rideByMinutesAfterOpen,
        time: timeTag(ropeDrop.rideByUtc),
      })
    : t('rideWithin', { minutes: ropeDrop.rideByMinutesAfterOpen });

  const bestSlotNode: ReactNode = ropeDrop.bestSlotUtc
    ? t.rich('bestSlotAt', { time: timeTag(ropeDrop.bestSlotUtc) })
    : t('bestSlotOffset', { minutes: ropeDrop.bestSlotMinutesAfterOpen });

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
