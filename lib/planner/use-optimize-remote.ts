import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { FitChoice, FitLeverView } from './fit';
import {
  optimizeKeyOf,
  requestFit,
  requestOptimize,
  type FitAnswer,
  type FitQuestion,
  type OptimizeTarget,
} from './optimize-remote';
import type { DayClock } from './park-time';
import { SNAP_MIN_FINE } from './day-grid';
import type { PlannerDayPrefs, PlannerEntry } from './types';

/** A fifteen-minute window, like `/plan/day`'s own: the day the optimizer plans against. */
const OPTIMIZE_STALE_MS = 15 * 60_000;

/**
 * What of the clock can change an answer: the quarter hour the plan starts from and which entries
 * the clock has already reached. Anything finer would ask the API again every minute for the same
 * answer.
 */
function clockKeyOf(clock: DayClock, entries: readonly PlannerEntry[]): string {
  if (clock.phase !== 'today') return clock.phase;
  const started = entries.filter((entry) => entry.startMinute < clock.nowMinute);
  return `${Math.ceil(clock.nowMinute / SNAP_MIN_FINE)}:${started.map((e) => e.id).join(',')}`;
}

/** A choice as a query key: the sets sorted, the priority in its order. */
function choiceKeyOf(choice: FitChoice): string {
  return JSON.stringify([
    [...choice.dropped].sort(),
    [...choice.droppedBlocks].sort(),
    [...choice.shortBlocks].sort(),
    choice.priority,
  ]);
}

/**
 * What a press of „Tag optimieren" would bring, asked before anybody presses it so the button can
 * promise exactly what the press then reports. Keyed on what the answer depends on, so an edit
 * asks once and a ticking clock asks only when the plan's first quarter hour moves.
 */
export function useOptimizePreview({
  target,
  entries,
  prefs,
  clock,
  enabled,
}: {
  target: OptimizeTarget;
  entries: readonly PlannerEntry[];
  prefs: PlannerDayPrefs | undefined;
  clock: DayClock;
  enabled: boolean;
}) {
  const { geo, parkSlug, date } = target;
  return useQuery({
    queryKey: [
      'plan-optimize',
      'preview',
      geo.continent,
      geo.country,
      geo.city,
      parkSlug,
      date,
      optimizeKeyOf(entries),
      prefs?.earlyEntry === true,
      clockKeyOf(clock, entries),
    ],
    queryFn: ({ signal }) =>
      requestOptimize(target, { mode: 'day', entries, prefs, preview: true }, signal),
    enabled,
    staleTime: OPTIMIZE_STALE_MS,
    gcTime: OPTIMIZE_STALE_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * The fit assistant's answer for one choice. The answer to the previous choice stays on screen
 * while the next is asked (`isPlaceholderData`), so a tap does not blank the dialog. `initial` is
 * an answer already in hand, from the press that opened the dialog.
 */
export function useFitAnswer(
  question: FitQuestion | null,
  choice: FitChoice,
  {
    levers,
    enabled = true,
    initial,
  }: {
    levers: boolean;
    enabled?: boolean;
    initial?: { choice: FitChoice; answer: FitAnswer };
  }
) {
  const choiceKey = choiceKeyOf(choice);
  return useQuery({
    queryKey: [
      'plan-optimize',
      'fit',
      question?.target.geo.continent,
      question?.target.geo.country,
      question?.target.geo.city,
      question?.target.parkSlug,
      question?.target.date,
      JSON.stringify(question?.entries ?? []),
      JSON.stringify(question?.prefs ?? {}),
      question?.add.join(',') ?? '',
      question?.nowMinute ?? null,
      choiceKey,
      levers,
    ],
    queryFn: ({ signal }) => requestFit(question as FitQuestion, choice, levers, signal),
    enabled: enabled && question !== null,
    placeholderData: keepPreviousData,
    initialData: initial && choiceKeyOf(initial.choice) === choiceKey ? initial.answer : undefined,
    staleTime: OPTIMIZE_STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** The levers of an answer as the list draws them, or none where levers were not asked for. */
export function leverViewOf(answer: FitAnswer | undefined): FitLeverView {
  return { levers: answer?.levers ?? [], applied: new Set(answer?.applied ?? []) };
}
