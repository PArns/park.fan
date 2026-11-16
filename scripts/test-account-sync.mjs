// A visitor account's sync: how two copies of the synced state become one on the first sign-in,
// and when a browser pulls the account's copy, pushes its own, or leaves both alone.
import { accountSyncStep, mergeAccountState, sameAccountState } from '../lib/account/state.ts';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const C = '00000000-0000-4000-8000-00000000000c';

/** A state with the given park favorites, ridden rides and unit. */
function state(parks, ridden = [], unit = null, updatedAt = null) {
  return {
    favorites: { parks, attractions: [], shows: [], restaurants: [] },
    riddenRides: ridden,
    temperatureUnit: unit,
    updatedAt,
  };
}

const testCases = [
  {
    name: 'the first merge keeps both sides, each id once, local order first',
    actual: () => {
      const merged = mergeAccountState(state([A, B], [C]), state([B, C], [A]));
      return [merged.favorites.parks, merged.riddenRides];
    },
    expected: [
      [A, B, C],
      [C, A],
    ],
  },
  {
    name: 'a unit picked here wins, the account fills one in when there is none',
    actual: () => [
      mergeAccountState(state([], [], 'F'), state([], [], 'C')).temperatureUnit,
      mergeAccountState(state([], [], null), state([], [], 'C')).temperatureUnit,
    ],
    expected: ['F', 'C'],
  },
  {
    name: 'order does not make two states different',
    actual: () => [
      sameAccountState(state([A, B], [C], 'C'), state([B, A], [C], 'C')),
      sameAccountState(state([A]), state([A, B])),
      sameAccountState(state([A], [], 'C'), state([A], [], 'F')),
    ],
    expected: [true, false, false],
  },
  {
    name: 'a browser that never synced, or synced another account, merges',
    actual: () => [
      accountSyncStep(null, 'fan@x.test', state([A]), state([B])).kind,
      accountSyncStep(
        { email: 'other@x.test', syncedAt: null },
        'fan@x.test',
        state([A]),
        state([B])
      ).kind,
    ],
    expected: ['merge', 'merge'],
  },
  {
    name: 'an account changed on another device since the last sync is pulled',
    actual: () =>
      accountSyncStep(
        { email: 'fan@x.test', syncedAt: '2026-11-16T10:00:00Z' },
        'fan@x.test',
        state([A]),
        state([A, B], [], null, '2026-11-16T11:00:00Z')
      ).kind,
    expected: 'pull',
  },
  {
    name: 'a local change since the last sync is pushed; equal copies stay as they are',
    actual: () => {
      const record = { email: 'fan@x.test', syncedAt: '2026-11-16T11:00:00Z' };
      const server = state([A], [], null, '2026-11-16T11:00:00Z');
      return [
        accountSyncStep(record, 'fan@x.test', state([A, C]), server).kind,
        accountSyncStep(record, 'fan@x.test', state([A]), server).kind,
      ];
    },
    expected: ['push', 'none'],
  },
];

let passed = 0;
let failed = 0;
console.log('\n🔄 Account sync\n');
for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `threw: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
    passed++;
    console.log(`  ✓ ${testCase.name}`);
  } else {
    failed++;
    console.log(`  ✗ ${testCase.name}`);
    console.log(`      expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`      actual:   ${JSON.stringify(result)}`);
  }
}

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
console.log('🎉 All tests passed!');
