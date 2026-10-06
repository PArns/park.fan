'use client';

import { useCallback, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useLinkStatus } from 'next/link';
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scale,
  X,
} from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { TILE_GLASS } from '@/components/common/glass-card';
import { Button } from '@/components/ui/button';
import { ParkCalendarGridPlaceholder } from '@/components/parks/park-calendar-grid-placeholder';
import { Link, getPathname } from '@/i18n/navigation';
import { suppressScrollToTopFor } from '@/lib/navigation/history-navigation';
import { cn } from '@/lib/utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { parkCalendarPath, type ParkCalendarMonth } from '@/lib/parks/calendar-segments';
import { calendarGridReservation } from '@/lib/parks/calendar-grid-geometry';
import { ParkCalendarLegend } from '@/components/parks/park-calendar-legend';
import { dayComparisonStore } from '@/lib/parks/day-comparison-store';
import type { ParkWithAttractions } from '@/lib/api/types';
import { parkArgs } from '@/lib/i18n/park-phrase';
import type { Locale } from '@/i18n/config';

/**
 * `ParkCalendarGrid` is `ssr: false`: it formats every cell against the browser clock and picks its
 * layout from the live viewport. The loading box is the grid's own height from
 * `calendarGridReservation` rather than `null`, because the rest of the page sits under it. See
 * docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */
const ParkCalendarGrid = dynamic(
  () => import('@/components/parks/park-calendar-grid').then((m) => m.ParkCalendarGrid),
  {
    ssr: false,
    // The three custom properties are set by the wrapper below, the only place that knows the
    // month: a module-scope `loading` never sees props. The grid's own loading state renders the
    // same component, so both waits reserve one box.
    loading: () => <ParkCalendarGridPlaceholder />,
  }
);

