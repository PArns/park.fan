/**
 * The event bus.
 *
 * Presentation-facing only. Nothing in the simulation reacts to an event, because event ordering
 * across a worker boundary is not something determinism can rest on — the sim's one input is the
 * command queue, applied at a tick boundary in a declared order.
 *
 * Listeners are stored in insertion order and iterated over a copy, so a handler may unsubscribe
 * itself or subscribe another without the iteration skipping an entry.
 */

import type { EntityId } from './ids';
import type { ModuleId } from './module';

export interface GameEventMap {
  /** The engine, the world and every module are up — including any that degraded to a stub. */
  'world:ready': { moduleCount: number; stubbed: readonly ModuleId[]; bootMs: number };
  'world:disposed': Record<string, never>;
  /** A simulation snapshot landed on the main thread. */
  snapshot: { tick: number; guestCount: number };
  /** A module's setup threw and it is running as a stub. */
  'module:failed': { id: ModuleId; error: string };
  /** An asset could not be fetched and its consumer fell back to procedural geometry. */
  'asset:fallback': { url: string; reason: string };

  'env:timeOfDay': { hour: number; phase: 'dawn' | 'day' | 'golden' | 'dusk' | 'night' };
  'env:weather': { kind: string; intensity: number };

  'terrain:changed': { minX: number; minZ: number; maxX: number; maxZ: number };
  'paths:changed': Record<string, never>;
  'track:changed': { rideId: EntityId };
  'build:committed': { what: string; id: EntityId };
  'build:rejected': { what: string; reason: string };

  'ui:tool': { tool: string | null };
  'ui:panel': { panel: string | null };
  'ui:notify': { level: 'info' | 'warn' | 'error'; title: string; body?: string };

  'sim:speed': { speed: number };
  'sim:day': { day: number };

  'audio:unlocked': Record<string, never>;
  'quality:changed': { preset: string };
  /** Anything a builder wants without widening this map first. Carries its own tag. */
  custom: { tag: string; payload: unknown };
}

export type GameEventName = keyof GameEventMap;
export type GameEventHandler<K extends GameEventName> = (payload: GameEventMap[K]) => void;

export interface EventBus {
  on<K extends GameEventName>(event: K, handler: GameEventHandler<K>): () => void;
  once<K extends GameEventName>(event: K, handler: GameEventHandler<K>): () => void;
  off<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void;
  emit<K extends GameEventName>(event: K, payload: GameEventMap[K]): void;
  /** Every event, for the harness and the debug overlay. Returns an unsubscribe. */
  any(handler: (event: GameEventName, payload: unknown) => void): () => void;
  clear(): void;
}

export function createEventBus(onHandlerError?: (event: string, error: unknown) => void): EventBus {
  const handlers = new Map<GameEventName, Array<(payload: never) => void>>();
  const wildcards: Array<(event: GameEventName, payload: unknown) => void> = [];

  const off: EventBus['off'] = (event, handler) => {
    const list = handlers.get(event);
    if (!list) return;
    const index = list.indexOf(handler as (payload: never) => void);
    if (index >= 0) list.splice(index, 1);
    if (list.length === 0) handlers.delete(event);
  };

  return {
    on(event, handler) {
      const list = handlers.get(event) ?? [];
      list.push(handler as (payload: never) => void);
      handlers.set(event, list);
      return () => off(event, handler);
    },
    once(event, handler) {
      const wrapped = ((payload: GameEventMap[typeof event]) => {
        off(event, wrapped);
        handler(payload);
      }) as GameEventHandler<typeof event>;
      return this.on(event, wrapped);
    },
    off,
    emit(event, payload) {
      const list = handlers.get(event);
      if (list) {
        // Copy: a handler is allowed to unsubscribe itself or add another mid-emit.
        for (const handler of list.slice()) {
          try {
            (handler as (p: unknown) => void)(payload);
          } catch (error) {
            // One bad listener must not stop the others, and must not take the frame down.
            onHandlerError?.(event, error);
          }
        }
      }
      for (const handler of wildcards.slice()) {
        try {
          handler(event, payload);
        } catch (error) {
          onHandlerError?.(event, error);
        }
      }
    },
    any(handler) {
      wildcards.push(handler);
      return () => {
        const index = wildcards.indexOf(handler);
        if (index >= 0) wildcards.splice(index, 1);
      };
    },
    clear() {
      handlers.clear();
      wildcards.length = 0;
    },
  };
}
