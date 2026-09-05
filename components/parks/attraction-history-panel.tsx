'use client';

import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AttractionHistoryDay, ScheduleItem } from '@/lib/api/types';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { TILE_GLASS } from '@/components/common/glass-card';
import { ParkCalendarLegend } from '@/components/parks/park-calendar-legend';
import { AttractionHistoryGrid } from '@/components/parks/attraction-history-grid';
import { AttractionHistoryGridPlaceholder } from '@/components/parks/attraction-history-grid-placeholder';
import {
  HISTORY_WINDOW_DAYS,
  historyGridReservation,
} from '@/lib/parks/attraction-history-geometry';
import { cn } from '@/lib/utils';

interface AttractionHistoryPanelProps {
  history?: AttractionHistoryDay[];
  schedule?: ScheduleItem[];
  /** The detail fetch has not landed yet — the placeholder holds the grid's box. */
  loading: boolean;
  /**
   * Today in the PARK's timezone (`yyyy-MM-dd`), resolved on the server.
   *
   * Only the reservation reads it. Passed in rather than taken from the browser for the same
   * reason `ParkCalendarPanel` takes `currentMonth`: a Florida park is still on yesterday's date
   * for six hours after midnight in Berlin, and the two sides of the hydration boundary would
   * disagree about how many week rows the window spans.
   */
  todayIso: string;
  className?: string;
}

/**
 * The ride page's history chapter — heading, legend and grid in one box.
 *
 * It is `ParkCalendarPanel`'s anatomy, deliberately: a frosted `ChapterHeading` whose lower edge
 * is the card's lid (`rounded-b-none` over `rounded-t-none border-t-0`), the shared
 * `ParkCalendarLegend` on its own line, then the grid. The two calendars on a park's pages used
 * to be a chapter band over a glass panel on one and a bare `Card` with a hand-built badge legend
 * inside it on the other — two boxes explaining the same colours in two visual languages, one
 * click apart.
 *
 * The heading renders whether or not the data is here, which is the rule the streamed park
 * chapters already follow: a placeholder that draws a grey box where a title will be is a
 * placeholder that has to guess the title's height, and it always guesses wrong once a locale
 * wraps it.
 */
export function AttractionHistoryPanel({
  history,
  schedule,
  loading,
  todayIso,
  className,
}: AttractionHistoryPanelProps) {
  const t = useTranslations('attractions');
  const reservation = historyGridReservation(todayIso);

  return (
    <section id="history" className={cn('mt-10 scroll-mt-24', className)}>
      <ChapterHeading
        icon={CalendarDays}
        title={t('historyCalendar')}
        hint={t('typicalWaits.basedOn', { days: HISTORY_WINDOW_DAYS })}
        frosted
        className="mb-0 rounded-b-none"
      />

      <div
        className={cn(
          TILE_GLASS,
          'border-border/50 flex flex-col gap-4 rounded-b-xl border border-t-0 p-4 md:p-6'
        )}
        style={
          {
            '--ride-cal-h': `${reservation.base}px`,
            '--ride-cal-h-lg': `${reservation.lg}px`,
          } as React.CSSProperties
        }
      >
        {/* The same key the park's crowd calendar carries, and the same component drawing it: the
          tiles below take their fill from `CROWD_TILE_CLASS` and their top bar from the same four
          signals, so a second legend written for this grid would be a second thing to keep in
          step. */}
        <ParkCalendarLegend />

        {loading ? (
          <AttractionHistoryGridPlaceholder />
        ) : (
          <AttractionHistoryGrid history={history} schedule={schedule} />
        )}
      </div>
    </section>
  );
}
