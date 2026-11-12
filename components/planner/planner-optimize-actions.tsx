'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { plannerUi } from '@/lib/planner/ui-store';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Crown, Loader2, SlidersHorizontal, Undo2, Wand2 } from 'lucide-react';
import { usePlanner } from '@/lib/planner/use-planner';
import { plannerStore } from '@/lib/planner/store';
import { canOptimize, headlinersToAdd, movableEntries } from '@/lib/planner/optimize';
import { fitChoiceAll, type FitChoice } from '@/lib/planner/fit';
import {
  optimizeKeyOf,
  requestOptimize,
  type FitAnswer,
  type FitQuestion,
  type OptimizeAnswer,
  type OptimizeTarget,
} from '@/lib/planner/optimize-remote';
import { useOptimizePreview } from '@/lib/planner/use-optimize-remote';
import { PlannerFitAssistant } from './planner-fit-assistant';
import { PlannerOptimizeFailure } from './planner-optimize-failure';
import {
  trackPlanOptimized,
  trackPlannerFitOpened,
  trackPlannerUndo,
} from '@/lib/analytics/planner-funnel';
import { dayClock, longDate, parkToday, resolveTimeZone } from '@/lib/planner/park-time';
import {
  getMinuteTick,
  getZero,
  subscribeToMinute,
  subscribeToNothing,
} from '@/lib/planner/minute-tick';
import type { DayGrid } from '@/lib/planner/day-grid';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerDayPrefs, PlannerEntry, PlannerGeo } from '@/lib/planner/types';
import { roundWaitDeltaTo5 } from '@/lib/utils/wait-time';
import { PHONE_TARGET_32_UP } from '@/lib/planner/touch-target';
import { cn } from '@/lib/utils';

/** The entries of a day that has none, as one array rather than a new one per render. */
const NO_ENTRIES: readonly PlannerEntry[] = [];

