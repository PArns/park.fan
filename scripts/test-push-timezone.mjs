/**
 * Unit tests for `lib/push/push-timezone.ts` — the refresh that keeps
 * `push_subscriptions.timezone` pointed at where the phone is.
 *
 * The column is written by three calls, all of them behind a switch somebody
 * pressed, and nothing read it until PAR-215 started suppressing every send
 * between 23:00 and 07:00 by that zone. A subscription armed in Berlin and
 * carried to Orlando then has its quiet window sitting on 17:00–01:00 local:
 * the visitor is at the park, the alerts are armed, and nothing arrives from
 * the moment the evening starts.
 *
 * What is pinned here is the shape of the fix rather than the fix's wiring —
 * four claims, each of which is a way it could go wrong instead:
 *
 * 1. **It writes only on divergence.** A matching record is `unchanged` and
 *    sends nothing, so the check does not cost a subscribe per page load.
 * 2. **It costs nothing where nothing is armed.** No mirror entry and no
 *    armed planner record means it leaves before the service-worker lookup,
 *    not just before the request.
 * 3. **A failure leaves everything standing.** No record is written (so the
 *    next load retries) and — the one that matters on a phone with a bad
 *    roaming connection — the subscription is never unsubscribed.
 * 4. **The POST names only what it means.** No `tripId` and no `topics`, so
 *    the trip-planner half of the row survives; `locale` IS sent, because
 *    `PushService.subscribe` assigns that field unconditionally while it
 *    guards the other three.
 *
 * Run: `pnpm test:push-timezone`
 */
import assert from 'node:assert/strict';

const SENT_KEY = 'parkfan_push_timezone';
const RIDE_ALERTS_KEY = 'parkfan_ride_alerts';
const ARMED_KEY = 'parkfan_push_armed';

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/dK3sQ1zR9mP:APA91bF-7hLxQ2vN8cT4';
const OTHER_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/xY7wB2nH4kL:APA91bG-3jRmT8dV1sZ6';

const storage = new Map();

globalThis.window = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  // `supportsPush()` reads these two off `window` before it looks anything up;
  // a browser without them cannot be holding a subscription at all.
  PushManager: function PushManager() {},
  Notification: { permission: 'granted' },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type) {
    this.type = type;
  }
};
globalThis.document = { documentElement: { lang: 'de' } };

/** How many times the browser subscription was torn down. Must stay 0 throughout. */
let unsubscribed = 0;

/** A browser holding one push subscription, the three fields the lookup reads. */
function subscribedNavigator(endpoint = ENDPOINT) {
  return {
    serviceWorker: {
      getRegistration: async () => ({
        pushManager: {
          getSubscription: async () => ({
            endpoint,
            toJSON: () => ({ keys: { p256dh: 'p256', auth: 'auth' } }),
            unsubscribe: async () => {
              unsubscribed++;
              return true;
            },
          }),
        },
      }),
    },
  };
}
/** No registration at all — a browser that never granted permission. */
const UNSUBSCRIBED_NAV = { serviceWorker: { getRegistration: async () => undefined } };
/** The lookup itself failing: storage access refused, a partitioned context. */
const LOOKUP_BROKEN_NAV = {
  serviceWorker: {
    getRegistration: async () => {
      throw new Error('storage access denied');
    },
  },
};

function setNavigator(value) {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}

/** Set per test: what the API answers. */
let fetchStub = () => ({ ok: true, status: 204 });
let calls = [];
globalThis.fetch = async (url, init) => {
  calls.push({ url, method: init?.method ?? 'GET', body: JSON.parse(init?.body ?? '{}') });
  return fetchStub();
};

/**
 * The browser's own zone. `Intl.DateTimeFormat` is replaced rather than the
 * process TZ being set, because the module reads `resolvedOptions().timeZone`
 * and the test has to move it between two calls within one run.
 */
let browserZone = 'Europe/Berlin';
const RealDateTimeFormat = Intl.DateTimeFormat;
Intl.DateTimeFormat = function DateTimeFormat(...args) {
  if (args.length > 0) return new RealDateTimeFormat(...args);
  return { resolvedOptions: () => ({ timeZone: browserZone }) };
};

const { refreshPushTimezone, readSentPushTimezone, rememberSentPushTimezone } =
  await import('../lib/push/push-timezone.ts');

