import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  parkCalendarMonthsBack,
  parkCalendarMonthsForward,
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
   * `scheduleCoverage.to` from the park payload — the last date the API can speak for. Omitted or
   * null keeps the old fixed forward span, so a park with no published schedule and a payload
   * cached before the field existed both behave exactly as before.
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
  const shortLabel = (m: ParkCalendarMonth) =>
    new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(m.year, m.month - 1, 1))
    );

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
                  // Every chip carries a surface, including the inactive ones. They used to be
                  // bare text on `border-transparent`, which is legible on a card and was not
                  // legible at all where this row used to live — directly on the park photo.
                  // A month is a control here, and a control that looks like prose is not one.
                  // `min-h-9` and not `.touch-target`: this is the fallback route to a month once
                  // the stepper runs out of arrows, so the chips have to be hittable — but there
                  // are 25 of them in one block and 44 px each would turn the index into a wall.
                  // 36 px is the button scale's own default height.
                  className={cn(
                    'inline-flex min-h-9 items-center rounded-md border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border/60 bg-muted/40 text-foreground/80 hover:border-border hover:bg-accent hover:text-accent-foreground'
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
