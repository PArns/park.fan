/**
 * Unit tests for the show half of `lib/push/push-follows-store.ts` — the
 * local mirror of which shows this browser follows, and WHICH performance of
 * each one the reminder is for.
 *
 * The performance matters because the park panel lists an hourly show once
 * per showtime: a mirror keyed by show id alone lit all four of those bells
 * for a reminder the API can only hold once (`show_follows` is unique per
 * subscription + show, and its upsert overwrites `startTime`).
 *
 * The other half is the old format. Every returning browser has bare show-id
 * strings under this key, written before the column existed, and they mean
 * what they always meant: the open-ended follow.
 *
 * Run: `pnpm test:show-follows-store`
 */
import assert from 'node:assert/strict';

const KEY = 'parkfan_show_follows';

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
};

const {
  countPushFollowsLocal,
  getShowFollowLocal,
  parseShowFollowEntry,
  setShowFollowedLocal,
  showFollowMatchesLocal,
} = await import('../lib/push/push-follows-store.ts');

function seed(value) {
  storage.clear();
  if (value !== undefined) storage.set(KEY, JSON.stringify(value));
}

/** What is actually on disk, so a test can assert the written shape. */
function stored() {
  const raw = storage.get(KEY);
  return raw === undefined ? null : JSON.parse(raw);
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('a bare string entry reads as the open-ended follow', () => {
  assert.deepEqual(parseShowFollowEntry('show-1'), { showId: 'show-1', startTime: null });
});

test('an entry with a chosen performance keeps it', () => {
  assert.deepEqual(
    parseShowFollowEntry({ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }),
    {
      showId: 'show-1',
      startTime: '2026-09-09T14:00:00.000Z',
    }
  );
});

test('an entry with a startTime that is not a string is open-ended, not dropped', () => {
  assert.deepEqual(parseShowFollowEntry({ showId: 'show-1', startTime: 17 }), {
    showId: 'show-1',
    startTime: null,
  });
  assert.deepEqual(parseShowFollowEntry({ showId: 'show-1' }), {
    showId: 'show-1',
    startTime: null,
  });
});

test('anything without a show id is skipped', () => {
  assert.equal(parseShowFollowEntry(null), null);
  assert.equal(parseShowFollowEntry(42), null);
  assert.equal(parseShowFollowEntry({ startTime: '2026-09-09T14:00:00.000Z' }), null);
});

test('a list written before the column existed still reads as followed', () => {
  seed(['show-1', 'show-2']);
  assert.equal(showFollowMatchesLocal('show-1'), true);
  assert.equal(showFollowMatchesLocal('show-3'), false);
  assert.deepEqual(getShowFollowLocal('show-2'), { showId: 'show-2', startTime: null });
  assert.equal(countPushFollowsLocal(), 2);
});

test('an open-ended follow answers for any performance asked about', () => {
  // It really does fire before each of them, so every bell beside one is armed.
  seed(['show-1']);
  assert.equal(showFollowMatchesLocal('show-1'), true);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T14:00:00.000Z'), true);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T16:00:00.000Z'), true);
});

test('a follow for one performance answers for that one only', () => {
  seed([{ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }]);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T14:00:00.000Z'), true);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T16:00:00.000Z'), false);
  // The show card's bell asks the open-ended question and still sees it: the
  // browser does follow this show, and that bell is the way to switch it off.
  assert.equal(showFollowMatchesLocal('show-1'), true);
});

test('a pin matches its performance however the instant was serialized', () => {
  // The stored half has been in localStorage since an earlier visit; the
  // rendered half comes from whatever the API sends today.
  seed([{ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }]);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T14:00:00Z'), true);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T16:00:00+02:00'), true);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T14:00:01.000Z'), false);
});

test('an unreadable stored instant matches nothing rather than everything', () => {
  seed([{ showId: 'show-1', startTime: 'not-a-date' }]);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T14:00:00.000Z'), false);
  // The show is still followed, so its card bell can still switch it off.
  assert.equal(showFollowMatchesLocal('show-1'), true);
});

test('a show nobody follows matches nothing', () => {
  seed([]);
  assert.equal(showFollowMatchesLocal('show-1'), false);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T14:00:00.000Z'), false);
  assert.equal(getShowFollowLocal('show-1'), null);
});

test('following writes the performance it was armed for', () => {
  seed([]);
  setShowFollowedLocal('show-1', true, '2026-09-09T14:00:00.000Z');
  assert.deepEqual(stored(), [{ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }]);
  assert.equal(showFollowMatchesLocal('show-1', '2026-09-09T14:00:00.000Z'), true);
});

test('following without a performance is the open-ended follow', () => {
  seed([]);
  setShowFollowedLocal('show-1', true);
  assert.deepEqual(stored(), [{ showId: 'show-1', startTime: null }]);
});

test('arming a second performance replaces the first — the API holds one row', () => {
  seed([{ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }]);
  setShowFollowedLocal('show-1', true, '2026-09-09T16:00:00.000Z');
  assert.deepEqual(stored(), [{ showId: 'show-1', startTime: '2026-09-09T16:00:00.000Z' }]);
});

test('re-arming the same performance writes nothing', () => {
  seed([{ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }]);
  const before = storage.get(KEY);
  setShowFollowedLocal('show-1', true, '2026-09-09T14:00:00.000Z');
  assert.equal(storage.get(KEY), before);
});

test('narrowing an old open-ended follow to one performance is a write', () => {
  seed(['show-1']);
  setShowFollowedLocal('show-1', true, '2026-09-09T14:00:00.000Z');
  assert.deepEqual(stored(), [{ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }]);
});

test('other shows keep their own entries when one is armed', () => {
  seed(['show-2', { showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }]);
  setShowFollowedLocal('show-1', true, '2026-09-09T16:00:00.000Z');
  assert.deepEqual(stored(), [
    { showId: 'show-2', startTime: null },
    { showId: 'show-1', startTime: '2026-09-09T16:00:00.000Z' },
  ]);
});

test('unfollowing drops the show whichever performance it named', () => {
  seed([{ showId: 'show-1', startTime: '2026-09-09T14:00:00.000Z' }, 'show-2']);
  setShowFollowedLocal('show-1', false);
  assert.deepEqual(stored(), [{ showId: 'show-2', startTime: null }]);
  assert.equal(showFollowMatchesLocal('show-1'), false);
});

test('unfollowing a show that is not followed writes nothing', () => {
  seed(['show-2']);
  const before = storage.get(KEY);
  setShowFollowedLocal('show-1', false);
  assert.equal(storage.get(KEY), before);
});

test('a corrupt list is an empty list, never a throw', () => {
  storage.clear();
  storage.set(KEY, '{not json');
  assert.equal(showFollowMatchesLocal('show-1'), false);
  storage.set(KEY, '"a string"');
  assert.equal(showFollowMatchesLocal('show-1'), false);
  storage.set(KEY, JSON.stringify(['show-1', null, 7, { startTime: 'x' }]));
  assert.equal(showFollowMatchesLocal('show-1'), true);
  assert.equal(countPushFollowsLocal(), 1);
});

console.log(`\n${passed} assertions passed.`);
