# A ride out of season is closed, and is not one of the park's rides today (REQUIREMENT)

`isCurrentlyInSeason` has **three** values: `false` is closed, `true` is open, and **`null` behaves
exactly as before**. `null` means "seasonal, nothing else known" and must never hide a ride. So every
predicate in this app is `!== false`, never `=== true` (`isInSeason` in `lib/utils/season.ts`). An
out-of-season ride leaves every list, tile and count of what a visitor can ride today; structured
data keeps it (`containsPlace` says what the park contains, which is true all year), and its badge
says which way round it is ("Winter" in season, „Nur im Winter" out of it).

The rest of the rule is the API's and holds here unchanged: a live `OPERATING` row beats the season,
the „12 von 45 geöffnet" counters leave an out-of-season ride out of both numbers, the SQL twin
`attractionIsOutOfSeason()` changes with the TypeScript rule or not at all, and a wrong detection is
a curation in `/admin/attractions/<id>`, never a code change. All of it, with the reasons, is the
backend's
[seasonality contract](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/seasonality.md).

## Why

On 2026-08-21 Phantasialand's ice-skate hire, which runs November to January, showed on the park
page as open at `very_low` while its own page showed it closed, from the same database row: the
park payload's fallback (no queue row and the park open → the ride is open) turned an ice rink's
silence in August into an open attraction.

Background: [rides that cannot open today](../api/seasonal-attractions.md) lists every surface and
what it does with an out-of-season ride.
