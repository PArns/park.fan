# TODO — Trip Planner

A multi-day, multi-park trip planner: pick days, drag rides onto a timeline, get a
per-ride wait-time estimate for that day and hour with a visible error channel,
tick rides off as you ride them, and get pushed when the next thing is due.

Spans two repos. Frontend `park.fan`, backend `PArns/v4.api.park.fan` (cloned at
`/home/user/v4.api.park.fan`). Backend goes first: the frontend cannot draw an
honest bar, let alone an honest error channel, against data that does not exist yet.

Scope decisions taken 2026-09-02, all four confirmed by the owner:

- A trip is **multi-day and multi-park**. Not one plan per park.
- Storage is **cookie (trip id) + localStorage (full data) + backend share link**.
  A cookie alone cannot hold a multi-day trip and cannot be shared with the people
  travelling with you.
- **Full web push**: service worker, VAPID, subscription table, cron. None of it
  exists today.
- **Backend first.**

---

## 0. What the API actually gives us today

Measured against production on 2026-09-02, not read off the types. Numbers are from
Phantasialand (`europe/germany/bruehl/phantasialand`) and Europa-Park unless noted.

| Need                                                       | Status                                                                                                                |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Per-ride wait forecast, 15-min grid, with `confidence`     | `/attractions/{slug}.hourlyForecast` — **today + tomorrow only**, 37 points                                           |
| Per-ride error magnitude                                   | `predictionAccuracy.last30Days.mae` = 9.7 min (Taron); `/v1/ml/accuracy/attractions/{id}/stats` → mae 10.6, rmse 13.3 |
| Error by hour / weekday                                    | `/v1/ml/accuracy/trends/hourly` — global, mae 6.9–8.8 by hour                                                         |
| Per-ride day forecast                                      | `calendar.headlinerForecast` — reaches **90 days**, but only **5 rides**                                              |
| Crowd level per day                                        | 90 days (`crowdLevel`, `predictedCrowdLevel`)                                                                         |
| Weather per day                                            | **14 days only** (`weather` present on 14 of 90 days)                                                                 |
| Holidays, school vacation, bridge days, neighbour holidays | 90 days                                                                                                               |
| Historical hour profile per ride (P25/P50/P90)             | `/stats/hourly` — 3.6 KB for 18 rides                                                                                 |
| Park opening hours per day                                 | `hours` on every calendar day                                                                                         |
| Ride coordinates                                           | **40/40** attractions, all 4 shows, all 46 restaurants                                                                |
| `minimumHeight`                                            | 35/40 rides                                                                                                           |
| `hasSingleRider`                                           | 3 rides                                                                                                               |
| `fastPass` with price                                      | 9 rides (QUICK Pass, 12 EUR)                                                                                          |
| `mayGetWet`                                                | present                                                                                                               |
| Show showtimes                                             | in the **park** payload, never in the calendar (`showTimes` was empty on all 90 days)                                 |
| Restaurant `operatingHours`, `requiresReservation`         | present                                                                                                               |
| `ropeDrop.bestSlotUtc` / `rideByUtc` per ride              | present                                                                                                               |
| **Ride duration**                                          | **does not exist** — no field anywhere                                                                                |
| **Per-ride opening hours**                                 | **does not exist** — derivable, see §2.4                                                                              |
| **Push infrastructure**                                    | **does not exist** — no service worker, no VAPID, no `web-push`, no subscription store                                |

Two data traps worth writing down because they will otherwise be mistaken for bugs:

- Phantasialand's `/stats/hourly` returns hours `[10, 11, 12, 13, 17]`. Europa-Park
  returns `[9 … 19]`. The gaps are real and survive `years=2` and
  `minAttractionDays=5`. Any hour-curve builder has to interpolate across them
  rather than assume a dense array.
- The calendar endpoint refuses ranges over **90 days** (`400 Date range too large`).

---

## 1. The horizon problem

People plan summer in January. The planner is worthless if it goes blank past the
model's reach — but a fabricated number is worse than a blank. So the horizon gets
**extended in tiers, and every tier is visibly different**.

Today's limits, and where each is set:

