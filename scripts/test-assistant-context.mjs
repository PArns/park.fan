/**
 * What Parky reads of this browser with each question and what it may change there: the plan
 * snapshot and Parky's undo (`lib/assistant/planner-context.ts`), the planner edits it may send
 * (`lib/assistant/actions.ts`) and the reorder they write (`moveEntryToIndex`).
 */

import assert from 'node:assert/strict';
import { readAssistantAction } from '@/lib/assistant/actions.ts';
import {
  assistantPlannerSnapshot,
  hasParkyUndo,
  rememberDayForUndo,
  SNAPSHOT_MAX_DAYS,
  SNAPSHOT_MAX_ENTRIES,
  undoParkyChange,
} from '@/lib/assistant/planner-context.ts';
import {
  addCustomEntry,
  addEntry,
  addShowEntry,
  moveEntryToIndex,
  removeEntry,
  reserveDays,
  setDayPrefs,
} from '@/lib/planner/actions.ts';
import { EMPTY_PLANNER_STATE, entriesFor } from '@/lib/planner/types.ts';
import {
  ALERTS_SNAPSHOT_MAX,
  assistantAlertsSnapshot,
  rideTarget,
  showTarget,
} from '@/lib/assistant/alerts-context.ts';

let passed = 0;
function check(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  passed++;
}

const park = {
  slug: 'phantasialand',
  name: 'Phantasialand',
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
  timezone: 'Europe/Berlin',
};
// 2026-11-05 12:00 in Brühl.
const now = Date.parse('2026-11-05T11:00:00Z');
const at = (date) => ({
  parkSlug: park.slug,
  parkName: park.name,
  geo: park.geo,
  timezone: park.timezone,
  date,
});
const ride = (state, date, slug, startMinute) =>
  addEntry(state, { ...at(date), attractionSlug: slug, attractionName: slug, startMinute }, now);

// --- The snapshot ---
check(assistantPlannerSnapshot(EMPTY_PLANNER_STATE, now), undefined, 'an empty plan sends nothing');

let state = ride(EMPTY_PLANNER_STATE, '2026-11-04', 'taron', 600);
check(assistantPlannerSnapshot(state, now), undefined, 'yesterday is not sent');

state = ride(state, '2026-11-07', 'taron', 600);
state = addCustomEntry(
  state,
  { ...at('2026-11-07'), label: 'Mittag', icon: 'food', startMinute: 750, durationMinutes: 45 },
  now
);
state = addShowEntry(state, {
  ...at('2026-11-07'),
  showSlug: 'fantissima',
  showName: 'Fantissima',
  startMinute: 1530,
});
state = ride(state, '2026-11-05', 'black-mamba', 540);
state = setDayPrefs(state, park.slug, '2026-11-05', { riderHeightCm: 120, avoidWet: true });
state = { ...state, activeParkSlug: park.slug, activeDate: '2026-11-07' };
const snap = assistantPlannerSnapshot(state, now);
check(snap.active, { park: 'phantasialand', date: '2026-11-07' }, 'the active day');
check(
  snap.days.map((d) => d.date),
  ['2026-11-05', '2026-11-07'],
  'today and later, nearest first'
);
check(snap.days[0].prefs, { riderHeightCm: 120, avoidWet: true }, 'the day prefs ride along');
check(
  snap.days[1].entries,
  [
    { id: 'taron-1', kind: 'ride', name: 'taron', rideSlug: 'taron', start: '10:00' },
    { id: 'block-1', kind: 'block', name: 'Mittag', start: '12:30', durationMinutes: 45 },
    {
      id: 'show-fantissima-1',
      kind: 'show',
      name: 'Fantissima',
      start: '01:30',
      durationMinutes: 30,
    },
  ],
  'entries in plan order, with the start the planner prints (past midnight folded like the grid)'
);

