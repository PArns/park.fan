# Park sub-pages: average wait times and with kids

Why a park has the URLs `/<park>/average-wait-times` and `/<park>/with-kids` besides its own page
and the crowd calendar, which parks get them, and what each costs. Open it before adding another
per-park URL. Their layout follows the park audience kind of [landing pages](../product/landing-pages.md).

## The rule: a new URL must server-render what no other URL does

The park page is `force-dynamic` and already server-renders the live answer: every attraction's
current wait (as far as its first HTML reaches, see [analysis](analysis.md)), the best-days text
and the least-crowded FAQ. **A page that shows that again is a duplicate with its own URL** and
competes with the park page for the query the park page ranks for. That is why there is no bare
`/wartezeiten` page. A new park sub-page earns its URL only by server-rendering something no
existing URL server-renders; anything else splits an intent park.fan already holds.

The same rule kept the first-visit guide a slot on the park page (`ParkFirstVisitGuide`) instead
of a `/first-visit` URL ([park/ride page and blog link](../rules/parkride-page-and-blog-link.md)).
It does not help the head term: "phantasialand wartezeiten" belongs to the park page (average
position 10.4 on 2026-09-19 with "Wartezeiten" in title and H1), and closing that gap is domain
authority and inbound links, not a page.

## Average wait times (PAR-371)

The park's historical half, which the park page loads only on the client
(`ParkStatsSection` there is client-fetched; a cold stats aggregate once failed the static
prerender). It answers the statistics intent that `queue-times.com/parks/{id}/stats` ranks on.

Route `app/[locale]/parks/[continent]/[country]/[city]/[park]/average-wait-times`, segments in
`PARK_STATS_SEGMENTS` (`lib/parks/stats-segments.ts`: `average-wait-times`,
`durchschnittliche-wartezeiten`, `gemiddelde-wachttijden`, `temps-attente-moyens`,
`tempi-di-attesa-medi`, `tiempos-de-espera-medios`). The words are the phrase a visitor types,
and the title and H1 name the park and the intent, not the site's own coinage.

| Section                    | Renders                                                                   | Source                                                       |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Title, H1, lead            | busiest month, quietest weekday, the ride with the longest typical queue  | `deriveParkStatsFindings` (`lib/parks/park-stats-derive.ts`) |
| Crowd by month and weekday | `ParkStatsSection`, server-seeded                                         | `/v1/parks/<geo>/stats?years=2`                              |
| The typical day            | `ParkHourlyProfileCard` (P25/P50/P90 per hour)                            | `/v1/parks/<geo>/stats/hourly`                               |
| Rides by typical peak wait | `ParkStatsAttractionsCard`, each row linking its ride page                | `topAttractions` of the same aggregate                       |
| How the numbers are made   | `ParkStatsMethod`: window, this park's sample-day count, P50/P90 glossary | `meta.totalSampleDays`, `meta.windowYears`                   |
| Next step                  | `LandingNextSteps`, the planner first                                     | —                                                            |

The method section is what no competitor prints (how many measured days stand behind an average)
and the page's only prose under its own heading. JSON-LD: `BreadcrumbList`,
`ParkSubPageStructuredData` and `ParkDatasetStructuredData`.

**Gated on `meta.displayable`.** Census of 2026-09-21, every park with attractions probed:

| Reading                                        | Count                                  |
| ---------------------------------------------- | -------------------------------------- |
| Parks with attractions                         | 201                                    |
| `meta.displayable === true`                    | **119** (59 %)                         |
| Sample days among those                        | min 31, **median 149**, max 190        |
| Not displayable                                | 82, of which **37 have 0 sample days** |
| Displayable parks returning the full `topN=10` | 90 of 119                              |

So 714 URLs instead of 1,206; the other 492 would carry tables built from a handful of measured
days, 222 of them from none. The number grows by itself as newer parks fill their window. A park
with no wait-time source is a separate refusal (`hasReadableWaitTimes()`,
[parks we cannot read](../rules/parks-we-cannot-read.md)). The ranked table is gated on its
content, not on ten rows: 29 of the 119 return fewer
([a cell is gated on its content](../rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md)).