| Layer                                | Reach                  | Set at                                        |
| ------------------------------------ | ---------------------- | --------------------------------------------- |
| Hourly per-ride predictions (stored) | **48 h**               | `src/ml/ml.service.ts:1781`                   |
| Daily per-ride predictions (stored)  | **60 d**               | `src/ml/ml.service.ts:1783`                   |
| TFT daily serving                    | ≤45 d, headliners only | `docs/ml/quantile-serving-and-calibration.md` |
| CatBoost daily serving               | 31–365 d               | same doc                                      |
| Weather                              | 14–16 d (Open-Meteo)   | `docs/architecture/weather.md`                |
| Calendar range                       | 90 d per request       | calendar service                              |

### The four tiers

- **A · 0–2 days — measured forecast.** Real ML at 15-min resolution. Error channel
  is `q0.95 − q0.5` straight from the model (§2.1).
- **B · 3–60 days — composed forecast.** Daily per-ride ML prediction (already
  stored, already covers all rides) reshaped by the ride's historical hour profile
  from `/stats/hourly`. The _level_ is predicted, the _shape_ is historical. Error
  channel widens with the day distance and with how thin the ride's hour profile is.
- **C · 61–365 days — long-tail forecast.** CatBoost already serves daily to 365;
  only the stored horizon stops at 60. Raise it, or compute on demand. Same shaping
  as tier B, wider channel.
- **D · beyond 365 days — climatology, not forecast.** Same ISO week, same weekday,
  same holiday situation from previous years. Labelled as "how it was last year",
  never as a prediction. Weather likewise: past this point a climate normal, not a
  forecast.

**Rule for all four: the tier is part of the answer.** Every estimate the API returns
carries which tier produced it and how wide its channel is. The UI never renders a
tier-D bar the way it renders a tier-A bar (§4).

Weather past day 14 is its own version of this: a monthly climate normal for the
park's coordinates, clearly marked. It must not be able to reach the wait-time model
as if it were a forecast — a made-up rain probability would silently move every bar
on the day.

---

## 2. Backend (`/home/user/v4.api.park.fan`) — first stage

### 2.1 Ship the uncertainty band `[P0]`

The band already exists and is thrown away.

`CATBOOST_LOSS_FUNCTION = "MultiQuantile:alpha=0.5,0.8,0.95"` (`ml-service/config.py:99`).
`config.py:104` says q0.95 is trained "as HEADROOM for the uncertainty band ONLY
(top quantile − median = the displayed uncertainty width in predict.py)".
`predict.py:1999` computes `uncertainties = np.maximum(hi - predictions, 0.0)`.
`model.py` sorts quantiles per row with `np.maximum.accumulate` specifically so this
width "can no longer silently collapse from crossing".

Then `predict.py:2062` folds it into one percentage
(`confidence = 0.6 * time_confidence + 0.4 * model_confidence`) and the width is gone.

- [ ] `predict.py` result dict (`:2101-2115`): add `predictedWaitLow` (q0.5, the
      median itself is the lower edge — the band is one-sided upward by construction)
      and `predictedWaitHigh` (q0.95), or `uncertaintyMinutes` = the width. Decide
      one shape and keep it; do not ship both.
- [ ] `WaitTimePrediction` entity (`src/ml/entities/wait-time-prediction.entity.ts`):
      one nullable `smallint` column. **This is the heaviest-written table in the
      system (~228k rows per run, TimescaleDB hypertable)** — the entity header
      documents indexes being removed for write cost. One narrow nullable column, no
      new index.
- [ ] Migration. Follow the existing migration convention in `src/database/`.
- [ ] Surface it: `hourlyForecast[]` items, `headlinerForecast.rides[]`, and the new
      endpoints below.
- [ ] Update `docs/ml/quantile-serving-and-calibration.md` — its TL;DR table says
      q0.95 is "not served". That stops being true.

Keep `confidence` as it is. It is a different statement (time-decay blended with
model spread) and something may already read it.

### 2.2 Per-ride hourly forecast for an arbitrary day `[P0]`

The core missing capability. Nothing today answers "what will Taron's queue look
like at 14:00 on 2026-10-17".

- [ ] New endpoint, geo path like its siblings:
      `GET /v1/parks/{continent}/{country}/{city}/{parkSlug}/plan/day?date=YYYY-MM-DD`
- [ ] Response: per ride, an hour-indexed series over the park's opening hours for
      that date, each point carrying `wait`, `low`, `high`, and the **tier** (§1).
      Plus the day's context in one place: hours, crowd level, weather (or the
      climate normal with its flag), holiday/vacation/bridge flags, neighbour
      holidays, showtimes.
