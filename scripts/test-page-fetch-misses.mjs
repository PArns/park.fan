// Regression tests for the fetches a page turns into `notFound()`.
//
// The park, ride, calendar, stats and geo pages used to wrap their main fetch in
// `catchNonFatal`, which returns `null` for every error that is not a maintenance 502. The
// page read that `null` as "this URL does not exist" and answered 404, so a 500, a 429 after
// the last retry or a network timeout went out as a 404. Cloudflare keeps a 404 for an hour
// and the ISR routes (stats, geo hubs) store it for their whole `revalidate`, so a crawler
// arriving in that window was told the page was gone.
//
// Only the API's own 404 may become `null` on those paths: `getParkByGeoPath` answers it that
// way itself, and `nullOnNotFound` does it for the fetchers that throw on a 404. Everything
// else has to throw, which reaches the error boundary as an uncached 500.
//
// Same rule as `pnpm test:stats-fetchers`, one layer up.
import { catchNonFatal, nullOnNotFound } from '../lib/api/client.ts';
import { getCitiesWithParks } from '../lib/api/discovery.ts';
import { getParkByGeoPath } from '../lib/api/parks.ts';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Swap global fetch for the duration of one case. */
async function withFetch(impl, run) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

/** Runs `fn`, returning 'threw' instead of propagating — the outcome IS the assertion. */
const outcome = async (fn) => {
  try {
    const value = await fn();
    return value === null ? 'null' : 'data';
  } catch {
    return 'threw';
  }
};

const notFound = async () => json({ message: 'Not found' }, 404);
const serverError = async () => json({ error: 'boom' }, 500);
const networkError = async () => {
  throw new TypeError('fetch failed');
};
const maintenance = async () => new Response('Bad Gateway', { status: 502 });

const minimalPark = {
  id: 'p1',
  name: 'Test Park',
  slug: 'test-park',
  attractions: [],
  shows: [],
  restaurants: [],
};

// `getParkByGeoPath` is wrapped in React `cache()`, so every case asks for its own park slug.
let parkCounter = 0;
const nextPark = () => ['europe', 'germany', 'bruehl', `test-park-${++parkCounter}`];

const testCases = [
  {
    name: 'nullOnNotFound: the API 404 is the settled miss',
    run: () =>
      withFetch(notFound, () =>
        outcome(() => nullOnNotFound(getCitiesWithParks('europe', 'atlantis')))
      ),
    expected: 'null',
  },
  {
    name: 'nullOnNotFound: a 500 throws',
    run: () =>
      withFetch(serverError, () =>
        outcome(() => nullOnNotFound(getCitiesWithParks('europe', 'germany')))
      ),
    expected: 'threw',
  },
  {
    name: 'nullOnNotFound: a network error throws',
    run: () =>
      withFetch(networkError, () =>
        outcome(() => nullOnNotFound(getCitiesWithParks('europe', 'germany')))
      ),
    expected: 'threw',
  },
  {
    name: 'nullOnNotFound: a maintenance 502 throws',
    run: () =>
      withFetch(maintenance, () =>
        outcome(() => nullOnNotFound(getCitiesWithParks('europe', 'germany')))
      ),
    expected: 'threw',
  },
  {
    name: 'nullOnNotFound: a 200 is data',
    run: () =>
      withFetch(
        async () => json({ data: [], breadcrumbs: [] }),
        () => outcome(() => nullOnNotFound(getCitiesWithParks('europe', 'germany')))
      ),
    expected: 'data',
  },
  {
    // The behaviour that made the pages 404 on an outage. It stays right for optional
    // content (a country summary, homepage stats), so it is pinned here, not removed.
    name: 'catchNonFatal: a 500 becomes null — optional content only',
    run: () =>
      withFetch(serverError, () =>
        outcome(() => catchNonFatal(getCitiesWithParks('europe', 'germany')))
      ),
    expected: 'null',
  },
  {
    name: 'getParkByGeoPath: the API 404 is null',
    run: () => withFetch(notFound, () => outcome(() => getParkByGeoPath(...nextPark()))),
    expected: 'null',
  },
  {
    name: 'getParkByGeoPath: a 500 throws',
    run: () => withFetch(serverError, () => outcome(() => getParkByGeoPath(...nextPark()))),
    expected: 'threw',
  },
  {
    name: 'getParkByGeoPath: a network error throws',
    run: () => withFetch(networkError, () => outcome(() => getParkByGeoPath(...nextPark()))),
    expected: 'threw',
  },
  {
    name: 'getParkByGeoPath: a 200 is data',
    run: () =>
      withFetch(
        async () => json(minimalPark),
        () => outcome(() => getParkByGeoPath(...nextPark()))
      ),
    expected: 'data',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = await testCase.run();
  if (result === testCase.expected) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
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
