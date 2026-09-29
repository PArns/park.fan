/**
 * Unit tests for a park's "with kids" page: its gate, its height ladder, the `?height=` the park
 * page accepts and the planner chip a step maps to (`lib/parks/kids-page.ts`,
 * `lib/parks/kids-segments.ts`, `lib/planner/party.ts`).
 *
 * Run: `pnpm test:park-kids`
 *
 * The gate is a decision of the PO (PAR-356, 2026-09-29): at least 20 attractions with a
 * `minimumHeight` and at least half of the park's attractions. The census that decision rests on
 * is reproduced in the fixtures below at its edges, because a gate that moves by one is a page
 * that appears or vanishes, and nothing renders the difference.
 */
import assert from 'node:assert/strict';
import {
  KIDS_PAGE_GATE,
  hasKidsPage,
  initialRiderHeightFromParam,
  kidsPageData,
} from '../lib/parks/kids-page.ts';
import { PARK_KIDS_SEGMENTS, parkKidsPath } from '../lib/parks/kids-segments.ts';
import { PARK_STATS_SEGMENTS } from '../lib/parks/stats-segments.ts';
import { PARK_CALENDAR_SEGMENTS } from '../lib/parks/calendar-segments.ts';
import { riderHeightChoiceFor, RIDER_HEIGHT_CHOICES } from '../lib/planner/party.ts';
import { unprefixedPathRedirect } from '../lib/i18n/unprefixed-redirect.ts';
import { plannerPageHeight } from '../lib/planner/page-height.ts';
import { readFileSync } from 'node:fs';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** `n` attractions with a limit from `heights` (cycled) and `m` without one. */
function park(n, m, heights = [100, 120, 140]) {
  const withLimit = Array.from({ length: n }, (_, i) => ({
    name: `Ride ${i}`,
    slug: `ride-${i}`,
    minimumHeight: heights[i % heights.length],
  }));
  const without = Array.from({ length: m }, (_, i) => ({
    name: `Free ${i}`,
    slug: `free-${i}`,
    minimumHeight: null,
  }));
  return [...withLimit, ...without];
}

console.log('gate');

test('the gate constants are the PO decision', () => {
  assert.equal(KIDS_PAGE_GATE.minRidesWithHeight, 20);
  assert.equal(KIDS_PAGE_GATE.minShareWithHeight, 0.5);
});

test('20 of 40 clears both lines exactly', () => {
  assert.equal(hasKidsPage(park(20, 20)), true);
});

test('19 rides with a limit is below the absolute line', () => {
  assert.equal(hasKidsPage(park(19, 0)), false);
});

test('20 of 41 is below the share line', () => {
  assert.equal(hasKidsPage(park(20, 21)), false);
});

test('a park with no limit at all has no page (Hansa-Park: 0 of 83)', () => {
  assert.equal(hasKidsPage(park(0, 83)), false);
});

test('Efteling-sized (8 of 37) has no page', () => {
  assert.equal(hasKidsPage(park(8, 29)), false);
});

test('no attractions is not a division by zero', () => {
  assert.equal(kidsPageData([]), null);
});

test('a limit of 0 is not a limit', () => {
  const rides = park(19, 0).concat([{ name: 'Zero', slug: 'zero', minimumHeight: 0 }]);
  assert.equal(hasKidsPage(rides), false);
});

console.log('ladder');

test('one step per distinct minimum, ascending', () => {
  const data = kidsPageData(park(30, 10, [140, 100, 120, 100]));
  assert.deepEqual(
    data.tiers.map((t) => t.cm),
    [100, 120, 140]
  );
});

