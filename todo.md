# TODO — Ride downtime: measure locally before it leaves draft (2026-09-06)

The frontend half of the downtime work is built (PR #416; the API side is
[v4.api.park.fan#228](https://github.com/PArns/v4.api.park.fan/pull/228)). Two
things are unmeasured, and both need a park with a ride actually reported DOWN —
which is roughly 0.7 % of rides at any instant, in a minority of parks, so it
takes picking one rather than waiting for one.

Find a candidate by fetching a few open parks and grepping for
`"effectiveStatus":"DOWN"`; Lotte World Adventure, Universal Studios Japan and
Universal Studios Singapore all had one during the analysis.

- [ ] **`pnpm build && pnpm start`, then `pnpm measure:cls --late` on a park page
      with a DOWN ride, and on that ride's own page.** Against `localhost`, never
      `127.0.0.1`, and never `next dev` — both report a confident 0.0000 for
      reasons that have nothing to do with the page.

  What could move: `OutageNote` adds a `w-full` line inside the card's badge
  wrap, and attraction cards share row heights through subgrid, so one card
  growing a line grows the whole row. It arrives with the server render, so
  there should be no shift at paint; what to check is the row geometry
  against a park with no DOWN ride.

- [ ] **`pnpm check:card-framing` on the same park.** The note sits in the card's
      lower panel, and the framed photo layer's box has to stay wider than 1.5.

- [ ] **The reliability chapter has never been seen with data in it.** Every gate
      in the API's `DOWNTIME_GATES` is provisional and currently withholds
      everywhere, so `AttractionDowntimeSection` has only ever rendered its
      one-line refusal. Once the API's phase 0 has run and the gates are
      re-derived, look at the `figures` branch in all six languages: three
      metrics in a `PanelGrid`, and the German and French sentences under them
      are the longest.

---

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
  travelling with you. **As built (see §3.2): the trip id lives in localStorage too**
  (`lib/planner/trip-sync.ts`'s `parkfan_trip_id`), not a cookie — the `planner=1`
  cookie this decision anticipated was built, found to have no reader anywhere and no
  box to reserve, and was removed.
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

  The cause is now known and is not a bug: `hours` is a `.filter()` over observed
  hours, never a range. The midday hole (14, 15, 16 missing while 17 is present)
  comes from `MIN_HOUR_RIDE_RATIO` — fewer than half the ranked rides have a cell for
  those hours — and it is possible at all because the aggregate row is already triple
  filtered upstream (`src/queues/processors/queue-percentile.processor.ts:98-106`:
  `status = 'OPERATING'`, `queueType = 'STANDBY'`, `waitTime IS NOT NULL`, and
  `HAVING COUNT(*) >= 3`). An hour where the top rides mostly lacked three OPERATING
  readings produces no bucket at all. The backend's own docs say it outright:
  "never assume 9–18" (`docs/frontend/park-hourly-profile.md`).

- The calendar endpoint refuses ranges over **90 days** (`400 Date range too large`).

### Things that are already half built

Found by the frontend recon and worth knowing before writing anything new.

- **The error channel is already drawn.** `RideDayCurve.forecastError` is a published
  per-ride MAE, and `components/parks/ride-day-curve.tsx:277-286` renders it as a band
  via `buildBandPath(hours, forecast − err, forecast + err)`. The visual primitive for
  §4 exists; it is currently fed only for today.
- **`day.hourly` is a dead path.** The backend accepts
  `?includeHourly=today+tomorrow|today|all|none` and `getIntegratedCalendar` carries the
  parameter (`lib/api/integrated-calendar.ts:30-39`) — but every caller forces `'none'`
  (`app/api/parks/[...path]/route.ts:140`, `integrated-calendar.ts:288`). A bar chart
  for that data is already built at `park-calendar-day-detail.tsx:469-494` and renders
  nothing. Note the payload is park-wide, not per ride, and the route is `s-maxage=86400`,
  so turning it on costs cache key and bytes.
- **A day-detail dialog with prev/next navigation exists**: `ParkCalendarDayDetail`
  (`park-calendar-day-detail.tsx:93-632`), already mounted twice. It is the natural
  place for "plan this day".
- **`/v1/parks/…/predictions/yearly` is never called** from anywhere in the frontend.
- `CalendarDay.showTimes`, `refurbishments`, `recommendation`, `advisoryKeys` are typed
  and rendered by nothing. So are `typicalWaitThisHour`, `percentile95ThisHour` and
  `currentVsTypical`.
- `avgWaitTime` and `crowdScore` are typed on `CalendarDay` but measured absent on
  0 of 30 and 0 of 91 days (`lib/parks/calendar-month-summary.ts:176-179`).
- There is **no `isWeekend`** on `CalendarDay` — it is derived from the date per surface.
- There is **no day route or day state** in the calendar: only a `useState` in
  `park-calendar-grid.tsx:88`. Month URLs go through `parkCalendarPath()`
  (`lib/parks/calendar-segments.ts:61`). A planner that deep-links a day has to add one.

---

## 1. The horizon problem

People plan summer in January. The planner is worthless if it goes blank past the
model's reach — but a fabricated number is worse than a blank. So the horizon gets
**extended in tiers, and every tier is visibly different**.

Today's limits, and where each is set:

| Layer                                   | Reach                        | Set at                                                         |
| --------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| Hourly per-ride predictions (generated) | **24 h**, 96 slots of 15 min | `ml-service/config.py:132` `HOURLY_PREDICTIONS = 24`           |
| Hourly dedup/delete window              | 48 h                         | `src/ml/ml.service.ts:1781` — a delete window, not the horizon |
| Daily per-ride predictions (stored)     | **60 d**                     | `src/ml/ml.service.ts:1783`                                    |
| TFT daily serving                       | ≤45 d, headliners only       | `docs/ml/quantile-serving-and-calibration.md`                  |
| CatBoost daily serving                  | 31–365 d                     | same doc                                                       |
| Weather                                 | 14–16 d (Open-Meteo)         | `docs/architecture/weather.md`                                 |
| Calendar range                          | 90 d per request             | calendar service                                               |

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

**And the widening has to be measured, not assumed.** `RideDayCurve.forecastError`
carries an explicit warning in its own docstring (`lib/api/types.ts:1841-1848`): a
caller may draw `± forecastError`, "but must NOT fan it out with the horizon, which
nothing measures". Tiers B–D are exactly that fanning out, so the plan only works if
somebody measures it first — see §2.2b. Until that number exists, a distant day gets
the honest wide-and-soft treatment without a specific figure attached, never an
invented multiplier.

Weather past day 14 is its own version of this: a monthly climate normal for the
park's coordinates, clearly marked. It must not be able to reach the wait-time model
as if it were a forecast — a made-up rain probability would silently move every bar
on the day.

---

## 2. Backend (`/home/user/v4.api.park.fan`) — first stage

**Shipped so far** (PR PArns/v4.api.park.fan#216, branch
`claude/daily-planner-wait-times-pmegzw`):

|       | What                                                                        |
| ----- | --------------------------------------------------------------------------- |
| §2.1  | Uncertainty band travels from `predict.py` to the public `hourlyForecast`   |
| §2.2b | Lead-time snapshot + scoring — recording starts with the next nightly run   |
| —     | `composeDayCurve`, the level×shape composition, as a tested pure function   |
| §2.2  | `GET …/plan/day?date=` with the `measured` / `composed` / `long_range` tier |

Full suite green at each step: 1312 tests, 129 suites, tsc + eslint + prettier clean.

Two things the work changed about this file's own assumptions, both corrected in
place above: there are **no migrations** in this repo (TypeORM `synchronize`), and
the lead-time error **cannot be queried retroactively** — it has to be recorded
forward, with the far buckets silent for as many days as they are wide.

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

- [x] `predict.py` result dict: emits `uncertaintyMinutes` — the width, not a high
      edge. One number, it is what the model computes, and a `predictedWaitHigh`
      would imply a matching `Low` that does not exist. Not rounded to 5 (a band is
      a difference), and NULL rather than 0 when the model reports no spread.
- [~] ~~add `predictedWaitLow` (q0.5, the
  median itself is the lower edge — the band is one-sided upward by construction)
  and `predictedWaitHigh` (q0.95)~~ — decided against, see above.
- [x] `WaitTimePrediction` entity: one nullable `smallint` column, no new index.
- [x] Surfaced on `hourlyForecast[]` items and carried through `PredictionDto` and
      both of `MLService`'s read paths into `/plan/day`.
- [ ] `headlinerForecast.rides[]` still does not carry it.
- [ ] Update `docs/ml/quantile-serving-and-calibration.md` — its TL;DR table says
      q0.95 is "not served". That stops being true.
- [ ] `status` is set by predict.py, is NOT declared on `PredictionResponse`, and is
      therefore dropped by pydantic on every row. The column is always NULL and the
      filter reading it (`pred.status === "OPERATING" || pred.status === null`,
      commented "excluding scheduled closures") passes everything. Declaring it
      activates that filter and drops UNKNOWN rows from accuracy scoring — a metrics
      change, so it needs its own PR with someone reading the coverage numbers. Held
      in `KNOWN_DROPPED` in `tests/test_prediction_response_fields.py`, which fails
      if anyone declares it without revisiting the filter.

**No migration, and the column is affordable.** There are no migrations in this repo:
`synchronize: process.env.DB_SYNCHRONIZE === "true"` (`src/config/database.config.ts:54`),
and `.env.production.example:12` sets it to `true`, so TypeORM adds the column itself.
A migration file would be the odd one out.

On cost, since this is the heaviest-written table in the system (~228k rows per run,
24.66M rows, TimescaleDB hypertable): `smallint` is 2 bytes, and a nullable column
costs nothing when null because the row already carries a null bitmap for
`confidence`, `crowdLevel`, `status` and `baseline`. Roughly 50 MB uncompressed,
against the 822 + 335 + 276 + 225 MB of indexes the entity header records having been
removed for write cost. Compression segments by `attractionId` ordered by
`predictedTime ASC` (`src/database/timescale-init.service.ts:296-303`), so
neighbouring uncertainty values sit together and compress well.

One thing to verify against the real database rather than assume: chunks compress
after 14 days, and the nullable `ALTER TABLE … ADD COLUMN` has to work on
already-compressed ones. The image is `timescale/timescaledb:latest-pg18`, recent
enough that it should not decompress.

Keep `confidence` as it is. It is a different statement (time-decay blended with
model spread) and something may already read it.

### 2.2 Per-ride hourly forecast for an arbitrary day `[P0]` — DONE

The core missing capability. Nothing today answers "what will Taron's queue look
like at 14:00 on 2026-10-17".

- [x] New endpoint, geo path like its siblings:
      `GET /v1/parks/{continent}/{country}/{city}/{parkSlug}/plan/day?date=YYYY-MM-DD`
- [x] Response: per ride, an hour-indexed series over the park's opening hours for
      that date, each point carrying `wait`, `low`, `high`, and the **tier** (§1).
      Plus the day's context in one place: hours, crowd level, weather (or the
      climate normal with its flag), holiday/vacation/bridge flags, neighbour
      holidays, showtimes.
- [x] Composition for tier B/C: stored daily per-ride prediction as the level,
      `/stats/hourly` P50 shape as the curve, normalised so the day's mean matches
      the daily prediction. Interpolate across missing hours — Phantasialand has
      five hours of eighteen.
- [x] Lean payload. `/stats/hourly` is 3.6 KB for 18 rides and that is the bar to
      match; the attraction detail endpoint is 48 KB per ride and is the anti-pattern.
      Never return the park's attraction objects here.
- [x] Cache: day-scoped. Today changes every few minutes, a day in November does not.
      TTL by distance, same instinct as the calendar endpoint's dynamic TTL.

### 2.2b Measure the error by lead time `[P0]`

This is what makes tiers B–D honest. Without it the widening channel is decoration,
and `forecastError`'s docstring forbids inventing one.

**The data to measure it does not exist yet, and cannot be reconstructed.** This
corrects an earlier assumption in this file, which said the numbers were "a query
away". Two findings, both verified in the backend:

1. Daily predictions are **never scored against reality**. It is deliberate and
   documented: `prediction-accuracy.service.ts:13-15` says a type not compared gets
   `tracked: false` — "e.g. daily predictions, which span up to 365 days and are
   never compared, so 0% would read as broken". So `prediction_accuracy` holds
   hourly rows only, which reach 24 hours. That covers tier A and nothing else.
2. The prediction history itself does not survive. `deduplicatePredictions`
   (`ml.service.ts:1813-1821`) deletes every daily row with `predictedTime` in
   `[now, now+60d]` and `createdAt >= now-13d` before each generation run. Running
   daily, that means a prediction made for day X is deleted and rewritten on every
   run up to X, so by the time X arrives only the last one — lead time about a day —
   is left. The 13-day clause protects rows older than that, but at a daily cadence
   nothing reaches it. Whatever long-lead rows might be found are the residue of runs
   that failed, not a sample.

So the lead-time error curve has to be **built forward**, and it has a waiting period.

- [x] Snapshot job: before each daily generation overwrites them, copy a sample of
      predictions into an archive keyed by `(attractionId, targetDate, leadDays)` —
      lead buckets around 1, 3, 7, 14, 30, 60 days. Small: a handful of rows per ride
      per target day, not the whole table.
- [x] Score the archive against `queue_data` once each target date has passed, the way
      `compareWithActuals` does for hourly.
- [ ] Aggregate MAE by lead bucket, globally and per ride where the sample carries it.
- [ ] Only then expose it so `/plan/day` can attach a measured `low`/`high` at every
      distance, and only then lift the docstring warning on `forecastError`.
- [ ] Expect the curve to be flatter than intuition suggests: the hourly error already
      moves only between 6.9 and 8.8 across a whole day. If lead-time error is similarly
      flat, that is a finding to show, not a reason to fake a widening band.

**Consequence for the frontend, and it is not a blocker.** Tier A gets a measured band
from day one — the `uncertaintyMinutes` of §2.1 plus the hourly accuracy that already
exists. Tiers B–D get width without a figure: wider and softer with distance, stated as
"we have not measured how wrong we are this far out" rather than a number. That is the
honest rendering until the archive fills, and it is what the tier label is for.

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

### 2.5 Showtimes into the day payload `[P1]` — shipped since this section was written

**Frontend-observed status (2026-09-08, PF-23 reconciliation) — supersedes the two
paragraphs below, which describe the state BEFORE this shipped:** `lib/planner/shows.ts`
now consumes real `PlanDayShow`/`PlanDayShowSource` data from `/plan/day` — not a stub,
not an empty array. Its own docstring names a concrete example (Phantasialand,
2026-09-03: "22 of the 48 showtimes the API returned for that date" sat past a closing
time derived from a projected day) and the type carries `hoursSource: "observed"` for a
listing that narrows the park's own derived hours — detail that is not something a
frontend would invent against a field that does not exist. Not verified against the
backend repo itself (out of scope here, see PF-23's Non-Goals), but strong enough to
check off both boxes below; a stale claim two paragraphs old is not.

<details><summary>Original problem statement (resolved — kept for history)</summary>

**Now known: the calendar DTO has no showtimes field at all.**
`IntegratedCalendarDayDto` never declared one, which is why every response reads
like a park with no shows rather than like a field nobody asked for — and it fully
explains the measurement above (empty on all 90 sampled days). `/plan/day` returns
an empty array with that noted; wiring `ShowsService` in is its own change, because
the endpoint has to answer "not known this far out" rather than "no shows", and
those are different answers.

The calendar's `showTimes` was empty on all 90 days sampled. The park payload has
them (4 shows at Phantasialand with 5 slots each), but the park fetch is cached for
a day and the frontend `CLAUDE.md` already documents that an overnight cache entry
reports every show as closed.

</details>

- [x] `/plan/day` returns the day's showtimes with coordinates. Shows are fixed time
      anchors — they are what the rest of the plan gets arranged around.
- [x] Establish how far ahead showtimes are actually known. If it is only today,
      say so in the response rather than returning an empty array that reads as
      "no shows". Answered: per-date, via `PlanDayShowSource` — `scheduled` (the
      operator's own listing) or `projected` (the last matching weekday carried
      forward, itself never clipped to a projected day's shorter hours where the
      listing says otherwise).

### 2.6 Extend the horizon `[P1]`

- [ ] The hourly horizon is one constant: `HOURLY_PREDICTIONS = 24` in
      `ml-service/config.py:132` ("Next 24 hours (internal use)"), which becomes
      96 slots of 15 minutes. Raising it also means widening the 48-hour dedup window
      (`ml.service.ts:1781`) and revisiting the purge comment at `ml.service.ts:1693-1696`,
      which reasons from "lead ≤ 24 h". Three places, one number.
- [ ] Raise the stored daily horizon past 60 days (`ml.service.ts:1783`) or add
      on-demand computation for 61–365. CatBoost already serves that range; only
      storage stops early. Note days 61–365 are already **not deduplicated** today,
      so anything relying on them has to tolerate duplicates or the window has to
      grow with it. Cost it first — this table is the heaviest-written one.
- [ ] Tier D: a climatology fallback keyed on ISO week + weekday + holiday situation,
      from the seasons already in the database.
- [ ] Weather climate normals past day 14, flagged, and firewalled from the wait
      model's features.

### 2.7 Trip storage and share links `[P1]` — storage shipped, sharing not started

**Backend-confirmed status (2026-09-10, PF-34) — replaces the frontend-observed caveat
that stood here, which said the backend table was unproven and was already out of date
when it was written:** all four boxes below were checked against the backend repo and the
live API, and the storage half is done. `510a6c3`
([v4.api.park.fan#216](https://github.com/PArns/v4.api.park.fan/pull/216), 2026-09-03)
brought `src/trips/` with the entity, the three endpoints, the write limiter and the
payload guard; `https://api.park.fan/api-json` lists all three verbs. On this side
`app/api/trips/route.ts` and `app/api/trips/[id]/route.ts` relay all three and
`lib/planner/trip-sync.ts` drives them, so a plan does reach the server. What is missing
is the other word in this section's title: nothing shares it, which is the one box left
open below.

- [x] Table: trip id (short, URL-safe, unguessable), payload, created/updated,
      expiry. `trip.entity.ts` — `varchar(32)` primary key, `jsonb` payload,
      `CreateDateColumn`/`UpdateDateColumn`, `expiresAt timestamptz` behind
      `idx_trips_expires_at`; `TripsService` pushes a 400-day TTL forward on every
      write and `queues/processors/trips-maintenance.processor.ts` sweeps what expires.
- [ ] Say in the UI that the link is the credential. No account system exists for
      visitors and none is being built, so this sentence is the whole security model —
      and it has nowhere to stand: `lib/planner/trip-sync.ts` has exactly one caller
      (`lib/planner/use-push-subscription.ts`), `getTripId()` no reader outside it, and
      `components/planner/` contains neither `navigator.share` nor a clipboard write.
      Where the share entry point goes, and what pressing it does when push is off, is
      **PF-94**; the sentence lands with it.
- [x] `POST /v1/trips` → id, `GET /v1/trips/{id}`, `PUT /v1/trips/{id}`.
      `trips.controller.ts`, all three live.
- [x] Rate-limit writes. `trip-write-rate-limit.service.ts` — a Redis limiter of its own
      rather than `@Throttle`, because `CfThrottlerGuard` skips exactly the calls that
      come from this frontend; two buckets, 20 creates and 600 updates per hour per IP.
- [x] Size cap, and reject payloads that are not a trip. `trip-payload.util.ts` — 256 KB,
      plus a skeleton check (version, parks, days, entries) with its own per-level caps.

### 2.8 Push `[P2]` — frontend integration already built, ahead of this section's checkboxes

**Frontend-observed status (2026-09-08, PF-23 reconciliation):** `app/api/push/route.ts`,
`app/api/push/subscriptions/route.ts`, `public/sw.js` and `lib/planner/use-push-subscription.ts`
implement the full subscribe/unsubscribe/topic-change flow against `/v1/push` and
`/v1/push/subscriptions`, plus a hand-written service worker with `push` and
`notificationclick` listeners. Same caveat as §2.7: every one of these is written to
answer `unavailable`/`off` on a non-OK or unreachable backend by design, so this
confirms the frontend is ready, not that `push_subscriptions` exists yet. See the
batch's separate backend-side ticket for this section.

Nothing exists: `grep -rniE "web-push|webpush|vapid|push_subscription|notification|firebase|fcm|apns" src/` returns zero. There is no outbound notification of any kind in this backend — no push, no email, no user-facing webhook. The only outbound call is the revalidation hook to the frontend (`src/common/revalidation/revalidation.service.ts:45-60`). "Alert" in this codebase always means an internal ML or weather record, never something sent.

- [ ] `push_subscriptions` table in **Postgres, not Redis**. Redis runs
      `maxmemory 512mb` with `allkeys-lru` (`docker-compose.yml:45-50`), so it is
      free to evict any key — a subscription store there would silently lose
      subscribers.
- [ ] Columns: endpoint (unique — the write is an **upsert on endpoint**, not an
      insert), keys, trip id, locale, timezone, wanted topics, and a failure counter,
      because a 404/410 from the push service means the subscription is dead and
      should be counted then dropped.
- [ ] `POST /v1/push/subscriptions`, `DELETE /v1/push/subscriptions`.
- [ ] VAPID keys as env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- [ ] Dependency: `web-push`. Pure JS, no native addon — which matters here for the
      same reason `password.util.ts:13-20` gives for choosing scrypt over argon2: the
      image has no build toolchain.
- [ ] Job that walks due notifications: next plan item, show starting, ride opening,
      rain moving in. **The scheduler is Bull v4, not BullMQ, and there is no
      `@nestjs/schedule`** — no `@Cron`, no `@Interval`, no `ScheduleModule` anywhere
      in `src/`. Both `claude.md:25` and `docs/architecture/job-queues.md:4` say
      BullMQ and are wrong; fix them while passing through. A scheduled job is a
      hand-written block in `QueueSchedulerService.registerScheduledJobs()`
      (`queue-scheduler.service.ts:75-977`): check `hasRepeatableJob()`, else
      `queue.add(name, {}, { repeat: { cron }, jobId })`.
- [ ] Dispatch belongs on its own queue, not inside the wait-times sync, so it
      cannot hang the 5-minute window and Bull can retry it independently.
- [ ] Quiet hours in the subscriber's timezone. A 03:00 push kills the feature.
- [ ] There is no visitor identity anywhere in this backend, so a subscription has to
      carry its own — the trip id is the natural handle, which ties this to §2.7.

Worth knowing while working in `src/queues/`: `MLHealthCheckProcessor`
(`ml-health-check.processor.ts:18`) is not registered in `queues.module.ts` and its
queue is never created, so it never runs — while its spec passes. Do not take a green
spec in that directory as proof that the processor is wired up.

---

## 3. Frontend (`/home/user/park.fan`) — second stage

Shipped so far, German only, on `claude/daily-planner-wait-times-pmegzw`: the store
and its pure actions, the flyout (right-hand sheet / bottom sheet), the **day grid** —
a real Outlook-style time axis with blocks at their start minute sized by their queue —
the opening-hours band behind it, the transfer legs between blocks, show lines, the now
line, the context band, the ride search, the day picker, the overview of every park and
day, the ride page's add control and the calendar's "plan this day".

Four pure suites (`test:planner-grid` 37, `test:planner-leg` 28, `test:planner-park-time`
16, `test:planner-actions` 30) and `pnpm check:planner` 39/39 in a browser.

`/plan/day` answers 404 in production until the backend PR is merged, and the panel says
so rather than drawing empty bars — the flat list is the fallback for a day with no known
hours, because without them there is no honest axis. The check asserts both branches, and
a stubbed pass exercises the grid itself so a green check is not one that skipped the
feature.

### What the twelve stated requirements got

| #   | Requirement                               | State                                                                                                                                                                                                                  |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Blocks in a time grid, height = duration  | done — height is the queue; ride duration deliberately excluded, see below                                                                                                                                             |
| 2   | Not draggable earlier than the ride opens | done — hard floor at the park's opening, soft advisory floor at the first measured hour                                                                                                                                |
| 3   | Opening hours marked in the background    | done — five layers, truncation feather, rush strip                                                                                                                                                                     |
| 4   | "ein park Outlook"                        | done                                                                                                                                                                                                                   |
| 5   | Always park timezone                      | done — `lib/planner/park-time.ts`, all three `todayLocal()` copies gone                                                                                                                                                |
| 6   | Shows as lines with their time            | done — `lib/planner/shows.ts` renders every date now, via `/plan/day`'s `PlanDayShowSource` marking a projected (carried-forward weekday) line apart from the operator's own listing; this row predates that, see §2.5 |
| 7   | Luftlinie between consecutive rides       | done — on the leg and on the lower block                                                                                                                                                                               |
| 8   | Transfer knapp / gut / großzügig          | done — floor/ceiling asymmetry, boundary at the model's own spread                                                                                                                                                     |
| 9   | Live re-correction + now line             | done — 45-minute window, no ratio-scaling of the later curve                                                                                                                                                           |
| 10  | Warn: down all day yesterday              | done — `downYesterday` from `queue_data`, today and tomorrow only                                                                                                                                                      |
| 11  | Warn: reports closed                      | done — status directly, never the absence of a queue                                                                                                                                                                   |
| 12  | Show the photo where there is one         | done — resolved in the proxy route, never in the client                                                                                                                                                                |

**Ride duration is not in the block's height**, and that is a decision rather than an
omission: the curated `durationSeconds` covers 22 of 173 rides across three parks and its
median is 117 seconds — 2.3 px at 1.2 px/min. It lives in the leg's arithmetic instead.

### 3.1 Data model

- [~] ~~`Trip`: id, name, date range, days. `TripDay`: date, park (or rest day),
  entries. `TripEntry`: kind (ride / show / meal / custom), ref, planned start,
  done flag, actual wait when ticked off.~~ — built, but shaped differently:
  `PlannerState` (`lib/planner/types.ts`) is keyed by park slug, each park keyed
  by date, no `Trip` wrapper with its own id/name/date-range. A "trip" only gets
  an id when push turns it into a shared row (`lib/planner/trip-sync.ts`'s
  `parkfan_trip_id`) — the id is a sync artefact, not part of the plan's own
  shape. `PlannerEntry`'s kind is implicit (an `attractionSlug` or a `custom`
  block with one of seven icons) rather than an explicit `ride/show/meal/custom`
  enum. `startMinute`, `done` and `actualWait` are exactly as described.
- [~] ~~Travel party: names and heights.~~ — built, but as two DAY-level flags rather
  than a named roster: `PlannerDayPrefs.riderHeightCm` (the shortest rider) and
  `avoidWet`, applied in `lib/planner/party.ts`'s `partyFlags` through the
  existing `canRideAtHeight`. Documented as a deliberate choice in
  `docs/features/trip-planner.md` (wizard step 3, "Who is coming" — a flag on
  the ride list, never a filter, and never named individuals).

### 3.2 Persistence

Cookies in this repo are written with `cookies-next`, `maxAge` 365 d, `path:'/'`,
`sameSite:'lax'`; `lib/utils/favorites.ts` is the reference implementation, including
its parse cache and its `secureJsonParse` guard against prototype pollution.

- [~] ~~Cookie holds a flag only (`planner=1`), not the plan. Server-readable, and the
  plan itself never leaves localStorage.~~ — built, then **removed**: it had no
  caller anywhere (`plannerCookieSaysHasPlan()` did not appear in the production
  chunks) and nothing to reserve a box for, since the edge tab is drawn
  unconditionally and takes no layout space either way. It rode along on every
  request for a year for a reader that did not exist. See `lib/planner/store.ts`'s
  own docstring. localStorage only, now.
- [x] localStorage holds the plan (`parkfan_planner`), read through `secureJsonParse`.
- [x] Backend sync for sharing (§2.7) — `lib/planner/trip-sync.ts` (`syncTrip`,
      `startTripAutoSync`, `forgetTrip`) against `app/api/trips/*`. See §2.7's status
      note: this is the frontend half, and it degrades quietly if the backend table
      does not exist yet.
- [~] ~~`proxy.ts:39` strips `set-cookie` from every non-redirect response. Cookie
  writes happen client-side, like `rememberLocale()` does.~~ — moot: the planner
  cookie was removed (see above), so there is nothing here for `proxy.ts` to strip.
- [~] ~~Pre-mount state must reserve its own height.~~ — resolved structurally rather
  than with a reserved box: the way in is a `fixed` edge tab (`planner-launcher.tsx`)
  drawn on every page load whether or not anything is planned, and it takes no
  space in the document flow, so there is no swap for a visitor to see. Confirmed
  in `store.ts`'s docstring, which cites this as the second reason the old cookie
  turned out to do nothing.

### 3.3 The flyout

- [x] `components/ui/sheet.tsx` already exists (Radix Dialog based) with
      `side="right"` and an unused `side="bottom"` — the desktop flyout and the
      mobile sheet are both already there. `vaul` is not installed and is not needed.
- [x] Two traps documented in that file: a scroll container on `SheetContent` scrolls
      the close button away (put it on a child, as the burger menu does), and
      `side="bottom"` has no max-height, so the call site supplies one.
- [x] Mount in the locale layout. It is on every page, so it pays the layout's
      i18n budget — see §3.6.
- [x] Mobile: bottom sheet with ride search. Built as a plain filtered list, not
      `cmdk`: the day's twenty rides are already in memory, so `EntityPicker`'s debounce
      and `AbortController` would add latency to a loop over an array. `cmdk` is
      installed and
      `components/ui/command.tsx` wraps it. The closest existing thing is
      `EntityPicker` (`components/contribute/entity-picker.tsx:151-213`) — a combobox
      over parks _and_ attractions with a 250 ms debounce, an `AbortController` and
      `MIN_CHARS = 3`. Copy its request discipline rather than reinventing it.

### 3.3b Choosing the day

- [x] `ParkCalendarDayDetail` (`park-calendar-day-detail.tsx:93-632`) is already a
      Radix dialog with prev/next day navigation, arrow-key handling and `lastDay`
      dimming, and is already mounted from both the calendar grid and the park header.
      "Plan this day" belongs in it rather than in a new dialog.
- [ ] The calendar has no day route — day selection is a `useState` in
      `park-calendar-grid.tsx:88`. A planner that links to a specific day needs one;
      follow the month-segment pattern in `lib/parks/calendar-segments.ts`.
- [x] The dropdown variant of day selection is the same state by another control. One
      source of truth, two inputs.

### 3.3c What the browser found that the build could not

A boundary's own `useTranslations` counts against the LAYOUT set, not the boundary, so
everything that reads `planner` sits behind the boundary file's import. That split is why
`planner-launcher.tsx` and `planner-launcher-button.tsx` are two files, and
`plan-day-button-lazy.tsx` and `plan-day-button.tsx` likewise.

A rebuild under a running `next start` serves chunk URLs the new build does not have, the
page never hydrates, and the planner simply is not there — which looks exactly like a
regression in the feature. Kill the server before rebuilding.

`document.documentElement.clientWidth` is not what a `fixed` element's `inset-x-0`
resolves to once a modal's scroll lock is installed; the two differ by a scrollbar. Measure
geometry against a reference element positioned the same way.

`components/ui/sheet.tsx` sat at `z-50` while the language banner is deliberately at
`z-[60]`, so the banner painted across the top of every open sheet — the burger menu
included. `dialog.tsx` was already at `z-[70]`; the sheet is now too.

### 3.4 Drag and drop

- [x] No DnD library is installed and none should be added for this. Pointer events
      with `setPointerCapture` and a fixed row height for the index maths. No FLIP yet.
- [ ] Follow the motion split `use-menu-reveal.ts` established: CSS owns visibility,
      GSAP animates transforms, `prefers-reduced-motion` skips the import entirely.
      **Still open** — no GSAP usage found in `lib/planner/drag-coach.ts` or
      `components/planner/planner-drag-coach.tsx`, which is a static hint box with no
      motion of its own.
- [x] ~~Keyboard equivalent for reordering. Drag alone is not an interface.~~ — done:
      `PlannerBlock` (`components/planner/planner-block.tsx`) renders an invisible
      `<input type="range">` over the drag grip, `pointer-events: none` so it does not
      steal pointer hits but stays in the tab order, `min`/`max` the same opening
      clamp the drag obeys, committing through the same `onMove` path a drag does.
- [~] ~~**`AttractionCard` is a hostile drag surface.** ... Use an explicit drag
  handle ...~~ — solved differently: no drag handle was added. Instead
  `lib/planner/use-ride-drag-source.ts` attaches ONE capture-phase `dragstart`
  listener on `document` that overwrites the `DataTransfer` of whichever native
  drag the browser already started (the link, or its photo) with the planner's own
  payload — chosen specifically because `AttractionCard` is a Server Component
  used in eight places and a wrapper for a handle would break its
  `row-span-3`/subgrid layout. See that file's own docstring.
- [~] ~~The natural drag surface already exists: `AttractionWaitOverview` ... Same for
  `RopeDropHeadliners`~~ — not adopted. The fix above kept `AttractionCard` itself
  as the drag source, so switching to these alternate surfaces was not needed.
- [~] ~~The card's top glass panel already reserves `padding: '14px 52px 13px 16px'`
  for the favourite star ... A second control there needs more right padding~~ —
  moot: no second control was ever added to the card. `AddToPlannerButton`
  (`components/planner/add-to-planner-button.tsx`) lives on the ride's own page
  instead (see the intro table, "the ride page's add control"), not on the card.

### 3.5 Composition and correction

- [~] ~~Ticking a ride off records the real wait at that moment and re-estimates
  everything after it.~~ — half done: `setEntryDone` (`lib/planner/actions.ts`)
  stores `actualWait` per entry and `PlannerBlock` reads it in place of the
  estimate once `done` — that half is confirmed. **"Re-estimates everything after
  it" is not found**: no cascading recompute of later entries triggered by the
  tick-off itself — later entries keep drawing from the ordinary `/plan/day` +
  live-correction pipeline (requirement 9 in the table above), not from a
  dedicated reaction to this one action. Left open, tracked as its own thing
  rather than checked off with the rest.
- [ ] Re-fetch when the model version changes or live times move. **Still open** — no
      model-version check found in `lib/planner/use-planner.ts` or `live.ts`.
- [x] The best-travel-time data must still load last (`useLoadLast`) — that
      requirement does not bend for this feature. Confirmed: `usePlannerDayFacts`
      (`lib/planner/use-day-facts.ts`) reuses the park page's own
      `useParkBestDaysCalendar` query key, so opening the planner on a park page is a
      cache hit against the already-`useLoadLast`-gated fetch rather than a second,
      ungated one.

### 3.6 i18n

Messages handed to `NextIntlClientProvider` are serialised into every page that
renders it, times six locales. The layout ships only `LAYOUT_MESSAGE_NAMESPACES`
(~6 KB); routes add their delta through `<RouteMessages route="…">`, and both lists
are generated into `i18n/route-namespaces.generated.ts` by
`pnpm generate:route-namespaces` — never hand-edited.

- [x] The planner is mounted in the layout but is closed on almost every page view.
      Its namespace is in `LAZY_MESSAGE_BOUNDARIES` and is fetched as a per-locale chunk,
      the way `FavoritesSection` handles `parks`+`attractions`. Two boundaries now: the
      launcher, and the calendar's "plan this day".
- [~] ~~The eager skeleton must reserve the same box so the swap costs no layout
  shift.~~ — not applicable in the form assumed: the launcher's eager part is a
  `fixed` edge tab that takes no space in the document flow (`planner-launcher.tsx`:
  "the tab is always drawn"), and the panel it opens is an overlay `Sheet`, not
  page content — so there is nothing in the page's own layout for the lazy
  `planner` namespace chunk to shift when it lands.
- [x] `pnpm check:client-messages` has to stay green at every step. A missing
      namespace does not throw — next-intl logs MISSING_MESSAGE and renders the raw
      key.
- [x] Six locales, no exceptions. German-only was the brief's "erstmal", and it turned
      out not to be a smaller version of the feature but a broken one: `/en` and `/nl`
      rendered `planner.title` and `planner.day.today` verbatim, 31 MISSING_MESSAGE per
      open. Neither guard saw it — `check:untranslated` looks for German copied INTO the
      others, and `validate:translations` compares against the English master, which had
      no `planner` key either. `pnpm check:planner` now opens the panel in all six.

### 3.7 Service worker

- [x] `public/sw.js`, hand-written. No PWA plugin is installed; `next-pwa` is dead
      and `@serwist/next` is not a dependency. Confirmed — 82 lines, `install`/
      `activate`/`push`/`notificationclick` only.
- [x] ~~Exempt `/sw.js` from the locale redirects in `next.config.ts`~~ — never needed
      a dedicated exemption: `proxy.ts`'s own matcher already excludes any path with a
      dot (`.*\\..*`), which `/sw.js` is.
- [~] ~~Offline: the active trip has to be readable without a network.~~ — decided
  against, explicitly: `public/sw.js`'s own docstring calls this "deliberately NOT
  a caching worker" — the site is already statically prerendered behind a CDN, and
  a worker that starts answering navigations from its own store "becomes the
  hardest kind of stale — one that survives a deploy, ignores a purge, and needs
  the visitor to clear site data." This bullet is superseded by that decision, not
  satisfied by it.
- [x] Push handler, notification click routing into the trip. Both listeners exist in
      `public/sw.js` (`showNotification` with a dedupe `tag`; `notificationclick`
      focuses an already-open tab or opens the notification's `url`).

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

- [~] ~~**Timeline axis is piecewise linear, like the weather day chart.**~~ — decided
  against, explicitly: `lib/planner/day-grid.ts`'s own docstring calls this "a
  decision against the precedent next door" — a plan already refuses times
  outside the park's hours (`PlanDayRide` carries one entry per open hour and
  nothing else), so warping the axis would buy nothing a linear one over just the
  operating day does not already give (~92% of the canvas), and it would cost the
  one invariant the view needs: on a piecewise axis a fixed-duration queue draws
  at a different height depending on when it starts, invisibly. `heightFor` takes
  a duration and no start position specifically to make that unrepresentable.
- [ ] **The error channel is a filled band, not two lines.** ... `RideDayCurve` already
      draws exactly this band ... extend that geometry rather than writing a second
      one. **Still open** — no `buildBandPath` or `ride-day-curve` reference found
      anywhere under `lib/planner/` or `components/planner/`; `lib/planner/estimate.ts`
      computes `uncertaintyMinutes`/`expectedError` per entry, but nothing was found
      drawing them as a band.
- [x] Bars sit on the day's crowd colour scale — confirmed reused, not re-picked:
      `planner-bar.tsx`, `planner-block.tsx` and `planner-month-calendar.tsx` all
      import from `lib/utils/crowd-level-styles.ts`.
- [x] Walking segments between entries as thin connectors with their minutes on them.
      Confirmed: `lib/planner/leg.ts` computes floor/ceiling minutes via
      `calculateDistance`, and `planner-leg.tsx` renders them (`transfer.gap`,
      `transfer.minWalk`).
- [x] Weather as a layer behind the timeline: the rain window tinted, temperature as
      a faint curve. Confirmed: `lib/planner/weather-rail.ts` carries `temperatureC`
      per segment and `planner-weather-rail.tsx` renders it alongside the
      precipitation tint.
- [ ] Ticking a ride off resolves the bar from estimate to fact — the channel
      collapses to a single measured value, with the delta against the estimate shown.
      **Partially built and already its own ticket**: `PlannerBlock` already swaps in
      `entry.actualWait` once `done` (a value swap, no animation, no delta, no channel
      collapse) — the rest of this bullet (the collapse animation and the rounded
      delta) is PF-22, "Tick-off collapses the estimate band to a measured fact with a
      rounded delta", already filed and queued. Left open here rather than duplicated.
- [ ] The day's totals as one large figure: waiting time, walking time, ride count.
      And the comparison against the optimised order. **Partially built**:
      `totalsFor` (`lib/planner/estimate.ts`), rendered by `PlannerDayFoot`, totals
      waiting minutes and ride counts (queued / done / custom) — no walking-time total
      and no figure comparing against the optimised order were found. Left open on
      those two.
- [ ] Glass surfaces follow the header band: `bg-popover/95` + `backdrop-blur-xl` +
      the popover ring. **Unconfirmed either way**: the flyout's own sheet uses
      `bg-background/80` + `backdrop-blur-2xl` (`planner-flyout.tsx:572`), a different
      recipe than prescribed here — may be a deliberate choice for a full sheet rather
      than a hovering menu, not established either way from this pass. Left open
      rather than asserted as a bug.
- [x] Chapter headings inside the planner use `ChapterHeading`
      (`components/common/chapter-heading.tsx`). Confirmed:
      `app/[locale]/trip-planner/_chrome.tsx` calls it directly, same as the rest of
      the site — no separate heading style was added.
- [ ] Reuse `ParkCard`, `AttractionCard`, `ParkStatusBadge`, `CrowdLevelBadge`,
      `Badge`. **Partially confirmed, corrected after an earlier pass of this review
      mis-read the grep**: `CrowdLevelBadge` and `Badge` are genuinely imported
      (`planner-context-band.tsx`, `planner-wizard.tsx`). `ParkCard`, `AttractionCard`
      and `ParkStatusBadge` are not imported anywhere under `components/planner/` or
      `lib/planner/` — the only two hits for `AttractionCard` in the whole tree are
      prose comments in `use-ride-drag-source.ts`/`ride-drag.ts` about dragging FROM
      the park page's existing card, not about reusing it inside the planner's own UI.
      Left open on those three.
- [ ] Every streamed section reserves its height. **Not established either way**: no
      `Suspense` boundary was found in `app/[locale]/trip-planner/page.tsx` itself: the
      page's own content is a static article (`content/<locale>.tsx`), and the
      planner's live day data is fetched client-side through query hooks rather than
      streamed via RSC `Suspense` — so this bullet may already not apply in the form
      it was written for. Left open rather than guessed at.

---

## 5. Honesty rules

These are the ways this feature can lie, and it will lie by default unless each is
handled.

- [ ] A ride out of season is not one of the day's rides. Not a closed one — absent.
      **Confirmed real gap, PF-27**: `/plan/day`'s `attractions()` query
      (`plan-day.service.ts`, backend) selects `{ parkId, retiredAt: IsNull() }` and
      nothing else — no season filter of any kind, so an out-of-season ride is not
      excluded upstream. And `PlanDayRideDto`/`PlanDayRide` carries no
      `isCurrentlyInSeason` field at all, so the frontend has no signal to check even
      if it wanted its own `!== false` guard — there is nothing to read. This is not a
      frontend fix: the API has to grow the field (and/or filter server-side) before
      `lib/planner/estimate.ts` can apply the site-wide rule. Whether a season-affected
      ride actually surfaces in practice depends on the ML side (a ride with no
      in-season observations may simply have no measured/composed curve and drop out
      of `rides` on its own, per `forecastRides`'s `if (!curve) continue`) — not
      verified either way, and not something code reading answers. Follow-up ticket
      filed for the backend repo.
- [x] A park with no readable wait times (Hansa-Park) gets no bars and no forecast,
      it gets the sentence. Confirmed: `hasReadableWaitTimes()` is read in
      `lib/planner/estimate.ts`, `lib/planner/live.ts` and `lib/planner/optimize.ts`.
- [x] Past day 14 there is no weather. Past the model's reach there is no forecast.
      Say which tier the number came from. Confirmed on both halves:
      `WEATHER_RAIL_MAX_LEAD_DAYS = 14` in `lib/planner/weather-rail.ts` (empty array
      past it, never an invented value), and `PlanDayTier` (`measured`/`composed`/
      `long_range`) is read and visibly styled in `planner-bar.tsx`, `planner-block.tsx`,
      `planner-context-band.tsx`, `planner-day-grid.tsx` and `planner-entry-row.tsx`.
- [x] A displayed wait is a multiple of five (`roundWaitTo5`); a _difference_ is not
      (`roundWaitDeltaTo5`). **Confirmed compliant, PF-27, neither function is missing
      — it is unneeded**: `PlanDayHour.wait` is typed "already rounded to 5" and
      `lib/planner/estimate.ts` reads it with an exact `hours.find((h) => h.hour === hour)` lookup, never an interpolation between two hours, so the value reaching
      `PlannerEstimate.wait` is exactly what the API sent. `ASSUMED_WAIT_MIN` (the
      no-history floor) is hardcoded to `5`. `actualWait` (the "done" figure) is a raw
      live observation, not an aggregate, so it is already a multiple of five the way
      every park-posted reading is. Sums and differences of multiples of five stay
      multiples of five without re-rounding — `optimize.ts`'s `totalWaitMinutes` and
      the "minutes saved" figure both add/subtract `estimate.wait` values directly, no
      `roundWaitDeltaTo5` needed. The only planner figures NOT run through
      `roundWaitTo5` are `uncertaintyMinutes`/`expectedError`/`accuracy.typicalError` —
      model accuracy statistics, not wait times, and correctly `Math.round()`ed
      instead (`planner-context-band.tsx`, `planner-grid-actions.tsx`) the same way the
      rest of the site treats an error figure versus a wait figure.
- [x] No copy describes the layout ("on the left you see…") — **confirmed, full
      re-audit this pass**: no horizontal (left/right) positional copy anywhere in the
      `planner` namespace, six locales. Two vertical references exist —
      `empty.bodyGrid` ("such dir unten eine Bahn") and `fit.ridesBody`/`fit.pin` (top
      = keep, bottom = cut first) — and both are genuinely true at every width the
      copy renders at: `bodyGrid` is `sm:hidden`, paired with a separate `hidden sm:block` line for the breakpoint where the ride search is no longer below the
      grid, and the fit list's top/bottom is a `flex-col` document order that never
      reflows horizontally. Matches "vertical order is usually safe" from the
      site-wide rule.
- [x] No aphoristic closing sentence anywhere in the copy. No `ehrlich` in German.
      **Confirmed, full re-read this pass, all six locales** (not just the German spot
      check): no instance of "ehrlich" in any form, and no closing-sentence maxim
      anywhere in the `planner` namespace (`title`/`page`/`wizard`/`fit` prose read
      end-to-end in `de`, `en`, `nl`, `fr`, `es`, `it` — all functional/factual, nothing
      that reads as a restated moral).
- [x] Umami: every event property is billed as an event. Do not instrument each drag.
      Confirmed: only three call sites found (`trackPlannerOpened`,
      `trackPlanOptimized`, `trackPlanDayStarted`); nothing fires per pointer move.

---

## 6. Open questions

- [ ] Ride duration does not exist in the data. Without it a plan cannot say when you
      are back out of the queue. Estimate per ride type from the glossary profile,
      curate the headliners by hand, or leave it out and plan queue-to-queue?
- [x] ~~How far ahead are showtimes genuinely known?~~ — answered by §2.5's frontend
      evidence: `/plan/day` marks each show line with a `source` (the operator's own
      listing vs. a projected "last matching weekday carried forward"), so the answer
      is per-date rather than one global horizon, and `lib/planner/shows.ts` already
      renders that distinction rather than treating every date the same.
- [ ] Optimiser scope: greedy over rope-drop and hour profiles is a day's work and
      gets most of the value. Anything better is a routing problem and a project of
      its own.
- [ ] Trip share links are unauthenticated by design. Expiry, and whether an edit
      needs a second secret.
- [ ] Is lead-time error actually flat? `/v1/ml/accuracy/trends/hourly` shows mae
      varying only 6.9–8.8 across the hours of the day. If the same holds across days
      ahead, the four tiers differ in _provenance_ but barely in _width_, and the
      visual language has to carry that honestly instead of dramatising it (§2.2b).
- [ ] `day.hourly` is park-wide, not per ride. Worth turning on for the day-detail
      chart that already exists, but it does not answer the planner's question and
      must not be mistaken for it.

---

## 7. Recon artefacts

Two workflow recons produced the facts above. Their reports are session-scratch, not
committed. If they are needed again: frontend recon covered ML/forecast, calendar
context, ride pages, persistence, UI overlays, i18n, push and conventions; backend
recon covered the ML service, the NestJS ML module, calendar and stats, attractions
and queues, infra/auth/jobs, and docs. Everything either produced that matters to the
build is quoted in this file with its file:line, so the reports themselves are
disposable.
