/**
 * Unit tests for the sitemap `<lastmod>` detector
 * (`lib/seo/content-changes/fingerprint.ts`).
 *
 * Run: `pnpm test:content-changes`
 *
 * Two properties carry the whole feature and neither is visible from a green
 * build. The fingerprint has to be BLIND to the live half of a park payload —
 * queues, crowd level, statistics, today's schedule — because a fingerprint that
 * sees them stamps all 44,000 URLs with today's date every morning, which is a
 * build stamp, and a `lastmod` that is identical everywhere is the one Google
 * discards. And the diff has to be CONSERVATIVE about the dates it moves: a
 * five-second API timeout must not read as 82 rides being deleted and re-added,
 * and a change to the detector itself must not read as the catalog changing.
 */
import assert from 'node:assert/strict';
import {
  FINGERPRINT_VERSION,
  diffSnapshot,
  fingerprintAttraction,
  fingerprintGeoHub,
  fingerprintPark,
  mergeScheduleCoverage,
} from '../lib/seo/content-changes/fingerprint.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const taron = {
  id: 'ride-1',
  name: 'Taron',
  slug: 'taron',
  land: 'Klugheim',
  latitude: 50.798,
  longitude: 6.879,
  minimumHeight: 140,
  mayGetWet: false,
  isSeasonal: false,
  rideProfile: {
    elements: ['launch', 'airtime-hill', 'launch'],
    types: ['multi-launch-coaster'],
    manufacturer: 'Intamin',
    openedYear: 2016,
  },
};

const park = {
  id: 'park-1',
  name: 'Phantasialand',
  slug: 'phantasialand',
  url: '/v1/parks/europe/germany/bruehl/phantasialand',
  country: 'Germany',
  city: 'Brühl',
  region: 'Nordrhein-Westfalen',
  regionCode: 'NW',
  continent: 'Europe',
  latitude: 50.8,
  longitude: 6.879,
  timezone: 'Europe/Berlin',
  hasOperatingSchedule: true,
  info: { website: 'https://www.phantasialand.de/' },
  liveWaitTimes: { available: true, reason: null },
  attractions: [taron],
};

console.log('fingerprintAttraction');

test('is blind to every live reading on the payload', () => {
  const before = fingerprintAttraction(taron);
  const after = fingerprintAttraction({
    ...taron,
    status: 'OPERATING',
    effectiveStatus: 'OPERATING',
    crowdLevel: 'high',
    trend: 'rising',
    isHeadliner: true,
    isCurrentlyInSeason: true,
    queues: [{ queueType: 'STANDBY', waitTime: 85, isOpen: true }],
    statistics: { avgWaitTime: 42 },
    history: [{ date: '2026-08-26', avgWaitTime: 51 }],
    typicalWaits: { peak: { date: '2026-08-08', value: 115 }, dataTo: '2026-08-26' },
    bestVisitTimes: [{ hour: 9, waitTime: 15 }],
    ropeDrop: { worth: true, minutesSaved: 40 },
    hourlyForecast: [{ hour: 12, waitTime: 70 }],
  });
  assert.equal(after, before);
});

test('treats an absent key and an explicit null as the same value', () => {
  // The API strips null-valued keys, so the same ride arrives both ways
  // depending on which build answered.
  assert.equal(
    fingerprintAttraction({ ...taron, maximumHeight: null, rcdbId: null }),
    fingerprintAttraction(taron)
  );
  assert.equal(
    fingerprintAttraction({
      ...taron,
      rideProfile: { ...taron.rideProfile, model: null, inversions: null, stats: null },
    }),
    fingerprintAttraction(taron)
  );
});

test('moves for the editorial facts a ride page renders', () => {
  const base = fingerprintAttraction(taron);
  assert.notEqual(fingerprintAttraction({ ...taron, name: 'Taron (Klugheim)' }), base);
  assert.notEqual(fingerprintAttraction({ ...taron, minimumHeight: 130 }), base);
  assert.notEqual(fingerprintAttraction({ ...taron, land: 'Mystery' }), base);
  assert.notEqual(fingerprintAttraction({ ...taron, seasonMonths: [11, 12, 1] }), base);
});

test('respects ride-element ORDER and repeats, which are meaningful', () => {
  const reordered = {
    ...taron,
    rideProfile: { ...taron.rideProfile, elements: ['airtime-hill', 'launch', 'launch'] },
  };
  const deduped = {
    ...taron,
    rideProfile: { ...taron.rideProfile, elements: ['launch', 'airtime-hill'] },
  };
  assert.notEqual(fingerprintAttraction(reordered), fingerprintAttraction(taron));
  assert.notEqual(fingerprintAttraction(deduped), fingerprintAttraction(taron));
});

