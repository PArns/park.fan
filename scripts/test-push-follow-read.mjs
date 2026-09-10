/**
 * Unit tests for the READ half of `lib/push/push-follows.ts` — the two list
 * fetchers `AlertsOverview`, the favorites band and the ride-alert dialog
 * reconcile against.
 *
 * `PushListResult` exists to keep one distinction alive all the way to the
 * screen: a list that is genuinely empty versus a list that could not be read.
 * The fetchers used to lose it before it was ever theirs to keep — they asked
 * `getExistingPushIdentity()`, which answers `null` both for "never
 * subscribed" and for a `getRegistration()` that THREW (storage access
 * refused, a partitioned context), and reported the second as
 * `{ ok: true, items: [] }`. Downstream that is "Noch nichts eingerichtet" in
 * front of somebody with five armed alerts, and the favorites band's alerts
 * group leaving the screen entirely.
 *
 * So what is pinned here is which of the two shapes each starting point
 * produces, per fetcher:
 *
 * 1. **No subscription is an empty list, and asks nothing.** A browser that
 *    never pressed a bell has no endpoint to query with, and there is nothing
 *    uncertain about that.
 * 2. **A failed lookup is `{ ok: false }`, and asks nothing either.** No
 *    request can go out without an endpoint — the difference is entirely in
 *    what the caller is told about the silence.
 * 3. **The response's own failures stay failures**, and the API's 404 for "no
 *    subscription" stays an empty list, because that is the server saying the
 *    same thing as case 1.
 *
 * Run: `pnpm test:push-follow-read`
 */
import assert from 'node:assert/strict';

/** Set per test: what `fetch` answers. */
let fetchStub = () => {
  throw new Error('no fetch stub installed');
};
let calls = [];

globalThis.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  PushManager: function PushManager() {},
  Notification: { permission: 'granted' },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type) {
    this.type = type;
  }
};

/**
 * A browser that already holds a push subscription — the three things the
 * lookup reads and nothing else. `navigator` is defined rather than assigned
 * because Node 22 ships its own as a getter on `globalThis`.
 */
const SUBSCRIBED = {
  serviceWorker: {
    getRegistration: async () => ({
      pushManager: {
        getSubscription: async () => ({
          endpoint: 'https://push.example/abc',
          toJSON: () => ({ keys: { p256dh: 'p', auth: 'a' } }),
        }),
      },
    }),
  },
};
/** A browser that never granted permission: no registration, so no subscription. */
const UNSUBSCRIBED = { serviceWorker: { getRegistration: async () => undefined } };
/** The lookup itself failing — storage access refused, a partitioned context. */
const LOOKUP_BROKEN = {
  serviceWorker: {
    getRegistration: async () => {
      throw new DOMException('storage access denied');
    },
  },
};

function setNavigator(value) {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}
setNavigator(SUBSCRIBED);

globalThis.fetch = async (url, init) => {
  calls.push({ url, method: init?.method ?? 'GET' });
  return fetchStub();
};

const { fetchRideAlertsRemote, fetchShowFollowsRemote } =
  await import('../lib/push/push-follows.ts');

/** A `Response` with just the parts the fetchers read. */
function response(status, body = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === null) throw new Error('no body');
      return body;
    },
  };
}

const RIDE_ALERT = {
  attractionId: 'r1',
  attractionName: 'Taron',
  attractionSlug: 'taron',
  parkId: 'p1',
  parkName: 'Phantasialand',
  parkSlug: 'phantasialand',
  path: '/de/parks/europe/germany/bruehl/phantasialand/taron',
  thresholdMinutes: 30,
  armed: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  outOfSeason: false,
  retired: false,
};
const SHOW_FOLLOW = {
  showId: 's1',
  showName: 'Aqua Fantasy',
  showSlug: 'aqua-fantasy',
  parkId: 'p1',
  parkName: 'Phantasialand',
  parkSlug: 'phantasialand',
  path: null,
  startTime: null,
  timezone: 'Europe/Berlin',
  createdAt: '2026-09-01T10:00:00.000Z',
};

let passed = 0;
const failures = [];
async function test(name, fn) {
  calls = [];
  setNavigator(SUBSCRIBED);
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  ✗ ${name}\n    ${error.message}`);
  } finally {
    setNavigator(SUBSCRIBED);
  }
}

/**
 * Both fetchers answer the same question about different rows, so they get the
 * same table rather than two hand-written ones that could drift apart — the
 * `{ ok: false }` case is exactly the one that went unnoticed in one of them
 * for as long as both existed.
 */
const FETCHERS = [
  {
    label: 'fetchRideAlertsRemote',
    call: () => fetchRideAlertsRemote(),
    endpoint: '/api/push/ride-alerts',
    row: RIDE_ALERT,
  },
  {
    label: 'fetchShowFollowsRemote',
    call: () => fetchShowFollowsRemote(),
    endpoint: '/api/push/show-follows',
    row: SHOW_FOLLOW,
  },
];

for (const { label, call, endpoint, row } of FETCHERS) {
  console.log(`\n${label}`);

  await test('a subscribed browser gets the server’s rows', async () => {
    fetchStub = () => response(200, [row]);
    const result = await call();
    assert.deepEqual(result, { ok: true, items: [row] });
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      `${endpoint}?endpoint=${encodeURIComponent('https://push.example/abc')}`
    );
  });

  await test('a browser with no subscription reads as an empty list, and asks nothing', async () => {
    setNavigator(UNSUBSCRIBED);
    fetchStub = () => response(200, [row]);
    const result = await call();
    assert.deepEqual(result, { ok: true, items: [] });
    assert.equal(calls.length, 0);
  });

  await test('a failed subscription lookup is a failure, not an empty list', async () => {
    setNavigator(LOOKUP_BROKEN);
    fetchStub = () => response(200, [row]);
    const result = await call();
    // The whole point: NOT `{ ok: true, items: [] }`. That shape is what puts
    // "nothing set up yet" in front of somebody whose alerts are still armed.
    assert.deepEqual(result, { ok: false });
    assert.equal(calls.length, 0);
  });

  await test('the API’s own 404 is the server saying "no subscription": an empty list', async () => {
    fetchStub = () => response(404);
    const result = await call();
    assert.deepEqual(result, { ok: true, items: [] });
  });

  await test('a 500 is a failure, not a short list', async () => {
    fetchStub = () => response(500);
    const result = await call();
    assert.deepEqual(result, { ok: false });
  });

  await test('a thrown fetch is a failure', async () => {
    fetchStub = () => {
      throw new TypeError('Failed to fetch');
    };
    const result = await call();
    assert.deepEqual(result, { ok: false });
  });
}

console.log(`\n${passed} test(s) passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);
