/**
 * The fit assistant's model, against days built to make each rule visible.
 *
 * `lib/planner/fit.ts` answers a question `optimizeDay` cannot: not "what is
 * the best plan for these rides" but "what would I have to change for them to
 * fit". Everything it says is a difference between two runs of the same engine,
 * so what a check has to pin is that the differences are real ones — a lever
 * that buys nothing is never offered, a lever that solves the day says so, and
 * the visitor's own order decides which ride falls out when one has to.
 *
 * The fixtures are sized so each rule is the ONLY thing that could produce the
 * answer: a six-hour day with five 60-minute headliners holds four of them, a
 * one-hour block takes the fifth away, and half an hour gives it back.
 *
 *     pnpm test:planner-fit
 */

import { buildDayGrid } from '../lib/planner/day-grid.ts';
import { headlinersToAdd } from '../lib/planner/optimize.ts';
import {
  SHORT_BLOCK_MIN,
  addWishKey,
  entryWishKey,
  evaluateFit,
  fitBlocks,
  fitChoiceAll,
  fitLevers,
  fitOrder,
  fitWishes,
  needsFitHelp,
} from '../lib/planner/fit.ts';

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
const CLOSE = 15;

/** A ride with a flat curve, so its cost never depends on which hour it lands in. */
function ride(slug, wait, options = {}) {
  const hours = [];
  for (let hour = 0; hour < 24; hour++) hours.push({ hour, wait });
  return {
    attractionSlug: slug,
    attractionName: slug,
    hours,
    dayPeak: options.dayPeak ?? wait,
    sampleDays: 90,
    // Same corner of the park, so the transfer is a constant and the day's
    // capacity is arithmetic on the queues rather than on the walking.
    latitude: 50.8,
    longitude: 6.87,
    land: 'Berlin',
    uncertaintyMinutes: null,
    opensAt: null,
    isHeadliner: options.headliner ?? true,
  };
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
      date: '2026-09-12',
      status: 'OPERATING',
      openHour: OPEN,
      closeHour: CLOSE,
      isHoliday: false,
      isBridgeDay: false,
      isSchoolVacation: false,
      isWeekend: true,
      ...context,
    },
  };
}

function block(id, startMinute, durationMinutes, extra = {}) {
  return {
    id,
    custom: { label: id, icon: 'food', durationMinutes },
    startMinute,
    ...extra,
  };
}

function entry(id, slug, startMinute, extra = {}) {
  return { id, attractionSlug: slug, attractionName: slug, startMinute, ...extra };
}

/** The whole input in one call — the shape every call site builds. */
function inputFor(payload, entries, add, clock) {
  const grid = buildDayGrid(payload.context.openHour, payload.context.closeHour);
  return {
    day: payload,
    grid,
    entries,
    wishes: fitWishes(payload, entries, add, clock),
    blocks: fitBlocks(entries),
    clock,
  };
}

const names = (input, keys) => {
  const byKey = new Map(input.wishes.map((wish) => [wish.key, wish]));
  return keys.map((key) => byKey.get(key)?.attractionName ?? key).join(', ');
};

// ── 1. A day that holds everything is never asked about ─────────────────────

{
  const payload = day([ride('a', 30), ride('b', 30), ride('c', 30)]);
  const add = headlinersToAdd(payload, [], undefined);
  const input = inputFor(payload, [], add);
  const choice = fitChoiceAll();
  const outcome = evaluateFit(input, choice);

  check(
    '1a three short queues in a six-hour day all fit',
    outcome.fitted.length === 3,
    `${outcome.fitted.length}`
  );
  check('1b nothing to help with', needsFitHelp(input, choice) === false);
  check('1c no levers on a day that fits', fitLevers(input, choice).length === 0);
}

// ── 2. The break is what does not fit, and the lever says so ────────────────
//
// Five 50-minute headliners against six hours: with a full hour out of the
// middle four of them fill the day and with half an hour all five do. Nothing
// else in the fixture can produce that difference — the curves are flat and the
// rides share a land, so the only variable left is the break.

const FIVE = ['a', 'b', 'c', 'd', 'e'].map((slug) => ride(slug, 50));

/** The same five with an hour of queue each, where half a break is not enough. */
const FIVE_LONG = ['a', 'b', 'c', 'd', 'e'].map((slug) => ride(slug, 60));

