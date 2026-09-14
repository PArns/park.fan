/**
 * A typed event bus. One instance per thread; modules subscribe on it and emit on it. Core
 * forwards selected worker events to the main thread as `event` messages (see protocol.ts), so a
 * module never touches `postMessage` itself.
 */

export type Listener<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<never>>>();
  private anyListeners = new Set<(name: keyof Events, payload: unknown) => void>();

  on<K extends keyof Events>(name: K, fn: Listener<Events[K]>): () => void {
    let set = this.listeners.get(name);
    if (!set) {
      set = new Set();
      this.listeners.set(name, set);
    }
    set.add(fn as Listener<never>);
    return () => this.off(name, fn);
  }

  once<K extends keyof Events>(name: K, fn: Listener<Events[K]>): () => void {
    const off = this.on(name, (p) => {
      off();
      fn(p);
    });
    return off;
  }

  off<K extends keyof Events>(name: K, fn: Listener<Events[K]>): void {
    this.listeners.get(name)?.delete(fn as Listener<never>);
  }

  /** Observe every event (used by core to forward worker events). */
  onAny(fn: (name: keyof Events, payload: unknown) => void): () => void {
    this.anyListeners.add(fn);
    return () => this.anyListeners.delete(fn);
  }

  emit<K extends keyof Events>(name: K, payload: Events[K]): void {
    const set = this.listeners.get(name);
    if (set) {
      for (const fn of Array.from(set)) {
        try {
          (fn as Listener<Events[K]>)(payload);
        } catch (error) {
          // A listener may never take the bus down with it.
          console.error(`[game] listener for "${String(name)}" threw`, error);
        }
      }
    }
    for (const fn of this.anyListeners) fn(name, payload);
  }

  clear(): void {
    this.listeners.clear();
    this.anyListeners.clear();
  }
}
