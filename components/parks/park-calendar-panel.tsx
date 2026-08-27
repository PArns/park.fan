'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useLinkStatus } from 'next/link';
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, getPathname } from '@/i18n/navigation';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import { cn } from '@/lib/utils';
import { parkCalendarPath, type ParkCalendarMonth } from '@/lib/parks/calendar-segments';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * The month grid with its chapter heading — the client half of the calendar page.
 *
 * `ParkCalendarGrid` is imported the way the tab used to import it (`ssr: false`): it formats
 * every cell against the browser clock and decides its layout from the live viewport, neither of
 * which a server render can do. The loading box is the grid's own height rather than `null`,
 * because there is a whole page footer under it and a boundary that reserves nothing pushes that
 * footer down when the chunk lands.
 */
const ParkCalendarGrid = dynamic(
  () => import('@/components/parks/park-calendar-grid').then((m) => m.ParkCalendarGrid),
  { ssr: false, loading: () => <Skeleton className="h-[36rem] w-full rounded-xl" /> }
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
  className?: string;
}) {
  const t = useTranslations('parks.calendarPage');
  const locale = useLocale();
  const href = (m: ParkCalendarMonth | null) =>
    m ? parkCalendarPath(locale, continent, country, city, parkSlug, m) : null;
  const isCurrentMonth =
    month === null || (month.year === currentMonth.year && month.month === currentMonth.month);
  const label = (m: ParkCalendarMonth) =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(m.year, m.month - 1, 1))
    );

  return (
    <section className={cn(className)}>
      {/* `rounded-b-none`: this is the one band with something glued to its underside — the card
        below carries `rounded-t-none border-t-0`, and the two halves are one box. Every other
        chapter's band stands on its own and keeps all four corners. */}
      <ChapterHeading
        icon={CalendarDays}
        title={t('gridTitle')}
        frosted
        className="mb-0 rounded-b-none"
      />

      {/* Heading, month stepper and grid are ONE box. The card takes `rounded-t-none border-t-0`
        so the band's own `rounded-t-xl` and its `border-b` become this box's lid and its first
        rule — the band used to end over open air with a strip of park photo between it and the
        grid's separate card.

        The stepper sits here rather than inside `ParkCalendarGrid`, and that is the whole reason
        the months are crawlable: the grid is a `ssr: false` dynamic import — it formats every cell
        against the browser clock — so anything inside it is absent from the served HTML. With the
        links in there, a crawler arriving at one month found no way to any other and the archive
        existed only for whoever guessed the URLs. This component is an ordinary Client Component,
        so it renders on the server like any other and the two links are in the first byte.

        `prevMonth`/`nextMonth` are `null` where the window the route serves runs out, and the
        stepper stops rather than pointing at a 404. */}
      <Card className="relative gap-4 rounded-t-none border-t-0 p-4 md:p-6">
        <div className="flex items-center justify-end gap-2">
          {/* „Heute" only once it would do something. Twelve months in each direction is a long
            way to walk back one arrow at a time, and the browser's back button is not the same
            offer — somebody who stepped forward six months would have to press it six times.
            Hidden on the current month rather than disabled, because a stepper whose third
            control is permanently greyed out on the page most visitors land on reads as broken. */}
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" className="mr-auto h-9" asChild>
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
          <div className="min-w-[140px] text-center font-semibold">
            {month ? label(month) : null}
          </div>
          <MonthStep href={href(nextMonth)} label={t('nextMonth')}>
            <ChevronRight className="h-4 w-4" />
          </MonthStep>
        </div>

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
      </Card>
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
