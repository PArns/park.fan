/**
 * What Parky reads of this browser with each question and what it may change there: the plan
 * snapshot and Parky's undo (`lib/assistant/planner-context.ts`), the planner edits it may send
 * (`lib/assistant/actions.ts`) and the reorder they write (`moveEntryToIndex`).
 */

import assert from 'node:assert/strict';
import { readAssistantAction } from '@/lib/assistant/actions.ts';
import {
  assistantPlannerSnapshot,
  rememberParkyChange,
  SNAPSHOT_MAX_DAYS,
  SNAPSHOT_MAX_ENTRIES,
  undoParkyChange,
} from '@/lib/assistant/planner-context.ts';
import {
  addCustomEntry,
  addEntry,
  addShowEntry,
  clearDay,
  moveEntryToIndex,
  openDay,
  removeEntry,
  reserveDays,
  setDayPrefs,
  setEntryDone,
} from '@/lib/planner/actions.ts';
import { EMPTY_PLANNER_STATE, entriesFor } from '@/lib/planner/types.ts';
import {
  ALERTS_SNAPSHOT_MAX,
  alertTarget,
  assistantAlertsSnapshot,
  removalOutcome,
} from '@/lib/assistant/alerts-context.ts';
import {
  breakMinutesFrom,
  CHAT_ENDED_CODE,
  DEFAULT_BREAK_MINUTES,
  isChatEnded,
  MAX_BREAK_MINUTES,
  readBreakUntil,
  startBreak,
} from '@/lib/assistant/chat-end.ts';
import {
  assistantFavoritesSnapshot,
  assistantRiddenSnapshot,
  FAVORITES_SNAPSHOT_MAX,
  RIDDEN_SNAPSHOT_MAX,
} from '@/lib/assistant/favorites-context.ts';

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
    {
      id: 'taron-1',
      kind: 'ride',
      name: 'taron',
      rideSlug: 'taron',
      start: '10:00',
      startMinute: 600,
    },
    {
      id: 'block-1',
      kind: 'block',
      name: 'Mittag',
      start: '12:30',
      startMinute: 750,
      durationMinutes: 45,
    },
    {
      id: 'show-fantissima-1',
      kind: 'show',
      name: 'Fantissima',
      showSlug: 'fantissima',
      start: '01:30',
      startMinute: 1530,
      durationMinutes: 30,
    },
  ],
  'entries in plan order, with the start the planner prints and its own minute past midnight'
);

let many = EMPTY_PLANNER_STATE;
for (let i = 0; i < 9; i++) many = ride(many, `2026-11-${String(10 + i)}`, 'taron', 600);
for (let i = 0; i < 45; i++) many = ride(many, '2026-11-10', `r${i}`, 600 + i);
const capped = assistantPlannerSnapshot(many, now);
check(capped.days.length, SNAPSHOT_MAX_DAYS, 'at most eight days in full');
check(capped.days[0].date, '2026-11-10', 'the nearest kept');
check(capped.days[0].entries.length, SNAPSHOT_MAX_ENTRIES, 'at most forty entries a day');
check(capped.active, undefined, 'no active day, no field');
check(
  capped.more,
  [{ park: { slug: park.slug, name: park.name }, date: '2026-11-18', entries: 1 }],
  'every other planned day by park and date'
);
const farActive = assistantPlannerSnapshot(
  { ...many, activeParkSlug: park.slug, activeDate: '2026-11-18' },
  now
);
check(
  farActive.days.map((d) => d.date).includes('2026-11-18') &&
    farActive.days.length === SNAPSHOT_MAX_DAYS &&
    farActive.more.map((d) => d.date),
  ['2026-11-17'],
  'the day open in the planner always in full, the nearest after it'
);
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
const undoDate = '2026-11-07';
const removed = removeEntry(day, park.slug, undoDate, 'b-1');
rememberParkyChange(day, removed, park.slug, undoDate);
const undone = undoParkyChange(removed, park, undoDate);
check(undone.outcome, 'undone', 'an untouched day is put back');
check(
  entriesFor(undone.state, park.slug, undoDate).map((e) => e.id),
  ['a-1', 'b-1', 'c-1'],
  'with what Parky removed'
);
check(
  undoParkyChange(undone.state, park, undoDate),
  { state: undone.state, outcome: 'none' },
  'and the change is used up'
);

