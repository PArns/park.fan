/**
 * Unit tests for the DELETE half of `lib/push/push-follows.ts` — dropping a
 * ride alert or a show reminder.
 *
 * Both used to return `Promise<void>` and never read `response.ok`: a 500 took
 * the row off the screen and left the notification armed, and it came back at
 * the next open with nothing having said so. The write path had classified
 * errors the whole time; only the removal had none.
 *
 * What is pinned here is the pair of rules that fixes it, because neither is
 * visible in a green build:
 *
 * 1. **The mirror moves last.** `localStorage` is written only where the server
 *    confirmed the deletion. The order matters beyond correctness — the
 *    favorites band's whole alerts group is gated on that mirror, so a
 *    mirror-first write unmounted the group in the same commit as the click,
 *    taking its own spinner and any error with it. The ordering assertions read
 *    the mirror from inside the `fetch` stub, which is the only moment the two
 *    orders look different.
 * 2. **404 is a success, every other non-2xx is a failure.** A row the server
 *    does not have is a row the visitor is rid of; reporting a failure over it
 *    would leave it on screen for ever, since every retry answers 404 too.
 *
 * Run: `pnpm test:push-follow-delete`
 */
import assert from 'node:assert/strict';

const RIDE_ALERTS_KEY = 'parkfan_ride_alerts';
const SHOW_FOLLOWS_KEY = 'parkfan_show_follows';

const storage = new Map();
/** Set per test: what `fetch` does, and what the mirror looked like when it was called. */
let fetchStub = () => {
  throw new Error('no fetch stub installed');
};
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
  PushManager: function PushManager() {},
  Notification: { permission: 'granted' },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type) {
    this.type = type;
  }
};

/**
 * A browser that already holds a push subscription. `getExistingPushIdentity`
 * reads exactly these three things, so this is the whole of what it needs —
 * `navigator` is defined rather than assigned because Node 22 ships its own as
 * a getter on `globalThis`.
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

function setNavigator(value) {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}
setNavigator(SUBSCRIBED);

globalThis.fetch = async (url, init) => {
  calls.push({
    url,
    method: init?.method,
    body: init?.body ? JSON.parse(init.body) : null,
    // The mirror AS IT STOOD when the request went out. This is the assertion
    // the ordering rule lives or dies on.
    rideAlertsAtCall: storage.get(RIDE_ALERTS_KEY) ?? null,
    showFollowsAtCall: storage.get(SHOW_FOLLOWS_KEY) ?? null,
  });
  return fetchStub();
};

const { removeRideAlert, unfollowShow } = await import('../lib/push/push-follows.ts');

/** A `Response` with just the parts `classifyFailure` reads. */
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

function seed({ rideAlerts, showFollows } = {}) {
  storage.clear();
  storage.set(
    RIDE_ALERTS_KEY,
    JSON.stringify(rideAlerts ?? [{ attractionId: 'r1', thresholdMinutes: 30 }])
  );
  storage.set(SHOW_FOLLOWS_KEY, JSON.stringify(showFollows ?? [{ showId: 's1', startTime: null }]));
  calls = [];
}

function rideAlerts() {
  return JSON.parse(storage.get(RIDE_ALERTS_KEY) ?? '[]');
}

function showFollows() {
  return JSON.parse(storage.get(SHOW_FOLLOWS_KEY) ?? '[]');
}

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

console.log('\nremoveRideAlert');

await test('a 204 clears the mirror and reports success', async () => {
  seed();
  fetchStub = () => response(204);
  const result = await removeRideAlert('r1');
  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(rideAlerts(), []);
});

