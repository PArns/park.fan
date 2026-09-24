// Tests for "What now?" without a plan (`lib/planner/next-best-ride.ts`, PAR-419).
//
// Three real parks, captured from the API on 2026-09-24 at 09:29 UTC (11:29 in both zones):
// Phantasialand (large, 33 forecast curves), Bobbejaanland (small, 15) and Hansa-Park, whose
// wait times we cannot read (`in_park_app_only`, no forecast). Then synthetic rows for the rules
// a live park does not happen to exercise on the day it was captured.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  NEXT_RIDE_LIMIT,
  NEXT_RIDE_MIN_SAVING_MIN,
  suggestNextRides,
  walkMinutesFrom,
} from '../lib/planner/next-best-ride.ts';

const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/next-best-ride/${name}.json`, import.meta.url), 'utf8')
  );

const NOW = 11 * 60 + 29;
let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`✅ ${name}`);
};

test('large park: three suggestions, biggest measured gap first', () => {
  const { day, nearby } = fixture('phantasialand');
  const out = suggestNextRides({ rides: nearby, day, nowMinute: NOW });
  assert.equal(out.length, NEXT_RIDE_LIMIT);
  // Maus au Chocolat: 5 min live, 30 min forecast for 13:00.
  assert.deepEqual(
    { slug: out[0].slug, now: out[0].waitNow, hour: out[0].laterHour, later: out[0].laterWait },
    { slug: 'maus-au-chocolat', now: 5, hour: 13, later: 30 }
  );
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i - 1].saving >= out[i].saving, 'sorted by saving');
  }
  for (const s of out) {
    assert.equal(s.saving, s.laterWait - s.waitNow);
    assert.ok(s.saving >= NEXT_RIDE_MIN_SAVING_MIN);
    assert.ok(s.laterHour * 60 >= NOW + s.walkMin, 'later starts after the walk');
    assert.ok(s.laterHour < day.context.closeHour, 'never the closing hour');
  }
});

test('large park: not the shortest queue', () => {
  const { day, nearby } = fixture('phantasialand');
  const out = suggestNextRides({ rides: nearby, day, nowMinute: NOW });
  const shortest = nearby
    .filter((r) => r.status === 'OPERATING' && typeof r.waitTime === 'number')
    .sort((a, b) => a.waitTime - b.waitTime || a.distance - b.distance)
    .slice(0, NEXT_RIDE_LIMIT)
    .map((r) => r.slug);
  assert.notDeepEqual(
    out.map((s) => s.slug),
    shortest
  );
});

test('large park: a rider height from the planner drops rides the party cannot take', () => {
  const { day, nearby } = fixture('phantasialand');
  const tall = day.rides.filter((r) => (r.minimumHeight ?? 0) > 120).map((r) => r.attractionSlug);
  assert.ok(tall.length > 0, 'the fixture has height limits above 120 cm');
  const out = suggestNextRides({ rides: nearby, day, nowMinute: NOW, riderHeightCm: 120 });
  assert.ok(out.length > 0);
  for (const s of out) assert.ok(!tall.includes(s.slug), `${s.slug} needs more than 120 cm`);
});

test('small park: only gaps of at least 10 minutes', () => {
  const { day, nearby } = fixture('bobbejaanland');
  const out = suggestNextRides({ rides: nearby, day, nowMinute: NOW });
  // On the captured morning every queue but Fury's was forecast to rise by one step at most.
  assert.deepEqual(
    out.map((s) => [s.slug, s.waitNow, s.laterHour, s.laterWait]),
    [['fury', 5, 13, 15]]
  );
});

test('park we cannot read: no suggestion', () => {
  const { day, nearby } = fixture('hansa-park');
  assert.equal(day.context.liveWaitTimes.available, false);
  assert.deepEqual(suggestNextRides({ rides: nearby, day, nowMinute: NOW }), []);
  // Even with rows and a curve, the curated flag wins.
  const { day: phl, nearby: phlRides } = fixture('phantasialand');
  assert.deepEqual(
    suggestNextRides({
      rides: phlRides,
      day: { ...phl, context: { ...phl.context, liveWaitTimes: day.context.liveWaitTimes } },
      nowMinute: NOW,
    }),
    []
  );
});

test('no forecast: no suggestion', () => {
  const { nearby } = fixture('phantasialand');
  assert.deepEqual(suggestNextRides({ rides: nearby, day: null, nowMinute: NOW }), []);
  assert.deepEqual(
    suggestNextRides({
      rides: nearby,
      day: { rides: [], context: { closeHour: null, openHour: null } },
      nowMinute: NOW,
    }),
    []
  );
});

const curve = (slug, hours, extra = {}) => ({
  attractionSlug: slug,
  attractionName: slug,
  hours: hours.map(([hour, wait]) => ({ hour, wait })),
  ...extra,
});
const row = (slug, waitTime, extra = {}) => ({
  slug,
  name: slug,
  distance: 100,
  waitTime,
  status: 'OPERATING',
  ...extra,
});
const DAY = {
  context: { openHour: 9, closeHour: 18, liveWaitTimes: { available: true } },
  rides: [
    curve('a', [
      [12, 20],
      [13, 50],
    ]),
    curve('b', [
      [12, 20],
      [13, 50],
    ]),
    curve('c', [
      [12, 20],
      [13, 50],
    ]),
    curve('d', [
      [12, 20],
      [13, 50],
    ]),
  ],
};

test('closed, down, out of season and rows without a wait drop out; null season stays', () => {
  const out = suggestNextRides({
    rides: [
      row('a', 20, { status: 'CLOSED' }),
      row('b', 20, { status: 'DOWN' }),
      row('c', 20, { isCurrentlyInSeason: false }),
      row('d', null),
    ],
    day: DAY,
    nowMinute: NOW,
  });
  assert.deepEqual(out, []);
  const kept = suggestNextRides({
    rides: [
      row('a', 20, { isCurrentlyInSeason: null }),
      row('b', 20, { isCurrentlyInSeason: true }),
    ],
    day: DAY,
    nowMinute: NOW,
  });
  assert.deepEqual(
    kept.map((s) => s.slug),
    ['a', 'b']
  );
});

test('a ride whose live wait is above its forecast is no suggestion', () => {
  const out = suggestNextRides({ rides: [row('a', 60)], day: DAY, nowMinute: NOW });
  assert.deepEqual(out, []);
});

test('the peak must start after the walk, inside two hours, before the closing hour', () => {
  // 1000 m → ceil(1000 × 1.6 / 67) = 24 min: arrival 12:53, so 12:00 is gone and 13:00 counts.
  assert.equal(walkMinutesFrom(1000), 24);
  const far = suggestNextRides({
    rides: [row('a', 20, { distance: 1000 })],
    day: DAY,
    nowMinute: 12 * 60 + 29,
  });
  assert.deepEqual(
    far.map((s) => [s.laterHour, s.walkMin]),
    [[13, 24]]
  );
  // At 12:40 a 24-minute walk arrives at 13:04, after the only rising hour began.
  assert.deepEqual(
    suggestNextRides({
      rides: [row('a', 20, { distance: 1000 })],
      day: DAY,
      nowMinute: 12 * 60 + 40,
    }),
    []
  );
  // Past the look-ahead: at 10:00 the 13:00 hour is three hours away.
  assert.deepEqual(suggestNextRides({ rides: [row('a', 20)], day: DAY, nowMinute: 10 * 60 }), []);
  // The closing hour itself is never "later".
  assert.deepEqual(
    suggestNextRides({
      rides: [row('a', 20)],
      day: { ...DAY, context: { ...DAY.context, closeHour: 13 } },
      nowMinute: NOW,
    }),
    []
  );
});

test('a day that runs past midnight is read on one axis', () => {
  // Open 16:00, closes in the 01:00 hour: 22:00 and 23:00 are evening hours, not after the close.
  const late = {
    context: { openHour: 16, closeHour: 1, liveWaitTimes: { available: true } },
    rides: [
      curve('a', [
        [21, 20],
        [22, 45],
        [23, 30],
        [0, 60],
        [1, 70],
      ]),
    ],
  };
  const evening = suggestNextRides({ rides: [row('a', 20)], day: late, nowMinute: 21 * 60 + 10 });
  assert.deepEqual(
    evening.map((s) => [s.laterHour, s.laterWait]),
    [[22, 45]]
  );
  // At 23:10 midnight is inside the look-ahead; the 01:00 hour is the closing hour and is not.
  const beforeMidnight = suggestNextRides({
    rides: [row('a', 20)],
    day: late,
    nowMinute: 23 * 60 + 10,
  });
  assert.deepEqual(
    beforeMidnight.map((s) => [s.laterHour, s.laterWait]),
    [[0, 60]]
  );
  // After midnight the clock is on the same axis: at 00:10 only the closing hour is ahead.
  assert.deepEqual(suggestNextRides({ rides: [row('a', 20)], day: late, nowMinute: 10 }), []);
});

test('equal gaps: the shorter walk first, at most three', () => {
  const out = suggestNextRides({
    rides: [
      row('a', 20, { distance: 600 }),
      row('b', 20, { distance: 100 }),
      row('c', 20, { distance: 300 }),
      row('d', 20, { distance: 200 }),
    ],
    day: DAY,
    nowMinute: NOW,
  });
  assert.deepEqual(
    out.map((s) => s.slug),
    ['b', 'd', 'c']
  );
});

console.log(`\n${passed} passed`);