test('moves when the page gains a photo or an article, and not when they only reorder', () => {
  const base = fingerprintAttraction(taron);
  assert.notEqual(
    fingerprintAttraction(taron, { mediaVersions: ['phantasialand/taron@a1b2'], postKeys: [] }),
    base
  );
  assert.notEqual(
    fingerprintAttraction(taron, { mediaVersions: [], postKeys: ['taron-review'] }),
    base
  );
  // A retargeted focal point rewrites the crop's bytes at an unchanged URL, so
  // the version — not the id — is what has to be in the hash.
  assert.notEqual(
    fingerprintAttraction(taron, { mediaVersions: ['phantasialand/taron@c3d4'], postKeys: [] }),
    fingerprintAttraction(taron, { mediaVersions: ['phantasialand/taron@a1b2'], postKeys: [] })
  );
  assert.equal(
    fingerprintAttraction(taron, { mediaVersions: ['b@2', 'a@1'], postKeys: ['y', 'x'] }),
    fingerprintAttraction(taron, { mediaVersions: ['a@1', 'b@2'], postKeys: ['x', 'y'] })
  );
});

console.log('fingerprintPark');

test('is blind to the live half of a park payload', () => {
  const before = fingerprintPark(park);
  const after = fingerprintPark({
    ...park,
    status: 'OPERATING',
    currentLoad: { level: 'high' },
    weather: { current: { temperature: 24 } },
    analytics: { occupancy: { current: 61, updatedAt: '2026-08-27T05:30:48.521Z' } },
    schedule: [{ date: '2026-08-27', type: 'OPERATING' }],
    nextSchedule: { openingTime: '09:00' },
    ropeDropHeadliners: [{ slug: 'taron', minutesSaved: 40 }],
    // A ride's own live readings change with every poll; the roster does not.
    attractions: [{ ...taron, status: 'CLOSED', crowdLevel: 'low', queues: [] }],
  });
  assert.equal(after, before);
});

test('moves when the ride roster changes, not when one ride is corrected', () => {
  const base = fingerprintPark(park);
  assert.notEqual(
    fingerprintPark({ ...park, attractions: [taron, { ...taron, slug: 'f-l-y', name: 'F.L.Y.' }] }),
    base
  );
  assert.notEqual(fingerprintPark({ ...park, attractions: [{ ...taron, land: 'Mystery' }] }), base);
  // A ride detail the park page does not render must not drag the park along —
  // otherwise most of the catalog is "changed" on most days.
  assert.equal(fingerprintPark({ ...park, attractions: [{ ...taron, minimumHeight: 130 }] }), base);
});

test('moves when the curated "no wait times here" flag flips', () => {
  assert.notEqual(
    fingerprintPark({
      ...park,
      liveWaitTimes: { available: false, reason: 'app_only' },
    }),
    fingerprintPark(park)
  );
});

console.log('fingerprintGeoHub');

test('sees the park list and ignores its order', () => {
  const a = { slug: 'phantasialand', name: 'Phantasialand' };
  const b = { slug: 'movie-park-germany', name: 'Movie Park Germany' };
  assert.equal(fingerprintGeoHub([a, b]), fingerprintGeoHub([b, a]));
  assert.notEqual(fingerprintGeoHub([a]), fingerprintGeoHub([a, b]));
});

console.log('diffSnapshot');

const TODAY = '2026-08-27';
const snapshotOf = (entries, version = FINGERPRINT_VERSION) => ({
  version,
  generatedAt: '2026-08-26T05:30:00.000Z',
  entries,
});

test('stamps today on a new key and leaves an unchanged one alone', () => {
  const previous = snapshotOf({ '/parks/a/b/c/d': { hash: 'h1', changedAt: '2026-01-05' } });
  const result = diffSnapshot(
    previous,
    new Map([
      ['/parks/a/b/c/d', 'h1'],
      ['/parks/a/b/c/d/new-ride', 'h9'],
    ]),
    { today: TODAY }
  );
  assert.deepEqual(result.added, ['/parks/a/b/c/d/new-ride']);
  assert.deepEqual(result.changed, []);
  assert.equal(result.snapshot.entries['/parks/a/b/c/d'].changedAt, '2026-01-05');
  assert.equal(result.snapshot.entries['/parks/a/b/c/d/new-ride'].changedAt, TODAY);
});

test('moves the date only for the keys whose fingerprint differs', () => {
  const previous = snapshotOf({
    '/parks/a/b/c/d': { hash: 'h1', changedAt: '2026-01-05' },
    '/parks/a/b/c/e': { hash: 'h2', changedAt: '2026-01-05' },
  });
  const result = diffSnapshot(
    previous,
    new Map([
      ['/parks/a/b/c/d', 'h1-new'],
      ['/parks/a/b/c/e', 'h2'],
    ]),
    { today: TODAY }
  );
  assert.deepEqual(result.changed, ['/parks/a/b/c/d']);
  assert.equal(result.snapshot.entries['/parks/a/b/c/d'].changedAt, TODAY);
  assert.equal(result.snapshot.entries['/parks/a/b/c/e'].changedAt, '2026-01-05');
});

