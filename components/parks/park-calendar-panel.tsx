'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useLinkStatus } from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
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
  prevMonth: ParkCalendarMonth | null;
  nextMonth: ParkCalendarMonth | null;
  className?: string;
}) {
  const t = useTranslations('parks.calendarPage');
  const locale = useLocale();
  const href = (m: ParkCalendarMonth | null) =>
    m ? parkCalendarPath(locale, continent, country, city, parkSlug, m) : null;
  const label = (m: ParkCalendarMonth) =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(m.year, m.month - 1, 1))
    );

  return (
    <section className={cn(className)}>
      <ChapterHeading icon={CalendarDays} title={t('gridTitle')} frosted />

      {/* The stepper sits HERE, not inside the grid, and that is the whole reason the months are
        crawlable. `ParkCalendarGrid` is a `ssr: false` dynamic import — it formats every cell
        against the browser clock — so anything inside it is absent from the served HTML. With the
        links in there, a crawler arriving at one month found no way to any other, and the archive
        existed only for whoever guessed the URLs. This component is an ordinary Client Component,
        so it renders on the server like any other and the two links are in the first byte.

        `prevMonth`/`nextMonth` are `null` where the window the route serves runs out, and the
        stepper stops rather than pointing at a 404. */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <MonthStep href={href(prevMonth)} label={t('previousMonth')}>
          <ChevronLeft className="h-4 w-4" />
        </MonthStep>
        <div className="min-w-[140px] text-center font-semibold">{month ? label(month) : null}</div>
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
    </section>
  );
}

/** One end of the stepper: a link to that month's page, or a dead button at the window's edge. */
function MonthStep({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="icon" asChild>
      <Link href={href} aria-label={label}>
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
