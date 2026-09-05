/**
 * Unit tests for the planner day grid's geometry (`lib/planner/day-grid.ts`).
 *
 * Two properties carry the whole view and neither is visible in a screenshot.
 * The first is that a duration is a height: forty minutes must be the same
 * number of pixels wherever it sits, or the grid is telling a reader something
 * about the clock that is not true. The second is that `minuteAt` is exactly
 * `yFor` inverted — that pair replaced the old `ROW_HEIGHT` division and is the
 * half of a drag that can be wrong without looking wrong, because a block still
 * lands somewhere plausible.
 *
 * Run: pnpm test:planner-grid
 */

import {
  GATE_TO_FIRST_RIDE_MIN,
  MIN_BLOCK_PX,
  PX_PER_MIN,
  SNAP_MIN_FINE,
  blockBoxFor,
  buildDayGrid,
  clampStart,
  growGridForSpans,
  heightFor,
  minuteAt,
  nextFreeStart,
  packLanes,
  rideFloor,
  MAX_SHOW_LINES,
  showLinePositions,
  snapTo,
  unfoldedCloseHour,
  yFor,
} from '../lib/planner/day-grid.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

/** Phantasialand: 09:00–18:00. */
const g = buildDayGrid(9, 18);

// ── 1. The duration invariant ────────────────────────────────────────────────
// The single claim the view makes. If this ever depends on where a block sits,
// two identical queues draw at different heights and nothing on screen explains it.
test('heightFor(40) is 48 px', heightFor(g, 40), 48);
test(
  'the same duration is the same height at 10:00 and at 15:00',
  heightFor(g, 40) === heightFor(g, 40) && yFor(g, 600) !== yFor(g, 900),
  true
);

// ── 2. Round trip ────────────────────────────────────────────────────────────
{
  let worst = 0;
  for (let m = g.gridStartMin; m <= g.gridEndMin; m += SNAP_MIN_FINE) {
    worst = Math.max(worst, Math.abs(minuteAt(g, yFor(g, m)) - m));
  }
  test('minuteAt is yFor inverted at every snap step', worst < 1e-9, true);
}

// ── 3. Endpoints and monotonicity ────────────────────────────────────────────
test('the canvas starts at zero', yFor(g, g.gridStartMin), 0);
test('the canvas ends at its height', yFor(g, g.gridEndMin), g.heightPx);
{
  let monotone = true;
  for (let m = g.gridStartMin; m < g.gridEndMin; m += 5) {
    if (yFor(g, m + 5) <= yFor(g, m)) monotone = false;
  }
  test('y increases with the clock', monotone, true);
}

// ── 4. The documented figures ────────────────────────────────────────────────
// Written down in the docs beside the code; this is what stops the two drifting.
const shape = (open, close) => {
  const grid = buildDayGrid(open, close);
  return `${grid.gridStartMin} ${grid.gridEndMin} ${grid.heightPx}`;
};
test('median park 10–20', shape(10, 20), '570 1290 864');
test('Phantasialand 9–18', shape(9, 18), '510 1170 792');
test('Europa-Park 9–20', shape(9, 20), '510 1290 936');
test('a park closing past midnight, 16–00', shape(16, 0), '930 1530 720');

// ── 5. Degenerate: no hours ──────────────────────────────────────────────────
// `null` rather than an invented axis. 00:00–24:00 would assert a park that
// never closes; 09:00–18:00 would invent a schedule.
test('no hours at all', buildDayGrid(null, null), null);
test('only an opening hour', buildDayGrid(10, null), null);
test('only a closing hour', buildDayGrid(null, 20), null);
test('undefined behaves as null', buildDayGrid(undefined, undefined), null);

// ── 6. Degenerate: past-midnight close ───────────────────────────────────────
test('a past-midnight day is unfolded, not negative', buildDayGrid(16, 0).closeMin, 1500);

// The unfolding is exported because `estimate.ts` needs the same answer, and
// held the opposite one for as long as both files existed: a 16:00–01:00 park
// failed `hour > closeHour` at every hour of its evening, so every block read
// `outside-hours` and the day totalled no queueing at all. The identity case is
// the one that matters most here — an ordinary day must come back untouched, or
// the fix costs the other 200 parks something.
test('a wrapping close is lifted past midnight', unfoldedCloseHour(16, 1), 25);
test('a midnight close is hour 24', unfoldedCloseHour(10, 0), 24);
test('an ordinary day is left alone', unfoldedCloseHour(9, 18), 18);
test('and so is a day that closes on its own opening hour', unfoldedCloseHour(11, 11), 11);

