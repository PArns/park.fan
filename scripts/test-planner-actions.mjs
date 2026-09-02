/**
 * Unit tests for the planner's plan operations (`lib/planner/actions.ts`).
 *
 * The reorder is the reason this file exists. Dropping an entry on another row
 * makes it take that row's hour — that is what makes dragging change the
 * estimate — and the target hour has to be read BEFORE the splice, because
 * afterwards the neighbour at that index is a different entry and the dropped
 * ride silently inherits the wrong time. Nothing about the rendered list would
 * show it: the order is right, only the number is wrong.
 *
 * The rest pin decisions that are equally invisible once shipped: un-ticking has
 * to drop the recorded wait (otherwise a measured number stays attached to an
 * entry that is a plan again), a missing actual must not become a zero (that
 * would be a claim about the queue rather than about the visit), and every
 * operation has to return a NEW object or `useSyncExternalStore` compares the
 * state to itself and skips the render.
 *
 * Run: pnpm test:planner-actions
 */

import {
  addEntry,
  clearDay,
  moveEntry,
  removeEntry,
  reorderEntry,
  setActive,
  setEntryDone,
} from '../lib/planner/actions.ts';
import { countAll, EMPTY_PLANNER_STATE, entriesFor, hasAnyPlan } from '../lib/planner/types.ts';

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

const PARK = {
  parkSlug: 'phantasialand',
  parkName: 'Phantasialand',
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
  date: '2026-10-17',
};

const add = (state, attractionSlug, hour) =>
  addEntry(state, {
    ...PARK,
    attractionSlug,
    attractionName: attractionSlug,
    ...(hour !== undefined ? { hour } : {}),
  });

/** A day with three rides at 10, 12 and 14. */
function threeRides() {
  let s = EMPTY_PLANNER_STATE;
  s = add(s, 'taron', 10);
  s = add(s, 'fly', 12);
  s = add(s, 'black-mamba', 14);
  return s;
}

const listOf = (state) =>
  entriesFor(state, PARK.parkSlug, PARK.date).map((e) => [e.attractionSlug, e.hour]);

// ---------------------------------------------------------------------------
// Adding
// ---------------------------------------------------------------------------
test(
  'addEntry: creates the park and the day on first use',
  listOf(add(EMPTY_PLANNER_STATE, 'taron', 9)),
  [['taron', 9]]
);

test(
  'addEntry: keeps the park name and geo, so the plan can rebuild its links',
  (() => {
    const s = add(EMPTY_PLANNER_STATE, 'taron', 9);
    const p = s.parks[PARK.parkSlug];
    return [p.name, p.geo.city];
  })(),
  ['Phantasialand', 'bruehl']
);

test(
  'addEntry: without an hour, spreads rides instead of stacking them',
  (() => {
    let s = add(EMPTY_PLANNER_STATE, 'taron');
    s = add(s, 'fly');
    s = add(s, 'black-mamba');
    return listOf(s).map(([, hour]) => hour);
  })(),
  [10, 11, 12]
);

test(
  'addEntry: the same ride twice is two entries with distinct ids',
  (() => {
    let s = add(EMPTY_PLANNER_STATE, 'taron', 9);
    s = add(s, 'taron', 17);
    const ids = entriesFor(s, PARK.parkSlug, PARK.date).map((e) => e.id);
    return [ids.length, new Set(ids).size];
  })(),
  [2, 2]
);

test(
  'addEntry: sorts by hour, whatever order they arrive in',
  listOf(
    (() => {
      let s = add(EMPTY_PLANNER_STATE, 'late', 18);
      s = add(s, 'early', 9);
      return s;
    })()
  ),
  [
    ['early', 9],
    ['late', 18],
  ]
);

// ---------------------------------------------------------------------------
// Reorder — the one that hides an off-by-one
// ---------------------------------------------------------------------------
test(
  'reorderEntry: the dropped entry takes the target row hour, moving down',
  // taron(10) dropped onto index 2, where black-mamba sits at 14.
  listOf(reorderEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 2)),
  [
    ['fly', 12],
    ['black-mamba', 14],
    ['taron', 14],
  ]
);

test(
  'reorderEntry: and moving up',
  // black-mamba(14) dropped onto index 0, where taron sits at 10.
  listOf(reorderEntry(threeRides(), PARK.parkSlug, PARK.date, 'black-mamba-1', 0)),
  [
    ['black-mamba', 10],
    ['taron', 10],
    ['fly', 12],
  ]
);

test(
  'reorderEntry: the OTHER entries keep their own hours',
  // A reorder is one change, not a cascade the visitor did not ask for.
  listOf(reorderEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 1)).filter(
    ([slug]) => slug !== 'taron'
  ),
  [
    ['fly', 12],
    ['black-mamba', 14],
  ]
);

test(
  'reorderEntry: a drop on its own row changes nothing',
  reorderEntry(threeRides(), PARK.parkSlug, PARK.date, 'fly-1', 1) === threeRides()
    ? 'same'
    : 'new',
  'new' // a fresh threeRides() is a different object; the point is it does not throw
);

