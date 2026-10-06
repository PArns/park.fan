'use client';

import { useDeferredValue, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Crown, SlidersHorizontal, Undo2, Wand2 } from 'lucide-react';
import { usePlanner } from '@/lib/planner/use-planner';
import {
  MAX_STOPS,
  canOptimize,
  clashCount,
  headlinersSkipped,
  headlinersToAdd,
  movableEntries,
  optimizeDay,
  scoreCurrent,
} from '@/lib/planner/optimize';
import {
  evaluateFit,
  fitBlocks,
  fitChoiceAll,
  fitWishes,
  needsFitHelp,
  type FitChoice,
  type FitInput,
} from '@/lib/planner/fit';
import { PlannerFitAssistant } from './planner-fit-assistant';
import { trackPlanOptimized } from '@/lib/analytics/umami';
import { dayClock, longDate, parkToday, resolveTimeZone } from '@/lib/planner/park-time';
import {
  getMinuteTick,
  getZero,
  subscribeToMinute,
  subscribeToNothing,
} from '@/lib/planner/minute-tick';
import type { DayGrid } from '@/lib/planner/day-grid';
import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import type { PlannerDayPrefs, PlannerEntry, PlannerGeo } from '@/lib/planner/types';
import { roundWaitDeltaTo5 } from '@/lib/utils/wait-time';
import { PHONE_TARGET_32_UP } from '@/lib/planner/touch-target';
import { cn } from '@/lib/utils';

/** The entries of a day that has none, as one array rather than a new one per render. */
const NO_ENTRIES: readonly PlannerEntry[] = [];

/**
 * An entry as the "Tag optimieren" pre-search sees it: which ride or how long a block, where it
 * sits, and whether it has been walked. Everything the search and its scoring read, and nothing it
 * does not — a free block's label and icon are left out, so typing one is not a new search.
 */
function searchKeyOf(entry: PlannerEntry): string {
  return [
    entry.id,
    entry.attractionSlug ?? '',
    entry.attractionName ?? '',
    entry.startMinute,
    entry.done ? 1 : 0,
    entry.actualWait ?? '',
    entry.custom?.durationMinutes ?? '',
  ].join(':');
}

interface PlannerOptimizeActionsProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  day: PlanDay | null;
  grid: DayGrid | null;
  timezone?: string;
  prefs?: PlannerDayPrefs;
  /**
   * Drawn at the end of the button row: the phone's show switch. Where there are no buttons the
   * row is drawn for it alone. Pass it only where it renders something, or the row is drawn empty.
   */
  trailing?: ReactNode;
}

