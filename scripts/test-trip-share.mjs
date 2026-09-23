/**
 * Unit tests for sharing a plan by link (PAR-82): `lib/planner/trip-share.ts`
 * and the payload parser in `lib/planner/store.ts`.
 *
 * The trip id is the credential, so three things are pinned here:
 *
 * - a fragment that is not an id is refused before anything asks the server;
 * - a payload from another browser goes through the store's own rules, and
 *   anything that is not a plan comes back as `null` or empty, never as a crash;
 * - taking a plan over writes only to THIS browser: the sender's id is not
 *   stored, and the only request that follows is a PUT to the viewer's own trip,
 *   and only while push is on.
 *
 * Run: `pnpm test:trip-share`
 */
import assert from 'node:assert/strict';

const TRIP_ID_KEY = 'parkfan_trip_id';
const PLANNER_KEY = 'parkfan_planner';

const storage = new Map();
let calls = [];

globalThis.window = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

globalThis.fetch = async (url, init) => {
  calls.push({ url, method: init?.method ?? 'GET' });
  return { ok: true, status: 200, json: async () => ({}) };
};

const { tripIdFromHash, sharedTripUrl, adoptSharedPlan } =
  await import('../lib/planner/trip-share.ts');
const { parsePlannerPayload, plannerStore } = await import('../lib/planner/store.ts');

const SENDER_ID = 'SenderTripId0001';
const OWN_ID = 'OwnTripId0000001';

const entry = (id, slug, startMinute) => ({
  id,
  attractionSlug: slug,
  attractionName: slug,
  startMinute,
  hour: Math.floor(startMinute / 60),
});
const plan = (slug, entries, version = 1) => ({
  parks: {
    [slug]: {
      slug,
      name: slug,
      geo: { continent: 'europe', country: 'x', city: 'y' },
      days: { '2026-10-03': { date: '2026-10-03', entries } },
    },
  },
  activeParkSlug: slug,
  activeDate: '2026-10-03',
  version,
});

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  ✗ ${name}\n    ${error.message}`);
  }
}

console.log('\ntripIdFromHash');

await test('reads a 16-character id with or without the #', () => {
  assert.equal(tripIdFromHash(`#${SENDER_ID}`), SENDER_ID);
  assert.equal(tripIdFromHash(SENDER_ID), SENDER_ID);
});

await test('decodes and trims before checking', () => {
  assert.equal(tripIdFromHash(`#${SENDER_ID}%20`), SENDER_ID);
  assert.equal(tripIdFromHash('#aB3dE5fG7hJ9kL-_'), 'aB3dE5fG7hJ9kL-_');
});

await test('refuses anything that is not an id', () => {
  for (const hash of [
    '',
    '#',
    '#short',
    `#${SENDER_ID}x`,
    '#../../etc/passwd',
    "#abc'OR'1'='1abcd",
    '#%E0%A4%A',
    `#${SENDER_ID.slice(0, 15)}!`,
  ]) {
    assert.equal(tripIdFromHash(hash), null, `accepted ${JSON.stringify(hash)}`);
  }
});

await test('puts the id in the fragment, never in the path', () => {
  const url = sharedTripUrl('https://park.fan', 'de', SENDER_ID);
  assert.equal(url, `https://park.fan/de/trip-planner/shared#${SENDER_ID}`);
  assert.equal(new URL(url).pathname.includes(SENDER_ID), false);
});

console.log('\nparsePlannerPayload');

await test('reads the payload of a GET /api/trips/<id> body', () => {
  const body = JSON.stringify({
    id: SENDER_ID,
    payload: plan('phantasialand', [entry('a', 'taron', 600)], 17),
    expiresAt: '2027-10-28T00:00:00Z',
    updatedAt: '2026-09-23T10:00:00Z',
  });
  const parsed = parsePlannerPayload(body);
  assert.ok(parsed);
  assert.equal(parsed.parks.phantasialand.days['2026-10-03'].entries[0].attractionSlug, 'taron');
  assert.equal(parsed.version, 17);
});

await test('a body that is not JSON, or not an object, is null', () => {
  assert.equal(parsePlannerPayload('not json'), null);
  assert.equal(parsePlannerPayload('null'), null);
  assert.equal(parsePlannerPayload('"text"'), null);
});

await test('a body without a usable payload is an empty plan', () => {
  for (const body of ['{}', '{"payload":null}', '{"payload":"x"}', '{"payload":{"parks":7}}']) {
    const parsed = parsePlannerPayload(body);
    assert.ok(parsed, body);
    assert.deepEqual(parsed.parks, {}, body);
  }
});

await test('drops __proto__ keys instead of following them', () => {
  const parsed = parsePlannerPayload(
    '{"payload":{"__proto__":{"polluted":true},"parks":{},"version":1}}'
  );
  assert.ok(parsed);
  assert.equal({}.polluted, undefined);
});

console.log('\nadoptSharedPlan');

function seed({ ownTripId }) {
  storage.clear();
  if (ownTripId) storage.set(TRIP_ID_KEY, ownTripId);
  calls = [];
}

await test('push off: replaces the local plan and sends nothing', async () => {
  seed({ ownTripId: null });
  plannerStore.update(() => plan('efteling', [entry('o', 'baron-1898', 600)], 4));
  const before = plannerStore.getSnapshot().version;
  calls = [];

  await adoptSharedPlan(plan('phantasialand', [entry('s', 'taron', 600)], 17));

  const stored = JSON.parse(storage.get(PLANNER_KEY));
  assert.deepEqual(Object.keys(stored.parks), ['phantasialand']);
  // The local counter moves on from where it was, not from the sender's.
  assert.equal(stored.version, before + 1);
  assert.equal(storage.get(TRIP_ID_KEY), undefined);
  assert.deepEqual(calls, []);
});

await test('push on: one PUT to the viewer’s own trip, none to the sender’s', async () => {
  seed({ ownTripId: OWN_ID });

  await adoptSharedPlan(plan('phantasialand', [entry('s', 'taron', 600)]));

  assert.deepEqual(calls, [{ url: `/api/trips/${OWN_ID}`, method: 'PUT' }]);
  assert.equal(storage.get(TRIP_ID_KEY), OWN_ID);
  assert.equal(
    calls.some((call) => call.url.includes(SENDER_ID)),
    false
  );
});

console.log(`\n${passed} test(s) passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);
