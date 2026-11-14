'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import { DAY_SIGNAL_CLASS, STORM_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { sentenceCase } from '@/lib/utils/sentence-case';
import { cleanBreakName } from '@/lib/trip-regions/best-time';
import { formatDateRange } from '@/lib/trip-regions/hub-data';
import { stormSignal, type MonthEvent, type StormCode } from '@/lib/trip-regions/date-facts';
import type { ParkCodeEntry } from '@/lib/trip-regions/plan-week';

/**
 * The legend keys of the storm codes a calendar draws, the season before its peak, in the climate
 * chips' words („Hurrikansaison“, „Hochphase der Hurrikansaison“), for `ParkCalendarLegend`'s
 * `extraSignals`.
 */
export function useStormKeys(): (
  codes: Iterable<StormCode>
) => Array<{ key: string; className: string; label: string }> {
  const t = useTranslations('tripPlanner.climate');
  return (codes) =>
    [...new Set(codes)]
      .sort(
        (a, b) => Number(stormSignal(a) === 'stormPeak') - Number(stormSignal(b) === 'stormPeak')
      )
      .map((code) => ({
        key: code,
        className: STORM_SIGNAL_CLASS[stormSignal(code)],
        label: sentenceCase(t(code)),
      }));
}

/** The small uppercase label every key under the planner's calendars starts with. */
const KEY_LABEL =
  'text-muted-foreground shrink-0 text-[10px] font-medium tracking-widest uppercase';

/**
 * What the park codes under the dates and in the Month view stand for, „MK Magic Kingdom · AK Animal
 * Kingdom“, in the legend's own look. Only the codes the view shows (`parkCodeKey`), wrapped on a
 * phone rather than folded away.
 */
export function PlanCodeKey({
  entries,
  className,
}: {
  entries: readonly ParkCodeEntry[];
  className?: string;
}) {
  const t = useTranslations('tripPlanner');
  if (entries.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
      <span className={KEY_LABEL}>{t('codeKey')}</span>
      <dl className="contents">
        {entries.map((entry) => (
          <div key={entry.slug} className="flex items-baseline gap-1 text-[11px] whitespace-nowrap">
            <dt className="font-bold tracking-wide">{entry.code}</dt>
            <dd>{entry.name}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The month's events under the date grid (`monthEvents`): party nights counted, festivals, school
 * breaks and holidays with their dates in the month, New Year's Eve once. Event names are the parks'
 * own brand names and stay as they are; a break's or a holiday's is translated.
 */
export function PlanMonthEvents({
  events,
  month,
  codeOf,
  locale,
}: {
  events: readonly MonthEvent[];
  /** `YYYY-MM`. */
  month: string;
  /** A park slug's code, as the grid writes it. */
  codeOf: (slug: string) => string;
  locale: string;
}) {
  const t = useTranslations('tripPlanner.dates');
  if (events.length === 0) return null;
  const monthName = getDateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${month}-15T12:00:00Z`)
  );
  const day = (date: string) => formatDateRange(date, date, locale);
  const when = (event: MonthEvent) => {
    if (event.kind === 'party') return t('nights', { count: event.dates.length });
    const first = event.dates[0];
    const last = event.dates[event.dates.length - 1];
    if (event.kind === 'nye') return day(first);
    if (event.wholeMonth) return t('wholeMonth');
    if (event.fromStart) return t('until', { date: day(last) });
    if (event.toEnd) return t('since', { date: day(first) });
    return formatDateRange(first, last, locale);
  };
  const name = (event: MonthEvent) =>
    event.kind === 'nye'
      ? t('nye')
      : event.kind === 'break' || event.kind === 'holiday'
        ? event.name
          ? translateHolidayName(cleanBreakName(event.name), locale)
          : ''
        : (event.name ?? '');

  return (
    <div className="flex flex-col gap-1.5">
      <span className={KEY_LABEL}>{t('eventsTitle', { month: monthName })}</span>
      <ul className="flex flex-col gap-1 text-xs">
        {events.map((event) => (
          <li key={event.id} className="flex items-baseline gap-2">
            <span className="flex w-4 shrink-0 justify-center self-center" aria-hidden="true">
              {event.kind === 'party' ? (
                <Ticket className="text-crowd-ink-high size-3" />
              ) : event.kind === 'nye' ? (
                <Sparkles className="text-primary-ink size-3" />
              ) : event.kind === 'break' || event.kind === 'holiday' ? (
                <span
                  className={cn(
                    'h-[3px] w-3 rounded-full',
                    DAY_SIGNAL_CLASS[event.kind === 'break' ? 'school' : 'holiday']
                  )}
                />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              {event.parkSlugs.length > 0 && (
                <span className="mr-1.5 font-bold tracking-wide">
                  {event.parkSlugs.map(codeOf).join(' ')}
                </span>
              )}
              {name(event)}
              {event.expected && <span className="text-muted-foreground"> · {t('expected')}</span>}
            </span>
            <span className="text-muted-foreground shrink-0 tabular-nums">{when(event)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
