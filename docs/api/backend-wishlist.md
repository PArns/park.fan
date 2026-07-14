# Backend Change Requests (SEO & Performance)

Compiled July 2026 alongside the "park pages ship their core content in the first HTML" work
(see [SEO analysis](../seo/analysis.md), [changelog](../changelog.md)). The frontend now
server-renders the attraction list, best-days text and crowd FAQ from cached snapshots — the
items below are the backend counterparts that turn the remaining guards (seed timeout, 1-day
snapshot TTL) from load-bearing into belt-and-braces.

Priorities: **P0** unblocks live frontend behavior · **P1** big payoff, needs coordination ·
**P2** cleanups.

> **Status (July 2026):** ✅ **P0 (best-days endpoint) and the P1 calendar payload diet shipped**
> in backend PR [PArns/v4.api.park.fan#94] and are live. The frontend now reads `/best-days`
> everywhere (SSR seed + client best-days/FAQ/forecast) — see the changelog entry "SEO: park
> best-days now read the precomputed /best-days endpoint". The remaining items below (per-park
> structure/operating revalidation, `/stats` precompute, geo-dupe, slug aliases, top-level
> `dataTimestamp`) are still open.

---

## P0 · Lean precomputed best-days endpoint — ✅ SHIPPED

**Problem (was):** the best-days/FAQ/forecast content was derived from `/v1/parks/{path}/calendar` —
a ~2.25 MB response (≈98 % per-day `influencingHolidays`, unused by these consumers) with
**lazy compute of 10–20 s on a cold park**. The frontend guarded its SSR seed with a timeout and
only rendered the best-days block when its own SWR cache was warm.

**Delivered:** `GET /v1/parks/.../best-days` — a materialized Redis snapshot (today → +90d, park
tz), ~15 KB, `p99 < 300 ms` cold & warm, `Cache-Control: public, max-age=3600, s-maxage=3600,
stale-while-revalidate=86400`, refreshed by the 12 h calendar warmup which fires
`revalidateTag('best-days:<slug>')` (Bearer-auth) at the frontend. Frontend switch:
`getBestDaysCalendar`/`getBestDaysCalendarSeed` (SSR seed, Next data-cached + tagged),
`getBestDaysSnapshotFresh` (`/api/parks/.../best-days` proxy), `useParkBestDaysCalendar` (client),
and the seed now also carries the stats-quality `byDayOfWeek` weekday ranking into the first HTML.
The verbatim original spec is preserved below for reference.

**Request:** a dedicated, **precomputed** endpoint that returns exactly the projection the
frontend keeps today (`projectBestDaysCalendar` in `lib/api/integrated-calendar.ts`):

```
GET /v1/parks/{continent}/{country}/{city}/{parkSlug}/best-days
```

- **Window:** rolling `today → +90 days` in the **park's timezone**, no params required.
  (Optional `from`/`to` accepted for future use, capped at 90 days.)
- **Response** (target ≤ 15 KB uncompressed):

```jsonc
{
  "meta": {
    "slug": "phantasialand",
    "timezone": "Europe/Berlin",
    "hasOperatingSchedule": true,
    "computedAt": "2026-07-14T03:10:00Z", // when the forecast batch produced this
    "windowFrom": "2026-07-14",
    "windowTo": "2026-10-12"
  },
  "days": [
    {
      "date": "2026-07-14", // YYYY-MM-DD, park tz
      "status": "OPERATING", // ParkStatus enum
      "crowdLevel": "low", // very_low|low|moderate|high|very_high|extreme|closed
      "predictedCrowdLevel": "low", // optional: absent when unratable
      "isHoliday": false,
      "isSchoolVacation": true,
      "isBridgeDay": false
    }
  ],
  // OPTIONAL nice-to-have: lets the frontend render the stats-quality weekday
  // ranking without the (also slow) /stats aggregate:
  "byDayOfWeek": [{ "dayOfWeek": 1, "avgCrowdScore": 2.1, "sampleDays": 98 }]
}
```

- **Explicitly NOT included:** `influencingHolidays`, weather, hourly arrays, events,
  schedule/hours detail. (`isToday` is also unnecessary — the frontend derives it from
  `date` + `timezone`; a baked flag goes stale in caches.)
- **Performance SLO:** served from a materialized store (table/Redis) that the daily
  forecast run refreshes — **p99 < 300 ms, cold and warm; never lazy ML compute on
  request**. This SLO is what lets the frontend drop its seed timeout guard.
