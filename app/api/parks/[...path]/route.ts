import geomagnetism from 'geomagnetism';
import { NextRequest, NextResponse } from 'next/server';
import { getIntegratedCalendar, getBestDaysSnapshotFresh } from '@/lib/api/integrated-calendar';
import {
  getParkByGeoPath,
  getParkByGeoPathFresh,
  getAttractionByGeoPathFresh,
  getParkWaitTimesFresh,
  leanParkForLivePoll,
} from '@/lib/api/parks';
import { getParkWeatherNowcastFresh } from '@/lib/api/weather-nowcast';
import { getParkHistoricalStats, getParkHourlyProfile, getRideDayCurve } from '@/lib/api/stats';
import { getPlanDay } from '@/lib/api/plan';
import {
  enrichAttractionsWithImages,
  getCardObjectPosition,
  getParkBackgroundImage,
} from '@/lib/utils/park-assets';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';
import { isServableHourlyDate } from '@/lib/utils/calendar-utils';
import {
  applyNowcastSimulation,
  applyParkSimulation,
  parseParkSimulation,
} from '@/lib/parks/park-simulation';
import { isSlugPath } from '@/lib/utils/servable-route';
import { pickRideFigures } from '@/lib/api/ride-figures';

/**
 * A day for `/stats` and `/stats/hourly`, which the backend recomputes once a day and itself
 * caches for a day. `max-age` is named too: without it a browser re-requests the aggregate on
 * every park-page view.
 */
const STATS_AGGREGATE_CACHE = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400';

/**
 * How long the API's own 404 (no such park, no such aggregate, too few days for a curve) may be
 * reused. A failure of ours throws and leaves as an uncached 500, so an outage is never stored as a
 * fact about the park. Shorter than the 200s' window because a park can cross the threshold.
 */
const STATS_MISSING_CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=21600';

/**
 * Five minutes for `…/calendar/hourly`: today's series starts at the current UTC hour, so it
 * moves every hour. No `max-age`, because the browser's window is `CALENDAR_HOURLY_STALE_TIME_MS`
 * in React Query. The backend's own cache until park-local midnight still binds, and expired bars
 * are dropped at render (`upcomingHourlyPredictions`); this window only keeps our layer from
 * adding to it. Repeated verbatim in next.config.ts, since which of the two wins depends on where
 * it runs.
 */
const CALENDAR_HOURLY_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=300';

/**
 * The window for `…/ride-stats`, the map popups' speed, height and duration.
 *
 * Repeated verbatim in next.config.ts like every other cacheable /api route. The figures are
 * curated or come from Wikidata and change when somebody edits a ride, so a day is generous.
 */
const RIDE_STATS_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400';

/**
 * On every failure: a response without its own Cache-Control takes the window next.config.ts
 * declares for its path (a day for the calendar), so one backend hiccup would be cached as a day of
 * errors.
 */
