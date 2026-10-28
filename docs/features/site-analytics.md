# Site analytics: our own counter

A cookieless statistic on api.park.fan that counts a view of every page and any event the site
sends, per day and never per reader. It carries the custom events Umami used to bill, the reads
behind the most-read lists, and answers questions Umami cannot, such as which search field is used
from which page. This page is the frontend half: the facade, the beacon, what leaves the browser
and when, and the admin pages. Open it before touching `lib/analytics/site-analytics.ts` or
`app/admin/traffic/`.

- Which events exist, when each fires and what it costs: [analytics](../development/analytics.md)
- The API half (collect endpoint, storage, visitors and visits, channels, the admin endpoints):
  [`docs/frontend/site-analytics.md`](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/site-analytics.md)
- The reads behind the most-read lists go through the same pipeline as the event `page_read`:
  [most read](most-read.md)
- What the privacy policy says about it: section 4 of `app/[locale]/datenschutz/content/`

## The facade

`lib/analytics/site-analytics.ts` is the only module that talks to `POST /v1/analytics/collect`.

| Export                                 | Does                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `trackSitePageview()`                  | counts a view of the page in the address bar                               |
| `trackSiteEvent(name, props, entity?)` | counts one event of any name; `SiteEventMap` types the ones the site sends |
| `sitePageTypeOf(pathname)`             | the `SitePageType` of a path                                               |
| `markPageNotFound()`                   | makes the next pageview of this path a `not_found`, for the 404 page       |
| `searchPosition(n)`                    | the bucket (`1`, `2`, `3`, `4-5`, `6-10`, `11+`) of a result position      |
| `flushSiteAnalytics()`                 | sends what is queued now; the page does so by itself, tests need it        |

- **A hit is the page plus the thing.** Every hit carries the lower-cased path (no query, no hash,
  no trailing slash), the page type, the language and the window width class (under 768, under
  1024, from 1024 CSS pixels). A pageview adds the referrer and the campaign on the first view of
  a load: the external host without `www.`, or the `utm_source` value, and the `utm_campaign`
  value, lower-cased and cut to the allowed characters, all read once and kept in memory. An event
  adds its name, its properties and, where the call site holds one, the UUID of the park, ride,
  show or restaurant.
- **Any event, nothing free.** The API stores whatever name and properties arrive: a name is
  `^[a-z][a-z0-9_]{1,47}$`, at most eight properties of a short word, a finite number or a flag. A
  name that is not in `SiteEventMap` compiles untyped, and the admin shows it from its first hit.
  What may never be sent is free text and anything that identifies a person: no search query, no
  name somebody typed, no id of a reader. `cleanProps` drops what does not fit the patterns and the
  API checks again, hit by hit.
- **Batched, in memory.** Hits queue for a second or until twenty are there, and leave in one
  request as `text/plain` (no preflight), through `sendBeacon` when the page is hidden. Nothing goes
  into browser storage: a flag kept there for a statistic would need consent (§ 25 TDDDG).
- **Five gates, all before anything is queued.** Only production hosts (`ANALYTICS_HOSTS`), not
  automation (`navigator.webdriver`), not Do Not Track, Global Privacy Control or the privacy page's
  opt-out (`analyticsOptedOut`, the same question as for Umami), not a simulated visit (`?sim=` or
  `?state=`, the team on its own phones) and not a path the API would refuse (it has to match
  `^/(locale)(/slug){0,8}$`, so an encoded character is not a page). The API checks the same again.
- **No timings.** Page speed stays with Umami's two Web Vitals events; this counter keeps no
  durations, no scroll positions and no performance data.
