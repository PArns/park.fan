'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { usePlanContext } from './plan-context';
import {
  calendarQueryKey,
  fetchTripCalendar,
  fetchTripPlan,
  fetchTripPlanIdeas,
  ideasQueryKey,
  fetchTripWhen,
  fetchSchoolBreaks,
  schoolBreaksQueryKey,
  PLAN_DEBOUNCE_MS,
  planQueryKey,
  retryPlanRequest,
  whenQueryKey,
} from '@/lib/trip-regions/plan-fetch';
import { planRequestQuery } from '@/lib/trip-regions/plan';
import { ticketProblem } from '@/lib/trip-regions/plan-tickets';

/** The API keeps a plan and a calendar an hour; the planner treats them as fresh for a quarter. */
const FRESH_MS = 15 * 60_000;

/** How the planner caches a plan, a calendar window or a When answer, and when it asks again. */
const PLAN_QUERY_OPTIONS = {
  staleTime: FRESH_MS,
  gcTime: 4 * FRESH_MS,
  retry: retryPlanRequest,
  refetchOnWindowFocus: false,
};

/**
 * A request query as it settles: `search` follows the controls, `settled` is the same string once
 * they have been still for {@link PLAN_DEBOUNCE_MS}, and `asked` is the settled query to send.
 */
function useSettledQuery(query: Record<string, string> | null) {
  const search = query ? new URLSearchParams(query).toString() : null;
  const settled = useDebouncedValue(search, PLAN_DEBOUNCE_MS);
  const asked = settled === null ? null : Object.fromEntries(new URLSearchParams(settled));
  return { search, settled, asked };
}

/**
 * The plan for a request query, asked once the controls have been still for
 * {@link PLAN_DEBOUNCE_MS}. The previous plan stays on screen while the next is asked
 * (`keepPreviousData`), so a stepper press dims the result instead of emptying it; `waiting` is
 * true from the press to the answer, debounce included. A 400 is not retried (`retryPlanRequest`).
 */
export function useTripPlan(query: Record<string, string> | null) {
  const region = usePlanContext().region.slug;
  const { search, settled, asked } = useSettledQuery(query);
  const result = useQuery({
    queryKey: planQueryKey(region, asked ?? {}),
    queryFn: ({ signal }) => fetchTripPlan(region, asked ?? {}, signal),
    enabled: asked !== null,
    placeholderData: keepPreviousData,
    ...PLAN_QUERY_OPTIONS,
  });
  return {
    ...result,
    /** The query asked for, once the controls are still: `settled`, as the request carries it. */
    asked: settled,
    /** The controls moved since the plan on screen was asked for, or the answer is on its way. */
    waiting: search !== null && (search !== settled || result.isFetching),
    /** The plan on screen answers the query asked last (and not a previous one, still shown). */
    current: search !== null && search === settled && !result.isPlaceholderData,
  };
}

/**
 * The `/plan` query of the planner's own state (`planRequestQuery` with the planner's scope): the
 * trip's own headliners named while no park is chosen, nothing while a ticket or the region's
 * today holds the request back. The plan, its ideas and the unpinned plan all ask this one.
 */
export function usePlanRequestQuery(): Record<string, string> | null {
  const { state, headliners, allHeadliners, tickets: catalog, today } = usePlanContext();
  const blocked = ticketProblem(state, catalog) !== null;
  return planRequestQuery(state, headliners, blocked, { today, allHeadliners });
}

/**
 * The plan for the planner's own state, the one the answer shows: also read by the setup's Route,
 * which lists the plan's stays. One request either way, the cache's.
 */
export function useStatePlan() {
  return useTripPlan(usePlanRequestQuery());
}

/**
 * Parky's ideas for the plan on screen, asked once that plan answers the query asked last, so
 * they never hold up the plan and never describe the one before it. The API caches them an hour
 * apart from the plan, as the planner does.
 */
export function usePlanIdeas() {
  const { region } = usePlanContext();
  const plan = useStatePlan();
  // `current` is false while the request is held back (a ticket the dates miss, a past trip).
  const shown = plan.current && !plan.waiting && plan.data !== undefined;
  const asked = shown ? plan.asked : null;
  const query = asked === null ? {} : Object.fromEntries(new URLSearchParams(asked));
  return useQuery({
    queryKey: ideasQueryKey(region.slug, query),
    queryFn: ({ signal }) => fetchTripPlanIdeas(region.slug, query, signal),
    enabled: asked !== null,
    ...PLAN_QUERY_OPTIONS,
  });
}

/**
 * The plan without the visitor's pins, for the edit bar's "best order" figure: the same query
 * minus `lock`, which is usually the plan the visitor started from and still in the cache.
 */
export function useUnpinnedPlan(query: Record<string, string> | null) {
  const region = usePlanContext().region.slug;
  const unpinned = query?.lock
    ? Object.fromEntries(Object.entries(query).filter(([k]) => k !== 'lock'))
    : null;
  return useQuery({
    queryKey: planQueryKey(region, unpinned ?? {}),
    queryFn: ({ signal }) => fetchTripPlan(region, unpinned ?? {}, signal),
    enabled: unpinned !== null,
    ...PLAN_QUERY_OPTIONS,
  });
}

/**
 * A window of the region calendar (at most 92 days) through the relay: the hours, slots, seasons
 * and per-day figures the plan does not carry. `null` dates leave it idle, and so does the region's
 * unread today; days before it are not asked for, as the API refuses a window in the past.
 */
export function useTripCalendar(asFrom: string | null, asTo: string | null) {
  const { region: own, today } = usePlanContext();
  const region = own.slug;
  const start = asFrom && today ? (asFrom < today ? today : asFrom) : null;
  const from = start && asTo && start <= asTo ? start : null;
  const to = from ? asTo : null;
  return useQuery({
    queryKey: calendarQueryKey(region, from ?? '', to ?? ''),
    queryFn: ({ signal }) => fetchTripCalendar(region, from as string, to as string, signal),
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
    ...PLAN_QUERY_OPTIONS,
  });
}

/**
 * The When search for a request query, debounced like the plan; the previous answer stays on
 * screen while the next is asked. The API keeps an answer six hours, the planner a quarter.
 */
export function useTripWhen(query: Record<string, string> | null) {
  const region = usePlanContext().region.slug;
  const { search, settled, asked } = useSettledQuery(query);
  const result = useQuery({
    queryKey: whenQueryKey(region, asked ?? {}),
    queryFn: ({ signal }) => fetchTripWhen(region, asked ?? {}, signal),
    enabled: asked !== null,
    placeholderData: keepPreviousData,
    ...PLAN_QUERY_OPTIONS,
  });
  return {
    ...result,
    /** The query asked for, once the controls are still. */
    asked: settled,
    waiting: search !== null && (search !== settled || result.isFetching),
  };
}

/**
 * The school-holiday regions the When mode's picker offers, read once when the picker is shown.
 * The data changes a few times a year; the relay keeps it a day.
 */
export function useSchoolBreaks(enabled: boolean) {
  const region = usePlanContext().region.slug;
  return useQuery({
    queryKey: schoolBreaksQueryKey(region),
    queryFn: ({ signal }) => fetchSchoolBreaks(region, signal),
    enabled,
    staleTime: 24 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    retry: retryPlanRequest,
    refetchOnWindowFocus: false,
  });
}