test('a step counts what the park page slider counts: no-limit rides included', () => {
  const rides = [
    ...park(20, 0, [100, 120]),
    { name: 'A', slug: 'a', minimumHeight: null },
    { name: 'B', slug: 'b', minimumHeight: null },
  ];
  const data = kidsPageData(rides);
  assert.equal(data.total, 22);
  // At 100 cm: the ten 100 cm rides and the two without a limit.
  assert.equal(data.tiers[0].rideable, 12);
  assert.equal(data.tiers[1].rideable, 22);
  assert.equal(data.rideableAtZero, 2);
});

test('a maximum height takes the ride off the higher steps', () => {
  const rides = [
    ...park(20, 0, [100]),
    { name: 'Kiddie', slug: 'kiddie', minimumHeight: 90, maximumHeight: 120 },
    { name: 'Tall', slug: 'tall', minimumHeight: 140 },
  ];
  const data = kidsPageData(rides);
  const at = (cm) => data.tiers.find((t) => t.cm === cm).rideable;
  assert.equal(at(90), 1);
  assert.equal(at(100), 21);
  assert.equal(at(140), 21, 'Kiddie (max 120) is too small a ride for 140 cm, Tall opens');
});

test('newRides are the rides whose minimum is exactly the step, sorted by name', () => {
  const rides = [
    ...park(20, 0, [110]),
    { name: 'Zeta', slug: 'zeta', minimumHeight: 130 },
    { name: 'Alpha', slug: 'alpha', minimumHeight: 130 },
  ];
  const data = kidsPageData(rides);
  const step = data.tiers.find((t) => t.cm === 130);
  assert.deepEqual(
    step.newRides.map((r) => r.slug),
    ['alpha', 'zeta']
  );
  assert.equal(data.tiers.find((t) => t.cm === 110).newRides.length, 20);
});

test("the feed's NEW: marker is not part of a ride name", () => {
  const rides = [...park(20, 0), { name: 'NEW: Winni Splash', slug: 'winni', minimumHeight: null }];
  assert.deepEqual(kidsPageData(rides).withoutHeight, [{ name: 'Winni Splash', slug: 'winni' }]);
});

test('withoutHeight lists what posts no limit', () => {
  const data = kidsPageData(park(20, 3));
  assert.deepEqual(
    data.withoutHeight.map((r) => r.slug),
    ['free-0', 'free-1', 'free-2']
  );
  assert.equal(data.withHeight, 20);
});

console.log('?height=');

const rides = park(20, 0, [100, 120]);

test('a posted minimum is accepted', () => {
  assert.equal(initialRiderHeightFromParam('120', rides), 120);
});

test('a height with no stop under it is refused', () => {
  assert.equal(initialRiderHeightFromParam('110', rides), null);
});

test('junk, empty and absent are refused', () => {
  for (const raw of ['abc', '', '12x', '-100', '1e2', '1000', undefined]) {
    assert.equal(initialRiderHeightFromParam(raw, rides), null, String(raw));
  }
});

test('the first value of a repeated parameter counts', () => {
  assert.equal(initialRiderHeightFromParam(['100', '120'], rides), 100);
});

console.log('planner chip');

test('a step maps to the chip at or below it, never above', () => {
  assert.equal(riderHeightChoiceFor(132), 130);
  assert.equal(riderHeightChoiceFor(105), 100);
  assert.equal(riderHeightChoiceFor(100), 100);
  assert.equal(riderHeightChoiceFor(140), 140);
  assert.equal(riderHeightChoiceFor(175), 140);
});

test('below the lowest chip there is no choice, never a rounded-up one', () => {
  assert.equal(riderHeightChoiceFor(89), null);
  assert.equal(riderHeightChoiceFor(80), null);
  assert.equal(riderHeightChoiceFor(0), null);
  assert.equal(riderHeightChoiceFor(90), 90);
});

test('the choice is always one of the wizard chips and never above the height', () => {
  for (let cm = 40; cm <= 220; cm++) {
    const choice = riderHeightChoiceFor(cm);
    if (choice === null) {
      assert.ok(cm < RIDER_HEIGHT_CHOICES[0], String(cm));
    } else {
      assert.ok(RIDER_HEIGHT_CHOICES.includes(choice) && choice <= cm, String(cm));
    }
  }
});

