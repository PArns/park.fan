/**
 * Guards the browser's direct API calls (`NEXT_PUBLIC_API_DIRECT`, see
 * docs/rules/a-request-no-cache-can-share-goes-to-the-api-directly.md).
 *
 * 1. `browserApiUrl` sends a request to the relay route while the flag is off and to the API
 *    while it is on, and every API path the browser uses that way has a relay route behind it:
 *    the relay mirrors the API path under `/api/`, and a path without one would 404 with the
 *    flag off.
 * 2. The card photo map the browser loads gives every park and ride exactly the photo and crop the
 *    server-side lookup did before the map existed, so a card looks the same either way.
 * 3. `withNearbyCardImages` and `favoritesForCards`, which both the relays and the direct call run.
 *
 * Run: pnpm test:direct-api
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getParkBackground, getRideImage, MEDIA_IMAGES } from '../lib/media/index.ts';
import { focusToObjectPosition, versionedSrc } from '../lib/media/focus.ts';
import { CARD_FALLBACK_POSITION, withParkCardImage } from '../lib/media/card-images.ts';
import {
  enrichAttractionsWithImages,
  enrichParksWithImages,
  getCardImageMap,
} from '../lib/utils/park-assets.ts';
import { withNearbyCardImages } from '../lib/nearby/fetch-nearby.ts';
import { favoritesForCards } from '../lib/api/favorites.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

// --- 1. Relay or API -------------------------------------------------------------------------

delete process.env.NEXT_PUBLIC_API_DIRECT;
const relayed = await import('../lib/api/client.ts?mode=relay');
process.env.NEXT_PUBLIC_API_DIRECT = '1';
process.env.NEXT_PUBLIC_API_URL = 'https://api.park.fan';
const direct = await import('../lib/api/client.ts?mode=direct');

test('flag off: no direct origin', () => relayed.DIRECT_API_ORIGIN, null);
test('flag on: the API origin', () => direct.DIRECT_API_ORIGIN, 'https://api.park.fan');
test(
  'flag off: a trip goes to its relay',
  () => relayed.browserApiUrl('/v1/trips/abc'),
  '/api/trips/abc'
);
test(
  'flag off: the query stays',
  () => relayed.browserApiUrl('/v1/push/ride-alerts?endpoint=x%2Fy'),
  '/api/push/ride-alerts?endpoint=x%2Fy'
);
test(
  'flag off: a relay under another name',
  () => relayed.browserApiUrl('/v1/discovery/nearby', '/api/nearby'),
  '/api/nearby'
);
test(
  'flag on: a trip goes to the API',
  () => direct.browserApiUrl('/v1/trips/abc'),
  'https://api.park.fan/v1/trips/abc'
);
test(
  'flag on: the relay name is ignored',
  () => direct.browserApiUrl('/v1/discovery/nearby', '/api/nearby'),
  'https://api.park.fan/v1/discovery/nearby'
);

/** Every literal `browserApiUrl('/v1/…'` in the app, cut at the first `${` or `?`. */
function browserApiPaths() {
  const found = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry.name)) {
        const source = readFileSync(path, 'utf8');
        for (const match of source.matchAll(/browserApiUrl\(\s*[`'](\/v1\/[^`'?$]*)(\$\{)?/g)) {
          found.set(`${match[1]}${match[2] ? '*' : ''}`, path);
        }
      }
    }
  };
  for (const dir of ['lib', 'components', 'app']) walk(dir);
  return found;
}

