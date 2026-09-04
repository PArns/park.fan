/**
 * The day optimiser, against a truth it cannot argue with.
 *
 * The interesting assertion in here is the first one and it is the reason the
 * file exists: `optimizeDay` is a HEURISTIC — a beam search plus a local search
 * — so "it returns a plan" proves nothing. For every instance small enough to
 * enumerate, this brute-forces all `n!` orders through the optimiser's own
 * scorer and asserts the heuristic found one of the optima. Eight rides is
 * 40,320 orders, which a test can afford and a click cannot.
 *
 * The rest pin the properties a visitor would notice if they broke: a lunch
 * break stays where it was put, a ticked-off ride is not re-planned, a ride that
 * opens at 11:00 is not queued for at 09:15, pressing the button twice does
 * nothing the second time, and the same day always produces the same plan.
 *
 *     pnpm test:planner-optimize
 */

import { buildDayGrid } from '../lib/planner/day-grid.ts';
import {
  canOptimize,
  headlinersSkipped,
  headlinersToAdd,
  optimizeDay,
  scoreCurrent,
  scoreOrder,
} from '../lib/planner/optimize.ts';

let passed = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failures.push(name);
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const OPEN = 9;
const CLOSE = 20;

/**
 * A ride whose curve is given per hour, with coordinates so the transfer model
 * has something to work with.
 *
 * The metres are deliberately real-ish: 0.001° of latitude is about 111 m, so a
 * ride at `+0.004` is ~440 m away — one end of Phantasialand to the other.
 */
function ride(slug, waits, options = {}) {
  const hours = [];
  for (let hour = OPEN; hour <= CLOSE; hour++) {
    const wait = waits[hour];
    if (wait !== undefined) hours.push({ hour, wait });
  }
  return {
    attractionSlug: slug,
    attractionName: slug,
    hours,
    dayPeak: Math.max(0, ...Object.values(waits)),
    sampleDays: 90,
    latitude: options.lat ?? 50.8,
    longitude: options.lng ?? 6.87,
    land: options.land ?? 'Berlin',
    uncertaintyMinutes: options.uncertainty ?? null,
    opensAt: options.opensAt ?? null,
    isHeadliner: options.headliner ?? false,
    minimumHeight: options.minimumHeight,
    mayGetWet: options.mayGetWet,
  };
}

/** A flat curve, so a ride's cost depends only on which hour it lands in. */
function flat(value) {
  const out = {};
  for (let hour = OPEN; hour <= CLOSE; hour++) out[hour] = value;
  return out;
}

/** Low early, high after lunch — the shape a headliner actually has. */
function morningRide(low, high, turnHour = 12) {
  const out = {};
  for (let hour = OPEN; hour <= CLOSE; hour++) out[hour] = hour < turnHour ? low : high;
  return out;
}

function day(rides, context = {}) {
  return {
    parkSlug: 'test-park',
    timezone: 'Europe/Berlin',
    tier: 'measured',
    leadDays: 1,
    rides,
    shows: [],
    context: {
      date: '2026-09-05',
      status: 'OPERATING',
      openHour: OPEN,
      closeHour: CLOSE,
      isHoliday: false,
      isBridgeDay: false,
      isSchoolVacation: false,
      isWeekend: false,
      ...context,
    },
  };
}

function entry(id, slug, startMinute, extra = {}) {
  return { id, attractionSlug: slug, attractionName: slug, startMinute, ...extra };
}

const grid = (payload) => buildDayGrid(payload.context.openHour, payload.context.closeHour);

// ── 1. Optimality, against every permutation ────────────────────────────────
//
// The heuristic's answer is compared to the best of all n! orders scored by the
// same scorer, which is what makes the comparison meaningful: if the two ever
// disagree it is the search that is wrong, not the model.

function costOf(plan) {
  return [plan.overflow, plan.totalWaitMinutes, plan.endMinute];
}

function permutations(items) {
  if (items.length <= 1) return [items];
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) out.push([items[i], ...tail]);
  }
  return out;
}

/**
 * The best of every order, scored by `scoreOrder`.
 *
 * `scoreOrder` is the optimiser's own scheduler and NOT its search, which is
 * what makes this a check rather than a tautology: running the search over each
 * permutation would be the search marking its own homework. What is being
 * proved is that the beam plus the local search find the order a full
 * enumeration would — the scheduling of one order, including its per-stop delay
 * decision, is shared by both sides on purpose.
 */