rememberParkyChange(day, removed, park.slug, undoDate);
const edited = ride(removed, undoDate, 'd', 900);
check(
  undoParkyChange(edited, park, undoDate),
  { state: edited, outcome: 'changed' },
  "the visitor's own edit since is never undone"
);
check(undoParkyChange(edited, park, undoDate).outcome, 'none', 'nor tried again');

const ticked = setEntryDone(removed, park.slug, undoDate, 'a-1', true);
rememberParkyChange(day, removed, park.slug, undoDate);
check(undoParkyChange(ticked, park, undoDate).outcome, 'changed', 'a tick is an edit too');

const reserved = reserveDays(EMPTY_PLANNER_STATE, [{ park, date: '2026-11-08' }]);
rememberParkyChange(EMPTY_PLANNER_STATE, reserved, park.slug, '2026-11-08');
// Opening the date files an empty day, which reads as no change.
const reopened = openDay(reserved, park, '2026-11-08');
check(
  undoParkyChange(reopened, park, '2026-11-08').state.parks[park.slug],
  undefined,
  'undo drops a day that did not exist'
);
const cleared = clearDay(day, park.slug, undoDate);
rememberParkyChange(day, cleared, park.slug, undoDate);
check(
  undoParkyChange(openDay(cleared, park, undoDate), park, undoDate).outcome,
  'undone',
  'a cleared day shown again empty still undoes'
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
const epcot = {
  slug: 'epcot',
  name: 'EPCOT',
  geo: { continent: 'north-america', country: 'united-states', city: 'orlando' },
  timezone: 'America/New_York',
};
check(
  readAssistantAction({
    type: 'planner_reserve_trip',
    days: [
      { park: epcot, date: '2027-03-04', extra: 1 },
      { park, date: '2027-03-05' },
      { park: epcot, date: '2027-03-04' },
      { park: { ...epcot, timezone: 'Mars/Base' }, date: '2027-03-06' },
      { park: epcot, date: 'soon' },
    ],
    url: 'https://evil.example',
  }),
  {
    type: 'planner_reserve_trip',
    days: [
      { park: epcot, date: '2027-03-04' },
      { park, date: '2027-03-05' },
    ],
  },
  'reserve trip: each park checked, each park and day once, nothing riding along'
);
check(
  readAssistantAction({ type: 'planner_reserve_trip', days: [{ park: epcot, date: 'x' }] }),
  null,
  'reserve trip: none left'
);
check(
  readAssistantAction({
    type: 'planner_reserve_trip',
    days: Array.from({ length: 20 }, (_, i) => ({
      park: epcot,
      date: `2027-03-${String(i + 1).padStart(2, '0')}`,
    })),
  })?.days.length,
  16,
  'reserve trip: at most the visits a plan places'
);
{
  const trip = reserveDays(EMPTY_PLANNER_STATE, [
    { park: epcot, date: '2027-03-04' },
    { park, date: '2027-03-05' },
  ]);
  check(
    [
      trip.parks.epcot?.days['2027-03-04']?.reserved,
      trip.parks.phantasialand?.days['2027-03-05']?.reserved,
    ],
    [true, true],
    'reserve trip: one write files the days of several parks'
  );
}
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
    Array.from({ length: 120 }, (_, i) => ({
      attractionId: `a${i}`,
      thresholdMinutes: 5,
      ...names,
    })),
    []
  ).rides.length,
  ALERTS_SNAPSHOT_MAX,
  'at most a hundred rides'
);

