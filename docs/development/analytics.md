# Analytics (Umami)

What park.fan sends to Umami, what each event costs, and how to read the dashboard. This page is
the event inventory `lib/analytics/umami.ts` points to; open it before adding, changing or removing
an event. The budget rule itself is [Umami event budget](../rules/umami-event-budget.md).

The tracker is the `<Script>` in `app/[locale]/layout.tsx`; every event goes through a `track*`
helper in `lib/analytics/umami.ts` (names in `UMAMI_EVENTS`), the two Web Vitals events through
`components/analytics/web-vitals-reporter.tsx`. `trackEvent` no-ops when the script is blocked (ad
blocker, Do Not Track), so a call site never needs a guard.

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

## What is not sent, and why

Never what Umami already records (page URL, referrer, screen, `navigator.language`, OS), never
what a sibling property implies, and price a **load**-fired event by its property count times every
qualifying pageview. Removed for those reasons:

| Removed                                                             | Because                                                                |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `locale`, `browser_language`, `path`                                | already in the payload (`/de/glossar/…` names its locale)              |
| `in_park`                                                           | `type === 'in_park'`                                                   |
| `geo_allowed`                                                       | `source === 'gps'`                                                     |
| `hasQuery`                                                          | `queryLength > 0`                                                      |
| `rating` (INP)                                                      | a threshold on `value`                                                 |
| `parkId` next to `parkName`                                         | the same park twice                                                    |
| `nearby_in_park_detected`                                           | `nearby_parks_loaded` with `type: 'in_park'`                           |
| `count` on `nearby_parks_loaded`                                    | 5,559 rows a month, which paid for the three filter and planner events |
| `identifyVisitor()` (3 session properties)                          | the whole Session-data band; two of three duplicated native data       |
| LCP, TTFB, FCP events; INP's other 5 properties; `good` INP samples | the largest single line, fired on every pageview with an interaction   |
| 8 unused `track*` helpers                                           | dead code inviting a 3-property event that fires on view               |

## Event inventory

