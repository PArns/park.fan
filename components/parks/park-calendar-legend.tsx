'use client';

import { Construction } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { CROWD_LEVEL_ORDER, CROWD_SCALE_CLASS } from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { DaySignalKey } from '@/components/parks/day-signal-key';
import { WORKS_TONE_CLASS } from '@/components/parks/works-period-list';

/**
 * What the colours in the month grid mean: the crowd scale, then the signal bar. The scale is one
 * strip of butted chips because it is a ruler; the four signal keys are independent facts and keep
 * their gaps. All six tiers are named even when a month shows four, so any colour the API sends can
 * be looked up. The works icon is keyed only for a park that has a curated window, since on every
 * other park the grid never draws it.
 */
export function ParkCalendarLegend({
  showWorks = false,
  className,
}: {
  showWorks?: boolean;
  className?: string;
}) {
  const tGroups = useTranslations('parks.calendarLegendGroups');
  const tWorks = useTranslations('parks.worksPeriod');
  const tCrowd = useTranslations('parks.crowdLevels');
  const tHolidays = useTranslations('parks.holidayContext');
  const tLegend = useTranslations('attractions.historyLegend');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <span className="text-muted-foreground shrink-0 text-[10px] font-medium tracking-widest uppercase">
          {tGroups('crowd')}
        </span>

        {/* Below `sm` the six names do not fit and pushed the legend past the card's edge, so the
            phone gets the ramp with only its two ends named. Every tile in the grid spells out its
            own tier. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:hidden">
          <div className="flex h-2.5 overflow-hidden rounded-md" aria-hidden="true">
            {CROWD_LEVEL_ORDER.map((level) => (
              <span key={level} className={cn('flex-1', CROWD_SCALE_CLASS[level])} />
            ))}
          </div>
          <div className="text-muted-foreground flex justify-between text-[9px] font-medium tracking-wide uppercase">
            <span>{tCrowd('very_low')}</span>
            <span>{tCrowd('extreme')}</span>
          </div>
        </div>

        <div className="hidden min-w-0 overflow-hidden rounded-md sm:flex">
          {CROWD_LEVEL_ORDER.map((level) => (
            <span
              key={level}
              className={cn(
                'truncate px-2.5 py-1 text-[10.5px] font-bold tracking-wide uppercase',
                CROWD_SCALE_CLASS[level]
              )}
            >
              {tCrowd(level)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
          {tGroups('signals')}
        </span>
        <DaySignalKey className={DAY_SIGNAL_CLASS.school} label={tLegend('schoolVacation')} />
        <DaySignalKey
          className={DAY_SIGNAL_CLASS.neighbor}
          label={tHolidays('influencingHolidays')}
        />
        <DaySignalKey className={DAY_SIGNAL_CLASS.holiday} label={tLegend('holiday')} />
        <DaySignalKey className={DAY_SIGNAL_CLASS.bridge} label={tLegend('bridgeDay')} />
        {showWorks && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Construction className={cn('h-3 w-3 shrink-0', WORKS_TONE_CLASS)} aria-hidden="true" />
            <span className="text-[11px]">{tWorks('closedRidesTitle')}</span>
          </span>
        )}
      </div>
    </div>
  );
}
