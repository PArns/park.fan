'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';

import { SlotPopover, SlotPopoverLink, useSlotPopover } from '@/components/common/slot-popover';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { DaySignalChip } from '@/components/parks/day-signal-key';
import { Link } from '@/i18n/navigation';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { useParkBestDaysCalendar } from '@/lib/hooks/use-park-best-days-calendar';
import {
  isParkCalendarMonthInRange,
  parkCalendarDayHash,
  parkCalendarMonthHref,
  parkCalendarPath,
} from '@/lib/parks/calendar-segments';
import { upcomingWeekdayForecast, WEEKDAY_FORECAST_DATES } from '@/lib/parks/weekday-forecast';
import { cn } from '@/lib/utils';
import { DAY_SIGNAL_CLASS, holidaySignals, type DaySignal } from '@/lib/utils/day-signal-styles';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { parkDayOf } from '@/lib/utils/park-day';

/** The park whose forecast the panel reads, and where its calendar lives. */
export interface WeekdayForecastPark {
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  timezone: string;
  /** `scheduleCoverage.to` from the park payload; a date past it is not linked. */
  coverageTo?: string | null;
}

/** The panel's words, translated on the server so the header ships no namespace of its own. */
export interface WeekdayForecastLabels {
  caption: string;
  /** Weekday names, `0` = Sunday, capitalised as a heading. */
  weekdays: string[];
  openCalendar: string;
  signals: Record<Exclude<DaySignal, 'neighbor'>, string>;
}

/**
 * The next dates of one weekday, as the panel lists them: date, crowd badge, a dot per holiday,
 * then a key for the dots that appear. Subscribes to the `/best-days` snapshot the park page reads
 * anyway, and only once a panel is open (docs/rules/a-subscription-lives-in-the-leaf-that-shows-it.md).
 */
function WeekdayForecastPanel({
  weekday,
  park,
  labels,
}: {
  weekday: number;
  park: WeekdayForecastPark;
  labels: WeekdayForecastLabels;
}) {
  const locale = useLocale();
  const now = useBrowserNow();
  const { data, isPending } = useParkBestDaysCalendar(park);

  const todayIso = now ? parkDayOf(now, park.timezone) : null;
  const dates = data && todayIso ? upcomingWeekdayForecast(data.days, weekday, todayIso) : null;
  const currentMonth = todayIso
    ? { year: Number(todayIso.slice(0, 4)), month: Number(todayIso.slice(5, 7)) }
    : null;

  const dateFormat = getDateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const dayHref = (date: string) => {
    const month = { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
    if (!currentMonth || !isParkCalendarMonthInRange(month, currentMonth, park.coverageTo)) {
      return null;
    }
    const { continent, country, city, parkSlug } = park;
    return `${parkCalendarMonthHref(locale, continent, country, city, parkSlug, month, currentMonth)}${parkCalendarDayHash(date)}`;
  };

  const shownSignals = new Set(dates?.flatMap((d) => holidaySignals(d.holiday)));

  return (
    <>
      <div className="flex flex-col gap-2.5 p-3">
        <div>
          <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
            {labels.caption}
          </p>
          <p className="text-sm font-semibold">{labels.weekdays[weekday]}</p>
        </div>

        <ul className="divide-border/50 -mx-1 divide-y">
          {dates
            ? dates.map(({ date, day, holiday }) => {
                const href = dayHref(date);
                const row = (
                  <>
                    <span className="w-14 shrink-0 font-medium tabular-nums">
                      {dateFormat.format(new Date(`${date}T12:00:00Z`))}
                    </span>
                    <CrowdLevelBadge level={day.level} />
                    <span className="ml-auto flex gap-1" aria-hidden="true">
                      {holidaySignals(holiday).map((signal) => (
                        <span
                          key={signal}
                          className={cn('size-2 rounded-full', DAY_SIGNAL_CLASS[signal])}
                        />
                      ))}
                    </span>
                  </>
                );
                const rowClass = 'flex items-center gap-2 rounded-md px-1 py-1.5';
                return (
                  <li key={date}>
                    {href ? (
                      <Link
                        href={href}
                        className={cn(rowClass, 'hover:bg-muted/50 transition-colors')}
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className={rowClass}>{row}</div>
                    )}
                  </li>
                );
              })
            : // The snapshot in flight: the rows it will fill, at their height.
              Array.from({ length: WEEKDAY_FORECAST_DATES }, (_, i) => (
                <li key={i} className="flex items-center gap-2 px-1 py-1.5">
                  <span className="bg-muted h-3 w-12 rounded-sm" />
                  <span
                    className={cn(
                      'bg-muted h-[22px] w-24 rounded-full',
                      isPending && 'animate-pulse'
                    )}
                  />
                </li>
              ))}
        </ul>

        {shownSignals.size > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {[...shownSignals].map((signal) => (
              <DaySignalChip
                key={signal}
                className={DAY_SIGNAL_CLASS[signal]}
                label={labels.signals[signal as Exclude<DaySignal, 'neighbor'>]}
              />
            ))}
          </div>
        )}
      </div>

      <SlotPopoverLink
        href={parkCalendarPath(locale, park.continent, park.country, park.city, park.parkSlug)}
      >
        {labels.openCalendar}
      </SlotPopoverLink>
    </>
  );
}

/**
 * Hover and tap for the park header's weekday cells: each cell, marked `data-weekday`, opens a
 * panel with that weekday's coming dates from the forecast. The cells stay server-rendered
 * (`children`); this only adds the handlers and the one shared panel.
 *
 * The cells colour a weekday by the park's two-year aggregate; the panel is the forecast for the
 * next six of them, which is what a visitor picking a Saturday wants next.
 */
export function WeekdayForecastHover({
  park,
  labels,
  children,
}: {
  park: WeekdayForecastPark;
  labels: WeekdayForecastLabels;
  children: ReactNode;
}) {
  const { containerRef, anchorRef, active, shown, pinned, close, handlers } = useSlotPopover({
    slotKey: 'weekday',
  });

  return (
    <div ref={containerRef} {...handlers}>
      {children}
      <SlotPopover
        open={active !== null}
        pinned={pinned}
        anchorRef={anchorRef}
        containerRef={containerRef}
        onClose={close}
      >
        <WeekdayForecastPanel weekday={shown} park={park} labels={labels} />
      </SlotPopover>
    </div>
  );
}