/** The relay route a mirrored API path lands on; `*` stands for one dynamic segment. */
function relayRouteExists(apiPath) {
  const dir = join('app', 'api', apiPath.replace(/^\/v1\//, '').replace(/\/?\*$/, ''));
  if (!apiPath.endsWith('*')) return existsSync(join(dir, 'route.ts'));
  return (
    existsSync(dir) &&
    readdirSync(dir).some(
      (name) => /^\[.+\]$/.test(name) && existsSync(join(dir, name, 'route.ts'))
    )
  );
}

const paths = browserApiPaths();
test('the app calls browserApiUrl at all', () => paths.size > 5, true);
for (const [apiPath, file] of paths) {
  if (apiPath === '/v1/discovery/nearby') continue; // relayed as /api/nearby, named at the call
  test(`${apiPath} (${file}) has a relay route`, () => relayRouteExists(apiPath), true);
}

// --- 2. The map against the lookup it replaced -----------------------------------------------

const before = (image) =>
  image
    ? {
        backgroundImage: versionedSrc(image),
        backgroundPosition: image.focus
          ? focusToObjectPosition(image.focus)
          : CARD_FALLBACK_POSITION,
      }
    : { backgroundImage: null, backgroundPosition: CARD_FALLBACK_POSITION };
const fields = (o) =>
  JSON.stringify({ backgroundImage: o.backgroundImage, backgroundPosition: o.backgroundPosition });

const parkSlugs = new Set(MEDIA_IMAGES.map((i) => i.park).filter(Boolean));
parkSlugs.add('a-park-without-photos');
parkSlugs.add('constructor');
let parkMismatches = 0;
for (const slug of parkSlugs) {
  const [enriched] = enrichParksWithImages([{ slug }]);
  if (fields(enriched) !== fields(before(getParkBackground(slug)))) parkMismatches++;
}
test(`every park (${parkSlugs.size}) keeps its photo and crop`, () => parkMismatches, 0);

const ridePairs = [];
for (const image of MEDIA_IMAGES) {
  if (!image.park) continue;
  for (const ride of [image.ride, ...image.alsoRides].filter(Boolean))
    ridePairs.push([image.park, ride]);
  ridePairs.push([image.park, 'a-ride-without-photos'], [image.park, '__proto__']);
}
let rideMismatches = 0;
for (const [park, ride] of ridePairs) {
  const [enriched] = enrichAttractionsWithImages([{ slug: ride, park: { slug: park } }]);
  if (fields(enriched) !== fields(before(getRideImage(park, ride)))) rideMismatches++;
}
test(`every ride (${ridePairs.length} pairs) keeps its photo and crop`, () => rideMismatches, 0);
test(
  'a ride without a park gets no photo',
  () => enrichAttractionsWithImages([{ slug: 'x', park: null }])[0].backgroundImage,
  null
);

const map = JSON.parse(JSON.stringify(getCardImageMap()));
test(
  'the served map survives JSON',
  () => fields(withParkCardImage(map, { slug: [...parkSlugs][0] })),
  fields(enrichParksWithImages([{ slug: [...parkSlugs][0] }])[0])
);
test('the map stays small', () => JSON.stringify(map).length < 40_000, true);

// --- 3. The two response transforms ----------------------------------------------------------

const photographed = Object.keys(map.parks)[0];
const nearby = withNearbyCardImages(map, {
  type: 'nearby_parks',
  userLocation: { latitude: 0, longitude: 0 },
  data: { parks: [{ slug: photographed }, { slug: 'nowhere' }], count: 2 },
});
test(
  'nearby: a park with a photo gets it',
  () => nearby.data.parks[0].backgroundImage,
  map.parks[photographed][0]
);
test(
  'nearby: a park without one gets the fallback crop',
  () => fields(nearby.data.parks[1]),
  fields({ backgroundImage: null, backgroundPosition: CARD_FALLBACK_POSITION })
);
const inPark = withNearbyCardImages(map, {
  type: 'in_park',
  userLocation: { latitude: 0, longitude: 0 },
  data: { park: { slug: photographed }, rides: [] },
});
test(
  'nearby: the in-park park gets its photo',
  () => inPark.data.park.backgroundImage,
  map.parks[photographed][0]
);

const favorites = favoritesForCards(map, {
  parks: [
    {
      slug: photographed,
      liveWaitTimes: { available: true },
      analytics: { avgWaitTime: 20 },
      operatingAttractions: 4,
    },
    {
      slug: 'nowhere',
      liveWaitTimes: { available: false, reason: 'no_source' },
      analytics: { avgWaitTime: 0 },
      operatingAttractions: 0,
    },
  ],
  attractions: [{ slug: 'x', park: { slug: photographed } }],
  shows: [],
  restaurants: [],
});
test(
  'favorites: a readable park keeps its averages',
  () => favorites.parks[0].analytics?.avgWaitTime,
  20
);
test(
  'favorites: an unreadable park loses them',
  () => 'analytics' in favorites.parks[1] || 'operatingAttractions' in favorites.parks[1],
  false
);
test(
  'favorites: a park gets its photo',
  () => favorites.parks[0].backgroundImage,
  map.parks[photographed][0]
);
test(
  'favorites: a ride gets the fallback crop',
  () => favorites.attractions[0].backgroundPosition,
  CARD_FALLBACK_POSITION
);

// --- Report ----------------------------------------------------------------------------------

let passed = 0;
let failed = 0;
for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `THREW: ${error.message}`;
  }
  if (result === testCase.expected) {
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
