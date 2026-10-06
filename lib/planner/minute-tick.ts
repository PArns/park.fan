import { subscribeToMinuteClock } from '@/lib/hooks/use-minute-now';

/**
 * One minute counter for everything in the panel that watches the clock. A counter, not a time: it
 * only has to change each minute, and the clock is read in park time where needed
 * ({@link parkMinuteNow}). 0 on the server, so nothing clock-bound is in server markup. Shared, so
 * two readers do not install two timers.
 */

let minuteTick = 0;
let releaseClock: (() => void) | null = null;
const minuteListeners = new Set<() => void>();

/**
 * Driven by the app's shared minute clock (`useMinuteNow`) rather than an interval of its own, so
 * it pauses in a hidden tab, ticks once on return, and stays in phase with the rest of the page.
 */
export function subscribeToMinute(listener: () => void): () => void {
  minuteListeners.add(listener);
  if (minuteListeners.size === 1) {
    releaseClock = subscribeToMinuteClock(() => {
      minuteTick += 1;
      for (const l of minuteListeners) l();
    });
  }
  return () => {
    minuteListeners.delete(listener);
    if (minuteListeners.size === 0 && releaseClock !== null) {
      releaseClock();
      releaseClock = null;
    }
  };
}

/**
 * Snapshot for `useSyncExternalStore`: the planner's minute counter, which goes up by one each
 * minute while anyone subscribes.
 */
export function getMinuteTick(): number {
  return minuteTick;
}

/**
 * The subscription a reader takes when there is nothing to keep up to date. A hook cannot be called
 * conditionally, but the subscribe function can decline, so a date that is not today installs no
 * timer and re-renders nothing.
 */
export function subscribeToNothing(): () => void {
  return () => {};
}

/**
 * Snapshot that is always 0, paired with `subscribeToNothing` for a reader with no clock to watch,
 * and as the server snapshot.
 */
export function getZero(): number {
  return 0;
}