// --- Reminders: the actions and what they write ---
const rideId = '1a2b3c4d-1111-4222-8333-444455556666';
const showId = '9f8e7d6c-1111-4222-8333-444455556666';
const rideSet = {
  type: 'alert_ride_set',
  park,
  rideId,
  rideSlug: 'taron',
  rideName: 'Taron',
  kind: 'wait_below',
  thresholdMinutes: 15,
};
check(readAssistantAction({ ...rideSet, x: 1 }), rideSet, 'ride alert, nothing rides along');
check(
  alertTarget(rideSet),
  { kind: 'ride', attractionId: rideId, name: 'Taron', thresholdMinutes: 15 },
  'a wait alert writes its threshold'
);
const reopen = readAssistantAction({ ...rideSet, kind: 'reopen' });
check(
  reopen,
  { type: 'alert_ride_set', park, rideId, rideSlug: 'taron', rideName: 'Taron', kind: 'reopen' },
  'a reopen alert carries no threshold'
);
check(alertTarget(reopen).thresholdMinutes, null, 'and writes none');
check(
  readAssistantAction({ ...rideSet, thresholdMinutes: 241 }),
  null,
  'a threshold the API refuses'
);
check(
  readAssistantAction({ ...rideSet, thresholdMinutes: undefined }),
  null,
  'a wait alert needs one'
);
check(readAssistantAction({ ...rideSet, kind: 'soon' }), null, 'an unknown kind');
check(readAssistantAction({ ...rideSet, rideId: 'taron' }), null, 'a ride id that is no UUID');
check(
  readAssistantAction({ ...rideSet, park: 'phantasialand' }),
  null,
  'the park is the planner park'
);
const showSet = {
  type: 'alert_show_set',
  park,
  showId,
  showSlug: 'fantissima',
  showName: 'Fantissima',
  start: '2026-11-05T15:00:00+01:00',
};
check(readAssistantAction(showSet), showSet, 'show reminder');
check(
  alertTarget(showSet, now),
  {
    kind: 'show',
    showId,
    name: 'Fantissima',
    startTime: '2026-11-05T15:00:00+01:00',
    start: '15:00',
  },
  "the instant as sent, printed in the park's clock"
);
check(
  alertTarget({ ...showSet, start: '2026-11-05T11:00:00+01:00' }, now),
  null,
  'a performance already over'
);
check(
  readAssistantAction({ ...showSet, start: '15:00' }),
  null,
  'start is an instant, not a clock'
);
check(readAssistantAction({ ...showSet, showName: '' }), null, 'a show without a name');
check(
  readAssistantAction({ type: 'alert_remove', park, rideSlug: 'taron' }),
  { type: 'alert_remove', park, rideSlug: 'taron' },
  'remove a ride alert'
);
check(
  readAssistantAction({ type: 'alert_remove', park, showSlug: 'fantissima', rideSlug: '<b>' }),
  { type: 'alert_remove', park, showSlug: 'fantissima' },
  'remove a show reminder; a slug that is none does not count'
);
check(
  readAssistantAction({ type: 'alert_remove', park, rideSlug: 'taron', showSlug: 'fantissima' }),
  null,
  'remove: exactly one'
);
check(readAssistantAction({ type: 'alert_remove', park }), null, 'remove: nothing named');
check(removalOutcome({ ok: true, value: undefined }), 'alertRemoved', 'a removal shows its chip');
check(
  removalOutcome({ ok: false, error: { reason: 'rate-limited', retryAfterSeconds: 30 } }),
  { failed: { reason: 'rate-limited', retryAfterSeconds: 30 } },
  'a failed removal carries its failure, the wait included'
);
check(removalOutcome(null), null, 'nothing to remove, nothing shown');

// --- Favourites ---
const noFavorites = { parks: [], attractions: [], shows: [], restaurants: [] };
check(assistantFavoritesSnapshot(noFavorites), undefined, 'no favourites, no field');
const uuid = '0b6f2f1e-3c4d-4e5f-8a9b-0c1d2e3f4a5b';
const uuidN = (i) => `0b6f2f1e-3c4d-4e5f-8a9b-${String(i).padStart(12, '0')}`;
check(
  assistantFavoritesSnapshot({ ...noFavorites, attractions: [uuid, 'taron'] }),
  { ...noFavorites, attractions: [uuid] },
  'UUIDs as stored, anything else dropped'
);
check(
  assistantFavoritesSnapshot({ ...noFavorites, shows: ['old-slug'] }),
  undefined,
  'nothing but slugs is nothing'
);
check(
  assistantFavoritesSnapshot({
    ...noFavorites,
    parks: Array.from({ length: 60 }, (_, i) => uuidN(i)),
  }).parks.length,
  FAVORITES_SNAPSHOT_MAX,
  'at most fifty of a kind'
);
check(assistantRiddenSnapshot(new Set()), undefined, 'no ridden rides, no field');
check(
  assistantRiddenSnapshot(new Set([uuid, 'taron'])),
  [uuid],
  'ridden rides as UUIDs, anything else dropped'
);
{
  const many = new Set(Array.from({ length: RIDDEN_SNAPSHOT_MAX + 20 }, (_, i) => uuidN(i)));
  const sent = assistantRiddenSnapshot(many);
  check(sent.length, RIDDEN_SNAPSHOT_MAX, 'at most as many ridden rides as the API takes');
  check(sent.at(-1), uuidN(RIDDEN_SNAPSHOT_MAX + 19), 'the newest marks kept');
}
const favorite = { type: 'favorite_set', entity: 'attraction', id: uuid, name: 'Taron', on: true };
check(readAssistantAction({ ...favorite, x: 1 }), favorite, 'favourite, nothing rides along');
check(
  readAssistantAction({ ...favorite, entity: 'hotel' }),
  null,
  'an entity the site does not star'
);
check(
  readAssistantAction({ ...favorite, entity: undefined, kind: 'park' }),
  null,
  'the field is entity'
);
check(readAssistantAction({ ...favorite, id: 'taron' }), null, 'an id that is no UUID');
check(readAssistantAction({ ...favorite, on: 'yes' }), null, 'on must be a boolean');

