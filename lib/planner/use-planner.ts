'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { plannerStore } from './store';
import {
  addCustomEntry,
  addShowEntry,
  type AddShowParams,
  addEntry,
  applyPlan as applyPlanAction,
  type ApplyPlanStop,
  clearDay as clearDayAction,
  learnTimezone as learnTimezoneAction,
  moveEntry,
  openDay as openDayAction,
  removeEntry,
  reserveDays as reserveDaysAction,
  restoreDay as restoreDayAction,
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
 * Count a day the first time something lands in it: the event fires only across empty to not empty,
 * one row per park and date, however the block got there. Reads `plannerStore.getSnapshot()`, since
 * these callbacks are stable and a rendered `state` would be stale when two adds land in one tick.
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
 * The planner's state and everything that changes it, through `useSyncExternalStore` (see
 * `store.ts`). No provider: the store is a module, so a ride card and the flyout talk without a
 * context around the tree.
 */
export function usePlanner() {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );

  /**
   * @param now The instant this add reckons from, for a caller that derives `params.date` from the
   *   clock too: both must come from one read or they can disagree across park-local midnight.
   */
  const addRide = useCallback((params: AddRideParams, now?: number) => {
    countFirstBlock(params.parkSlug, params.parkName, params.date);
    plannerStore.update((s) => addEntry(s, params, now ?? Date.now()));
  }, []);

  const addCustom = useCallback((params: AddCustomRideParams) => {
    countFirstBlock(params.parkSlug, params.parkName, params.date);
    plannerStore.update((s) => addCustomEntry(s, params));
  }, []);

  const addShow = useCallback((params: AddShowParams) => {
    countFirstBlock(params.parkSlug, params.parkName, params.date);
    plannerStore.update((s) => addShowEntry(s, params));
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

  /** The days accepted from the trip assistant, in one write. See `reserveDays`. */
  const reserveDays = useCallback(
    (
      days: readonly {
        park: { slug: string; name: string; geo: PlannerGeo; timezone?: string };
        date: string;
      }[]
    ) => {
      plannerStore.update((s) => reserveDaysAction(s, days));
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

  /**
   * A whole re-plan in one write, what the optimiser commits. It counts the day like an add does,
   * since empty to eight headliners in one press is a day being started.
   */
  const applyPlan = useCallback(
    (params: {
      parkSlug: string;
      parkName: string;
      geo: PlannerGeo;
      timezone?: string;
      date: string;
      stops: readonly ApplyPlanStop[];
    }) => {
      countFirstBlock(params.parkSlug, params.parkName, params.date);
      plannerStore.update((s) => applyPlanAction(s, params));
    },
    []
  );

  /** Put a day back as it was — what the optimiser's undo commits. */
  const restoreDay = useCallback(
    (parkSlug: string, date: string, entries: readonly PlannerEntry[]) => {
      plannerStore.update((s) => restoreDayAction(s, parkSlug, date, entries));
    },
    []
  );

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
    reserveDays,
    learnTimezone,
    addCustom,
    addShow,
    editCustom,
    setDayPrefs,
    clearDay,
    applyPlan,
    restoreDay,
  };
}

/**
 * How many times this ride is in that day's plan: a count, because riding something twice is a
 * plan, not a mistake.
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
