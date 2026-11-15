# Rides that start at set times

Every surface for a ride that runs as performances rather than continuously (a 4D cinema, a show
walk-through), and what it shows instead of a wait (PAR-1355). The API contract is
[`docs/frontend/performance-schedules.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/performance-schedules.md)
in the API repo.

## Why

Phantasialand's „Die 3 Mausketiere" plays at 13:00, 14:00, 15:00, 16:00 and 17:00 during
Wintertraum. The feed reports the cinema as an attraction without showtimes, reading CLOSED, so the
card said „Geschlossen" while a performance began every hour. No feed carries these times; an editor
curates them per run of days, and the API serves them as `performanceSchedules` on the park payload
and the attraction detail.

## The rule

One function decides, `performanceTimesShown` (`lib/utils/performance-schedule.ts`), so the card and
the ride page cannot disagree. It answers today's start times when all of these hold, else null:

- the park reads `OPERATING`;
- the ride reads `OPERATING`, `CLOSED` or `UNKNOWN`. A feed that does not know the programme reads
  CLOSED between two performances; DOWN keeps its outage line and REFURBISHMENT its works badge;
- no curated works window covers the park's day;
- a schedule covers the park's day (`performanceTimesOn`, both bounds inclusive, either open).

The park's day comes from the server render (`todayIso`) on the card and the panel, and from the
minute clock in the tile row. `nextPerformance` compares `HH:MM` strings against the park's wall
clock (`parkWallClock`): the next start is the first at or after the current minute, so one that
began a minute ago is gone.

## Surfaces

| Surface                            | With today's times                                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `AttractionCard`                   | `PerformanceBadge` („Feste Vorstellungen") instead of the status badge, no crowd badge, no opens-at note, the photo not dimmed                 |
| `AttractionCard` bottom panel      | `PerformanceCountdown` `block`: „Nächste Vorstellung", the next start, „in 23 Min.", every start of the day, past ones struck through          |
| `AttractionCard` phone row         | `PerformanceCountdown` `row`: the next start beside the name; nothing once the last has begun                                                  |
| `RideNowPanel` („Wartezeit jetzt") | The first cell: badge, the next start with its countdown, the day's starts; no lastUpdated or typical-hour line                                |
| `RideNavTiles`                     | „Wartezeiten heute" says „Nächste Vorstellung 13:00 Uhr", or „Heute keine Vorstellung mehr"                                                    |
| `RideLiveHeader`                   | No wait in the tab title                                                                                                                       |
| Best times to visit                | None on a day a schedule covers (`startsAtSetTimesOn`, PAR-1358): no „Beste Zeiten heute" column, plan-tile hint, day-chart marks or card line |

The ride page ships `performanceSchedules` and `worksPeriods` in its shell (`RIDE_SHELL_FIELDS`),
absent on nearly every ride. The countdown is a Client Component on the shared minute tick
(`useMinuteNow`) and renders a skeleton of its figure until it has a reading.

Not covered yet: the favorites list and other cross-park listings pass no park day, so a curated ride
there reads as its live status says. The planner and Parky do not read the field.

## Curation

Admin, group „Vorstellungen": rows of a season of the park or „ab" and „bis", and the start times
in one comma-separated input
([admin](../features/admin.md)). Or the MCP `curate_attraction` tool with
`curatedPerformanceSchedules: [{ from, to, times }]`.

`pnpm test:performance-schedule` pins the day a schedule covers, the gate, the next start, the time
format and the editor's checks.
