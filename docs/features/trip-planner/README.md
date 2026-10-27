# Trip planner

A visitor's own plan for one day at one park: which rides, in which order, at which minute, laid
out on a timeline against the park's wait-time forecast. Start here for the file map, the storage
model and how the frontend reads `/plan/day`; each subject has its own page below.

## The parts

| Page                                        | Covers                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| [Wizard](wizard.md)                         | The four-step way in, its frame, the day card, the „<Park> jetzt planen" CTA      |
| [Panel](panel.md)                           | Ways in (edge tab, header button), the past-day question, page inset, photo layer |
| [Two-day view](two-day-view.md)             | Two day columns side by side in a wide panel                                      |
| [Day grid](day-grid.md)                     | Axis vs canvas, opening and closing edges, early entry, lanes, block photos       |
| [Wait figures](wait-figures.md)             | Where a block's number comes from: quarter-hour slots, tiers, accuracy, no source |
| [Showtimes](showtimes.md)                   | Scheduled vs projected shows, show entries, the show switch, show labels          |
| [Drag and drop](drag-and-drop.md)           | Drag payload, the one drag chip, refused drops, empty-day guidance                |
| [Leg chip](leg-chip.md)                     | The chip between two blocks: verdict ladder, placement, the 5-minute ride         |
| [Optimizer](optimizer.md)                   | „Tag optimieren" / „Alle Headliner": objective, search, refusals, clock, undo     |
| [Phone](phone.md)                           | The phone scale, 44 px targets, gestures, landscape row, the bottom sheet         |
| [Push notifications](push-notifications.md) | The push switch, topics, the armed record, trip sync                              |
| [The planner page](planner-page.md)         | `/trip-planner`: the article and demos, „Parks auf Tage verteilen", shared plans  |
| [Checks](checks.md)                         | Unit tests and what `pnpm check:planner` covers                                   |

Standing rules that govern it: [the planner's day ends when the park closes](../../rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md)
and [a day that does not fit opens an assistant](../../rules/a-day-that-does-not-fit-opens-an-assistant-not-a-footnote.md).

## Where it lives

| Piece                                  | File                                                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Its own page                           | `app/[locale]/trip-planner/page.tsx`, body `components/planner/planner-page-body.tsx`           |
| Localized URL segments                 | `lib/planner/segments.ts` (`PLANNER_SEGMENTS`)                                                  |
| Store (localStorage only)              | `lib/planner/store.ts` (`parkfan_planner`), operations in `lib/planner/actions.ts`              |
| Plan shape                             | `lib/planner/types.ts`                                                                          |
| Day geometry (minutes → pixels)        | `lib/planner/day-grid.ts`, `lib/planner/bar-geometry.ts`                                        |
| Park-local time                        | `lib/planner/park-time.ts`                                                                      |
| The wizard                             | `components/planner/planner-wizard.tsx`                                                         |
| The panel (side sheet / bottom sheet)  | `components/planner/planner-flyout.tsx`, one day column `planner-day-column.tsx`                |
| The day grid                           | `components/planner/planner-day-grid.tsx`, `planner-block.tsx`                                  |
| The optimizer and the fit assistant    | `lib/planner/optimize.ts`, `lib/planner/fit.ts`, `components/planner/planner-fit-assistant.tsx` |
| The page's article, fixtures and demos | `app/[locale]/trip-planner/content/<locale>.tsx`, `_fixtures.ts`, `_demos.tsx`                  |

## Storage

The plan lives in the visitor's browser; there is no account. `plannerStore` is an external store
over localStorage alone (a multi-park plan would be a few KB on every request as a cookie), read
through `useSyncExternalStore`, so the server snapshot is empty and the plan arrives in the
re-render after hydration. A copy goes to the server only while push is on
([push notifications](push-notifications.md)): `syncTrip` (`lib/planner/trip-sync.ts`) sends
`plannerStore.getSnapshot()` whole, so a field added to `PlannerState` is uploaded unasked.

Per-browser preferences therefore stay **outside** `PlannerState`, each in its own small external
store over localStorage: panel width (`panel-width.ts`), the second column (`second-column.ts`),
the show switch (`shows-visible.ts`), the drag coach (`drag-coach.ts`), push topics
(`push-topics.ts`). Cross-component signals that are not state go through module stores:
`ui-store.ts` (an "open the planner" request with its source), `page-park.ts` (the park the page
behind the panel is about, published by `PlannerPageParkBeacon`) and `page-day.ts` (a date a page
just offered to plan, read once).

`isPlannedDay()` (entries, or `reserved` from the [day assignment](planner-page.md#which-park-on-which-day))
is what the lists, the countdown, the share link and the sync count; an empty day left by
`openDay` stays invisible.

## Everything is park-local

A plan's date and every entry's `startMinute` are in the **park's** zone. The reader's offset never
enters the planner: `todayInZone` is the only door to the reader's zone, used only while the park's
zone is not known yet, and named so that use is visible. A clock time shown without a known zone is
the one mistake this feature may not make.

## How the frontend reads `/plan/day`

The forecast a plan is laid out against is the backend's `/plan/day`; its contract (tiers, slots,
hours, shows, accuracy, ride fields) is owned by the
[API's `/plan/day` docs](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/plan-day/README.md).
On this side:

- `getPlanDay` (`lib/api/plan.ts`) is called only by the proxy branch in
  `app/api/parks/[...path]/route.ts`, which resolves the park's photo out of the media database
  (the planner is a Client Component and may not import `@/lib/media`), caches 15 minutes at the CDN
  and answers a failure with a 502, never a 404.
- `usePlanDay` (`lib/hooks/use-plan-day.ts`) reads it: 404 resolves to `null` ("no plan for that
  park and day"), a 502 retries. Not behind `useLoadLast`: it is the whole content of a panel the
  visitor opened on purpose.
- A `null` day makes the panel **say** there is no forecast and draw neither bars nor a skeleton:
  an empty bar beside an em dash reads as a wait of zero, a skeleton that never resolves as loading.
- The wizard, the month calendar and the day card read the best-days snapshot instead
  (`parkBestDaysQueryOptions`, the park page's key).

After moving a planner component across the client boundary or adding a namespace to one, re-run
`pnpm generate:route-namespaces` and `pnpm generate:message-chunks`: a stale lazy chunk renders raw
keys behind a green build.