{
  const payload = day(FIVE);
  const entries = [block('lunch', 12 * 60, 60)];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);
  const choice = fitChoiceAll();
  const outcome = evaluateFit(input, choice);

  check('2a five wishes offered', input.wishes.length === 5, `${input.wishes.length}`);
  check('2b one of them does not fit', outcome.missed.length === 1, names(input, outcome.missed));
  check('2c the day is worth asking about', needsFitHelp(input, choice) === true);

  const levers = fitLevers(input, choice);
  const solving = levers.filter((lever) => lever.solves);
  check('2d a lever solves it', solving.length >= 1, JSON.stringify(levers));
  check(
    '2e and it is the break, cut short rather than skipped',
    solving[0]?.kind === 'shorten-block' && solving[0]?.entryId === 'lunch',
    JSON.stringify(solving[0])
  );
  check(
    '2f the short version is offered at SHORT_BLOCK_MIN',
    solving[0]?.minutes === SHORT_BLOCK_MIN,
    `${solving[0]?.minutes}`
  );
  check(
    '2g dropping the block outright is not offered beside it',
    !levers.some((lever) => lever.kind === 'drop-block' && lever.entryId === 'lunch'),
    JSON.stringify(levers.map((lever) => lever.kind))
  );

  const shortened = { ...choice, shortBlocks: new Set(['lunch']) };
  check('2h pulling it makes every wish fit', evaluateFit(input, shortened).missed.length === 0);
  check(
    '2i and the block is still in the day, at half the length',
    evaluateFit(input, shortened).entries.find((e) => e.id === 'lunch')?.custom.durationMinutes ===
      SHORT_BLOCK_MIN
  );
}

// ── 3. A break too long to cut short enough is dropped instead ──────────────

{
  const payload = day(FIVE_LONG);
  const entries = [block('lunch', 12 * 60, 120)];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);
  const choice = fitChoiceAll();
  const levers = fitLevers(input, choice);

  check('3a a two-hour break costs two rides', evaluateFit(input, choice).missed.length === 2);
  check(
    '3b both answers are offered, the one that solves the day first',
    levers[0]?.kind === 'drop-block' && levers.some((lever) => lever.kind === 'shorten-block'),
    JSON.stringify(levers.map((lever) => `${lever.kind}:${lever.fits}`))
  );
  const shorten = levers.find((lever) => lever.kind === 'shorten-block');
  check(
    '3c and half a break is offered too, for what it does buy',
    shorten.fits > shorten.fitsNow && shorten.fits < levers[0].fits,
    `${shorten.fits} vs ${levers[0].fits}`
  );
  check(
    '3d and the block is gone from the day it produces',
    evaluateFit(input, { ...choice, droppedBlocks: new Set(['lunch']) }).entries.every(
      (e) => e.id !== 'lunch'
    )
  );
}

// ── 4. Which wish falls out is the visitor's decision ───────────────────────

{
  const payload = day(FIVE);
  const entries = [block('lunch', 12 * 60, 60)];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);
  const choice = fitChoiceAll();
  const dropped = evaluateFit(input, choice).missed[0];

  // Whatever the engine gave up by itself, put it first and something else has
  // to go instead. The five rides are identical apart from their slugs, so the
  // ONLY thing that can move the answer is the order.
  const promoted = {
    ...choice,
    priority: [dropped, ...choice.priority.filter((key) => key !== dropped)],
  };
  const after = evaluateFit(input, promoted);
  check(
    '4a the promoted wish now fits',
    after.fitted.includes(dropped),
    names(input, after.missed)
  );
  check('4b and exactly one other does not', after.missed.length === 1);

  // The last in the list is the first to go, which is the sentence the dialog
  // makes to the visitor: pin the other four and the fifth is what goes.
  const order = fitOrder(input, choice);
  const last = order[order.length - 1].key;
  const pinned = { ...choice, priority: order.slice(0, -1).map((wish) => wish.key) };
  check(
    '4c the one nobody pinned is the one given up',
    evaluateFit(input, pinned).missed[0] === last,
    names(input, evaluateFit(input, pinned).missed)
  );
}

// ── 4b. A ride the park does not curate still wins where the visitor said so ─
//
// `isHeadliner` used to be the only thing that could put a ride in the tier
// that survives an overflow, so a filler ranked FIRST by the visitor was still
// the first thing dropped. The engine reads `priority` for the tier now
// (`isWanted`), and this is the day that says so.

{
  const payload = day([
    ride('head-a', 60),
    ride('head-b', 60),
    ride('head-c', 60),
    ride('head-d', 60),
    ride('filler', 60, { headliner: false }),
  ]);
  const entries = [block('lunch', 12 * 60, 60)];
  // Not `headlinersToAdd` — the whole point is a ride that is not one.
  const add = payload.rides;
  const input = inputFor(payload, entries, add);
  const choice = fitChoiceAll();
  const fillerKey = addWishKey('filler');

  const byDefault = evaluateFit(input, choice);
  check(
    '4d without a word from the visitor the filler is what goes',
    byDefault.missed[0] === fillerKey,
    names(input, byDefault.missed)
  );

  const promoted = {
    ...choice,
    priority: [fillerKey, ...choice.priority.filter((key) => key !== fillerKey)],
  };
  const after = evaluateFit(input, promoted);
  check(
    '4e ranked first, the filler is kept and a headliner goes',
    after.fitted.includes(fillerKey),
    names(input, after.missed)
  );
}

// ── 5. Unticking a wish takes it out of the day ─────────────────────────────