function bruteForce(input, slugs) {
  let best = null;
  for (const order of permutations(slugs)) {
    const scored = scoreOrder(input, order);
    if (!scored) continue;
    const candidate = costOf(scored);
    if (best === null || lex(candidate) < lex(best)) best = candidate;
  }
  return best;
}

/** Lexicographic as one comparable number: overflow ≫ wait ≫ clock. */
function lex([overflow, wait, end]) {
  return overflow * 1e8 + wait * 1e4 + end;
}

{
  // Seven rides across three lands, with curves that pull in different
  // directions: two collapse after lunch, two are worst in the morning, one is
  // flat and two are ordinary.
  const rides = [
    ride('alpha', morningRide(10, 70), { lat: 50.8, lng: 6.87, land: 'A' }),
    ride('beta', morningRide(15, 60), { lat: 50.803, lng: 6.874, land: 'B' }),
    ride('gamma', morningRide(65, 15), { lat: 50.798, lng: 6.866, land: 'A' }),
    ride('delta', morningRide(55, 20), { lat: 50.806, lng: 6.879, land: 'C' }),
    ride('epsilon', flat(30), { lat: 50.801, lng: 6.871, land: 'B' }),
    ride('zeta', morningRide(20, 45), { lat: 50.797, lng: 6.881, land: 'C' }),
    ride('eta', morningRide(40, 25), { lat: 50.805, lng: 6.864, land: 'A' }),
  ];
  const payload = day(rides);
  const slugs = rides.map((r) => r.attractionSlug);

  // The heuristic, from a deliberately bad starting order (every ride at its
  // worst hour, in alphabetical sequence).
  const entries = slugs.map((slug, index) => entry(`${slug}-1`, slug, 13 * 60 + index * 30));
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });
  const optimum = bruteForce({ day: payload, grid: grid(payload), entries }, slugs);

  check(
    'die Heuristik findet bei sieben Bahnen die beste Reihenfolge',
    found !== null && lex(costOf(found)) <= lex(optimum),
    found
      ? `gefunden ${JSON.stringify(costOf(found))}, optimal ${JSON.stringify(optimum)}`
      : 'kein Plan'
  );
}

{
  // Five rides, all in one land, so the ordering is decided by the curves alone
  // and a wrong answer cannot hide behind the walking model.
  const rides = [
    ride('a', morningRide(5, 80), { land: 'X' }),
    ride('b', morningRide(80, 5), { land: 'X' }),
    ride('c', flat(25), { land: 'X' }),
    ride('d', morningRide(10, 50), { land: 'X' }),
    ride('e', morningRide(50, 10), { land: 'X' }),
  ];
  const payload = day(rides);
  const slugs = rides.map((r) => r.attractionSlug);
  const entries = slugs.map((slug, index) => entry(`${slug}-1`, slug, OPEN * 60 + index * 45));
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });
  const optimum = bruteForce({ day: payload, grid: grid(payload), entries }, slugs);

  check(
    'die Heuristik findet bei fünf Bahnen die beste Reihenfolge',
    found !== null && lex(costOf(found)) <= lex(optimum),
    found
      ? `gefunden ${JSON.stringify(costOf(found))}, optimal ${JSON.stringify(optimum)}`
      : 'kein Plan'
  );

  // And it does the obvious thing: the two rides that collapse after lunch go
  // last, the two that are cheap in the morning go first.
  const order = found.stops.map((s) => s.attractionSlug);
  check(
    'die Morgenbahnen stehen vor den Nachmittagsbahnen',
    order.indexOf('a') < order.indexOf('b') && order.indexOf('d') < order.indexOf('e'),
    order.join(' → ')
  );
}

