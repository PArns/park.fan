'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Undo2, Wand2 } from 'lucide-react';
import { usePlanner } from '@/lib/planner/use-planner';
import {
  canOptimize,
  headlinersSkipped,
  headlinersToAdd,
  optimizeDay,
  scoreCurrent,
} from '@/lib/planner/optimize';
import { trackPlanOptimized } from '@/lib/analytics/umami';
import type { DayGrid } from '@/lib/planner/day-grid';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerDayPrefs, PlannerEntry, PlannerGeo } from '@/lib/planner/types';
import { cn } from '@/lib/utils';

interface PlannerOptimizeActionsProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  day: PlanDay | null;
  grid: DayGrid | null;
  timezone?: string;
  prefs?: PlannerDayPrefs;
}

/**
 * The two buttons that let the day sort itself.
 *
 * Both run the same engine (`lib/planner/optimize.ts`) and differ in one
 * argument: one hands it the park's headliners to add first, the other hands it
 * nothing and just re-orders what is there. Two buttons rather than one because
 * they answer different questions — "fill my day" and "is this the best order" —
 * and a single control would have to guess which was meant.
 *
 * **It says what it did, in minutes.** The day is scored before and after by the
 * same function, so "18 Min. weniger Warten" is a difference between two figures
 * produced the same way rather than a claim. Where there is nothing to gain it
 * says THAT instead of shuffling the plan to look busy: `optimizeDay` returns
 * `null` on a day it cannot improve, which is also what makes pressing the
 * button twice a no-op.
 *
 * Neither button appears where it could not mean anything. A park whose wait
 * times nobody can read (Hansa-Park) aggregates to the same assumed nothing for
 * every ride, so every order is as good as every other and `canOptimize` says
 * no; a day with one ride in it has exactly one order; and the headliner button
 * is gone once they are all in, like the band above it.
 */
export function PlannerOptimizeActions({
  parkSlug,
  parkName,
  geo,
  date,
  day,
  grid,
  timezone,
  prefs,
}: PlannerOptimizeActionsProps) {
  const t = useTranslations('planner');
  const { state, applyPlan, restoreDay } = usePlanner();
  const [result, setResult] = useState<string | null>(null);
  /**
   * The day as it was before the last press.
   *
   * One level, and it is not a nicety: "plan every headliner" can turn a
   * three-ride afternoon into eleven blocks, and taking that back by hand is
   * eleven drags. It is held in component state rather than stored, so it lives
   * exactly as long as the panel does — an undo somebody could still press
   * tomorrow would be a promise about a plan they have since edited.
   */
  const [undoTo, setUndoTo] = useState<readonly PlannerEntry[] | null>(null);

  const entries = state.parks[parkSlug]?.days[date]?.entries ?? [];

  if (!grid || !canOptimize(day, grid) || !day) return null;

  const missing = headlinersToAdd(day, entries, prefs);
  const skipped = headlinersSkipped(day, entries, prefs);
  const movable = entries.filter((entry) => !entry.done && !entry.custom && entry.attractionSlug);

  const canSort = movable.length >= 2;
  if (!canSort && missing.length === 0) return null;

  const run = (add: typeof missing) => {
    const input = { day, grid, entries, add };
    const before = scoreCurrent({ day, grid, entries });
    const plan = optimizeDay(input);

    if (!plan) {
      setResult(t('optimize.already'));
      setUndoTo(null);
      return;
    }

    setUndoTo(entries.map((entry) => ({ ...entry })));

    applyPlan({
      parkSlug,
      parkName,
      geo,
      timezone,
      date,
      stops: plan.stops.map((stop) => ({
        entryId: stop.entryId,
        attractionSlug: stop.attractionSlug,
        attractionName: stop.attractionName,
        startMinute: stop.startMinute,
      })),
    });
    trackPlanOptimized(parkName);

    const parts: string[] = [];
    if (add.length > 0) parts.push(t('optimize.added', { count: add.length }));
    // The saving is only a saving where the same rides were being compared: with
    // rides ADDED the day is longer by construction, and printing a bigger total
    // as a loss would be arithmetic answering a question nobody asked.
    if (add.length === 0 && before) {
      const saved = before.totalWaitMinutes - plan.totalWaitMinutes;
      parts.push(saved > 0 ? t('optimize.saved', { minutes: saved }) : t('optimize.already'));
    }
    if (skipped > 0 && add.length > 0) parts.push(t('optimize.skipped', { count: skipped }));
    if (plan.overflow > 0) parts.push(t('optimize.overflow', { count: plan.overflow }));
    setResult(parts.join(' · '));
  };

  return (
    <div
      data-planner-optimize=""
      className="border-border/60 flex shrink-0 flex-col gap-1 border-t px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {missing.length > 0 && (
          <button
            type="button"
            onClick={() => run(missing)}
            data-planner-optimize-headliners=""
            title={t('optimize.hint')}
            className={cn(
              'bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              'max-sm:min-h-9 max-sm:px-2.5'
            )}
          >
            <Crown className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('optimize.headliners')}</span>
          </button>
        )}
        {canSort && (
          <button
            type="button"
            onClick={() => run([])}
            data-planner-optimize-run=""
            title={t('optimize.hint')}
            className={cn(
              'text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
              'max-sm:min-h-9 max-sm:px-2.5'
            )}
          >
            <Wand2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('optimize.run')}</span>
          </button>
        )}
      </div>
      {/* Polite rather than assertive: it reports something the reader asked for
          and can see on the axis above, so it does not interrupt them. The undo
          sits IN the sentence that says what happened, because that sentence is
          the only place a reader is looking after the press. */}
      {result && (
        <p
          role="status"
          data-planner-optimize-result=""
          className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-[11px] leading-snug"
        >
          <span>{result}</span>
          {undoTo && (
            <button
              type="button"
              onClick={() => {
                restoreDay(parkSlug, date, undoTo);
                setUndoTo(null);
                setResult(null);
              }}
              data-planner-optimize-undo=""
              className="hover:text-foreground inline-flex items-center gap-1 underline underline-offset-2 transition-colors"
            >
              <Undo2 className="size-3 shrink-0" aria-hidden="true" />
              {t('optimize.undo')}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
