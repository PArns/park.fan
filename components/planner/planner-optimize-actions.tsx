'use client';

import { useDeferredValue, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Crown, SlidersHorizontal, Undo2, Wand2 } from 'lucide-react';
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
   * Drawn at the end of the button row: the phone's show switch (PAR-482).
   * Where there are no buttons to draw, the row is drawn for it alone, so the
   * switch never depends on the day being one that can be optimised. Pass it
   * only where it renders something: the row cannot tell an element that
   * renders `null` from one that does not, and would be drawn empty.
   */
  trailing?: ReactNode;
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
 * **A day that cannot hold what was asked for opens the assistant instead.**
 * That is the change this file exists for now. Both presses probe first
 * (`needsFitHelp`), and where something would be left out — a headliner the
 * engine drops, or an entry it can only park past the gate — nothing is
 * written and `PlannerFitAssistant` asks the question instead. What used to
 * happen was a plan applied silently and a clause in an eleven-pixel grey line
 * saying „eine passt nicht mehr in den Tag", beside a block drawn at 18:45 in a
 * park that shuts at 18:00. The information was there; it did not read as
 * something to act on, and there was nothing to act on it WITH.
 *
 * Neither button appears where it could not mean anything. A park whose wait
 * times nobody can read (Hansa-Park) aggregates to the same assumed nothing for
 * every ride, so every order is as good as every other and `canOptimize` says
 * no; a day with one ride in it and nothing to add has exactly one order; and
 * the headliner button is gone once they are all in, like the band above it. It
 * is NOT gone where exactly one headliner is missing, which the engine used to
 * refuse to plan — the button was there, and pressing it did nothing.
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
  trailing,
}: PlannerOptimizeActionsProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
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
    /**
     * Something the visitor asked for is not in the day.
     *
     * It decides how the sentence is DRAWN, and that is the whole point: the
     * same clause in the same grey line was what the report called too subtle.
     * A day that lost nothing keeps the muted line it always had.
     */
    alert: boolean;
  } | null>(null);
  const [undoTo, setUndoTo] = useState<{
    parkSlug: string;
    date: string;
    entries: readonly PlannerEntry[];
  } | null>(null);
  /**
   * The conflict, while somebody is deciding what to do about it.
   *
   * Keyed on (park, date) like the two above and for the same reason: the panel
   * can be switched to another day underneath an open dialog, and a "plan these
   * nine" pressed afterwards would file another park's slugs into it. The whole
   * `FitInput` is held rather than rebuilt per render, so the dialog's own
   * memos stay stable while somebody ticks their way through it.
   */
  const [fit, setFit] = useState<{
    parkSlug: string;
    date: string;
    /** Increments per press, so the dialog remounts with a fresh answer. */
    nonce: number;
    input: FitInput;
  } | null>(null);

  // Memoised so the search below (`gain`) keys on the day's entries and not on
  // a fresh empty array per render where the day has none.
  const entries = useMemo(
    () => state.parks[parkSlug]?.days[date]?.entries ?? NO_ENTRIES,
    [state, parkSlug, date]
  );

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
  // Subscribed for the re-render, and the counter itself keys the `gain`
  // search below so that it follows the clock too. `subscribeToNothing` on any
  // other date, so a plan for next Saturday installs no 60-second interval.
  const nowTick = useSyncExternalStore(
    isToday ? subscribeToMinute : subscribeToNothing,
    isToday ? getMinuteTick : getZero,
    getZero
  );
  const clock = dayClock(date, zone);

  /**
   * What pressing „Tag optimieren" would gain, worked out before anybody
   * presses it (PAR-493).
   *
   * The button was a grey ghost among grey rows, and the report was that
   * nobody saw it. It is only worth shouting about when it would change
   * something, so the day is optimised once here, exactly the way `run`
   * does it — same engine, same input, same `scoreCurrent` before-figure —
   * and the button turns into the panel's call to action where that answer
   * beats the plan on screen. The figure it prints is the difference between
   * those two scores, i.e. what `run` reports when it applies the plan, never
   * an estimate of its own. Where the day still cannot hold everything, the
   * press opens `PlannerFitAssistant` first, as it always has, and the figure
   * is then what the assistant's plan starts from rather than a promise.
   *
   * Only where the two figures cover the same rides, which is the rule `run`
   * prints a saving under too: a plan the engine had to cut short
   * (`MAX_STOPS`) or one that parked a ride outside the day would compare a
   * before over N rides with an after over fewer.
   *
   * It reads a DEFERRED copy of the entries, which is the rule in
   * `docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md`:
   * typing a free block's label writes the entry on every keystroke, and a
   * 5–50 ms search in the same commit as the keystroke is a field that lags.
   * The grid arrives memoised from the caller, so it is a stable key.
   * `nowTick` moves the answer on today's date, once a minute, the same way
   * the buttons' own visibility follows the clock (and the same pattern the
   * grid's now line uses).
   */
  const deferredEntries = useDeferredValue(entries);
  const gain = useMemo(() => {
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
    if (fitted <= 0 && saved < 5) return null;
    return { fitted: Math.max(0, fitted), saved: Math.max(0, saved) };
  }, [grid, day, deferredEntries, date, timezone, nowTick]);

  /** The row with its trailing control alone, where there is nothing to optimise. */
  const bare = trailing ? <OptimizeRow marked={false} trailing={trailing} /> : null;
  if (!grid || !canOptimize(day, grid) || !day) return bare;
  // A day that has been walked is a record. Both buttons plan FOR the visitor,
  // and there is nothing left to plan — the engine refuses it too, so this is
  // about not drawing a control that could only answer "Passt schon so".
  if (clock.phase === 'past') return bare;

  const missing = headlinersToAdd(day, entries, prefs);
  const skipped = headlinersSkipped(day, entries, prefs);
  // The same set the engine will work on. Counted with the bare filter, this
  // offers "Tag optimieren" for a day whose two rides are both behind us.
  const movable = movableEntries(entries, clock);

  const canSort = movable.length >= 2;
  if (!canSort && missing.length === 0) return bare;

  const shownResult = result?.parkSlug === parkSlug && result?.date === date ? result : null;
  const shownUndo = undoTo?.parkSlug === parkSlug && undoTo?.date === date ? undoTo : null;
  const shownFit = fit?.parkSlug === parkSlug && fit?.date === date ? fit : null;

  /** Puts the day back as it was before the last press; the phone's icon and the link share it. */
  const undo = () => {
    if (!shownUndo) return;
    // The snapshot's own key, not the props: they are equal here by the guard
    // above, and writing it this way means the day being restored is the day
    // the entries were copied from.
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
   * Press, probe, and only then decide whether this is a question.
   *
   * The probe is one search — 5–50 ms on the days this was reported — and it is
   * thrown away: what lands on the axis is always planned from the set that was
   * actually agreed. Where the day holds everything (the common case) nothing
   * is asked and the press is the press it always was; a dialog on the way to a
   * button that would have done the right thing is a dialog people learn to
   * dismiss.
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
    // The clock goes to BOTH, and for two different reasons. `optimizeDay` uses
    // it as a floor and as a membership rule; `scoreCurrent` only as the second
    // — it scores the day where the blocks actually are, so a floor there would
    // be a claim about where they should be. Withholding it from the incumbent
    // is what made the before-figure cover a morning the plan never saw, so
    // "45 Min. weniger Warten" was a ride that had already been queued for.
    const input = { day, grid, entries, add, priority, clock };
    const before = scoreCurrent({ day, grid, entries, clock });
    const plan = optimizeDay(input);

    if (!plan) {
      // The snapshot is deliberately left alone. Planning the headliners and
      // then pressing "Tag optimieren" to check is one gesture a visitor
      // actually makes, and clearing the undo here took away the only way back
      // from the press before it — on the press that changed nothing.
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
      // On the five-minute grid, like every wait figure on screen and like the
      // call to action that promised this number before the press (`gain`).
      const shownSaved = roundWaitDeltaTo5(saved);
      if (fitted > 0) parts.push(t('optimize.fitted', { count: fitted }));
      if (shownSaved > 0) parts.push(t('optimize.saved', { minutes: shownSaved }));
      // A rebuilt day that queues the same amount says so. Where it queues MORE
      // and gained nothing that fits, the only honest line is that it moved:
      // `optimizeDay` only returns such a plan for a day that could not be
      // walked in the first place, so there is no before-figure worth quoting.
      else if (fitted <= 0) parts.push(saved < 0 ? t('optimize.resorted') : t('optimize.sameWait'));
    }
    if (skipped > 0 && add.length > 0) parts.push(t('optimize.skipped', { count: skipped }));
    if (plan.overflow > 0) parts.push(t('optimize.overflow', { count: plan.overflow }));
    if (plan.capped > 0) {
      parts.push(t('optimize.capped', { count: plan.capped, max: MAX_STOPS }));
    }
    setResult({ parkSlug, date, text: parts.join(' · '), alert: plan.overflow > 0 });
  };

  /**
   * The assistant's answer, written in two moves.
   *
   * `restoreDay` first, with the entries the choice leaves — that is what takes
   * a ride the visitor unticked out of the day, and it is the one place in the
   * app where a plan loses an entry it was not asked about ride by ride.
   * `applyPlan` then lays the schedule over what is left. Two writes rather
   * than one because they are two different statements about the day, and the
   * undo snapshot is taken before both, so „Rückgängig" puts back the day that
   * was on screen when the dialog opened.
   */
  const applyChoice = (input: FitInput, choice: FitChoice) => {
    const outcome = evaluateFit(input, choice);
    setUndoTo({ parkSlug, date, entries: entries.map((entry) => ({ ...entry })) });
    restoreDay(parkSlug, date, outcome.entries);
    applyPlan({
      parkSlug,
      parkName,
      geo,
      timezone,
      date,
      stops: outcome.stops.map((stop) => ({
        entryId: stop.entryId,
        attractionSlug: stop.attractionSlug,
        attractionName: stop.attractionName,
        startMinute: stop.startMinute,
      })),
    });
    trackPlanOptimized(parkName);

    const left = outcome.missed.length + choice.dropped.size;
    const parts = [t('fit.applied', { count: outcome.fitted.length })];
    if (left > 0) parts.push(t('fit.leftOut', { count: left }));
    setResult({ parkSlug, date, text: parts.join(' · '), alert: left > 0 });
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
                'bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                // 32 px drawn, 44 px to a finger, all of the overhang ABOVE
                // (PAR-482). See `PHONE_TARGET_32_UP`. `w-min` on a phone: as
                // wide as its longest word, so the label always takes two lines
                // like the call to action beside it, and the call to action
                // grows into the rest. A box does not shrink to text that has
                // wrapped, so without it the button kept the width the row
                // left it and carried empty space beside "Headliner / planen".
                // Never below the longest word: with `min-w-0` it went below,
                // and French lost the "s" of "Attractions".
                'planner-phone:py-0 planner-phone:px-2.5 planner-phone:w-min',
                PHONE_TARGET_32_UP
              )}
            >
              <Crown className="size-3.5 shrink-0" aria-hidden="true" />
              {/* A shorter label on a phone, where this button shares its row
                  with the call to action and the show switch (PAR-482), and it may
                  take two lines there like the call to action does, which is
                  what 32 px holds at this size. It was the crown alone for a
                  while; nobody read the crown as "add the headliners". The
                  hidden span is `display: none`, so the button's name is
                  whichever label is on screen. */}
              <span className="planner-phone:hidden truncate">{t('optimize.headliners')}</span>
              <span className="planner-wide:hidden line-clamp-2 text-left leading-tight">
                {t('optimize.headlinersShort')}
              </span>
            </button>
          )}
          {/* A call to action where the day would gain from it, a tinted button
            like the headliner one where it would not — see `gain`. Filled with the
            primary colour and stretched over the rest of the row, so it is
            the one thing in the foot that reads as "press me", and it names
            what the press is worth in the same words the result line will use
            afterwards. */}
          {canSort && (
            <button
              type="button"
              onClick={() => attempt([])}
              data-planner-optimize-run=""
              data-planner-optimize-gain={gain ? '' : undefined}
              title={t('optimize.hint')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
                // 32 px drawn, 44 px to a finger, all of the overhang ABOVE
                // (PAR-482). See `PHONE_TARGET_32_UP`.
                'planner-phone:py-0 planner-phone:px-2.5',
                PHONE_TARGET_32_UP,
                gain
                  ? // Grows into the rest of the row, and WRAPS onto a row of its
                    // own rather than shrinking into "Tag op…" beside a long
                    // headliner label: `flex-[1_0_auto]` never shrinks below its
                    // content, `max-w-full` keeps it inside the row.
                    'bg-primary text-primary-foreground hover:bg-primary/90 max-w-full flex-[1_0_auto] justify-center shadow-sm'
                  : // The headliner button's tint where there is nothing to
                    // gain, so the row reads as one set of buttons rather than
                    // a button and a stray word (PAR-482: "gleiche Farbe,
                    // wenn's nix zu optimieren gibt"). It still sorts the day.
                    // On a phone it takes the rest of the row either way
                    // ("CTA volle Breite").
                    'bg-primary/10 text-primary hover:bg-primary/20 planner-phone:flex-[1_0_auto] planner-phone:justify-center font-medium'
              )}
            >
              <Wand2 className="size-3.5 shrink-0" aria-hidden="true" />
              {gain ? (
                /* Two lines, the verb over what it is worth, so the pair fits
                 beside the headliner button at 360 px in German. */
                <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                  <span className="max-w-full truncate font-semibold">{t('optimize.run')}</span>
                  <span className="max-w-full truncate text-[11px] opacity-85">
                    {gain.fitted > 0
                      ? t('optimize.fitted', { count: gain.fitted })
                      : t('optimize.saved', { minutes: gain.saved })}
                  </span>
                </span>
              ) : (
                <span className="truncate">{t('optimize.run')}</span>
              )}
            </button>
          )}
          {/* The phone's undo: the icon, in this row, and only while there is
              something to undo (PAR-482). The sentence under the row keeps what
              the press did; the way back sits with the buttons, where the
              thumb already is, instead of as a link at the end of that line.
              36 × 32 drawn and 36 × 44 to a finger, all of the overhang above
              like its neighbours; none to the sides, so it stays clear of the
              show switch's reach 4 px into the gap beside it. The wide
              arrangement keeps the link in the sentence. */}
          {shownUndo && (
            <button
              type="button"
              onClick={undo}
              data-planner-optimize-undo-icon=""
              aria-label={t('optimize.undo')}
              title={t('optimize.undo')}
              className={cn(
                // The row's tint, like the buttons beside it: ghosted, it read
                // as a gap between the call to action and the show switch.
                'planner-wide:hidden bg-primary/10 text-primary hover:bg-primary/20 flex size-9 shrink-0 items-center justify-center rounded-md transition-colors',
                PHONE_TARGET_32_UP
              )}
            >
              <Undo2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </>
      }
    >
      {/* Polite rather than assertive: it reports something the reader asked for
          and can see on the axis above, so it does not interrupt them. The undo
          sits IN the sentence that says what happened, because that sentence is
          the only place a reader is looking after the press.

          A day that came out short is drawn differently, and that difference is
          the report this work started from: the same clause in the same grey
          line („eine passt nicht mehr in den Tag") sat under a block filed at
          18:45 in a park that shuts at 18:00 and read as decoration. It gets the
          crowd tint, the warning mark and — the part that matters — a way back
          into the assistant, because a notice about a problem with no control
          beside it is a notice nobody can answer. */}
      {shownResult && (
        <div
          role="status"
          data-planner-optimize-result=""
          data-planner-optimize-alert={shownResult.alert ? '' : undefined}
          className={cn(
            'flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] leading-snug',
            shownResult.alert
              ? 'border-crowd-high/40 bg-crowd-high/10 text-crowd-high rounded-md border px-2 py-1.5'
              : // Read out but not drawn on a phone (PAR-482: „worauf bezieht
                // sich das?"). With the undo moved into the button row the
                // plain report stood alone under it, a sentence with nothing
                // to say what it was about; the day it describes is right
                // above, and the undo icon is the press's trace. An alert
                // stays drawn: it carries „Anpassen", something to do.
                'text-muted-foreground planner-phone:sr-only'
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
              onClick={() => attempt([])}
              data-planner-optimize-adjust=""
              className="hover:bg-crowd-high/15 inline-flex items-center gap-1 rounded px-1 py-0.5 underline underline-offset-2 transition-colors"
            >
              <SlidersHorizontal className="size-3 shrink-0" aria-hidden="true" />
              {t('fit.adjust')}
            </button>
          )}
          {shownUndo && (
            <button
              type="button"
              onClick={undo}
              data-planner-optimize-undo=""
              className={cn(
                // On a phone the undo is an icon in the button row instead —
                // see `data-planner-optimize-undo-icon`.
                'planner-phone:hidden inline-flex items-center gap-1 underline underline-offset-2 transition-colors',
                shownResult.alert
                  ? 'hover:bg-crowd-high/15 rounded px-1 py-0.5'
                  : 'hover:text-foreground'
              )}
            >
              <Undo2 className="size-3 shrink-0" aria-hidden="true" />
              {t('optimize.undo')}
            </button>
          )}
        </div>
      )}

      {/* Only ever mounted with a conflict in hand, so the day that holds every
          headliner never pays for it — no dialog, no reset effect, no listener.
          See `PlannerFitAssistant`. */}
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
          onConfirm={(choice) => {
            setFit(null);
            applyChoice(shownFit.input, choice);
          }}
        />
      )}
    </OptimizeRow>
  );
}

