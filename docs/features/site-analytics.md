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
- What the privacy policy says about it: section 4 of `app/[locale]/datenschutz/content/`. It lists
  every kind of row the database holds and every Redis key with its lifetime, copied from the API
  page's privacy section, and how long the database keeps its rows (hourly rows 90 days, up to 97;
  daily counts and visitor counts 400, up to 407), copied from the API's
  [retention](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/site-analytics.md#retention);
  change one of them only together with the other.

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
  no trailing slash), the page type and the language. The window width is not read: the API takes
  the device class (`mobile`, `tablet`, `desktop`) from the request's User-Agent. A pageview adds
  the referrer on the first view of a load: the external host without `www.`, read once and kept in
  memory, and nothing of the address's query string, so `?utm_source=` sends no referrer. An event
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
  into browser storage.
- **Five gates, all before anything is queued.** Only production hosts (`ANALYTICS_HOSTS`), not
  automation (`navigator.webdriver`), not Do Not Track, Global Privacy Control or the privacy page's
  opt-out (`analyticsOptedOut`, the same question as for Umami), not a simulated visit (`?sim=` or
  `?state=`, the team on its own phones) and not a path the API would refuse (it has to match
  `^/(locale)(/slug){0,8}$`, so an encoded character is not a page). The API checks the same again.
- **Foreground time, nothing else about timing.** `ForegroundTimer` runs while the tab is visible
  and stands still while it is hidden. The seconds it added go out as an `engagement` hit (`seconds`
  1 to 1800, the path and page type of the page view it belongs to, no timestamp) when the next
  page replaces the view and on every change to hidden, through `sendBeacon`, so a tab killed on a
  phone has reported. A page view reports half an hour at most and nothing under a second; a page
  opened in a background tab earns nothing until it is looked at. The API sums the seconds per
  page and per visit start, which gives the admin its "Ø Zeit auf der Seite" and "Ø Besuchsdauer".
  No load times and no scroll positions; page speed was Umami's two Web Vitals events, off with it.
- **A page load's first flush waits for its pageview**, three seconds at most. A page's own events
  are queued while it mounts, before the layout's beacon has run, and the API attaches an event to
  a visit only once the visit's first pageview has opened it. The pageview also goes ahead of those
  events in the queue.
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

The pages are German like the rest of the admin. Traffic, Live, SEO, Suche and Tagesplaner are in
the sidebar and in ⌘K, the first four also on `g` `t`, `g` `l`, `g` `o` and `g` `u`. The admin home carries a tile with the visitors of today and how many are on the site,
the second figure a link to the live view.
Every call goes through the admin proxy as `/api/admin/analytics/…`, which maps to
`/v1/admin/analytics/…` ([the admin holds no credential](../rules/the-admin-holds-no-credential.md)).

| Page                            | Shows                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Traffic                         | eight figures against the window before (visitors, visits, views, bounce rate, visit duration, time on the page and more), who is on now, a series of any of them as a chart or a table, channels, referrers, pages with exits, entry and exit pages, countries as a list and a map, languages, browser languages, devices, browsers, systems, a crosstab of any two dimensions and every event |
| Event (`events/<name>`)         | one event's properties and values, the combinations sent together, a crosstab of any two dimensions, page types, devices, the parks, rides, shows and restaurants behind it, its days                                                                                                                                                                                                           |
| SEO (`traffic/seo`)             | what Google reports (queries and pages from the Search Console), the pages visits begin on from search engines and from AI assistants, the pages gaining and losing, 404 addresses with their referrers, parks and rides no search visit reached                                                                                                                                                |
| Suche                           | hero against header, every search field side by side, a field by page type and by device, result kinds, positions, the resting list, the days                                                                                                                                                                                                                                                   |
| Tagesplaner (`traffic/planner`) | the planner from opening to sharing: the funnel, the ways in and which of them lead to a plan, page type by device, the wizard's steps, blocks in and out, the tools, sharing and push, the parks and rides planned most, the days ([what the planner counts](trip-planner/analytics.md#in-the-admin))                                                                                          |
| Live (`traffic/live`)           | who is on the site now, a map of the last five minutes, the last 30 minutes by the minute, pages, events, channels, referrers, countries and devices, every five seconds                                                                                                                                                                                                                        |

