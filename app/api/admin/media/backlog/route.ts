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

/**
 * Sidecars read from the branch one by one, at most this many per request.
 *
 * Only a sidecar the session changed rather than added needs a read: an added
 * one comes whole in its patch. The capture screen only adds, so this is the
 * media browser's retagging, where the ride is usually the one already on `main`.
 */
const MAX_SIDECAR_READS = 40;

/**
 * What the open media session already holds for this park.
 *
 * The media index is built from `main`, and a photo taken this morning sits in
 * the session's draft pull request until the evening review. Without this, a
 * reload put every ride photographed today back into "Fehlt noch" and named its
 * next photo as if the first did not exist — the same file name, written over the
 * photo already in the pull request. `lib/media/session-photos.ts` says how the
 * diff is read.
 *
 * Null when GitHub could not be asked. The backlog still answers from `main` then,
 * and says so, rather than failing the screen in a dead spot.
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
      // `getRideImages`, not a folder listing: a Halloween photo of Troy lives in
      // `toverland-halloween` and answers for the ride all the same, and one file
      // naming a second slug in `alsoRides` covers both halves of Winja's.
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
         * File names already used in `public/media/<park>/`, so the phone can name
         * a new photograph without colliding.
         *
         * A ride with no picture gets its slug; a second shot of it needs a
         * suffix, and picking one blind is how a save silently overwrites the
         * photo taken an hour earlier — `commit` writes by path and does not ask.
         * Only this collection matters: a Halloween photo of the same ride lives
         * in a different folder and cannot collide.
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
