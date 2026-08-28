import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  PARK_CALENDAR_MONTH_SPAN,
  parkCalendarMonthsBack,
  parkCalendarPath,
  shiftParkCalendarMonth,
  type ParkCalendarMonth,
} from '@/lib/parks/calendar-segments';

/**
 * Every month the route serves, as links, on every calendar page.
 *
 * The stepper in `ParkCalendarPanel` made the months crawlable at all, but it links exactly two:
 * the previous and the next. Measured on production, the hub for Phantasialand emitted precisely
 * `…/2026/7` and `…/2026/9` — so November 2026 sat three hops beyond the hub, which is itself one
 * hop off the park page and five off the homepage. A crawler reaching the far end of a 25-link
 * chain has to want to, and the pages at the end of it are the ones a person searching
 * „phantasialand ostern 2027" would have wanted first.
 *
 * So the whole window is one hop from anywhere inside it. Rendered on the month pages too, not
 * only the hub: that turns the set into a mesh where every month is reachable from every other,
 * which is what stops the far months from being the least-linked pages on the site.
 *
 * Not a `ChapterHeading`. This is navigation, not a chapter of the page — it gets a labelled
 * `<nav>` and no `<h2>`, so the document outline still reads as the four chapters the page
 * actually has (CLAUDE.md, „a chapter opens the same way everywhere").
 */
export async function ParkCalendarMonthIndex({
  locale,
  continent,
  country,
  city,
  parkSlug,
  currentMonth,
  activeMonth,
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
  className?: string;
}) {
  const t = await getTranslations('parks.calendarPage');

  // Built by shifting from the current month rather than by looping over years: the window is
  // defined in months (`PARK_CALENDAR_MONTH_SPAN`) and December → January has to wrap the year
  // exactly the way the route's own range check does, or the index links at a 404.
  const months: ParkCalendarMonth[] = [];
  for (
    let offset = -parkCalendarMonthsBack(currentMonth);
    offset <= PARK_CALENDAR_MONTH_SPAN.forward;
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
  const shortLabel = (m: ParkCalendarMonth) =>
    new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(m.year, m.month - 1, 1))
    );

  return (
    <nav aria-label={t('monthIndexLabel')} className={cn('mt-6', className)}>
      <p className="text-muted-foreground mb-3 text-sm">{t('monthIndexLabel')}</p>
      <div className="flex flex-col gap-3">
        {[...byYear.entries()].map(([year, entries]) => (
          <div key={year} className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground w-10 shrink-0 text-xs font-semibold tabular-nums">
              {year}
            </span>
            {entries.map((m) => {
              const active = isActive(m);
              // The current month's canonical address is the hub, so its chip links there rather
              // than at `/2026/8` — the same rule the stepper follows, for the same reason: the
              // app should not mint a URL that only exists to canonical away.
              const href = parkCalendarPath(
                locale,
                continent,
                country,
                city,
                parkSlug,
                isCurrent(m) ? undefined : m
              );
              return (
                <Link
                  key={`${m.year}-${m.month}`}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'hover:bg-accent hover:text-accent-foreground border-transparent'
                  )}
                >
                  {shortLabel(m)}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