/**
 * Client half of the park's calendar page: chapter heading, month stepper links, legend,
 * comparison toggle, the month grid (loaded client-side into a reserved height) and the month index.
 */
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
   * Today's month in the park's timezone, resolved on the server. Computed on both sides of the
   * boundary, it would disagree across a month rollover and hydrate a „Heute" button pointing at
   * the wrong month.
   */
  currentMonth: ParkCalendarMonth;
  prevMonth: ParkCalendarMonth | null;
  nextMonth: ParkCalendarMonth | null;
  /**
   * The month index, rendered inside this card under the grid: it is the same control as the
   * stepper, showing every month at once.
   */
  monthIndex?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations('parks.calendarPage');
  const locale = useLocale();
  // The month the grid will draw — on the hub that is today's, which is what it opens on.
  const reservation = calendarGridReservation(month ?? currentMonth);
  /**
   * The URL for a month, and the hub's URL for the current month: `/wartezeiten-kalender` and
   * `/wartezeiten-kalender/2026/8` render the same grid in August, and the app should not mint the
   * duplicate whose canonical points away. A typed `/2026/8` still resolves.
   */
  const href = (m: ParkCalendarMonth | null) => {
    if (!m) return null;
    const isCurrent = m.year === currentMonth.year && m.month === currentMonth.month;
    return parkCalendarPath(locale, continent, country, city, parkSlug, isCurrent ? undefined : m);
  };
  const isCurrentMonth =
    month === null || (month.year === currentMonth.year && month.month === currentMonth.month);
  const label = (m: ParkCalendarMonth) =>
    getDateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(m.year, m.month - 1, 1))
    );

  /*
   * The month stepper, in the heading band. It lives in this component and not in the `ssr: false`
   * grid, so its two links are in the first byte and a crawler can reach every month.
   * `prevMonth`/`nextMonth` are `null` where the route's window runs out, and the stepper stops
   * rather than pointing at a 404.
   */
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
            {/* Below `sm` the stepper has little room for four controls, and the `aria-label` above
                already names the target, so dropping the text costs only the width. */}
            <span className="hidden sm:inline">{t('currentMonth')}</span>
          </Link>
        </Button>
      )}
      <MonthStep href={href(prevMonth)} label={t('previousMonth')}>
        <ChevronLeft className="h-4 w-4" />
      </MonthStep>
      {/* Centred, and from `sm` fixed-width, so the arrows hold still when the month name changes
          length; on a phone the box may wrap instead, which keeps the next-month arrow on screen.
          `month ?? currentMonth` because the hub names no month in its URL and opens on today's,
          resolved on the server in the park's zone so hydration agrees. */}
      <div className="min-w-0 flex-1 text-center font-semibold sm:min-w-[140px] sm:flex-none">
        {label(month ?? currentMonth)}
      </div>
      <MonthStep href={href(nextMonth)} label={t('nextMonth')}>
        <ChevronRight className="h-4 w-4" />
      </MonthStep>
    </>
  );

  return (
    <section className={cn(className)}>
      {/* `rounded-b-none`: the card below carries `rounded-t-none border-t-0`, and the two halves
          are one box. */}
      <ChapterHeading
        icon={CalendarDays}
        title={t('gridTitle')}
        hint={t('gridSubline', {
          month: label(month ?? currentMonth),
          ...parkArgs(locale as Locale, park.name, park.nameArticleDe),
        })}
        /*
         * The stepper and, under it, the switch that decides what a press on a day tile means.
         * Server-rendered here rather than in the `ssr: false` grid, so it shows on first paint and
         * the `--cal-grid-h*` reservation still covers the grid. `dayComparisonStore` is keyed by
         * park slug, so switch and grid share state without a prop.
         */
        action={
          <div className="flex w-full min-w-0 flex-col items-end gap-2">
            <div className="flex w-full min-w-0 items-center justify-end gap-2">{monthStepper}</div>
            <CalendarCompareToggle parkSlug={parkSlug} />
          </div>
        }
        /*
         * Beside the heading, not in its title row: the action is two storeys tall and pushed the
         * subline away from the title it describes.
         */
        actionAside
        frosted
        className="mb-0 rounded-b-none"
      />

      {/* Heading, stepper and grid are one box: the card takes `rounded-t-none border-t-0`, so the
          band's `rounded-t-xl` and `border-b` become its lid and first rule. */}
      <div
        className={cn(
          // `TILE_GLASS`, the recipe the statistics and best-days panels use, so the page's
          // chapters sit on one glass level over the same photo.
          TILE_GLASS,
          'border-border/50 relative flex flex-col gap-4 rounded-b-xl border border-t-0 p-4 md:p-6'
        )}
      >
        {/* The colour key, server-rendered on its own line above the grid: it needs no data, and
            inside the grid it made the two loading states differ by its own height. */}
        <ParkCalendarLegend />

        {/* The reservation travels as three custom properties, not classes, because Tailwind cannot
            see a computed class name. Set on the month the grid will show, which on the hub is the
            current month. */}
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

/**
 * „Zwei Tage vergleichen": the switch that turns a press on a day tile from „open this day" into
 * „pick this day". A primary `Button`, not a `FilterToggle` pill, because it is the one thing on
 * the card that acts on the month; its label says what a second press does, and it keeps
 * `aria-pressed`. It subscribes on its own, so a pick does not re-render the panel and the grid
 * under it.
 */
function CalendarCompareToggle({ parkSlug }: { parkSlug: string }) {
  const t = useTranslations('parks.dayComparison');
  const active = useSyncExternalStore(
    dayComparisonStore.subscribe,
    useCallback(() => dayComparisonStore.getSnapshot(parkSlug).active, [parkSlug]),
    // Nothing is selected in the first HTML, and the server cannot know otherwise — same answer
    // the store's own `getServerSnapshot` gives.
    () => false
  );

  return (
    <Button
      variant={active ? 'secondary' : 'default'}
      size="sm"
      // The `sm` size as it comes: the button stands under the stepper row, not in it, so it owes
      // that row no height; and not full width on a phone, where it would be the loudest thing on
      // the card. `max-sm:h-11` is the touch floor of the button scale.
      aria-pressed={active}
      onClick={() => dayComparisonStore.setActive(parkSlug, !active)}
    >
      {active ? (
        <X className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Scale className="h-4 w-4" aria-hidden="true" />
      )}
      {active ? t('compareStop') : t('compare')}
    </Button>
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
      {/* `scroll={false}`: the grid sits in the same place on the next month's page, so leaving the
          scroll alone makes the arrow read as a stepper. A cold load of a month URL still opens at
          the top. */}
      <Link
        href={href}
        aria-label={label}
        scroll={false}
        /*
         * `getPathname`, not `href`: the app's scroll handler compares against
         * `window.location.pathname`, which carries the locale prefix, while `href` is
         * locale-relative.
         */
        onClick={() => suppressScrollToTopFor(getPathname({ href, locale }))}
      >
        <MonthStepIcon>{children}</MonthStepIcon>
      </Link>
    </Button>
  );
}

/**
 * The arrow, or a spinner while the month's page is on its way. A month step is a navigation, so
 * the grid's `isLoading` never covers the wait; `useLinkStatus` does, but only inside the `<Link>`
 * it is rendered in, hence its own component.
 */
function MonthStepIcon({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children;
}
