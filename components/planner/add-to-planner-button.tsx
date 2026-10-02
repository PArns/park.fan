'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner, usePlannedCount } from '@/lib/planner/use-planner';
import { plannerStore } from '@/lib/planner/store';
import { dayClock, longDate, resolveTimeZone, todayInZone } from '@/lib/planner/park-time';
import { planDayQuery } from '@/lib/hooks/use-plan-day';
import type { FitChoice, FitInput } from '@/lib/planner/fit';
import type { PlannerEntry, PlannerGeo } from '@/lib/planner/types';
import { trackPlanOptimized } from '@/lib/analytics/umami';

type FitAssistant = typeof import('./planner-fit-assistant').PlannerFitAssistant;

interface AddToPlannerButtonProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  attractionSlug: string;
  attractionName: string;
  /**
   * The park's IANA zone. Optional only because the payloads that carry it
   * declare it optional — pass it wherever it is known, because it is BOTH the
   * date this files under and the zone the whole plan then reckons in.
   */
  timezone?: string;
  /** Park-local date. Defaults to today where the park is. */
  date?: string;
  className?: string;
}

/**
 * Puts one ride into the plan.
 *
 * This is the feature's real entry point — the floating launcher only appears
 * once something is in — so it has to work from a ride card, a ride page and the
 * mobile search alike, which is why it takes the park's identity as props rather
 * than reading a context. A card deep in a list has that information already; a
 * context would mean wrapping the tree for it.
 *
 * The state is read through the module store, so pressing this on one card
 * updates the launcher's count and any other copy of this button for the same
 * ride, with no provider between them.
 *
 * **A day with no room for the ride opens the assistant instead (PAR-67).** The
 * press files without a minute, and `addEntry` puts such a ride an hour after the
 * last one and never before now. Late on the day you are in the park that ran
 * past closing within five presses and then stacked rides on the 25:00 ceiling.
 * The press now asks `noRoomForRide` first and, where the engine cannot give
 * every wish a slot before closing, opens `PlannerFitAssistant` on that question
 * and writes nothing until the visitor confirms there.
 */
