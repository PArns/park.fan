# A mount gate reads a store, never a timer (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**A value that must be absent on the server and during hydration, and present afterwards, is read
through `useSyncExternalStore`, never set from an effect.** The hooks for it exist:

| Need                                 | Use                                                     | File                          |
| ------------------------------------ | ------------------------------------------------------- | ----------------------------- |
| "are we past hydration"              | `useMounted()`                                          | `lib/hooks/use-mounted.ts`    |
| the browser's timezone               | `useBrowserTimezone()`                                  | `lib/hooks/use-mounted.ts`    |
| the clock once, at mount             | `useBrowserNow(enabled?)`                               | `lib/hooks/use-mounted.ts`    |
| a clock that follows the minute      | `useMinuteNow(enabled?)` / `useMinuteNowDate(enabled?)` | `lib/hooks/use-minute-now.ts` |
| "the page has loaded and gone idle"  | `useAfterLoad()`                                        | `lib/hooks/use-after-load.ts` |
| a planner counter that ticks with it | `subscribeToMinute` / `getMinuteTick`                   | `lib/planner/minute-tick.ts`  |

## Why not `useEffect(() => setTimeout(() => setX(...), 0))`

That shape was in all three hooks of `use-mounted.ts` until 2026-09-28, chosen to get past the
`react-hooks/set-state-in-effect` lint rule. It costs a **paint**, not only a render: the browser
paints the fallback (a skeleton, `null`, "--:--"), then the timeout fires and a second commit paints
the value. And it costs it on **every mount**, not only at hydration:

- A client-side navigation to a park page flashed every gated section's skeleton for a frame.
- A gate nested in another gate paid it once per level. `DailyWaitTimeChartClient` under
  `LiveAttractionData` rendered `null` for one frame between the two, a 269 px jump of the Fancast
  link on the ride page (0.129 of a 0.126 CLS), which `DailyWaitTimeChartPlaceholder` exists to
  cover.

`useSyncExternalStore` reads `getServerSnapshot` on the server and while hydrating, so the first
client render still matches the server markup, then re-renders every consumer in one batch. A
component mounted after hydration reads the client snapshot on its **first** render and renders
once. `useBrowserNow` takes its reading in a render-phase update (`if (mounted && now === null)
setNow(...)`), which React re-runs before committing — no second paint.

## Clocks and gates are shared, and they stop

- **No private `setInterval` for a minute tick.** Seven components ran one each (30 s or 60 s,
  none paused in a hidden tab): ride now panel, entry tiles, ride nav tiles, today panel, calendar
  day dialog, and one per show-follow bell. `useMinuteNow` is one interval for every subscriber,
  paused while `document.hidden`, re-stamped on return. A reader that needs the clock only while
  something is open passes `enabled` (`useMinuteNowDate(open)`), which takes no subscription.
- **A second clock ticks with the first.** The planner's counter had its own interval, out of phase
  with `useMinuteNow`: a park page with the panel open repainted twice a minute, and in a
  background tab. It now subscribes to the same clock (`subscribeToMinuteClock`).
- **A page-wide fact is one store, not one per caller.** `useAfterLoad` owned a `load` listener, an
  idle callback and a `useState` per call: three on every page, about twelve on the homepage, each
  flip its own commit, and a component mounted after a navigation waited for another idle period.
- **A subscription ends when its answer stops mattering.** `useLoadLast` read `useIsFetching`,
  which stays subscribed for the life of the page: its five hosts on a park page re-rendered twice
  on every live poll, long after the gate had released. It now subscribes only until release.
- **A server value that already answers the question needs no browser reading.** `ParkFAQSection`
  has a per-request `seedNowMs`; reading the browser clock as well re-rendered the whole FAQ to
  the same text. `useBrowserNow(false)` keeps the server snapshot and does not re-render.

## What is still fine

`startTransition(() => setMounted(true))` in an effect, where the point is to keep a large flip off
the hydration path (`use-tab-hash-routing.ts`, `theme-toggle.tsx`), is deliberate and documented at
the call site. A `setTimeout(…, 0)` that re-syncs a clock when a component becomes visible again
(`weather-hourly-chart.tsx`, `nowcast-update-countdown.tsx`) runs once per visibility change, not
once per mount.

## How to check

`grep -rn "setTimeout(() => set" components lib app` and `grep -rn "setInterval(" components lib`
should find nothing new. A new client-only value gets a store, or goes into one of the hooks above.