let many = EMPTY_PLANNER_STATE;
for (let i = 0; i < 9; i++) many = ride(many, `2026-11-${String(10 + i)}`, 'taron', 600);
for (let i = 0; i < 45; i++) many = ride(many, '2026-11-10', `r${i}`, 600 + i);
const capped = assistantPlannerSnapshot(many, now);
check(capped.days.length, SNAPSHOT_MAX_DAYS, 'at most six days');
check(capped.days[0].date, '2026-11-10', 'the nearest kept');
check(capped.days[0].entries.length, SNAPSHOT_MAX_ENTRIES, 'at most forty entries a day');
check(capped.active, undefined, 'no active day, no field');
check(
  assistantPlannerSnapshot(reserveDays(EMPTY_PLANNER_STATE, [{ park, date: '2026-11-20' }]), now)
    .days[0].entries,
  [],
  'a reserved day counts though empty'
);

// --- Reorder ---
let day = ride(EMPTY_PLANNER_STATE, '2026-11-07', 'a', 600);
day = ride(day, '2026-11-07', 'b', 660);
day = ride(day, '2026-11-07', 'c', 720);
const moved = moveEntryToIndex(day, park.slug, '2026-11-07', 'c-1', 0);
check(
  entriesFor(moved, park.slug, '2026-11-07').map((e) => [e.id, e.startMinute]),
  [
    ['c-1', 600],
    ['a-1', 660],
    ['b-1', 720],
  ],
  'a move takes the slots in the new order'
);
check(moveEntryToIndex(day, park.slug, '2026-11-07', 'a-1', 0), day, 'the same place is no write');
check(moveEntryToIndex(day, park.slug, '2026-11-07', 'nope', 1), day, 'an unknown id is ignored');

// --- Parky's undo ---
rememberDayForUndo(day, park.slug, '2026-11-07');
const removed = removeEntry(day, park.slug, '2026-11-07', 'b-1');
check(hasParkyUndo(park.slug, '2026-11-07'), true, 'a change leaves an undo');
const undone = undoParkyChange(removed, park, '2026-11-07');
check(
  entriesFor(undone, park.slug, '2026-11-07').map((e) => e.id),
  ['a-1', 'b-1', 'c-1'],
  'undo puts the day back'
);
check(hasParkyUndo(park.slug, '2026-11-07'), false, 'and is used up');
check(undoParkyChange(undone, park, '2026-11-07'), undone, 'a second undo does nothing');
rememberDayForUndo(EMPTY_PLANNER_STATE, park.slug, '2026-11-08');
const reserved = reserveDays(EMPTY_PLANNER_STATE, [{ park, date: '2026-11-08' }]);
check(
  undoParkyChange(reserved, park, '2026-11-08').parks[park.slug],
  undefined,
  'undo drops a day that did not exist'
);

