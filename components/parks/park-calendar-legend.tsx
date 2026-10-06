'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { CROWD_LEVEL_ORDER, CROWD_SCALE_CLASS } from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';

/** One meaning of the bar across a cell's top edge: the colour, then the word. */
function SignalKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={cn('h-[3px] w-4 shrink-0 rounded-full', className)} aria-hidden="true" />
      <span className="text-[11px]">{label}</span>
    </span>
  );
}

/**
 * What the colours in the month grid mean: the crowd scale, then the signal bar. The scale is one
 * strip of butted chips because it is a ruler; the four signal keys are independent facts and keep
 * their gaps. All six tiers are named even when a month shows four, so any colour the API sends can
 * be looked up.
 */
export function ParkCalendarLegend({ className }: { className?: string }) {
  const t = useTranslations('parks');
  const tLegend = useTranslations('attractions.historyLegend');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <span className="text-muted-foreground shrink-0 text-[10px] font-medium tracking-widest uppercase">
          {t('calendarLegendGroups.crowd')}
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
            <span>{t('crowdLevels.very_low')}</span>
            <span>{t('crowdLevels.extreme')}</span>
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
              {t(`crowdLevels.${level}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
          {t('calendarLegendGroups.signals')}
        </span>
        <SignalKey className={DAY_SIGNAL_CLASS.school} label={tLegend('schoolVacation')} />
        <SignalKey className={DAY_SIGNAL_CLASS.neighbor} label={t('influencingHolidays')} />
        <SignalKey className={DAY_SIGNAL_CLASS.holiday} label={tLegend('holiday')} />
        <SignalKey className={DAY_SIGNAL_CLASS.bridge} label={tLegend('bridgeDay')} />
      </div>
    </div>
  );
}
