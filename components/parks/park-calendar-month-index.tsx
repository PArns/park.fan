import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { ParkCalendarMonthIndexChip } from '@/components/parks/park-calendar-month-index-chip';
import {
  parkCalendarMonthsBack,
  parkCalendarMonthsForward,
  parkCalendarPath,
  shiftParkCalendarMonth,
  type ParkCalendarMonth,
} from '@/lib/parks/calendar-segments';

/**
 * Every month the route serves, as links, on every calendar page. The stepper links only the
 * previous and next month, which left the far months many hops from the hub; this index puts every
 * month one hop from every other.
 *
 * Navigation, not a chapter: a labelled `<nav>` and no `<h2>`, so the outline keeps the page's own
 * chapters. See docs/rules/a-chapter-opens-the-same-way-everywhere.md.
 */
export async function ParkCalendarMonthIndex({
  locale,
  continent,
  country,
  city,
  parkSlug,
  currentMonth,
  activeMonth,
  coverageTo,
  className,
}: {
  locale: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Today's month in the PARK's zone — the centre of the window and the hub's own month. */
  currentMonth: ParkCalendarMonth;
  /** The month this page shows, or `null` on the hub. */
  activeMonth: ParkCalendarMonth | null;
  /**
   * `scheduleCoverage.to` from the park payload, the last date the API can speak for. Omitted or
   * null keeps the fixed forward span, as for a park with no published schedule.
   */
  coverageTo?: string | null;
  className?: string;
}) {
  const t = await getTranslations('parks.calendarPage');

  // Built by shifting from the current month rather than by looping over years: the window is
  // defined in months (`PARK_CALENDAR_MONTH_SPAN`) and December → January has to wrap the year
  // exactly the way the route's own range check does, or the index links at a 404.
  const months: ParkCalendarMonth[] = [];
  for (
    let offset = -parkCalendarMonthsBack(currentMonth);
    offset <= parkCalendarMonthsForward(currentMonth, coverageTo);
    offset++
  ) {
    months.push(shiftParkCalendarMonth(currentMonth, offset));
  }

  const byYear = new Map<number, ParkCalendarMonth[]>();
  for (const m of months) {
    const bucket = byYear.get(m.year);
    if (bucket) bucket.push(m);
    else byYear.set(m.year, [m]);
  }

  const isCurrent = (m: ParkCalendarMonth) =>
    m.year === currentMonth.year && m.month === currentMonth.month;
  const isActive = (m: ParkCalendarMonth) =>
    activeMonth ? m.year === activeMonth.year && m.month === activeMonth.month : isCurrent(m);

  /** Month name only — the year is the group's own heading, so repeating it in 25 chips is noise. */
  const monthFormat = getDateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const shortLabel = (m: ParkCalendarMonth) =>
    monthFormat.format(new Date(Date.UTC(m.year, m.month - 1, 1)));

  return (
    <nav aria-label={t('monthIndexLabel')} className={cn(className)}>
      <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        {t('monthIndexLabel')}
      </p>
      <div className="flex flex-col gap-2">
        {[...byYear.entries()].map(([year, entries]) => (
          <div key={year} className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground w-9 shrink-0 text-xs font-semibold tabular-nums">
              {year}
            </span>
            {entries.map((m) => {
              const active = isActive(m);
              // The current month's canonical address is the hub, so its chip links there, as the
              // stepper does: the app should not mint a URL that only exists to canonical away.
              const href = parkCalendarPath(
                locale,
                continent,
                country,
                city,
                parkSlug,
                isCurrent(m) ? undefined : m
              );
              return (
                <ParkCalendarMonthIndexChip
                  key={`${m.year}-${m.month}`}
                  href={href}
                  active={active}
                >
                  {shortLabel(m)}
                </ParkCalendarMonthIndexChip>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
