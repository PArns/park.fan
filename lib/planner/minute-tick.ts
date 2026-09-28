import { subscribeToMinuteClock } from '@/lib/hooks/use-minute-now';

/**
 * One minute counter for everything in the panel that watches the clock.
 *
 * A counter, not a time: the value only has to CHANGE each minute, and the
 * actual clock is read in park time where it is needed ({@link parkMinuteNow}).
 * On the server it is 0, so a now line and a "next show" are never in server
 * markup for a client to disagree with.
 *
 * Shared rather than per-component because two readers on one screen — the
 * grid's now line and the show band's next showtime — would otherwise install
 * two timers that fire a second apart and re-render the panel twice a minute.
 * The same reason ties it to the app's minute clock below.
 */

let minuteTick = 0;
let releaseClock: (() => void) | null = null;
const minuteListeners = new Set<() => void>();

/**
 * Driven by the app's shared minute clock (`useMinuteNow`) rather than an interval of its own.
 * Its own interval ran in hidden tabs — the in-park list on a pocketed phone, the planner's
 * optimiser in a background window — and out of phase with the shared clock, so a park page with
 * the panel open repainted twice a minute. The shared clock pauses while the tab is hidden and
 * ticks once on return, which also moves the counter.
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

export function getMinuteTick(): number {
  return minuteTick;
}

/**
 * The subscription a reader takes when there is nothing to keep up to date.
 *
 * A hook cannot be called conditionally, but the SUBSCRIBE function can decline
 * to subscribe — and it must, because the tick used to be installed
 * unconditionally: on any date that is not today, which is nearly every date
 * somebody plans, the panel ran a 60-second interval and re-rendered the whole
 * grid once a minute for a line it never draws. The layout memo was safe (its
 * `nowMinute` dependency stays `null`), but every block, leg and show pill
 * re-rendered anyway, forever, while the panel was open.
 */
export function subscribeToNothing(): () => void {
  return () => {};
}

export function getZero(): number {
  return 0;
}