{
  const payload = day(FIVE);
  const entries = [
    entry('own-a', 'a', 9 * 60),
    entry('own-b', 'b', 11 * 60),
    block('lunch', 12 * 60, 60),
  ];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);

  check(
    '5a the two planned rides come first in the list',
    input.wishes
      .slice(0, 2)
      .map((w) => w.key)
      .join() === `${entryWishKey('own-a')},${entryWishKey('own-b')}`
  );
  check('5b and the three missing headliners follow', input.wishes.length === 5);

  const choice = fitChoiceAll();
  const withoutOwn = { ...choice, dropped: new Set([entryWishKey('own-a')]) };
  const outcome = evaluateFit(input, withoutOwn);
  check(
    '5c an unticked entry is not in the day that comes back',
    outcome.entries.every((e) => e.id !== 'own-a')
  );
  check(
    '5d and the free block still is',
    outcome.entries.some((e) => e.id === 'lunch')
  );
  check(
    '5e nor is it planned',
    !outcome.fitted.includes(entryWishKey('own-a')) &&
      !outcome.missed.includes(entryWishKey('own-a'))
  );

  const kept = evaluateFit(input, choice);
  check(
    '5f a ticked entry is re-planned rather than parked past the gate',
    kept.entries.every((e) => e.id !== 'own-a' && e.id !== 'own-b')
  );
}

// ── 6. What the assistant may not touch ─────────────────────────────────────

{
  const payload = day(FIVE);
  const entries = [
    entry('done-a', 'a', 9 * 60, { done: true, actualWait: 40 }),
    block('eaten', 11 * 60, 60, { done: true }),
    block('lunch', 13 * 60, 60),
    entry('own-b', 'b', 14 * 60),
  ];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);

  check(
    '6a a ticked-off ride is not a wish',
    input.wishes.every((wish) => wish.entryId !== 'done-a')
  );
  check(
    '6b a ticked-off block is not a lever',
    input.blocks.every((b) => b.entryId !== 'eaten'),
    JSON.stringify(input.blocks)
  );
  check(
    '6c the open block is',
    input.blocks.some((b) => b.entryId === 'lunch')
  );

  const outcome = evaluateFit(input, fitChoiceAll());
  check(
    '6d and both stay in the day whatever is chosen',
    outcome.entries.some((e) => e.id === 'done-a') && outcome.entries.some((e) => e.id === 'eaten')
  );
}

// ── 7. A ride the payload has no row for ────────────────────────────────────

{
  const payload = day(FIVE);
  const entries = [entry('ghost', 'gone-from-the-park', 10 * 60)];
  const input = inputFor(payload, entries, []);
  const wish = input.wishes.find((w) => w.entryId === 'ghost');

  check('7a it is still a wish', Boolean(wish));
  check('7b with no row behind it', wish.ride === null);

  const outcome = evaluateFit(input, fitChoiceAll());
  check(
    '7c and it keeps its minute rather than being re-planned',
    outcome.entries.some((e) => e.id === 'ghost' && e.startMinute === 10 * 60)
  );

  const removed = evaluateFit(input, {
    ...fitChoiceAll(),
    dropped: new Set([entryWishKey('ghost')]),
  });
  check(
    '7d unticking it is still the way out',
    removed.entries.every((e) => e.id !== 'ghost')
  );
}

// ── 8. A lever that buys nothing is not offered ─────────────────────────────

{
  const payload = day(FIVE);
  const entries = [block('lunch', 12 * 60, 60)];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);
  const choice = fitChoiceAll();
  check('8a tight, so the break is worth offering', fitLevers(input, choice).length > 0);

  // Give up the ride that did not fit and the break costs nothing any more.
  const slimmed = { ...choice, dropped: new Set(evaluateFit(input, choice).missed) };
  check('8b once the list fits, no lever is offered', fitLevers(input, slimmed).length === 0);
  check('8c and nothing is left to ask about', needsFitHelp(input, slimmed) === false);
}

// ── 9. The same day always comes back the same way ──────────────────────────

{
  const payload = day(FIVE);
  const entries = [block('lunch', 12 * 60, 60)];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);
  const choice = fitChoiceAll();
  const a = evaluateFit(input, choice);
  const b = evaluateFit(input, choice);
  check(
    '9a deterministic',
    JSON.stringify(a.fitted) === JSON.stringify(b.fitted) && a.endMinute === b.endMinute
  );
  check(
    '9b and so are the levers',
    JSON.stringify(fitLevers(input, choice)) === JSON.stringify(fitLevers(input, choice))
  );
}

// ── 10. Nothing lands past closing ──────────────────────────────────────────

{
  const payload = day(FIVE);
  const entries = [block('lunch', 12 * 60, 60)];
  const add = headlinersToAdd(payload, entries, undefined);
  const input = inputFor(payload, entries, add);
  const outcome = evaluateFit(input, fitChoiceAll());
  check(
    '10a every stop starts before the park shuts',
    outcome.stops.every((stop) => stop.startMinute < input.grid.closeMin),
    JSON.stringify(outcome.stops.map((s) => `${s.attractionSlug}@${s.startMinute}`))
  );
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((name) => `  ${name}`).join('\n'));
  process.exit(1);
}
