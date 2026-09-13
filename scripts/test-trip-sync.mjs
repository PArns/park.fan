/**
 * Unit tests for `lib/planner/trip-sync.ts` — storing the plan the notification
 * job reads.
 *
 * `syncTrip` used to read `response.ok` on the update and nothing else, so every
 * way a write can fail meant the same as an expired trip: drop the id, POST a
 * new one. What that costs is invisible from the browser, which is why it needs
 * pinning rather than eyeballing — the stored push subscription still names the
 * OLD trip id, so after one transient 500 the job keeps notifying off the plan
 * as it stood at that moment while every later edit goes to a row nobody reads,
 * and switching push off sends its scoped DELETE for an id the subscription
 * never had.
 *
 * So: **only a 404 starts a new trip.** 400, 429, 5xx and a dropped connection
 * keep the id and report their own class, from the shared
 * `@/lib/api/write-failure` the push writes use.
 *
 * `forgetTrip` reads the same statuses with one flipped: there a 404 is a
 * SUCCESS, because the caller is throwing the trip away and a trip that is
 * already gone is the outcome they asked for. Its own rule is the push
 * removals' — server first, mirror second — and it matters more here than
 * anywhere else in the app: this browser holds the only copy of the id, so
 * forgetting it before the server confirmed leaves the row unreachable to the
 * one person who wanted it gone, for the full 400-day TTL.
 *
 * Run: `pnpm test:trip-sync`
 */
import assert from 'node:assert/strict';

const TRIP_ID_KEY = 'parkfan_trip_id';
const PLANNER_KEY = 'parkfan_planner';

const storage = new Map();
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
};

globalThis.fetch = async (url, init) => {
  calls.push({
    url,
    method: init?.method,
    body: init?.body ? JSON.parse(init.body) : null,
    /** The stored id AS IT STOOD when the request went out. */
    tripIdAtCall: storage.get(TRIP_ID_KEY) ?? null,
  });
  return fetchStub();
};

const { syncTrip, getTripId, forgetTrip } = await import('../lib/planner/trip-sync.ts');

/** A `Response` with just the parts `classifyWriteFailure` reads. */
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

const EXISTING_ID = 'n7Qk2Fd3Xb9pLmZa';
const NEW_ID = 'aB3dE5fG7hJ9kL1m';

/**
 * A plan in the store, so the payload is a real snapshot rather than whatever a
 * missing key parses to. `plannerStore` caches its first read for the process,
 * so this is written before the module under test ever asks.
 */
function seed({ tripId = EXISTING_ID } = {}) {
  storage.clear();
  storage.set(PLANNER_KEY, JSON.stringify({ version: 1, days: [], parties: [] }));
  if (tripId !== null) storage.set(TRIP_ID_KEY, tripId);
  calls = [];
}

/** The queued answers, one per call, so a PUT and the POST behind it can differ. */
function answers(...queue) {
  const remaining = [...queue];
  fetchStub = () => {
    const next = remaining.shift();
    if (!next) throw new Error('more requests than answers');
    if (typeof next === 'function') return next();
    return next;
  };
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

console.log('\nsyncTrip · an existing trip');

await test('a 200 keeps the id and sends nothing else', async () => {
  seed();
  answers(response(200, { id: EXISTING_ID }));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: true, id: EXISTING_ID });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].url, `/api/trips/${EXISTING_ID}`);
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a 404 is the ONE answer that starts a new trip', async () => {
  seed();
  answers(response(404), response(201, { id: NEW_ID }));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: true, id: NEW_ID });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].method, 'POST');
  assert.equal(calls[1].url, '/api/trips');
  assert.equal(getTripId(), NEW_ID);
});

await test('a 500 keeps the id and does NOT create a second trip', async () => {
  seed();
  answers(response(500));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  // The whole point: one request went out, and the id the subscription names
  // is still the id this browser holds.
  assert.equal(calls.length, 1);
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a 502 from the route’s own catch reads the same way', async () => {
  seed();
  answers(response(502, { error: 'Trip service unreachable' }));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.equal(calls.length, 1);
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a 429 keeps the id and carries the limiter’s own window', async () => {
  seed();
  answers(response(429, { retryAfterSeconds: 42 }));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'rate-limited', retryAfterSeconds: 42 } });
  assert.equal(calls.length, 1);
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a 429 with an unreadable body still reads as rate-limited', async () => {
  seed();
  answers(response(429));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'rate-limited', retryAfterSeconds: 60 } });
});

await test('a 400 keeps the id — the same payload would be refused again', async () => {
  seed();
  answers(response(400, { message: 'Not a trip payload: too large' }));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'invalid' } });
  assert.equal(calls.length, 1);
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a thrown fetch keeps the id and does not create a second trip', async () => {
  seed();
  fetchStub = () => {
    throw new TypeError('Failed to fetch');
  };
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.equal(calls.length, 1);
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a 404 whose POST then fails leaves no id — the trip really is gone', async () => {
  seed();
  answers(response(404), response(500));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.equal(calls.length, 2);
  // Not a loss: the server said this id is not a trip. Keeping it would send
  // the next sync into the same 404.
  assert.equal(getTripId(), null);
  assert.equal(calls[1].tripIdAtCall, null);
});

console.log('\nsyncTrip · no trip yet');

await test('a 201 stores the id the API issued', async () => {
  seed({ tripId: null });
  answers(response(201, { id: NEW_ID }));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: true, id: NEW_ID });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'POST');
  assert.equal(getTripId(), NEW_ID);
});

