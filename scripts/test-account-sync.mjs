// A visitor account's sync: how two copies of the synced state become one on the first sign-in,
// and when a browser pulls the account's copy, pushes its own, or leaves both alone.
import { accountSyncStep, mergeAccountState, sameAccountState } from '../lib/account/state.ts';
import { runCases } from './lib/run-cases.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const C = '00000000-0000-4000-8000-00000000000c';

/** A state with the given park favorites, ridden rides, unit and visited parks. */
function state(parks, ridden = [], unit = null, updatedAt = null, visited = []) {
  return {
    favorites: { parks, attractions: [], shows: [], restaurants: [] },
    riddenRides: ridden,
    visitedParks: visited,
    temperatureUnit: unit,
    updatedAt,
  };
}

/** A park ticked off in Orlando on a date. */
const visit = (park, date) => ({ region: 'orlando', park, date });

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
    name: 'the first merge keeps the visited parks of both sides, a park on both with its later date',
    actual: () =>
      mergeAccountState(
        state([], [], null, null, [
          visit('epcot', '2026-11-18'),
          visit('magic-kingdom-park', '2026-11-19'),
        ]),
        state([], [], null, null, [
          visit('epcot', '2026-11-20'),
          visit('universal-studios-florida', '2026-11-17'),
        ])
      ).visitedParks,
    expected: [
      visit('epcot', '2026-11-20'),
      visit('magic-kingdom-park', '2026-11-19'),
      visit('universal-studios-florida', '2026-11-17'),
    ],
  },
  {
    name: 'a park ticked on another date, or not at all, makes two states different',
    actual: () => [
      sameAccountState(
        state([], [], null, null, [
          visit('epcot', '2026-11-20'),
          visit('magic-kingdom-park', '2026-11-19'),
        ]),
        state([], [], null, null, [
          visit('magic-kingdom-park', '2026-11-19'),
          visit('epcot', '2026-11-20'),
        ])
      ),
      sameAccountState(
        state([], [], null, null, [visit('epcot', '2026-11-20')]),
        state([], [], null, null, [visit('epcot', '2026-11-19')])
      ),
      sameAccountState(state([], [], null, null, [visit('epcot', '2026-11-20')]), state([])),
    ],
    expected: [true, false, false],
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

console.log('\n🔄 Account sync\n');
await runCases(testCases, { json: true });