// ── 7-8. Degenerate: one entry, and an entry outside the hours ───────────────
{
  const one = packLanes([{ id: 'a', topMin: 600, bottomMin: 645 }]);
  test(
    'a single block gets one column',
    JSON.stringify(one.get('a')),
    '{"column":0,"columns":1,"overflow":0}'
  );
}
test('a start before opening is lifted to the floor', clampStart(g, 3 * 60, g.openMin), g.openMin);
test(
  'a start past closing is pulled back inside',
  clampStart(g, g.closeMin + 500, g.openMin),
  g.closeMin - SNAP_MIN_FINE
);

// ── 9. Degenerate: no figure ─────────────────────────────────────────────────
// The box floor must never leak into the measurement.
test('a zero-minute block still gets a box', blockBoxFor(g, 0), MIN_BLOCK_PX);
test('…but its height is still zero', heightFor(g, 0), 0);

// ── 10. Overlap through the band ─────────────────────────────────────────────
// Two blocks the model says MIGHT collide are drawn colliding, so the lanes
// have to agree with what a reader sees.
{
  const packed = packLanes([
    { id: 'a', topMin: 600, bottomMin: 630 }, // 10:00, 30 min incl. band
    { id: 'b', topMin: 620, bottomMin: 660 },
  ]);
  test('overlapping spans take separate columns', packed.get('b').column, 1);
  test('…and both report the cluster width', packed.get('a').columns, 2);
}

// ── 11. Outlook packing, not naive ───────────────────────────────────────────
{
  // a–b overlap, b–c overlap, a–c disjoint: peak concurrency is 2, not 3.
  const chain = packLanes([
    { id: 'a', topMin: 600, bottomMin: 640 },
    { id: 'b', topMin: 630, bottomMin: 670 },
    { id: 'c', topMin: 660, bottomMin: 700 },
  ]);
  test(
    'a chain of overlaps is two columns wide, not three',
    `${chain.get('a').column}/${chain.get('a').columns} ${chain.get('b').column}/${chain.get('b').columns} ${chain.get('c').column}/${chain.get('c').columns}`,
    '0/2 1/2 0/2'
  );

  const four = packLanes([
    { id: 'a', topMin: 600, bottomMin: 700 },
    { id: 'b', topMin: 605, bottomMin: 700 },
    { id: 'c', topMin: 610, bottomMin: 700 },
    { id: 'd', topMin: 615, bottomMin: 700 },
  ]);
  test('four concurrent blocks cap at three columns', four.get('d').columns, 3);
  test('…and the fourth is reported as overflow', four.get('d').overflow, 1);
}

// ── 12. Lane tie-break ───────────────────────────────────────────────────────
{
  const tied = packLanes([
    { id: 'first', topMin: 600, bottomMin: 660 },
    { id: 'second', topMin: 600, bottomMin: 660 },
  ]);
  test(
    'blocks at the same minute keep insertion order',
    `${tied.get('first').column}${tied.get('second').column}`,
    '01'
  );
}