// --- Parky's break ---
check(
  readAssistantAction({ type: 'chat_end', cooldownMinutes: 30, text: 'x' }),
  { type: 'chat_end', cooldownMinutes: 30 },
  'chat end'
);
check(readAssistantAction({ type: 'chat_end', cooldownMinutes: 0 }), null, 'chat end: no break');
check(
  readAssistantAction({ type: 'chat_end', cooldownMinutes: MAX_BREAK_MINUTES + 1 }),
  null,
  'chat end: longer than a day'
);
check(readAssistantAction({ type: 'chat_end' }), null, 'chat end: the length is required');
check(isChatEnded(CHAT_ENDED_CODE), true, 'the refusal code');
check(isChatEnded('off'), false, 'another code is not the break');
check(
  breakMinutesFrom({ code: 'chat_ended', cooldownMinutes: 12 }),
  12,
  "the refusal's own length"
);
check(breakMinutesFrom({ code: 'chat_ended' }, '90'), 2, 'Retry-After seconds, rounded up');
check(breakMinutesFrom(null, null), DEFAULT_BREAK_MINUTES, 'nothing said: the default');
check(breakMinutesFrom({ cooldownMinutes: 1e9 }), MAX_BREAK_MINUTES, 'capped at a day');

const memory = () => {
  const items = new Map();
  return {
    getItem: (k) => items.get(k) ?? null,
    setItem: (k, v) => items.set(k, String(v)),
    removeItem: (k) => items.delete(k),
  };
};
const tab = memory();
check(readBreakUntil(tab, now), null, 'no break');
const until = startBreak(tab, 10, now);
check(until, now + 10 * 60_000, 'a break ends after its minutes');
check(readBreakUntil(tab, now + 60_000), until, 'and is read back, as after a reload');
check(readBreakUntil(tab, until), null, 'over at its end');
check(readBreakUntil(tab, now), null, 'and forgotten once over');
const refusing = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
  removeItem() {},
};
check(startBreak(refusing, 5, now), now + 5 * 60_000, 'blocked storage still gives the end');
check(readBreakUntil(refusing, now), null, 'and reads as no break');

// --- The trip planner: the bridge, the remembered trip, Parky's change and its undo ---
const local = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (local.has(k) ? local.get(k) : null),
    setItem: (k, v) => local.set(k, String(v)),
    removeItem: (k) => local.delete(k),
  },
  sessionStorage: (() => {
    const tab = new Map();
    return {
      getItem: (k) => (tab.has(k) ? tab.get(k) : null),
      setItem: (k, v) => tab.set(k, String(v)),
      removeItem: (k) => tab.delete(k),
    };
  })(),
};
const { connectPlannerBridge, tripPlannerBridge } = await import(
  '@/lib/trip-regions/planner-bridge.ts'
);
const { cleanParty, forgetTrip, holdsTrip, rememberParty, rememberTrip, rememberedTrip } =
  await import('@/lib/trip-regions/remembered-trip.ts');
const { assistantTripsSnapshot, rememberTripChange, sameTripQuery, takeTripUndo } = await import(
  '@/lib/assistant/trip-context.ts'
);
const { readPlanQuery } = await import('@/lib/trip-regions/plan-query.ts');

