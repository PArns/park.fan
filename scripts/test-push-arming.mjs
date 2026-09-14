/**
 * Unit tests for `lib/planner/push-arming.ts` — the record that decides whether
 * the planner's push switch opens `on`.
 *
 * It used to open on `existing && getTripId()`: a push subscription somewhere on
 * this origin, and a trip id stored at some point. Neither is the question. The
 * browser keeps ONE subscription for the whole origin and shares it with ride
 * alerts and followed shows, and the trip id survives a failed
 * `POST /api/push/subscriptions` just as happily as a successful one — so a
 * single network hiccup left the switch reading `on` for ever over a server
 * that had never joined the two (PAR-177). There is no read to ask instead:
 * `/v1/push/subscriptions` answers POST and DELETE only.
 *
 * What is pinned here is therefore the narrower claim the record makes and the
 * two ways it expires by itself:
 *
 *   - it names a PAIR, so a rotated endpoint or a replaced trip id reads `off`
 *     without anybody clearing anything;
 *   - it is written on the server's 2xx and cleared by switching off, and by
 *     nothing else — in particular NOT by a failed attempt, because a second
 *     tab may have armed the same pair.
 *
 * The last block is a grep over the hook: the record is worth nothing if
 * `resolve()` still reads the old expression, and that is the one thing a unit
 * test of this module cannot see (📚 G-44 — a case over an absence needs a
 * presence first).
 *
 * Run: `pnpm test:push-arming`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ARMED_KEY = 'parkfan_push_armed';

const storage = new Map();
let storageThrows = false;

globalThis.window = {
  localStorage: {
    getItem: (key) => {
      if (storageThrows) throw new Error('site data blocked');
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem: (key, value) => {
      if (storageThrows) throw new Error('site data blocked');
      storage.set(key, String(value));
    },
    removeItem: (key) => {
      if (storageThrows) throw new Error('site data blocked');
      storage.delete(key);
    },
  },
};

const { readArmedPush, rememberArmedPush, forgetArmedPush, pushIsArmedFor } =
  await import('../lib/planner/push-arming.ts');

/** A push service endpoint, at the length the real ones have. */
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/dK3sQ1zR9mP:APA91bF-7hLxQ2vN8cT4';
const OTHER_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/xY7wB2nH4kL:APA91bG-3jRmT8dV1sZ6';
const TRIP_ID = 'n7Qk2Fd3Xb9pLmZa';
const OTHER_TRIP_ID = 'aB3dE5fG7hJ9kL1m';

function reset() {
  storage.clear();
  storageThrows = false;
}

