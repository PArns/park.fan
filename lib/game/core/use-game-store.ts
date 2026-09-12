'use client';

import { useSyncExternalStore } from 'react';
import type { GameStore, GameState } from './store';

/** Subscribe a component to a slice of the game store. */
export function useGameStore<T>(store: GameStore, select: (s: GameState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(store.get())
  );
}
