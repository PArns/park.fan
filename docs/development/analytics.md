# Analytics

What park.fan counts, in which system, and what it costs. Two systems share the work. **Umami
Cloud** is billed per stored event and keeps the pageviews and the two Web Vitals events. **Our own
counter** on api.park.fan is cookieless, counts per day and costs nothing per event, so it carries
every other custom event, a view of every page and the reads behind the most-read lists. This page is the event inventory for both; open
it before adding, changing or removing an event. How the own counter works, from the facade to the
admin dashboards, is [site analytics](../features/site-analytics.md). The budget rule is
[Umami event budget](../rules/umami-event-budget.md).

## Which system counts what

| What                               | Where                                     | Why there                                                                  |
| ---------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| Pageviews                          | Umami, and our own counter                | Umami's dashboard stays the cross-check; ours adds the page type and entry |
| `web-vital-inp`, `web-vital-cls`   | Umami                                     | They carry element selectors, which the closed schema of ours cannot hold  |
| Every other custom event           | Our own counter (`trackSiteEvent`)        | A property is free there and billed as an event in Umami                   |
| Reads of a post, a park and a ride | Our own counter, as the event `page_read` | Dwell based, feeds the rankings ([most read](../features/most-read.md))    |

The Umami tracker is the `<Script>` in `app/[locale]/layout.tsx`; the two Web Vitals events go
through `components/analytics/web-vitals-reporter.tsx` and `trackEvent` in
`lib/analytics/umami.ts`, which no-ops when the script is blocked (ad blocker, Do Not Track), so a
call site never needs a guard. Our own counter's calls go through `trackSiteEvent`
(`lib/analytics/site-analytics.ts`), which types the events the site sends and applies the same
gates.

## How Umami bills

