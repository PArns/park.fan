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
