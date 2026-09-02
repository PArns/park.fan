/**
 * Unit tests for the transfer between two planned rides (`lib/planner/leg.ts`).
 *
 * The property under test is the asymmetry, and it is the one thing in this
 * feature that could quietly become a lie: `broken` — the only verdict that
 * tells a visitor their plan is impossible — must be decided against a
 * certifiable floor, while every softer verdict is decided against an assumed
 * ceiling. Get that backwards and an unmeasured detour factor starts calling
 * workable plans impossible.
 *
 * Run: pnpm test:planner-leg
 */

import {
  CROSS_LAND_CEIL_MIN,
  DETOUR_MAX,
  EXIT_MIN,
  RIDE_FALLBACK_MIN,
  SAME_LAND_CEIL_MIN,
  earliestGoodStart,
  legBetween,
  legDeficit,
} from '../lib/planner/leg.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

/** Taron and Black Mamba, real Phantasialand coordinates, ~124 m apart. */
const taron = {
  attractionSlug: 'taron',
  attractionName: 'Taron',
  land: 'Klugheim',
  hours: [],
  dayPeak: 60,
  sampleDays: 400,
  latitude: 50.7996,
  longitude: 6.8797,
};
const mamba = {
  attractionSlug: 'black-mamba',
  attractionName: 'Black Mamba',
  land: 'Deep in Africa',
  hours: [],
  dayPeak: 35,
  sampleDays: 400,
  latitude: 50.7987204,
  longitude: 6.8807868,
};
/** Same land, no coordinates at all. */
const bare = (land) => ({
  attractionSlug: 's',
  attractionName: 'S',
  land,
  hours: [],
  dayPeak: 20,
  sampleDays: 100,
});

const from = (startMinute, wait, ride = taron) => ({ startMinute, wait, ride });
const to = (startMinute, ride = mamba) => ({ startMinute, wait: 30, ride });

// ── The worked example ───────────────────────────────────────────────────────
{
  const leg = legBetween(from(600, 45), to(660), 10);
  test('the distance is measured, not guessed', Math.round(leg.metres), 124);
  test('a land change is noticed', leg.crossesLand, true);
  // floor = exit 3 + ride 3 + ceil(124/100) 2 = 8
  test(
    'the floor is exit + ride + the fastest walk',
    leg.floorMinutes,
    EXIT_MIN + RIDE_FALLBACK_MIN + 2
  );
  // ceiling = 3 + 3 + ceil(124 * 1.6 / 67) = 3 + 3 + 3 = 9
  test(
    'the ceiling assumes a detour and a park pace',
    leg.ceilingMinutes,
    EXIT_MIN + RIDE_FALLBACK_MIN + 3
  );
  test('the gap is measured from the front of the first queue', leg.gapMinutes, 15);
}

// ── The ladder, at its boundaries ────────────────────────────────────────────
// gap 15, ceiling 9 → slack 6. With u = 10, slack < u → knapp.
test(
  'a gap inside the forecast error is knapp',
  legBetween(from(600, 45), to(660), 10).verdict,
  'tight'
);
// gap 30 → slack 21. 2u = 20, so 21 >= 20 → großzügig.
test(
  'a gap past twice the error is großzügig',
  legBetween(from(600, 45), to(675), 10).verdict,
  'generous'
);
// gap 20 → slack 11. u = 10 → 11 >= 10 but < 20 → gut.
test('a gap between the two is gut', legBetween(from(600, 45), to(665), 10).verdict, 'good');

// ── broken is decided on the FLOOR, never the ceiling ────────────────────────
{
  // gap 5, floor 8, ceiling 9. Under the floor: certainly impossible.
  const impossible = legBetween(from(600, 45), to(650), 10);
  test('a gap under the certifiable floor is broken', impossible.verdict, 'broken');
  test('…and the shortfall is reported against that floor', legDeficit(impossible), 3);

  // gap 9: at the ceiling, above the floor. Not broken — merely tight.
  const squeezed = legBetween(from(600, 45), to(654), 10);
  test('a gap above the floor is never called impossible', squeezed.verdict === 'broken', false);
}

