// Regression tests for the ridden-rides store (`lib/utils/ridden-rides.ts`).
// The cases worth guarding: a stable snapshot between reads, junk in storage, and a write that
// fails (full quota) still showing the mark until the stored value changes.
import assert from 'node:assert/strict';

const data = new Map();
let failWrites = false;
let failReads = false;
globalThis.localStorage = {
  getItem: (k) => {
    if (failReads) throw new Error('blocked');
    return data.has(k) ? data.get(k) : null;
  },
  setItem: (k, v) => {
    if (failWrites) throw new Error('quota');
    data.set(k, v);
  },
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };

const { getRiddenSnapshot, getServerRiddenSnapshot, toggleRidden, RIDDEN_RIDES_KEY } =
  await import('../lib/utils/ridden-rides.ts');

const cases = [
  [
    'empty storage reads empty and is stable',
    () => {
      assert.equal(getRiddenSnapshot().size, 0);
      assert.equal(getRiddenSnapshot(), getRiddenSnapshot());
    },
  ],
  [
    'toggle marks, persists, and unmarks',
    () => {
      assert.equal(toggleRidden('a'), true);
      assert.deepEqual(JSON.parse(data.get(RIDDEN_RIDES_KEY)), ['a']);
      const first = getRiddenSnapshot();
      assert.equal(first, getRiddenSnapshot());
      assert.equal(toggleRidden('a'), false);
      assert.equal(getRiddenSnapshot().has('a'), false);
    },
  ],
  [
    'junk in storage reads empty, non-strings are dropped',
    () => {
      data.set(RIDDEN_RIDES_KEY, '{nope');
      assert.equal(getRiddenSnapshot().size, 0);
      data.set(RIDDEN_RIDES_KEY, '{"a":1}');
      assert.equal(getRiddenSnapshot().size, 0);
      data.set(RIDDEN_RIDES_KEY, '["x",3,null,"y"]');
      assert.deepEqual([...getRiddenSnapshot()].sort(), ['x', 'y']);
      data.delete(RIDDEN_RIDES_KEY);
    },
  ],
  [
    'a full quota keeps the mark in memory',
    () => {
      failWrites = true;
      assert.equal(toggleRidden('q'), true);
      assert.equal(getRiddenSnapshot().has('q'), true);
      assert.equal(getRiddenSnapshot(), getRiddenSnapshot());
      failWrites = false;
    },
  ],
  [
    'blocked storage still marks for the page',
    () => {
      failReads = true;
      failWrites = true;
      assert.equal(toggleRidden('z'), true);
      assert.equal(getRiddenSnapshot().has('z'), true);
      failReads = false;
      failWrites = false;
    },
  ],
  [
    'the server snapshot is empty',
    () => {
      assert.equal(getServerRiddenSnapshot().size, 0);
    },
  ],
];

let failed = 0;
for (const [name, fn] of cases) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n${e.message}`);
  }
}
if (failed) process.exit(1);
