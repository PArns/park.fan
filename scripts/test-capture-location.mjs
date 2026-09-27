/**
 * Unit tests for `app/admin/capture/_lib/use-park-location.ts` — which park the
 * photo capture screen is standing in, and how fast its position follows a walk.
 *
 * The park half: `/api/nearby` answers `in_park` with a park object that carries
 * **no** `url`. Checked against the running endpoint on 2026-09-27 at every one of
 * the 210 parks in `/v1/parks`: 210 `in_park` answers, `park.url` present in 0.
 * The hook used to require it, so it answered "Kein Park in Reichweite" everywhere
 * and the park had to be picked by hand. The geography is read off a ride's URL
 * instead (183 of 210), and where the ride list is empty, out of a second
 * `nearby_parks` answer by slug (the other 27). The fixtures below are that
 * answer's real shape, trimmed.
 *
 * The position half is a grep over the hook, because what matters there is what
 * the watch is subscribed with and whether a fix reaches the screen at all, and
 * neither is visible to a unit test of a pure function.
 *
 * Run: `pnpm test:capture-location`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  pathFromNearbyParks,
  readInParkAnswer,
} from '../app/admin/capture/_lib/use-park-location.ts';

let checked = 0;
const check = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  checked += 1;
};

const PATH = 'europe/germany/bruehl/phantasialand';

/** `/v1/discovery/nearby?lat=50.7998&lng=6.8793&radius=3000`, trimmed to what matters. */
const inPark = (park = {}, rides) => ({
  type: 'in_park',
  userLocation: { latitude: 50.7998, longitude: 6.8793 },
  data: {
    park: {
      id: '313ca334-c04f-4855-bfd9-c8beb7a00d98',
      name: 'Phantasialand',
      slug: 'phantasialand',
      distance: 79,
      status: 'OPERATING',
      hasOperatingSchedule: true,
      timezone: 'Europe/Berlin',
      ...park,
    },
    rides: rides ?? [
      { slug: 'fly', distance: 23, url: `/v1/parks/${PATH}/attractions/fly` },
      {
        slug: 'wolkes-luftpost',
        distance: 58,
        url: `/v1/parks/${PATH}/attractions/wolkes-luftpost`,
      },
    ],
  },
});

// --- the in-park answer ----------------------------------------------------

check(
  readInParkAnswer(inPark()),
  { slug: 'phantasialand', name: 'Phantasialand', path: PATH },
  'the answer as the endpoint sends it — no park.url — must resolve the park from a ride'
);

check(
  readInParkAnswer(inPark({ url: '/v1/parks/europe/germany/bruehl/phantasialand' }, [])).path,
  PATH,
  'a park.url, should the endpoint ever send one, is read first'
);

check(
  readInParkAnswer(
    inPark({}, [
      { slug: 'no-url', distance: 5 },
      { slug: 'fly', distance: 23, url: `/v1/parks/${PATH}/attractions/fly` },
    ])
  ).path,
  PATH,
  'a ride without a URL must not end the search'
);

check(
  readInParkAnswer(inPark({}, [])),
  { slug: 'phantasialand', name: 'Phantasialand', path: null },
  'no ride and no park.url: the park is still named, and the path is left for the second request'
);

check(
  readInParkAnswer(inPark({ name: undefined })).name,
  'phantasialand',
  'a park without a name falls back to its slug rather than to nothing'
);

for (const [answer, why] of [
  [{ type: 'nearby_parks', data: { parks: [], count: 0 } }, 'a nearby_parks answer'],
  [{ error: 'Failed to fetch nearby parks' }, 'an error body'],
  [null, 'null'],
  [inPark({ slug: '' }), 'a park without a slug'],
]) {
  check(readInParkAnswer(answer), null, `${why} names no park`);
}

// --- the second request ----------------------------------------------------

/** `radius=0` at the same point: a nearby_parks list whose entries carry their URL. */
const nearbyParks = {
  type: 'nearby_parks',
  data: {
    parks: [
      {
        slug: 'phantasialand',
        name: 'Phantasialand',
        url: '/v1/parks/europe/germany/bruehl/phantasialand',
      },
      {
        slug: 'attractiepark-toverland',
        name: 'Attractiepark Toverland',
        url: '/v1/parks/europe/netherlands/sevenum/attractiepark-toverland',
      },
    ],
    count: 2,
  },
};

check(
  pathFromNearbyParks(nearbyParks, 'phantasialand'),
  PATH,
  'the park is found by the slug the in_park answer named'
);
check(
  pathFromNearbyParks(nearbyParks, 'attractiepark-toverland'),
  'europe/netherlands/sevenum/attractiepark-toverland',
  'and not by its position in the list'
);
check(
  pathFromNearbyParks(nearbyParks, 'efteling'),
  null,
  'a slug that is not in the list is not guessed from the nearest entry'
);
check(
  pathFromNearbyParks(inPark(), 'phantasialand'),
  null,
  'an in_park answer is not a nearby_parks list'
);

// --- the hooks, as wired ---------------------------------------------------

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const hook = read('../app/admin/capture/_lib/use-park-location.ts');
const page = read('../app/admin/capture/page.tsx');

const grep = (source, pattern, message) => {
  assert.match(source, pattern, message);
  checked += 1;
};
const absent = (source, pattern, message) => {
  assert.doesNotMatch(source, pattern, message);
  checked += 1;
};

grep(
  hook,
  /geolocation\.watchPosition\(\s*\(fix\) => \{\s*setPosition\(\{/,
  'every fix from the watch must reach the screen while the tab is in front'
);
absent(
  hook,
  /hasMovedEnough|MIN_MOVE_M/,
  'no movement gate: the 10 m drop made the nearest-ride card trail the walk'
);
grep(
  hook,
  /maximumAge: 15_000/,
  'a cached fix may answer the first callback only if it is at most 15 s old'
);
grep(
  hook,
  /addEventListener\('visibilitychange'/,
  'the watch must still be released while the tab is in the background'
);
grep(
  hook,
  /if \(!enabled \|\| !active\) return;/,
  'the subscribing effect must bail out while the tab is in the background'
);

// The request outlives the fix that started it. With a fix every second, a
// cleanup that aborts it would cancel every answer before it arrives — so the
// abort must exist (on unmount) and must not be the effect's own cleanup.
grep(
  hook,
  /useEffect\(\s*\(\) => \(\) => \{\s*inFlight\.current\?\.abort\(\);[\s\S]{0,80}\},\s*\[\]\s*\);/,
  'the nearby request is aborted on unmount'
);
absent(
  hook,
  /return \(\) => controller\.abort\(\)/,
  'the nearby request must not be aborted by the next fix'
);
grep(
  hook,
  /RETRY_WITHOUT_PARK_MS/,
  'a "no park" answer must be asked again on a later fix, not be final'
);
grep(
  page,
  /onRetry=\{\(\) => \{[\s\S]{0,200}retry\(\);\s*redetect\(\);/,
  '"Neu orten" must ask for the park again, not only restart the watch'
);

console.log(`capture location: ${checked} checks passed`);