/**
 * The row's frame, shared by the day that can be optimised and the day that
 * cannot.
 *
 * One frame and not two, so `trailing` keeps its place in the tree when the
 * buttons arrive or go. It was two once, a bare `div` and this one, and the
 * control moved between them: React unmounted it and mounted a new one. With
 * the notification bell there, whose `usePushSubscription()` asks `/api/push`
 * on mount, the bell vanished for the length of a second request (measured:
 * gone at 4160 ms, back at 4677 with the plan held for 4 s). Here it is the
 * second child of the same element in both cases.
 *
 * `data-planner-optimize` only where there is something to press, which is
 * what `check:planner` counts it for.
 *
 * The buttons are drawn 32 px tall on a phone and reach the 44 px
 * `check:planner` asserts with an overhang of 12 px ABOVE them (PAR-482): 8 of
 * this row's top padding, its border and 3 px of the band above, which stay
 * clear of the headliner pills' own overhang. Nothing reaches down, so the row
 * closes on 4 px and the summary line under it carries no target at all — the
 * trailing control is the last item of this row since PAR-482. PAR-313 had kept the button
 * itself at 44 and taken the padding instead; the report since was that the
 * CTAs were still too tall, so now the drawn button gives way and the target
 * does not.
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
      {/* One line on a phone, always: a wrapping flex row never shrinks an
          item before it breaks the line, so at 360 px the trailing control went to a
          second line (83 px instead of 45) rather than the headliner label
          taking two. With `nowrap` the headliner button is the one that gives
          way, the call to action and the trailing control keep their size. */}
      <div className="planner-phone:flex-nowrap flex flex-wrap items-center gap-1.5">
        {buttons}
        {/* At the row's end whatever the buttons before it do; `ml-auto` for
            the day whose optimise button is the quiet one and does not grow,
            and for the day that has no buttons at all. */}
        {trailing && <div className="ml-auto flex shrink-0 items-center">{trailing}</div>}
      </div>
      {children}
    </div>
  );
}