The search events (`search_opened`, `search_typed`, `search_no_results`, `search_result_clicked`,
`search_browse_clicked`, `search_view_all`) are no longer Umami's: our own statistic counts them,
see [site search → what is counted](../features/site-search.md#what-is-counted).

| Event                        | Fires                                                                                      | Properties                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `favorite_add` / `_remove`   | a favorite star switched on / off (`FavoriteStar`)                                         | `type` (park, attraction, show, restaurant), `name`                      |
| `nearby_permission_granted`  | once, when the browser starts returning a position                                         | none                                                                     |
| `nearby_permission_denied`   | a refusal now, not one stored from an earlier visit                                        | none                                                                     |
| `nearby_parks_loaded`        | once per new nearby result (**on load**)                                                   | `type` (nearby_parks, in_park), `source` (gps, ip), `parkName` in a park |
| `language_switched`          | a language picked in `LocaleSwitcher`                                                      | `from`, `to`                                                             |
| `theme_toggled`              | the theme switch has applied the new theme                                                 | `theme`                                                                  |
| `tab_changed`                | a park page tab switched (`useTabHashRouting`); the calendar is a page, so a free pageview | `tab`, `parkName`                                                        |
| `location_banner_clicked`    | the location banner's button                                                               | none                                                                     |
| `blog_toast_opened`          | the new-posts toast followed to its post                                                   | none                                                                     |
| `glossary_term_viewed`       | once per glossary term page view                                                           | `term_id` (English id)                                                   |
| `glossary_category_filtered` | a category filter on the glossary overview                                                 | `category` (`none` when cleared)                                         |
| `glossary_searched`          | 600 ms after the glossary search holds three or more characters                            | `queryLength`                                                            |
| `preferred_source_clicked`   | the footer's "preferred source on Google" link                                             | none                                                                     |
| `ride_alert_set`             | a wait-time alert saved (opening the dialog is not counted)                                | `source` (card, central)                                                 |
| `ride_alert_removed`         | an alert removed                                                                           | none                                                                     |
| `show_follow_add`            | a show-start reminder turned on                                                            | `source` (card, panel)                                                   |
| `show_follow_remove`         | a show reminder turned off                                                                 | none                                                                     |
| `planner_opened`             | the planner panel's closed → open edge                                                     | `source`                                                                 |
| `plan_day_started`           | a park and date gain their first block                                                     | `parkName`                                                               |
| `plan_optimized`             | "Tag optimieren" / "alle Headliner", only where the plan changed                           | `parkName`                                                               |
| `planner_closed_empty`       | the panel closes and no day gained its first block in that opening                         | none                                                                     |
| `attraction_filter_used`     | a park page filter switched **on**; the height slider on its first value                   | `filter`                                                                 |
| `covered_ride_opened`        | a ride opened from „Überdacht in der Nähe" in the rain banner                              | none                                                                     |
| `compass_viewed`             | once per page view, the first time the compass is on screen                                | none                                                                     |
| `compass_heading_on`         | once per page view, when the phone's compass starts sending                                | none                                                                     |
| `compass_ride_pinned`        | a tap on a marker pins a ride                                                              | none                                                                     |
| `compass_ride_opened`        | a ride page opened from the compass                                                        | `from` (bar, list)                                                       |
| `compass_pill_clicked`       | the hero's „Zum Kompass" tapped                                                            | none                                                                     |
| `web-vital-inp`              | a non-`good` INP sample                                                                    | `value`, `target`, `phase`, `path`                                       |
| `web-vital-cls`              | a tenth of non-`good` CLS samples (`CLS_SAMPLE_RATE`)                                      | `value`, `target`, `loadState`, `path`                                   |

`feedback_opened` is declared in `UMAMI_EVENTS` but nothing sends it.

### The planner funnel

Three events, one property each, read together: was the panel opened, did a day get a first
block, did anybody let it sort itself. 579 openings gave 197 first blocks in the September export.

- **`planner_opened` fires on the edge, not the request.** `plannerUi.requestOpen` also fires on a
  second calendar day pressed while the panel is up and when the wizard finishes inside it; the
  launcher watches its own `open` state instead. `source` is the closed union
  `PlannerOpenedSource` (`lib/planner/ui-store.ts`: tab, header, park-header, calendar-day,
  wizard, plan-list, shared-link, home-hero, kids-page), because which way in earns its place is
  the decision the event answers. No `parkName`: from the edge tab there often is none.
- **`plan_day_started` fires on the empty → not-empty transition** of a park and date, however the
  block got there, so a plan being filled in costs one row, not one per ride. Not on finishing the
  wizard (an intention, not a plan), and no `date` (a second row per planned day for a question
  nobody asked).
- **`plan_optimized`** sends nothing about the minutes saved or which button it was. `parkName`
  rather than the slug, matching `tab_changed` and `nearby_parks_loaded`, so reports group on one
  key.
- **`planner_closed_empty` is at most one per opening**: `trackPlannerOpened` starts an opening,
  `trackPlanDayStarted` marks it, `trackPlannerClosed` fires and ends it. A day started while the
  panel is closed belongs to no opening.

### Filters and the rain plan

`filter` is the closed union `AttractionFilterName`: open, off_season, wet, fast_pass,
single_rider, covered, height, sort_wait. The wet pill has three states and counts once, on the
press that leaves „off"; the phone's chips only turn a filter off and count nothing. Each costs
2 rows (`attraction_filter_used`) or 1 row (`covered_ride_opened`), under 1,000 a month.

`attraction_filter_used`, `covered_ride_opened` and `planner_closed_empty` skip a simulated visit
(`isSimulatedVisit`: `?sim=` or `?state=` in the URL). It reads the URL because
`isSimulationEnabled()` is false in every built bundle. `pnpm test:umami-events` pins the three.

### The in-park compass

One question, whether anybody standing in a park uses the compass (under the homepage hero and at
the top of that park's page), as a funnel of five events. Both pages send the same events; Umami
records the page.

- **Seen, not mounted.** `compass_viewed` waits for the compass to be on screen, once per page
  view. The in-park page view itself is already `nearby_parks_loaded` with `type: in_park`.
- **No platform, no park.** Umami records the OS, so on iOS `compass_heading_on` against
  `compass_viewed` says how often „Kompass einschalten" is tapped.
- **`from` is the one property** because the bar under the dial and the list below it are two
  designs of one link, and which one people follow decides where the effort goes.
- **Not sent:** letting go of a pin, every turn of the phone, the ride ahead, the distance. Nothing
  fires in the `?sim=compass` demo, which is the team testing on its own phones.

### Web Vitals

INP is sent only for non-`good` samples. CLS is sent for **a tenth** of non-`good` samples, and the
rate is the whole reason it is affordable: at a p75 of 0.22 about half of ~1.6k daily pageviews
qualify, which unsampled is ~800 × 5 rows ≈ 120k a month, more than the plan. It exists because
Lighthouse scores the site CLS 0 while CrUX reports 0.22: Lighthouse neither scrolls nor interacts.
`target` turns "CLS is 0.22" into a file to open; `loadState` tells a late skeleton from a shift
after a scroll. Drop `loadState`, and the event, once the sources are known.

## The tracker's attributes

- **`data-exclude-hash="true"`.** The tracker patches `pushState` and `replaceState` and sends a
  pageview whenever the URL changes, hash included. `lib/hooks/use-tab-hash-routing.ts` (every
  park tab switch), `components/parks/park-calendar-grid.tsx` (every month step) and
  `components/faq/crowd-calendar-faq-link.tsx` write a hash without navigating; each was a billed
  phantom pageview. Hash-based UI state needs nothing more, but **do not remove the attribute**.
- **`data-domains`** is `ANALYTICS_HOSTS` (`lib/analytics/opt-out.ts`: `park.fan`,
  `www.park.fan`). A host missing from it is silently absent from the stats and from the page-view
  beacon behind the [most-read lists](../features/most-read.md), which reads the same constant.
- **`data-do-not-track="true"`.** A browser sending DNT sends nothing at all, so the visitor count
  reads low by the DNT share (typically 3–8 %). It is a choice, not a legal requirement (Umami is
  cookieless; the privacy policy bases it on Art. 6(1)(f) GDPR), but since October 2026 section 4
  of the privacy policy promises it, so the attribute cannot go without changing that text first.
  `analyticsOptedOut()` is the same question for the page-view beacon: DNT in each spelling Umami
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

## Adding an event

1. Add the name to `UMAMI_EVENTS` and a `track*` helper with a doc comment saying when it fires.
2. Price it: on a click it is once per intent, on load it is its row count on every qualifying
   pageview.
3. Apply [the budget rule](../rules/umami-event-budget.md) to every property.
4. Add it to the inventory above with its properties and why each one is worth a row.
