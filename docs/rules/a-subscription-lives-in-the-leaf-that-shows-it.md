# A subscription lives in the leaf that shows it (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**A context, a query or a store is read by the smallest component that draws what it answers.**
Every change to it re-renders the reader and everything the reader renders, so a read placed high
in the tree charges the whole subtree for a value one small part of it shows.

## The cases

- **Header.** `Header` read `useHomeNearbyParks()` for a 28 px "near <park>" pin. That hook reads
  the geolocation context, the after-load gate and a query, which change several times per page
  load and again on every refetch, and each change re-rendered the whole bar: four nav menus, five
  mega-menu panels, two search commands and the toggles. The pin is its own component now
  (`components/layout/header-nearby-park.tsx`) and is the only thing that re-renders.
- **Ride alert bells.** Every `RideAlertBell` (one per attraction card, ~100 on a big park) read the
  park's ride list from `RideAlertParkProvider`, which changes on every live poll, and rebuilt an
  N-long list for a dialog that was not open: O(N²) per poll, through the cards' `memo`. Only the
  dialog child of a pressed bell reads it now (`RideAlertBellDialog`).
- **Dialogs behind a button.** A dialog that is closed on almost every page view is mounted on the
  first press and kept, so its close animation still plays: `RideAlertBell` did this, and
  `ShowFollowBell` now does too (its dialog had a clock subscription and two local-store readers
  per bell, one bell per showtime row).
- **Hooks called twice.** `ParkTodayPanel` rendered `ParkHolidayRow`, which ran `useTodaySchedule`
  a second time with the same inputs. The band is `ParkHolidayBand` now and takes the panel's
  `sched.holiday`; the row keeps the hook for callers that have none.

## How to check

Before reading a context or a query in a component, look at what the component renders. If the
value feeds one child, read it in that child. `react-scan` or the React profiler's "why did this
render" on the header, the park page and the planner should show re-renders only where something
visible changed.