- **Filters work like Umami's.** A press on a value in any panel filters the whole page by it: a
  channel, a referrer, a page, an entry page, a country, a language, a device, a browser,
  a system, a page type. They are `?filter=<dimension>:<value>` in the address, repeatable, each one a
  chip that takes itself off, and the event, SEO and search pages carry them too. A language is the
  language switch, not a filter. Filters combine with AND, and a second press on the same
  dimension replaces the first.
- **Data centres are left out unless asked for.** The API marks a hit from a cloud or hosting
  network (by the address's ASN, never stored) and leaves those hits out of every report by
  default, since they are programs far more often than people. The switch „Rechenzentren" in the
  filter bar and on the live page (`?datacenter=include|only`, absent for `exclude`) counts them in
  or shows them alone; `DATACENTER_SCOPES` and `DATACENTER_LABEL` in `lib/admin/site-analytics.ts`
  hold its values and words. The most read lists never count them.
- **The window, the step and the language are in the address.** The window is `?days=1|7|28|90|365` (an older `days=30` still opens, but the default is 28 days)
  or `?from=2026-10-01&to=2026-10-27` (UTC days, at most 366, not after today), the step is
  `?interval=hour|day|week|month`, the language `?locale=de`, so a view is a link, and `replace`
  keeps the back button out of it. `useTrafficFilters` reads them under a `Suspense` boundary,
  `useTrafficData` asks the proxy and keeps the previous answer on screen while a switch loads.
- **The range picker** (`range-picker.tsx`) names the window and opens the presets: Heute, Gestern,
  7, 28 and 90 Tage, Diese und Letzte Woche, Dieser und Letzter Monat, 12 Monate, and a custom first
  and last day that says why the API would refuse it. The rolling presets are `days` in the address,
  the calendar ones are dates, so a link keeps meaning the week it was copied in. A custom range
  that equals a preset lights it up. The arithmetic (`lib/admin/traffic-range.ts`, with today handed
  in) is tested by `pnpm test:admin-traffic-range`.
- **The step toggle** offers the steps that make a chart of the window: hours for two days at most
  (the API refuses more), days always, weeks from 14 days, months from 60. The API's default
  (hour for one day, day up to 92, week up to 183, month beyond) is the one shown as chosen until
  another is picked, and a step that does not suit a new window is dropped from the address. Weeks
  are ISO weeks from Monday. A first or last period the window cuts off comes back `partial`, and
  the chart shades it and the table marks it, since it is not comparable with a whole one.
- **Today is not over**, so its figures are not set against all of yesterday as a percentage: the
  tiles and the event rows name yesterday's full-day number instead. A window of more than 180 days
  has no window before (`previous` is `null`): the tiles say "Kein Vergleich", the event and SEO
  rows show a dash. The rising and falling pages are a comparison, so over 180 days the SEO page
  says to pick a shorter window instead of asking the API (`MAX_TRENDS_DAYS`).
- **Durations** are foreground seconds the facade measures (see above). "Ø Besuchsdauer" is the
  seconds of a visit averaged over its visits and "Ø Zeit auf der Seite" the seconds a view was open
  averaged over the views, as `1:42 min` or `45 s`. Pages show the second, entry pages, channels,
  referrers and the SEO landing pages the first, next to the bounce rate. A duration the
  API cannot average (no visits, nothing measured yet) is a dash with the reason, not a zero.
- **The series** (`series-panel.tsx`) lets you pick the figures to draw: views against visits
  against visitors by default, and events, views per visit, bounce rate and both durations on top.
  A chart is one unit, so counts, a ratio, a share and durations are separate charts one under the
  other, never a second y axis, and a figure keeps its colour whatever is shown beside it
  (`TRAFFIC_METRICS`). The table view lists every period with all figures, sortable by any column,
  with the window's totals underneath; the totals are the API's, since visitors, rates and averages
  of a window are not sums of their periods.
- **Visitors follow one filter on a visitor dimension, and no more.** The API counts daily unique
  visitors per language and per value of country, device, browser, OS and channel
  ([which filters](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/site-analytics.md)),
  so without a filter, or under exactly one filter on one of those five (the language is no filter),
  `visitors` is a number: the tile and the series show it, and the lists of those five dimensions
  carry "N Besucher" first in the line under each row, the country list too. Under two filters, two
  values of one, or a filter on a page, a page type, the entry page, the referrer or the browser
  language it is `null`: the tile shows a dash and says why (`VISITOR_FILTER_HINT`: "Besucher gibt
  es für einen Filter auf Land, Gerät, Browser, Betriebssystem oder Kanal, nicht für mehrere
  zugleich."), with no change chip and no line in the chart, instead of a zero. Views and visits
  stay. The hours of an hourly chart have visitors for today only, and under a filter none, so a
  chart of yesterday by the hour, or of today under a filter, has no visitors line, while the table
  still shows the day's total; `visitorsNote` picks the sentence under the series' title. A row of a
  list has visitors without a filter and under a filter on its own dimension, not under another.
- **A filter on how a visit began leaves only visit figures.** Entry page, referrer and
  channel belong to a visit, not to a page view, so under one of them the API answers `null` for
  `pageviews`, `events` and `viewsPerVisit` and refuses the page and event reports with a 400. The
  page does not ask for what it knows would fail (`unsupportedReason`, `hasVisitFilter` in
  `lib/admin/site-analytics.ts`): the tiles read "Nur Besuchswerte" or "Mit diesem Filter nicht zählbar", a
  banner says so with a button that takes the filters off, the series offers visits, bounce rate and
  visit duration, and the crosstab, the events and the search page show that note instead of an
  error. Every list names what it counts with the API's `measure` (`views`, `visits`, `exits`), so a
  page list under such a filter counts visits by their first page and says so.
- **A window can reach past the hourly rows.** The API keeps the hourly rows 90 to 97 days and the
  daily sums 400. A figure no daily sum can give (a filter on a page or an entry page, three filters,
  an event under a country, browser or system, an hourly chart) reads the hourly rows, and for older
  days it finds nothing. Every response then carries `hourlyFrom`, the first day those figures are
  complete from (`AnalyticsWindow`), and the panel shows a `Notice` under its figures
  (`HourlyNotice`, words from `hourlyNotice` in `lib/admin/site-analytics.ts`, the date from
  `germanDay`): "Diese Auswertung reicht nur bis 30.07.2026 zurück; ältere Tage gibt es nur als
  Tageswerte." When the day is not later than the window's first, the window is whole and only the
  window before it is short: "Der Zeitraum davor ist nur ab … vollständig; …, die Vergleichswerte
  sind zu niedrig." No `hourlyFrom` is nothing on the page, and no room is kept for it. The Traffic
  page's figures are daily sums for the most part, so 12 months with no filter has no notice and 12
  months under a page filter does. A window older than 400 days is empty in both and says nothing.
- **An entity can outlive its page.** An id that resolves to nothing any more (a retired park, a
  deleted show) comes back with `kind`, `name` and `url` null, and its row reads "Nicht mehr
  vorhanden" with the id and no link. The uncovered list shows the counts the API sends (how many
  of all there are, how many no search visit entered on), a rider's park beside it, and says when the
  list is cut at its limit.
- **Realtime asks for today alone**, ignores the window, the language and the filters, and repeats
  every 30 seconds while the tab is in front (`useRealtimeOverview`, shared with the home tile). The
  same count sits in the „Live“ pill in the page's header, which opens the live view.
- **The map is `public/world.svg`** (the file the homepage hero's continents are cut from), fetched
  when the panel first draws and cut into one path per country. Countries shade by a square root
  of their views, or Germany would leave every other country the same pale shade, and a press
  filters the page. The list beside it carries the same numbers.
- **Events are generic.** The list shows every name seen, blocked ones included, with the name as
  sent, a German label and sentence where `EVENT_INFO` has one, and nothing invented for the rest.
  The detail page discovers its properties from the response, and the crosstab asks the API for any
  two of `page_type`, `device`, `locale`, `day` and `prop:<key>`: "which search field, opened from
  which page" is `search_opened` by `prop:surface` against `page_type`.
- **An editor can block a name** (`PUT` and `DELETE /v1/admin/analytics/blocked-events/<name>`):
  it is not recorded any more and stays in the list, flagged, so it can be released. The button is
  not there for a lower role, and blocking asks once.
- **Rows lead somewhere.** A page opens on park.fan and, for a park or a ride, in its editor
  (`/admin/go`); a referrer opens its site; an entity opens its editor by id and its public page;
  a search field's numbers lead to `search_opened` and its siblings; a 404 address copies or opens.
- **The System page carries the statistic's own health** (`siteAnalytics` in
  `GET /v1/admin/system-health`, panel "Statistik"): the windows waiting to be written and how old
  the oldest is, the windows the writer gave up on, the visits still open, the last write in UTC,
  and today's and yesterday's drops by reason. `healthy` shows as "Läuft" or "Hängt".
- **Empty is a state.** The endpoints answer zeros until data arrives, so a window without any
  traffic says so and names the usual reasons instead of drawing flat charts.
- **Exits, browser language, crosstab.** The exit page (the last page of a visit, known when the
  visit has been idle for 30 minutes) is a panel next to the entry page, and the pages table shows
  the exits of each page and its exit rate. The browser language (the first language the browser
  sends, two letters) is a panel and a filter next to the site language. The "Kreuztabelle" panel
  crosses any two dimensions of the traffic (`GET /v1/admin/analytics/crosstab`), counting views or,
  for the questions about how a visit began and ended, visits: system by device, channel by country,
  entry by exit page. It is the component the event page uses (`crosstab-view.tsx`); an event's
  crosstab has no axis that belongs to a visit. A row or column the API cuts off is `__rest__` and
  reads "Übrige", a value that was never sent is `(none)` and reads "Keine Angabe". The exit page
  is a list and a crosstab axis, not a filter dimension: the API cannot filter by it.
- **Charts are drawn here** (`app/admin/_ui/charts.tsx`: line chart with a hover readout and a
  table view, sparkline, bar list, stacked share bar, shaded matrix), without a charting library.
  More than one series takes `CATEGORICAL` in its fixed order, so a field keeps its colour on
  every chart, and a delta is green and red only where more is better (a bounce rate that falls is
  the good news; an event that grows is neither).
- **The pure half** (windows, filters, deltas, the words for the names this build knows, the
  matrices, the series figures in `lib/admin/traffic-series.ts`) is `lib/admin/site-analytics.ts`,
  and `pnpm test:admin-site-analytics` pins it. The response types are
  `lib/api/admin-site-analytics.ts`.

### Live: `/admin/traffic/live`

The page for leaving open on a second screen. It reads `GET /v1/admin/analytics/live`
(the `LiveTraffic` type in `lib/api/admin-site-analytics.ts`), which the API answers from per-minute counters in Redis, so it
holds aggregates only and nothing about any one visitor. The pure half is
`lib/admin/live-traffic.ts`, pinned by `pnpm test:admin-live-traffic`.

- **Every five seconds while the tab is in front, never while it is hidden.** That is React Query's
  `refetchInterval` as it behaves by default; switching back asks at once. A failed ask is not
  retried: the next one is five seconds away, the dot turns grey, the header reads „Unterbrochen“
  with the time of the figures on screen, and an amber line names the error until an ask comes back.
  Before the first answer the page loads or shows the error with a retry; a site without a single
  hit in 30 minutes shows the count, the dark map and one calm sentence instead of empty charts.
- **The language is in the address** (`?locale=`), and switching it starts the board afresh, so the
  first answer in another language ripples nothing.
- **Motion supports reading the numbers and plays once per change; nothing loops.** The big count
  rolls to its new value (written into its own text node, so the page does not re-render each
  frame) and a glow behind it brightens once. On the map a country with views is filled by its
  share of the biggest (in a straight line here, not the Traffic map's square root, since the
  brightest country has to be the busiest), glows and carries a point at its centre, so Luxembourg
  is not lost. A country whose count rose sends out two rings; at most five per answer, the biggest
  rises first, and none within about the width of Germany of another, so a busy Europe sends one
  ring instead of five on top of each other (`pickRipples`). The minute chart slides left as a minute
  passes and grows its bars and line to the new values in one tween; a window that moved more than
  three minutes (a tab woken after a while) jumps instead of racing past.
- **The lists move instead of jumping** (`LiveList`, around the kit's `BarList`): each row is
  measured before and after an answer and slides from its old place (FLIP), its bar grows or shrinks
  to the new width, and a count that rose lights up in the brand colour. Rows have no background, so
  of two crossing rows the rising one stays on top and the sinking one dims. A new row fades in, a
  row that dropped out fades where it stood, out of the flow, so the panels below do not move.
- **`prefers-reduced-motion`**: no rings, no glow, no roll, no slide; every figure, shade, bar and
  row stands at its new value at once. The motions are CSS keyframes (`live.css`, loaded with the
  page only) and the Web Animations API; GSAP is not loaded.
- **The panels drop the kit's backdrop blur** ([work nobody can see is still
  work](../rules/work-nobody-can-see-is-still-work.md)): the blur would be re-read on every frame of
  motion inside them.
