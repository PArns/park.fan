# Analytics (Umami)

park.fan uses [Umami Cloud](https://cloud.umami.is) on the **Hobby plan: 100,000 events/month**.
The tracker is loaded in `app/[locale]/layout.tsx`; all event helpers live in
`lib/analytics/umami.ts`.

---

## 1. How Umami bills — and why properties, not pageviews, blow the budget

From the [Cloud FAQ](https://docs.umami.is/docs/cloud/faq):

> Usage is measured by counting hits to a website and any custom events or custom event data
> stored. Each website hit counts as one event. If you save event data, **each data property
> stored counts as one event.**

So the billed unit is a **stored row**, not a user action:

| What                                     | Billed as          |
| ---------------------------------------- | ------------------ |
| One pageview                             | 1                  |
| One custom event with no properties      | 1                  |
| One custom event with 5 properties       | **6**              |
| One `umami.identify()` with 3 properties | **3, per session** |

The usage chart in the Umami dashboard splits this into **Events** (hits + custom events),
**Event data** (event properties) and **Session data** (identify properties). In early August 2026
the split was roughly 26 % / 45 % / 25 % — i.e. **~70 % of the bill was properties**, and the
plan was on track for ~112k against a 100k limit.

### The two rules

**1. Never send what Umami already knows.** Every payload already carries the page URL, the
referrer, the screen size and `navigator.language`. So no `locale` (it is right there in the path,
`/de/glossar/…`), no `browser_language`, no `path` on an event that fires on the page it describes.

**2. Never send what another property implies.** These were all removed for restating a sibling:

| Removed                     | Because it was                               |
| --------------------------- | -------------------------------------------- |
| `in_park`                   | `type === 'in_park'`                         |
| `geo_allowed`               | `source === 'gps'`                           |
| `hasQuery`                  | `queryLength > 0`                            |
| `rating` (INP)              | a threshold on `value`                       |
| `parkId` next to `parkName` | the same park, twice                         |
| `nearby_in_park_detected`   | `nearby_parks_loaded` with `type: 'in_park'` |

Before adding a property, price it: an event that fires on **load** rather than on a click costs
its property count on _every_ qualifying pageview.

### Where the budget went (Aug 2026 cut)

| Change                                                           | Why it was expensive                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifyVisitor()` removed entirely                             | 3 session properties **per session** — the whole Session-data band. Two of the three (`browser_language`, `site_locale`) duplicated what Umami collects natively; `has_favorites` did not justify a row on every session. |
| `web-vital-inp`: 9 properties → 4, and only non-`good` samples   | Fired on every pageview with an interaction at 10 billed rows a time — the largest single line.                                                                                                                           |
| `nearby_parks_loaded` trimmed, `nearby_in_park_detected` dropped | Fires on _load_ of the geo card, not on a click.                                                                                                                                                                          |
| `data-exclude-hash="true"`                                       | See below — phantom pageviews.                                                                                                                                                                                            |
| 8 unused `track*` helpers deleted                                | Dead code that invited someone to re-add a 3-property event that fires on view.                                                                                                                                           |

### The one event that was added back, and how it was priced (Aug 2026)

`web-vital-cls` — 4 properties (`value`, `target`, `loadState`, `path`), **sampled at 10 %**, and
only for non-`good` samples.

It exists because the lab and the field disagree and only the field is right: Lighthouse scores
this site CLS **0** while CrUX reports **0.22**. Lighthouse neither scrolls nor interacts nor
carries a real visitor's state, so every shift that needs one of those is invisible to it.
Reproducing them by guessing the condition cost a day and turned up exactly one — the homepage
hero growing 54–148 px when the nearby lookup lands on a phone. `largestShiftTarget` is what turns
"CLS is 0.22" into a file to open.

The sampling is the whole reason it is affordable, and it is worth doing the arithmetic before
touching it. CLS reports once per pageview; at a p75 of 0.22 roughly half of ~1.6 k daily
pageviews qualify. Unsampled that is ~800 × 5 billed rows ≈ **120 k rows a month — more than the
entire plan**. At a tenth it is ~12 k. This is the same shape of mistake that got LCP, TTFB and
FCP removed above; the rate is what keeps it from repeating.

`loadState` is the fourth property where the INP event makes do with three. It says whether the
shift happened during load or long after — the difference between a late-arriving skeleton and
something that only moves once somebody scrolls, which is exactly the open question. Drop it, and
the event, once the sources are known.

### The trip planner's three events (Sep 2026)

One property each, and the three are one funnel: was the panel opened, did a day get a first
block, did anybody let it sort itself.

`planner_opened` — **one** property, `source`, fired on the closed → open edge of the panel.

It is the top of the funnel and it was the piece that was missing: with only the two below, a quiet
month cannot be read. "Nobody opens the planner" and "everybody opens it and walks away again" bill
the same and look the same. `source` is a closed union (`tab`, `park-header`, `calendar-day`,
`wizard`, `plan-list`) rather than a free string, so the report cannot end up with two spellings of
one entry point — and it is the only property here that leads to a decision, because several ways in
were added over a few weeks and whether they earn their place is exactly what it answers.

- **The edge, not the request.** `plannerUi.requestOpen` fires on a second calendar day pressed
  while the panel is already up, and on the wizard finishing _inside_ the panel; neither opens
  anything. The launcher watches its own `open` state instead, so those cost nothing. Closing and
  reopening is two.
- **No `parkName`.** Opened from the edge tab there is often no park at all, and where there is one
  `plan_day_started` already names it.
- **Cardinality is free.** Umami bills one row per property per event, not per distinct value, so
  five sources cost exactly what two would: 2 billed rows per opening.

`plan_day_started` — **one** property, `parkName`, fired the moment a park+date goes from holding
nothing to holding its first block.

Three decisions, each of them the budget rule applied:

- **The transition, not the write.** A day that already holds three rides and gains a fourth is
  somebody filling one in. Billing every add would put a row in Umami for every lap of every plan;
  the empty → not-empty edge fires exactly once per park and date, however the block got there —
  dragged off a park page, added from the panel's list, or a free block somebody wrote themselves.
- **No `date`.** It would be a second billed row per planned day, and the report it enables ("how
  far ahead do people plan") is not the question that was asked.
- **Not on finishing the wizard.** That is a park and a date with nothing in them yet — an
  intention rather than a plan, and it would count the visitor who set a day up and bounced.

`plan_optimized` — **one** property, the same `parkName` key, fired on the click on "Tag
optimieren" / "alle Headliner" and only where the plan actually changed, so a press on an
already-optimal day costs nothing. Not sent: the minutes saved, the number of rides that moved, and
which of the two buttons it was.

`parkName` rather than the slug, matching `tab_changed` and `nearby_parks_loaded`: a report that
groups parks has to group them on one key, and shipping both would be the same fact twice.

---

## 2. The phantom-pageview trap (`data-exclude-hash`)

Umami's tracker patches **both** `history.pushState` and `history.replaceState`, and fires a
pageview whenever the resulting URL differs from the previous one — **the hash counts as a
difference**. Three places in this codebase write a hash without navigating:

- `lib/hooks/use-tab-hash-routing.ts` — every park-page tab switch
- `components/parks/park-calendar-grid.tsx` — every month step in the calendar
- `components/faq/crowd-calendar-faq-link.tsx` — the `#calendar` deep link

Each of those was billed as a full extra pageview and inflated Views against Visitors.
`data-exclude-hash="true"` on the script tag strips the hash before the comparison, so a hash-only
change no longer registers. Any `next/link` to an `#anchor` is covered by the same fix.

**If you add hash-based UI state, you do not need to do anything — but do not remove that
attribute.**

---

## 3. What "unique visitor" actually means here

From [Metric definitions](https://docs.umami.is/docs/metric-definitions):

- **Visitors** — unique sessions. A session is a hash of website ID, hostname, User-Agent, IP and
  a **salt that rotates monthly**.
- **Visits** — a finer bucket inside a session, hashed with a salt that rotates **hourly**.
- **Views** — total events collected.
- **Bounce** — a visit with only one event.

Three consequences worth remembering when reading the dashboard:

1. **No cookies, no cross-device identity.** Same person on phone and laptop = two visitors. Same
   person on a different IP (mobile → WiFi) = two visitors.
2. **The monthly salt rotation caps the meaning of "unique".** A visitor count over a range longer
   than a calendar month is not deduplicated across the month boundary — a returning visitor is
   counted again from the 1st.
3. **`data-domains` is a hard gate.** The tracker only runs when `window.location.hostname` is in
   the list, so a host missing from it is _silently_ absent from the stats. The list is
   `park.fan,www.park.fan`. Add any new production hostname here or it will not be counted.

### Known undercount: `data-do-not-track="true"`

The tracker is configured to honour the browser's Do-Not-Track signal. When DNT is set, the
tracker sends **nothing at all** — no pageview, no session — so those visitors are entirely absent
from the visitor count. Typical DNT share is around 3–8 % of traffic, so **the visitor number
reads structurally low by roughly that much.**

This is a deliberate choice, not a legal requirement: Umami is cookieless and fully anonymous,
`app/[locale]/datenschutz` bases it on Art. 6(1)(f) GDPR (legitimate interest) rather than consent,
and the policy never promises DNT is honoured. Removing the attribute would recover those visitors
at the cost of a slightly less strict privacy posture. It was reviewed in August 2026 and kept.

---

## 4. Adding an event

1. Add the name to `UMAMI_EVENTS` in `lib/analytics/umami.ts` and a `track*` helper next to it.
2. Ask what the event costs: does it fire on **click** (cheap, once per intent) or on **load**
   (multiply by every pageview)?
3. Apply the two rules above to every property you were about to send.
4. Document the event and its properties in the header comment of `lib/analytics/umami.ts` — that
   list is the inventory, and it is how the next person prices a change.

Events are fire-and-forget: `trackEvent` no-ops when the script is blocked (ad blocker, DNT), so
no tracking call ever needs a guard at the call site.