check(holdsTrip(''), false, 'an untouched planner holds no trip');
check(holdsTrip('when=2027-06-01_2027-09-30&days=10'), true, 'a search is a trip worth keeping');
check(
  cleanParty({ size: 99, heightsCm: [105, 20, 'x', 132] }),
  { heightsCm: [105, 132] },
  'a party keeps a sensible count and heights only'
);
rememberTrip('orlando', '');
check(rememberedTrip('orlando'), null, 'a bare hub visit keeps nothing');
rememberTrip('orlando', 'from=2027-10-14&to=2027-10-21', 1);
rememberParty('orlando', { size: 4, heightsCm: [105] }, 2);
rememberTrip('orlando', '', 3);
check(
  rememberedTrip('orlando'),
  {
    region: 'orlando',
    query: 'from=2027-10-14&to=2027-10-21',
    party: { size: 4, heightsCm: [105] },
    updatedAt: 2,
  },
  'the trip and the party kept together; an empty planner never erases them'
);
local.set('parkfan_trip_orlando', '{"query":"<script>","party":"x"}');
check(rememberedTrip('orlando'), null, 'a hand-edited record costs only itself');
rememberTrip('orlando', 'from=2027-10-14&to=2027-10-21', 4);
rememberParty('orlando', { size: 4, heightsCm: [105] }, 5);

let tripState = readPlanQuery(new URLSearchParams('from=2027-10-14&to=2027-10-21'));
const writes = [];
let disconnect = connectPlannerBridge(
  'orlando',
  tripState,
  (recipe) => {
    tripState = recipe(tripState);
    writes.push(tripState);
  },
  undefined
);
check(
  tripPlannerBridge.current(),
  { region: 'orlando', query: 'from=2027-10-14&to=2027-10-21' },
  'the planner on screen publishes its query'
);
check(
  assistantTripsSnapshot(['orlando', 'japan']),
  [
    {
      region: 'orlando',
      query: 'from=2027-10-14&to=2027-10-21',
      onScreen: true,
      party: { size: 4, heightsCm: [105] },
    },
  ],
  'the trip on screen, with the party kept for it, once'
);
check(tripPlannerBridge.apply('japan', 'from=2027-04-01&to=2027-04-10'), false, 'another region is not on screen');

// Parky changes the trip on screen through the planner's own update.
const before = tripPlannerBridge.current().query;
rememberTripChange('orlando', before, 'from=2027-10-14&to=2027-10-21&lock=epcot@2027-10-15');
check(
  tripPlannerBridge.apply('orlando', 'from=2027-10-14&to=2027-10-21&lock=epcot@2027-10-15'),
  true,
  'the change goes through the planner on screen'
);
check(writes.at(-1).locks, [{ target: 'epcot', date: '2027-10-15' }], 'read back as the planner reads a link');
disconnect();
disconnect = connectPlannerBridge('orlando', tripState, (recipe) => (tripState = recipe(tripState)), undefined);
check(
  takeTripUndo('orlando'),
  { query: 'from=2027-10-14&to=2027-10-21' },
  "Parky's undo goes back while the trip is as he left it"
);
check(takeTripUndo('orlando'), 'none', 'and only once');
rememberTripChange('orlando', 'from=2027-10-14&to=2027-10-21', tripPlannerBridge.current().query);
disconnect();
tripState = readPlanQuery(new URLSearchParams('from=2027-10-16&to=2027-10-23'));
disconnect = connectPlannerBridge('orlando', tripState, () => undefined, undefined);
check(takeTripUndo('orlando'), 'changed', "the visitor's own change since is never undone");
disconnect();
check(tripPlannerBridge.current(), null, 'a planner that leaves the page disconnects');
check(sameTripQuery('to=2&from=1', 'from=1&to=2'), true, 'parameter order says nothing');
forgetTrip('orlando');
check(assistantTripsSnapshot(['orlando']), undefined, 'no trip, no field');

