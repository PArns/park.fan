import { useState, useSyncExternalStore } from 'react';

/*
 * Hydration-safe client values, all read through `useSyncExternalStore` rather than
 * `useState` + a deferred `setState` in an effect.
 *
 * The deferred shape these hooks used to have (`setTimeout(() => setX(...), 0)` inside a
 * `useEffect`) cost a paint every time a consumer mounted, not only at hydration: the browser
 * painted the server-equivalent fallback (a skeleton, `null`, "--:--"), then the timeout fired
 * and a second commit painted the real value. On a client-side navigation to a park page that
 * was a skeleton flash and a second render in every gated section, and a gate nested inside
 * another gate (the daily chart inside the park stats) paid it once per level.
 *
 * `useSyncExternalStore` reads `getServerSnapshot` on the server and while hydrating, so the
 * first client render still matches the server markup, and React re-renders with the client
 * snapshot straight after hydration, in one batch for every consumer. A component mounted after
 * hydration reads the client snapshot on its first render and renders once.
 */

const subscribeToNothing = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** True on the client, false on the server and during hydration. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribeToNothing, clientSnapshot, serverSnapshot);
}

let browserTimezone: string | null = null;
const timezoneSnapshot = () =>
  (browserTimezone ??= Intl.DateTimeFormat().resolvedOptions().timeZone);
const noTimezone = () => null;

/** The browser's IANA timezone, or null on the server and during hydration. */
export function useBrowserTimezone(): string | null {
  return useSyncExternalStore(subscribeToNothing, timezoneSnapshot, noTimezone);
}

/**
 * The browser's clock at mount, or null on the server and during hydration. A one-shot value:
 * it never updates. For a clock that follows the minute use `useMinuteNowDate()`
 * (`lib/hooks/use-minute-now.ts`), one shared, visibility-paused timer for every subscriber.
 *
 * The reading is taken in the first render that has `mounted`, through a render-phase update
 * (React re-runs the component before committing, so there is no second paint), not in an
 * effect that paints `null` first.
 *
 * `enabled: false` takes no reading and returns `null` — for a caller that already has a clock
 * value from the server and would only re-render to arrive at the same text.
 */
export function useBrowserNow(enabled = true): Date | null {
  // Disabled, the client snapshot is the server's, so hydration has nothing to catch up on and
  // the caller does not re-render at all.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    enabled ? clientSnapshot : serverSnapshot,
    serverSnapshot
  );
  const [now, setNow] = useState<Date | null>(null);
  if (enabled && mounted && now === null) setNow(new Date());
  return enabled ? now : null;
}
