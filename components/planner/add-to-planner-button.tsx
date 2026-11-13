'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanner, usePlannedCount } from '@/lib/planner/use-planner';
import { plannerStore } from '@/lib/planner/store';
import { longDate, todayInZone } from '@/lib/planner/park-time';
import { planDayQuery } from '@/lib/hooks/use-plan-day';
import type { FitChoice } from '@/lib/planner/fit';
import { fitChoiceAll } from '@/lib/planner/fit';
import type { FitAnswer, FitQuestion } from '@/lib/planner/optimize-remote';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry, PlannerGeo } from '@/lib/planner/types';
import {
  trackPlanOptimized,
  trackPlannerFitOpened,
  trackPlannerUndo,
} from '@/lib/analytics/planner-funnel';
import { rememberParkId, rememberRideId } from '@/lib/planner/entity-ids';
import type { WorksPeriod } from '@/lib/api/types';
import { worksNotPlannableLabel, worksPeriodOn, worksRunningLabel } from '@/lib/utils/works-period';
import { WORKS_TONE_CLASS, WorksIcon } from '@/components/parks/works-period-list';

type FitAssistant = typeof import('./planner-fit-assistant').PlannerFitAssistant;

interface AddToPlannerButtonProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  attractionSlug: string;
  attractionName: string;
  /** The park's and the ride's UUIDs, for the planner's events only; see `entity-ids.ts`. */
  parkId?: string;
  attractionId?: string;
  /**
   * The park's IANA zone. Optional only because the payloads declare it so; pass it wherever it is
   * known, since it is both the date this files under and the zone the plan reckons in.
   */
  timezone?: string;
  /** Park-local date. Defaults to today where the park is. */
  date?: string;
  /**
   * The ride's maintenance windows (`worksPeriodsOf`). While one covers the day this would file
   * under, the button says until when and adds nothing: `/plan/day` has no curve for the ride
   * then, and the planner would show a block for a ride that does not run.
   */
  worksPeriods?: readonly WorksPeriod[];
  className?: string;
}

/**
 * Puts one ride into the plan, from a ride card, a ride page or the mobile search alike, so it
 * takes the park's identity as props rather than from a context. State is read through the module
 * store, so every copy of this button and the launcher's count update together.
 *
 * A day with no room for the ride opens the assistant instead: the press asks `noRoomForRide`
 * (the API's optimizer) first and, where not every wish gets a slot before closing, opens
 * `PlannerFitAssistant` and writes nothing until the visitor confirms. See
 * docs/rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md.
 */
