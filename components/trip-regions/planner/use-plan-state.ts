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
import { connectPlannerBridge } from '@/lib/trip-regions/planner-bridge';
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

  // Every query this planner wrote or wrote over: Back from a sheet lands on one of them for a
  // frame before the latest is put back, and that is no link from outside.
  const known = useRef(new Set<string>());
  const update = useCallback((recipe: (state: TripPlanState) => TripPlanState) => {
    const before = latest.current;
    const next = normalizePlanState(recipe(before));
    if (next === before) return;
    latest.current = next;
    // In `URLSearchParams` spelling, which is what `useSearchParams` reports it back in.
    const written = new URLSearchParams(writePlanQuery(next)).toString();
    const base = new URLSearchParams(window.location.search).toString();
    known.current.add(written).add(base);
    setOwn({ base, written, state: next });
    window.history.replaceState(
      null,
      '',
      planHref(window.location.pathname, next, TRIP_PLANNER_ID)
    );
  }, []);

  // Parky reads the plan on screen and changes it through `update`, as a press would.
  useEffect(
    () => connectPlannerBridge(region.slug, state, update, keys),
    [region.slug, state, update, keys]
  );

  // Only a query the planner did not write is news; the first one counts, since a link opened it.
  const reported = useRef<string | null>(null);
  const isOwn = own !== null && (search === own.written || search === own.base);
  useEffect(() => {
    if (isOwn || reported.current === search || known.current.has(search)) return;
    reported.current = search;
    onExternal?.();
  }, [search, isOwn, onExternal]);

  return { state, update, keys };
}