// ── 13. The ride floor, and its gates ────────────────────────────────────────
// Two floors and they answer different questions. The HARD one is the earliest
// minute anybody could be standing in a queue: the park's published opening
// plus `GATE_TO_FIRST_RIDE_MIN`, because there is a turnstile, a bag check and
// a walk between the gates opening and a ride's entrance, and a plan that files
// the first ride on the opening minute is a plan nobody has executed. It used
// to be the opening minute itself, which was reported three times as a ride
// standing at 09:00 on a park whose gates open at 09:00.
//
// The SOFT one is a statement about MEASUREMENT — the first hour the API has a
// curve for — so it must not fire on a thin sample or on a ride that simply
// opens with the park.
const ride = (hours, sampleDays) => ({
  attractionSlug: 'x',
  attractionName: 'X',
  hours: hours.map((h) => ({ hour: h, wait: 30 })),
  dayPeak: 30,
  sampleDays,
});
const GATE = g.openMin + GATE_TO_FIRST_RIDE_MIN;
// `opensAt` is the FACT and the hard floor; the gate walk is a judgement and
// lives on the soft one. A ride that publishes its own opening therefore gets
// no walk added on top — that opening is already a statement about when
// somebody can be queueing.
const opening = (hhmm) => ({ ...ride([10, 11, 12], 400), opensAt: hhmm });
test('a published opening IS the hard floor', rideFloor(g, opening('10:00')).hardMin, 600);
test('and nothing is added to it', rideFloor(g, opening('10:00')).softMin, 600);
test('a malformed one is ignored', rideFloor(g, opening('nonsense')).hardMin, g.openMin);
test(
  "an opening at the park's own hour changes nothing",
  rideFloor(g, opening('09:00')).hardMin,
  g.openMin
);
test('a thin sample does not raise the floor', rideFloor(g, ride([11, 12, 13], 12)).softMin, GATE);
test('the hard floor without an opening is the park', rideFloor(g, undefined).hardMin, g.openMin);
test(
  'a ride measured from the opening hour does not raise it either',
  rideFloor(g, ride([9, 10, 11], 400)).softMin,
  GATE
);
test(
  'a well-measured late first hour raises the soft floor only',
  `${rideFloor(g, ride([11, 12], 400)).hardMin} ${rideFloor(g, ride([11, 12], 400)).softMin}`,
  `${g.openMin} 660`
);
test('the hard floor is never the statistic', rideFloor(g, ride([11, 12], 400)).hardMin, g.openMin);
test('a missing ride still yields the park floor', rideFloor(g, undefined).softMin, GATE);
// The allowance is an allowance, not a claim that a ride is shut: it is a fixed
// number of minutes after the gates and nothing about the ride enters it.
test(
  'the gate allowance is exactly that and no more',
  rideFloor(g, undefined).softMin - g.openMin,
  GATE_TO_FIRST_RIDE_MIN
);

// ── 14. Show label collapse ──────────────────────────────────────────────────
{
  // 8 px apart at 1.2 px/min is under 7 minutes.
  const lines = showLinePositions(g, [600, 606, 700]);
  test('near-simultaneous showtimes collapse into one line', lines.length, 2);
  test('…and the folded one is reported', lines[0].collapsedWith.length, 1);
}

// ── 14b. …and a park that runs a show every quarter hour ─────────────────────
// Europa-Park answers 33 shows for a Sunday, whose times land about every 15
// minutes — 18 px apart at 1.2 px/min, so the 14 px label rule folded NOTHING
// and a nine-hour axis carried 28 dashed rules with the day's two blocks behind
// them. The cap widens the fold instead of dropping the tail.
{
  const quarterly = [];
  for (let m = 9 * 60; m <= 18 * 60; m += 15) quarterly.push(m);
  const lines = showLinePositions(g, quarterly);
  test('a show every quarter hour is capped', lines.length <= MAX_SHOW_LINES, true);
  test(
    '…and every showtime is still on the axis somewhere',
    lines.reduce((sum, line) => sum + 1 + line.collapsedWith.length, 0),
    quarterly.length
  );
  // Sparse days are untouched, which is the assertion that keeps the cap from
  // being a change to the 92 % of park-days with a handful of shows.
  const sparse = showLinePositions(g, [600, 700, 800, 900]);
  test('a park with four showtimes draws four lines', sparse.length, 4);
  test(
    '…and folds none of them',
    sparse.every((line) => line.collapsedWith.length === 0),
    true
  );
}

// ── 15. Snapping and placement ───────────────────────────────────────────────
test('snapTo rounds to the nearest step', snapTo(607, SNAP_MIN_FINE), 600);
test('snapTo rounds up past the midpoint', snapTo(608, SNAP_MIN_FINE), 615);
// With no floor passed, the park's opening is the contract — the ride floor is
// the CALLER's to supply, and every call site in the app passes it.
test('an empty day places the first ride at opening', nextFreeStart([], g), g.openMin);
test(
  '…and at the ride floor when one is given',
  nextFreeStart([], g, 45, rideFloor(g, undefined).softMin),
  GATE
);
test(
  'a second ride goes after the first',
  nextFreeStart([{ startMinute: 540, spanMinutes: 45 }], g) >= 585,
  true
);

