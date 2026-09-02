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

### 2.5 Showtimes into the day payload `[P1]`

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

- [ ] `/plan/day` returns the day's showtimes with coordinates. Shows are fixed time
      anchors — they are what the rest of the plan gets arranged around.
- [ ] Establish how far ahead showtimes are actually known. If it is only today,
      say so in the response rather than returning an empty array that reads as
      "no shows".

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

### 2.7 Trip storage and share links `[P1]`

- [ ] Table: trip id (short, URL-safe, unguessable), payload, created/updated,
      expiry. No account system exists for visitors and none is being built — the
      link is the credential. Say that plainly in the UI.
- [ ] `POST /v1/trips` → id, `GET /v1/trips/{id}`, `PUT /v1/trips/{id}`.
- [ ] Rate-limit writes. This is the first unauthenticated write endpoint in the API;
      check how `THROTTLE_BYPASS_KEYS` and the existing throttler apply.
- [ ] Size cap, and reject payloads that are not a trip.

### 2.8 Push `[P2]`

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
and its pure actions, the flyout (right-hand sheet / bottom sheet), the timeline with
pointer drag, the bar with its tier-dependent edge, the context band, the ride search,
the day picker, the overview of every park and day, the ride page's add control and the
calendar's "plan this day". `pnpm check:planner` drives all of it in a browser;
`pnpm test:planner-actions` covers the reducers.

`/plan/day` answers 404 in production until the backend PR is merged, and the panel says
so rather than drawing empty bars. That is the check's 404 branch, and it is an
assertion rather than a waiver.

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

- [x] Cookie holds a flag only (`planner=1`), not the plan. Server-readable, and the
      plan itself never leaves localStorage.
- [x] localStorage holds the plan (`parkfan_planner`), read through `secureJsonParse`.
- [ ] Backend sync for sharing (§2.7).
- [ ] `proxy.ts:39` strips `set-cookie` from every non-redirect response. Cookie
      writes happen client-side, like `rememberLocale()` does.
- [ ] Pre-mount state must reserve its own height. `FavoritesSection` is the cautionary
      tale in `CLAUDE.md`: it rendered `null` until it could read the cookie and then
      dropped a 232 px band onto the page.

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
- [ ] Keyboard equivalent for reordering. Drag alone is not an interface. **Still open.**
- [ ] **`AttractionCard` is a hostile drag surface.** Its root is a `<Link>`
      (`components/parks/attraction-card.tsx:168-172`) with a `hover:-translate-y-1`,
      and it carries `data-card-fx`, which a delegated `document`-level
      `pointerover`/`pointermove` listener picks up and drives with a GSAP
      `quickSetter` (`components/parks/card-pointer-fx.tsx:124-159`). A drag started on
      the card body fights link navigation, the hover transform and that listener at
      once. Use an explicit drag handle, and check what the delegated listener does
      while a drag is in flight.
- [ ] The natural drag surface already exists: `AttractionWaitOverview`
      (`components/parks/attraction-wait-overview.tsx:127-157`) is a `<ul class="divide-y">`
      of plain `<li>` rows with no link root and no photo. Same for
      `RopeDropHeadliners` (`rope-drop-headliners.tsx:29-56`).
- [ ] The card's top glass panel already reserves `padding: '14px 52px 13px 16px'` for
      the favourite star at `top-3 right-3` (`attraction-card.tsx:207-233`). A second
      control there needs more right padding, not a second absolute child.

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

- [x] The planner is mounted in the layout but is closed on almost every page view.
      Its namespace is in `LAZY_MESSAGE_BOUNDARIES` and is fetched as a per-locale chunk,
      the way `FavoritesSection` handles `parks`+`attractions`. Two boundaries now: the
      launcher, and the calendar's "plan this day".
- [ ] The eager skeleton must reserve the same box so the swap costs no layout shift.
- [x] `pnpm check:client-messages` has to stay green at every step. A missing
      namespace does not throw — next-intl logs MISSING_MESSAGE and renders the raw
      key.
- [ ] Six locales, no exceptions. **Still German only** — deliberately, per the brief.

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
      tier: crisp for tier A, softer and wider for C and D. `RideDayCurve` already
      draws exactly this band (`ride-day-curve.tsx:277-286`, `buildBandPath`) — extend
      that geometry rather than writing a second one.
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
