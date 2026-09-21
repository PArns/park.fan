// Regression tests for the persisted nearby-parks cache.
//
// The bug this guards against: the homepage asks /api/nearby twice in a row — once without
// coordinates (the backend geolocates the request IP) and again with real coordinates as soon
// as the visitor grants location. Those are two React Query keys, and the second one is seeded
// from this cache via `initialData` + `initialDataUpdatedAt`, so `staleTime` applies to what it
// finds. The entry written seconds earlier by the IP request carries lat/lng = null, the
// distance guard needs coordinates on BOTH sides and therefore skipped it, and the GPS query
// came up "already fresh" — React Query sent no request for five minutes. A visitor standing
// inside a park kept reading the generic headline instead of "Willkommen im <Park>".
import {
  CACHE_KEY,
  CACHE_MAX_AGE_MS,
  readCacheEntry,
  sameLocationBasis,
  writeCache,
} from '../lib/nearby/nearby-cache.ts';

/** Minimal localStorage + window stand-in; the module only touches getItem/setItem. */
const store = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const PHANTASIALAND = { lat: 50.7989, lng: 6.8792 };
/** Where MaxMind puts celestrial's own egress — ~50 km from Phantasialand, same country. */
const IP_CITY = { lat: 50.9595, lng: 6.1176 };

const IP_ANSWER = { type: 'nearby_parks', data: { parks: [{ name: 'Toverland' }] } };
const GPS_ANSWER = { type: 'in_park', data: { park: { name: 'Phantasialand' } } };

/** Write an entry directly so its age can be controlled. */
function seed(entry) {
  store.set(CACHE_KEY, JSON.stringify(entry));
}

function reset() {
  store.clear();
}

const testCases = [
  {
    name: 'THE BUG: a GeoIP entry does not seed a query that carries coordinates',
    actual: () => {
      reset();
      writeCache(IP_ANSWER, null, null); // the IP request, moments ago
      return readCacheEntry(PHANTASIALAND.lat, PHANTASIALAND.lng);
    },
    expected: undefined,
  },
  {
    name: 'and the reverse: a coordinate entry does not seed the coordinate-less query',
    actual: () => {
      reset();
      writeCache(GPS_ANSWER, PHANTASIALAND.lat, PHANTASIALAND.lng);
      return readCacheEntry(null, null);
    },
    expected: undefined,
  },
  {
    name: 'the GeoIP entry still serves the GeoIP query (the no-request-on-reload saving)',
    actual: () => {
      reset();
      writeCache(IP_ANSWER, null, null);
      return readCacheEntry(null, null)?.data.type;
    },
    expected: 'nearby_parks',
  },
  {
    name: 'a coordinate entry still serves the same coordinates',
    actual: () => {
      reset();
      writeCache(GPS_ANSWER, PHANTASIALAND.lat, PHANTASIALAND.lng);
      return readCacheEntry(PHANTASIALAND.lat, PHANTASIALAND.lng)?.data.type;
    },
    expected: 'in_park',
  },
  {
    name: 'the distance guard is untouched: an entry from 50 km away seeds nothing',
    actual: () => {
      reset();
      writeCache(GPS_ANSWER, IP_CITY.lat, IP_CITY.lng);
      return readCacheEntry(PHANTASIALAND.lat, PHANTASIALAND.lng);
    },
    expected: undefined,
  },
  {
    name: 'an entry from 2 km away still seeds — walking across a park is not a move',
    actual: () => {
      reset();
      writeCache(GPS_ANSWER, PHANTASIALAND.lat + 0.018, PHANTASIALAND.lng);
      return readCacheEntry(PHANTASIALAND.lat, PHANTASIALAND.lng)?.data.type;
    },
    expected: 'in_park',
  },
  {
    name: 'the age guard is untouched: an entry older than five minutes seeds nothing',
    actual: () => {
      reset();
      seed({
        data: IP_ANSWER,
        cachedAt: Date.now() - CACHE_MAX_AGE_MS - 1000,
        lat: null,
        lng: null,
      });
      return readCacheEntry(null, null);
    },
    expected: undefined,
  },
  {
    name: 'an empty store seeds nothing',
    actual: () => {
      reset();
      return readCacheEntry(null, null);
    },
    expected: undefined,
  },
  {
    name: 'unparsable JSON seeds nothing instead of throwing',
    actual: () => {
      reset();
      store.set(CACHE_KEY, '{not json');
      return readCacheEntry(null, null);
    },
    expected: undefined,
  },
  {
    name: 'a half-written entry (one coordinate only) counts as coordinate-less',
    actual: () => {
      reset();
      seed({ data: IP_ANSWER, cachedAt: Date.now(), lat: PHANTASIALAND.lat, lng: null });
      return readCacheEntry(null, null)?.data.type;
    },
    expected: 'nearby_parks',
  },
  {
    name: 'sameLocationBasis: coordinates on both sides',
    actual: () => sameLocationBasis(1, 2, { lat: 3, lng: 4 }),
    expected: true,
  },
  {
    name: 'sameLocationBasis: coordinates on neither side',
    actual: () => sameLocationBasis(null, null, { lat: null, lng: null }),
    expected: true,
  },
  {
    name: 'sameLocationBasis: coordinates on one side only',
    actual: () => sameLocationBasis(1, 2, { lat: null, lng: null }),
    expected: false,
  },
];

console.log('🧪 Testing the persisted nearby-parks cache\n');
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = testCase.actual();
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