// ── 2. Rope drop falls out of the data rather than being wired in ───────────
{
  const rides = [
    ride('headliner', morningRide(10, 90, 10), { land: 'X', headliner: true }),
    ride('filler-1', flat(20), { land: 'X' }),
    ride('filler-2', flat(20), { land: 'X' }),
  ];
  const payload = day(rides);
  const entries = [
    entry('headliner-1', 'headliner', 15 * 60),
    entry('filler-1-1', 'filler-1', 9 * 60),
    entry('filler-2-1', 'filler-2', 10 * 60),
  ];
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });
  check(
    'die Bahn mit dem steilsten Morgen wird zuerst geplant',
    found?.stops[0]?.attractionSlug === 'headliner',
    found?.stops.map((s) => `${s.attractionSlug}@${s.startMinute}`).join(' → ') ?? 'kein Plan'
  );
  check(
    'und zwar an ihrer eigenen Untergrenze, nicht zur Parköffnung',
    // `rideFloor` adds GATE_TO_FIRST_RIDE_MIN for a ride that opens with the
    // park: 09:00 + 15 min walk from the gates.
    found?.stops[0]?.startMinute === OPEN * 60 + 15,
    String(found?.stops[0]?.startMinute)
  );
}

// A park where the morning is NOT the answer: the same code must not recommend
// rope drop where the data says the queue builds later and falls at closing.
{
  const rides = [
    ride('evening', morningRide(70, 10, 17), { land: 'X' }),
    ride('flat-1', flat(20), { land: 'X' }),
    ride('flat-2', flat(20), { land: 'X' }),
  ];
  const payload = day(rides);
  const entries = [
    entry('evening-1', 'evening', 9 * 60),
    entry('flat-1-1', 'flat-1', 11 * 60),
    entry('flat-2-1', 'flat-2', 13 * 60),
  ];
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });
  check(
    'eine Abendbahn wird nicht in den Morgen gezogen',
    found !== null && found.stops.at(-1)?.attractionSlug === 'evening',
    found?.stops.map((s) => `${s.attractionSlug}@${s.startMinute}`).join(' → ') ?? 'kein Plan'
  );
}

// ── 3. Waiting is allowed, but only when it pays for itself ─────────────────
{
  // One ride whose queue collapses at 11:00, plus a filler. Reached at 09:45 it
  // is a choice between 100 minutes of queue now (free at 11:25) and 75 minutes
  // of nothing followed by 5 (free at 11:05). The second is better BECAUSE it
  // finishes earlier, which is the entire rule.
  const rides = [
    ride('cliff', morningRide(100, 5, 11), { land: 'X' }),
    ride('filler', flat(15), { land: 'X' }),
  ];
  const payload = day(rides);
  const entries = [entry('cliff-1', 'cliff', 9 * 60), entry('filler-1', 'filler', 10 * 60)];
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });
  const cliff = found?.stops.find((s) => s.attractionSlug === 'cliff');
  check(
    'auf einen einbrechenden Andrang wird gewartet, wenn das früher fertig macht',
    cliff !== undefined && cliff.startMinute >= 11 * 60,
    found?.stops.map((s) => `${s.attractionSlug}@${s.startMinute}=${s.waitMinutes}`).join(' → ') ??
      'kein Plan'
  );
  check(
    'und das Warten macht den Tag nicht länger',
    found !== null && found.endMinute <= 11 * 60 + 20,
    String(found?.endMinute)
  );

  // The other half of the same rule, and it is what keeps the optimiser from
  // sending somebody for a four-hour coffee: a collapse too far out can never
  // pay for itself, so the plan takes the queue it has.
  const late = day([
    ride('far-cliff', morningRide(100, 5, 15), { land: 'X' }),
    ride('filler', flat(15), { land: 'X' }),
  ]);
  const lateFound = optimizeDay({
    day: late,
    grid: grid(late),
    entries: [entry('far-cliff-1', 'far-cliff', 12 * 60), entry('filler-1', 'filler', 9 * 60)],
  });
  const far = lateFound?.stops.find((s) => s.attractionSlug === 'far-cliff');
  check(
    'auf einen Einbruch in fünf Stunden wird nicht gewartet',
    far === undefined || far.startMinute < 15 * 60,
    lateFound?.stops.map((s) => `${s.attractionSlug}@${s.startMinute}`).join(' → ') ?? 'kein Plan'
  );
}

