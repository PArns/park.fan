# Personas & Scenarios — Product Gap Analysis

> **Status:** Draft for discussion · July 2026
> **Scope:** Six user personas for park.fan, walked through the full visit lifecycle
> (discovery → planning → final week → visit day → in park → after the visit),
> mapped against what the product ships today (frontend `v2.10.x`, API `v4.10.x`)
> and what is missing for each persona.
>
> Feature claims below were verified against the codebase (frontend `app/`,
> `components/`, `lib/` and backend `src/` entities/controllers), not against wishes.

---

## 1. Personas

### P1 · Sandra — The Family Trip Planner

|                   |                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**       | 38, Cologne, two kids (5 and 9), 1–2 park trips per year (Phantasialand, Efteling, one "big" trip like Disneyland Paris)                      |
| **Devices**       | Desktop/tablet for planning, phone in the park                                                                                                |
| **Plans**         | Weeks to months ahead, bound to school holidays                                                                                               |
| **Success means** | A day without meltdowns: short waits for the rides _her kids may actually ride_, a rain plan, food without drama                              |
| **Key questions** | "Which day in the autumn break is least crowded?" · "Can my 110 cm kid ride this?" · "What do we do if it rains?" · "What does the day cost?" |

### P2 · Tim — The Coaster Enthusiast

|                   |                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**       | 24, coaster counter, 15–25 parks per year across Europe, active in enthusiast communities                                                                                  |
| **Devices**       | Phone-first, uses the site daily                                                                                                                                           |
| **Plans**         | Continuously; multi-park trips optimized to the hour                                                                                                                       |
| **Success means** | Maximum ride count; riding headliners at rope drop; bragging-rights data                                                                                                   |
| **Key questions** | "Which of these three parks is quietest on Saturday?" · "What's the real P90 on Taron in August?" · "Single rider worth it today?" · "How many rides did I get last year?" |

### P3 · Mehmet — The Spontaneous Local / Passholder

|                   |                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Profile**       | 29, annual pass, lives 30 min from the park, goes 10–15×/year — but only when it's worth it                      |
| **Devices**       | Phone only                                                                                                       |
| **Plans**         | Same morning ("is today a good day?"), sometimes mid-afternoon for 3 evening rides                               |
| **Success means** | Never driving to a packed park; being told when an unexpectedly quiet day happens                                |
| **Key questions** | "How full is it _right now_ and until close?" · "Will the rain pass by 15:00?" · "Ping me when it's a green day" |

### P4 · Emily — The First-Time International Tourist

|                   |                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**       | 45, from Madrid, city trip to Paris with one Disneyland day; has never been to a major theme park                                              |
| **Devices**       | Phone, foreign SIM with limited data                                                                                                           |
| **Plans**         | 2–6 weeks ahead, superficially; overwhelmed by jargon (rope drop? single rider? virtual queue?)                                                |
| **Success means** | Not feeling lost; seeing the must-dos; understanding the "rules of the game" before gate                                                       |
| **Key questions** | "What must we not miss?" · "What does 'return time' mean?" · "In what order should we do things?" · "How early do we really need to be there?" |

### P5 · Renate & Wolfgang — Grandparents with Grandkids

|                   |                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**       | 67 and 69, take the grandkids (6 and 8) once a year; Wolfgang has a knee prosthesis, Renate avoids intense rides                                          |
| **Devices**       | Shared tablet at home, one smartphone in the park                                                                                                         |
| **Plans**         | Pick the quietest possible day; comfort beats thrills                                                                                                     |
| **Success means** | Low walking distances, benches and quiet slots, rides the _whole_ group can do together                                                                   |
| **Key questions** | "Which rides suit both a 6-year-old and someone who can't take spinning?" · "Is the park manageable with limited mobility?" · "When are the quiet hours?" |

### P6 · Lena — The Search Drive-By

