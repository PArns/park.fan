import { NextRequest, NextResponse } from 'next/server';
import { getIntegratedCalendar, getBestDaysSnapshotFresh } from '@/lib/api/integrated-calendar';
import {
  getParkByGeoPathFresh,
  getAttractionByGeoPathFresh,
  getParkWaitTimesFresh,
  leanParkForLivePoll,
} from '@/lib/api/parks';
import { getParkWeatherNowcastFresh } from '@/lib/api/weather-nowcast';
import { getParkHistoricalStats, getParkHourlyProfile, getRideDayCurve } from '@/lib/api/stats';
import { getPlanDay } from '@/lib/api/plan';
import { enrichAttractionsWithImages } from '@/lib/utils/park-assets';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';
import {
  applyNowcastSimulation,
  applyParkSimulation,
  parseParkSimulation,
} from '@/lib/parks/park-simulation';

/**
 * The shared-cache window for the two backend aggregates that are recomputed once a day.
 *
 * A day, because that is what the backend itself answers: `/stats` and `/stats/hourly` both leave
 * api.park.fan as `max-age=86400, s-maxage=86400, stale-while-revalidate=172800`, and this proxy
 * used to re-cache them at 3600 — capping a 24-hour aggregate at an hour and asking the origin for
 * the same object 24 times a day. `getParkHistoricalStats`'s own docstring already said "cached
 * 24h on success — data changes daily, not in real-time"; the window did not.
 *
 * `max-age` is named as well as `s-maxage`: without it a browser gets a `public` with no lifetime
 * and re-requests the aggregate on every park-page view.
 */
const STATS_AGGREGATE_CACHE = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400';

/**
 * How long a "this park has no such aggregate" answer may be reused.
 *
 * A 404 out of these three branches is the API's OWN 404 — no such park, no such aggregate, too
 * few measured days for a curve — and never a failure of ours. That distinction is load-bearing
 * and was not always true: the fetchers used to answer `null` for an unreachable backend as well,
 * so an outage was stored here as a settled fact about the park for an hour plus six of
 * stale-while-revalidate. They now throw instead, and a throw leaves through the catch blocks as
 * an uncached 500.
 *
 * Note that "too little history for a two-year aggregate" is NOT one of these cases: the API
 * answers a thin park with a 200 and an aggregate to match. Until now every one of these answers
 * was returned bare — so it inherited the blanket `no-store` on `/api/:path*` and every reader of
 * a thin park's page paid a fresh Vercel invocation plus a backend round trip to be told no again.
 * Shorter than the 200s' window because the direction that is wrong rather than old is a park
 * CROSSING the threshold.
 */