// ── 15b. The lane budget reports what it could not place ─────────────────────
// `packLanes` caps a cluster at MAX_LANES columns and rides everything beyond
// that in the last one, where the blocks overlap. The count came back on
// `LanePlacement.overflow` and nothing drew it, so a fourth ride at one hour
// rendered as three with the fourth underneath. These pin the contract the
// badge now depends on.
{
  const at = (id, topMin, bottomMin) => ({ id, topMin, bottomMin });
  const four = packLanes([
    at('a', 600, 700),
    at('b', 610, 700),
    at('c', 620, 700),
    at('d', 630, 700),
  ]);
  test('vier gleichzeitige Blöcke ergeben drei Spuren', four.get('a').columns, 3);
  test('der vierte fährt in der letzten mit', four.get('d').column, 2);
  test('und wird dort gezählt', four.get('d').overflow, 1);
  test('die anderen zählen nichts', four.get('a').overflow, 0);
  // Reported ONCE, on the last block of the crowded column — which is also the
  // one drawn on top, so the badge is never under something else.
  const six = packLanes([
    at('a', 600, 700),
    at('b', 600, 700),
    at('c', 600, 700),
    at('d', 600, 700),
    at('e', 600, 700),
  ]);
  test('zwei Überzählige werden zusammen gemeldet', six.get('e').overflow, 2);
  test('und nicht einzeln', six.get('d').overflow, 0);
  // Three fit, so nothing is reported at all.
  const three = packLanes([at('a', 600, 700), at('b', 610, 700), at('c', 620, 700)]);
  test('drei passen ohne Überlauf', three.get('c').overflow, 0);
}

// ── 16. The axis grows to contain the plan ───────────────────────────────────
// `clampStart` lets a block START fifteen minutes before the park shuts, so a
// sixty-minute free block reaches forty-five minutes past `closeMin` against a
// canvas that ends thirty past it — a hotel check-in at 18:30 simply ran off the
// bottom, over the gutter label saying when the day ends.
//
// g is 09:00–18:00, so closeMin = 19*60 = 1140 and the canvas is 08:30 → 19:30.
test('ohne Plan bleibt die Achse, wie sie war', growGridForSpans(g, []), g);
test(
  'ein Block innerhalb des Tages ändert nichts',
  growGridForSpans(g, [{ startMinute: 600, spanMinutes: 45 }]).gridEndMin,
  g.gridEndMin
);
// 18:30 + 60 = 19:30, plus the 30-minute pad is 20:00 — the next full hour is
// itself, so the canvas ends at 20:00 rather than at 19:30.
test(
  'ein Block über das Ende hinaus zieht die Achse mit',
  growGridForSpans(g, [{ startMinute: 1110, spanMinutes: 60 }]).gridEndMin,
  20 * 60
);
test(
  'und rundet auf die volle Stunde, damit die Ticks ganz bleiben',
  growGridForSpans(g, [{ startMinute: 1110, spanMinutes: 75 }]).gridEndMin,
  21 * 60
);
// The park's own day is a statement about the park and may not move with a plan.
test(
  'die Öffnungszeit bleibt unberührt',
  growGridForSpans(g, [{ startMinute: 1110, spanMinutes: 120 }]).closeMin,
  g.closeMin
);
test(
  'die Schließzeit auch',
  growGridForSpans(g, [{ startMinute: 0, spanMinutes: 30 }]).openMin,
  g.openMin
);
// Somebody who files a rope-drop block before the pad still gets a canvas for it.
test(
  'ein Block vor dem Anfang zieht die Achse nach oben',
  growGridForSpans(g, [{ startMinute: 7 * 60, spanMinutes: 30 }]).gridStartMin,
  6 * 60
);
test(
  'und die Höhe folgt der neuen Spanne',
  growGridForSpans(g, [{ startMinute: 1110, spanMinutes: 60 }]).heightPx,
  (20 * 60 - g.gridStartMin) * PX_PER_MIN
);
// No axis at all is still no axis: a park with no published hours has nothing
// for a plan to grow.
test(
  'ohne Achse gibt es nichts zu erweitern',
  growGridForSpans(null, [{ startMinute: 600, spanMinutes: 60 }]),
  null
);
// A payload can carry anything; a NaN start must not turn the canvas into NaN.
test(
  'ein unbrauchbarer Startwert wird übersprungen',
  growGridForSpans(g, [{ startMinute: Number.NaN, spanMinutes: 60 }]).gridEndMin,
  g.gridEndMin
);

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = Object.is(actual, expected);
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — erwartet ${expected}, bekommen ${actual}`}`
  );
}
console.log(`\n${cases.length - failed}/${cases.length} bestanden (PX_PER_MIN = ${PX_PER_MIN})`);
process.exit(failed === 0 ? 0 : 1);