- **The types mirror what the site sends.** `SiteEventMap` lists every event with its property
  values, and a value outside a list does not compile for those names. A new event needs a line in
  `SiteEventMap` and in `EVENT_INFO` ([adding an event](../development/analytics.md#adding-an-event)).

### Page types

`sitePageTypeOf` reads the segments of the path, and most of them are written in the reader's
language: `/de/tagesplaner`, `/de/glossar/looping`, `/fr/parks/…/<park>/calendrier-temps-attente`.
It takes the spellings from the modules the routes are built from (`PLANNER_SEGMENTS`,
`GLOSSARY_SEGMENTS`, `PARK_CALENDAR_SEGMENTS`, `PARK_STATS_SEGMENTS`, `PARK_KIDS_SEGMENTS`), so a
new localized segment only needs adding there, and a page type without its spelling is `other`
until it is. `pnpm test:site-analytics` pins every locale's spelling of each.

A park is five segments under `/parks`, a ride a sixth, and the segments before are `geo`. The blog
index is every `/blog/page/<n>`, `/blog/category/…`, `/blog/tag/…` and `/blog/authors/…`; the rest of
`/blog/<slug>` is a `guide`. A path the 404 page rendered is `not_found`, whatever its shape: the
page calls `markPageNotFound()` (`NotFoundMarker`) before the beacon counts it.

### The beacon

`SitePageviewBeacon` (`components/analytics/site-pageview-beacon.tsx`) sits once in the locale
layout and calls `trackSitePageview()` whenever the pathname changes. A change of hash or query is
not a page, so the park tabs, the calendar's month stepper and the search page's `?q=` count
nothing. The admin is not under that layout, and its paths are no locale paths anyway.

### Reads

`PageViewBeacon` counts a read of a post, a park or a ride after five seconds in the foreground,
once per tab, and sends it as the event `page_read` (`kind` and, for a post, its `key`; the UUID as
entity for a park or ride). That one event feeds the rankings, which is why the API knows it by name
and caps it per reader and day ([most read](most-read.md)). `article_read` reports how far into a
guide or news post a reader got (25, 50, 75, 100 percent), once per step, after the same five
seconds.

### Entities

The UUID is optional and only sent where the call site holds one: the favorite star, the ride and
show dialogs, the park page's tabs and filters, the calendar, the reads of a park
or ride, and the outbound links on the park page. The planner events carry none, because the plan is
stored by the park's slug. `outbound_link_clicked` works without a client island per link:
server-rendered links carry `data-outbound` and `data-outbound-entity` (`outboundLinkAttributes`)
and one delegated listener (`OutboundLinkTracker`) counts the click. An entity is never derived
from the visitor's location: `nearby_parks_loaded` and the compass events carry none.

## The admin

Three pages, German like the rest of the admin, in the sidebar, in ⌘K and on `g` `t`, `g` `o` and
`g` `u`. The admin home carries a tile with the visitors of today and how many are on the site.
Every call goes through the admin proxy as `/api/admin/analytics/…`, which maps to
`/v1/admin/analytics/…` ([the admin holds no credential](../rules/the-admin-holds-no-credential.md)).

| Page                    | Shows                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Traffic                 | six figures against the window before, who is on now, a chart, channels, referrers, campaigns, pages, entry pages, countries as a list and a map, languages, devices, browsers, systems and every event |
| Event (`events/<name>`) | one event's properties and values, the combinations sent together, a crosstab of any two dimensions, page types, window widths, the parks, rides, shows and restaurants behind it, its days             |
| SEO (`traffic/seo`)     | the pages visits begin on from search engines and from AI assistants, the pages gaining and losing, 404 addresses with their referrers, parks and rides no search visit reached                         |
| Suche                   | hero against header, every search field side by side, a field by page type and by device, result kinds, positions, the resting list, the days                                                           |

- **Filters work like Umami's.** A press on a value in any panel filters the whole page by it: a
  channel, a referrer, a campaign, a page, an entry page, a country, a language, a device, a browser,
  a system, a page type. They are `?filter=<dimension>:<value>` in the address, repeatable, each one a
  chip that takes itself off, and the event, SEO and search pages carry them too. A language is the
  language switch, not a filter. Filters combine with AND, and a second press on the same
  dimension replaces the first.
- **The window and the language are in the address** (`?days=1|7|30|90|365&locale=de`), so a view
  is a link, and `replace` keeps the back button out of it. `useTrafficFilters` reads them under a
  `Suspense` boundary, `useTrafficData` asks the proxy and keeps the previous answer on screen
  while a switch loads. "Heute" is drawn by the hour. Today is not over, so its figures are not
  set against all of yesterday as a percentage: the tiles name yesterday's full-day number instead.
- **Visitors are the one figure a filter cannot split.** The API sums daily unique visitors per
  language, so under any filter but the language `visitors` is `null`: the tile shows a dash and
  says why, with no change chip and no line in the chart, instead of a zero. Views and visits stay.
- **An entity can outlive its page.** An id that resolves to nothing any more (a retired park, a
  deleted show) comes back with `kind`, `name` and `url` null, and its row reads "Nicht mehr
  vorhanden" with the id and no link. The uncovered list shows the counts the API sends (how many
  of all there are, how many no search visit entered on), a rider's park beside it, and says when the
  list is cut at its limit.
- **Realtime asks for today alone**, ignores the window, the language and the filters, and repeats
  every 30 seconds while the tab is in front (`useRealtimeOverview`, shared with the home tile).
- **The map is `public/world.svg`** (the file the homepage hero's continents are cut from), fetched
  when the panel first draws and cut into one path per country. Countries shade by a square root
  of their views, or Germany would leave every other country the same pale shade, and a press
  filters the page. The list beside it carries the same numbers.
- **Events are generic.** The list shows every name seen, blocked ones included, with the name as
  sent, a German label and sentence where `EVENT_INFO` has one, and nothing invented for the rest.
  The detail page discovers its properties from the response, and the crosstab asks the API for any
  two of `page_type`, `viewport`, `locale`, `day` and `prop:<key>`: "which search field, opened from
  which page" is `search_opened` by `prop:surface` against `page_type`.
- **An editor can block a name** (`PUT` and `DELETE /v1/admin/analytics/blocked-events/<name>`):
  it is not recorded any more and stays in the list, flagged, so it can be released. The button is
  not there for a lower role, and blocking asks once.
- **Rows lead somewhere.** A page opens on park.fan and, for a park or a ride, in its editor
  (`/admin/go`); a referrer opens its site; an entity opens its editor by id and its public page;
  a search field's numbers lead to `search_opened` and its siblings; a 404 address copies or opens.
- **Empty is a state.** The endpoints answer zeros until data arrives, so a window without any
  traffic says so and names the usual reasons instead of drawing flat charts.
- **Charts are drawn here** (`app/admin/_ui/charts.tsx`: line chart with a hover readout and a
  table view, sparkline, bar list, stacked share bar, shaded matrix), without a charting library.
  More than one series takes `CATEGORICAL` in its fixed order, so a field keeps its colour on
  every chart, and a delta is green and red only where more is better (a bounce rate that falls is
  the good news; an event that grows is neither).
- **The pure half** (windows, filters, deltas, the words for the names this build knows, the
  matrices) is `lib/admin/site-analytics.ts`, and `pnpm test:admin-site-analytics` pins it. The
  response types are `lib/api/admin-site-analytics.ts`.

### Reading the numbers

- **Visitors over a window are the sum of the daily uniques.** Somebody who comes back on another
  day counts again, which the counter cannot avoid without keeping a longer-lived identifier.
- **A visit ends after 30 minutes without a page view**; the entry page, the referrer, the channel
  and the campaign count at its start, so their figures are visits, not page views.
- **The bounce rate is the visits that saw one page over all visits**, per entry page, channel,
  referrer or campaign. There is no visit duration.
- **The channel comes from the referrer on the API**: search, ai, social, referral, campaign (an
  `utm_source` was there) or direct. A visit without a referrer is direct, and so is one from a
  browser that strips it.
- **Visitors from a different phone, network or browser are different visitors**, as in Umami.
- **Do Not Track, Global Privacy Control, the opt-out and bots are not in it.** The figures are
  lower than the traffic by that share.
- **Search "opened"** is a field clicked or focused. The hero is one surface on a phone and at a desk,
  and the viewport split tells them apart. The click rate is results and suggestions opened over
  openings, and "ohne Treffer" is the share of typed searches that found nothing.

## Known limits

- The planner events say nothing about the park. Storing the id in the planner's store would.
- A path with an encoded character is dropped, as is anything outside the patterns above.
- The path breakdown holds every path that was seen, and a 404 is a path, so a crawler that tries
  thousands of addresses fills the 404 list. Blocking cannot help there, since it names events.
- The SEO page's list of parks and rides without a search visit assumes the API answers with a name
  and the public address of each; it is the one endpoint of the set this page could not check
  against a running API.