await test('a refused create stores nothing and names its class', async () => {
  seed({ tripId: null });
  answers(response(429, { retryAfterSeconds: 12.4 }));
  const result = await syncTrip();
  // Rounded where it enters the app, because the same figure is both printed
  // and timed by.
  assert.deepEqual(result, { ok: false, error: { reason: 'rate-limited', retryAfterSeconds: 12 } });
  assert.equal(getTripId(), null);
});

await test('a 400 on create is invalid, not a reason to retry', async () => {
  seed({ tripId: null });
  answers(response(400));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'invalid' } });
  assert.equal(getTripId(), null);
});

await test('a create answered without an id is a failure, not a trip', async () => {
  seed({ tripId: null });
  answers(response(201, { expiresAt: '2027-10-15T00:00:00.000Z' }));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.equal(getTripId(), null);
});

await test('a create answered with an unreadable body is a failure, not a crash', async () => {
  seed({ tripId: null });
  answers(response(201));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.equal(getTripId(), null);
});

await test('a 404 on the create route is our end, not the visitor’s payload', async () => {
  seed({ tripId: null });
  answers(response(404));
  const result = await syncTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.equal(getTripId(), null);
});

console.log('\nforgetTrip · switching push off');

await test('a 204 deletes the row and only then forgets the id', async () => {
  seed();
  answers(response(204));
  const result = await forgetTrip();
  assert.deepEqual(result, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(calls[0].url, `/api/trips/${EXISTING_ID}`);
  // The order, not just the outcome: the request went out while the browser
  // still knew which row to name.
  assert.equal(calls[0].tripIdAtCall, EXISTING_ID);
  assert.equal(getTripId(), null);
});

await test('a 404 is a success — the trip is already gone', async () => {
  seed();
  answers(response(404));
  const result = await forgetTrip();
  assert.deepEqual(result, { ok: true });
  // Reported as an error it would stand for ever: every retry answers 404 too.
  assert.equal(getTripId(), null);
});

await test('a 500 keeps the id, so the row stays reachable', async () => {
  seed();
  answers(response(500));
  const result = await forgetTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  // The whole point of the order: forgetting here would leave the plan on the
  // server with nobody able to name it for 400 days.
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a 429 keeps the id and names the limiter', async () => {
  seed();
  answers(response(429, { retryAfterSeconds: 42 }));
  const result = await forgetTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'rate-limited', retryAfterSeconds: 42 } });
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a 400 keeps the id', async () => {
  seed();
  answers(response(400));
  const result = await forgetTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'invalid' } });
  assert.equal(getTripId(), EXISTING_ID);
});

await test('a thrown fetch keeps the id', async () => {
  seed();
  fetchStub = () => {
    throw new TypeError('Failed to fetch');
  };
  const result = await forgetTrip();
  assert.deepEqual(result, { ok: false, error: { reason: 'network' } });
  assert.equal(calls.length, 1);
  assert.equal(getTripId(), EXISTING_ID);
});

await test('nothing stored sends no request and still reads as done', async () => {
  seed({ tripId: null });
  const result = await forgetTrip();
  assert.deepEqual(result, { ok: true });
  assert.equal(calls.length, 0);
  assert.equal(getTripId(), null);
});

await test('a second call after a success sends nothing', async () => {
  seed();
  answers(response(204));
  await forgetTrip();
  const again = await forgetTrip();
  assert.deepEqual(again, { ok: true });
  assert.equal(calls.length, 1);
});

console.log('\nforgetTrip · overtaking a sync that is already on the wire');

/**
 * The auto-sync cannot be called back once it has been dispatched — the stopper
 * clears a debounce timer and nothing else — and the DELETE is what gives that
 * request a 404 to read. Without the guard, `syncTrip` reads that 404 as "this
 * trip is gone, start another one" and writes a brand-new id back over the one
 * the switch-off had just cleared: a plan nobody asked for, standing for 400
 * days, plus a browser that reads as subscribed on the next mount.
 */
await test('a sync whose PUT 404s after the delete does not create a new trip', async () => {
  seed();
  // The PUT is answered only after `forgetTrip` has been and gone.
  let releasePut;
  const held = new Promise((resolve) => {
    releasePut = resolve;
  });
  const queue = [
    () => held.then(() => response(404)), // the racing PUT
    response(204), // the DELETE
    response(201, { id: NEW_ID }), // must never be reached
  ];
  fetchStub = () => {
    const next = queue.shift();
    if (!next) throw new Error('more requests than answers');
    return typeof next === 'function' ? next() : next;
  };

  const racing = syncTrip();
  const forgotten = await forgetTrip();
  releasePut();
  const synced = await racing;

  assert.deepEqual(forgotten, { ok: true });
  // Abandoned, not turned into a second trip.
  assert.deepEqual(synced, { ok: false, error: { reason: 'network' } });
  assert.equal(getTripId(), null);
  assert.equal(calls.length, 2);
  assert.deepEqual(
    calls.map((c) => c.method),
    ['PUT', 'DELETE']
  );
});

await test('a sync started after a delete is a normal create', async () => {
  seed();
  answers(response(204), response(201, { id: NEW_ID }));
  await forgetTrip();
  const result = await syncTrip();
  // The counter supersedes what was in flight, never what comes after.
  assert.deepEqual(result, { ok: true, id: NEW_ID });
  assert.equal(getTripId(), NEW_ID);
});

console.log(`\n${passed} test(s) passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);
