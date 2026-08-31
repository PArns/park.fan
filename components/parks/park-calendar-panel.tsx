'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useLinkStatus } from 'next/link';
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { TILE_GLASS } from '@/components/common/glass-card';
import { Button } from '@/components/ui/button';
import { ParkCalendarGridPlaceholder } from '@/components/parks/park-calendar-grid-placeholder';
import { Link, getPathname } from '@/i18n/navigation';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import { cn } from '@/lib/utils';
import { parkCalendarPath, type ParkCalendarMonth } from '@/lib/parks/calendar-segments';
import { calendarGridReservation } from '@/lib/parks/calendar-grid-geometry';
import { ParkCalendarLegend } from '@/components/parks/park-calendar-legend';
import type { ParkWithAttractions } from '@/lib/api/types';
import { parkArgs } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';

/**
 * The month grid with its chapter heading — the client half of the calendar page.
 *
 * `ParkCalendarGrid` is imported the way the tab used to import it (`ssr: false`): it formats
 * every cell against the browser clock and decides its layout from the live viewport, neither of
 * which a server render can do. The loading box is the grid's own height rather than `null`,
 * because there is a whole page footer under it and a boundary that reserves nothing pushes that
 * footer down when the chunk lands.
 *
 * That box used to be `h-[36rem]` — 576 px, one number for two layouts and twelve months. It was
 * short at every breakpoint and catastrophically short on a phone: measured against production on
 * Phantasialand's November 2026, the real grid is 1992 px at 390 px wide, so the calendar landed
 * and threw everything below it — best days, statistics, FAQ, footer — down by 1416 px. The
 * height now comes from `calendarGridReservation`, which reads it off the month in the URL; see
 * that module for the measurements and why the row count is the part a server can know.
 */
const ParkCalendarGrid = dynamic(
  () => import('@/components/parks/park-calendar-grid').then((m) => m.ParkCalendarGrid),
  {
    ssr: false,
    // The three custom properties are set by the wrapper below, which is the only place that
    // knows the month. A `loading` component is created at module scope and never sees props, so
    // the number has to reach it through the cascade — and the grid's OWN loading state renders
    // the same component for the same reason, or the two waits reserve two different boxes.
    loading: () => <ParkCalendarGridPlaceholder />,
  }
);

