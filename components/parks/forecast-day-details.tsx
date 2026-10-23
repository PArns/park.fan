import { CircleAlert, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { DaySignalChip } from '@/components/parks/day-signal-key';
import { cn } from '@/lib/utils';
import {
  CROWD_DOT_CLASS,
  CROWD_TEXT_CLASS,
  isColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS, holidaySignals, type DaySignal } from '@/lib/utils/day-signal-styles';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { roundAverageWaitTo5 } from '@/lib/utils/wait-time';
import type { OutlookDay, OutlookHoliday } from '@/lib/utils/yearly-outlook';
import { OUTLOOK_CLOSED_STYLE, OUTLOOK_PENDING_FILL } from '@/lib/utils/yearly-outlook-styles';

/**
 * What the forecast says about one day, as a panel shows it: the day's crowd colour across the top,
 * the date, the crowd badge beside the expected average wait, the advice and the day's holidays.
 * `day` is `null` for a day the forecast does not cover, which reads as „no forecast"; its holidays
 * still show. Holiday names arrive already translated. Draws its own padding, so the accent can run
 * edge to edge in a `SlotPopover`.
 */
export function ForecastDayDetails({
  date,
  day,
  holiday,
  locale,
}: {
  /** Park-local `YYYY-MM-DD`. */
  date: string;
  day: OutlookDay | null;
  holiday: OutlookHoliday | null;
  locale: string;
}) {
  const t = useTranslations('parks.yearlyOutlook');
  const tCommon = useTranslations('common');
  const tLegend = useTranslations('attractions.historyLegend');

  // Noon UTC and `timeZone: 'UTC'`: the labels name the park's calendar day, whatever the reader's
  // zone is.
  const at = new Date(`${date}T12:00:00Z`);
  const weekday = getDateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(at);
  const dayLabel = getDateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(at);

  const level = day?.level ?? 'unknown';
  const colored = isColoredCrowdLevel(level) ? level : null;
  // The API's figure is a mean over the headliners, so it goes to the five-minute grid as one.
  const wait = day?.avgWait != null ? roundAverageWaitTo5(day.avgWait) : 0;

  const signalLabel: Record<DaySignal, string> = {
    school: holiday?.schoolVacationName || tLegend('schoolVacation'),
    holiday: holiday?.holidayName || tLegend('holiday'),
    bridge: tLegend('bridgeDay'),
    neighbor: '',
  };
  const signals = holidaySignals(holiday);

  return (
    <div>
      {/* The day's slot from the strip, stretched across the panel: tier colour, closed hatch or
        the grey of a day without a forecast. */}
      <div
        className={cn('h-1', colored ? CROWD_DOT_CLASS[colored] : OUTLOOK_PENDING_FILL)}
        style={level === 'closed' ? OUTLOOK_CLOSED_STYLE : undefined}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 p-3">
        <div>
          <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
            {weekday}
          </p>
          <p className="text-sm font-semibold">{dayLabel}</p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <CrowdLevelBadge level={level} />
          {wait > 0 && (
            <div className="text-right">
              <p className="leading-none whitespace-nowrap">
                <span
                  className={cn(
                    'text-lg font-bold tabular-nums',
                    colored && CROWD_TEXT_CLASS[colored]
                  )}
                >
                  {wait}
                </span>{' '}
                <span className="text-muted-foreground text-[11px]">{tCommon('min')}</span>
              </p>
              <p className="text-muted-foreground mt-1 text-[10px] leading-none">
                {t('avgWaitLabel')}
              </p>
            </div>
          )}
        </div>

        {day?.advice === 'go' && (
          <p className={cn('flex items-center gap-1.5 font-medium', CROWD_TEXT_CLASS.low)}>
            <Star className="size-3.5 shrink-0 fill-current" aria-hidden="true" />
            {t('dayGo')}
          </p>
        )}
        {day?.advice === 'avoid' && (
          <p className={cn('flex items-center gap-1.5 font-medium', CROWD_TEXT_CLASS.very_high)}>
            <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {t('dayAvoid')}
          </p>
        )}

        {signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {signals.map((signal) => (
              <DaySignalChip
                key={signal}
                className={DAY_SIGNAL_CLASS[signal]}
                label={signalLabel[signal]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