let passed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`FAIL  ${name}\n      ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// The pair, and the three states the acceptance criteria name
// ---------------------------------------------------------------------------

await test('nothing stored reads off', () => {
  reset();
  assert.equal(readArmedPush(), null);
  assert.equal(pushIsArmedFor(ENDPOINT, TRIP_ID), false);
});

await test('the confirmed pair reads on', () => {
  reset();
  rememberArmedPush(ENDPOINT, TRIP_ID);
  assert.deepEqual(readArmedPush(), { endpoint: ENDPOINT, tripId: TRIP_ID });
  assert.equal(pushIsArmedFor(ENDPOINT, TRIP_ID), true);
});

await test('a ride alert alone is not the planner switch', () => {
  reset();
  // The visitor has an armed ride alert, so the origin's subscription exists
  // and `getSubscription()` answers — and they once uploaded a plan, so a trip
  // id is stored. That was the whole of the old test, and it said "on".
  assert.equal(pushIsArmedFor(ENDPOINT, TRIP_ID), false);
});

await test('a rotated endpoint expires the record', () => {
  reset();
  rememberArmedPush(ENDPOINT, TRIP_ID);
  assert.equal(pushIsArmedFor(OTHER_ENDPOINT, TRIP_ID), false);
});

await test('a replaced trip id expires the record', () => {
  reset();
  // `syncTrip` drops the id on a 404 and POSTs a fresh trip. The server's
  // subscription still names the old one, so the switch may not claim `on`.
  rememberArmedPush(ENDPOINT, TRIP_ID);
  assert.equal(pushIsArmedFor(ENDPOINT, OTHER_TRIP_ID), false);
});

await test('no subscription and no trip read off whatever is stored', () => {
  reset();
  rememberArmedPush(ENDPOINT, TRIP_ID);
  assert.equal(pushIsArmedFor(undefined, TRIP_ID), false);
  assert.equal(pushIsArmedFor(ENDPOINT, null), false);
  assert.equal(pushIsArmedFor(null, null), false);
});

await test('switching off drops it', () => {
  reset();
  rememberArmedPush(ENDPOINT, TRIP_ID);
  forgetArmedPush();
  assert.equal(readArmedPush(), null);
  assert.equal(pushIsArmedFor(ENDPOINT, TRIP_ID), false);
});

await test('re-arming the same browser for a new trip replaces the pair', () => {
  reset();
  rememberArmedPush(ENDPOINT, TRIP_ID);
  rememberArmedPush(ENDPOINT, OTHER_TRIP_ID);
  assert.equal(pushIsArmedFor(ENDPOINT, TRIP_ID), false);
  assert.equal(pushIsArmedFor(ENDPOINT, OTHER_TRIP_ID), true);
  assert.equal(storage.size, 1, 'one key, not one per trip ever armed');
});

// ---------------------------------------------------------------------------
// What a broken or hostile store does
// ---------------------------------------------------------------------------

await test('a storage that throws reads off rather than crashing', () => {
  reset();
  rememberArmedPush(ENDPOINT, TRIP_ID);
  storageThrows = true;
  assert.equal(readArmedPush(), null);
  assert.equal(pushIsArmedFor(ENDPOINT, TRIP_ID), false);
  // And neither write escapes.
  rememberArmedPush(ENDPOINT, TRIP_ID);
  forgetArmedPush();
});

await test('garbage under the key reads off', () => {
  for (const raw of [
    'not json',
    'null',
    '[]',
    '"' + ENDPOINT + '"',
    JSON.stringify({ endpoint: ENDPOINT }),
    JSON.stringify({ tripId: TRIP_ID }),
    JSON.stringify({ endpoint: '', tripId: TRIP_ID }),
    JSON.stringify({ endpoint: ENDPOINT, tripId: '' }),
    JSON.stringify({ endpoint: 7, tripId: TRIP_ID }),
  ]) {
    reset();
    storage.set(ARMED_KEY, raw);
    assert.equal(readArmedPush(), null, `read: ${raw}`);
    assert.equal(pushIsArmedFor(ENDPOINT, TRIP_ID), false, `armed: ${raw}`);
  }
});

// ---------------------------------------------------------------------------
// The wiring, because the record decides nothing on its own
// ---------------------------------------------------------------------------

const hook = readFileSync(
  new URL('../lib/planner/use-push-subscription.ts', import.meta.url),
  'utf8'
);

await test('resolve() asks the record and no longer the two local signals', () => {
  assert.match(
    hook,
    /setState\(pushIsArmedFor\(existing\?\.endpoint, getTripId\(\)\) \? 'on' : 'off'\)/,
    'resolve() reads the confirmed pair'
  );
  assert.doesNotMatch(hook, /existing && getTripId\(\)/, 'the old guess is gone');
});

await test('the record is written after the POST answered, and only there', () => {
  const writes = hook.match(/rememberArmedPush\(/g) ?? [];
  assert.equal(writes.length, 1, 'exactly one write');
  const guard = hook.indexOf('if (!response.ok) {');
  const write = hook.indexOf('rememberArmedPush(');
  assert.ok(guard !== -1 && write > guard, 'the write sits past the !ok branch');
  assert.match(
    hook,
    /rememberArmedPush\(subscription\.endpoint, tripId\)/,
    'the pair that was sent'
  );
});

await test('switching off clears it, and a failed enable does not', () => {
  const clears = hook.match(/forgetArmedPush\(\)/g) ?? [];
  assert.equal(clears.length, 1, 'exactly one clear');
  // In `disable()`'s `finally`, beside the `setState('off')` it belongs to.
  assert.match(hook, /forgetArmedPush\(\);\n\s*setState\('off'\);/);
  const clear = hook.indexOf('forgetArmedPush()');
  const disable = hook.indexOf('const disable = useCallback');
  assert.ok(disable !== -1 && clear > disable, 'it is inside disable(), not enable()');
});

console.log(`\n${passed} test(s) passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);
