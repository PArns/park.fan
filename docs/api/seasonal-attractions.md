# Rides that cannot open today

Phantasialand's **Ice skate hire** runs in November, December and January. On 21 August 2026
the park page showed it as **geöffnet**, rated `very_low` — "walk on, no queue" — while the
ride's own page, one request away, showed it as **geschlossen**. Both pages read the same
database row.

## Where the two answers came from

The park payload builds each ride's status from its live queue rows. When none arrive and the
park is open, it used to fall through to an optimistic default:

```ts
attraction.status = dto.status === 'OPERATING' ? 'OPERATING' : 'CLOSED';
```

That default exists for a real failure: when an upstream feed goes quiet for one ride, calling
it closed produces the "Park geöffnet, alle Bahnen zu" page. But an ice rink in August is not a
feed that broke. Nobody publishes a wait time for it because there is nothing to publish, and
the optimism turned that silence into an open attraction.

The ride's own endpoint has no such fallback — it keeps the `CLOSED` placeholder its DTO is
seeded with — so it happened to be right, by omission rather than by rule.

## The signal

The API resolves seasonality per attraction and serves the answer:

```ts
{ isSeasonal: true, seasonMonths: [1, 11, 12], isCurrentlyInSeason: false }
```

`isCurrentlyInSeason` has **three** values and the third is the point:

| Value   | Means                                                                                       | What a surface does                          |
| ------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `false` | Months are on file and this is not one — or the detector recorded the last day the ride ran | Treat as closed; leave it out of the counter |
| `true`  | In season                                                                                   | Nothing special                              |
| `null`  | Seasonal, and **nothing else known**                                                        | Behave exactly as before                     |

`null` must never collapse into "closed". It would hide a ride nobody has understood yet, and
most seasonal rides sit there: the backend's detector refuses to name operating months for
anything it has watched for under 330 days, because derived months would just be the recording
window. So every predicate is `!== false`, never `=== true` — in `lib/utils/season.ts` on this
side, and in `isCurrentlyInSeason()` / `attractionIsOutOfSeason()` on the API's.

A live `OPERATING` row still outranks all of it. A queue row is an observation; the season is a
description of past behaviour, so a season that starts a week early is the feed's news to tell.

## The counter

"12 von 45 geöffnet" is a statement about what a visitor can queue for today. A rink that
cannot open before November is neither one of the 45 nor one of the 33 closed ones — counted
in, it makes the park look emptier than it is all summer, and the deficit is a rink.

The same sentence is rendered from four different sources, and each one had to learn the rule
separately:

| Surface                                      | Source                                               |
| -------------------------------------------- | ---------------------------------------------------- |
| Park page (`AttractionWaitOverview`, header) | `analytics.statistics` from `ParkIntegrationService` |
| Park listings (`park-enrichment`)            | `AnalyticsService.getParkStatistics` — SQL           |
| Park cards, geo pages (`/parks/live`)        | `DiscoveryService.LIVE_STATS_SQL` — SQL              |
| Global realtime stats                        | `AnalyticsService.getGlobalRealtimeStats` — SQL      |

Three of the four are SQL over the whole catalogue and never load an entity, which is why the
API carries **`attractionIsOutOfSeason()`** (`common/utils/season-window.sql.ts`) — a SQL twin
of the TypeScript rule, in the same shape as `scheduleRowSpeaksForToday()`. It was checked
against a real Postgres over all 300 combinations of the five seasonality columns, with no
disagreement; it is a hand-written twin, so a change to either half is a change to both.

## On this side

- The **card grid** hides off-season rides behind the "N außer Saison" toggle (`useAttractionFilter`).
- The **pre-mount wait-time overview** — the only attraction markup a crawler sees without JS —
  hides them too. It used to list them all, right under the counter that leaves them out.
- The **seasonal badge** says which way round it is: "Winter" in season, **"Nur im Winter"**
  out of it. It used to show the same word either way at half opacity, so "Geschlossen · Winter"
  read as a ride that happened to be shut rather than one that cannot open for three months.
- **Nearby** (`/api/nearby`) drops `isCurrentlyInSeason === false` rides from the in-park list.
- **Structured data** keeps them: `containsPlace` says what the park contains, which is a
  year-round fact and not a claim about today.

## When the detector is wrong

It is behavioural — it reports what the feed has been doing — so a ride closed for a long
refurbishment looks exactly like a seasonal one. That is a curation, not a code change:
`/admin/attractions/<id>` has **Saisonal** and **Betriebsmonate**, and a curated `false` takes
the detector's `season_out_since` down with it. A ride that no longer exists at all is a
different answer, and the same page's **Status** control is where it belongs.