// --- The actions ---
const date = '2026-11-07';
check(
  readAssistantAction({
    type: 'planner_remove',
    park,
    date,
    entryIds: ['taron-1', 7, '../x', 'taron-1'],
    extra: 1,
  }),
  { type: 'planner_remove', park, date, entryIds: ['taron-1'] },
  'remove: ids that are no ids are dropped, nothing rides along'
);
check(
  readAssistantAction({ type: 'planner_remove', park, date, entryIds: [] }),
  null,
  'remove: no ids, no action'
);
check(
  readAssistantAction({ type: 'planner_remove', park, date: '7.11.', entryIds: ['a-1'] }),
  null,
  'remove: a date'
);
check(
  readAssistantAction({ type: 'planner_move', park, date, entryId: 'a-1', toIndex: 2 }),
  { type: 'planner_move', park, date, entryId: 'a-1', toIndex: 2 },
  'move'
);
check(
  readAssistantAction({ type: 'planner_move', park, date, entryId: 'a-1', toIndex: -1 }),
  null,
  'move: a negative index'
);
check(
  readAssistantAction({ type: 'planner_move', park, date, entryId: 'a-1', toIndex: 1.5 }),
  null,
  'move: a fraction'
);
check(
  readAssistantAction({
    type: 'planner_update_block',
    park,
    date,
    entryId: 'block-1',
    label: ' Pause ',
    start: '25:00',
    durationMinutes: 30,
  }),
  {
    type: 'planner_update_block',
    park,
    date,
    entryId: 'block-1',
    label: 'Pause',
    durationMinutes: 30,
  },
  'update block: a bad start is left out, the rest kept'
);
check(
  readAssistantAction({
    type: 'planner_update_block',
    park,
    date,
    entryId: 'block-1',
    start: 'noon',
  }),
  null,
  'update block: nothing valid to change'
);
check(
  readAssistantAction({
    type: 'planner_add_show',
    park,
    date,
    showSlug: 'fantissima',
    start: '14:30',
  }),
  { type: 'planner_add_show', park, date, showSlug: 'fantissima', start: '14:30' },
  'add show'
);
check(
  readAssistantAction({
    type: 'planner_add_show',
    park,
    date,
    showSlug: 'fantissima',
    start: '2:30',
  }),
  null,
  'add show: HH:MM only'
);
check(
  readAssistantAction({
    type: 'planner_set_prefs',
    park,
    date,
    prefs: { riderHeightCm: 120, avoidWet: 'yes', earlyEntry: false },
  }),
  { type: 'planner_set_prefs', park, date, prefs: { riderHeightCm: 120, earlyEntry: false } },
  'set prefs: an invalid answer is left out'
);
check(
  readAssistantAction({ type: 'planner_set_prefs', park, date, prefs: { riderHeightCm: 20 } }),
  null,
  'set prefs: out of range'
);
check(
  readAssistantAction({ type: 'planner_mark_done', park, date, entryIds: ['a-1'], done: true }),
  { type: 'planner_mark_done', park, date, entryIds: ['a-1'], done: true },
  'mark done'
);
check(
  readAssistantAction({ type: 'planner_mark_done', park, date, entryIds: ['a-1'] }),
  null,
  'mark done: done is required'
);
check(
  readAssistantAction({ type: 'planner_clear_day', park, date, x: 1 }),
  { type: 'planner_clear_day', park, date },
  'clear day'
);
check(
  readAssistantAction({ type: 'planner_undo', park, date }),
  { type: 'planner_undo', park, date },
  'undo'
);
check(
  readAssistantAction({ type: 'planner_undo', park: { ...park, timezone: 'Mars/Base' }, date }),
  null,
  'undo: the park is checked'
);
check(
  readAssistantAction({
    type: 'planner_reserve_days',
    park,
    dates: ['2026-11-08', 'soon', '2026-11-08'],
  }),
  { type: 'planner_reserve_days', park, dates: ['2026-11-08'] },
  'reserve days'
);
check(
  readAssistantAction({ type: 'planner_reserve_days', park, dates: [] }),
  null,
  'reserve days: none'
);
check(
  readAssistantAction({ type: 'planner_share', url: 'https://evil.example' }),
  { type: 'planner_share' },
  'share carries nothing'
);

// --- Reminders: the snapshot ---
check(assistantAlertsSnapshot('unavailable', [], []), undefined, 'no push, nothing set: no field');
check(
  assistantAlertsSnapshot('needs-permission', [], []),
  { push: 'needs-permission', rides: [], shows: [] },
  'push in reach is sent though nothing is set'
);
const names = { parkSlug: 'phantasialand', slug: 'taron', name: 'Taron' };
check(
  assistantAlertsSnapshot(
    'unavailable',
    [
      { attractionId: 'a', thresholdMinutes: 20, ...names },
      { attractionId: 'b', thresholdMinutes: null, kind: 'reopen', ...names, slug: 'raik' },
      { attractionId: 'c', thresholdMinutes: 10 },
    ],
    [
      {
        showId: 's',
        startTime: '2026-11-05T13:30:00.000Z',
        parkSlug: 'phantasialand',
        slug: 'fantissima',
        name: 'Fantissima',
        timezone: 'Europe/Berlin',
      },
      {
        showId: 't',
        startTime: null,
        parkSlug: 'phantasialand',
        slug: 'ice-college',
        name: 'Ice College',
      },
    ]
  ),
  {
    push: 'unavailable',
    rides: [
      {
        park: 'phantasialand',
        rideSlug: 'taron',
        name: 'Taron',
        kind: 'wait_below',
        thresholdMinutes: 20,
      },
      { park: 'phantasialand', rideSlug: 'raik', name: 'Taron', kind: 'reopen' },
    ],
    shows: [
      { park: 'phantasialand', showSlug: 'fantissima', name: 'Fantissima', start: '14:30' },
      { park: 'phantasialand', showSlug: 'ice-college', name: 'Ice College' },
    ],
  },
  'set reminders are sent even without push; an entry without names is left out; a pin reads in the park clock'
);
check(
  assistantAlertsSnapshot(
    'ready',
    Array.from({ length: 40 }, (_, i) => ({
      attractionId: `a${i}`,
      thresholdMinutes: 5,
      ...names,
    })),
    []
  ).rides.length,
  ALERTS_SNAPSHOT_MAX,
  'at most thirty rides'
);

