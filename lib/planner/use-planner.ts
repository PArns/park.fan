'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { plannerStore } from './store';
import {
  addCustomEntry,
  addEntry,
  clearDay as clearDayAction,
  learnTimezone as learnTimezoneAction,
  moveEntry,
  openDay as openDayAction,
  removeEntry,
  setActive as setActiveAction,
  setCustomBlock,
  setDayPrefs as setDayPrefsAction,
  setEntryDone,
  shiftFrom as shiftFromAction,
} from './actions';
import {
  countAll,
  entriesFor,
  type PlannerBlockIcon,
  type PlannerCustomBlock,
  type PlannerDayPrefs,
  type PlannerEntry,
  type PlannerGeo,
} from './types';
import { trackPlanDayStarted } from '@/lib/analytics/umami';

/**
 * Count a day the first time something lands in it.
 *
 * The interesting moment is the TRANSITION, not the write: a day that already
 * holds three rides and gains a fourth is somebody filling one in, and billing
 * that would put a row in Umami for every lap of every plan. So the store is
 * read BEFORE the update and the event fires only across empty → not empty,
 * which makes it exactly one row per park and date however the block got there
 * — dragged off a park page, added from the panel's list, or a free block
 * somebody wrote themselves.
 *
 * `plannerStore.getSnapshot()` rather than the `state` this hook renders with:
 * these callbacks are `useCallback`-stable on purpose, and closing over the
 * rendered state would make them stale exactly when two adds land in one tick.
 */
function countFirstBlock(parkSlug: string, parkName: string, date: string): void {
  const before = plannerStore.getSnapshot().parks[parkSlug]?.days[date]?.entries.length ?? 0;
  if (before === 0) trackPlanDayStarted(parkName);
}

interface AddRideParams {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  attractionSlug: string;
  attractionName: string;
  /** The park's IANA zone, so the plan can answer "what day is it there?". */
  timezone?: string;
  /** Park-local minutes since midnight. Omitted means "after the last entry". */
  startMinute?: number;
}

/** A block the visitor writes themselves — a break, a show, a meeting point. */
interface AddCustomRideParams {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  timezone?: string;
  label: string;
  icon: PlannerBlockIcon;
  /** Omitted means the default hour. */
  durationMinutes?: number;
  startMinute?: number;
}

/**
 * The planner's state and everything that changes it.
 *
 * Reads through `useSyncExternalStore`, so every consumer sees the same object
 * and the server snapshot is an empty plan — see `store.ts` for why that has to
 * be a store rather than provider state.
 *
 * No provider is needed at all, which is the point: the store is a module, so a
 * ride card deep in a park page and the flyout in the layout talk to each other
 * without a context wrapping the whole tree. One less client boundary in the
 * layout, and nothing to serialize into the RSC payload of every page.
 */
export function usePlanner() {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );

  const addRide = useCallback((params: AddRideParams) => {
    countFirstBlock(params.parkSlug, params.parkName, params.date);
    plannerStore.update((s) => addEntry(s, params));
  }, []);

  const addCustom = useCallback((params: AddCustomRideParams) => {
    countFirstBlock(params.parkSlug, params.parkName, params.date);
    plannerStore.update((s) => addCustomEntry(s, params));
  }, []);

  const editCustom = useCallback(
    (parkSlug: string, date: string, entryId: string, patch: Partial<PlannerCustomBlock>) => {
      plannerStore.update((s) => setCustomBlock(s, parkSlug, date, entryId, patch));
    },
    []
  );

  const removeRide = useCallback((parkSlug: string, date: string, entryId: string) => {
    plannerStore.update((s) => removeEntry(s, parkSlug, date, entryId));
  }, []);

  const moveRide = useCallback(
    (parkSlug: string, date: string, entryId: string, startMinute: number) => {
      plannerStore.update((s) => moveEntry(s, parkSlug, date, entryId, startMinute));
    },
    []
  );

  const shiftFrom = useCallback(
    (parkSlug: string, date: string, entryId: string, deltaMinutes: number) => {
      plannerStore.update((s) => shiftFromAction(s, parkSlug, date, entryId, deltaMinutes));
    },
    []
  );

  const setDone = useCallback(
    (parkSlug: string, date: string, entryId: string, done: boolean, actualWait?: number) => {
      plannerStore.update((s) => setEntryDone(s, parkSlug, date, entryId, done, actualWait));
    },
    []
  );

  const setActive = useCallback((parkSlug: string | null, date: string | null) => {
    plannerStore.update((s) => setActiveAction(s, parkSlug, date));
  }, []);

  const openDay = useCallback(
    (park: { slug: string; name: string; geo: PlannerGeo; timezone?: string }, date: string) => {
      plannerStore.update((s) => openDayAction(s, park, date));
    },
    []
  );

  /**
   * Teach the plan a park's zone once the day payload names it — see
   * `learnTimezone`. A no-op when the plan already has it.
   */
  const learnTimezone = useCallback((parkSlug: string, timezone: string) => {
    plannerStore.update((s) => learnTimezoneAction(s, parkSlug, timezone));
  }, []);

  /** Who is coming, for one day. Merged — see `setDayPrefs`. */
  const setDayPrefs = useCallback((parkSlug: string, date: string, patch: PlannerDayPrefs) => {
    plannerStore.update((s) => setDayPrefsAction(s, parkSlug, date, patch));
  }, []);

  const clearDay = useCallback((parkSlug: string, date: string) => {
    plannerStore.update((s) => clearDayAction(s, parkSlug, date));
  }, []);

  const activeEntries: PlannerEntry[] = useMemo(
    () => entriesFor(state, state.activeParkSlug, state.activeDate),
    [state]
  );

  const total = useMemo(() => countAll(state), [state]);

  return {
    state,
    activeParkSlug: state.activeParkSlug,
    activeDate: state.activeDate,
    activeEntries,
    total,
    addRide,
    removeRide,
    moveRide,
    shiftFrom,
    setDone,
    setActive,
    openDay,
    learnTimezone,
    addCustom,
    editCustom,
    setDayPrefs,
    clearDay,
  };
}

/**
 * Whether one ride is already in a given day's plan — for the "add" control on a
 * ride card, which shows a different state once the ride is in.
 */
export function useIsPlanned(parkSlug: string, date: string | null, attractionSlug: string) {
  return usePlannedCount(parkSlug, date, attractionSlug) > 0;
}

/**
 * How many times this ride is in that day's plan.
 *
 * A count rather than a flag, because riding something twice is a plan and not a
 * mistake — a morning lap on a walk-on and an evening one for the lights. The
 * store has always allowed it (`makeId` counts collisions up), and only the two
 * controls said otherwise: the ride page DISABLED itself once a ride was in, and
 * the search greyed the row, which reads as "no" to everybody.
 */
export function usePlannedCount(parkSlug: string, date: string | null, attractionSlug: string) {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );
  if (!date) return 0;
  return entriesFor(state, parkSlug, date).filter((e) => e.attractionSlug === attractionSlug)
    .length;
}
