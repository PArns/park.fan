import 'server-only';
import { NextResponse } from 'next/server';

import { denyUnlessAdmin } from '@/lib/admin/session';
import { getParkByGeoPathFresh } from '@/lib/api/parks';
import { getParkHistoricalStats } from '@/lib/api/stats';
import { getParkImages, getRideImages } from '@/lib/media';
import { buildBacklog, type BacklogRide } from '@/lib/media/photo-backlog';
import { getStandbyWait } from '@/lib/utils/park-utils';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';

/**
 * One park's photo backlog: which rides have no picture, hardest-hitting first.
 *
 * The existing `/coverage` endpoint answers half of this and stays the right call
 * from the park editor, where the ride list is already on screen. Standing in a
 * park with a phone there is no ride list, and assembling one client-side means
 * pulling the whole park payload (65–85 KB, measured across Phantasialand, Movie
 * Park and Europa-Park) over park WLAN and then re-deriving the ranking in the
 * browser. This does it once, on the server, and answers a few KB.
 *
 * `/api/nearby` is deliberately NOT the source. It drops rides without coordinates
 * and rides that are definitively out of season — reasonable for "what can I ride
 * right now", wrong here, because the ride that cannot open before November is
 * exactly the one nobody has ever photographed.
 *
 * Both upstream calls may fail, and they fail differently:
 *   - no park payload → 404/502, there is nothing to say
 *   - no `/stats`     → the ranking loses its top layer and carries on, which is
 *                       what the layering in `lib/media/photo-backlog.ts` is for.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** The park payload is cheap; `/stats` retries a cold aggregate for a few seconds. */
export const maxDuration = 60;

/**
 * `topN: 30` rather than the default 10, and rather than something bigger.
 *
 * It is one of the two values `/api/parks/.../stats` forwards from its closed set,
 * so this asks for an object the backend may already hold instead of minting a
 * third cache key per park. Thirty ranked rides covers three quarters of a
 * mid-sized park; below that the ordering falls back to `isHeadliner` and today's
 * numbers, which is what it is built to do.
 */
const STATS_TOP_N = 30;

/** `/v1/parks/a/b/c/d`, `/parks/a/b/c/d` and `a/b/c/d` all name the same park. */
function geoSegments(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw
    .replace(/^\/?(?:v1\/)?parks\//, '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (parts.length !== 4) return null;
  if (parts.some((segment) => !/^[a-z0-9][a-z0-9-]*$/.test(segment))) return null;
  return parts;
}

export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;

  const segments = geoSegments(new URL(request.url).searchParams.get('path'));
  if (!segments) {
    return NextResponse.json(
      { error: 'path must be continent/country/city/park' },
      { status: 400 }
    );
  }
  const [continent, country, city, parkSlug] = segments;

  const park = await getParkByGeoPathFresh(continent, country, city, parkSlug);
  if (!park) return NextResponse.json({ error: 'Park not found' }, { status: 404 });

  // Sequential rather than in parallel with the park: losing this costs one layer
  // of the ordering, not the answer, and a cold aggregate retries for seconds.
  const stats = await getParkHistoricalStats(
    continent,
    country,
    city,
    parkSlug,
    2,
    STATS_TOP_N
  ).catch(() => null);

  const rankBySlug = new Map<string, { rank: number; p90: number }>();
  for (const row of stats?.topAttractions ?? []) {
    rankBySlug.set(row.attractionSlug, { rank: row.rank, p90: row.avgWaitP90 });
  }

  const rides: BacklogRide[] = (park.attractions ?? []).map((attraction) => {
    const ranked = rankBySlug.get(attraction.slug);
    return {
      slug: attraction.slug,
      name: attraction.name,
      land: attraction.land ?? null,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      waitTime: getStandbyWait(attraction),
      peakWaitToday: attraction.statistics?.peakWaitToday ?? null,
      isHeadliner: Boolean(attraction.isHeadliner),
      statsRank: ranked?.rank ?? null,
      p90: ranked?.p90 ?? null,
      hasRideProfile: Boolean(attraction.rideProfile),
      isCurrentlyInSeason: attraction.isCurrentlyInSeason ?? null,
      // `getRideImages`, not a folder listing: a Halloween photo of Troy lives in
      // `toverland-halloween` and answers for the ride all the same, and one file
      // naming a second slug in `alsoRides` covers both halves of Winja's.
      hasPhoto: getRideImages(parkSlug, attraction.slug).length > 0,
    };
  });

  return NextResponse.json(
    {
      park: {
        slug: parkSlug,
        name: park.name,
        path: segments.join('/'),
        latitude: park.latitude ?? null,
        longitude: park.longitude ?? null,
        timezone: park.timezone ?? null,
        /** The park's own background photo — the gap the ride list cannot show. */
        hasBackground: getParkImages(parkSlug).some((image) =>
          image.roles.includes('park-background')
        ),
        /**
         * File names already used in `public/media/<park>/`, so the phone can name
         * a new photograph without colliding.
         *
         * A ride with no picture gets its slug; a second shot of it needs a
         * suffix, and picking one blind is how a save silently overwrites the
         * photo taken an hour earlier — `commit` writes by path and does not ask.
         * Only this collection matters: a Halloween photo of the same ride lives
         * in a different folder and cannot collide.
         */
        takenNames: getParkImages(parkSlug)
          .filter((image) => image.collection === parkSlug)
          .map((image) => image.id.split('/').pop() ?? '')
          .filter(Boolean),
      },
      /**
       * Hansa-Park and its kind publish no wait times at all, so every ride reads
       * zero and the ordering falls through to the name. Said out loud here,
       * because a ranking with no visible reason on any row looks broken.
       */
      waitTimesAvailable: hasReadableWaitTimes(park),
      statsAvailable: rankBySlug.size > 0,
      backlog: buildBacklog(rides),
    },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  );
}