test('a park the API did not answer for keeps its dates instead of being deleted', () => {
  const previous = snapshotOf({
    '/parks/a/b/c/quiet': { hash: 'p', changedAt: '2026-01-05' },
    '/parks/a/b/c/quiet/ride': { hash: 'r', changedAt: '2026-02-09' },
    '/parks/a/b/c/gone': { hash: 'g', changedAt: '2026-01-05' },
  });
  const failed = '/parks/a/b/c/quiet';
  const result = diffSnapshot(previous, new Map(), {
    today: TODAY,
    retainUncovered: (p) => p === failed || p.startsWith(`${failed}/`),
  });
  assert.equal(result.carried, 2);
  assert.deepEqual(result.removed, ['/parks/a/b/c/gone']);
  assert.equal(result.snapshot.entries['/parks/a/b/c/quiet/ride'].changedAt, '2026-02-09');
  assert.equal(result.snapshot.entries['/parks/a/b/c/gone'], undefined);
});

test('a retained park is not re-added — which would read as changed — next run', () => {
  const first = diffSnapshot(
    snapshotOf({ '/parks/a/b/c/d': { hash: 'h1', changedAt: '2026-01-05' } }),
    new Map(),
    { today: TODAY, retainUncovered: () => true }
  );
  const second = diffSnapshot(first.snapshot, new Map([['/parks/a/b/c/d', 'h1']]), {
    today: '2026-08-28',
  });
  assert.deepEqual(second.added, []);
  assert.deepEqual(second.changed, []);
  assert.equal(second.snapshot.entries['/parks/a/b/c/d'].changedAt, '2026-01-05');
});

test('a FINGERPRINT_VERSION bump adopts the new hashes and keeps the old dates', () => {
  const previous = snapshotOf(
    {
      '/parks/a/b/c/d': { hash: 'old-algo', changedAt: '2026-01-05' },
      '/parks/a/b/c/e': { hash: 'old-algo-2', changedAt: '2026-03-01' },
    },
    FINGERPRINT_VERSION - 1
  );
  const result = diffSnapshot(
    previous,
    new Map([
      ['/parks/a/b/c/d', 'new-algo'],
      ['/parks/a/b/c/e', 'new-algo-2'],
    ]),
    { today: TODAY }
  );
  assert.deepEqual(result.changed, []);
  assert.equal(result.snapshot.version, FINGERPRINT_VERSION);
  assert.equal(result.snapshot.entries['/parks/a/b/c/d'].hash, 'new-algo');
  assert.equal(result.snapshot.entries['/parks/a/b/c/d'].changedAt, '2026-01-05');
  assert.equal(result.snapshot.entries['/parks/a/b/c/e'].changedAt, '2026-03-01');
});

test('the very first run stamps everything with today, and says so', () => {
  const result = diffSnapshot(null, new Map([['/parks/a/b/c/d', 'h1']]), { today: TODAY });
  assert.deepEqual(result.added, ['/parks/a/b/c/d']);
  assert.equal(result.snapshot.entries['/parks/a/b/c/d'].changedAt, TODAY);
});

// --- schedule coverage: carried, not compared -----------------------------------------------
//
// The forward edge of every calendar month index, route and sitemap reads this. The failure that
// matters is not a wrong date, it is an ABSENT park: the crawl records only parks whose payload
// arrived, so one API wobble must not shorten 212 calendars the next morning.

test('a park that answered overwrites what it had', () => {
  const merged = mergeScheduleCoverage(
    {
      version: 1,
      generatedAt: '',
      entries: {},
      scheduleCoverage: { '/parks/a/b/c/d': '2026-10-01' },
    },
    new Map([['/parks/a/b/c/d', '2027-01-24']])
  );
  assert.equal(merged['/parks/a/b/c/d'], '2027-01-24');
});

test("a park that did NOT answer keeps yesterday's coverage", () => {
  const merged = mergeScheduleCoverage(
    {
      version: 1,
      generatedAt: '',
      entries: {},
      scheduleCoverage: { '/parks/a/b/c/d': '2027-01-24', '/parks/a/b/c/e': '2026-12-31' },
    },
    new Map([['/parks/a/b/c/d', '2027-02-28']])
  );
  assert.equal(merged['/parks/a/b/c/d'], '2027-02-28');
  assert.equal(merged['/parks/a/b/c/e'], '2026-12-31');
});

test('an explicit null IS an answer and overwrites a remembered date', () => {
  const merged = mergeScheduleCoverage(
    {
      version: 1,
      generatedAt: '',
      entries: {},
      scheduleCoverage: { '/parks/a/b/c/d': '2027-01-24' },
    },
    new Map([['/parks/a/b/c/d', null]])
  );
  assert.equal(merged['/parks/a/b/c/d'], null);
  assert.ok('/parks/a/b/c/d' in merged);
});

test('a snapshot written before the field existed starts from empty, not from undefined', () => {
  const merged = mergeScheduleCoverage(
    { version: 1, generatedAt: '', entries: {} },
    new Map([['/parks/a/b/c/d', '2027-01-24']])
  );
  assert.deepEqual(merged, { '/parks/a/b/c/d': '2027-01-24' });
});

test('no previous snapshot at all is the first run, not a crash', () => {
  const merged = mergeScheduleCoverage(null, new Map([['/parks/a/b/c/d', null]]));
  assert.deepEqual(merged, { '/parks/a/b/c/d': null });
});

console.log(`\n${passed} assertions passed.`);