export function ParkCalendarPanel({
  park,
  continent,
  country,
  city,
  parkSlug,
  month,
  currentMonth,
  prevMonth,
  nextMonth,
  monthIndex,
  className,
}: {
  park: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** The month this URL names, or `null` on the hub — where the grid opens on today's month. */
  month: ParkCalendarMonth | null;
  /**
   * Today's month in the PARK's timezone, resolved on the server.
   *
   * Passed in rather than read here: this is a Client Component, and a park in Florida is still
   * on yesterday's date for six hours after midnight in Berlin — computing it on both sides of
   * the boundary would disagree across a month rollover and hydrate into a „Heute" button that
   * points at the wrong month, or none where there should be one.
   */
  currentMonth: ParkCalendarMonth;
  prevMonth: ParkCalendarMonth | null;
  nextMonth: ParkCalendarMonth | null;
  /**
   * The month index, rendered inside this card under the grid.
   *
   * It sat under the whole page before, as a bare `<nav>` on the park photo — white chips on a
   * night shot of a carousel, with no surface behind them and every other chapter of the page
   * between them and the calendar they belong to. It is the same control as the stepper at the
   * top of this card, just showing every month at once, so it belongs in the same box.
   */
  monthIndex?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations('parks.calendarPage');
  const locale = useLocale();
  // The month the grid will draw — on the hub that is today's, which is what it opens on.
  const reservation = calendarGridReservation(month ?? currentMonth);
  /**
   * The URL for a month — and the hub's URL for the CURRENT month, deliberately.
   *
   * `/wartezeiten-kalender` and `/wartezeiten-kalender/2026/8` render the same grid in August, so the
   * current month has two addresses. The route's canonical already points the month one at the
   * hub, which is what a crawler needs; this stops the app from minting the duplicate in the
   * first place. Without it, stepping back from September landed on `/2026/8` — a page whose own
   * title, description and H1 are written for a URL that canonicals away and will never be shown.
   *
   * Typed and bookmarked `/2026/8` still resolves; the canonical remains the safety net for it.
   */
  const href = (m: ParkCalendarMonth | null) => {
    if (!m) return null;
    const isCurrent = m.year === currentMonth.year && m.month === currentMonth.month;
    return parkCalendarPath(locale, continent, country, city, parkSlug, isCurrent ? undefined : m);
  };
  const isCurrentMonth =
    month === null || (month.year === currentMonth.year && month.month === currentMonth.month);
  const label = (m: ParkCalendarMonth) =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(m.year, m.month - 1, 1))
    );

  /* The month stepper, rendered in the heading band rather than beside the grid.

    It stays in THIS component wherever it sits, and that is what keeps the archive crawlable:
    the grid is a `ssr: false` dynamic import — it formats every cell against the browser clock —
    so anything inside it is absent from the served HTML. With the links down there a crawler
    arriving at one month found no way to any other, and the archive existed only for whoever
    guessed the URLs. This is an ordinary Client Component, so it renders on the server and the
    two links are in the first byte.

    `prevMonth`/`nextMonth` are `null` where the window the route serves runs out, and the stepper
    stops rather than pointing at a 404. */
  const monthStepper = (
    <>
      {!isCurrentMonth && (
        <Button variant="outline" size="sm" className="h-9" asChild>
          <Link
            href={parkCalendarPath(locale, continent, country, city, parkSlug)}
            aria-label={t('currentMonthAria')}
            scroll={false}
            onClick={() =>
              suppressScrollToTopFor(
                getPathname({
                  href: parkCalendarPath(locale, continent, country, city, parkSlug),
                  locale,
                })
              )
            }
          >
            <MonthStepIcon>
              <CalendarCheck className="h-4 w-4" />
            </MonthStepIcon>
            {t('currentMonth')}
          </Link>
        </Button>
      )}
      <MonthStep href={href(prevMonth)} label={t('previousMonth')}>
        <ChevronLeft className="h-4 w-4" />
      </MonthStep>
      {/* Centred and fixed-width so the two arrows do not move when the month name changes
          length — „Mai 2026" against „September 2026" is 60 px of travel otherwise.

          `month ?? currentMonth`, because the hub names no month in its URL and used to render an
          empty box between the two arrows. It opens on today's month, so that is the month to
          write — and `currentMonth` is resolved on the server in the PARK's timezone precisely so
          both sides of the hydration boundary agree about which one that is. */}
      <div className="min-w-[140px] text-center font-semibold">{label(month ?? currentMonth)}</div>
      <MonthStep href={href(nextMonth)} label={t('nextMonth')}>
        <ChevronRight className="h-4 w-4" />
      </MonthStep>
    </>
  );

  return (
    <section className={cn(className)}>
      {/* `rounded-b-none`: this is the one band with something glued to its underside — the card
        below carries `rounded-t-none border-t-0`, and the two halves are one box. Every other
        chapter's band stands on its own and keeps all four corners. */}
      <ChapterHeading
        icon={CalendarDays}
        title={t('gridTitle')}
        hint={t('gridSubline', {
          month: label(month ?? currentMonth),
          ...parkArgs(locale as Locale, park.name, park.nameArticleDe),
        })}
        action={monthStepper}
        frosted
        className="mb-0 rounded-b-none"
      />

      {/* Heading, stepper and grid are ONE box. The card takes `rounded-t-none border-t-0` so the
        band's own `rounded-t-xl` and its `border-b` become this box's lid and its first rule — the
        band used to end over open air with a strip of park photo between it and the grid's
        separate card. See `monthStepper` above for why the links are not inside the grid. */}
      <div
        className={cn(
          // `TILE_GLASS`, the same recipe „Historische Wartezeit-Statistiken" and „Beste
          // Reisezeit" use for their panels. This was a plain `Card`, i.e. the default
          // `bg-background/60` + `backdrop-blur-md`, which put three chapters of one page on two
          // different glass levels — the calendar thinner and less blurred than the two boxes
          // above and below it, over the same park photograph.
          TILE_GLASS,
          'border-border/50 relative flex flex-col gap-4 rounded-b-xl border border-t-0 p-4 md:p-6'
        )}
      >
        {/* The colour key, on its own line above the grid. The month stepper used to share it
          and has moved up into the heading band: the month is the page's subject, and ranking it
          after a legend put the one control everybody reaches for at the end of a row. The legend
          was inside the `ssr: false` grid before that and is server-rendered here — it needs no
          data, and down there it made the grid's two loading states differ by its own height. */}
        <ParkCalendarLegend />

        {/* The wrapper exists to carry the reservation, and it carries it as three custom
          properties rather than three classes because Tailwind cannot see a class name that was
          computed — `h-[${n}px]` produces no CSS. The arbitrary-value utilities on the skeleton
          read these, so the arithmetic has exactly one home (`calendarGridReservation`) and the
          JIT keeps working.

          Set on the month the GRID will show, which on the hub is the current month rather than
          `null` — the hub opens on today and reserves for today. */}
        <div
          style={
            {
              '--cal-grid-h': `${reservation.base}px`,
              '--cal-grid-h-md': `${reservation.md}px`,
              '--cal-grid-h-lg': `${reservation.lg}px`,
            } as React.CSSProperties
          }
        >
          <ParkCalendarGrid
            park={park}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            month={month}
            prevMonth={prevMonth}
            nextMonth={nextMonth}
          />
        </div>

        {/* Separated by a rule rather than by a gap: the stepper above, the grid, and this are one
          control at three grains, and a floating chip row reads as a different chapter. */}
        {monthIndex ? <div className="border-t pt-4">{monthIndex}</div> : null}
      </div>
    </section>
  );
}