- **Rows lead to the day's story.** A page, a channel, a referrer, a country (also on the map) or a
  device opens Traffic for today filtered to it; a page also opens on park.fan and, for a park or a
  ride, in its editor; a referrer that is a host opens its site; an event opens its detail page for
  today. Paths, referrers and event names are what visitors sent, so they are rendered as text.
- **The map is the Traffic page's** (`useCountryPaths` in `app/admin/traffic/_lib/country-paths.ts`,
  shading by `countryShadePercent` in `lib/admin/world-map.ts`). The loader also places each
  country's marker at the centroid of its largest outline (`largestRing`), so the United States'
  point lands on the mainland and not between it and Alaska.
- **Countries are upper case** (`ZZ` is a visitor whose country is unknown); the map keys them as
  such. If Redis is away the API answers 503 and the view shows its grey failure state.
- **Times are this computer's clock**, unlike the UTC days of the other pages: a live view is read
  against the clock on the wall.

### Google Search Console

The SEO page's first section holds what Google itself reports: how often a page appeared in the
results (impressions), how often it was clicked, the click rate (CTR) and the average position. It
is the other end of the funnel the counter sees: the counter knows the visits that arrived, Google
knows the searches that did not lead here. The API imports the data (a nightly job and a button) and
stores it for 16 months; the frontend only reads
`GET /api/admin/search-console/{status,queries,pages,series}` and queues an import with
`POST …/import`. The types are `lib/api/admin-search-console.ts`, the pure half
(`lib/admin/search-console.ts`) is pinned by `pnpm test:admin-search-console`, and the components are
`search-console-section.tsx` (status, figures, charts) and `search-console-tables.tsx` (queries,
pages).

