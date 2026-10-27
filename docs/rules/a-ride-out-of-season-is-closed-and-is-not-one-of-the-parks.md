# A ride out of season is closed, and is not one of the park's rides today (REQUIREMENT)

`isCurrentlyInSeason` has **three** values: `false` is closed, `true` is open, and **`null` behaves
exactly as before**. `null` means "seasonal, nothing else known" and must never hide a ride. So every
predicate is `!== false`, never `=== true` (`isInSeason` in `lib/utils/season.ts`).

- **A live `OPERATING` row still beats the season.** A queue row is an observation; the season is a
  description of past behaviour.
- **An out-of-season ride is not in the counter.** „12 von 45 geöffnet" says what a visitor can
  queue for today; a rink that cannot open before November is neither one of the 45 nor one of the
  33 closed.
- **The SQL twin changes with the TS rule or not at all.** Three of the four sources of that
  counter are SQL over the whole catalogue, so the API carries `attractionIsOutOfSeason()`
  (`src/common/utils/season-window.sql.ts` in v4.api.park.fan), a hand-written twin checked against
  a real Postgres over all 300 combinations of the five seasonality columns. The API's
  status-without-live-data rule is `statusWithoutLiveData`.
- **The badge says which way round it is**: "Winter" in season, „Nur im Winter" out of it.
- **Structured data keeps the ride**: `containsPlace` says what the park contains, which is true all
  year.
- **When the detector is wrong** (a long refurbishment looks like a season), that is a curation in
  `/admin/attractions/<id>` (**Saisonal**, **Betriebsmonate**), not a code change; a ride that no
  longer exists is the same page's **Status**.

## Why

On 2026-08-21 Phantasialand's ice-skate hire, which runs November to January, showed on the park
page as open at `very_low` while its own page showed it closed, from the same database row. The
park payload's optimistic fallback (no queue row and the park open → the ride is open) exists for a
feed that broke; nobody reports anything for an ice rink in August, and that silence became an open
attraction. Most seasonal rides sit at `null`, because the detector names no months for anything it
has watched for under 330 days.

Background: [rides that cannot open today](../api/seasonal-attractions.md) lists the four counter
sources and every surface.
