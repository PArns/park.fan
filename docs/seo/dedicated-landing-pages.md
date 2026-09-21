# Dedicated landing pages per park — concept

Concept for [PAR-292](https://linear.app/parkfan/issue/PAR-292). It answers one question: **is
there a park sub-page worth its own URL that we have not built, and what would be on it?** No
implementation; the build is a follow-up ticket and needs the owner's approval first.

It continues [Phase 3 of the SEO roadmap](seo-roadmap.md#phase-3--statistiken--landingpages)
rather than restarting it, and it replaces the one-line "remaining upside" in
[analysis.md, item 1](analysis.md#known-trade-offs--open-items).

All figures below were measured on **2026-09-21** against the production API. The park census is a
census, not a sample: every one of the 201 parks that has attractions was probed.

---

## 1. Half of the premise is already built

The ticket named two candidates, `/wartezeiten` and `/crowd-calendar`. Their status differs.

| Candidate                      | State                               | Where                                                                                                                                                                                 |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/crowd-calendar`              | **built**                           | `app/[locale]/parks/[continent]/[country]/[city]/[park]/wait-time-calendar/[[...date]]/page.tsx`, segments in `lib/parks/calendar-segments.ts`, own sitemap child (3,604 URLs/locale) |
| Roadmap 3B, country intro text | **built**                           | `CountrySummarySection` on `app/[locale]/parks/[continent]/[country]/page.tsx` — data-derived, server-rendered                                                                        |
| Roadmap 3A, park statistics    | **components exist, not crawlable** | `ParkStatsSection` + `ParkHourlyProfileCard`, loaded client-side via `/api/parks/.../stats` (`components/parks/park-page-shell.tsx:139`)                                              |
| `/wartezeiten`                 | **open, and see §2**                | —                                                                                                                                                                                     |

So the chassis for a park sub-page is in the repo already: localized segment map, rewrite rules,
`ParkNavTiles`, `ParkSubPageStructuredData`, the redirect chain and a per-route sitemap child. A
second pattern does not have to be invented, only filled.

Roadmap 3A also carried a precondition, "check whether API endpoints for historical data exist".
They do, both are already wired into route handlers and both have server-side seed helpers:
`/v1/parks/<geo>/stats` (`getParkHistoricalStatsSeed`) and `/v1/parks/<geo>/stats/hourly`
(`getParkHourlyProfileSeed`), each timeout-guarded at 3 s.

## 2. What decides the content: subtraction, not addition

The park page is `force-dynamic` and already server-renders the live answer. Its first HTML
carries every attraction name, its link, its snapshot wait and the "Datenstand" timestamp
(`AttractionWaitOverview`, [analysis.md item 2](analysis.md#known-trade-offs--open-items)), plus
the best-days text and the least-crowded FAQ. **A page that shows that table again is a duplicate
with its own URL, and it competes with the park page for the query the park page already ranks
for.** That is the whole reason a bare `/wartezeiten` is the wrong page to build.

What the park page does **not** put into the first HTML is the historical half. `ParkStatsSection`
and `ParkHourlyProfileCard` are mounted client-side on purpose: the stats aggregate computes
lazily on a cold park and a slow fill would have failed the static prerender, which is what pushed
the whole route to `no-store` once before (`lib/api/stats.ts`, and the comment at
`app/[locale]/parks/.../[park]/page.tsx:296`). Both components already accept a server seed and
are used with one elsewhere — the park page simply does not pass it.

That is the gap, and it is the same gap a competitor occupies: `queue-times.com/parks/{id}/stats`
ranks on the statistics intent, and park.fan has no URL for it at all.

**The rule for this page, and for any park sub-page after it:** a new URL earns its place by
server-rendering something no existing URL server-renders. Anything else splits an intent we
already hold.

## 3. The page

One page per park, no sub-URLs under it. Working name: **the park's wait-time record**.

| #   | Section                    | Renders                                                                                                        | Source                                                     |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Title, H1, lead sentence   | Busiest month, quietest weekday, the ride with the longest typical queue, as a sentence with the numbers in it | derived from `byMonth`, `byDayOfWeek`, `topAttractions`    |
| 2   | Crowd by month and weekday | `ParkStatsCrowdCard`                                                                                           | `/stats?years=2`, server seed                              |
| 3   | The typical day            | `ParkHourlyProfileCard` (P25/P50/P90 per hour)                                                                 | `/stats/hourly?years=1&topN=8`, server seed                |
| 4   | Rides by typical peak wait | `ParkStatsAttractionsCard`, each row linking its ride page                                                     | `topAttractions` from the same aggregate                   |
| 5   | How these numbers are made | Window length, **this park's** sample-day count, what P50 and P90 mean, linked into the glossary               | `meta.totalSampleDays`, `meta.windowYears`, glossary terms |
| 6   | Where to go next           | Live park page, the calendar for a single day, the planner                                                     | existing link components                                   |

Section 5 is the part no competitor prints: queue-times shows averages without saying over how
many measured days, and this payload carries the number per park (median 149 days, see §5). It is
also the only section that is prose rather than a card, which is what gives the page indexable text
under its own heading.

JSON-LD: `BreadcrumbList` and `ParkSubPageStructuredData` as on the calendar page, plus a `Dataset`
modelled on `ParkCalendarDatasetStructuredData`. Every cross-`<script>` reference states its
`@type` — [analysis.md item 12](analysis.md#known-trade-offs--open-items) is what happens when one
does not.

### Rendering mode

Nothing on this page is live, so it is **not** `force-dynamic` — the first park-level route that
does not have to be. ISR with a one-day window matches the data, which the aggregate endpoint
recomputes daily. That matters for cost (§6): a crawler sweep of these URLs hits a prerender
instead of a function.

## 4. URL pattern

```
/[locale]/parks/<continent>/<country>/<city>/<park>/<segment>
```

Same mechanism as the calendar and the best-travel-time hub: the route folder is the English slug,
the other five locales are served on it by a rewrite in `next.config.ts` and canonicalized by a
redirect. The segment sits in the `[attraction]` position, so the chosen words must not collide
with a ride slug — the note in `lib/parks/calendar-segments.ts` states the rule and applies
unchanged.

Two candidate naming sets. **This is a naming decision and therefore the owner's**, so both are
listed with what they buy:

| Locale | A — recommended                 | B — alternative               |
| ------ | ------------------------------- | ----------------------------- |
| en     | `average-wait-times`            | `wait-time-statistics`        |
| de     | `durchschnittliche-wartezeiten` | `wartezeiten-statistik`       |
| nl     | `gemiddelde-wachttijden`        | `wachttijden-statistieken`    |
| fr     | `temps-attente-moyens`          | `statistiques-temps-attente`  |
| it     | `tempi-di-attesa-medi`          | `statistiche-tempi-attesa`    |
| es     | `tiempos-de-espera-medios`      | `estadisticas-tiempos-espera` |

A is the phrase a visitor types; B is the word the competitor's URL uses and reads as a section
name rather than a question. Either way the list lives in **three** places that move together, the
same three the calendar segments live in: `lib/parks/<new>-segments.ts`, the rewrite block in
`next.config.ts` (~line 706) and the cache-header block above it. A stale entry in the third is a
page that silently loses its edge window, and nothing renders it and no test catches it.

The title and H1 name the park and the intent, not the site's own coinage — the same reasoning
that made the calendar's H1 "Phantasialand Wartezeiten im August 2026" rather than
"Wartezeiten-Kalender".

## 5. Which parks get one — measured

Probed all 201 parks that have attractions, `GET /v1/parks/<geo>/stats?years=2` and
`/stats/hourly?years=1&topN=8`, 2026-09-21. Every request answered 200.

| Reading                                        | Count                                  |
| ---------------------------------------------- | -------------------------------------- |
| Parks with attractions                         | 201                                    |
| `meta.displayable === true`                    | **119** (59.2 %)                       |
| Sample days among those                        | min 31, **median 149**, max 190        |
| Not displayable                                | 82, of which **37 have 0 sample days** |
| Hourly profile with at least one ride          | 115                                    |
| Displayable parks returning the full `topN=10` | 90 of 119                              |

Two consequences for the build:

- **Gate the route on `meta.displayable`.** With the gate the page exists for 119 parks × 6
  locales = **714 URLs**. Without it, 492 further URLs would carry a table built from a handful of
  measured days, and 222 of them from none at all. A park with no readable wait-time source is a
  separate refusal and is already covered by `hasReadableWaitTimes()` — see
  [parks we cannot read](../rules/parks-we-cannot-read.md); never render a `0` where the payload
  omits a value.
- **The ranked table must render a short list.** 29 of 119 parks return fewer than ten rides, so
  the card is gated on its content, not on a fixed row count
  ([the cell rule](../rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md)).

The 119 will grow on its own: the parks below the threshold are mostly recently added ones whose
measurement window has not filled yet.

## 6. What it costs

[baseline-profile.md](../optimization/baseline-profile.md) (measured 2026-09-01) is the frame:
74 % of Vercel invocations are crawler sweeps over a 59,772-URL published surface, 87 % of them
miss every cache, and **the size of the crawlable URL space is the cost driver**, not the payload.

714 URLs is **+1.2 %** of that surface. It is also the cheapest kind to add: park pages and
calendar month pages are `force-dynamic`, so every crawl of one runs a function, while this route
is prerenderable and a sweep of it is served from cache. If a per-park sub-page is ever added that
cannot be cached, this argument does not carry over to it.

## 7. What lives where afterwards

| Content                                            |  Park page  | Calendar page | New page |
| -------------------------------------------------- | :---------: | :-----------: | :------: |
| Live status, live wait table, today panel, weather |     ✅      |    partial    |    —     |
| Shows, restaurants, map, FAQ, blog links           |     ✅      |       —       |    —     |
| Crowd level per day, month URLs                    |      —      |      ✅       |    —     |
| Best travel time text                              |     ✅      |      ✅       |    —     |
| Crowd by month / weekday, 2-year window            | client-only |       —       |  **✅**  |
| Typical day curve (P25/P50/P90 per hour)           | client-only |       —       |  **✅**  |
| Rides ranked by typical peak wait, deep-linked     |      —      |       —       |  **✅**  |
| Sample size and method                             |      —      |       —       |  **✅**  |

The bold column is the page's justification. Nothing moves off the park page and nothing is
removed from it — its client-side stats section stays exactly as it is, because a reader who is
already there should not have to navigate for numbers they can see in place.

## 8. What this does not fix

The head term stays with the park page. park.fan sits at average position 10.4 for "phantasialand
wartezeiten" (Search Console, 639 impressions / 2 clicks in 7 days, noted on PAR-292 on
2026-09-19), and the park page already carries "Wartezeiten" in both its title and its H1, so the
metadata is not the cause and a second page on the same query would not raise it. This concept
targets a query park.fan does not answer at all today. Closing the gap on the head term is a
different question — domain authority and inbound links — and is not a page anyone can build.

## 9. Effort

| Work                                                                         | Size  |
| ---------------------------------------------------------------------------- | ----- |
| Route, metadata, canonical + hreflang, OG image, redirect and rewrite wiring | M     |
| Segment module and its two copies in `next.config.ts`                        | XS    |
| Server seeds and the `displayable` gate (both helpers exist)                 | S     |
| Lead sentence and method section, derived from the payload                   | S     |
| New UI strings in six locales (roughly 30 keys)                              | S     |
| Sitemap child + nav tile + internal links from park page and calendar        | S     |
| `Dataset` JSON-LD and the structured-data wiring                             | XS    |
| **Total**                                                                    | **L** |

The cards themselves are reuse, not new components, which is what keeps this at L. The one genuinely
new piece of UI is the method section, and it is text.

## 10. Decisions this needs before a build ticket

1. Build it at all, or leave the statistics intent unserved.
2. Naming set **A** (recommended) or **B**, per §4.
3. Gate on `meta.displayable` (recommended, 714 URLs) or publish for every park (1,206 URLs,
   492 of them thin).
4. Whether the ranked table links each ride to its own page. Recommended: yes — those pages are
   already in the lean attraction sitemap, and this is the only place they would be linked from by
   a historical figure rather than a live one.

---

## Related

- [SEO Roadmap](seo-roadmap.md) — the phases this continues
- [SEO Analysis](analysis.md) — open items, item 1 in particular
- [Sitemaps](sitemaps.md) — where a new URL class would be published
- [Baseline profile](../optimization/baseline-profile.md) — the crawl-surface measurement