- **HTTP caching:** `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
  (+ ETag), no auth variance → CDN absorbs repeat traffic.
- **Refresh hook:** after each daily forecast batch, `POST https://park.fan/api/revalidate`
  with `{ "tags": ["best-days:<parkSlug>", …] }` (endpoint + tag already exist, see
  [backend-integration](backend-integration.md#on-demand-revalidation)) — batched for all
  recomputed parks.
- **Errors:** `404` for unknown park; `200` with `"days": []` for parks without predictions
  (frontend already degrades gracefully).

**Frontend follow-ups once live** (tracked here so the payoff is visible):
`getBestDaysCalendarSeed` switches to this endpoint (timeout becomes a formality);
`useParkBestDaysCalendar` + FAQ + header-forecast clients switch too — every park page view
stops pulling ~2.25 MB through the `/api` proxy; the calendar **grid tab** keeps using the
full `/calendar` endpoint (it genuinely needs hours/weather per day).

---

## P1 · On-change revalidation webhooks (per-park)

The frontend's park snapshot (`getParkByGeoPath`) revalidates time-based once per **day** —
deliberately, because shorter TTLs re-create the documented data-cache write volume (see
[caching-strategy](../architecture/caching-strategy.md)). Consequence: crawled wait values are
up to a day old (rendered honestly as "Datenstand …").

The "read first, only write on change" fix is the backend firing `/api/revalidate`:

1. **Structure changes** (new/renamed attraction, re-slug, schedule import): tag `parks`
   today; once the frontend adds per-park tags (`park:<slug>` — small coordinated change),
   scope it per park.
2. **Forecast batch done:** `best-days:<slug>` (see P0).
3. **Optional freshness upgrade:** for parks currently **OPERATING**, ping the per-park tag
   every 15–30 min while open. ~30 open EU parks × daytime ≈ a few hundred targeted
   revalidations/day — crawled wait times become 15–30 min fresh instead of 1 day, with no
   time-based write churn across the idle long tail.

---

## P1 · Calendar payload diet — ✅ SHIPPED

Delivered in the same backend PR: `/v1/parks/{path}/calendar` no longer returns per-day
`influencingHolidays` by default (opt back in with `?include=influencingHolidays`). Verified live:
the default calendar body dropped from ~2.25 MB to ~50 KB. The frontend needed no change — grep
confirmed no consumer of `CalendarDay.influencingHolidays`; the header holiday panel reads
`schedule[].influencingHolidays` from the **park** endpoint, which is untouched (the scope guard
below held). Original note kept for reference:

Per-day `influencingHolidays` on `/v1/parks/{path}/calendar` is ~98 % of the ~2.25 MB body and
is read by **no** frontend consumer of that endpoint — verified by grep: the only readers of
`influencingHolidays` are `use-today-schedule.ts` / `park-time-info.tsx`, and both consume
`ScheduleItem.influencingHolidays` (the **park** endpoint's `schedule[]`), while the calendar
type's `CalendarDay.influencingHolidays` has zero consumers. Drop it by default or gate it
behind `?include=influencingHolidays`. Payoff: the calendar grid tab and per-month client
fetches shrink ~50×, and Next's 2 MB fetch-cache cap stops being a design constraint.

> ⚠️ **Scope guard:** this diet applies ONLY to the per-day field on `/calendar`. The park
> endpoint's `schedule[].influencingHolidays` MUST keep shipping — it feeds the
> "Ferien in Nachbarregionen" header panel (`HeaderHolidayPanel`) and `ParkTimeInfo` on every
> park page. Removing it there would silently kill that section.

---

## P2 · Precompute `/stats` (2-year aggregates)

Same lazy-compute pattern as the calendar (cold responses documented at 10–20 s). Materialize
after the nightly run. Payoff: the historical-stats section loads instantly, and it unblocks
the planned SEO long-tail ("`{park}` Wartezeiten `{Monat} {Jahr}`" monthly statistics pages —
see [seo-roadmap](../seo/seo-roadmap.md) Phase 3A).

## P2 · Geo structure: duplicate park entry

`universal-studios-hollywood` exists under both `bull-creek` and `los-angeles` (open bug noted
in [analysis.md](../seo/analysis.md) item 0) → duplicate sitemap entries and a redirect
ambiguity. One canonical city per park, please.

## P2 · Slug stability / alias feed

The July 2026 re-slug (`bruhl` → `bruehl` …) 404ed every indexed German URL. The frontend now
has `findRelocatedParkRedirect` as a safety net, but the clean fix is backend-side: keep old
slugs resolving (alias map in `/v1/discovery/geo` or a dedicated alias feed) so the frontend
can 301 deterministically without GSC forensics.

## P3 · Top-level snapshot timestamp

The park page's "Datenstand" line currently derives from `max(queues[].lastUpdated)` across
attractions. A top-level `park.dataTimestamp` would be cheaper and unambiguous (e.g. for parks
where all queues are closed and carry stale `lastUpdated`).

---

## Related

- [Backend Integration](backend-integration.md) · [Caching Strategy](../architecture/caching-strategy.md)
- [SEO Analysis](../seo/analysis.md) · [SEO Roadmap](../seo/seo-roadmap.md)
- Backend repo: [v4.api.park.fan](https://github.com/park-fan/v4.api.park.fan)
