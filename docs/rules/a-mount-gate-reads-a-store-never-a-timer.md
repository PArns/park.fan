# A mount gate reads a store, never a timer (REQUIREMENT)

**A value that must be absent on the server and during hydration, and present afterwards, is read
through `useSyncExternalStore`, never set from an effect.** Never
`useEffect(() => setTimeout(() => setX(…), 0))`, and never a private `setInterval` clock. The hooks
exist:

| Need                                 | Use                                                     | File                          |
| ------------------------------------ | ------------------------------------------------------- | ----------------------------- |
| "are we past hydration"              | `useMounted()`                                          | `lib/hooks/use-mounted.ts`    |
| the browser's timezone               | `useBrowserTimezone()`                                  | `lib/hooks/use-mounted.ts`    |
| the clock once, at mount             | `useBrowserNow(enabled?)`                               | `lib/hooks/use-mounted.ts`    |
| a clock that follows the minute      | `useMinuteNow(enabled?)` / `useMinuteNowDate(enabled?)` | `lib/hooks/use-minute-now.ts` |
| a countdown that follows the second  | `useSecondNow(enabled?)`                                | `lib/hooks/use-second-now.ts` |
| "the page has loaded and gone idle"  | `useAfterLoad()`                                        | `lib/hooks/use-after-load.ts` |
| a planner counter that ticks with it | `subscribeToMinute` / `getMinuteTick`                   | `lib/planner/minute-tick.ts`  |

- **Clocks are shared and they stop.** `useMinuteNow` is one interval for every subscriber, paused
  while `document.hidden`. A reader that needs the clock only while something is open passes
  `enabled` (`useMinuteNowDate(open)`) and takes no subscription. A second clock subscribes to the
  first (`subscribeToMinuteClock`) instead of ticking out of phase with it.
- **A page-wide fact is one store, not one per caller** (`useAfterLoad`).
- **A subscription ends when its answer stops mattering.** `useLoadLast` subscribes to the query
  cache only until it releases; before, its hosts on a park page re-rendered twice on every poll.
- **A server value that already answers the question needs no browser reading.** `ParkFAQSection`
  passes `useBrowserNow(seedNowMs == null)`, so a per-request `seedNowMs` keeps the server snapshot.
- **A clock that only matters on screen** takes `enabled` from `useActiveOnScreen` (the weather
  chart, the nowcast countdown, `MLTrainingCountdown`, `FlipClock`).

## Why

The timer shape costs a **paint** on **every mount**, not only at hydration: the browser paints the
fallback, then the timeout fires and a second commit paints the value. A client-side navigation to a
park page flashed every gated section's skeleton for a frame, and a gate nested in another paid it
once per level: `DailyWaitTimeChartClient` under `LiveAttractionData` rendered `null` for one frame,
a 269 px jump on the ride page (0.129 CLS).

`useSyncExternalStore` reads `getServerSnapshot` on the server and while hydrating, so the first
client render matches the server markup, then re-renders every consumer in one batch. A component
mounted after hydration reads the client snapshot on its first render. `useBrowserNow` takes its
reading in a render-phase update, which React re-runs before committing, so there is no second
paint. Seven components had run a private minute interval each, none paused in a hidden tab.

## The exception

`startTransition(() => setIsMounted(true))` in an effect is deliberate where the point is to keep a
large flip off the hydration path (`lib/hooks/use-tab-hash-routing.ts`). `useSyncExternalStore`
re-renders a store whose snapshots differ at sync priority, so `useMounted()` there would make the
flip a render a tap during hydration has to wait for. A flip as small as a switch's knob takes
`useMounted()`.

## Check

`grep -rn "setTimeout(() => set" components lib app` and `grep -rn "setInterval(" components lib`
find nothing new. A new client-only value gets a store or goes into one of the hooks above.
