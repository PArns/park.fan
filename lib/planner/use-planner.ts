'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { plannerStore } from './store';
import {
  addEntry,
  clearDay as clearDayAction,
  moveEntry,
  removeEntry,
  reorderEntry,
  setActive as setActiveAction,
  setEntryDone,
} from './actions';
import { countAll, entriesFor, type PlannerEntry, type PlannerGeo } from './types';

interface AddRideParams {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  attractionSlug: string;
  attractionName: string;
  hour?: number;
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
    plannerStore.update((s) => addEntry(s, params));
  }, []);

  const removeRide = useCallback((parkSlug: string, date: string, entryId: string) => {
    plannerStore.update((s) => removeEntry(s, parkSlug, date, entryId));
  }, []);

  const moveRide = useCallback((parkSlug: string, date: string, entryId: string, hour: number) => {
    plannerStore.update((s) => moveEntry(s, parkSlug, date, entryId, hour));
  }, []);

  const reorderRide = useCallback(
    (parkSlug: string, date: string, entryId: string, toIndex: number) => {
      plannerStore.update((s) => reorderEntry(s, parkSlug, date, entryId, toIndex));
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
    reorderRide,
    setDone,
    setActive,
    clearDay,
  };
}

/**
 * Whether one ride is already in a given day's plan — for the "add" control on a
 * ride card, which shows a different state once the ride is in.
 */
export function useIsPlanned(parkSlug: string, date: string | null, attractionSlug: string) {
  const state = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );
  if (!date) return false;
  return entriesFor(state, parkSlug, date).some((e) => e.attractionSlug === attractionSlug);
}
