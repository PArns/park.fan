'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/**
 * The month grid with its chapter heading — the client half of the calendar page.
 *
 * `ParkCalendarGrid` is imported the same way the tab used to import it (`ssr: false`): it reads
 * `window.location.hash` on mount to restore `#calendar-2026-04` and formats every cell against
 * the browser clock, neither of which a server render can do. The loading box is the grid's own
 * height rather than `null`, because on this page there is a footer under it and a boundary that
 * reserves nothing pushes the page down when the chunk lands.
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
  className,
}: {
  park: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  className?: string;
}) {
  const t = useTranslations('parks.calendarPage');

  return (
    <section className={cn(className)}>
      <ChapterHeading icon={CalendarDays} title={t('gridTitle')} frosted />
      <ParkCalendarGrid
        park={park}
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
      />
    </section>
  );
}
