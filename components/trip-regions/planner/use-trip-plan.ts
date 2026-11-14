'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { usePlanContext } from './plan-context';
import {
  calendarQueryKey,
  fetchTripCalendar,
  fetchTripPlan,
  fetchTripWhen,
  fetchSchoolBreaks,
  schoolBreaksQueryKey,
  PLAN_DEBOUNCE_MS,
  planQueryKey,
  retryPlanRequest,
  whenQueryKey,
} from '@/lib/trip-regions/plan-fetch';

/** The API keeps a plan and a calendar an hour; the planner treats them as fresh for a quarter. */
const FRESH_MS = 15 * 60_000;

/**
 * The plan for a request query, asked once the controls have been still for
 * {@link PLAN_DEBOUNCE_MS}. The previous plan stays on screen while the next is asked
 * (`keepPreviousData`), so a stepper press dims the result instead of emptying it; `waiting` is
 * true from the press to the answer, debounce included. A 400 is not retried (`retryPlanRequest`).
 */
export function useTripPlan(query: Record<string, string> | null) {
  const region = usePlanContext().region.slug;
  const search = query ? new URLSearchParams(query).toString() : null;
  const settled = useDebouncedValue(search, PLAN_DEBOUNCE_MS);
  const asked = settled === null ? null : Object.fromEntries(new URLSearchParams(settled));
  const result = useQuery({
    queryKey: planQueryKey(region, asked ?? {}),
    queryFn: ({ signal }) => fetchTripPlan(region, asked ?? {}, signal),
    enabled: asked !== null,
    placeholderData: keepPreviousData,
    staleTime: FRESH_MS,
    gcTime: 4 * FRESH_MS,
    retry: retryPlanRequest,
    refetchOnWindowFocus: false,
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
    staleTime: FRESH_MS,
    gcTime: 4 * FRESH_MS,
    retry: retryPlanRequest,
    refetchOnWindowFocus: false,
  });
}

/**
 * A window of the region calendar (at most 92 days) through the relay: the hours, slots, seasons
 * and per-day figures the plan does not carry. `null` dates leave it idle.
 */
export function useTripCalendar(from: string | null, to: string | null) {
  const region = usePlanContext().region.slug;
  return useQuery({
    queryKey: calendarQueryKey(region, from ?? '', to ?? ''),
    queryFn: ({ signal }) => fetchTripCalendar(region, from as string, to as string, signal),
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
    staleTime: FRESH_MS,
    gcTime: 4 * FRESH_MS,
    retry: retryPlanRequest,
    refetchOnWindowFocus: false,
  });
}

/**
 * The When search for a request query, debounced like the plan; the previous answer stays on
 * screen while the next is asked. The API keeps an answer six hours, the planner a quarter.
 */
export function useTripWhen(query: Record<string, string> | null) {
  const region = usePlanContext().region.slug;
  const search = query ? new URLSearchParams(query).toString() : null;
  const settled = useDebouncedValue(search, PLAN_DEBOUNCE_MS);
  const asked = settled === null ? null : Object.fromEntries(new URLSearchParams(settled));
  const result = useQuery({
    queryKey: whenQueryKey(region, asked ?? {}),
    queryFn: ({ signal }) => fetchTripWhen(region, asked ?? {}, signal),
    enabled: asked !== null,
    placeholderData: keepPreviousData,
    staleTime: FRESH_MS,
    gcTime: 4 * FRESH_MS,
    retry: retryPlanRequest,
    refetchOnWindowFocus: false,
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
