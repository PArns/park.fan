'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { cn } from '@/lib/utils';
import { formatShortDuration } from '@/lib/utils/duration';
import { parkWallClock } from '@/lib/utils/park-day';
import { formatPerformanceTime, nextPerformance } from '@/lib/utils/performance-schedule';

interface PerformanceCountdownProps {
  /** Today's start times, `HH:MM`, from `performanceTimesShown`. */
  times: readonly string[];
  timezone: string;
  /**
   * `row`: the next start alone, for a phone row's first line beside the name. `block`: the next
   * start with how far off it is, and every start of the day under it, past ones struck through.
   */
  variant: 'row' | 'block';
  /** Classes for the next start's figure, which sets the block's scale. */
  figureClassName?: string;
  className?: string;
}

/**
 * The next performance of a ride that starts at set times, in place of its wait: „14:00 · in 23
 * Min.", and once the last one has begun, that there is none left today. A Client Component because
 * both depend on the clock; on the shared minute tick, and a skeleton of the figure's size until it
 * has a reading.
 */
export function PerformanceCountdown({
  times,
  timezone,
  variant,
  figureClassName,
  className,
}: PerformanceCountdownProps) {
  const t = useTranslations('attractions.performance');
  const locale = useLocale();
  const nowMs = useMinuteNow();
  const now = nowMs === null ? null : parkWallClock(nowMs, timezone).time;
  const next = now === null ? null : nextPerformance(times, now);

  if (variant === 'row') {
    if (now === null) return <Skeleton className={cn('h-[22px] w-12', className)} />;
    if (!next) return null;
    return (
      <span className={cn('leading-none', className)}>
        <span className="sr-only">{t('next')}: </span>
        <span className={figureClassName}>{formatPerformanceTime(next.time, locale)}</span>
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {now === null ? (
        <Skeleton className="h-10 w-32" />
      ) : next ? (
        <div className="flex flex-wrap items-baseline gap-x-2 leading-none">
          <span className={figureClassName}>{formatPerformanceTime(next.time, locale)}</span>
          <span className="text-muted-foreground text-xs font-medium">
            {next.minutesUntil === 0
              ? t('now')
              : t('in', { duration: formatShortDuration(next.minutesUntil, locale) })}
          </span>
        </div>
      ) : (
        <span className="flex h-10 items-center text-base font-semibold">{t('noneLeft')}</span>
      )}
      <ul aria-label={t('todayList')} className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11.5px]">
        {times.map((time) => {
          const past = now !== null && (!next || time < next.time);
          return (
            <li
              key={time}
              className={cn(
                'tabular-nums',
                past ? 'text-muted-foreground line-through opacity-60' : 'font-medium',
                next?.time === time && 'text-sky-700 dark:text-sky-300'
              )}
            >
              {formatPerformanceTime(time, locale)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
