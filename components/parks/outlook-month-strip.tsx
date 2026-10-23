'use client';

import { useLocale, useTranslations } from 'next-intl';

import { ForecastDayDetails } from '@/components/parks/forecast-day-details';
import { SlotPopover, SlotPopoverLink, useSlotPopover } from '@/components/common/slot-popover';
import { useRouter } from '@/i18n/navigation';
import { parkCalendarDayHash } from '@/lib/parks/calendar-segments';
import { cn } from '@/lib/utils';
import { CROWD_DOT_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS, holidaySignals } from '@/lib/utils/day-signal-styles';
import {
  OUTLOOK_CLOSED_STYLE,
  OUTLOOK_PAST_FILL,
  OUTLOOK_PENDING_FILL,
} from '@/lib/utils/yearly-outlook-styles';
import type { OutlookDay, OutlookHoliday } from '@/lib/utils/yearly-outlook';

/**
 * One month of the twelve-month outlook as a ribbon of days, with a track under it for school
 * breaks, public holidays and bridge days.
 *
 * Slots the forecast does not cover stay muted rather than closing up, so a gap in the middle of
 * November reads as a gap. A closed day is hatched, a day already over is fainter, and a Monday
 * leaves a wider gap so the weekends can be read off the strip. The holidays sit on a track below
 * rather than as a frame round the day: a yellow frame on a yellow „normal" day disappears, and on
 * a phone a day is ten pixels wide.
 *
 * A mouse shows a day's forecast on hover and opens the day in the wait-time calendar on click; a
 * tap pins the same panel, with the calendar as a link inside it (`useSlotPopover`). The strip is
 * `aria-hidden`: the month's name links to the same calendar, where every day is a button.
 */
export function OutlookMonthStrip({
  monthKey,
  days,
  holidays,
  firstWeekday,
  pastDays,
  calendarHref,
  interactive,
}: {
  /** `YYYY-MM`, park-local. */
  monthKey: string;
  days: (OutlookDay | null)[];
  /** The month's holidays, one entry per day; names already translated. */
  holidays: (OutlookHoliday | null)[];
  /** Weekday of the 1st, `0` = Sunday. */
  firstWeekday: number;
  /** Days at the start of the month that are already over. */
  pastDays: number;
  /** The month in the wait-time calendar, or `null` when the calendar does not serve it. */
  calendarHref: string | null;
  /** `false` for the placeholder, which must claim nothing about any day. */
  interactive: boolean;
}) {
  const t = useTranslations('parks.yearlyOutlook');
  const locale = useLocale();
  const router = useRouter();

  const dateOf = (index: number) => `${monthKey}-${String(index + 1).padStart(2, '0')}`;
  const dayHref = (index: number) =>
    calendarHref ? `${calendarHref}${parkCalendarDayHash(dateOf(index))}` : null;
  const isWeekStart = (index: number) => index > 0 && (firstWeekday + index) % 7 === 1;

  const { containerRef, anchorRef, active, shown, pinned, close, handlers } = useSlotPopover({
    slotKey: 'day',
    // A day already over has nothing to forecast.
    isEnabled: (index) => index >= pastDays,
    // A mouse already sees the panel on hover, so a click only navigates. Where the calendar does
    // not serve the month there is nowhere to go, and pinning would freeze the hover instead.
    onMouseClick: (index) => {
      const href = dayHref(index);
      if (href) router.push(href);
      return true;
    },
  });
  const shownHref = dayHref(shown);

  return (
    // `w-full shrink-0` below `sm` and `flex-1` only from `sm` up: the row is a column on a phone,
    // where `flex-1` sets the height basis and collapses the strip to nothing.
    <div className="flex w-full min-w-0 shrink-0 flex-col gap-0.5 sm:flex-1" aria-hidden="true">
      <div
        ref={containerRef}
        className={cn(
          'flex h-5 gap-px overflow-hidden rounded-[3px]',
          interactive && calendarHref && 'cursor-pointer'
        )}
        {...(interactive ? handlers : {})}
      >
        {days.map((day, index) => (
          <span
            key={index}
            data-day={index}
            className={cn(
              'flex-1 transition-shadow duration-150',
              isWeekStart(index) && 'ml-0.5',
              index < pastDays
                ? OUTLOOK_PAST_FILL
                : day && isColoredCrowdLevel(day.level)
                  ? CROWD_DOT_CLASS[day.level]
                  : OUTLOOK_PENDING_FILL,
              index === active && 'ring-foreground ring-2 ring-inset'
            )}
            style={day?.level === 'closed' ? OUTLOOK_CLOSED_STYLE : undefined}
          />
        ))}
      </div>

      <div className="flex h-[3px] gap-px">
        {holidays.map((holiday, index) => (
          <span key={index} className={cn('flex flex-1', isWeekStart(index) && 'ml-0.5')}>
            {holidaySignals(holiday).map((signal) => (
              <span key={signal} className={cn('flex-1', DAY_SIGNAL_CLASS[signal])} />
            ))}
          </span>
        ))}
      </div>

      {interactive && (
        <SlotPopover
          open={active !== null}
          pinned={pinned}
          anchorRef={anchorRef}
          containerRef={containerRef}
          onClose={close}
        >
          <ForecastDayDetails
            date={dateOf(shown)}
            day={days[shown] ?? null}
            holiday={holidays[shown] ?? null}
            locale={locale}
          />
          {shownHref && <SlotPopoverLink href={shownHref}>{t('openDay')}</SlotPopoverLink>}
        </SlotPopover>
      )}
    </div>
  );
}
