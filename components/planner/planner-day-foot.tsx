'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { PlannerOptimizeActions } from './planner-optimize-actions';
import { PlannerMissingHeadliners } from './planner-missing-headliners';
import { totalsFor } from '@/lib/planner/estimate';
import { cn } from '@/lib/utils';
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
  /**
   * Drawn at the end of the optimise row: the phone's show switch. Not in the summary row below,
   * because two stacked rows of 44 px targets cost the foot far more than a line of text.
   */
  actionsTrailing?: ReactNode;
  /**
   * The desktop's ride search, in the free-block row beside its button. The phone's foot gets none:
   * its search is the panel's own (`PlannerRideSearch` in `planner-flyout.tsx`).
   */
  search?: ReactNode;
  /** The show picker, drawn beside the free block's button. Absent where the day has no showtimes. */
  showPicker?: ReactNode;
}

/**
 * Everything a day is filled and summed with: the missing headliners, a free block, optimise, and
 * what it all comes to, optimise last but one so it stands against the total it lowers.
 *
 * One component rendered in two places. Every control names a park and a date, so on a desktop it
 * belongs to each column; on a phone the panel draws it once, because inside a column it would
 * leave the axis almost no room, and a phone never has a second column. The column decides with
 * `withFoot`.
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
  actionsTrailing,
  search,
  showPicker,
}: PlannerDayFootProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const totals = totalsFor(day, entries);

  return (
    <>
      {/* Which big rides are still missing, outside the phone's ride search: both pointers need it
          (a tap on a pill, a drag onto an hour). */}
      <PlannerMissingHeadliners
        parkSlug={parkSlug}
        parkName={parkName}
        geo={geo}
        date={date}
        day={day}
        timezone={timezone}
        prefs={prefs}
      />

      {/* A free block, on its own row on the desktop only, with the desktop's ride search beside
          it. The phone keeps its copy inside its search; `planner-wide:flex` matches the search's
          `planner-wide:hidden`, so the two are never drawn together. */}
      <div className="border-border/60 planner-wide:flex hidden shrink-0 items-start gap-2 border-t px-2 py-1.5">
        {search && <div className="min-w-0 flex-1">{search}</div>}
        <button
          type="button"
          onClick={onAddFreeBlock}
          data-planner-add-custom=""
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-accent/50 flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-left text-xs transition-colors',
            !search && 'flex-1'
          )}
        >
          <CalendarPlus className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t('custom.add')}</span>
        </button>
        {showPicker}
      </div>

      {/* Letting the day sort itself, directly above what the day adds up to, so the button and
          the figure it would lower are read together. */}
      <PlannerOptimizeActions
        parkSlug={parkSlug}
        parkName={parkName}
        geo={geo}
        date={date}
        day={day}
        grid={grid}
        timezone={timezone}
        prefs={prefs}
        trailing={actionsTrailing}
      />

      {entries.length > 0 && (
        <div
          data-planner-summary=""
          className={cn(
            'border-border/60 text-muted-foreground flex shrink-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t px-3 py-2.5 text-xs',
            // A line of text and nothing to press, so on a phone only as tall as the text.
            'planner-phone:py-1.5'
          )}
        >
          <span>
            {t('summary.rides', { count: entries.length - totals.custom })}
            {totals.custom > 0 && ` · ${t('summary.blocks', { count: totals.custom })}`}
          </span>
          <span className="flex items-baseline gap-3">
            {totals.done > 0 && (
              <span>{t('summary.done', { done: totals.done, total: entries.length })}</span>
            )}
            {/* Expected and actual are never added together: a prediction and a measurement in one
                figure would move for two reasons at once. */}
            {totals.counted > 0 && (
              <span className="flex items-baseline gap-1" title={t('summary.waiting')}>
                {/* Named, not just in the `title`: a phone has no hover. */}
                <span>{t('summary.waitingLabel')}</span>
                {/* The site's own duration format (`formatShortDuration`), with all six locales'
                    units. */}
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
