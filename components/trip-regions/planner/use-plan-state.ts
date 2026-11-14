'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  normalizePlanState,
  planHref,
  planRegionKeys,
  readPlanQuery,
  writePlanQuery,
  type TripPlanState,
} from '@/lib/trip-regions/plan';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import type { TripRegion } from '@/lib/trip-regions/types';

/**
 * The planner's state, which is the address bar's query: no copy of it lives anywhere else, so a
 * reload, "Copy link" and Parky's links open the same plan. A change is written with
 * `history.replaceState`, which Next's router follows, so `useSearchParams` sees it without a
 * navigation and the page does not remount.
 *
 * The router takes a moment to report a write, and two presses can fall inside it; the written state
 * is held until the URL catches up, so the second press builds on the first. A query that is
 * neither the one written nor the one it replaced came from outside (Parky's `router.push`, the
 * back button), and `onExternal` is told, so the planner can scroll to itself.
 */
export function usePlanState(region: TripRegion, onExternal?: () => void) {
  const params = useSearchParams();
  const search = params.toString();
  const keys = useMemo(() => planRegionKeys(region), [region]);
  const fromUrl = useMemo(() => readPlanQuery(new URLSearchParams(search), keys), [search, keys]);

  const [own, setOwn] = useState<{
    base: string;
    written: string;
    state: TripPlanState;
  } | null>(null);
  const state = own && (search === own.written || search === own.base) ? own.state : fromUrl;

  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const update = useCallback((recipe: (state: TripPlanState) => TripPlanState) => {
    const before = latest.current;
    const next = normalizePlanState(recipe(before));
    if (next === before) return;
    latest.current = next;
    // In `URLSearchParams` spelling, which is what `useSearchParams` reports it back in.
    const written = new URLSearchParams(writePlanQuery(next)).toString();
    setOwn({ base: new URLSearchParams(window.location.search).toString(), written, state: next });
    window.history.replaceState(
      null,
      '',
      planHref(window.location.pathname, next, TRIP_PLANNER_ID)
    );
  }, []);

  // Only a query the planner did not write is news; the first one counts, since a link opened it.
  const reported = useRef<string | null>(null);
  const isOwn = own !== null && (search === own.written || search === own.base);
  useEffect(() => {
    if (isOwn || reported.current === search) return;
    reported.current = search;
    onExternal?.();
  }, [search, isOwn, onExternal]);

  return { state, update, keys };
}
