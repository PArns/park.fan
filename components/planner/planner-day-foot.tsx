'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { PlannerOptimizeActions } from './planner-optimize-actions';
import { PlannerMissingHeadliners } from './planner-missing-headliners';
import { totalsFor } from '@/lib/planner/estimate';
import { formatShortDuration } from '@/lib/utils/duration';
import type { DayGrid } from '@/lib/planner/day-grid';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerDayPrefs, PlannerEntry, PlannerGeo } from '@/lib/planner/types';

interface PlannerDayFootProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  day: PlanDay | null;
  grid: DayGrid | null;
  timezone: string;
  prefs?: PlannerDayPrefs;
  entries: readonly PlannerEntry[];
  onAddFreeBlock: () => void;
}

/**
 * Everything a day is filled and summed with: optimise, the missing headliners,
 * a free block, and what it all comes to.
 *
 * **Its own component because it is rendered in two places and must be one
 * implementation.** Every control in here names a park AND a date, and once the
 * panel can hold two columns there are two of each — so on a desktop it belongs
 * to the column, one set per column. That was the report: "die eigener Block
 * Buttons sowie optimieren gehen nur auf die linke Spalte", and it was worse
 * than it read, because nothing said which day the row meant — the headliner
 * band listed Phantasialand's missing rides under a panel whose right half was
 * Europa-Park, and "Tag optimieren" pressed over that column rebuilt the other.
 *
 * **On a phone it stays in the panel, and that is arithmetic rather than
 * taste.** The sheet is 716 px at 390×844. The drag handle, the header, the
 * ride search and the push toggle take 255 of them, so the column's box is
 * 461 px — and the column's own chrome (head, context band, showtime strip) is
 * 125 before the axis has drawn a line. This foot measures 217. Inside the
 * column that leaves the axis **119 px**, which is a search box with an hour
 * and a half of day in it, not a planner; the panel's own flex row, on the
 * other hand, can hand the foot its 217 px and shrink the ride search instead,
 * which is what it did before this moved. A phone never has a second column, so
 * there is no day for the panel's copy to be wrong about.
 *
 * The two call sites gate each other with CSS rather than `useMediaQuery`: the
 * hook answers `false` on its server snapshot, so a JS branch would ship the
 * phone's markup in every desktop's first HTML and then delete it. The column
 * wraps its copy in `hidden sm:contents`, which keeps the foot's rows as flex
 * children of the column at `sm` and up and removes them below it.
 */
export function PlannerDayFoot({
  parkSlug,
  parkName,
  geo,
  date,
  day,
  grid,
  timezone,
  prefs,
  entries,
  onAddFreeBlock,
}: PlannerDayFootProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const totals = totalsFor(day, entries);

  return (
    <>
      {/* Letting the day sort itself, above the band that names what is missing
          from it — the headliner button is the same question one gesture
          further on ("and put them in"), so the two belong together and in that
          order. */}
      <PlannerOptimizeActions
        parkSlug={parkSlug}
        parkName={parkName}
        geo={geo}
        date={date}
        day={day}
        grid={grid}
        timezone={timezone}
        prefs={prefs}
      />

      {/* Which of the park's big rides are still missing. Outside the phone's
          ride search, because it is the one thing down here that both pointers
          need: the phone adds by tapping a pill, the desktop drags one onto an
          hour. */}
      <PlannerMissingHeadliners
        parkSlug={parkSlug}
        parkName={parkName}
        geo={geo}
        date={date}
        day={day}
        timezone={timezone}
        prefs={prefs}
      />

      {/* A free block — a lunch break, a show, a meeting point — on its own row,
          DESKTOP only. It used to sit inside the ride search, which is the
          phone's surface alone, and it is the one thing in there that is not a
          ride: the catalogue has no answer for "and then we eat". The phone
          keeps its copy inside the search, where the same question is asked. */}
      <button
        type="button"
        onClick={onAddFreeBlock}
        data-planner-add-custom=""
        className="text-muted-foreground hover:text-foreground hover:bg-accent/50 border-border/60 hidden shrink-0 items-center gap-2 border-t px-3 py-2 text-left text-xs transition-colors sm:flex"
      >
        <CalendarPlus className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{t('custom.add')}</span>
      </button>

      {entries.length > 0 && (
        <div
          data-planner-summary=""
          className="border-border/60 text-muted-foreground flex shrink-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t px-3 py-2.5 text-xs"
        >
          <span>
            {t('summary.rides', { count: entries.length - totals.custom })}
            {totals.custom > 0 && ` · ${t('summary.blocks', { count: totals.custom })}`}
          </span>
          <span className="flex items-baseline gap-3">
            {totals.done > 0 && (
              <span>{t('summary.done', { done: totals.done, total: entries.length })}</span>
            )}
            {/* Expected and actual are never added together: one is a prediction
                and the other a measurement, and a single figure mixing them
                moves for two reasons at once. */}
            {totals.counted > 0 && (
              <span className="flex items-baseline gap-1" title={t('summary.waiting')}>
                {/* Named, not just hinted: a phone has no hover, so with the
                    `title` alone the row ended in a duration with nothing saying
                    which duration. */}
                <span>{t('summary.waitingLabel')}</span>
                {/* The site's own duration format, not a second one invented
                    here: `formatShortDuration` is what the weather warnings
                    print and it knows all six locales' unit labels. */}
                <span className="text-foreground font-mono tabular-nums">
                  {formatShortDuration(totals.expectedMinutes, locale)}
                </span>
              </span>
            )}
          </span>
        </div>
      )}
    </>
  );
}