export function AddToPlannerButton({
  parkSlug,
  parkName,
  geo,
  attractionSlug,
  attractionName,
  parkId,
  attractionId,
  timezone,
  date,
  worksPeriods,
  className,
}: AddToPlannerButtonProps) {
  const t = useTranslations('planner');
  const tWorks = useTranslations('parks.worksPeriod');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { addRide, setActive, restoreDay, applyPlan } = usePlanner();
  // What this button displays a count for, not what a press files under: `handleAdd` reads its own
  // clock, since a stale date on a write is a misfiling.
  const targetDate = date ?? todayInZone(timezone);
  const plannedCount = usePlannedCount(parkSlug, targetDate, attractionSlug);
  const planned = plannedCount > 0;
  const closedFor = worksPeriodOn(worksPeriods ?? [], targetDate);

  /**
   * The question a press raised, while somebody answers it, with the date it was asked for (where
   * the answer writes) and the dialog's own code, loaded on the press that needs it. `nonce`
   * remounts the dialog per press.
   */
  const [fit, setFit] = useState<{
    date: string;
    question: FitQuestion;
    /** The answer for everything ticked, drawn until the pinned one arrives. */
    initial: { choice: FitChoice; answer: FitAnswer };
    /** What the dialog opens on: the pressed ride pinned. */
    choice: FitChoice;
    /** The day's payload, for the rides' photos; `null` where it could not be read. */
    day: PlanDay | null;
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
      'add_button',
      now
    );
    // Adding also decides what the flyout shows: the day just planned on.
    setActive(parkSlug, filingDate);
  };

  /**
   * The conflict this press would cause, or `null` to file the ride as before. Every failure is
   * `null` too, so an error never takes the button away. The day is read before the request, so
   * the question is about the day as it stands at the press.
   */
  const probe = async (filingDate: string) => {
    try {
      const planned = plannerStore.getSnapshot().parks[parkSlug]?.days[filingDate];
      const { noRoomForRide, requestedRideChoice } = await import('@/lib/planner/add-ride-fit');
      const conflict = await noRoomForRide({
        target: { geo, parkSlug, date: filingDate, timezone },
        entries: planned?.entries ?? [],
        attractionSlug,
        earlyEntry: planned?.prefs?.earlyEntry,
      });
      if (!conflict) return null;
      // The payload only for the list's photos, through the flyout's own query and cache.
      const [day, { PlannerFitAssistant }] = await Promise.all([
        queryClient
          .fetchQuery(
            planDayQuery({
              continent: geo.continent,
              country: geo.country,
              city: geo.city,
              parkSlug,
              date: filingDate,
            })
          )
          .catch(() => null),
        import('./planner-fit-assistant'),
      ]);
      return {
        question: conflict.question,
        initial: { choice: fitChoiceAll(), answer: conflict.answer },
        choice: requestedRideChoice(attractionSlug),
        day,
        Assistant: PlannerFitAssistant,
      };
    } catch {
      return null;
    }
  };

  const handleAdd = async () => {
    if (pending.current) return;
    pending.current = true;
    // Before any write, so the events this press sends can name the park and the ride.
    rememberParkId(parkSlug, parkId);
    rememberRideId(parkSlug, attractionSlug, attractionId);
    // One clock read decides both the filing date and the earliest minute in it: `targetDate` is
    // computed at render, and a page left open across park-local midnight would file under
    // yesterday.
    const now = Date.now();
    const filingDate = date ?? todayInZone(timezone, now);
    // A new press is a new question; the last answer's undo would restore a day this press changes.
    setResult(null);
    try {
      const conflict = await probe(filingDate);
      if (conflict) {
        setFit((current) => ({
          date: filingDate,
          nonce: (current?.nonce ?? 0) + 1,
          ...conflict,
        }));
        trackPlannerFitOpened('add_button', parkSlug);
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
  const confirm = (
    question: FitQuestion,
    filingDate: string,
    choice: FitChoice,
    answer: FitAnswer
  ) => {
    setFit(null);
    // The day as it was is kept for one „Rückgängig"; the question holds that day, since the
    // dialog is modal.
    const left = answer.missed.length + choice.dropped.size;
    setResult({
      date: filingDate,
      before: question.entries.map((entry) => ({ ...entry })),
      text: [
        t('fit.applied', { count: answer.fitted.length }),
        ...(left > 0 ? [t('fit.leftOut', { count: left })] : []),
      ].join(' · '),
      alert: left > 0,
    });
    restoreDay(parkSlug, filingDate, answer.entries);
    applyPlan(
      {
        parkSlug,
        parkName,
        geo,
        timezone,
        date: filingDate,
        stops: answer.stops,
      },
      'add_button'
    );
    trackPlanOptimized('fit', parkSlug);
    setActive(parkSlug, filingDate);
  };

  const undo = () => {
    if (!result) return;
    restoreDay(parkSlug, result.date, result.before);
    trackPlannerUndo('add_button', parkSlug);
    setResult(null);
  };

  if (closedFor) {
    const reason = worksNotPlannableLabel(attractionName, closedFor, locale, tWorks, targetDate);
    return (
      <button
        type="button"
        disabled
        title={reason}
        aria-label={reason}
        data-planner-add-works=""
        className={cn(
          'bg-muted/60 text-muted-foreground inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-orange-500/30 px-4 py-2 text-sm font-medium max-sm:min-h-11 max-sm:w-full',
          className
        )}
      >
        <WorksIcon className={cn('size-4', WORKS_TONE_CLASS)} aria-hidden="true" />
        <span>{worksRunningLabel(closedFor, locale, tWorks)}</span>
      </button>
    );
  }

  const button = (
    <button
      type="button"
      onClick={() => void handleAdd()}
      aria-label={
        planned ? `${t('plannedTimes', { count: plannedCount })} — ${t('addAgain')}` : t('addRide')
      }
      // The ride page's call to action, drawn like the park page's planner button: filled, full
      // width on a phone. Planned, it turns the crowd scale's green.
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-md transition-colors max-sm:min-h-11 max-sm:w-full',
        planned
          ? 'bg-crowd-low/20 text-crowd-low hover:bg-crowd-low/30'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
        className
      )}
    >
      {planned ? (
        <Repeat className="size-4" aria-hidden="true" />
      ) : (
        <CalendarPlus className="size-4" aria-hidden="true" />
      )}
      <span>{planned ? t('addAgain') : t('addRide')}</span>
    </button>
  );

  if (!fit && !result) return button;
  const Assistant = fit?.Assistant;
  return (
    <span className="relative inline-flex max-sm:w-full">
      {button}
      {result && (
        // Below the button rather than in its header row, where a line would push the row apart.
        <span
          role="status"
          className={cn(
            'bg-popover absolute top-full left-0 z-20 mt-1 flex w-max max-w-[min(18rem,calc(100vw-6rem))] items-center gap-2 rounded-md border px-2 py-1 text-xs shadow-sm transition-opacity starting:opacity-0',
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
          question={fit.question}
          day={fit.day}
          initialChoice={fit.choice}
          initial={fit.initial}
          requested={attractionName}
          onConfirm={(choice, answer) => confirm(fit.question, fit.date, choice, answer)}
        />
      )}
    </span>
  );
}
