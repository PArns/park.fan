# Rides that cannot open today: every surface

Where the frontend reads a ride's or show's season and what each surface does with an
out-of-season one. Open it when a new surface lists, counts or badges rides. The rule is
[a ride out of season is closed](../rules/a-ride-out-of-season-is-closed-and-is-not-one-of-the-parks.md);
the fields, the API's status fallback and the four sources of the "12 von 45 geöffnet"
counter (with their SQL twin) are the backend's
[seasonality contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/seasonality.md).

Every check goes through **`isInSeason`** (`lib/utils/season.ts`,
`isCurrentlyInSeason !== false`). The counter itself comes from the API already
filtered; the frontend never recounts it.

| Surface                                                | What an out-of-season ride or show does                                                                                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Park card grid (`useAttractionFilter`)                 | hidden behind the "{count} außer Saison" toggle (`offSeasonCount`), rides and shows alike — see [attraction filter panel](../features/attraction-filter-panel.md) |
| Crawled markup                                         | the same grid: there is no separate pre-mount overview, so the rule holds on both sides of hydration                                                              |
| Seasonal badge (`components/parks/seasonal-badge.tsx`) | "Winter" in season, "Nur im Winter" / "Nur im Sommer" out of it; a ride bound to a park season reads the season instead (below)                                   |
| Park entry tiles, `ParkTodayPanel`                     | left out of the headliner rows, the ride tile and the day's show count                                                                                            |
| Live poll (`lib/api/park-live-projection.ts`)          | `isSeasonal` and `isCurrentlyInSeason` travel with `effectiveStatus`, so the client can apply `isInSeason` after each poll                                        |
| Favourites menu (`favorites-menu-panel.tsx`)           | reads `effectiveStatus`, never the raw `status`, which does not know about the season                                                                             |
| Nearby in-park list                                    | the API (`/v1/discovery/nearby`) drops `false` rides before they arrive                                                                                           |
| Structured data (`components/seo/structured-data.tsx`) | **kept** in `containsPlace`: what the park contains is true all year                                                                                              |
| Trip planner                                           | `/plan/day` leaves the ride out of a day its season excludes; the next-ride suggestion skips `false` rides (`next-best-ride.ts`)                                  |

## A ride bound to a park season

A park season of kind `halloween`, `christmas`, `winter`, `summer_nights` or `special_event` that
lists a ride in `attractionIds` binds it: the ride exists only on the season's days (Phantasialand's
ice rink during Wintertraum). The API resolves it like any other season, so the ride arrives with
`isCurrentlyInSeason: false` outside those days and every surface above treats it as it treats any
out-of-season ride. What it adds is `boundSeason` on the park payload's attractions and on the ride
detail: the season whose bounds hold the park's today, else the next, else the last
([contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/seasonality.md#a-ride-bound-to-a-park-season)).

`SeasonalBadge` takes it as `boundSeason`. It draws the kind's `SeasonKindIcon` and names the
season through `useSeasonLabel`: the season's name while it runs, and outside it „Nur während
Wintertraum · 20. Nov. – 18. Jan. 2027", with the status beside the name when it is not
`confirmed`. The range is
`formatSeasonRange` (`lib/parks/park-season-days.ts`), the one the park's season card prints. The
ride card and the ride page pass it; Parky's card and the show card have no bound season. The admin
season editor says under „Betrifft" what naming a ride means for the season's kind.
