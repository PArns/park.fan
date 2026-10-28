# A subscription lives in the leaf that shows it (REQUIREMENT)

**A context, a query or a store is read by the smallest component that draws what it answers.**
Every change to it re-renders the reader and everything the reader renders, so a read placed high in
the tree charges the whole subtree for a value one small part of it shows. A dialog behind a button
mounts on the first press and stays mounted, so its close animation still plays.

## The cases

- **Header.** `Header` read `useHomeNearbyParks()` for a 28 px "near <park>" pin. That hook reads
  the geolocation context, the after-load gate and a query, which change several times per page load
  and on every refetch, and each change re-rendered the whole bar: four nav menus, five mega-menu
  panels, two search commands and the toggles. The pin is `HeaderNearbyPark`
  (`components/layout/header-nearby-park.tsx`) now, and only it re-renders.
- **Ride alert bells.** Every `RideAlertBell` (one per attraction card, ~100 on a big park) read the
  park's ride list from `RideAlertParkProvider`, which changes on every live poll, and rebuilt an
  N-long list for a dialog that was not open: O(N²) per poll. Only the dialog child of a pressed bell
  reads it now (`RideAlertBellDialog`).
- **Dialogs behind a button.** `RideAlertBell` and `ShowFollowBell` mount their dialog on the first
  press (the show bell's dialog had a clock subscription and two local-store readers per bell, one
  bell per showtime row).
- **A hook called twice.** `ParkTodayPanel` rendered `ParkHolidayRow`, which ran `useTodaySchedule`
  again with the same inputs. The panel renders `ParkHolidayBand` with its own `sched.holiday`; the
  row keeps the hook for callers that have none.

## Check

Before reading a context or a query in a component, look at what the component renders; if the
value feeds one child, read it in that child. `react-scan` or the React profiler's "why did this
render" on the header, the park page and the planner should show re-renders only where something
visible changed.