/** A browser with one ride alert in the mirror: something a wrong zone could silence. */
function armRideAlert() {
  storage.set(RIDE_ALERTS_KEY, JSON.stringify([{ attractionId: 'r1', thresholdMinutes: 30 }]));
}
/** The planner's own record — the other half of the "is anything armed" gate. */
function armPlanner(endpoint = ENDPOINT) {
  storage.set(ARMED_KEY, JSON.stringify({ endpoint, tripId: 'n7Qk2Fd3Xb9p' }));
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  calls = [];
  unsubscribed = 0;
  storage.clear();
  browserZone = 'Europe/Berlin';
  fetchStub = () => ({ ok: true, status: 204 });
  setNavigator(subscribedNavigator());
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  ✗ ${name}\n    ${error.message}`);
  }
}

console.log('\nrefreshPushTimezone — when it writes');

await test('a zone that matches the record sends nothing', async () => {
  armRideAlert();
  rememberSentPushTimezone(ENDPOINT, 'Europe/Berlin');
  assert.equal(await refreshPushTimezone(), 'unchanged');
  assert.equal(calls.length, 0);
});

await test('Berlin to Orlando: the new zone goes up, and is recorded', async () => {
  armRideAlert();
  rememberSentPushTimezone(ENDPOINT, 'Europe/Berlin');
  browserZone = 'America/New_York';
  assert.equal(await refreshPushTimezone(), 'sent');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].url, '/api/push/subscriptions');
  assert.equal(calls[0].body.timezone, 'America/New_York');
  assert.deepEqual(readSentPushTimezone(), {
    endpoint: ENDPOINT,
    timezone: 'America/New_York',
  });
});

await test('and the trip back is a second write, not a stuck record', async () => {
  armRideAlert();
  rememberSentPushTimezone(ENDPOINT, 'Europe/Berlin');
  browserZone = 'America/New_York';
  await refreshPushTimezone();
  browserZone = 'Europe/Berlin';
  assert.equal(await refreshPushTimezone(), 'sent');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.timezone, 'Europe/Berlin');
});

await test('an armed browser with no record yet sends once, then goes quiet', async () => {
  // Every browser that armed an alert before this shipped is in this state:
  // there is no record, and the stored zone is whatever it was on that day.
  armRideAlert();
  assert.equal(await refreshPushTimezone(), 'sent');
  assert.equal(await refreshPushTimezone(), 'unchanged');
  assert.equal(calls.length, 1);
});

await test('a rotated endpoint is a different question, so it sends again', async () => {
  armRideAlert();
  rememberSentPushTimezone(OTHER_ENDPOINT, 'Europe/Berlin');
  assert.equal(await refreshPushTimezone(), 'sent');
  assert.equal(calls[0].body.endpoint, ENDPOINT);
});

await test('the planner switch alone is enough to count as armed', async () => {
  armPlanner();
  assert.equal(await refreshPushTimezone(), 'sent');
  assert.equal(calls.length, 1);
});

console.log('\nrefreshPushTimezone — when it does nothing');

await test('nothing armed: it leaves before it even looks at the worker', async () => {
  let looked = false;
  setNavigator({
    serviceWorker: {
      getRegistration: async () => {
        looked = true;
        return undefined;
      },
    },
  });
  assert.equal(await refreshPushTimezone(), 'skipped');
  assert.equal(looked, false, 'the gate must be the two localStorage reads, not the lookup');
  assert.equal(calls.length, 0);
});

await test('armed in the mirror but no live subscription: nothing to refresh', async () => {
  armRideAlert();
  setNavigator(UNSUBSCRIBED_NAV);
  assert.equal(await refreshPushTimezone(), 'skipped');
  assert.equal(calls.length, 0);
});

await test('a lookup that threw is not read as "no subscription"', async () => {
  armRideAlert();
  setNavigator(LOOKUP_BROKEN_NAV);
  assert.equal(await refreshPushTimezone(), 'skipped');
  assert.equal(calls.length, 0);
  // Nothing recorded either: the zone is still unknown to this browser, so the
  // next load asks again rather than believing a lookup that never answered.
  assert.equal(readSentPushTimezone(), null);
});

await test('a browser that reports no zone is not worth a request', async () => {
  armRideAlert();
  browserZone = '';
  assert.equal(await refreshPushTimezone(), 'skipped');
  assert.equal(calls.length, 0);
});

console.log('\nrefreshPushTimezone — when the write fails');

for (const [label, stub] of [
  ['a 500', () => ({ ok: false, status: 500 })],
  [
    'a thrown fetch',
    () => {
      throw new TypeError('Failed to fetch');
    },
  ],
]) {
  await test(`${label} leaves the subscription armed and records nothing`, async () => {
    armRideAlert();
    rememberSentPushTimezone(ENDPOINT, 'Europe/Berlin');
    browserZone = 'America/New_York';
    fetchStub = stub;
    assert.equal(await refreshPushTimezone(), 'failed');
    // The one that matters: a traveller's bad connection must not answer with
    // switched-off alarms. `ensurePushRegistered` unsubscribes on a failed
    // POST because it created that subscription; this one did not.
    assert.equal(unsubscribed, 0);
    // The old record stands, so the next page load sees the same divergence
    // and tries again.
    assert.deepEqual(readSentPushTimezone(), { endpoint: ENDPOINT, timezone: 'Europe/Berlin' });
  });
}

console.log('\nrefreshPushTimezone — what the POST carries');

await test('no tripId and no topics, so the planner half of the row survives', async () => {
  armPlanner();
  assert.equal(await refreshPushTimezone(), 'sent');
  const body = calls[0].body;
  assert.equal('tripId' in body, false);
  assert.equal('topics' in body, false);
});

await test('locale is sent, because omitting it clears the stored one', async () => {
  // `PushService.subscribe` guards tripId, topics and timezone behind
  // `!== undefined` and assigns `row.locale = input.locale` unguarded. A
  // refresh that dropped it would fix the clock by wiping the language.
  armRideAlert();
  assert.equal(await refreshPushTimezone(), 'sent');
  assert.equal(calls[0].body.locale, 'de');
  assert.equal(calls[0].body.p256dh, 'p256');
  assert.equal(calls[0].body.auth, 'auth');
});

console.log('\nthe record itself');

await test('a record written by another key shape reads as none', async () => {
  storage.set(SENT_KEY, JSON.stringify({ endpoint: ENDPOINT }));
  assert.equal(readSentPushTimezone(), null);
});

await test('garbage in the slot reads as none rather than throwing', async () => {
  storage.set(SENT_KEY, 'not json');
  assert.equal(readSentPushTimezone(), null);
});

console.log(`\n${passed} test(s) passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);