// ── No spread reported caps the ladder ───────────────────────────────────────
{
  const huge = legBetween(from(600, 45), to(720), null);
  test('with no spread, großzügig is unreachable', huge.verdict, 'good');
  test('…and the reason is carried', huge.missing, 'no-spread');
  test(
    'a null spread is not a spread of zero',
    legBetween(from(600, 45), to(660), 0).verdict,
    'good'
  );
}

// ── No coordinates: the floor loses its walk term ────────────────────────────
{
  const sameLand = legBetween(
    { startMinute: 600, wait: 45, ride: bare('Mystery') },
    { startMinute: 660, wait: 30, ride: bare('Mystery') },
    10
  );
  test('no coordinates means no distance', sameLand.metres, null);
  test('…and no walk in the floor', sameLand.floorMinutes, EXIT_MIN + RIDE_FALLBACK_MIN);
  test(
    '…and an assumed same-land ceiling',
    sameLand.ceilingMinutes,
    EXIT_MIN + RIDE_FALLBACK_MIN + SAME_LAND_CEIL_MIN
  );

  const crossLand = legBetween(
    { startMinute: 600, wait: 45, ride: bare('Mystery') },
    { startMinute: 660, wait: 30, ride: bare('Berlin') },
    10
  );
  test(
    'a land change raises only the ceiling',
    crossLand.ceilingMinutes,
    EXIT_MIN + RIDE_FALLBACK_MIN + CROSS_LAND_CEIL_MIN
  );
  test('…and the floor is unchanged', crossLand.floorMinutes, EXIT_MIN + RIDE_FALLBACK_MIN);

  // The point of a zero walk floor: a guessed distance can never call a plan
  // impossible. Even a 1-minute gap is only broken by exit + ride, never by a walk.
  const tightNoCoords = legBetween(
    { startMinute: 600, wait: 45, ride: bare('Mystery') },
    { startMinute: 646, wait: 30, ride: bare('Berlin') },
    10
  );
  test('a guessed hop is judged only on what is certain', tightNoCoords.verdict, 'broken');
  test(
    '…by exactly the certain terms',
    legDeficit(tightNoCoords),
    EXIT_MIN + RIDE_FALLBACK_MIN - 1
  );
}

// ── A curated ride duration sharpens both bounds ─────────────────────────────
{
  const withDuration = legBetween(
    { startMinute: 600, wait: 45, ride: taron, rideSeconds: 47 },
    to(660),
    10
  );
  test('a 47-second ride counts as one minute', withDuration.floorMinutes, EXIT_MIN + 1 + 2);
}

// ── No wait: nothing to be tight against ─────────────────────────────────────
{
  const noFigure = legBetween(from(600, null), to(660), 10);
  test('a block with no figure yields no verdict', noFigure.verdict, 'unknown');
  test('…with its reason stated', noFigure.missing, 'no-wait');
}

// ── The repair snaps UP ──────────────────────────────────────────────────────
{
  const leg = legBetween(from(600, 45), to(650), 10);
  const fixed = earliestGoodStart(from(600, 45), leg);
  test('the repair clears the ceiling', fixed >= 600 + 45 + leg.ceilingMinutes, true);
  test('…and lands on the snap grid', fixed % 15, 0);
  test('…and never rounds back into the problem', fixed, 660);
}

// ── The detour factor is an assumption, and only touches the ceiling ─────────
test('the detour factor is the documented one', DETOUR_MAX, 1.6);

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = Object.is(actual, expected);
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — erwartet ${expected}, bekommen ${actual}`}`
  );
}
console.log(`\n${cases.length - failed}/${cases.length} bestanden`);
process.exit(failed === 0 ? 0 : 1);