/**
 * The two buttons that let the day sort itself: one adds the park's headliners first, the other
 * only re-orders. One engine (`lib/planner/optimize.ts`), two buttons, because "fill my day" and
 * "is this the best order" are different questions.
 *
 * The result line prints a saving only where before and after cover the same rides, and
 * `optimize.already` only where `optimizeDay` found nothing to do. A day that cannot hold what was
 * asked for opens `PlannerFitAssistant` instead of applying a plan. Nothing is drawn where the
 * order cannot mean anything: no readable wait times, one movable ride or none, or a past day. See
 * docs/features/trip-planner.md#what-it-says-afterwards-and-how-to-take-it-back and
 * docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
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
  trailing,
}: PlannerOptimizeActionsProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const { state, applyPlan, restoreDay } = usePlanner();
  /**
   * The day as it was before the last press, and the sentence about it: one level of undo, in
   * component state, so it lasts exactly as long as the panel.
   *
   * Both carry the (park, date) they were taken for, and are only shown and acted on where that
   * still matches the screen: the panel can switch day under them, and `restoreDay`
   * replaces a day, so an unkeyed undo would write one day's rides over another's.
   */
  const [result, setResult] = useState<{
    parkSlug: string;
    date: string;
    text: string;
    /**
     * Something the visitor asked for is not in the day, which is drawn as a warning rather than
     * the muted line a day that lost nothing keeps.
     */
    alert: boolean;
    /**
     * The question and answer behind an assistant's result, so „Anpassen" can ask the same
     * question again even after the answer made the day fit.
     */
    fit?: { input: FitInput; choice: FitChoice };
  } | null>(null);
  const [undoTo, setUndoTo] = useState<{
    parkSlug: string;
    date: string;
    entries: readonly PlannerEntry[];
  } | null>(null);
  /**
   * The conflict, while somebody is deciding what to do about it. Keyed on (park, date) like the
   * two above, so a decision cannot be filed into another day. The whole `FitInput` is held so the
   * dialog's memos stay stable.
   */
  const [fit, setFit] = useState<{
    parkSlug: string;
    date: string;
    /** Increments per press, so the dialog remounts with a fresh answer. */
    nonce: number;
    input: FitInput;
    /** The answer to open on, where this is „Anpassen" on an earlier one. */
    choice?: FitChoice;
  } | null>(null);

  // Memoised so `gain` keys on the day's entries, not on a fresh empty array per render.
  const entries = useMemo(
    () => state.parks[parkSlug]?.days[date]?.entries ?? NO_ENTRIES,
    [state, parkSlug, date]
  );

  /**
   * Where this day stands against the park's clock, re-read every minute, because the buttons have
   * to disappear as the day runs out. The same shape as `PlannerDayGrid`'s now line.
   */
  const zone = resolveTimeZone(timezone);
  const isToday = date === parkToday(zone);
  // The counter also keys the `gain` search below. `subscribeToNothing` on any other date, so a
  // future plan installs no interval.
  const nowTick = useSyncExternalStore(
    isToday ? subscribeToMinute : subscribeToNothing,
    isToday ? getMinuteTick : getZero,
    getZero
  );
  const clock = dayClock(date, zone);

  /**
   * What pressing „Tag optimieren" would gain, worked out before anybody presses it: the same
   * engine, input and before-figure as `run`, so the call to action promises exactly what the press
   * then reports. Only where both figures cover the same rides.
   *
   * It reads a deferred copy of the entries, held until something the search reads has changed
   * (`searchKey`), so typing a block label does not search per keystroke. See
   * docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md.
   */
  const searchKey = entries.map(searchKeyOf).join('|');
  const [searched, setSearched] = useState({ key: searchKey, entries });
  if (searched.key !== searchKey) setSearched({ key: searchKey, entries });
  const deferredEntries = useDeferredValue(searched.entries);
  const deferredGrid = useDeferredValue(grid);
  const gain = useMemo(() => {
    const grid = deferredGrid;
    if (nowTick < 0 || !grid || !day || !canOptimize(day, grid)) return null;
    const now = dayClock(date, resolveTimeZone(timezone));
    if (now.phase === 'past') return null;
    const movableNow = movableEntries(deferredEntries, now);
    if (movableNow.length < 2) return null;
    const input = { day, grid, entries: deferredEntries, clock: now };
    const before = scoreCurrent(input);
    const plan = optimizeDay(input);
    if (!before || !plan || plan.stops.length !== movableNow.length) return null;
    const fitted = before.overflow - plan.overflow;
    const saved = roundWaitDeltaTo5(before.totalWaitMinutes - plan.totalWaitMinutes);
    // Clashes the plan takes out: a pause dragged onto a ride leaves the waits
    // where they were and the day impossible, which neither figure above sees.
    const resolved =
      clashCount(day, deferredEntries, now) -
      clashCount(day, withPlan(deferredEntries, plan.stops), now);
    if (fitted <= 0 && saved < 5 && resolved <= 0) return null;
    return {
      fitted: Math.max(0, fitted),
      saved: Math.max(0, saved),
      resolved: Math.max(0, resolved),
    };
  }, [deferredGrid, day, deferredEntries, date, timezone, nowTick]);

  /** The row with its trailing control alone, where there is nothing to optimise. */
  const bare = trailing ? <OptimizeRow marked={false} trailing={trailing} /> : null;
  if (!grid || !canOptimize(day, grid) || !day) return bare;
  // A walked day is a record: there is nothing left to plan, and the engine refuses it too.
  if (clock.phase === 'past') return bare;

  const missing = headlinersToAdd(day, entries, prefs);
  const skipped = headlinersSkipped(day, entries, prefs);
  // The engine's own set; the bare filter would offer "Tag optimieren" for rides already behind us.
  const movable = movableEntries(entries, clock);

  const canSort = movable.length >= 2;
  if (!canSort && missing.length === 0) return bare;

  const shownResult = result?.parkSlug === parkSlug && result?.date === date ? result : null;
  const shownUndo = undoTo?.parkSlug === parkSlug && undoTo?.date === date ? undoTo : null;
  const shownFit = fit?.parkSlug === parkSlug && fit?.date === date ? fit : null;

  /** Puts the day back as it was before the last press; the phone's icon and the link share it. */
  const undo = () => {
    if (!shownUndo) return;
    // The snapshot's own key rather than the props, so the day restored is the day it was copied
    // from.
    restoreDay(shownUndo.parkSlug, shownUndo.date, shownUndo.entries);
    setUndoTo(null);
    setResult(null);
  };

  /** Everything the assistant reasons over, for one press. */
  const fitInputFor = (add: readonly PlanDayRide[]): FitInput => ({
    day,
    grid,
    entries,
    wishes: fitWishes(day, entries, add, clock),
    blocks: fitBlocks(entries),
    clock,
  });

  /**
   * Press, probe, and only then decide whether this is a question. The probe is thrown away; where
   * the day holds everything nothing is asked, because a dialog in front of a button that would
   * have done the right thing is a dialog people learn to dismiss.
   */
  const attempt = (add: readonly PlanDayRide[]) => {
    const input = fitInputFor(add);
    if (input.wishes.length > 0 && needsFitHelp(input, fitChoiceAll())) {
      setFit({ parkSlug, date, nonce: (fit?.nonce ?? 0) + 1, input });
      return;
    }
    run(add);
  };

  const run = (add: readonly PlanDayRide[], priority?: readonly string[]) => {
    // The clock goes to both: `optimizeDay` uses it as a floor and as a membership rule,
    // `scoreCurrent` only as the second, since it scores the blocks where they are.
    const input = { day, grid, entries, add, priority, clock };
    const before = scoreCurrent({ day, grid, entries, clock });
    const plan = optimizeDay(input);

    if (!plan) {
      // The undo is left alone: checking with „Tag optimieren" after planning the headliners must
      // not take away the way back from the press before.
      setResult({ parkSlug, date, text: t('optimize.already'), alert: false });
      return;
    }

    setUndoTo({ parkSlug, date, entries: entries.map((entry) => ({ ...entry })) });

    applyPlan({
      parkSlug,
      parkName,
      geo,
      timezone,
      date,
      stops: plan.stops,
    });
    trackPlanOptimized(parkName);

    // What the plan actually holds, never what was asked for: `MAX_STOPS` can cut the list short.
    const added = plan.stops.filter((stop) => stop.entryId === null).length;
    const replanned = plan.stops.length - added;

    const parts: string[] = [];
    if (added > 0) parts.push(t('optimize.added', { count: added }));
    // A saving only where the same rides are compared: not with rides added, and not where the cap
    // trimmed the plan.
    if (add.length === 0 && before && replanned === movable.length) {
      const fitted = before.overflow - plan.overflow;
      const saved = before.totalWaitMinutes - plan.totalWaitMinutes;
      // On the five-minute grid, like every wait on screen and like the promise in `gain`.
      const shownSaved = roundWaitDeltaTo5(saved);
      // Counted as `gain` counted them, so the promise and the report agree.
      const resolved =
        clashCount(day, entries, clock) - clashCount(day, withPlan(entries, plan.stops), clock);
      if (resolved > 0) parts.push(t('optimize.resolved', { count: resolved }));
      if (fitted > 0) parts.push(t('optimize.fitted', { count: fitted }));
      if (shownSaved > 0) parts.push(t('optimize.saved', { minutes: shownSaved }));
      // A rebuilt day that queues more and gained nothing only says it moved: `optimizeDay` returns
      // such a plan only for a day that could not be walked.
      else if (fitted <= 0 && resolved <= 0) {
        parts.push(saved < 0 ? t('optimize.resorted') : t('optimize.sameWait'));
      }
    }
    if (skipped > 0 && add.length > 0) parts.push(t('optimize.skipped', { count: skipped }));
    if (plan.overflow > 0) parts.push(t('optimize.overflow', { count: plan.overflow }));
    if (plan.capped > 0) {
      parts.push(t('optimize.capped', { count: plan.capped, max: MAX_STOPS }));
    }
    setResult({ parkSlug, date, text: parts.join(' · '), alert: plan.overflow > 0 });
  };

  /**
   * The assistant's answer, in two writes: `restoreDay` with the entries the choice keeps, which is
   * the one place a plan loses an entry not removed ride by ride, then `applyPlan` for the
   * schedule. The undo snapshot is taken before both.
   */
  const applyChoice = (input: FitInput, choice: FitChoice, revising = false) => {
    const outcome = evaluateFit(input, choice);
    // A revision starts from the day the question was first asked about, so undo still goes back
    // to that day.
    if (!(revising && shownUndo)) {
      setUndoTo({ parkSlug, date, entries: entries.map((entry) => ({ ...entry })) });
    }
    restoreDay(parkSlug, date, outcome.entries);
    applyPlan({
      parkSlug,
      parkName,
      geo,
      timezone,
      date,
      stops: outcome.stops,
    });
    trackPlanOptimized(parkName);

    const left = outcome.missed.length + choice.dropped.size;
    const parts = [t('fit.applied', { count: outcome.fitted.length })];
    if (left > 0) parts.push(t('fit.leftOut', { count: left }));
    setResult({
      parkSlug,
      date,
      text: parts.join(' · '),
      alert: left > 0,
      fit: left > 0 ? { input, choice } : undefined,
    });
  };

  return (
    <OptimizeRow
      marked
      trailing={trailing}
      buttons={
        <>
          {missing.length > 0 && (
            <button
              type="button"
              onClick={() => attempt(missing)}
              data-planner-optimize-headliners=""
              title={t('optimize.hint')}
              className={cn(
                'bg-primary/10 text-primary hover:bg-primary/20 flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
                // 36 px on the desktop like the two-line call to action beside it. On a phone 32 px
                // drawn, 44 px to a finger with the overhang above (`PHONE_TARGET_32_UP`). `w-min`
                // so the label always takes two lines and the call to action grows into the rest;
                // never below the longest word.
                'planner-phone:px-2.5 planner-phone:w-min',
                PHONE_TARGET_32_UP
              )}
            >
              <Crown className="size-3.5 shrink-0" aria-hidden="true" />
              {/* A shorter label on a phone, where the row is shared; the crown alone was not read
                  as "add the headliners". The hidden span is `display: none`, so the name is the
                  visible label. */}
              <span className="planner-phone:hidden truncate">{t('optimize.headliners')}</span>
              <span className="planner-wide:hidden line-clamp-2 text-left leading-tight">
                {t('optimize.headlinersShort')}
              </span>
            </button>
          )}
          {/* A filled call to action where the day would gain (see `gain`), the headliner
              button's tint where it would not. */}
          {canSort && (
            <button
              type="button"
              onClick={() => attempt([])}
              data-planner-optimize-run=""
              data-planner-optimize-gain={gain ? '' : undefined}
              title={t('optimize.hint')}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-md px-2 text-xs transition-colors',
                // 32 px drawn, 44 px to a finger, overhang above. See `PHONE_TARGET_32_UP`.
                'planner-phone:px-2.5',
                PHONE_TARGET_32_UP,
                gain
                  ? // Grows into the rest of the row, and WRAPS onto a row of its
                    // own rather than shrinking into "Tag op…" beside a long
                    // headliner label: `flex-[1_0_auto]` never shrinks below its
                    // content, `max-w-full` keeps it inside the row.
                    'bg-primary text-primary-foreground hover:bg-primary/90 max-w-full flex-[1_0_auto] justify-center shadow-sm'
                  : // The headliner button's tint where there is nothing to
                    // gain, so the row reads as one set of buttons. It takes the rest of the row.
                    'bg-primary/10 text-primary hover:bg-primary/20 flex-[1_0_auto] justify-center font-medium'
              )}
            >
              <Wand2 className="size-3.5 shrink-0" aria-hidden="true" />
              {gain ? (
                /* Two lines, the verb over what it is worth, so the pair fits beside the
                 headliner button at 360 px in German. */
                <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                  <span className="max-w-full truncate font-semibold">{t('optimize.run')}</span>
                  <span className="max-w-full truncate text-[11px] opacity-85">
                    {gain.resolved > 0
                      ? t('optimize.resolved', { count: gain.resolved })
                      : gain.fitted > 0
                        ? t('optimize.fitted', { count: gain.fitted })
                        : t('optimize.saved', { minutes: gain.saved })}
                  </span>
                </span>
              ) : (
                <span className="truncate">{t('optimize.run')}</span>
              )}
            </button>
          )}
          {/* The undo, in this row and only while there is something to undo. 36 × 32 drawn and
              36 × 44 to a finger, overhang above only, so it stays clear of the show switch. */}
          {shownUndo && (
            <button
              type="button"
              onClick={undo}
              data-planner-optimize-undo=""
              aria-label={t('optimize.undo')}
              title={t('optimize.undo')}
              className={cn(
                // The row's tint: ghosted, it read as a gap between its neighbours.
                'bg-primary/10 text-primary hover:bg-primary/20 flex size-9 shrink-0 items-center justify-center rounded-md transition starting:opacity-0',
                PHONE_TARGET_32_UP
              )}
            >
              <Undo2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </>
      }
    >
      {/* Polite: it reports something the reader asked for and can see above. A day that came
          out short gets the crowd tint, a warning mark and „Anpassen" back into the assistant,
          because a notice about a problem needs a control to answer it. */}
      {shownResult && (
        <div
          role="status"
          data-planner-optimize-result=""
          data-planner-optimize-alert={shownResult.alert ? '' : undefined}
          className={cn(
            'flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] leading-snug',
            shownResult.alert
              ? 'border-crowd-high/40 bg-crowd-high/10 text-crowd-high rounded-md border px-2 py-1.5'
              : // Read out but not drawn: the day it describes is right above, and the undo icon
                // is the press's trace. An alert stays drawn, since it carries „Anpassen".
                'sr-only'
          )}
        >
          {shownResult.alert && (
            <AlertTriangle className="size-3.5 shrink-0 self-center" aria-hidden="true" />
          )}
          <span className={cn('min-w-0 flex-1', shownResult.alert && 'font-medium')}>
            {shownResult.text}
          </span>
          {shownResult.alert && (
            <button
              type="button"
              onClick={() => {
                const asked = shownResult.fit;
                // The assistant's own answer is reopened on that answer; otherwise the press asks
                // afresh.
                if (asked) {
                  setFit({
                    parkSlug,
                    date,
                    nonce: (fit?.nonce ?? 0) + 1,
                    input: asked.input,
                    choice: asked.choice,
                  });
                } else {
                  attempt([]);
                }
              }}
              data-planner-optimize-adjust=""
              className="hover:bg-crowd-high/15 inline-flex items-center gap-1 rounded px-1 py-0.5 underline underline-offset-2 transition-colors"
            >
              <SlidersHorizontal className="size-3 shrink-0" aria-hidden="true" />
              {t('fit.adjust')}
            </button>
          )}
        </div>
      )}

      {/* Only mounted with a conflict in hand, so a day that holds everything pays nothing. */}
      {shownFit && (
        <PlannerFitAssistant
          key={`${shownFit.parkSlug}:${shownFit.date}:${shownFit.nonce}`}
          open
          onOpenChange={(next) => {
            if (!next) setFit(null);
          }}
          parkName={parkName}
          dateLabel={longDate(date, locale)}
          input={shownFit.input}
          initialChoice={shownFit.choice}
          onConfirm={(choice) => {
            setFit(null);
            applyChoice(shownFit.input, choice, Boolean(shownFit.choice));
          }}
        />
      )}
    </OptimizeRow>
  );
}