- [ ] Composition for tier B/C: stored daily per-ride prediction as the level,
      `/stats/hourly` P50 shape as the curve, normalised so the day's mean matches
      the daily prediction. Interpolate across missing hours — Phantasialand has
      five hours of eighteen.
- [ ] Lean payload. `/stats/hourly` is 3.6 KB for 18 rides and that is the bar to
      match; the attraction detail endpoint is 48 KB per ride and is the anti-pattern.
      Never return the park's attraction objects here.
- [ ] Cache: day-scoped. Today changes every few minutes, a day in November does not.
      TTL by distance, same instinct as the calendar endpoint's dynamic TTL.

### 2.3 Day forecast for all rides, not five `[P1]`

`calendar.service.ts:1243` — `.slice(0, HEADLINER_FORECAST_TOP_N)`. The underlying
`mlPredictions.predictions` are filtered to `headlinerIdSet` from
`getHeadlinerAttractions(park.id)` before that.

- [ ] Do not widen the calendar payload — it is already 92 KB for 90 days and every
      calendar URL is a render (27,984 of them across parks × months × locales).
      The full set belongs in the new `/plan/day` endpoint, which is asked for a
      single day at a time.

### 2.4 Derive per-ride opening times `[P1]`

The named Phantasialand case: the park opens at 09:00, the rides do not.

Raw material that exists: `attraction.history[].hourlyP90[]` gives, per day, the
hours a ride actually reported a queue. Measured across 30 days: F.L.Y. and Crazy
Bats first report at 09:00 on every one of them, Black Mamba's median first
observation is 09:15, Taron's ranges 09:00–15:30 (late days are downtime, not a late
opening). So the signal is there but noisy, and the median across days is the usable
statistic, not any single day.

- [ ] Aggregate per ride: the distribution of first-observed-hour relative to park
      opening, per season or month. Store it next to the other precomputed per-ride
      stats rather than deriving it per request — `history` costs 48 KB per ride and
      cannot be fetched for 40 rides on a page load.
- [ ] Expose as an offset with a confidence, not a hard time. "Usually open within
      15 min of the park" is honest; "opens 09:15" is not.
- [ ] Feed it into `/plan/day`: an hour before a ride's typical opening gets no bar,
      it gets a marker.
- [ ] Watch the seasonal rule (frontend `CLAUDE.md`, `lib/utils/season.ts`): a ride
      out of season is not one of the day's rides at all, and `isCurrentlyInSeason`
      has three values where `null` must behave exactly as before.

### 2.5 Showtimes into the day payload `[P1]`

The calendar's `showTimes` was empty on all 90 days sampled. The park payload has
them (4 shows at Phantasialand with 5 slots each), but the park fetch is cached for
a day and the frontend `CLAUDE.md` already documents that an overnight cache entry
reports every show as closed.

- [ ] `/plan/day` returns the day's showtimes with coordinates. Shows are fixed time
      anchors — they are what the rest of the plan gets arranged around.
- [ ] Establish how far ahead showtimes are actually known. If it is only today,
      say so in the response rather than returning an empty array that reads as
      "no shows".

### 2.6 Extend the horizon `[P1]`

- [ ] Raise the stored daily horizon past 60 days (`ml.service.ts:1783`) or add
      on-demand computation for 61–365. CatBoost already serves that range; only
      storage stops early. Cost it first — this table is the heaviest-written one.
- [ ] Tier D: a climatology fallback keyed on ISO week + weekday + holiday situation,
      from the seasons already in the database.
- [ ] Weather climate normals past day 14, flagged, and firewalled from the wait
      model's features.

### 2.7 Trip storage and share links `[P1]`

- [ ] Table: trip id (short, URL-safe, unguessable), payload, created/updated,
      expiry. No account system exists for visitors and none is being built — the
      link is the credential. Say that plainly in the UI.
- [ ] `POST /v1/trips` → id, `GET /v1/trips/{id}`, `PUT /v1/trips/{id}`.
- [ ] Rate-limit writes. This is the first unauthenticated write endpoint in the API;
      check how `THROTTLE_BYPASS_KEYS` and the existing throttler apply.
- [ ] Size cap, and reject payloads that are not a trip.

### 2.8 Push `[P2]`

- [ ] `push_subscriptions` table: endpoint, keys, trip id, locale, timezone,
      which notification kinds are wanted.