|                   |                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Profile**       | 26, googles "wie voll ist der Europa-Park heute" on the way to the car; has never heard of park.fan |
| **Devices**       | Phone, one-shot session, 30–90 seconds of attention                                                 |
| **Plans**         | Doesn't; wants one number and a verdict                                                             |
| **Success means** | Instant answer above the fold; ideally remembers/installs the site for next time                    |
| **Key questions** | "Crowded today: yes/no?" · "Open at all?" — and (the product's question) "why should I come back?"  |

**Why these six:** P1/P5 stress _pre-visit content and safety metadata_, P2 stresses _data depth and multi-park tooling_, P3 stresses _real-time and proactive signals_, P4 stresses _guidance and i18n_, P6 stresses _SEO landing performance and conversion to retained user_. Together they cover the full lifecycle below.

---

## 2. Scenario walkthroughs

Legend: ✅ works today · 🟡 partial · ❌ missing. "Backend: yes/no" notes whether the API already has the data.

### S-A · Discovery & park choice

_"Which park should we even go to?"_ — mainly P1, P2, P4, P5.

| Need                             | Today | Notes                                                                                                                                                           |
| -------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browse parks by region           | ✅    | Geo hierarchy `/parks/[continent]/[country]/[city]` with live open counts                                                                                       |
| Editorial "best time to visit"   | ✅    | `/best-time-to-visit` + per-park best-days section                                                                                                              |
| Country summary pages            | 🟡    | `CountrySummarySection` exists; editorial texts still on the SEO roadmap (Phase 3B)                                                                             |
| **Park-vs-park comparison**      | ❌    | Only "vs typical" badges exist. No side-by-side: crowd forecast, top rides, weather, distance for 2–3 candidate parks. Backend: yes — all inputs exist per park |
| **Family suitability of a park** | ❌    | "How many rides can a 110 cm kid do?" is unanswerable — no height/age metadata (see G1)                                                                         |
| Rankings / "best parks for X"    | 🟡    | Hottest-parks banner + featured parks exist; standalone stats/ranking pages are planned (SEO roadmap Phase 3A) but blocked on backend `/stats` precompute       |

### S-B · Planning (weeks to months ahead)

_"Pick the date, sketch the day."_ — P1, P2, P4, P5.

| Need                                      | Today | Notes                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crowd calendar up to 365 days             | ✅    | Calendar tab, ML yearly predictions, holiday overlays incl. cross-border catchments                                                                                                                                                                                                                                                                                         |
| Best days / best months / weekday pattern | ✅    | `ParkBestDaysSection` + park stats (month, weekday, top attractions P50/P90)                                                                                                                                                                                                                                                                                                |
| School holidays awareness                 | ✅    | Backend holidays incl. school + bridge days, `influencingRegions`                                                                                                                                                                                                                                                                                                           |
| Opening hours incl. special events        | 🟡    | Schedule shown; `TICKETED_EVENT`/`EXTRA_HOURS` exist in backend `schedule_entries` but events are not surfaced as first-class "event" info (Halloween etc. — SEO roadmap Phase 4)                                                                                                                                                                                           |
| **Ticket prices / links**                 | 🟡    | Paid skip-the-line day prices (Lightning Lane single passes + Multi/Premier packages, incl. sold-out state) are now surfaced on the park page via `ParkPurchasesCard` from `schedule[].purchases` — verified live for Disney US parks (WDW ≈18 days ahead, Disneyland ≈5); Universal/EU parks deliver none. Park _admission_ ticket prices/links still don't exist anywhere |
| **Day-plan / itinerary builder**          | ❌    | The killer planning feature: turn best-days + rope-drop tiers + hourly ML forecast into a suggested touring order. All model inputs exist; no product on top                                                                                                                                                                                                                |
| **Save a planned trip (date + park)**     | ❌    | Favorites exist (cookie, per device) but a _trip_ (park + date) cannot be saved — which also blocks "your day got busier" notifications (G3)                                                                                                                                                                                                                                |
| **Cross-device continuity**               | ❌    | Sandra plans on desktop, stands in the park with her phone: cookie favorites don't travel. No accounts (G2)                                                                                                                                                                                                                                                                 |
| Accommodation/travel info                 | ❌    | Out of scope today (deliberate?) — nearby parks exist, hotels/travel do not                                                                                                                                                                                                                                                                                                 |

### S-C · The final week (T-7 → T-1)

_"Is the plan still good?"_ — P1, P3, P5.

| Need                                                                | Today | Notes                                                                                                                     |
| ------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| 16-day weather forecast                                             | ✅    | Forecast strip + hourly chart per park                                                                                    |
| Updated crowd prediction for the chosen day                         | ✅    | Calendar + Fancast; but the user must _actively re-check_                                                                 |
| **Proactive alert "your day changed"**                              | ❌    | No push channel, no stored trips, no notification infra (backend has no web-push/FCM). This is where P1/P3 churn silently |
| Severe-weather warnings                                             | ✅    | Official CAP warnings (DWD/MeteoAlarm) shown on park pages                                                                |
| Packing/practical guidance (bags, lockers, parking, stroller rules) | ❌    | No practical-info content per park; glossary explains terms but not park-specific logistics                               |

### S-D · Visit day: arrival & rope drop (the "first visit" moment)

_"Be smart in the first 90 minutes."_ — all personas, most critical for P4 (first-timer).

| Need                                    | Today | Notes                                                                                                                                           |
| --------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Rope-drop recommendations               | ✅    | Precomputed tier-1/tier-2 headliners per park and per attraction (`RopeDropCard`, `RopeDropHeadliners`)                                         |
| "How does this park work" primer        | 🟡    | `/howto` + glossary explain concepts generically; there is no _per-park_ first-visit guide ("at DLP, do X first, buy Y, the app you need is Z") |
| Today's hours + today's predicted crowd | ✅    | `ParkHeaderStats` server-rendered, park timezone correct                                                                                        |
| **Guided plan for the day**             | ❌    | Same gap as S-B: P4 wants "your morning: 1. Taron, 2. Black Mamba, …" — rope-drop data + hourly forecasts exist, sequencing product does not    |
| Jargon help in 6 languages              | ✅    | Glossary with localized URLs; terms injected into park pages                                                                                    |
| **Offline resilience at the gate**      | ❌    | Cell networks die at park entrances at opening. Manifest exists but no service worker — nothing works offline (G4)                              |

### S-E · In the park (live)

_"What now?"_ — all personas; P2/P3 heaviest users.

| Need                                                     | Today | Notes                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live waits, 5-min refresh                                | ✅    | `LiveParkData` / `LiveAttractionData`, auto-refresh                                                                                                                                                                                                                                                                     |
| "Near me now" in-park view                               | ✅    | `nearby-in-park-view`: nearest attractions + headliners with live waits and distances; homepage hero switches to in-park mode                                                                                                                                                                                           |
| Map with live markers                                    | ✅    | Leaflet park map                                                                                                                                                                                                                                                                                                        |
| Show times / parades                                     | ✅    | Shows tab incl. showtimes (parades are a showtime type)                                                                                                                                                                                                                                                                 |
| Rain radar / nowcast                                     | ✅    | 15-min precip/thunder nowcast + warning banners                                                                                                                                                                                                                                                                         |
| **"Rain plan" — indoor rides filter**                    | ❌    | Needs indoor/outdoor flag per attraction; backend has no such field (G1). High value: nowcast already predicts the rain, we can't say where to shelter                                                                                                                                                                  |
| **Wait-time alerts** ("Taron < 30 min", "ride reopened") | ❌    | No push, no SSE/WebSocket, polling only (G3). P2/P3's most-wished feature class                                                                                                                                                                                                                                         |
| **Next-best-ride suggestion**                            | ❌    | "You're here, it's 14:00 — go left": needs live waits (have) + walking distance (have coordinates) + short-term forecast (have, PCN intraday). Pure product/frontend work on existing data                                                                                                                              |
| Single-rider / virtual-queue visibility                  | ✅    | Verified: `QueueTypeBadge` renders all queue types on attraction cards and detail pages — single-rider waits, virtual-queue return windows, boarding groups, and live paid-queue prices (e.g. 11 Premier Access attractions with live prices at Disneyland Paris)                                                       |
| Restaurant depth (cuisine, reservation needed)           | ❌    | Schema fields exist (`cuisineType`, `cuisines[]`, `requiresReservation`) but are **empty in practice**: ThemeParks.wiki delivers no cuisine data and the mapper hardcodes `requiresReservation: false` (`themeparks.mapper.ts`) — even "Be Our Guest" shows no reservation flag. Needs a data source, not frontend work |
| **Battery/data-friendly offline mode**                   | ❌    | No service worker; every glance is a full network round-trip (G4)                                                                                                                                                                                                                                                       |

### S-F · After the visit

_"Remember, share, return."_ — P2 primarily; retention lever for all.

| Need                                                                          | Today | Notes                                                                                                                                                                |
| ----------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contribute photos                                                             | ✅    | `/contribute` flow (Turnstile-gated)                                                                                                                                 |
| Blog/editorial to stay engaged                                                | ✅    | Full blog with rich embeds, RSS                                                                                                                                      |
| **Ride log / visit diary** ("I rode 14 rides on 2026-07-12")                  | ❌    | Nothing. For P2 this is identity ("count"); requires accounts or at least local persistence. The wait-time history to _reconstruct_ a day already exists server-side |
| **"Your visit vs. prediction" recap**                                         | ❌    | Fun + trust-building ("we predicted 35 min avg, you got 32") — accuracy data exists in ML entities, no user-facing recap                                             |
| Reviews / community                                                           | ❌    | Deliberately absent so far; not assumed as a gap for these personas                                                                                                  |
| Re-engagement channel (newsletter/push "your park's Halloween dates are out") | ❌    | No channel exists at all — no accounts, no push, no email (G2/G3)                                                                                                    |

---

## 3. Persona → biggest unmet need (TL;DR)

| Persona                | Served well today                    | #1 gap                                                                            |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| P1 Sandra (family)     | Crowd calendar, weather, best days   | **Height/family ride metadata** — she cannot plan for her kids at all (G1)        |
| P2 Tim (enthusiast)    | P50/P90, rope drop, history, Fancast | **Multi-park comparison + ride log** (G6, G7)                                     |
| P3 Mehmet (local)      | Live status, nowcast, in-park view   | **Proactive alerts** — "green day" / wait-drop pings (G3)                         |
| P4 Emily (first-timer) | Glossary, howto, i18n                | **Guided day plan** per park (G5)                                                 |
| P5 Renate & Wolfgang   | Quiet-day data                       | **Accessibility & intensity metadata** — invisible group today (G1)               |
| P6 Lena (drive-by)     | Fast SSR answer, SEO                 | **Conversion to retained user** — install prompt, favorites nudge, alerts (G4/G3) |

The pattern: **park.fan today is excellent at "when to go" and "what's happening now", for a data-literate visitor planning for themselves.** It underserves anyone planning _for someone else_ (kids, grandparents), anyone needing _guidance_ rather than data (first-timers), and every _proactive/retention_ touchpoint (alerts, sync, offline).

---

## 4. Consolidated gap backlog

Ordered by (persona reach × leverage of existing data). "Backend ready" = data already exists server-side.

| #      | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Personas            | Backend ready?                                                                                                                                                                                             | Notes                                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **G1** | **Attraction metadata**: min height, intensity/thrill level, indoor/outdoor, accessibility (wheelchair/transfer), ride duration                                                                                                                                                                                                                                                                                                                                                                                                                                    | P1, P5, P4          | 🟡 Partially — ThemeParks.wiki (already ingested) carries `minimumHeight` that the sync currently discards; the rest needs new sources/curation. See the [source research](attraction-metadata-sources.md) | Unlocks: family filter ("rides for 110 cm"), rain plan (indoor filter), accessibility view, intensity badges. Single highest-leverage data investment; three scenarios blocked on it |
| **G2** | **Accounts / cross-device sync** (or lightweight sync via magic link)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | P1, P2, P6          | ❌ No — API is fully anonymous/stateless; favorites are client-supplied IDs                                                                                                                                | Prerequisite for G3 (stored trips/alerts) and G7 (ride log). Fancast's "no account needed" positioning stays true if accounts remain optional                                        |
| **G3** | **Alerts & notifications**: saved trip "your day changed", wait-drop, ride-reopened, green-day ping                                                                                                                                                                                                                                                                                                                                                                                                                                                                | P3, P1, P2, P6      | ❌ No — no push/SSE/WebSocket, polling only                                                                                                                                                                | Highest retention lever. Needs web-push infra + stored subscriptions (subset of G2); frontend needs service worker (G4) anyway                                                       |
| **G4** | **True PWA**: service worker, offline shell, install prompt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | P3, P6, all in-park | n/a (frontend)                                                                                                                                                                                             | Manifest exists, SW does not. Cheap relative to impact; also the delivery vehicle for G3 push                                                                                        |
| **G5** | **Day-plan / touring guide**: generated ride order from rope-drop tiers + hourly forecast; per-park first-visit guide (editorial)                                                                                                                                                                                                                                                                                                                                                                                                                                  | P4, P1, P2          | ✅ **Yes** — rope-drop tiers, headliners, PCN intraday forecasts, walking coordinates all exist                                                                                                            | The biggest _product_ differentiator on data park.fan already uniquely has. Editorial per-park guides can start without any code                                                     |
| **G6** | **Park comparison + stats/ranking pages**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | P2, P1              | 🟡 Partial — all per-park data exists; `/stats` precompute is an open backend-wishlist item                                                                                                                | Already on SEO roadmap (Phase 3A); comparison view is new                                                                                                                            |
| **G7** | **Ride log / visit recap**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | P2                  | 🟡 History exists; per-user storage doesn't (needs G2)                                                                                                                                                     | Enthusiast identity & repeat-visit hook; "visit vs. prediction" recap builds trust in Fancast                                                                                        |
| **G8** | **Surface data the backend already has** — _data-checked July 2026_: ✅ schedule purchase prices now shipped (`ParkPurchasesCard`; Disney US parks only — Universal/EU deliver none); ✅ single-rider/virtual-queue/paid-queue live data was already fully surfaced via `QueueTypeBadge` (inventory claim corrected); ❌ restaurant cuisine/`requiresReservation` fields are empty at the source (upstream delivers nothing, mapper defaults `false`) → moved to backend/data-acquisition work; still open: `TICKETED_EVENT` as event badges (SEO roadmap Phase 4) | P1, P2, P4          | 🟡 Partially                                                                                                                                                                                               | Remaining frontend quick win: event badges. Restaurant metadata needs a new data source first                                                                                        |
| **G9** | **Practical per-park info**: parking, lockers, bag rules, stroller rental, ideally as structured content                                                                                                                                                                                                                                                                                                                                                                                                                                                           | P1, P4, P5          | ❌ No                                                                                                                                                                                                      | Editorial/content play; pairs with G5 first-visit guides                                                                                                                             |

### Suggested sequencing

1. **Quick wins (frontend-only, weeks):** G8 surface existing data · G4 service worker/install prompt · G5a editorial first-visit guides for the top ~10 parks.
2. **Data investment (backend + curation):** G1 attraction metadata for the top parks first — it unblocks family filter, rain plan, accessibility view in one stroke.
3. **Platform step (design decision needed):** G2 optional accounts → G3 alerts → G7 ride log. This is one architectural decision (per-user storage + push), not three features.
4. **Differentiators:** G5b generated day plans · G6 comparison + stats pages (after backend `/stats` precompute lands).

---

## 5. Open questions

- **Accounts:** is "no account needed" a hard product principle, or a current state? G2/G3/G7 hinge on this. A middle path (anonymous device-sync token, push subscription without login) could keep the principle intact.
- **G1 data sourcing:** answered — see [attraction-metadata-sources.md](attraction-metadata-sources.md). Short version: consume `minimumHeight` from ThemeParks.wiki (already ingested, field currently discarded), hand-curate the Disney gap (~100 rows of non-copyrightable facts), Coasterpedia (CC-BY-SA) for coaster cross-fill, OSM `wheelchair=*` for coarse accessibility; RCDB and park-site scraping are off-limits by ToS. Community contribution via an extended `/contribute` flow remains an option for the editorial indoor/intensity flags.
- **Monetization interaction:** ticket links (G8/S-B) are the natural affiliate hook; worth deciding before building price display.
