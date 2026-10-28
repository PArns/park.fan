# Site analytics: our own counter

A cookieless statistic on api.park.fan that counts a view of every page and a closed list of
events, per day and never per reader. It carries the custom events Umami used to bill and answers
questions Umami cannot, such as which search field is used from which page. This page is the
frontend half: the facade, the beacon, what leaves the browser and when, and the admin dashboards.
Open it before touching `lib/analytics/site-analytics.ts` or `app/admin/traffic/`.

- Which events exist, when each fires and what it costs: [analytics](../development/analytics.md)
- The API half (collect endpoint, closed schema, visitors and visits, the admin endpoints):
  [`docs/frontend/site-analytics.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/site-analytics.md)
- The older dwell-based counter behind the most-read lists is a separate pipeline and stays as it
  is: [most read](most-read.md)
- What the privacy policy says about both: section 4 of `app/[locale]/datenschutz/content/`

## The facade

`lib/analytics/site-analytics.ts` is the only module that talks to `POST /v1/analytics/collect`.

| Export                                 | Does                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `trackSitePageview()`                  | counts a view of the page in the address bar                               |
| `trackSiteEvent(name, props, entity?)` | counts one event; `SiteEventMap` types the name and each property's values |
| `sitePageTypeOf(pathname)`             | the closed `SitePageType` of a path                                        |
| `searchPosition(n)`                    | the bucket (`1`, `2`, `3`, `4-5`, `6-10`, `11+`) of a result position      |
| `flushSiteAnalytics()`                 | sends what is queued now; the page does so by itself, tests need it        |

- **A hit is the page plus the thing.** Every hit carries the lower-cased path (no query, no hash,
  no trailing slash), the page type, the language and the window width class (under 768, under
  1024, from 1024 CSS pixels). A pageview adds the referrer on the first view of a load: the
  external host without `www.`, or the `utm_source` value, read once and kept in memory. An event
  adds its name, its properties and, where the API's row takes one, the UUID of the park, ride or
  show.
- **Batched, in memory.** Hits queue for a second or until twenty are there, and leave in one
  request as `text/plain` (no preflight), through `sendBeacon` when the page is hidden. Nothing goes
  into browser storage: a flag kept there for a statistic would need consent (§ 25 TDDDG).
- **Five gates, all before anything is queued.** Only production hosts (`ANALYTICS_HOSTS`), not
  automation (`navigator.webdriver`), not Do Not Track, Global Privacy Control or the privacy page's
  opt-out (`analyticsOptedOut`, the same question as for the most-read beacon), not a simulated
  visit (`?sim=` or `?state=`, the team on its own phones) and not a path the API would refuse (it
  has to match `^/(locale)(/slug){0,8}$`, so an encoded character is not a page). The API checks
  the same again and drops what is outside its schema, one hit at a time.
- **The types mirror the API.** `SiteEventMap` lists every event with its property values, and a
  value outside a list does not compile. A new event needs both ends and a line in `EVENT_INFO`
  ([adding an event](../development/analytics.md#adding-an-event)).

### Page types

`sitePageTypeOf` reads the segments of the path, and most of them are written in the reader's
language: `/de/tagesplaner`, `/de/glossar/looping`, `/fr/parks/…/<park>/calendrier-temps-attente`.
It takes the spellings from the modules the routes are built from (`PLANNER_SEGMENTS`,
`GLOSSARY_SEGMENTS`, `PARK_CALENDAR_SEGMENTS`, `PARK_STATS_SEGMENTS`, `PARK_KIDS_SEGMENTS`), so a
new localized segment only needs adding there, and a page type without its spelling is `other`
until it is. `pnpm test:site-analytics` pins every locale's spelling of each.

A park is five segments under `/parks`, a ride a sixth, and the segments before are `geo`. The blog
index is every `/blog/page/<n>`, `/blog/category/…`, `/blog/tag/…` and `/blog/authors/…`; the rest of
`/blog/<slug>` is a `guide`.

### The beacon

`SitePageviewBeacon` (`components/analytics/site-pageview-beacon.tsx`) sits once in the locale
layout and calls `trackSitePageview()` whenever the pathname changes. A change of hash or query is
not a page, so the park tabs, the calendar's month stepper and the search page's `?q=` count
nothing. The admin is not under that layout, and its paths are no locale paths anyway. A 404 renders
inside the layout and is counted, under `other`, with the path that was asked for.

### Entities

The UUID is optional and only sent where the call site holds one: the favorite star, the ride and
show dialogs, the nearby hook, the park page's tabs and filters, and the outbound links on the park
page. The planner events carry none, because the plan is stored by the park's slug. `outbound_link_clicked`
works without a client island per link: server-rendered links carry `data-outbound` and
`data-outbound-entity` (`outboundLinkAttributes`) and one delegated listener
(`OutboundLinkTracker`) counts the click.

## The admin

`/admin/traffic` („Traffic"), `/admin/traffic/events/<name>` and `/admin/traffic/search`
(„Suche"), in the sidebar, in ⌘K and on `g` `t` and `g` `u`. The admin home carries a tile with
the visitors of today and how many are on the site. Like the rest of the admin the pages are
German. Every call goes through the admin proxy as `/api/admin/analytics/…`, which maps to
`/v1/admin/analytics/…` ([the admin holds no credential](../rules/the-admin-holds-no-credential.md)).

| Page                    | Shows                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Traffic                 | five figures with their change against the window before, who is on now, a daily chart, nine breakdowns and every event                     |
| Event (`events/<name>`) | one event's values per property, page types, window widths, the parks, rides and shows behind it, its days                                  |
| Suche                   | hero against header, all seven fields side by side, a field by page type and by device, result kinds, positions, the resting list, the days |

- **The window and the language are in the address** (`?days=1|7|30|90|365&locale=de`), so a view
  is a link, the event pages and the search page keep them, and `replace` keeps the back button out
  of it. `useTrafficFilters` reads them under a `Suspense` boundary, `useTrafficData` asks the
  proxy and keeps the previous answer on screen while a switch loads.
- **Realtime asks for today alone**, ignores the window and the language, and repeats every 30
  seconds while the tab is in front (`useRealtimeOverview`, shared with the home tile).
- **Rows lead somewhere.** A page opens on park.fan and, for a park or a ride, in its editor
  (`/admin/go`); a referrer opens its site; a language row filters the whole page; an event row
  opens the event; an entity opens its editor by id and its public page; a search field's numbers
  lead to `search_opened` and its siblings.
- **Empty is a state.** The endpoints answer zeros until data arrives, so a window without any
  traffic says so and names the usual reasons instead of drawing flat charts.
- **Charts are drawn here** (`app/admin/_ui/charts.tsx`: line chart with a hover readout and a
  table view, sparkline, bar list, stacked share bar, shaded matrix), without a charting library.
  More than one series takes `CATEGORICAL` in its fixed order, so a field keeps its colour on
  every chart, and a delta is green and red only where more is better.
- **The pure half** (windows, deltas, the words for every closed list, the matrices) is
  `lib/admin/site-analytics.ts`, and `pnpm test:admin-site-analytics` pins it. The response types are
  `lib/api/admin-site-analytics.ts`.

### Reading the numbers

- **Visitors over a window are the sum of the daily uniques.** Somebody who comes back on another
  day counts again, which the counter cannot avoid without keeping a longer-lived identifier.
- **A visit ends after 30 minutes without a page view**; the entry page and the referrer count at its
  start, so their figures are visits, not page views.
- **Visitors from a different phone, network or browser are different visitors**, as in Umami.
- **Do Not Track, Global Privacy Control, the opt-out and bots are not in it.** The figures are
  lower than the traffic by that share.
- **Search "opened"** is a field clicked or focused. The hero is one surface on a phone and at a desk,
  and the viewport split tells them apart. The click rate is results and suggestions opened over
  openings, and "ohne Treffer" is the share of typed searches that found nothing.

## Known limits

- The planner events say nothing about the park. Storing the id in the planner's store would.
- A path with an encoded character is dropped, as is anything the closed schema does not name.
- The path breakdown holds every path that was seen, and a 404 is a path.