- [ ] `POST /v1/push/subscribe`, `DELETE /v1/push/subscribe`.
- [ ] VAPID keys as env. `web-push` or an equivalent.
- [ ] Cron that walks due notifications: next plan item, show starting, ride opening,
      rain moving in. The existing BullMQ/scheduler setup is the pattern to copy.
- [ ] Quiet hours in the subscriber's timezone. A 03:00 push kills the feature.

---

## 3. Frontend (`/home/user/park.fan`) — second stage

### 3.1 Data model

- [ ] `Trip`: id, name, date range, days. `TripDay`: date, park (or rest day),
      entries. `TripEntry`: kind (ride / show / meal / custom), ref, planned start,
      done flag, actual wait when ticked off.
- [ ] Travel party: names and heights. Feeds `canRideAtHeight` / `riderHeightStops`
      (`lib/utils/rider-height.ts`), which already exist.

### 3.2 Persistence

Cookies in this repo are written with `cookies-next`, `maxAge` 365 d, `path:'/'`,
`sameSite:'lax'`; `lib/utils/favorites.ts` is the reference implementation, including
its parse cache and its `secureJsonParse` guard against prototype pollution.

- [ ] Cookie holds the active trip id only — small, and server-readable.
- [ ] localStorage holds the trips.
- [ ] Backend sync for sharing (§2.7).
- [ ] `proxy.ts:39` strips `set-cookie` from every non-redirect response. Cookie
      writes happen client-side, like `rememberLocale()` does.
- [ ] Pre-mount state must reserve its own height. `FavoritesSection` is the cautionary
      tale in `CLAUDE.md`: it rendered `null` until it could read the cookie and then
      dropped a 232 px band onto the page.

### 3.3 The flyout

- [ ] `components/ui/sheet.tsx` already exists (Radix Dialog based) with
      `side="right"` and an unused `side="bottom"` — the desktop flyout and the
      mobile sheet are both already there. `vaul` is not installed and is not needed.
- [ ] Two traps documented in that file: a scroll container on `SheetContent` scrolls
      the close button away (put it on a child, as the burger menu does), and
      `side="bottom"` has no max-height, so the call site supplies one.
- [ ] Mount in the locale layout. It is on every page, so it pays the layout's
      i18n budget — see §3.6.
- [ ] Mobile: bottom sheet with ride search. `cmdk` is installed and
      `components/ui/command.tsx` wraps it; the existing search overlay is the model.

### 3.4 Drag and drop

- [ ] No DnD library is installed and none should be added for this. Pointer events
      plus a FLIP animation; GSAP is already a dependency.
- [ ] Follow the motion split `use-menu-reveal.ts` established: CSS owns visibility,
      GSAP animates transforms, `prefers-reduced-motion` skips the import entirely.
- [ ] Keyboard equivalent for reordering. Drag alone is not an interface.
- [ ] Drop targets on ride pages and in the park's attraction list.

### 3.5 Composition and correction

- [ ] Ticking a ride off records the real wait at that moment and re-estimates
      everything after it.
- [ ] Re-fetch when the model version changes or live times move.
- [ ] The best-travel-time data must still load last (`useLoadLast`) — that
      requirement does not bend for this feature.

### 3.6 i18n

Messages handed to `NextIntlClientProvider` are serialised into every page that
renders it, times six locales. The layout ships only `LAYOUT_MESSAGE_NAMESPACES`
(~6 KB); routes add their delta through `<RouteMessages route="…">`, and both lists
are generated into `i18n/route-namespaces.generated.ts` by
`pnpm generate:route-namespaces` — never hand-edited.

- [ ] The planner is mounted in the layout but is closed on almost every page view.
      Its namespace belongs in `LAZY_MESSAGE_BOUNDARIES` and gets fetched as a
      per-locale chunk when opened, the way `FavoritesSection` handles
      `parks`+`attractions`.
- [ ] The eager skeleton must reserve the same box so the swap costs no layout shift.
- [ ] `pnpm check:client-messages` has to stay green at every step. A missing
      namespace does not throw — next-intl logs MISSING_MESSAGE and renders the raw
      key.
- [ ] Six locales, no exceptions.

### 3.7 Service worker

- [ ] `public/sw.js`, hand-written. No PWA plugin is installed; `next-pwa` is dead
      and `@serwist/next` is not a dependency.
- [ ] Exempt `/sw.js` from the locale redirects in `next.config.ts` or it becomes
      `/de/sw.js`.
