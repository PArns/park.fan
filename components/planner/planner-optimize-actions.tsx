'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Undo2, Wand2 } from 'lucide-react';
import { usePlanner } from '@/lib/planner/use-planner';
import {
  MAX_STOPS,
  canOptimize,
  headlinersSkipped,
  headlinersToAdd,
  movableEntries,
  optimizeDay,
  scoreCurrent,
} from '@/lib/planner/optimize';
import { trackPlanOptimized } from '@/lib/analytics/umami';
import { dayClock, parkToday, resolveTimeZone } from '@/lib/planner/park-time';
import {
  getMinuteTick,
  getZero,
  subscribeToMinute,
  subscribeToNothing,
} from '@/lib/planner/minute-tick';
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
 * **And a difference is only printable where the two figures cover the same
 * rides.** `optimize.already` is the answer to "there was nothing to do", so it
 * is printed on exactly that answer and nowhere else; it used to double as the
 * `saved <= 0` branch, which put "Passt schon so" under a plan that had just
 * been rebuilt — a day with a block dragged past closing scores 60 minutes
 * before and 70 after, because the block outside the park's hours carries no
 * figure at all until the optimiser brings it back inside. That is a day gained
 * a ride, and it now says so. The same rule bars the saving where
 * {@link MAX_STOPS} cut the search short, since the before-figure counts every
 * entry and the after-figure only the ones that made it in.
 *
 * Neither button appears where it could not mean anything. A park whose wait
 * times nobody can read (Hansa-Park) aggregates to the same assumed nothing for
 * every ride, so every order is as good as every other and `canOptimize` says
 * no; a day with one ride in it and nothing to add has exactly one order; and
 * the headliner button is gone once they are all in, like the band above it. It
 * is NOT gone where exactly one headliner is missing, which the engine used to
 * refuse to plan — the button was there, and pressing it did nothing.
 *
 * **And it stays where a headliner simply does not fit**, which is not the same
 * fault. Phantasialand has ten of them and a nine-hour day, so the last one has
 * nowhere to go; the optimiser leaves it out rather than drawing it in the
 * closed hours, and `optimize.overflow` says so under the button every time it
 * is pressed. That is a standing offer rather than a dead control — delete a
 * ride and it goes in — and the sentence is what keeps it from reading as one.
 *
 * **Two more cases where nothing is drawn, and both are about the clock.** A day
 * that has been walked is a record: sorting yesterday would rewrite what
 * happened, so on a past date this renders nothing at all — the hand controls
 * beside it stay, because writing the record down is why the day is kept. And a
 * day whose remaining rides are one or none has no order left to choose, which
 * is why `movable` is counted with the engine's own filter rather than a copy of
 * it: at 18:40 in a park shutting at 19:00 the button is gone rather than
 * answering "Passt schon so".
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
  /**
   * The day as it was before the last press, and the sentence about it.
   *
   * One level of undo, and it is not a nicety: "plan every headliner" can turn
   * a three-ride afternoon into eleven blocks, and taking that back by hand is
   * eleven drags. It is held in component state rather than stored, so it lives
   * exactly as long as the panel does — an undo somebody could still press
   * tomorrow would be a promise about a plan they have since edited.
   *
   * Both carry the (park, date) they were taken FOR, and that is the fix for a
   * silent data loss. This component has no `key` and no reset effect, so
   * switching the panel to another day or another park leaves it mounted with
   * the banner and its "Rückgängig" still standing — while `parkSlug` and
   * `date` are props and have already moved. `restoreDay` REPLACES a day, so
   * pressing undo then wrote the 5th's rides over the 6th's, and across a park
   * switch it wrote a set of foreign slugs with no curve into a day that had
   * never been optimised. Snapshot and sentence are only offered, and only
   * acted on, where both halves of the key still match what is on screen.
   */
  const [result, setResult] = useState<{
    parkSlug: string;
    date: string;
    text: string;
  } | null>(null);
  const [undoTo, setUndoTo] = useState<{
    parkSlug: string;
    date: string;
    entries: readonly PlannerEntry[];
  } | null>(null);

  const entries = state.parks[parkSlug]?.days[date]?.entries ?? [];

  /**
   * Where this day stands against the park's clock, re-read every minute.
   *
   * Subscribed rather than read once, and that is not tidiness: the buttons
   * below have to DISAPPEAR as the day runs out — at 18:40 in a park shutting
   * at 19:00 there is nothing left to sort — and a value taken at mount would
   * keep them on screen for as long as the panel is open. It is the same shape
   * `PlannerDayGrid` uses for its now line, including why: `getZero` as the
   * server snapshot keeps a clock out of server markup, and `subscribeToNothing`
   * means no 60-second timer on a date that is not today.
   */
  const zone = resolveTimeZone(timezone);
  const isToday = date === parkToday(zone);
  // Subscribed for the re-render alone — the value is a counter nobody reads
  // here. `subscribeToNothing` on any other date, so a plan for next Saturday
  // installs no 60-second interval.
  useSyncExternalStore(
    isToday ? subscribeToMinute : subscribeToNothing,
    isToday ? getMinuteTick : getZero,
    getZero
  );
  const clock = dayClock(date, zone);

  if (!grid || !canOptimize(day, grid) || !day) return null;
  // A day that has been walked is a record. Both buttons plan FOR the visitor,
  // and there is nothing left to plan — the engine refuses it too, so this is
  // about not drawing a control that could only answer "Passt schon so".
  if (clock.phase === 'past') return null;

  const missing = headlinersToAdd(day, entries, prefs);
  const skipped = headlinersSkipped(day, entries, prefs);
  // The same set the engine will work on. Counted with the bare filter, this
  // offers "Tag optimieren" for a day whose two rides are both behind us.
  const movable = movableEntries(entries, clock);

  const canSort = movable.length >= 2;
  if (!canSort && missing.length === 0) return null;

  const shownResult = result?.parkSlug === parkSlug && result?.date === date ? result : null;
  const shownUndo = undoTo?.parkSlug === parkSlug && undoTo?.date === date ? undoTo : null;

  const run = (add: typeof missing) => {
    // The clock goes to BOTH, and for two different reasons. `optimizeDay` uses
    // it as a floor and as a membership rule; `scoreCurrent` only as the second
    // — it scores the day where the blocks actually are, so a floor there would
    // be a claim about where they should be. Withholding it from the incumbent
    // is what made the before-figure cover a morning the plan never saw, so
    // "45 Min. weniger Warten" was a ride that had already been queued for.
    const input = { day, grid, entries, add, clock };
    const before = scoreCurrent({ day, grid, entries, clock });
    const plan = optimizeDay(input);

    if (!plan) {
      // The snapshot is deliberately left alone. Planning the headliners and
      // then pressing "Tag optimieren" to check is one gesture a visitor
      // actually makes, and clearing the undo here took away the only way back
      // from the press before it — on the press that changed nothing.
      setResult({ parkSlug, date, text: t('optimize.already') });
      return;
    }

    setUndoTo({ parkSlug, date, entries: entries.map((entry) => ({ ...entry })) });

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

    // What the plan actually holds, never what was asked for: `MAX_STOPS` can
    // cut the list short, and counting the request meant announcing eight added
    // headliners over a plan that had room for four.
    const added = plan.stops.filter((stop) => stop.entryId === null).length;
    const replanned = plan.stops.length - added;

    const parts: string[] = [];
    if (added > 0) parts.push(t('optimize.added', { count: added }));
    // The saving is only a saving where the same rides were being compared: with
    // rides ADDED the day is longer by construction, and printing a bigger total
    // as a loss would be arithmetic answering a question nobody asked. Same for
    // a day the cap trimmed, where the before-figure covers entries the plan
    // never saw.
    if (add.length === 0 && before && replanned === movable.length) {
      const fitted = before.overflow - plan.overflow;
      const saved = before.totalWaitMinutes - plan.totalWaitMinutes;
      if (fitted > 0) parts.push(t('optimize.fitted', { count: fitted }));
      if (saved > 0) parts.push(t('optimize.saved', { minutes: saved }));
      // A rebuilt day that queues the same amount says so. Where it queues MORE
      // and gained nothing that fits, the only honest line is that it moved:
      // `optimizeDay` only returns such a plan for a day that could not be
      // walked in the first place, so there is no before-figure worth quoting.
      else if (fitted <= 0)
        parts.push(saved === 0 ? t('optimize.sameWait') : t('optimize.resorted'));
    }
    if (skipped > 0 && add.length > 0) parts.push(t('optimize.skipped', { count: skipped }));
    if (plan.overflow > 0) parts.push(t('optimize.overflow', { count: plan.overflow }));
    if (plan.capped > 0) {
      parts.push(t('optimize.capped', { count: plan.capped, max: MAX_STOPS }));
    }
    setResult({ parkSlug, date, text: parts.join(' · ') });
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
      {shownResult && (
        <p
          role="status"
          data-planner-optimize-result=""
          className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-[11px] leading-snug"
        >
          <span>{shownResult.text}</span>
          {shownUndo && (
            <button
              type="button"
              onClick={() => {
                // The snapshot's own key, not the props: they are equal here by
                // the guard above, and writing it this way means the day being
                // restored is the day the entries were copied from.
                restoreDay(shownUndo.parkSlug, shownUndo.date, shownUndo.entries);
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