// --- Reminders: resolving slugs ---
const planDay = {
  timezone: 'Europe/Berlin',
  rides: [{ attractionSlug: 'taron', attractionName: 'Taron', attractionId: 'uuid-taron' }],
  shows: [
    {
      showSlug: 'fantissima',
      showName: 'Fantissima',
      showId: 'uuid-show',
      times: ['11:00', '15:00'],
      source: 'listed',
    },
  ],
};
check(
  rideTarget(planDay, 'taron', 15),
  { kind: 'ride', attractionId: 'uuid-taron', name: 'Taron', thresholdMinutes: 15 },
  'a ride resolves to its id'
);
check(rideTarget(planDay, 'raik', null), null, 'a ride the day does not have');
check(
  showTarget(planDay, 'fantissima', '15:00', now),
  {
    kind: 'show',
    showId: 'uuid-show',
    name: 'Fantissima',
    startTime: '2026-11-05T14:00:00.000Z',
    start: '15:00',
  },
  "a performance today, as the instant in the park's zone"
);
check(showTarget(planDay, 'fantissima', '11:00', now), null, 'a performance already over');
check(showTarget(planDay, 'fantissima', '16:00', now), null, 'a time the day does not list');

// --- Reminders: the actions ---
check(
  readAssistantAction({
    type: 'alert_ride_set',
    park,
    rideSlug: 'taron',
    rideName: 'Taron',
    kind: 'wait_below',
    thresholdMinutes: 15,
    x: 1,
  }),
  {
    type: 'alert_ride_set',
    park,
    rideSlug: 'taron',
    rideName: 'Taron',
    kind: 'wait_below',
    thresholdMinutes: 15,
  },
  'ride alert'
);
check(
  readAssistantAction({
    type: 'alert_ride_set',
    park,
    rideSlug: 'taron',
    rideName: 'Taron',
    kind: 'reopen',
    thresholdMinutes: 15,
  }),
  { type: 'alert_ride_set', park, rideSlug: 'taron', rideName: 'Taron', kind: 'reopen' },
  'a reopen alert carries no threshold'
);
check(
  readAssistantAction({
    type: 'alert_ride_set',
    park,
    rideSlug: 'taron',
    rideName: 'Taron',
    kind: 'wait_below',
    thresholdMinutes: 500,
  }),
  null,
  'a threshold the API refuses'
);
check(
  readAssistantAction({
    type: 'alert_ride_set',
    park,
    rideSlug: 'taron',
    rideName: 'Taron',
    kind: 'soon',
  }),
  null,
  'an unknown kind'
);
check(
  readAssistantAction({
    type: 'alert_show_set',
    park,
    showSlug: 'fantissima',
    showName: 'Fantissima',
    start: '15:00',
  }),
  { type: 'alert_show_set', park, showSlug: 'fantissima', showName: 'Fantissima', start: '15:00' },
  'show reminder'
);
check(
  readAssistantAction({
    type: 'alert_show_set',
    park,
    showSlug: 'fantissima',
    showName: '',
    start: '15:00',
  }),
  null,
  'a show without a name'
);
check(
  readAssistantAction({ type: 'alert_remove', park, rideSlug: 'taron', showSlug: '<b>' }),
  { type: 'alert_remove', park, rideSlug: 'taron' },
  'remove: a bad slug is left out'
);
check(readAssistantAction({ type: 'alert_remove', park }), null, 'remove: nothing named');

console.log(`assistant context: ${passed} checks passed`);