await test('the DELETE goes out BEFORE the mirror moves', async () => {
  seed();
  fetchStub = () => response(204);
  await removeRideAlert('r1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(calls[0].url, '/api/push/ride-alerts');
  assert.deepEqual(calls[0].body, { endpoint: 'https://push.example/abc', attractionId: 'r1' });
  // Still there while the request was in flight — this is what keeps the
  // favorites band's alerts group mounted long enough to show its own spinner.
  assert.deepEqual(JSON.parse(calls[0].rideAlertsAtCall), [
    { attractionId: 'r1', thresholdMinutes: 30 },
  ]);
});

await test('a 500 leaves the alert in the mirror and reports network', async () => {
  seed();
  fetchStub = () => response(500);
  const result = await removeRideAlert('r1');
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.deepEqual(rideAlerts(), [{ attractionId: 'r1', thresholdMinutes: 30 }]);
});

await test('a 404 counts as gone: mirror cleared, success reported', async () => {
  seed();
  fetchStub = () => response(404);
  const result = await removeRideAlert('r1');
  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(rideAlerts(), []);
});

await test('a 429 carries the limiter’s own retryAfterSeconds, mirror untouched', async () => {
  seed();
  fetchStub = () => response(429, { retryAfterSeconds: 42 });
  const result = await removeRideAlert('r1');
  assert.deepEqual(result, { ok: false, error: { reason: 'rate-limited', retryAfterSeconds: 42 } });
  assert.deepEqual(rideAlerts(), [{ attractionId: 'r1', thresholdMinutes: 30 }]);
});

await test('a 429 with an unreadable body still reads as rate-limited', async () => {
  seed();
  fetchStub = () => response(429);
  const result = await removeRideAlert('r1');
  assert.deepEqual(result, { ok: false, error: { reason: 'rate-limited', retryAfterSeconds: 60 } });
});

/*
 * The window is both printed ("bitte in {seconds} Sekunden") and timed by, so it is normalized
 * once where it enters the app. A value the caller had to bound on its own would be a countdown
 * that disagrees with the moment it disappears.
 */
await test('a window past an hour is capped rather than printed as given', async () => {
  seed();
  fetchStub = () => response(429, { retryAfterSeconds: 7200 });
  const result = await removeRideAlert('r1');
  assert.equal(result.error.retryAfterSeconds, 3600);
});

await test('a window under a second takes the same road as an unreadable body', async () => {
  seed();
  fetchStub = () => response(429, { retryAfterSeconds: 0 });
  const result = await removeRideAlert('r1');
  assert.equal(result.error.retryAfterSeconds, 60);
});

await test('a fractional window is rounded, not printed with decimals', async () => {
  seed();
  fetchStub = () => response(429, { retryAfterSeconds: 12.4 });
  const result = await removeRideAlert('r1');
  assert.equal(result.error.retryAfterSeconds, 12);
});

await test('a 400 reads as invalid, mirror untouched', async () => {
  seed();
  fetchStub = () => response(400);
  const result = await removeRideAlert('r1');
  assert.deepEqual(result, { ok: false, error: { reason: 'invalid' } });
  assert.deepEqual(rideAlerts(), [{ attractionId: 'r1', thresholdMinutes: 30 }]);
});

await test('a thrown fetch reads as network, mirror untouched', async () => {
  seed();
  fetchStub = () => {
    throw new TypeError('Failed to fetch');
  };
  const result = await removeRideAlert('r1');
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.deepEqual(rideAlerts(), [{ attractionId: 'r1', thresholdMinutes: 30 }]);
});

await test('a browser with no subscription clears the stale entry without asking', async () => {
  setNavigator(UNSUBSCRIBED);
  seed();
  fetchStub = () => response(204);
  const result = await removeRideAlert('r1');
  setNavigator(SUBSCRIBED);
  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(rideAlerts(), []);
  assert.equal(calls.length, 0);
});

await test('another browser’s alerts are left alone', async () => {
  seed({
    rideAlerts: [
      { attractionId: 'r1', thresholdMinutes: 30 },
      { attractionId: 'r2', thresholdMinutes: 15 },
    ],
  });
  fetchStub = () => response(204);
  await removeRideAlert('r1');
  assert.deepEqual(rideAlerts(), [{ attractionId: 'r2', thresholdMinutes: 15 }]);
});

console.log('\nunfollowShow');

await test('a 204 clears the mirror and reports success', async () => {
  seed();
  fetchStub = () => response(204);
  const result = await unfollowShow('s1');
  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(showFollows(), []);
});

await test('the DELETE goes out BEFORE the mirror moves', async () => {
  seed();
  fetchStub = () => response(204);
  await unfollowShow('s1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/push/show-follows');
  assert.deepEqual(calls[0].body, { endpoint: 'https://push.example/abc', showId: 's1' });
  assert.deepEqual(JSON.parse(calls[0].showFollowsAtCall), [{ showId: 's1', startTime: null }]);
});

await test('a 500 leaves the follow in the mirror and reports network', async () => {
  seed();
  fetchStub = () => response(500);
  const result = await unfollowShow('s1');
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.deepEqual(showFollows(), [{ showId: 's1', startTime: null }]);
});

await test('a 404 counts as gone: mirror cleared, success reported', async () => {
  seed();
  fetchStub = () => response(404);
  const result = await unfollowShow('s1');
  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(showFollows(), []);
});

await test('a pinned performance is dropped whichever one it named', async () => {
  seed({ showFollows: [{ showId: 's1', startTime: '2026-09-10T19:10:00.000Z' }] });
  fetchStub = () => response(204);
  const result = await unfollowShow('s1');
  assert.equal(result.ok, true);
  assert.deepEqual(showFollows(), []);
});

await test('a browser with no subscription clears the stale entry without asking', async () => {
  setNavigator(UNSUBSCRIBED);
  seed();
  fetchStub = () => response(204);
  const result = await unfollowShow('s1');
  setNavigator(SUBSCRIBED);
  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(showFollows(), []);
  assert.equal(calls.length, 0);
});

console.log(`\n${passed} test(s) passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);