- **Setup is the owner's, on the API**, and has its own page there: [Search Console
  setup](https://github.com/PArns/v4.api.park.fan/blob/main/docs/admin/search-console-setup.md)
  (the section's hint links to it, `SEARCH_CONSOLE_SETUP_DOC`). In short: a Google service account
  with a JSON key and the Search Console API enabled, that account added as a user of the property,
  and `GSC_SERVICE_ACCOUNT_JSON` and `GSC_SITE_URL` (`sc-domain:park.fan`) on the API. Without them
  `status.configured` is `false` and the section is one hint with the two variables; when they are
  set but unusable, `lastError` says why and the hint shows it. The first import backfills 16 months
  and takes minutes; until it has stored rows the section says so instead of drawing zeros. The API's
  [Search Console](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/search-console.md)
  page has the contract.
- **The status line** names the property, when the last import ran, which days are stored and how
  many rows, and shows the last import's error text (Google's words, rendered as text). A failed
  import does not hide the rows of the one before. „Jetzt importieren“ is for an editor (`useCan`);
  the API answers 202 (a second request within a minute queues nothing, and 409 means the
  module is off, which the page answers by asking for the status again) and sends no "running"
  flag, so the page asks for the status every six seconds for up to five minutes and treats a new
  `lastImportAt` or `lastError` as the end. The data
  reads carry `lastImportAt` in their key, so the numbers refresh when the import lands.
- **Google is days behind, and counts in Pacific time.** It finalises the last two or three days
  late, so a rolling window ends at the last day with data, as Search Console's "Letzte 28 Tage" does, and
  the section names the window the API echoed ("28 Tage bis 26.10.2026 (letzter Tag mit Daten)"). The API fills quiet days inside the window with zeros, stops the series at the last
  day with data and flags a cut period with `partial: true`; the charts shade those (the page works
  the cut periods out itself only when the API flags none). Google's days are Pacific, not UTC like
  the rest of this page: a window of UTC dates reads Google's days of the same dates.
- **The figures are Google's, not the counter's.** Only the window and the language
  (`?locale=`, which keeps the pages whose path starts with that language) apply; the filters of the
  other panels (`?filter=`) are not sent, since the API cannot filter Google's rows by a channel or a
  browser, and the section says so while one is set. The tiles are the window's totals against the
  window before: clicks and impressions as a percentage, the click rate in percent points, the
  position in places (a position that falls from 8 to 4 is four places better, not "minus 50
  percent"). The window before is not the whole of it: Google lags, so the API compares with as many
  days from the start of the window before as the window has data for, and the tooltip says so. Over
  180 days, or where those days have no data, there is nothing to compare. A position is `null`
  without impressions (a zero would read as the best rank), in the tiles, the tables and the
  charts: a dash, no change chip, a gap in the line.
- **The tiles come from the pages read** with `limit=1`, never from the queries read. Google leaves
  the queries it anonymises (often a third of the impressions) out of the queries' totals, so those
  sit below the series; the pages and the series count everything. The queries table says so, since
  its clicks add up to less than the tile. A drill-down narrows the tables and never the tiles.
- **Four charts, not one.** Clicks and impressions differ by a factor of thirty and more, a click
  rate is a share and a position counts places, so one axis would flatten all but one of them. Each
  figure has its own chart and its own axis in the same colour on every page
  (`SEARCH_CONSOLE_METRICS`), in the step of the window (day, week or month; Google reports whole
  days, so there is no hour). The position axis counts from 0 and is not turned over, so a falling
  line is the good news, and the title says „kleiner ist besser“. A period without impressions has
  no click rate and no position: the line breaks there.
- **Queries and pages narrow each other.** A press on a query lists the pages Google shows for it
  (`?gscQuery=`), a press on a page lists its queries (`?gscPage=`); both are chips in the panel they
  narrow, they take themselves off, and the pressed row is marked. The own-counter columns of the pages
  list (visits that began there from a search engine, bounce rate, average visit) are the
  page's in the whole window, whatever the query, and the strip says so. A page the counter saw no
  search visit on has dashes there. Each query has a link that opens the Google results for it. A
  query is what somebody typed, so it is rendered as text.
- **A change is the API's difference to the window before**: `change.clicks` as a signed count,
  `change.position` as signed places, negative being better. A row without one (over 180 days, or no
  row before) has a dash with the reason.

### Reading the numbers

- **Visitors over a window are the sum of the daily uniques.** Somebody who comes back on another
  day counts again, which the counter cannot avoid without keeping a longer-lived identifier.
  Under a filter on one country, device, browser, system or channel it is the sum of the daily
  uniques with that value, and a visitor counts once per value and day.
- **A visit ends after 30 minutes without a page view**; the entry page, the referrer and the channel
  count at its start, so their figures are visits, not page views.
- **The bounce rate is the visits that saw one page over all visits**, per entry page, channel or
  referrer. A rate over no visits is no rate: the tile says so instead of `0 %`, which
  is an answer.
- **Durations are foreground time**, so a tab left in the background earns nothing, and they start
  with the first browser that sent the new hit: older periods have none, which reads as a dash.
- **The channel comes from the referrer on the API**: search, ai, social, referral or direct. A
  visit without a referrer is direct, and so is one from a browser that strips it. A link's
  `utm_` parameters are not read, so a newsletter or an ad is a referral under its own host, or
  direct.
- **Visitors from a different phone, network or browser are different visitors**, as in Umami.
- **Do Not Track, Global Privacy Control, the opt-out and bots are not in it.** The figures are
  lower than the traffic by that share.
- **Search "opened"** is a field clicked or focused. The hero is one surface on a phone and at a desk,
  and the device split tells them apart, though the hero's layout follows the window width and the
  device class follows the User-Agent. The click rate is results and suggestions opened over
  openings, and "ohne Treffer" is the share of typed searches that found nothing.

## Known limits

- A filter no daily sum serves reaches back only as far as the hourly rows (90 to 97 days), and the
  panel says so in a notice. A figure a cuboid serves, which is most of the Traffic page, reaches
  400 days.

- The planner events say nothing about the park. Storing the id in the planner's store would.
- A path with an encoded character is dropped, as is anything outside the patterns above.
- The device class is the User-Agent's word, not the screen's. An iPad on iPadOS 13 or later sends
  the User-Agent of a Mac and counts as a computer, as does a phone or tablet that asked for the
  desktop site; an Android device that says no `Mobile` and is no tablet, a television say, counts
  as a tablet. The API's rule is in [site statistic](https://github.com/PArns/v4.api.park.fan/blob/main/docs/frontend/site-analytics.md).
- The path breakdown holds every path that was seen, and a 404 is a path, so a crawler that tries
  thousands of addresses fills the 404 list. Blocking cannot help there, since it names events.
- The Search Console endpoints also take `country` (Google's alpha-3, `deu`) and `device`, and the
  series takes the page and the query as well; the section offers none of them yet, so the charts
  and tiles never follow a drill-down.
- The SEO page's list of parks and rides without a search visit assumes the API answers with a name
  and the public address of each; it is the one endpoint of the set this page could not check
  against a running API.
