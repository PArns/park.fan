import 'server-only';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

import { adminGithubToken, adminRepo } from '@/lib/admin/github';
import { readSessionJson, resolveSession, sessionFiles } from '@/lib/admin/media-session';
import { denyUnlessAdmin } from '@/lib/admin/session';
import { getParkByGeoPathFresh } from '@/lib/api/parks';
import { getParkHistoricalStats } from '@/lib/api/stats';
import { getParkImages, getRideImages } from '@/lib/media';
import { buildBacklog, type BacklogRide } from '@/lib/media/photo-backlog';
import {
  ridesInSidecars,
  sessionNames,
  sessionSidecars,
  sidecarFromPatch,
} from '@/lib/media/session-photos';
import { getStandbyWait } from '@/lib/utils/park-utils';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';

/**
 * One park's photo backlog: which rides have no picture, hardest-hitting first, ranked on the
 * server so a phone in the park does not pull the whole park payload. Not built on `/api/nearby`,
 * which drops out-of-season rides, the ones nobody has photographed. Without `/stats` the ranking
 * only loses its top layer (`lib/media/photo-backlog.ts`).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** The park payload is cheap; `/stats` retries a cold aggregate for a few seconds. */
export const maxDuration = 60;

/**
 * One of the values `/api/parks/.../stats` forwards from its closed set, so this asks for an
 * object the backend may already hold instead of minting another cache key per park.
 */
const STATS_TOP_N = 30;

/**
 * Sidecars read from the branch one by one, at most this many per request. Only a changed sidecar
 * needs a read; an added one comes whole in its patch.
 */
const MAX_SIDECAR_READS = 40;

/**
 * What the open media session already holds for this park. The index is built from `main`, so
 * without this a reload lists today's photos as missing and names the next one over the photo
 * already in the pull request. Null when GitHub could not be asked; the backlog then answers from
 * `main` and says so.
 */
async function sessionPhotos(
  parkSlug: string
): Promise<{ names: string[]; rides: Set<string> } | null> {
  const token = adminGithubToken();
  if (!token) return null;
  const repoRef = adminRepo();
  const octokit = new Octokit({ auth: token });
  const session = await resolveSession(octokit, repoRef);
  if (!session) return { names: [], rides: new Set() };

  const files = await sessionFiles(octokit, repoRef, session);
  const sidecars: unknown[] = [];
  let reads = 0;
  for (const file of sessionSidecars(files)) {
    const whole = sidecarFromPatch(file.patch);
    if (whole) sidecars.push(whole);
    else if (reads++ < MAX_SIDECAR_READS) {
      sidecars.push(await readSessionJson(octokit, repoRef, session, file.filename));
    }
  }
  return { names: sessionNames(files, parkSlug), rides: ridesInSidecars(sidecars, parkSlug) };
}

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

  // Started first and awaited last: it is GitHub, not the park API, and the two
  // do not wait on each other.
  const pending = sessionPhotos(parkSlug).catch(() => null);

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

  const session = await pending;

  const rides: BacklogRide[] = (park.attractions ?? []).map((attraction) => {
    const ranked = rankBySlug.get(attraction.slug);
    const inSession = session?.rides.has(attraction.slug) ?? false;
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
      // `getRideImages`, not a folder listing: a photo in another collection, or one naming the
      // ride in `alsoRides`, answers for it too.
      hasPhoto: inSession || getRideImages(parkSlug, attraction.slug).length > 0,
      inSession,
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
         * File names already used in `public/media/<park>/`, so the phone can name a new photo
         * without colliding: `commit` writes by path and would silently overwrite.
         */
        takenNames: [
          ...new Set([
            ...getParkImages(parkSlug)
              .filter((image) => image.collection === parkSlug)
              .map((image) => image.id.split('/').pop() ?? '')
              .filter(Boolean),
            // The open session's too, or a reload names the next photo of a
            // ride after the one already waiting in the pull request.
            ...(session?.names ?? []),
          ]),
        ],
      },
      /**
       * False when the open session could not be read. The lists then know only
       * what is on `main`, and a ride photographed today may still be listed.
       */
      sessionChecked: session !== null,
      /**
       * Parks without a wait-time source read zero on every ride, so the ordering falls through
       * to the name; said out loud because a ranking with no visible reason looks broken.
       */
      waitTimesAvailable: hasReadableWaitTimes(park),
      statsAvailable: rankBySlug.size > 0,
      backlog: buildBacklog(rides),
    },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  );
}