export function AddToPlannerButton({
  parkSlug,
  parkName,
  geo,
  attractionSlug,
  attractionName,
  timezone,
  date,
  className,
}: AddToPlannerButtonProps) {
  const t = useTranslations('planner');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { addRide, setActive, restoreDay, applyPlan } = usePlanner();
  // What this button DISPLAYS a count for, and deliberately not what a press
  // files under: this is a render-time reading of the clock, and `handleAdd`
  // takes its own. A stale date here shows the wrong count for one render and
  // corrects itself on the next; a stale date on the write is a misfiling.
  const targetDate = date ?? todayInZone(timezone);
  const plannedCount = usePlannedCount(parkSlug, targetDate, attractionSlug);
  const planned = plannedCount > 0;

  /**
   * The question a press raised, while somebody answers it.
   *
   * Held with the date it was asked FOR, because that is the day the answer
   * writes into, and with the dialog's own code: the assistant and the engine
   * behind it load on the press that needs them, not with every ride page.
   * `nonce` remounts the dialog per press, so each question opens on a fresh
   * answer, as it does in the optimise row.
   */
  const [fit, setFit] = useState<{
    date: string;
    input: FitInput;
    nonce: number;
    Assistant: FitAssistant;
  } | null>(null);
  /**
   * What the assistant's answer did, with the day before it for one undo.
   *
   * The rule for the optimise row holds here too: where the answer leaves
   * something out, it says so in a bordered line with a way back, and an
   * answer that re-timed the whole day can be taken back in one press. It
   * lives in component state, so it lasts as long as the page does.
   */
  const [result, setResult] = useState<{
    date: string;
    before: readonly PlannerEntry[];
    text: string;
    alert: boolean;
  } | null>(null);
  // One press at a time: the probe can wait on the network, and a second press
  // in that window would file a ride the first one is still deciding about.
  const pending = useRef(false);

  const file = (filingDate: string, now: number) => {
    addRide(
      {
        parkSlug,
        parkName,
        geo,
        timezone,
        date: filingDate,
        attractionSlug,
        attractionName,
      },
      now
    );
    // Adding also decides what the flyout shows: a visitor who just planned a
    // ride at this park on this day means to look at that day, not at whatever
    // was open last week.
    setActive(parkSlug, filingDate);
  };

  /**
   * The conflict this press would cause, or `null` to file the ride as before.
   *
   * Every failure is `null` too: a plan-day request that errors or a chunk that
   * does not load must not take the button away. The payload comes through the
   * same query the flyout uses, so a day the panel has shown costs no request.
   */
  const probe = async (filingDate: string, now: number) => {
    try {
      const [day, { noRoomForRide }] = await Promise.all([
        queryClient.fetchQuery(
          planDayQuery({
            continent: geo.continent,
            country: geo.country,
            city: geo.city,
            parkSlug,
            date: filingDate,
          })
        ),
        import('@/lib/planner/add-ride-fit'),
      ]);
      // Read after the await, so a day edited while the request was out is the
      // day the question is asked about.
      const planned = plannerStore.getSnapshot().parks[parkSlug]?.days[filingDate];
      const clock = dayClock(filingDate, resolveTimeZone(timezone), now);
      const input = noRoomForRide({
        day,
        entries: planned?.entries ?? [],
        attractionSlug,
        clock,
        earlyEntry: planned?.prefs?.earlyEntry,
      });
      if (!input) return null;
      const { PlannerFitAssistant } = await import('./planner-fit-assistant');
      return { input, Assistant: PlannerFitAssistant };
    } catch {
      return null;
    }
  };

  const handleAdd = async () => {
    if (pending.current) return;
    pending.current = true;
    // ONE clock read decides both halves, and the two are not independent: the
    // day this files under and the earliest minute inside that day. `targetDate`
    // above is computed at RENDER, so a ride page left open across park-local
    // midnight would file under yesterday — where `addEntry`'s floor reads
    // `phase: 'past'`, declines to raise anything and lands the ride at 10:00 on
    // a day that has ended. That is the fault this button was fixed for, at the
    // one boundary a floor cannot see from inside the day it is given.
    const now = Date.now();
    const filingDate = date ?? todayInZone(timezone, now);
    // A new press is a new question; the last answer's undo would restore a
    // day this press is about to change.
    setResult(null);
    try {
      const conflict = await probe(filingDate, now);
      if (conflict) {
        setFit((current) => ({
          date: filingDate,
          nonce: (current?.nonce ?? 0) + 1,
          ...conflict,
        }));
        return;
      }
      file(filingDate, now);
    } finally {
      pending.current = false;
    }
  };

  /**
   * The visitor's answer, written the way the optimise row writes it:
   * `restoreDay` with the entries the choice keeps, then `applyPlan` with the
   * schedule. Cancelling never reaches this, so the day stays as it was and the
   * ride stays unplanned.
   */
  const confirm = async (input: FitInput, filingDate: string, choice: FitChoice) => {
    setFit(null);
    const { evaluateFit } = await import('@/lib/planner/fit');
    const outcome = evaluateFit(input, choice);
    // The answer re-times every movable ride of the day and drops what was
    // unticked, so the day as it was is kept for one „Rückgängig", as in the
    // optimise row. `input.entries` is that day: the dialog is modal.
    const left = outcome.missed.length + choice.dropped.size;
    setResult({
      date: filingDate,
      before: input.entries.map((entry) => ({ ...entry })),
      text: [
        t('fit.applied', { count: outcome.fitted.length }),
        ...(left > 0 ? [t('fit.leftOut', { count: left })] : []),
      ].join(' · '),
      alert: left > 0,
    });
    restoreDay(parkSlug, filingDate, outcome.entries);
    applyPlan({
      parkSlug,
      parkName,
      geo,
      timezone,
      date: filingDate,
      stops: outcome.stops.map((stop) => ({
        entryId: stop.entryId,
        attractionSlug: stop.attractionSlug,
        attractionName: stop.attractionName,
        startMinute: stop.startMinute,
      })),
    });
    trackPlanOptimized(parkName);
    setActive(parkSlug, filingDate);
  };

  const undo = () => {
    if (!result) return;
    restoreDay(parkSlug, result.date, result.before);
    setResult(null);
  };

  const button = (
    <button
      type="button"
      onClick={() => void handleAdd()}
      aria-label={
        planned ? `${t('plannedTimes', { count: plannedCount })} — ${t('addAgain')}` : t('addRide')
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
        planned
          ? 'bg-crowd-low/20 text-crowd-low hover:bg-crowd-low/30'
          : 'bg-accent/60 text-foreground hover:bg-accent',
        className
      )}
    >
      {planned ? <Repeat className="size-3.5" /> : <Plus className="size-3.5" />}
      <span>{planned ? t('addAgain') : t('addRide')}</span>
    </button>
  );

  if (!fit && !result) return button;
  const Assistant = fit?.Assistant;
  return (
    <span className="relative inline-flex">
      {button}
      {result && (
        // Hung below the button rather than in the row: the button sits in a
        // header row beside the favourite star, and a line in that flow would
        // push the row apart. Same colours as the optimise row's result line.
        <span
          role="status"
          className={cn(
            'bg-popover absolute top-full right-0 z-20 mt-1 flex w-max max-w-[min(18rem,calc(100vw-6rem))] items-center gap-2 rounded-md border px-2 py-1 text-xs shadow-sm transition-opacity starting:opacity-0',
            result.alert
              ? 'border-crowd-high/40 text-crowd-high'
              : 'border-border text-muted-foreground'
          )}
        >
          <span>{result.text}</span>
          <button
            type="button"
            onClick={undo}
            className="text-primary shrink-0 font-medium underline-offset-2 hover:underline"
          >
            {t('optimize.undo')}
          </button>
        </span>
      )}
      {fit && Assistant && (
        <Assistant
          key={fit.nonce}
          open
          onOpenChange={(next) => {
            if (!next) setFit(null);
          }}
          parkName={parkName}
          dateLabel={longDate(fit.date, locale)}
          input={fit.input}
          requested={attractionName}
          onConfirm={(choice) => void confirm(fit.input, fit.date, choice)}
        />
      )}
    </span>
  );
}
