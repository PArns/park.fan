/**
 * Unit tests for the planner's plan operations (`lib/planner/actions.ts`).
 *
 * An entry's time is park-local MINUTES now, not an hour, because the day grid
 * puts a block wherever the visitor drops it. `reorderEntry` is gone with the
 * list it belonged to: its whole premise was that a drop target is an index and
 * the dropped entry takes the hour of the row it landed on, which was only ever
 * a way to express a time with no axis to express it against. `moveEntry` says
 * the thing directly, and its two identity guards are what keep a drag that ends
 * where it started from costing a full localStorage write.
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
  openDay,
  removeEntry,
  setActive,
  setEntryDone,
  shiftFrom,
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
    ...(hour !== undefined ? { startMinute: hour * 60 } : {}),
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
  entriesFor(state, PARK.parkSlug, PARK.date).map((e) => [e.attractionSlug, e.startMinute / 60]);

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
// Moving to a minute — what a drag on the grid writes
// ---------------------------------------------------------------------------
test(
  'moveEntry: re-sorts the day around the new time',
  listOf(moveEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 16 * 60)),
  [
    ['fly', 12],
    ['black-mamba', 14],
    ['taron', 16],
  ]
);

test(
  'moveEntry: lands on the minute it was given, not on an hour',
  entriesFor(
    moveEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 11 * 60 + 45),
    PARK.parkSlug,
    PARK.date
  ).find((e) => e.id === 'taron-1').startMinute,
  705
);

// The guard that matters most in practice: a drag that ends where it started is
// the commonest gesture there is, and every store write stringifies the whole
// multi-park plan, rewrites the cookie and notifies every subscriber.
test(
  'moveEntry: a move to the same minute returns the SAME object',
  (() => {
    const base = threeRides();
    return moveEntry(base, PARK.parkSlug, PARK.date, 'taron-1', 10 * 60) === base;
  })(),
  true
);

test(
  'moveEntry: an unknown id returns the same object',
  (() => {
    const base = threeRides();
    return moveEntry(base, PARK.parkSlug, PARK.date, 'nope-1', 600) === base;
  })(),
  true
);

test(
  'moveEntry: a time outside the day is clamped where it can be tested',
  entriesFor(
    moveEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 99_999),
    PARK.parkSlug,
    PARK.date
  ).find((e) => e.id === 'taron-1').startMinute,
  1500
);

// The store still writes an `hour` mirror for one release, so a tab running the
// previous build reads a plan it understands instead of dropping every entry.
test(
  'moveEntry: keeps the legacy hour mirror in step',
  entriesFor(
    moveEntry(threeRides(), PARK.parkSlug, PARK.date, 'taron-1', 11 * 60 + 45),
    PARK.parkSlug,
    PARK.date
  ).find((e) => e.id === 'taron-1').hour,
  11
);

// ---------------------------------------------------------------------------
// Shifting a tail — the second half of a repair, and never automatic
// ---------------------------------------------------------------------------
test(
  'shiftFrom: moves the named entry and everything after it',
  listOf(shiftFrom(threeRides(), PARK.parkSlug, PARK.date, 'fly-1', 30)),
  [
    ['taron', 10],
    ['fly', 12.5],
    ['black-mamba', 14.5],
  ]
);

test(
  'shiftFrom: a zero delta returns the same object',
  (() => {
    const base = threeRides();
    return shiftFrom(base, PARK.parkSlug, PARK.date, 'fly-1', 0) === base;
  })(),
  true
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
      moveEntry(base, PARK.parkSlug, PARK.date, 'taron-1', 15 * 60),
      shiftFrom(base, PARK.parkSlug, PARK.date, 'taron-1', 30),
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
    moveEntry(base, PARK.parkSlug, PARK.date, 'taron-1', 15 * 60);
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
// ── openDay: the calendar's entry point ──────────────────────────────────────

const CAL_PARK = {
  slug: 'phantasialand',
  name: 'Phantasialand',
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
};

test(
  'openDay: registers a park the state has never seen, with its geo',
  openDay(EMPTY_PLANNER_STATE, CAL_PARK, '2026-10-17').parks.phantasialand?.geo,
  CAL_PARK.geo
);

test(
  'openDay: points the panel at that park and day',
  (() => {
    const s = openDay(EMPTY_PLANNER_STATE, CAL_PARK, '2026-10-17');
    return [s.activeParkSlug, s.activeDate];
  })(),
  ['phantasialand', '2026-10-17']
);

// The whole point of not adding a placeholder entry: the launcher must stay
// hidden, and the overview must not list a day with nothing in it.
test(
  'openDay: adds no entry',
  hasAnyPlan(openDay(EMPTY_PLANNER_STATE, CAL_PARK, '2026-10-17')),
  false
);

test(
  'openDay: keeps the entries of a day that already has some',
  entriesFor(openDay(threeRides(), CAL_PARK, PARK.date), PARK.parkSlug, PARK.date).map(
    (e) => e.attractionSlug
  ),
  ['taron', 'fly', 'black-mamba']
);

test(
  'openDay: names a park that was stored under its slug alone',
  openDay(
    openDay(
      EMPTY_PLANNER_STATE,
      { slug: 'phantasialand', name: 'phantasialand', geo: CAL_PARK.geo },
      '2026-10-17'
    ),
    CAL_PARK,
    '2026-10-18'
  ).parks.phantasialand?.name,
  'Phantasialand'
);

let passed = 0;
// ── The park's zone reaches the store ───────────────────────────────────────
// It never did. `PlannerPark.timezone` was declared, `openDay` and `addEntry`
// both accepted it, and not one call site passed it — so the flyout's
// `day?.timezone ?? park?.timezone ?? 'UTC'` fell all the way through and the
// planner reckoned "today", the now line and the day picker in UTC. These pin
// the field being WRITTEN, which is the half that was missing.
test(
  'addEntry stores the park zone',
  addEntry(EMPTY_PLANNER_STATE, {
    ...PARK,
    timezone: 'America/New_York',
    attractionSlug: 'space-mountain',
    attractionName: 'Space Mountain',
  }).parks[PARK.parkSlug].timezone,
  'America/New_York'
);

test(
  'openDay stores the park zone',
  openDay(
    EMPTY_PLANNER_STATE,
    { slug: PARK.parkSlug, name: PARK.parkName, geo: PARK.geo, timezone: 'Asia/Tokyo' },
    PARK.date
  ).parks[PARK.parkSlug].timezone,
  'Asia/Tokyo'
);

// A ride planned twice is two entries, not one — the store always allowed it and
// only the two controls refused. `makeId` counts the collision up.
test(
  'the same ride twice is two entries',
  (() => {
    let s = add(EMPTY_PLANNER_STATE, 'taron', 10);
    s = add(s, 'taron', 17);
    return s.parks[PARK.parkSlug].days[PARK.date].entries.length;
  })(),
  2
);
test(
  'and they get distinct ids',
  (() => {
    let s = add(EMPTY_PLANNER_STATE, 'taron', 10);
    s = add(s, 'taron', 17);
    const ids = s.parks[PARK.parkSlug].days[PARK.date].entries.map((e) => e.id);
    return new Set(ids).size;
  })(),
  2
);

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