/** One end of the stepper: a link to that month's page, or a dead button at the window's edge. */
function MonthStep({
  href,
  label,
  children,
}: {
  /** Locale-RELATIVE, the way `Link` from `@/i18n/navigation` wants it. */
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  if (!href) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="icon" asChild>
      {/* `scroll={false}`: a month used to be a `setState` and the page stayed where it was. It is
        a navigation now, and Next's default is to put a new page at the top — so pressing „nächster
        Monat" threw the reader back to the park's title card and they had to scroll down to the
        grid again for every month. The grid is in the same place on the next page, so leaving the
        scroll alone is what makes the arrow read as a stepper rather than as a link. Only affects
        in-app navigation; a cold load of a month URL still opens at the top, which is right. */}
      <Link
        href={href}
        aria-label={label}
        scroll={false}
        /* `getPathname` and not `href`: this app's own scroll handler compares against
           `window.location.pathname`, which carries the locale prefix (`localePrefix: 'always'`),
           while `href` here is locale-relative — the two never matched and the page kept jumping
           to the top on every month step. */
        onClick={() => suppressScrollToTopFor(getPathname({ href, locale }))}
      >
        <MonthStepIcon>{children}</MonthStepIcon>
      </Link>
    </Button>
  );
}

/**
 * The arrow, or a spinner while the month's page is on its way.
 *
 * A month used to be a `setState` and the grid's own `isLoading` covered the wait. It is a
 * navigation now, so that flag never fires — the fetch happens on the next page — and pressing an
 * arrow gave no feedback at all until the new page painted. `useLinkStatus` reports exactly that
 * gap, and it only reports for the `<Link>` it is rendered inside, which is why this is its own
 * component rather than a flag read one level up.
 */
function MonthStepIcon({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children;
}