The plan is Umami Cloud Hobby, **100,000 events a month**, and the billed unit is a stored row,
not a user action ([Cloud FAQ](https://docs.umami.is/docs/cloud/faq)):

| What                                     | Billed as          |
| ---------------------------------------- | ------------------ |
| One pageview                             | 1                  |
| One custom event with no properties      | 1                  |
| One custom event with 5 properties       | **6**              |
| One `umami.identify()` with 3 properties | **3, per session** |

The dashboard's usage chart splits this into Events, Event data (event properties) and Session
data (identify properties). In August 2026 about 70 % of the bill was properties and the plan was
heading for ~112k; the last export before the filter events (2026-08-30 to 2026-09-29) read 84,288.
Cardinality is free: a property costs one row whatever its value, so a closed union of eight
sources costs what two would.

## What Umami no longer gets, and why

Never what Umami already records (page URL, referrer, screen, `navigator.language`, OS), never what
a sibling property implies, and a **load**-fired event is priced by its property count times every
qualifying pageview. These were removed for those reasons:

| Removed                                                             | Because                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `identifyVisitor()` (3 session properties)                          | the whole Session-data band; two of three duplicated native data        |
| LCP, TTFB, FCP events; INP's other 5 properties; `good` INP samples | the largest single line, fired on every pageview with an interaction    |
| 8 unused `track*` helpers                                           | dead code inviting a 3-property event that fires on view                |
| Every custom event except the two Web Vitals events                 | five properties cost six rows; they now cost nothing in our own counter |

## Umami's events

The search events (`search_opened`, `search_typed`, `search_no_results`, `search_result_clicked`,
`search_browse_clicked`, `search_view_all`) are no longer Umami's: our own statistic counts them,
see [site search → what is counted](../features/site-search.md#what-is-counted).

| Event           | Fires                                                 | Properties                             |
| --------------- | ----------------------------------------------------- | -------------------------------------- |
| `web-vital-inp` | a non-`good` INP sample                               | `value`, `target`, `phase`, `path`     |
| `web-vital-cls` | a tenth of non-`good` CLS samples (`CLS_SAMPLE_RATE`) | `value`, `target`, `loadState`, `path` |

### Web Vitals

INP is sent only for non-`good` samples. CLS is sent for **a tenth** of non-`good` samples, and the
rate is the whole reason it is affordable: at a p75 of 0.22 about half of ~1.6k daily pageviews
qualify, which unsampled is ~800 × 5 rows ≈ 120k a month, more than the plan. It exists because
Lighthouse scores the site CLS 0 while CrUX reports 0.22: Lighthouse neither scrolls nor interacts.
`target` turns "CLS is 0.22" into a file to open; `loadState` tells a late skeleton from a shift
after a scroll. Drop `loadState`, and the event, once the sources are known. These two stay in Umami
because `target` is an element selector, free text, which our own counter refuses by rule.

## Our own events

The API takes any event name, so the list below is what the site sends today, not a schema. A hit
carries the page's path, page type and language beside the event, and the first pageview of a load
the referrer, so none of those is a property. The window width and the address's query string are
not read: the API takes the device class from the User-Agent, and a link's `utm_` parameters are not
collected. `entity` is the
UUID of the park, ride, show or restaurant an event is about, sent only where the call site holds it.
`SiteEventMap` in `lib/analytics/site-analytics.ts` types these events, so a call with a value outside
a list does not compile; an event outside the map is accepted untyped and shows up in the admin with
its name. No event fires in a simulated visit (`?sim=` or `?state=` in the URL, which the team uses
on its own phones), and `isSimulatedVisit` is read from the URL because `isSimulationEnabled()` is
false in every built bundle. The six `search_*` events and their dashboard are in
[site search](../features/site-search.md).

### What an event never carries

A property is a short word from a list the code chooses, a number, or a flag: at most eight, the key
`^[a-z][a-z0-9_]{0,31}$`, a string value `^[\p{L}\p{N}][\p{L}\p{N} ._:/+#-]{0,119}$`. **Never free text and
never anything that identifies a person**: no search query, no name or address somebody typed, no id of a reader, no element selector. A slug of a
page or a closed union is fine; whatever a person wrote is not. **Nothing derived from where the
visitor is** goes in either: `nearby_parks_loaded` and the compass events carry no park, because
the park an in-park visitor stands in is a place, and an entity would put it next to a browser and a
day. The path of a park page is the page the visitor opened, which is a different thing. The facade drops a property that
fails the patterns, and the API checks again, but the patterns cannot tell a name from a slug, so
the rule is on the call site, and `trackSiteEvent` says it too.

| Event                        | Fires                                                                                              | Properties                                                 | Entity           |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------- |
| `favorite_add` / `_remove`   | a favorite star switched on / off (`FavoriteStar`)                                                 | `type` (park, attraction, show, restaurant)                | the starred item |
| `nearby_permission`          | `granted` once, when the browser starts returning a position; `denied` for a refusal now           | `result`                                                   |                  |
| `nearby_parks_loaded`        | the first nearby result of a type and source in a tab, on load                                     | `type` (nearby_parks, in_park), `source` (gps, ip)         |                  |
| `language_switched`          | a language picked in `LocaleSwitcher`                                                              | `from`, `to`                                               |                  |
| `theme_toggled`              | the theme switch has applied the new theme                                                         | `theme`                                                    |                  |
| `tab_changed`                | a park page tab switched (`useTabHashRouting`); the calendar is a page, so a pageview              | `tab`                                                      | the park         |
| `location_banner_clicked`    | the location banner's button                                                                       | none                                                       |                  |
| `blog_toast_opened`          | the new-posts toast followed to its post                                                           | none                                                       |                  |
| `glossary_term_viewed`       | once per glossary term page view                                                                   | `term` (English id)                                        |                  |
| `glossary_category_filtered` | a category filter on the glossary overview                                                         | `category` (`none` when cleared)                           |                  |
| `glossary_searched`          | 600 ms after the glossary search holds three or more characters; the query is not sent             | none                                                       |                  |
| `preferred_source_clicked`   | the footer's "preferred source on Google" link                                                     | none                                                       |                  |
| `ride_alert_set`             | a wait-time alert saved (opening the dialog is not counted)                                        | `source` (card, central)                                   | the ride         |
| `ride_alert_removed`         | an alert removed, once the server confirmed it                                                     | none                                                       | the ride         |
| `show_follow_add`            | a show-start reminder turned on                                                                    | `source` (card, panel)                                     | the show         |
| `show_follow_remove`         | a show reminder turned off, once the server confirmed it                                           | none                                                       | the show         |
| `planner_opened`             | the planner panel's closed → open edge                                                             | `source`                                                   |                  |
| `plan_day_started`           | a park and date gain their first block                                                             | none                                                       |                  |
| `plan_optimized`             | "Tag optimieren" / "alle Headliner", only where the plan changed                                   | none                                                       |                  |
| `planner_closed_empty`       | the panel closes and no day gained its first block in that opening                                 | none                                                       |                  |
| `attraction_filter_used`     | a park page filter switched **on**; the height slider on its first value                           | `filter`                                                   | the park         |
| `covered_ride_opened`        | a ride opened from „Überdacht in der Nähe" in the rain banner                                      | none                                                       |                  |
| `compass_viewed`             | once per page view, the first time the compass is on screen                                        | none                                                       |                  |
| `compass_heading_on`         | once per page view, when the phone's compass starts sending                                        | none                                                       |                  |
| `compass_ride_pinned`        | a tap on a marker pins a ride                                                                      | none                                                       |                  |
| `compass_ride_opened`        | a ride page opened from the compass                                                                | `from` (bar, list)                                         |                  |
| `compass_pill_clicked`       | the hero's „Zum Kompass" tapped                                                                    | none                                                       |                  |
| `outbound_link_clicked`      | a click, middle click included, on a park's website, ticket, map or social link                    | `target` (park_website, tickets, maps, other)              | the park         |
| `pwa_installed`              | the browser's `appinstalled` event, however the app was installed                                  | none                                                       |                  |
| `page_read`                  | five seconds in the foreground on a post, a park or a ride, once per tab (`PageViewBeacon`)        | `kind` (article, news, park, attraction), `key` for a post | the park or ride |
| `article_read`               | a guide or news post is read to 25, 50, 75 and 100 percent, each once, after the same five seconds | `depth`                                                    |                  |
| `calendar_day_opened`        | a day of a park's crowd calendar opened                                                            | none                                                       | the park         |
| `calendar_month_changed`     | the month stepper of the calendar                                                                  | `direction` (previous, next, current)                      | the park         |
| `push_permission`            | the answer to the browser's push question, only when the permission was undecided before it        | `result` (granted, denied, dismissed)                      |                  |
| `error_shown`                | an error page is rendered; the message is not sent                                                 | `boundary` (page, maintenance, global)                     |                  |
| `share_clicked`              | a share row button (WhatsApp, Facebook, X, copy link) or the planner's share link                  | `target` (whatsapp, facebook, x, link, trip_plan)          |                  |

### The pageview's extras

A pageview is not an event, but three things beside the path answer questions the way one does.
The first view of a load adds the referrer host, read once and kept in memory (`pageLoadOrigin`),
and the API derives the channel (search, ai, social, referral, direct), the device class and the
country. A page the 404 page renders is counted as page type `not_found`, with the
path asked for, which is how the admin lists dead ends with the pages that sent people there
(`NotFoundMarker`). The API also reads the first language of the `Accept-Language` header and the
last page of a visit; neither needs anything from the client.

### Foreground time

The one thing measured over time is how long a page view was in the foreground, as an `engagement`
hit beside the pageview, not as an event. `ForegroundTimer` runs while the tab is visible and
stands still while it is hidden; the facade reports the seconds it added when the next page replaces
the view and on every change to hidden, through `sendBeacon`, so a tab killed on a phone has
reported. Between 1 and 1800 seconds per report, half an hour at most per page view, no timestamp,
the same gates as every other hit. The API sums them per page and per visit start, which is what the
admin shows as time on the page and visit duration. Nothing else about timing is counted: no load
times, no scroll depth beyond the four steps of `article_read`. The Web Vitals stay with Umami, whose
element selectors the closed patterns of this counter refuse.

### The planner funnel

Three events, read together: was the panel opened, did a day get a first block, did anybody let it
sort itself. 579 openings gave 197 first blocks in the September export, counted in Umami before the
move.

- **`planner_opened` fires on the edge, not the request.** `plannerUi.requestOpen` also fires on a
  second calendar day pressed while the panel is up and when the wizard finishes inside it; the
  launcher watches its own `open` state instead. `source` is the closed union
  `PlannerOpenedSource` (`lib/planner/ui-store.ts`: tab, header, park-header, calendar-day,
  wizard, plan-list, shared-link, home-hero, kids-page), because which way in earns its place is
  the decision the event answers.
- **`plan_day_started` fires on the empty → not-empty transition** of a park and date, however the
  block got there, so a plan being filled in counts once, not once per ride. Not on finishing the
  wizard (an intention, not a plan), and no `date`.
- **`plan_optimized`** sends nothing about the minutes saved or which button it was.
- **`planner_closed_empty` is at most one per opening**: `trackPlannerOpened` starts an opening,
  `trackPlanDayStarted` marks it, `trackPlannerClosed` fires and ends it
  (`lib/analytics/planner-funnel.ts`, the one module that keeps the state, because the ends sit in
  different files). A day started while the panel is closed belongs to no opening.
- **No park on any of the three.** The planner keeps its plan by the park's slug and stores no UUID,
  and the entity is a UUID, so the three events cannot say which park. Storing the id in
  `PlannerPark` would, at the price of a store migration.

### Filters and the rain plan

`filter` is the closed union `AttractionFilterName`: open, off_season, wet, fast_pass,
single_rider, covered, height, sort_wait. The wet pill has three states and counts once, on the
press that leaves „off"; the phone's chips only turn a filter off and count nothing. The park's UUID
is the entity, handed down from `TabsWithHash` to the panel and, through `ParkHeightFilterContext`,
to the second height slider in the „Mit Kindern" block. `pnpm test:umami-events` pins the funnel
and the simulated-visit skip.

### The in-park compass

One question, whether anybody standing in a park uses the compass (under the homepage hero and at
the top of that park's page), as a funnel of five events. Both pages send the same events; the
hit's page type and path say which.

- **Seen, not mounted.** `compass_viewed` waits for the compass to be on screen, once per page
  view. The in-park page view itself is already `nearby_parks_loaded` with `type: in_park`.
- **No platform, no park.** The compass events send no entity, since an in-park visitor's park is
  derived from their position. The hit's browser and OS family say the platform, so on iOS
  `compass_heading_on` against `compass_viewed` says how often „Kompass einschalten" is tapped.
- **`from` is the one property** because the bar under the dial and the list below it are two
  designs of one link, and which one people follow decides where the effort goes.
- **Not sent:** letting go of a pin, every turn of the phone, the ride ahead, the distance. Nothing
  fires in the `?sim=compass` demo.

### Outbound links and the install

Park pages are Server Components, and a client island per link would hydrate on every one of some
35,000 pages. A link therefore carries two data attributes (`outboundLinkAttributes`,
`lib/analytics/outbound-link.ts`: `data-outbound` with the target, `data-outbound-entity` with the
park's UUID) and `OutboundLinkTracker`, mounted once in the locale layout, listens for clicks on
the document. `LinkBandLink` takes the attributes as its `outbound` prop. `pwa_installed` listens
for `appinstalled` where `lib/pwa/install-store.ts` already does, so an install through the
browser's own menu counts too.

## The tracker's attributes

- **`data-exclude-hash="true"`.** The tracker patches `pushState` and `replaceState` and sends a
  pageview whenever the URL changes, hash included. `lib/hooks/use-tab-hash-routing.ts` (every
  park tab switch), `components/parks/park-calendar-grid.tsx` (every month step) and
  `components/faq/crowd-calendar-faq-link.tsx` write a hash without navigating; each was a billed
  phantom pageview. Hash-based UI state needs nothing more, but **do not remove the attribute**.
- **`data-exclude-search="true"` and `data-before-send`.** The search page is `/search?q=…` and
  puts the query in its title, and the tracker sends the URL, the previous page as referrer and the
  title. `data-exclude-search` drops the query from the first two; the hook the layout defines
  first (`UMAMI_BEFORE_SEND_SCRIPT` in `lib/analytics/umami.ts`) drops the title on any page with a
  query string. A search term never reaches Umami, which the privacy policy states.
- **`data-domains`** is `ANALYTICS_HOSTS` (`lib/analytics/opt-out.ts`: `park.fan`,
  `www.park.fan`). A host missing from it is silently absent from the stats and from both of our
  own counters, the [most-read beacon](../features/most-read.md) and the
  [site statistic](../features/site-analytics.md), which read the same constant.
- **`data-do-not-track="true"`.** A browser sending DNT sends nothing at all, so the visitor count
  reads low by the DNT share (typically 3–8 %). It is a choice, and section 4 of the privacy policy
  promises it, so the attribute cannot go without changing that text first.
  `analyticsOptedOut()` is the same question for both of our counters: DNT in each spelling Umami
  reads, the `umami.disabled` flag the privacy page's opt-out sets, and Global Privacy Control,
  which Umami itself does not read.

## Reading the dashboard

From Umami's [metric definitions](https://docs.umami.is/docs/metric-definitions): **Visitors** are
unique sessions, a hash of website, hostname, User-Agent, IP and a salt that rotates monthly;
**Visits** are hashed with an hourly salt; **Views** are all events; a **Bounce** is a visit with
one event. So:

1. No cookies, no cross-device identity: one person on phone and laptop, or on mobile data and
   then Wi-Fi, is two visitors.
2. "Unique" does not survive a month boundary: a visitor count over a longer range counts a
   returning visitor again from the 1st.
3. The count is structurally low by the DNT share (above).

How the figures of our own counter read (visitors, visits, the sum of daily uniques) is in
[site analytics](../features/site-analytics.md#reading-the-numbers).

## Adding an event

1. The API needs no change: it takes any name that matches `^[a-z][a-z0-9_]{1,47}$` and stores what
   comes. To have the build check the properties, add the event to `SiteEventMap` here, and give it
   a line in `EVENT_INFO` (`lib/admin/site-analytics.ts`), without which the build fails, so the
   dashboard lists a German label and the moment it fires. An event outside the map works too, and
   the admin shows it by name until it has a line.
2. Call `trackSiteEvent(name, props, entity?)` at the call site. It needs no guard: it does nothing
   off the production hosts, under Do Not Track, Global Privacy Control, the opt-out, automation or a
   simulated visit. Check [what an event never carries](#what-an-event-never-carries) first.
3. Pass the UUID as `entity` only where the API's row takes one and the call site already holds it.
   Never fetch an id to have one.
4. Add it to the inventory above with when it fires and why each property is worth keeping.
5. Something that has to go to Umami (nothing does today) uses `trackEvent` and is priced by the
   [budget rule](../rules/umami-event-budget.md) first.