**The gate has readers outside the page.** `hasParkStatsPage()` / `parksWithStatsPage()`
(`lib/api/stats.ts`) answer for the sitemap, the park page and the crowd calendar off the same
`CACHE_TTL.stats` Data Cache entry (one day), so the whole class costs one upstream call per park
per day. A failed probe answers `false` there (a day of lost discovery) and throws on the page
(never a sitemap URL that 404s). The park page resolves the flag too, because the entry-tile row
(`components/parks/park-entry-tiles.tsx`) is the park's navigation on every park page and a cell
present on the calendar but missing on the park page would break the `rememberTileRow` handoff.

## With kids (PAR-356)

The park page has the height numbers behind a slider (`RiderHeightFilter`), which is state, not
text; this URL prints them. Route `…/[park]/with-kids`, segments in `PARK_KIDS_SEGMENTS`
(`lib/parks/kids-segments.ts`: `with-kids`, `mit-kindern`, `met-kinderen`, `avec-enfants`,
`con-bambini`, `con-ninos`).

- **What is on it** (`ParkKidsTiers`): one card per height at which the park's answer changes
  (its posted `minimumHeight`s, the slider's steps), with the readout for that step ("23 of 40",
  `canRideAtHeight`) and the rides that open at exactly that height, each linking its ride page.
  Before the first step, the attractions with no limit posted, labelled as that: the payload
  cannot tell "open to everyone" from "nobody wrote a limit down". Each step links the park page
  with `?height=<cm>` (accepted only if it is one of the park's minima,
  `initialRiderHeightFromParam`) and "plan a day for this height", which hands the height to the
  planner wizard (`lib/planner/page-height.ts`), rounded **down** to its chips
  (`riderHeightChoiceFor`).
- **Which parks:** at least 20 attractions with a `minimumHeight` **and** at least half of the
  park's attractions (`KIDS_PAGE_GATE`, `lib/parks/kids-page.ts`), read by the route, the sitemap
  (`parksWithKidsPage()`, from the park payload the park pages read anyway) and the park page's
  link. PO decision of 2026-09-29, a pilot: 32 of 203 parks, 192 URLs; Hansa-Park (0 of 83) and
  Efteling (8 of 37) get none. A gate of 10 (366 URLs) was left out: a gate is loosened after the
  re-measurement, never tightened after publication.
- **Linked** from the park page only, in a server-rendered block under the ride tabs
  (`ParkKidsLink`), for a park that clears the gate. Not a tile: the entry-tile row is laid out
  for seven cells at most.
- **Measured** by Search Console clicks and `planner_opened` with `source: 'kids-page'`, a value
  of an existing property, so no new Umami event ([Umami event budget](../rules/umami-event-budget.md)).

## Rendering, URLs and cost

Both pages render per request (`force-dynamic`) behind a one-day `CDN-Cache-Control` window, like
the park page. The record shipped as ISR on a one-day window and was moved on 2026-10-26: the ISR
cache is per deployment, so every URL was written again after each deploy and almost never read
back (6.2K units written against 182 read in 12 hours) —
[an ISR route needs both halves](../rules/an-isr-route-needs-both-halves.md).

The route folder is the English segment; the other five locales are rewritten onto it in
`next.config.ts` and canonicalized by a redirect, like the crowd calendar. The segment sits in the
`[attraction]` position, so it must not collide with a ride slug (`lib/parks/calendar-segments.ts`
states the rule). **Each segment list lives in three places that move together:** the
`lib/parks/*-segments.ts` module, the rewrite block in `next.config.ts` and its cache-header list
(`parkStatsHeaderSegments`, `parkKidsHeaderSegments`). A stale header entry is a page without its
edge window, which `pnpm test:edge-windows` catches.

Against the 2026-09-01 [baseline profile](../optimization/decisions.md#2026-09-01--baseline-the-bill-is-a-crawler-sweep-of-the-url-surface) (the crawlable URL
count drives cost, 74 % of invocations being crawler sweeps), 714 URLs were +1.2 % of the surface.
They stay cheap because a miss renders out of the Data Cache, one entry per park per day, and
writes nothing; a future per-park sub-page that cannot be cached at the edge does not inherit this
argument. Both URL classes are in `/sitemap.xml` without `<lastModified>` ([sitemaps](sitemaps.md)).