console.log('segments');

test('six locales, six distinct segments', () => {
  assert.equal(new Set(Object.values(PARK_KIDS_SEGMENTS)).size, 6);
});

test('the segments are the PO list', () => {
  assert.deepEqual(PARK_KIDS_SEGMENTS, {
    de: 'mit-kindern',
    en: 'with-kids',
    nl: 'met-kinderen',
    fr: 'avec-enfants',
    it: 'con-bambini',
    es: 'con-ninos',
  });
});

test('no segment is shared with the calendar or the wait-time record', () => {
  const others = new Set([
    ...Object.values(PARK_STATS_SEGMENTS),
    ...Object.values(PARK_CALENDAR_SEGMENTS),
  ]);
  for (const segment of Object.values(PARK_KIDS_SEGMENTS)) assert.equal(others.has(segment), false);
});

test('parkKidsPath builds the localized path', () => {
  assert.equal(
    parkKidsPath('de', 'europe', 'germany', 'bruehl', 'phantasialand'),
    '/parks/europe/germany/bruehl/phantasialand/mit-kindern'
  );
  assert.equal(
    parkKidsPath('xx', 'europe', 'germany', 'bruehl', 'phantasialand'),
    '/parks/europe/germany/bruehl/phantasialand/with-kids'
  );
});

test('an unprefixed "with kids" path goes to the locale its segment names', () => {
  const path = '/parks/europe/germany/bruehl/phantasialand';
  assert.equal(unprefixedPathRedirect(`${path}/con-bambini`, true), `/it${path}/con-bambini`);
  assert.equal(unprefixedPathRedirect(`${path}/with-kids`, true), `/en${path}/with-kids`);
});

console.log('hand-off');

test('take returns the height once and clears it', () => {
  plannerPageHeight.set({ parkSlug: 'phantasialand', cm: 130 });
  assert.equal(plannerPageHeight.take('phantasialand'), 130);
  assert.equal(plannerPageHeight.take('phantasialand'), null);
});

test('another park asking gets nothing, and the hand-off is gone for the right park too', () => {
  plannerPageHeight.set({ parkSlug: 'phantasialand', cm: 130 });
  assert.equal(plannerPageHeight.take('toverland'), null);
  assert.equal(plannerPageHeight.take('phantasialand'), null);
});

test('a hand-off older than ten seconds is not found', () => {
  const realNow = Date.now;
  try {
    plannerPageHeight.set({ parkSlug: 'phantasialand', cm: 130 });
    const t0 = realNow();
    Date.now = () => t0 + 10_001;
    assert.equal(plannerPageHeight.take('phantasialand'), null);
  } finally {
    Date.now = realNow;
  }
});

console.log('next.config.ts');

/** The `'key': 'value'` pairs of the object literal or rewrite loop that follows `anchor`. */
function segmentsAfter(source, anchor) {
  const start = source.indexOf(anchor);
  assert.notEqual(start, -1, anchor);
  const block = source.slice(start, source.indexOf('};', start));
  return Object.fromEntries(
    [...block.matchAll(/\b(en|de|fr|it|nl|es): '([^']+)'/g)].map((m) => [m[1], m[2]])
  );
}

test('the header list and the rewrite list in next.config.ts match PARK_KIDS_SEGMENTS', () => {
  const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
  const headers = segmentsAfter(config, 'const parkKidsHeaderSegments');
  const rewrites = segmentsAfter(config, 'const parkKidsSegments');
  assert.deepEqual(headers, PARK_KIDS_SEGMENTS);
  const { en, ...withoutEnglish } = PARK_KIDS_SEGMENTS;
  assert.deepEqual(rewrites, withoutEnglish, 'English needs no rewrite');
  assert.ok(en);
});

console.log(`\n${passed} passed`);