const STATS_MISSING_CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=21600';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const { path } = resolvedParams;

  // Handle park data: [continent, country, city, park] (4 segments)
  // e.g., ['europe', 'germany', 'rust', 'europa-park']
  if (path && path.length === 4) {
    const [continent, country, city, park] = path;

    try {
      // Fresh (no-store) so the client poll reflects the backend's latest wait times — NOT the
      // cached shell snapshot (which now lives 6h). getParkByGeoPathFresh resolves to null on 404.
      const parkData = await getParkByGeoPathFresh(continent, country, city, park);

      if (!parkData) {
        return NextResponse.json({ error: 'Park not found' }, { status: 404 });
      }

      // Dev/preview `?state=` — the same scenarios the page applied to the server render. It has
      // to happen here too: `weather` IS in the projection below, so without this the first poll
      // would quietly wash a simulated warning off a page that was rendered with one.
      const simulated = applyParkSimulation(
        parkData,
        parseParkSimulation(request.nextUrl.searchParams.get('state'))
      );

      // Only the fields that can change between two polls — the client lays them back over the
      // park it was server-rendered with (see leanParkForLivePoll / mergeLiveParkSnapshot).
      //
      // `?full=1` adds the day-scoped block (shows + restaurant status). The client asks for it on
      // its first poll and roughly every half hour after that, because those two are the only
      // things on the page that neither the server render nor a normal poll keeps honest: the
      // render's copy is up to PARK_REVALIDATE old and the poll never carried them. It costs
      // nothing upstream — the fetch above is the same request either way.
      const snapshot = leanParkForLivePoll(simulated, {
        daily: request.nextUrl.searchParams.get('full') === '1',
      });

      // Attach each ride's photo and focal point here, on the server. The park page's
      // attraction grid is a Client Component fed by this poll, so resolving them in
      // the card instead would put the whole media catalog in the browser's bundle.
      snapshot.attractions = enrichAttractionsWithImages(
        snapshot.attractions.map((a) => ({ ...a, park: { slug: park } }))
      );

      // No caching - we want fresh live data
      return NextResponse.json(snapshot, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error('[Park API] Error:', error);

      if (error instanceof Error && error.message.includes('404')) {
        return NextResponse.json({ error: 'Park not found' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Failed to fetch park data' }, { status: 500 });
    }
  }

  // Handle calendar data: [continent, country, city, park, 'calendar'] (5 segments)
  // e.g., ['europe', 'germany', 'bruehl', 'phantasialand', 'calendar']
  if (path && path.length === 5 && path[4] === 'calendar') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validate required parameters
    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required query parameters: from, to' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected: YYYY-MM-DD' },
        { status: 400 }
      );
    }

    try {
      const data = await getIntegratedCalendar(continent, country, city, park, {
        from,
        to,
        includeHourly: 'none', // No hourly data needed for calendar view
      });

      // A day, because a calendar month is a set of statements about days and none of them
      // moves faster than that any more. It was 300 s for one reason: today's cell carried a
      // live occupancy spot reading the backend rewrote every five minutes. That override is
      // gone (today reads the ML forecast now), and with it the only volatile field in this
      // payload.
      //
      // What can still change inside a day is a schedule correction, and it does not wait for
      // this window: `sync-schedules-only` posts the park's cache tag to /api/revalidate, so a
      // correction arrives through the tag rather than through expiry.
      //
      // The stale window is a second day: this endpoint's slow path is a live PERCENTILE_CONT
      // aggregation, one query per day of the range, so an expiry that blocks is an expiry
      // somebody waits 2.75 s for.
      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=86400, stale-while-revalidate=86400'),
      });
    } catch (error) {
      console.error('[Calendar API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
    }
  }

  // Handle best-days snapshot: [continent, country, city, park, 'best-days'] (5 segments)
  // The lean precomputed today→+90d projection (status, crowd level, holiday flags + optional
  // weekday aggregate) that feeds the best-days section, crowd FAQ and header forecast. Served
  // from the backend's materialized Redis snapshot (never a lazy ML compute), so this proxy just
  // mirrors it behind a matching CDN window — collapsing concurrent client polls off the origin.
  if (path && path.length === 5 && path[4] === 'best-days') {
    const [continent, country, city, park] = path;

    try {
      const data = await getBestDaysSnapshotFresh(continent, country, city, park);

      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=3600, stale-while-revalidate=86400'),
      });
    } catch (error) {
      console.error('[Best-Days API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch best-days data' }, { status: 500 });
    }
  }

  // Handle lean live wait times: [continent, country, city, park, 'wait-times'] (5 segments)
  // The whole-park status + queue snapshot (~9 KB vs ~95 KB for the full park payload), polled by
  // the blog's inline ride references so a statically generated post doesn't keep showing its
  // build-time "closed" snapshot. The backend caches this 5 min; a matching CDN window collapses
  // concurrent readers of the same post onto one origin call.
  if (path && path.length === 5 && path[4] === 'wait-times') {
    const [continent, country, city, park] = path;

    try {
      const data = await getParkWaitTimesFresh(continent, country, city, park);

      if (!data) {
        return NextResponse.json({ error: 'Park not found' }, { status: 404 });
      }

      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=60, stale-while-revalidate=240'),
      });
    } catch (error) {
      console.error('[Wait-Times API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch wait times' }, { status: 500 });
    }
  }

  // Handle historical stats: [continent, country, city, park, 'stats'] (5 segments)
  // e.g., ['europe', 'germany', 'bruehl', 'phantasialand', 'stats']
  if (path && path.length === 5 && path[4] === 'stats') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);

    // `topN` is forwarded from a CLOSED SET, not passed through. It is part of the cache key at
    // the CDN, so an arbitrary number lets any caller mint unlimited distinct objects per park —
    // each of which is a cold-compute miss on the backend. 30 is the one deeper value anything
    // asks for (the ride tables that name specific rides); everything else falls back to the
    // backend default, which is the object the park page already warms.
    const requestedTopN = Number(searchParams.get('topN'));
    const topN = requestedTopN === 30 ? 30 : undefined;

    try {
      // 2-year aggregate — large and slow to compute (cold-park lazy compute is retried inside
      // getParkHistoricalStats). Serving it through this function response keeps the response on
      // the CDN (s-maxage) WITHOUT pulling the slow fetch into the park page's static prerender:
      // this is a cacheable function response, NOT an ISR write of the page shell.
      const stats = await getParkHistoricalStats(continent, country, city, park, 2, topN);

      if (!stats) {
        // `null` is the API's own 404 and nothing else — no such park, no such aggregate —
        // so this is a settled answer and may be cached. Uncached, every reader of a thin
        // park's page paid a fresh invocation and a backend round trip for the same no.
        //
        // It used to mean something else as well, and that is what made this branch
        // dangerous: `getParkHistoricalStats` also returned `null` when all four attempts
        // failed. A park with THIN history was never this case — the API answers those with
        // a 200 — so in practice the 404 fired only for outages, and cached each one for an
        // hour plus six of stale-while-revalidate. Measured on 2026-09-03: Phantasialand's
        // stats came back `{"error":"Stats not available"}` from the edge (`x-vercel-cache:
        // HIT`) in 158 ms — too fast to have retried at all — while the API answered every
        // request with 200 and 3.3 KB. A failure now throws and lands in the catch below,
        // which returns an uncached 500.
        return NextResponse.json(
          { error: 'Stats not available' },
          { status: 404, headers: cdnCacheHeaders(STATS_MISSING_CACHE) }
        );
      }

      return NextResponse.json(stats, {
        headers: cdnCacheHeaders(STATS_AGGREGATE_CACHE),
      });
    } catch (error) {
      console.error('[Stats API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch stats data' }, { status: 500 });
    }
  }

  // Handle the hourly profile: [continent, country, city, park, 'stats', 'hourly'] (6 segments)
  // Median and busy wait per hour of the operating day, ride by ride — the matrix behind the
  // "when is the queue longest" table. Its own endpoint rather than a slice of the attraction
  // detail payload: that one is ~53 KB per ride, so an eight-ride table cost 424 KB against ~2 KB
  // here. Recomputed once a day on the backend, so the CDN window matches `/stats`.
  if (path && path.length === 6 && path[4] === 'stats' && path[5] === 'hourly') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    // Same closed-set rule as `topN` on `/stats`: these land in the CDN cache key.
    const requestedTopN = Number(searchParams.get('topN'));
    const topN = requestedTopN >= 1 && requestedTopN <= 12 ? Math.round(requestedTopN) : 8;

    try {
      const data = await getParkHourlyProfile(continent, country, city, park, { topN });

      if (!data) {
        // The API's 404, and nothing else: a failure throws and is answered uncached by the
        // catch below. Caching a transient failure here would store our outage as a fact
        // about the park for an hour — see the note on the `/stats` branch above.
        return NextResponse.json(
          { error: 'Hourly profile not available' },
          { status: 404, headers: cdnCacheHeaders(STATS_MISSING_CACHE) }
        );
      }

      return NextResponse.json(data, {
        headers: cdnCacheHeaders(STATS_AGGREGATE_CACHE),
      });
    } catch (error) {
      console.error('[Hourly-Profile API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch hourly profile' }, { status: 500 });
    }
  }

  // Handle one ride's day curve: [continent, country, city, park, 'stats', 'day'] (6 segments)
  // Historical percentiles + today's measured hours + the forecast for the rest, in ~1 KB.
  //
  // s-maxage is FIVE minutes, not the hourly profile's hour: two thirds of this payload is today,
  // and an hour-old copy of "today" is the one thing this route must not serve.
  if (path && path.length === 6 && path[4] === 'stats' && path[5] === 'day') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    // Passed through rather than validated against a list: the backend resolves the slug and
    // 404s an unknown one, and the value lands in the CDN key either way.
    const attraction = searchParams.get('attraction') ?? undefined;

    try {
      const data = await getRideDayCurve(continent, country, city, park, attraction);

      // `null` is the API's 404 and nothing else: this park has too few measured
      // days for a curve. Passed through as a 404 because it is the settled
      // answer — the hook stops asking rather than retrying.
      if (!data) {
        return NextResponse.json(
          { error: 'Day curve not available' },
          { status: 404, headers: cdnCacheHeaders(STATS_MISSING_CACHE) }
        );
      }

      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=300, stale-while-revalidate=600'),
      });
    } catch (error) {
      // A real failure, and it must not leave here as a 404 — the card walks its
      // candidate list on a 404 and would quietly hide a broken endpoint behind
      // six parks in a row that "have no curve".
      console.error(`[Ride-Day-Curve API] ${continent}/${country}/${city}/${park}:`, error);
      return NextResponse.json({ error: 'Failed to fetch day curve' }, { status: 502 });
    }
  }

  // Handle one day's plan: [continent, country, city, park, 'plan', 'day'] (6 segments)
  // Per-ride hourly curves for one date, plus that day's context.
  //
  // s-maxage is FIFTEEN minutes across the board rather than scaled by distance.
  // A day in November genuinely does not move and could hold for hours, but the
  // date is in the CDN key, so a per-distance TTL would mean the same URL is
  // cached differently depending on when it was first asked for — and today, the
  // one that does move, is by far the most requested date.
  if (path && path.length === 6 && path[4] === 'plan' && path[5] === 'day') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    // Passed through as-is: the backend validates the shape and 400s a bad one,
    // and inventing a second validator here would put two answers in the field.
    const date = searchParams.get('date') ?? undefined;

    try {
      const data = await getPlanDay(continent, country, city, park, date);

      if (!data) {
        return NextResponse.json(
          { error: 'Plan not available' },
          { status: 404, headers: cdnCacheHeaders(STATS_MISSING_CACHE) }
        );
      }

      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=900, stale-while-revalidate=1800'),
      });
    } catch (error) {
      // Not a 404: the planner would otherwise read a broken endpoint as "this
      // park has no plan for that day" and quietly draw an empty timeline.
      console.error(`[Plan-Day API] ${continent}/${country}/${city}/${park}:`, error);
      return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 502 });
    }
  }

  // Handle attraction detail: [continent, country, city, park, 'attractions', slug] (6 segments)
  // e.g., ['europe', 'germany', 'rust', 'europa-park', 'attractions', 'blue-fire-megacoaster']
  if (path && path.length === 6 && path[4] === 'attractions') {
    const [continent, country, city, park, , attractionSlug] = path;

    try {
      // The heavy time-series — daily `history` + `hourlyForecast` (+ schedule, bestVisitTimes,
      // predictionAccuracy) — that backs the daily chart, history grid and accuracy card. Serving
      // it through this CDN-cached function response (s-maxage) keeps it OFF the attraction page's
      // static prerender: it's a cacheable function response, NOT an ISR write of the page shell.
      //
      // 5 min fresh, 1 min stale. This response also carries the ride page's LIVE panel —
      // status, queues, wait time — since `useLiveAttractionData` stopped polling the whole park
      // for them, so this window is what decides how far the ride page can trail the park page's
      // cards (those poll `/api/parks/<geo>/<park>`, which is `no-store`). 300 s is exactly what
      // the backend caches an attraction for, so the fresh half adds no origin load at all; the
      // stale half is deliberately short, because `stale-while-revalidate` is added to the age a
      // reader can be served, not spent instead of it — 300 + 300 is a wait time up to ten minutes
      // old on a panel labelled live. next.config.ts had said 300 for months with no effect: on
      // Vercel a Cache-Control on a function response overrides the `headers()` rule for the same
      // route, and `next dev` resolves it the other way, so the two are kept identical.
      const data = await getAttractionByGeoPathFresh(
        continent,
        country,
        city,
        park,
        attractionSlug
      );

      if (!data) {
        return NextResponse.json({ error: 'Attraction not found' }, { status: 404 });
      }

      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=300, stale-while-revalidate=60'),
      });
    } catch (error) {
      console.error('[Attraction API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch attraction data' }, { status: 500 });
    }
  }

  // Handle weather nowcast: [continent, country, city, park, 'weather', 'nowcast'] (6 segments)
  if (path && path.length === 6 && path[4] === 'weather' && path[5] === 'nowcast') {
    const [continent, country, city, park] = path;

    try {
      // Fresh fetch: this is the live poll path, so we don't compound our own caches on top
      // of the upstream CDN (that froze the banner / hid the update countdown). A small shared
      // CDN window keeps repeated polls off the backend without re-introducing stale data.
      const data = applyNowcastSimulation(
        await getParkWeatherNowcastFresh(continent, country, city, park),
        parseParkSimulation(request.nextUrl.searchParams.get('state'))
      );

      if (!data) {
        return NextResponse.json({ error: 'Nowcast not available' }, { status: 404 });
      }

      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=60, stale-while-revalidate=120'),
      });
    } catch (error) {
      console.error('[Nowcast API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch nowcast data' }, { status: 500 });
    }
  }

  // Invalid path format
  return NextResponse.json(
    {
      error:
        'Invalid path format. Expected: /api/parks/{continent}/{country}/{city}/{park}, /calendar, /best-days, /stats, /stats/hourly, /stats/day, /wait-times, or /weather/nowcast',
    },
    { status: 400 }
  );
}

// No caching - we want fresh data on every request
