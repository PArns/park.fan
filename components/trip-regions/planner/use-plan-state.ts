'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  normalizePlanState,
  planHref,
  planRegionKeys,
  readPlanQuery,
  writePlanQuery,
  type PlanEditChange,
  type TripPlanState,
} from '@/lib/trip-regions/plan';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import { connectPlannerBridge } from '@/lib/trip-regions/planner-bridge';
import { trackTripEvent, tripOptionChanges } from '@/lib/trip-regions/plan-analytics';
import { headlinersForTrip } from '@/lib/trip-regions/trip-fit';
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
 *
 * An edit made from the result (`edit`: a pin, a swap, a move, a park added or taken out, one of
 * Parky's ideas) is kept with the whole state before it, so `undo` takes back every edit in turn,
 * not only its pins. A change of the answers, or a query from outside, starts the history afresh:
 * undoing past it would undo the answer too. `clear` (a deleted or restarted trip, `clearTrip`)
 * empties the state and the history and keeps both in memory for the undo of the delete.
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
  const history = useRef<Array<{ before: TripPlanState; change: PlanEditChange }>>([]);
  const [edits, setEdits] = useState<PlanEdits>(NO_EDITS);
  const seq = useRef(0);
  const record = useCallback(
    (
      entries: Array<{ before: TripPlanState; change: PlanEditChange }>,
      edits: Omit<PlanEdits, 'seq'> | null
    ) => {
      history.current = entries;
      setEdits(edits ? { ...edits, seq: ++seq.current } : NO_EDITS);
    },
    []
  );
  const slug = region.slug;
  const headliners = useMemo(
    () => region.parks.filter((p) => p.headliner).map((p) => p.slug),
    [region.parks]
  );
  // `by` null: the state replaced as a whole (a deleted trip, one put back), which changed no option.
  const apply = useCallback(
    (
      recipe: (state: TripPlanState) => TripPlanState,
      by: 'visitor' | 'parky' | null,
      change: PlanEditChange | 'clear' | 'undo'
    ) => {
      const before = latest.current;
      const next = normalizePlanState(recipe(before));
      if (next === before) return;
      latest.current = next;
      if (change === 'clear') {
        record([], null);
      } else if (change !== 'undo') {
        record([...history.current, { before, change }], { change, undone: false, canUndo: true });
      }
      if (by) {
        // The parks the untouched trip started with, so a first pick counts what it changed.
        const started = headlinersForTrip(headliners, before);
        for (const change of tripOptionChanges(before, next, started)) {
          trackTripEvent(slug, 'trip_option_changed', { ...change, by });
        }
      }
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
    },
    [slug, headliners, record]
  );
  const update = useCallback(
    (recipe: (state: TripPlanState) => TripPlanState) => apply(recipe, 'visitor', 'clear'),
    [apply]
  );
  const updateByParky = useCallback(
    (recipe: (state: TripPlanState) => TripPlanState) => apply(recipe, 'parky', 'clear'),
    [apply]
  );
  const edit = useCallback(
    (
      recipe: (state: TripPlanState) => TripPlanState,
      change: PlanEditChange,
      by: 'visitor' | 'parky' = 'visitor'
    ) => apply(recipe, by, change),
    [apply]
  );
  const undo = useCallback(() => {
    const entry = history.current.at(-1);
    if (!entry) return false;
    apply(() => entry.before, 'visitor', 'undo');
    const rest = history.current.slice(0, -1);
    record(rest, { change: entry.change, undone: true, canUndo: rest.length > 0 });
    trackTripEvent(slug, 'trip_undo', { what: entry.change.kind });
    return true;
  }, [apply, record, slug]);

  const editsNow = useRef(edits);
  useEffect(() => {
    editsNow.current = edits;
  }, [edits]);
  const clear = useCallback(() => {
    const kept = { state: latest.current, history: history.current, edits: editsNow.current };
    apply(() => readPlanQuery(new URLSearchParams(), keys), null, 'clear');
    return () => {
      apply(() => kept.state, null, 'clear');
      history.current = kept.history;
      setEdits(kept.edits);
    };
  }, [apply, keys]);

  // An untouched trip is planned with the headliners its days hold, so Parky is handed those parks
  // by name: without them his tools would plan all of the region's headliners.
  const published = useMemo(() => {
    if (state.parks && state.parks.length > 0) return state;
    const started = headlinersForTrip(headliners, state);
    return started === headliners
      ? state
      : { ...state, parks: started.map((slug) => ({ slug, visits: null })) };
  }, [state, headliners]);
  // Parky reads the plan on screen and changes it through `update`, as a press would; his changes
  // are counted as his.
  useEffect(
    () =>
      connectPlannerBridge(region.slug, state, published, updateByParky, keys, {
        edit,
        undo,
        clear,
      }),
    [region.slug, state, published, updateByParky, keys, edit, undo, clear]
  );
  // Only a query the planner did not write is news; the first one counts, since a link opened it.
  const reported = useRef<string | null>(null);
  const isOwn = own !== null && (search === own.written || search === own.base);
  useEffect(() => {
    if (isOwn || reported.current === search || known.current.has(search)) return;
    reported.current = search;
    record([], null);
    onExternal?.();
  }, [search, isOwn, onExternal, record]);

  return { state, update, keys, edit, undo, edits };
}

/**
 * What the result's status band says: the edit it is about (the last one made, or the one just
 * undone), and whether there is one to undo.
 */
export interface PlanEdits {
  change: PlanEditChange | null;
  /** `change` was just taken back. */
  undone: boolean;
  canUndo: boolean;
  /** Counts every edit and undo, so the same days glow again for the next one (`PlanDayGlow`). */
  seq: number;
}

/** No edit yet, or the history started afresh. */
export const NO_EDITS: PlanEdits = { change: null, undone: false, canUndo: false, seq: 0 };
