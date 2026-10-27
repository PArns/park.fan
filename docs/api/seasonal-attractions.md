# Rides that cannot open today: every surface

Where the frontend reads a ride's or show's season and what each surface does with an
out-of-season one. Open it when a new surface lists, counts or badges rides. The rule —
three values, `!== false` never `=== true`, a live `OPERATING` row beats the season,
an out-of-season ride is not in the counter — is
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
| Crawled markup                                         | the same grid: since PAR-272 there is no separate pre-mount overview, so the rule holds on both sides of hydration                                                |
| Seasonal badge (`components/parks/seasonal-badge.tsx`) | "Winter" in season, "Nur im Winter" / "Nur im Sommer" out of it                                                                                                   |
| Park entry tiles, `ParkTodayPanel`                     | left out of the headliner rows, the ride tile and the day's show count                                                                                            |
| Live poll (`lib/api/park-live-projection.ts`)          | `isSeasonal` and `isCurrentlyInSeason` travel with `effectiveStatus`, so the client can apply `isInSeason` after each poll                                        |
| Favourites menu (`favorites-menu-panel.tsx`)           | reads `effectiveStatus`, never the raw `status`, which does not know about the season                                                                             |
| Nearby in-park list                                    | the API (`/v1/discovery/nearby`) drops `false` rides before they arrive                                                                                           |
| Structured data (`components/seo/structured-data.tsx`) | **kept** in `containsPlace`: what the park contains is true all year                                                                                              |
| Trip planner                                           | `/plan/day` leaves the ride out of a day its season excludes; the next-ride suggestion skips `false` rides (`next-best-ride.ts`)                                  |
