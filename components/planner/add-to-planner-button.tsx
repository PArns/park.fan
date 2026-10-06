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
   * The park's IANA zone. Optional only because the payloads declare it so; pass it wherever it is
   * known, since it is both the date this files under and the zone the plan reckons in.
   */
  timezone?: string;
  /** Park-local date. Defaults to today where the park is. */
  date?: string;
  className?: string;
}

/**
 * Puts one ride into the plan, from a ride card, a ride page or the mobile search alike, so it
 * takes the park's identity as props rather than from a context. State is read through the module
 * store, so every copy of this button and the launcher's count update together.
 *
 * A day with no room for the ride opens the assistant instead: the press asks `noRoomForRide`
 * first and, where not every wish gets a slot before closing, opens `PlannerFitAssistant` and
 * writes nothing until the visitor confirms. See
 * docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
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
  // What this button displays a count for, not what a press files under: `handleAdd` reads its own
  // clock, since a stale date on a write is a misfiling.
  const targetDate = date ?? todayInZone(timezone);
  const plannedCount = usePlannedCount(parkSlug, targetDate, attractionSlug);
  const planned = plannedCount > 0;

  /**
   * The question a press raised, while somebody answers it, with the date it was asked for (where
   * the answer writes) and the dialog's own code, loaded on the press that needs it. `nonce`
   * remounts the dialog per press.
   */
  const [fit, setFit] = useState<{
    date: string;
    input: FitInput;
    /** What the dialog opens on: the pressed ride pinned. */
    choice: FitChoice;
    nonce: number;
    Assistant: FitAssistant;
  } | null>(null);
  /**
   * What the assistant's answer did, with the day before it for one undo, as in the optimise row:
   * a bordered line where something was left out, and a way back.
   */
  const [result, setResult] = useState<{
    date: string;
    before: readonly PlannerEntry[];
    text: string;
    alert: boolean;
  } | null>(null);
  // One press at a time: the probe can wait on the network, and a second press would file a ride
  // the first is still deciding about.
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
    // Adding also decides what the flyout shows: the day just planned on.
    setActive(parkSlug, filingDate);
  };

  /**
   * The conflict this press would cause, or `null` to file the ride as before. Every failure is
   * `null` too, so an error never takes the button away. The payload comes through the flyout's own
   * query.
   */
  const probe = async (filingDate: string, now: number) => {
    try {
      const [day, { noRoomForRide, requestedRideChoice }] = await Promise.all([
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
      // Read after the await, so a day edited meanwhile is the day asked about.
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
      return { input, choice: requestedRideChoice(attractionSlug), Assistant: PlannerFitAssistant };
    } catch {
      return null;
    }
  };

  const handleAdd = async () => {
    if (pending.current) return;
    pending.current = true;
    // One clock read decides both the filing date and the earliest minute in it: `targetDate` is
    // computed at render, and a page left open across park-local midnight would file under
    // yesterday.
    const now = Date.now();
    const filingDate = date ?? todayInZone(timezone, now);
    // A new press is a new question; the last answer's undo would restore a day this press changes.
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
   * The visitor's answer, written as the optimise row writes it: `restoreDay` with the entries the
   * choice keeps, then `applyPlan`. Cancelling never reaches this.
   */
  const confirm = async (input: FitInput, filingDate: string, choice: FitChoice) => {
    setFit(null);
    const { evaluateFit } = await import('@/lib/planner/fit');
    const outcome = evaluateFit(input, choice);
    // The day as it was is kept for one „Rückgängig"; `input.entries` is that day, since the dialog
    // is modal.
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
      stops: outcome.stops,
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
        // Below the button rather than in its header row, where a line would push the row apart.
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
          initialChoice={fit.choice}
          requested={attractionName}
          onConfirm={(choice) => void confirm(fit.input, fit.date, choice)}
        />
      )}
    </span>
  );
}