- [ ] Offline: the active trip has to be readable without a network. Park wifi is
      bad, and that is exactly when someone opens their plan.
- [ ] Push handler, notification click routing into the trip.

### 3.8 Trip overview

- [ ] A page listing trips and planned days, with a countdown.
- [ ] Park-to-day assignment with the crowd calendar's help: given three parks and
      three days, propose the assignment with the least total crowding. The 90-day
      crowd data supports this.

---

## 4. Visual design

The uncertainty is the visual theme. It is the honest thing to show and it happens to
be the interesting thing to look at — the channel narrows and widens across the day,
and it widens as the trip moves further out. That single idea carries both the look
and the horizon problem in §1.

- [ ] **Timeline axis is piecewise linear, like the weather day chart.** Open hours
      are drawn wider than closed ones. That geometry already exists in
      `lib/utils/weather-chart-axis.ts` (`buildDayScale`) with unit tests, and its
      rule holds here too: a change of slope must land exactly on the dashed border
      of the opening-hours band, or it reads as data.
- [ ] **The error channel is a filled band, not two lines.** Lines suggest bounds;
      a band suggests a distribution, which is what it is. Its opacity carries the
      tier: crisp for tier A, softer and wider for C and D.
- [ ] Bars sit on the day's crowd colour scale — `lib/utils/crowd-level-styles.ts`
      exists and must be reused rather than re-picked.
- [ ] Walking segments between entries as thin connectors with their minutes on them.
      Distance from `calculateDistance` (`lib/utils/distance-utils.ts`), coordinates
      present for all 40 rides.
- [ ] Weather as a layer behind the timeline: the rain window tinted, temperature as
      a faint curve. The nowcast is 15-minute resolution.
- [ ] Ticking a ride off resolves the bar from estimate to fact — the channel
      collapses to a single measured value, with the delta against the estimate shown.
      That moment is worth animating properly.
- [ ] The day's totals as one large figure: waiting time, walking time, ride count.
      And the comparison against the optimised order, which is the number that makes
      the planner worth opening.
- [ ] Glass surfaces follow the header band: `bg-popover/95` + `backdrop-blur-xl` +
      the popover ring. Never put a transform or an opacity on the blurred surface
      itself or on an ancestor — it becomes a backdrop root and the blur goes flat.
      Animate descendants.
- [ ] Chapter headings inside the planner use `ChapterHeading`
      (`components/common/chapter-heading.tsx`). There are not going to be a sixth
      and seventh heading style.
- [ ] Reuse `ParkCard`, `AttractionCard`, `ParkStatusBadge`, `CrowdLevelBadge`,
      `Badge`. Nothing gets re-implemented inline.
- [ ] Every streamed section reserves its height. This feature adds a panel to every
      page in the app; a CLS regression here is a CLS regression everywhere.

---

## 5. Honesty rules

These are the ways this feature can lie, and it will lie by default unless each is
handled.

- [ ] A ride out of season is not one of the day's rides. Not a closed one — absent.
- [ ] A park with no readable wait times (Hansa-Park) gets no bars and no forecast,
      it gets the sentence. `hasReadableWaitTimes()` / `noLiveWaitTimesReason()` in
      `lib/utils/live-wait-times.ts`.
- [ ] Past day 14 there is no weather. Past the model's reach there is no forecast.
      Say which tier the number came from.
- [ ] A displayed wait is a multiple of five (`roundWaitTo5`); a _difference_ is not
      (`roundWaitDeltaTo5`). Pointing the wrong one at a delta deleted the entire
      falling half of the scale last time.
- [ ] No copy describes the layout ("on the left you see…") — it stacks on phones.
- [ ] No aphoristic closing sentence anywhere in the copy. No `ehrlich` in German.
- [ ] Umami: every event property is billed as an event. Do not instrument each drag.

---

## 6. Open questions

- [ ] Ride duration does not exist in the data. Without it a plan cannot say when you
      are back out of the queue. Estimate per ride type from the glossary profile,
      curate the headliners by hand, or leave it out and plan queue-to-queue?
- [ ] How far ahead are showtimes genuinely known? Determines whether shows can be
      planned or only viewed on the day.
- [ ] Optimiser scope: greedy over rope-drop and hour profiles is a day's work and
      gets most of the value. Anything better is a routing problem and a project of
      its own.
- [ ] Trip share links are unauthenticated by design. Expiry, and whether an edit
      needs a second secret.