/** The two presses: re-order the day, or plan the headliners into it. */
type PressMode = 'day' | 'headliners';

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
 * only re-orders. One engine, in the API (`requestOptimize`), two buttons, because "fill my day"
 * and "is this the best order" are different questions.
 *
 * A press waits for the API with the button marked busy, and a failure says so with a retry; the
 * plan is never touched until an answer arrives for the day as it still stands. The result line
 * prints a saving only where before and after cover the same rides, and `optimize.already` only
 * where the API found nothing to do. A day that cannot hold what was asked for opens
 * `PlannerFitAssistant` instead of applying a plan. Nothing is drawn where the order cannot mean
 * anything: no readable wait times, one movable ride or none, or a past day. See
 * docs/features/trip-planner/optimizer.md#refusals-commit-and-undo and
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
    fit?: { question: FitQuestion; choice: FitChoice };
  } | null>(null);
  const [undoTo, setUndoTo] = useState<{
    parkSlug: string;
    date: string;
    entries: readonly PlannerEntry[];
  } | null>(null);
  /**
   * The conflict, while somebody is deciding what to do about it. Keyed on (park, date) like the
   * two above, so a decision cannot be filed into another day.
   */
  const [fit, setFit] = useState<{
    parkSlug: string;
    date: string;
    /** Increments per press, so the dialog remounts with a fresh answer. */
    nonce: number;
    question: FitQuestion;
    /** The answer to open on, where this is „Anpassen" on an earlier one. */
    choice?: FitChoice;
    /** The answer the press already brought, for everything ticked. */
    initial?: { choice: FitChoice; answer: FitAnswer };
  } | null>(null);
  /** A press on its way to the API, keyed like the rest, so its button can say so. */
  const [pending, setPending] = useState<{
    parkSlug: string;
    date: string;
    mode: PressMode;
  } | null>(null);
  /** The press the API could not answer, to offer again. */
  const [failure, setFailure] = useState<{
    parkSlug: string;
    date: string;
    mode: PressMode;
  } | null>(null);

  // Memoised so the preview keys on the day's entries, not on a fresh empty array per render.
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
  // `subscribeToNothing` on any other date, so a future plan installs no interval.
  useSyncExternalStore(
    isToday ? subscribeToMinute : subscribeToNothing,
    isToday ? getMinuteTick : getZero,
    getZero
  );
  const clock = dayClock(date, zone);
  // A press asked for from outside the panel (Parky); see `plannerUi.requestOptimize`.
  const optimizeId = useSyncExternalStore(
    plannerUi.subscribe,
    plannerUi.getOptimizeSnapshot,
    getZero
  );

  const target: OptimizeTarget = { geo, parkSlug, date, timezone };
  const ready = Boolean(grid && day && canOptimize(day, grid)) && clock.phase !== 'past';
  // The engine's own set; the bare filter would offer "Tag optimieren" for rides already behind us.
  const movable = movableEntries(entries, clock, day);
  const canSort = movable.length >= 2;

  /**
   * What pressing „Tag optimieren" would gain, asked before anybody presses it: the same request as
   * the press, without the fit question, so the call to action promises exactly what the press then
   * reports. Only where both figures cover the same rides.
   */
  const preview = useOptimizePreview({
    target,
    entries,
    prefs,
    clock,
    enabled: ready && canSort,
  }).data;
  const gain = useMemo(() => {
    if (preview?.status !== 'optimized' || !preview.plan || !preview.before || !preview.after) {
      return null;
    }
    if (preview.plan.stops.length !== preview.movable) return null;
    const fitted = preview.before.overflow - preview.after.overflow;
    const saved = roundWaitDeltaTo5(
      preview.before.totalWaitMinutes - preview.after.totalWaitMinutes
    );
    // Clashes the plan takes out: a pause dragged onto a ride leaves the waits where they were and
    // the day impossible, which neither figure above sees.
    const resolved = preview.before.clashes - preview.after.clashes;
    if (fitted <= 0 && saved < 5 && resolved <= 0) return null;
    return {
      fitted: Math.max(0, fitted),
      saved: Math.max(0, saved),
      resolved: Math.max(0, resolved),
    };
  }, [preview]);

  /** The row with its trailing control alone, where there is nothing to optimise. */
  const bare = trailing ? <OptimizeRow marked={false} trailing={trailing} /> : null;
  if (!ready || !day) return bare;

  const missing = headlinersToAdd(day, entries, prefs);
  if (!canSort && missing.length === 0) return bare;

  const here = (keyed: { parkSlug: string; date: string } | null) =>
    keyed?.parkSlug === parkSlug && keyed?.date === date;
  const shownResult = here(result) ? result : null;
  const shownUndo = here(undoTo) ? undoTo : null;
  const shownFit = here(fit) ? fit : null;
  const shownPending = here(pending) ? pending : null;
  const shownFailure = here(failure) ? failure : null;

  /** Puts the day back as it was before the last press; the phone's icon and the link share it. */
  const undo = () => {
    if (!shownUndo) return;
    // The snapshot's own key rather than the props, so the day restored is the day it was copied
    // from.
    restoreDay(shownUndo.parkSlug, shownUndo.date, shownUndo.entries);
    trackPlannerUndo('optimize', shownUndo.parkSlug);
    setUndoTo(null);
    setResult(null);
  };

  /**
   * Press, and let the API decide whether this is a question: where the day holds everything it
   * answers with the plan, because a dialog in front of a button that would have done the right
   * thing is a dialog people learn to dismiss. An answer for a day edited meanwhile is dropped.
   */
  const attempt = (mode: PressMode) => {
    if (shownPending) return;
    const sent = entries;
    const sentKey = optimizeKeyOf(sent);
    setPending({ parkSlug, date, mode });
    setFailure(null);
    requestOptimize(target, { mode, entries: sent, prefs })
      .then((answer) => {
        const now = plannerStore.getSnapshot().parks[parkSlug]?.days[date]?.entries ?? [];
        if (optimizeKeyOf(now) === sentKey) settle(answer, sent);
      })
      .catch(() => setFailure({ parkSlug, date, mode }))
      .finally(() => setPending(null));
  };

  const settle = (answer: OptimizeAnswer, sent: readonly PlannerEntry[]) => {
    if (answer.status === 'needs-fit' && answer.fit) {
      setFit({
        parkSlug,
        date,
        nonce: (fit?.nonce ?? 0) + 1,
        question: {
          target,
          entries: sent,
          prefs,
          add: answer.add,
          ...(answer.clock.phase === 'today' && { nowMinute: answer.clock.nowMinute }),
        },
        initial: { choice: fitChoiceAll(), answer: answer.fit },
      });
      trackPlannerFitOpened('optimize', parkSlug);
      return;
    }

    const plan = answer.status === 'optimized' ? answer.plan : null;
    if (!plan) {
      // The undo is left alone: checking with „Tag optimieren" after planning the headliners must
      // not take away the way back from the press before.
      setResult({ parkSlug, date, text: t('optimize.already'), alert: false });
      return;
    }

    setUndoTo({ parkSlug, date, entries: sent.map((entry) => ({ ...entry })) });
    // Only „Alle Headliner" adds rides, so every stop without an entry is one of those.
    applyPlan({ parkSlug, parkName, geo, timezone, date, stops: plan.stops }, 'headliners');
    const adding = answer.add.length > 0;
    trackPlanOptimized(adding ? 'headliners' : 'day', parkSlug);

    // What the plan actually holds, never what was asked for: the cap can cut the list short.
    const added = plan.stops.filter((stop) => stop.entryId === null).length;
    const replanned = plan.stops.length - added;
    const { before, after } = answer;

    const parts: string[] = [];
    if (added > 0) parts.push(t('optimize.added', { count: added }));
    // A saving only where the same rides are compared: not with rides added, and not where the cap
    // trimmed the plan.
    if (!adding && before && after && replanned === answer.movable) {
      const fitted = before.overflow - after.overflow;
      const saved = before.totalWaitMinutes - after.totalWaitMinutes;
      // On the five-minute grid, like every wait on screen and like the promise in `gain`.
      const shownSaved = roundWaitDeltaTo5(saved);
      const resolved = before.clashes - after.clashes;
      if (resolved > 0) parts.push(t('optimize.resolved', { count: resolved }));
      if (fitted > 0) parts.push(t('optimize.fitted', { count: fitted }));
      if (shownSaved > 0) parts.push(t('optimize.saved', { minutes: shownSaved }));
      // A rebuilt day that queues more and gained nothing only says it moved: the API returns such
      // a plan only for a day that could not be walked.
      else if (fitted <= 0 && resolved <= 0) {
        parts.push(saved < 0 ? t('optimize.resorted') : t('optimize.sameWait'));
      }
    }
    if (answer.skippedHeadliners > 0 && adding) {
      parts.push(t('optimize.skipped', { count: answer.skippedHeadliners }));
    }
    if (plan.overflow > 0) parts.push(t('optimize.overflow', { count: plan.overflow }));
    if (plan.capped > 0) {
      parts.push(t('optimize.capped', { count: plan.capped, max: answer.maxStops }));
    }
    setResult({ parkSlug, date, text: parts.join(' · '), alert: plan.overflow > 0 });
  };

  /**
   * The assistant's answer, in two writes: `restoreDay` with the entries the choice keeps, which is
   * the one place a plan loses an entry not removed ride by ride, then `applyPlan` for the
   * schedule. The undo snapshot is taken before both.
   */
  const applyChoice = (
    question: FitQuestion,
    choice: FitChoice,
    answer: FitAnswer,
    revising = false
  ) => {
    // A revision starts from the day the question was first asked about, so undo still goes back
    // to that day.
    if (!(revising && shownUndo)) {
      setUndoTo({ parkSlug, date, entries: entries.map((entry) => ({ ...entry })) });
    }
    restoreDay(parkSlug, date, answer.entries);
    applyPlan({ parkSlug, parkName, geo, timezone, date, stops: answer.stops }, 'headliners');
    trackPlanOptimized('fit', parkSlug);

    const left = answer.missed.length + choice.dropped.size;
    const parts = [t('fit.applied', { count: answer.fitted.length })];
    if (left > 0) parts.push(t('fit.leftOut', { count: left }));
    setResult({
      parkSlug,
      date,
      text: parts.join(' · '),
      alert: left > 0,
      fit: left > 0 ? { question, choice } : undefined,
    });
  };

  const requested = optimizeId ? plannerUi.optimizeRequestFor(parkSlug, date) : null;

  return (
    <OptimizeRow
      marked
      trailing={trailing}
      buttons={
        <>
          {requested && (
            <RunOnce
              key={requested.id}
              run={() => {
                plannerUi.clearOptimize(requested.id);
                attempt(requested.mode === 'headliners' ? 'headliners' : 'day');
              }}
            />
          )}
          {missing.length > 0 && (
            <button
              type="button"
              onClick={() => attempt('headliners')}
              disabled={Boolean(shownPending)}
              aria-busy={shownPending?.mode === 'headliners'}
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
              {shownPending?.mode === 'headliners' ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <Crown className="size-3.5 shrink-0" aria-hidden="true" />
              )}
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
              onClick={() => attempt('day')}
              disabled={Boolean(shownPending)}
              aria-busy={shownPending?.mode === 'day'}
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
              {shownPending?.mode === 'day' ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <Wand2 className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              {shownPending?.mode === 'day' ? (
                <span className="truncate">{t('optimize.running')}</span>
              ) : gain ? (
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
                    question: asked.question,
                    choice: asked.choice,
                  });
                  trackPlannerFitOpened('optimize', parkSlug);
                } else {
                  attempt('day');
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

      {shownFailure && <PlannerOptimizeFailure onRetry={() => attempt(shownFailure.mode)} />}

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
          question={shownFit.question}
          day={day}
          initialChoice={shownFit.choice}
          initial={shownFit.initial}
          onConfirm={(choice, answer) => {
            setFit(null);
            applyChoice(shownFit.question, choice, answer, Boolean(shownFit.choice));
          }}
        />
      )}
    </OptimizeRow>
  );
}

/**
 * The row's frame, shared by the day that can be optimised and the day that cannot, so `trailing`
 * keeps its place in the tree and the bell in it is not remounted when the buttons come or go.
 * `data-planner-optimize` only where there is something to press, which `check:planner` counts.
 * Buttons are drawn 32 px on a phone and reach 44 px with a 12 px overhang above. See
 * docs/features/trip-planner/phone.md#every-row-of-controls-is-drawn-at-32-px.
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

/** Runs `run` once after it mounts: a press asked for from outside, carried out like a click. */
function RunOnce({ run }: { run: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    run();
  });
  return null;
}