/**
 * The day as a plan leaves it, so {@link clashCount} can compare the day on screen with the day the
 * press would write.
 */
function withPlan(
  entries: readonly PlannerEntry[],
  stops: readonly { entryId: string | null; startMinute: number }[]
): PlannerEntry[] {
  const moved = new Map<string, number>();
  for (const stop of stops) if (stop.entryId) moved.set(stop.entryId, stop.startMinute);
  return entries.map((entry) =>
    moved.has(entry.id) ? { ...entry, startMinute: moved.get(entry.id) as number } : entry
  );
}

/**
 * The row's frame, shared by the day that can be optimised and the day that cannot, so `trailing`
 * keeps its place in the tree and the bell in it is not remounted when the buttons come or go.
 * `data-planner-optimize` only where there is something to press, which `check:planner` counts.
 * Buttons are drawn 32 px on a phone and reach 44 px with a 12 px overhang above. See
 * docs/features/trip-planner.md#every-target-in-the-sheet-is-44-px-and-three-of-them-are-not-what-they-measure.
 */
function OptimizeRow({
  marked,
  buttons,
  trailing,
  children,
}: {
  marked: boolean;
  buttons?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      data-planner-optimize={marked ? '' : undefined}
      className="border-border/60 planner-phone:pt-2 planner-phone:pb-1 flex shrink-0 flex-col gap-1.5 border-t px-3 py-2"
    >
      {/* One line on a phone: with `nowrap` the headliner button gives way instead of the
          trailing control dropping to a second line. */}
      <div className="planner-phone:flex-nowrap flex flex-wrap items-center gap-1.5">
        {buttons}
        {/* At the row's end however the buttons before it size themselves. */}
        {trailing && <div className="ml-auto flex shrink-0 items-center">{trailing}</div>}
      </div>
      {children}
    </div>
  );
}