// --- The new actions, each checked and rebuilt ---
check(
  readAssistantAction({
    type: 'trip_set',
    region: 'orlando',
    query: 'from=2027-10-14&to=2027-10-21&tickets=wdw-date-based.4.h?',
    change: ['dates', 'bogus', 'dates'],
    extra: 'x',
  }),
  {
    type: 'trip_set',
    region: 'orlando',
    query: 'from=2027-10-14&to=2027-10-21&tickets=wdw-date-based.4.h?',
    change: ['dates'],
  },
  'a trip change: the query in the planner alphabet, known kinds once, nothing riding along'
);
check(
  readAssistantAction({ type: 'trip_set', region: 'orlando', query: 'from=<x>' }),
  null,
  'a query outside the planner alphabet is refused'
);
check(
  readAssistantAction({ type: 'trip_undo', region: 'Orlando!' }),
  null,
  'an undo names a region slug'
);
check(
  readAssistantAction({
    type: 'replies',
    replies: ['Next summer', 'next summer', '**bold**', 'see https://x.y', 'a'.repeat(41), 'Find the best dates', 'More', 'Even more'],
  }),
  { type: 'replies', replies: ['Next summer', 'Find the best dates', 'More', 'Even more'] },
  'replies: plain lines, each once, no link or Markdown, at most four'
);
check(readAssistantAction({ type: 'replies', replies: [] }), null, 'no reply, no chips');
check(
  readAssistantAction({
    type: 'planner_move',
    park,
    date: '2026-11-07',
    entryId: 'taron-1',
    start: '14:00',
  }),
  { type: 'planner_move', park, date: '2026-11-07', entryId: 'taron-1', start: '14:00' },
  'a move to a time'
);
check(
  readAssistantAction({
    type: 'planner_move',
    park,
    date: '2026-11-07',
    entryId: 'taron-1',
    toIndex: 0,
    start: '14:00',
  }),
  null,
  'never a place and a time at once'
);
check(
  readAssistantAction({
    type: 'planner_reserve_trip',
    days: [{ park, date: '2026-11-07' }],
    prefs: { riderHeightCm: 105, avoidWet: true },
  }),
  { type: 'planner_reserve_trip', days: [{ park, date: '2026-11-07' }], prefs: { riderHeightCm: 105 } },
  "a filed trip carries the smallest rider's height, nothing else"
);
check(
  readAssistantAction({
    type: 'interview_state',
    interview: {
      kind: 'trip',
      region: 'orlando',
      step: 'refine',
      answered: ['region', 'dates', 'parks', 'refine', 'nope'],
      skipped: [],
      mustDoRides: [{ park: 'epcot', rides: ['not-a-uuid'] }],
      source: 'elsewhere',
    },
    party: { size: 4, heightsCm: [105] },
    region: 'orlando',
  }),
  {
    type: 'interview_state',
    interview: {
      kind: 'trip',
      region: 'orlando',
      step: 'refine',
      answered: ['region', 'dates', 'parks'],
      skipped: [],
      mustDoRides: [{ park: 'epcot', rides: [] }],
      source: 'chat',
    },
    party: { size: 4, heightsCm: [105] },
    region: 'orlando',
  },
  "the interview's state rebuilt from what it may hold"
);
check(
  readAssistantAction({ type: 'interview_state', interview: { kind: 'day', step: 'parks' } }),
  null,
  "a step of the other kind's interview refuses the state"
);
check(
  readAssistantAction({ type: 'interview_state', interview: null, outcome: 'done' }),
  { type: 'interview_state', interview: null, outcome: 'done' },
  'an interview that is over'
);

// --- The interview's store and the planner button's first question ---
const { interviewStore, startInterview, takeInterviewKickoff } = await import(
  '@/lib/assistant/interview.ts'
);
startInterview({ kind: 'day', park: 'phantasialand', date: '2026-11-07' });
check(
  interviewStore.getSnapshot(),
  {
    kind: 'day',
    park: 'phantasialand',
    date: '2026-11-07',
    step: 'day',
    answered: [],
    skipped: [],
    mustDoRides: [],
    source: 'planner',
  },
  'the button sets the interview on its first step'
);
check(interviewStore.getSnapshot(), interviewStore.getSnapshot(), 'one snapshot between writes');
check(takeInterviewKickoff(), 'day', 'its first question waits for the window');
check(takeInterviewKickoff(), null, 'once');
interviewStore.set(null);
check(interviewStore.getSnapshot(), null, 'ended');

// --- A hub link as Parky writes it, in the reader's own segment ---
const { regionHubPath } = await import('@/lib/assistant/links.ts');
check(
  regionHubPath('/trip-regions/orlando?from=2027-10-14#planner', 'de'),
  '/orlando?from=2027-10-14#planner',
  "the route folder becomes the region's segment"
);
check(regionHubPath('/trip-regions/atlantis', 'de'), '/trip-regions/atlantis', 'an unknown region stays');
check(regionHubPath('/parks/europe', 'de'), '/parks/europe', 'any other path stays');

console.log(`assistant context: ${passed} checks passed`);