const NO_STORE = { 'Cache-Control': 'no-store, must-revalidate' };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const { path } = resolvedParams;

  // Before any segment reaches a backend URL: see `isSlugPath`.
  if (!path || !isSlugPath(path)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // The park page's live poll.
  if (path && path.length === 4) {
    const [continent, country, city, park] = path;

    try {
      // Fresh, not the cached snapshot the page render uses, so the poll carries the latest waits.
      const parkData = await getParkByGeoPathFresh(continent, country, city, park);

      if (!parkData) {
        return NextResponse.json({ error: 'Park not found' }, { status: 404 });
      }

      // Dev/preview `?state=`, as on the server render: `weather` is in the projection below, so
      // without this the first poll would wash a simulated warning off the page.
      const simulated = applyParkSimulation(
        parkData,
        parseParkSimulation(request.nextUrl.searchParams.get('state'))
      );

      // Only the fields that can change between two polls, laid back over the server-rendered park
      // (`mergeLiveParkSnapshot`). `?full=1` adds shows and restaurant status, which the client
      // asks for about every half hour because neither the render nor a normal poll keeps them
      // current. See docs/rules/api-budget-per-page.md.
      const snapshot = leanParkForLivePoll(simulated, {
        daily: request.nextUrl.searchParams.get('full') === '1',
      });

      // Photos are resolved on the server: the attraction grid is a Client Component, and doing
      // it there would put the media catalog in the bundle. `park: { slug }` is only the lookup
      // key and is stripped again, since the merge would let a slug-only `park` replace the full
      // one.
      snapshot.attractions = enrichAttractionsWithImages(
        snapshot.attractions.map((a) => ({ ...a, park: { slug: park } }))
      ).map(({ park: _lookupKey, ...ride }) => ride);

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

      return NextResponse.json(
        { error: 'Failed to fetch park data' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  if (path && path.length === 5 && path[4] === 'calendar') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required query parameters: from, to' },
        { status: 400 }
      );
    }

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
        // The hourly curve is scoped to the hour it was fetched in and this response is cached for
        // a day, so `…/calendar/hourly` below serves it instead.
        includeHourly: 'none',
      });

      // A day: every field is a statement about a whole day. A schedule correction arrives through
      // the park's cache tag (`sync-schedules-only` posts it to /api/revalidate), not through
      // expiry. The stale window is a second day because the slow path is a per-day aggregation
      // nobody should wait for.
      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=86400, stale-while-revalidate=86400'),
      });
    } catch (error) {
      console.error('[Calendar API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar data' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  // One day's hourly crowd curve (`?date=`), for the day-detail dialog's bar chart. A path of its
  // own rather than a parameter on the branch above: the matching `headers()` rule in
  // next.config.ts matches a path, never a query string, and both halves must name the same window.
  if (path && path.length === 6 && path[4] === 'calendar' && path[5] === 'hourly') {
    const [continent, country, city, park] = path;
    const date = new URL(request.url).searchParams.get('date');

    // Bounded to a real calendar day inside today ± a day, because the value lands in the CDN
    // cache key — see `isServableHourlyDate`, which is pinned by `pnpm test:calendar`.
    if (!date || !isServableHourlyDate(date, Date.now())) {
      return NextResponse.json(
        { error: 'Missing or out-of-range query parameter: date (YYYY-MM-DD, today ± a day)' },
        { status: 400 }
      );
    }

    try {
      // `today+tomorrow`, not `all`: the backend has no curve beyond tomorrow, and the narrower
      // word says so.
      const data = await getIntegratedCalendar(continent, country, city, park, {
        from: date,
        to: date,
        includeHourly: 'today+tomorrow',
      });

      // Only the two fields the chart reads: the rest of the day is already on the client from the
      // month fetch. An empty `hourly` (any day but today and tomorrow) hides the section.
      return NextResponse.json(
        { date, hourly: data.days?.[0]?.hourly ?? [] },
        { headers: cdnCacheHeaders(CALENDAR_HOURLY_CACHE_CONTROL) }
      );
    } catch (error) {
      console.error('[Calendar hourly API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hourly forecast' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  // The best-days snapshot for the next 90 days. The backend serves it precomputed, so this proxy
  // only mirrors it behind a CDN window that collapses concurrent polls.
  if (path && path.length === 5 && path[4] === 'best-days') {
    const [continent, country, city, park] = path;

    try {
      const data = await getBestDaysSnapshotFresh(continent, country, city, park);

      return NextResponse.json(data, {
        headers: cdnCacheHeaders('public, s-maxage=3600, stale-while-revalidate=86400'),
      });
    } catch (error) {
      console.error('[Best-Days API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch best-days data' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  // Every ride's coordinates and nothing else, for the homepage's in-park compass (`/api/nearby`
  // carries none, and the full park is far heavier). Coordinates change only on a re-survey, so
  // this reads the day-cached park and the CDN keeps the answer for a day.
  if (path && path.length === 5 && path[4] === 'positions') {
    const [continent, country, city, park] = path;

    try {
      const parkData = await getParkByGeoPath(continent, country, city, park);

      if (!parkData) {
        return NextResponse.json({ error: 'Park not found' }, { status: 404 });
      }

      const positions = (parkData.attractions ?? [])
        .filter(
          (a) =>
            typeof a.latitude === 'number' &&
            typeof a.longitude === 'number' &&
            Number.isFinite(a.latitude) &&
            Number.isFinite(a.longitude)
        )
        // The filter above has checked both; TypeScript does not carry that through it.
        .map((a) => ({
          slug: a.slug,
          latitude: a.latitude as number,
          longitude: a.longitude as number,
        }));

      // A phone's compass points at magnetic north and the bearings to the rides are true north,
      // a gap of up to 11° (Disneyland Anaheim). So the park's declination rides along, from the
      // World Magnetic Model in `geomagnetism` at the middle of its rides.
      const middle = positions.length
        ? {
            lat: positions.reduce((sum, p) => sum + p.latitude, 0) / positions.length,
            lng: positions.reduce((sum, p) => sum + p.longitude, 0) / positions.length,
          }
        : null;
      const declination = middle
        ? Math.round(geomagnetism.model().point([middle.lat, middle.lng]).decl * 10) / 10
        : 0;

      return NextResponse.json(
        { positions, declination },
        {
          headers: cdnCacheHeaders(
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
          ),
        }
      );
    } catch (error) {
      console.error('[Positions API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ride positions' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  // Top speed, height and duration per ride, for the park map's popups. The page render leaves
  // `rideProfile` out (`leanParkForParkShell`), so the map asks when its tab opens. Day-stable like
  // `positions`.
  if (path && path.length === 5 && path[4] === 'ride-stats') {
    const [continent, country, city, park] = path;

    try {
      const parkData = await getParkByGeoPath(continent, country, city, park);

      if (!parkData) {
        return NextResponse.json({ error: 'Park not found' }, { status: 404 });
      }

      const stats = pickRideFigures(parkData.attractions ?? []);

      return NextResponse.json({ stats }, { headers: cdnCacheHeaders(RIDE_STATS_CACHE_CONTROL) });
    } catch (error) {
      console.error('[Ride-Stats API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ride figures' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  // The lean status and queue snapshot, polled by the blog's inline ride references so a static
  // post does not keep its build-time snapshot. The CDN window collapses concurrent readers of one
  // post onto one origin call.
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
      return NextResponse.json(
        { error: 'Failed to fetch wait times' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  if (path && path.length === 5 && path[4] === 'stats') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);

    // `topN` comes from a closed set: it is part of the CDN cache key, so an arbitrary number would
    // let any caller mint unlimited cold-compute misses. 30 is the one deeper value anything asks
    // for; everything else gets the backend default the park page already warms.
    const requestedTopN = Number(searchParams.get('topN'));
    const topN = requestedTopN === 30 ? 30 : undefined;

    try {
      // A slow two-year aggregate, served as a CDN-cached function response so it stays out of the
      // park page's static prerender.
      const stats = await getParkHistoricalStats(continent, country, city, park, 2, topN);

      if (!stats) {
        // `null` is the API's own 404 and nothing else, so it may be cached. A failure throws
        // and leaves through the catch below as an uncached 500.
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
      return NextResponse.json(
        { error: 'Failed to fetch stats data' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  // Median and busy wait per hour, ride by ride, for the "when is the queue longest" table. Its own
  // endpoint because the attraction detail payload is far heavier per ride. Recomputed daily, so
  // the window matches `/stats`.
  if (path && path.length === 6 && path[4] === 'stats' && path[5] === 'hourly') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    // Same closed-set rule as `topN` on `/stats`: these land in the CDN cache key.
    const requestedTopN = Number(searchParams.get('topN'));
    const topN = requestedTopN >= 1 && requestedTopN <= 12 ? Math.round(requestedTopN) : 8;

    try {
      const data = await getParkHourlyProfile(continent, country, city, park, { topN });

      if (!data) {
        // The API's 404 and nothing else: a failure throws and is answered uncached below.
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
      return NextResponse.json(
        { error: 'Failed to fetch hourly profile' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  // One ride's day curve. Five minutes, not an hour: most of the payload is today, and an hour-old
  // copy of today is the one thing this route must not serve.
  if (path && path.length === 6 && path[4] === 'stats' && path[5] === 'day') {
    const [continent, country, city, park] = path;
    const { searchParams } = new URL(request.url);
    // Passed through rather than validated against a list: the backend resolves the slug and
    // 404s an unknown one, and the value lands in the CDN key either way.
    const attraction = searchParams.get('attraction') ?? undefined;

    try {
      const data = await getRideDayCurve(continent, country, city, park, attraction);

      // `null` is the API's 404 (too few measured days), a settled answer: the hook stops asking.
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
      return NextResponse.json(
        { error: 'Failed to fetch day curve' },
        { status: 502, headers: NO_STORE }
      );
    }
  }

  // One day's plan. Fifteen minutes for every date: the date is in the CDN key, so a TTL scaled by
  // distance would cache one URL differently depending on when it was first asked for, and today,
  // the date that moves, is the most requested.
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

      // Photos resolved here, not in the client: the planner is a Client Component in every
      // layout, and importing `@/lib/media` there would ship the media catalog to every visitor.
      const withImages = enrichAttractionsWithImages(
        data.rides.map((ride) => ({ ...ride, slug: ride.attractionSlug, park: { slug: park } }))
      );
      // The park's own photo for the panel, for the same reason; `null` where the media database
      // has none.
      const enriched = {
        ...data,
        parkBackgroundImage: getParkBackgroundImage(park),
        parkBackgroundPosition: getCardObjectPosition(park),
        rides: withImages.map(({ slug: _slug, park: _park, ...ride }) => ride),
      };

      return NextResponse.json(enriched, {
        headers: cdnCacheHeaders('public, s-maxage=900, stale-while-revalidate=1800'),
      });
    } catch (error) {
      // Not a 404: the planner would otherwise read a broken endpoint as "this
      // park has no plan for that day" and quietly draw an empty timeline.
      console.error(`[Plan-Day API] ${continent}/${country}/${city}/${park}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch plan' },
        { status: 502, headers: NO_STORE }
      );
    }
  }

  if (path && path.length === 6 && path[4] === 'attractions') {
    const [continent, country, city, park, , attractionSlug] = path;

    try {
      // The heavy time series behind the ride page's charts, as a CDN-cached function response so
      // it stays out of the static prerender. It also carries the ride page's live panel, so the
      // stale half is short: `stale-while-revalidate` adds to the age a reader can be served. 300 s
      // matches the backend's own cache and is repeated in next.config.ts, because which of the
      // two wins depends on where it runs.
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
      return NextResponse.json(
        { error: 'Failed to fetch attraction data' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  if (path && path.length === 6 && path[4] === 'weather' && path[5] === 'nowcast') {
    const [continent, country, city, park] = path;

    try {
      // Fresh: this is a live poll, and a cache of ours on top of the upstream one freezes the
      // banner. The short CDN window still keeps repeated polls off the backend.
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
      return NextResponse.json(
        { error: 'Failed to fetch nowcast data' },
        { status: 500, headers: NO_STORE }
      );
    }
  }

  return NextResponse.json(
    {
      error:
        'Invalid path format. Expected: /api/parks/{continent}/{country}/{city}/{park}, /calendar, /calendar/hourly, /best-days, /ride-stats, /stats, /stats/hourly, /stats/day, /wait-times, or /weather/nowcast',
    },
    { status: 400 }
  );
}