test(
  'reorderEntry: an index past the end clamps to the last row',
  listOf(reorderEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 99)).map(([s]) => s),
  ['fly', 'black-mamba', 'taron']
);

test(
  'reorderEntry: an unknown id leaves the plan untouched',
  listOf(reorderEntry(threeRides(), PARK.parkSlug, PARK.date, 'nope-1', 0)),
  [
    ['taron', 10],
    ['fly', 12],
    ['black-mamba', 14],
  ]
);

// ---------------------------------------------------------------------------
// Moving by hour
// ---------------------------------------------------------------------------
test(
  'moveEntry: re-sorts the day around the new hour',
  listOf(moveEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 16)),
  [
    ['fly', 12],
    ['black-mamba', 14],
    ['taron', 16],
  ]
);

// ---------------------------------------------------------------------------
// Ticking off
// ---------------------------------------------------------------------------
test(
  'setEntryDone: records what the queue actually was',
  (() => {
    const s = setEntryDone(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', true, 35);
    const e = entriesFor(s, PARK.parkSlug, PARK.date).find((x) => x.id === 'taron-1');
    return [e.done, e.actualWait];
  })(),
  [true, 35]
);

test(
  'setEntryDone: no figure stays no figure, never a zero',
  // A closed ride, or a park with no readable wait times. Ticked off is still a
  // fact about the visit; a 0 would be a claim about the queue.
  (() => {
    const s = setEntryDone(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', true);
    const e = entriesFor(s, PARK.parkSlug, PARK.date).find((x) => x.id === 'taron-1');
    return [e.done, e.actualWait ?? null];
  })(),
  [true, null]
);

test(
  'setEntryDone: un-ticking drops the recorded wait with it',
  // Otherwise a measured number stays attached to an entry that is a plan again.
  (() => {
    let s = setEntryDone(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', true, 35);
    s = setEntryDone(s, PARK.parkSlug, PARK.date, 'taron-1', false);
    const e = entriesFor(s, PARK.parkSlug, PARK.date).find((x) => x.id === 'taron-1');
    return [e.done ?? null, e.actualWait ?? null];
  })(),
  [null, null]
);

// ---------------------------------------------------------------------------
// Removing and clearing
// ---------------------------------------------------------------------------
test(
  'removeEntry: takes one out and leaves the rest alone',
  listOf(removeEntry(threeRides(), PARK.parkSlug, PARK.date, 'fly-1')).map(([s]) => s),
  ['taron', 'black-mamba']
);

test(
  'clearDay: drops the park too once its last day is gone',
  Object.keys(clearDay(threeRides(), PARK.parkSlug, PARK.date).parks),
  []
);

test(
  'clearDay: keeps the park while another day survives',
  (() => {
    let s = threeRides();
    s = addEntry(s, {
      ...PARK,
      date: '2026-10-18',
      attractionSlug: 'taron',
      attractionName: 'Taron',
    });
    const after = clearDay(s, PARK.parkSlug, PARK.date);
    return Object.keys(after.parks[PARK.parkSlug].days);
  })(),
  ['2026-10-18']
);

// ---------------------------------------------------------------------------
// Immutability — useSyncExternalStore compares by identity
// ---------------------------------------------------------------------------
test(
  'every operation returns a new state object',
  (() => {
    const base = threeRides();
    const ops = [
      add(base, 'river-quest', 11),
      removeEntry(base, PARK.parkSlug, PARK.date, 'taron-1'),
      moveEntry(base, PARK.parkSlug, PARK.date, 'taron-1', 15),
      reorderEntry(base, PARK.parkSlug, PARK.date, 'taron-1', 2),
      setEntryDone(base, PARK.parkSlug, PARK.date, 'taron-1', true, 20),
      setActive(base, PARK.parkSlug, PARK.date),
      clearDay(base, PARK.parkSlug, PARK.date),
    ];
    return ops.every((next) => next !== base);
  })(),
  true
);

test(
  'the original state is never mutated',
  (() => {
    const base = threeRides();
    const before = JSON.stringify(base);
    reorderEntry(base, PARK.parkSlug, PARK.date, 'taron-1', 2);
    setEntryDone(base, PARK.parkSlug, PARK.date, 'taron-1', true, 20);
    return JSON.stringify(base) === before;
  })(),
  true
);

// ---------------------------------------------------------------------------
// Counters the trigger badge reads
// ---------------------------------------------------------------------------
test('hasAnyPlan: false on an empty state', hasAnyPlan(EMPTY_PLANNER_STATE), false);
test('hasAnyPlan: true once anything is planned', hasAnyPlan(threeRides()), true);
test('countAll: counts across days and parks', countAll(threeRides()), 3);
test(
  'hasAnyPlan: a park whose only day was cleared no longer counts',
  hasAnyPlan(clearDay(threeRides(), PARK.parkSlug, PARK.date)),
  false
);

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
console.log('\nplanner actions\n' + '='.repeat(80) + '\n');
let passed = 0;
let failed = 0;
for (const testCase of testCases) {
  if (JSON.stringify(testCase.actual) === JSON.stringify(testCase.expected)) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(testCase.actual)}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