// ── 4. What it may not touch ────────────────────────────────────────────────
{
  const rides = [
    ride('a', morningRide(10, 60), { land: 'X' }),
    ride('b', morningRide(60, 10), { land: 'X' }),
    ride('c', flat(20), { land: 'X' }),
  ];
  const payload = day(rides);
  const entries = [
    entry('a-1', 'a', 15 * 60),
    entry('b-1', 'b', 9 * 60),
    entry('c-1', 'c', 11 * 60),
    { id: 'lunch-1', startMinute: 13 * 60, custom: { label: 'Mittag', durationMinutes: 60 } },
    entry('done-1', 'a', 10 * 60, { done: true, actualWait: 25 }),
  ];
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });

  check(
    'ein Freiblock und eine abgehakte Bahn tauchen im Plan nicht auf',
    found !== null && found.stops.every((s) => s.entryId !== 'lunch-1' && s.entryId !== 'done-1'),
    found?.stops.map((s) => s.entryId).join(', ') ?? 'kein Plan'
  );

  const overlapsLunch = found.stops.some((stop) => {
    const span = (stop.waitMinutes ?? 45) + 15;
    return stop.startMinute < 14 * 60 && stop.startMinute + span > 13 * 60;
  });
  check('und keine Bahn wird über die Mittagspause gelegt', !overlapsLunch);
}

// ── 5. A ride that opens later is not queued for before it opens ────────────
{
  const rides = [
    ride('late', flat(20), { land: 'X', opensAt: '11:00' }),
    ride('early', flat(20), { land: 'X' }),
  ];
  const payload = day(rides);
  const entries = [entry('late-1', 'late', 9 * 60), entry('early-1', 'early', 12 * 60)];
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });
  const late = found?.stops.find((s) => s.attractionSlug === 'late');
  check(
    'eine Bahn, die erst um 11 öffnet, wird nicht um 9 eingeplant',
    late === undefined || late.startMinute >= 11 * 60,
    found?.stops.map((s) => `${s.attractionSlug}@${s.startMinute}`).join(' → ') ?? 'kein Plan'
  );
}

// ── 6. Pressing it twice does nothing the second time ───────────────────────
{
  const rides = [
    ride('a', morningRide(10, 60), { land: 'X' }),
    ride('b', morningRide(60, 10), { land: 'X' }),
    ride('c', flat(25), { land: 'Y', lat: 50.806 }),
    ride('d', morningRide(35, 20), { land: 'Y', lat: 50.807 }),
  ];
  const payload = day(rides);
  const entries = [
    entry('a-1', 'a', 16 * 60),
    entry('b-1', 'b', 9 * 60),
    entry('c-1', 'c', 12 * 60),
    entry('d-1', 'd', 10 * 60),
  ];
  const first = optimizeDay({ day: payload, grid: grid(payload), entries });
  check('ein schlecht sortierter Tag wird sortiert', first !== null);

  const applied = first.stops.map((stop) =>
    entry(stop.entryId, stop.attractionSlug, stop.startMinute)
  );
  const second = optimizeDay({ day: payload, grid: grid(payload), entries: applied });
  check(
    'ein zweites Drücken ändert nichts mehr',
    second === null,
    second ? second.stops.map((s) => `${s.attractionSlug}@${s.startMinute}`).join(' → ') : ''
  );

  // Determinism: the same input twice, the same plan twice.
  const again = optimizeDay({ day: payload, grid: grid(payload), entries });
  check(
    'derselbe Tag ergibt denselben Plan',
    JSON.stringify(again?.stops) === JSON.stringify(first.stops)
  );
}

// ── 7. Headliners, after the party filter ───────────────────────────────────
{
  const rides = [
    ride('big-1', morningRide(20, 70), { land: 'X', headliner: true, minimumHeight: 140 }),
    ride('big-2', morningRide(30, 60), { land: 'X', headliner: true, mayGetWet: true }),
    ride('big-3', morningRide(25, 55), { land: 'X', headliner: true }),
    ride('small', flat(10), { land: 'X' }),
  ];
  const payload = day(rides);
  const entries = [entry('small-1', 'small', 10 * 60)];

  const all = headlinersToAdd(payload, entries, undefined);
  check('ohne Angaben zur Gruppe kommen alle Headliner infrage', all.length === 3);

  const withChild = headlinersToAdd(payload, entries, { riderHeightCm: 120, avoidWet: true });
  check(
    'zu klein und nass fallen nach dem Filter raus',
    withChild.length === 1 && withChild[0].attractionSlug === 'big-3',
    withChild.map((r) => r.attractionSlug).join(', ')
  );
  check(
    'und die Übersprungenen werden gezählt',
    headlinersSkipped(payload, entries, { riderHeightCm: 120, avoidWet: true }) === 2
  );

  const planned = optimizeDay({ day: payload, grid: grid(payload), entries, add: all });
  check(
    'alle Headliner landen im Plan',
    planned !== null &&
      ['big-1', 'big-2', 'big-3'].every((slug) =>
        planned.stops.some((stop) => stop.attractionSlug === slug)
      ),
    planned?.stops.map((s) => s.attractionSlug).join(' → ') ?? 'kein Plan'
  );
  check(
    'die bereits geplante Bahn bleibt dabei ein bestehender Eintrag',
    planned.stops.find((s) => s.attractionSlug === 'small')?.entryId === 'small-1'
  );
  check(
    'und ein neu eingefügter trägt noch keine ID',
    planned.stops.find((s) => s.attractionSlug === 'big-1')?.entryId === null
  );
}

// ── 8. A park nobody can read gets no button ────────────────────────────────
{
  const payload = day([ride('a', flat(20)), ride('b', flat(20))], {
    liveWaitTimes: { available: false, reason: 'app-only' },
  });
  check(
    'ein Park ohne lesbare Wartezeiten wird nicht optimiert',
    !canOptimize(payload, grid(payload))
  );
  check(
    'und optimizeDay verweigert dort',
    optimizeDay({
      day: payload,
      grid: grid(payload),
      entries: [entry('a-1', 'a', 10 * 60), entry('b-1', 'b', 11 * 60)],
    }) === null
  );

  const readable = day([ride('a', flat(20)), ride('b', flat(20))]);
  check('ein Park mit Wartezeiten schon', canOptimize(readable, grid(readable)));
}

// ── 9. A day that cannot fit everything says so ─────────────────────────────
{
  // Five rides of 150 minutes each against an eleven-hour day: four fit and one
  // cannot, and what must NOT happen is a silently dropped ride. They are strung
  // out along one axis so the order decides how much walking is paid for, which
  // is what makes one arrangement fit more of them than another.
  const rides = Array.from({ length: 5 }, (_, i) =>
    ride(`long-${i}`, flat(150), { land: 'X', lat: 50.8 + i * 0.006 })
  );
  const payload = day(rides);
  // Deliberately zig-zagging: 0 → 4 → 1 → 3 → 2 crosses the park four times.
  const zigzag = [0, 4, 1, 3, 2];
  const entries = zigzag.map((index, position) =>
    entry(`long-${index}-1`, `long-${index}`, 9 * 60 + position * 30)
  );
  const found = optimizeDay({ day: payload, grid: grid(payload), entries });
  check('kein Eintrag geht verloren, wenn der Tag zu kurz ist', found?.stops.length === 5);
  check('und der Überlauf wird gemeldet', (found?.overflow ?? 0) > 0, String(found?.overflow));
  check(
    'der Zickzack wird begradigt',
    found !== null &&
      lex(costOf(found)) <=
        lex(
          costOf(
            scoreOrder(
              { day: payload, grid: grid(payload), entries },
              zigzag.map((i) => `long-${i}`)
            )
          )
        )
  );
}

// ── 10. Before and after are produced by one function ───────────────────────
{
  // `a` is cheap before 11 and `b` after it. Ridden in the wrong order both cost
  // 90; in the right one `a` costs 10 and the wait for `b` pays for itself.
  const rides = [
    ride('a', morningRide(10, 90, 11), { land: 'X' }),
    ride('b', morningRide(90, 10, 11), { land: 'X' }),
  ];
  const payload = day(rides);
  const entries = [entry('a-1', 'a', 12 * 60), entry('b-1', 'b', 9 * 60)];
  const before = scoreCurrent({ day: payload, grid: grid(payload), entries });
  const after = optimizeDay({ day: payload, grid: grid(payload), entries });
  check(
    'der Vorher-Wert ist die Summe der aktuellen Stunden',
    before?.totalWaitMinutes === 180,
    String(before?.totalWaitMinutes)
  );
  check(
    'und der Nachher-Wert ist kleiner',
    after !== null && after.totalWaitMinutes < before.totalWaitMinutes,
    `${before?.totalWaitMinutes} → ${after?.totalWaitMinutes}`
  );
}

console.log(`\n${passed}/${passed + failures.length} bestanden`);
if (failures.length > 0) {
  console.log(failures.map((f) => `  · ${f}`).join('\n'));
  process.exit(1);
}
