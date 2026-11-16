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
  SAME_LAND_CEIL_MIN,
  dayWalkMinutes,
  earliestGoodStart,
  legBetween,
  legDeficit,
} from '../lib/planner/leg.ts';
import { RIDE_DURATION_MIN, START_STEP_MIN } from '../lib/planner/day-grid.ts';
import { LEG_CHIP_COMPACT_PX, LEG_CHIP_PX, legChipPlacement } from '../lib/planner/leg-chip.ts';

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
  const leg = legBetween(from(600, 45), to(660));
  test('the distance is measured, not guessed', Math.round(leg.metres), 124);
  test('a land change is noticed', leg.crossesLand, true);
  // floor = exit 3 + ride 5 + ceil(124/100) 2 = 10
  test(
    'the floor is exit + ride + the fastest walk',
    leg.floorMinutes,
    EXIT_MIN + RIDE_DURATION_MIN + 2
  );
  // ceiling = 3 + 5 + ceil(124 * 1.6 / 67) = 3 + 5 + 3 = 11
  test(
    'the ceiling assumes a detour and a park pace',
    leg.ceilingMinutes,
    EXIT_MIN + RIDE_DURATION_MIN + 3
  );
  test('the gap is measured from the front of the first queue', leg.gapMinutes, 15);
}

// ── The ladder, at its boundaries ────────────────────────────────────────────
// floor 10, ceiling 11, the queue ends at 645.
// gap 10 → on the floor, a minute under the ceiling → knapp.
test(
  'a gap over the floor and under the ceiling is knapp',
  legBetween(from(600, 45), to(655)).verdict,
  'tight'
);
// gap 11 → exactly the ceiling → gut.
test('a gap that clears the ceiling is gut', legBetween(from(600, 45), to(656)).verdict, 'good');
// gap 31 → slack 20 → a forecast still stops at gut.
test(
  'a forecast stops at gut, however wide the gap',
  legBetween(from(600, 45), to(676)).verdict,
  'good'
);

// ── broken is decided on the FLOOR, never the ceiling ────────────────────────
{
  // gap 5, floor 10, ceiling 11. Under the floor: certainly impossible.
  const impossible = legBetween(from(600, 45), to(650));
  test('a gap under the certifiable floor is broken', impossible.verdict, 'broken');
  test('…and the shortfall is reported against that floor', legDeficit(impossible), 5);

  // gap 10: at the floor, below the ceiling. Not broken — merely tight.
  const squeezed = legBetween(from(600, 45), to(655));
  test('a gap above the floor is never called impossible', squeezed.verdict === 'broken', false);
}

// ── The model's spread is not read ───────────────────────────────────────────
// `/plan/day`'s band is the day peak's, often wider than the peak itself. Judged
// against it, every leg of a packed day read knapp; the ladder now asks only
// whether the walk fits.
{
  const huge = legBetween(from(600, 45), to(720));
  test('a two-hour gap on a forecast is gut', huge.verdict, 'good');
  test('…and nothing is reported missing', huge.missing, 'none');
}

// ── No coordinates: the floor loses its walk term ────────────────────────────
{
  const sameLand = legBetween(
    { startMinute: 600, wait: 45, ride: bare('Mystery') },
    { startMinute: 660, wait: 30, ride: bare('Mystery') }
  );
  test('no coordinates means no distance', sameLand.metres, null);
  test('…and no walk in the floor', sameLand.floorMinutes, EXIT_MIN + RIDE_DURATION_MIN);
  test(
    '…and an assumed same-land ceiling',
    sameLand.ceilingMinutes,
    EXIT_MIN + RIDE_DURATION_MIN + SAME_LAND_CEIL_MIN
  );

  const crossLand = legBetween(
    { startMinute: 600, wait: 45, ride: bare('Mystery') },
    { startMinute: 660, wait: 30, ride: bare('Berlin') }
  );
  test(
    'a land change raises only the ceiling',
    crossLand.ceilingMinutes,
    EXIT_MIN + RIDE_DURATION_MIN + CROSS_LAND_CEIL_MIN
  );
  test('…and the floor is unchanged', crossLand.floorMinutes, EXIT_MIN + RIDE_DURATION_MIN);

  // The point of a zero walk floor: a guessed distance can never call a plan
  // impossible. Even a 1-minute gap is only broken by exit + ride, never by a walk.
  const tightNoCoords = legBetween(
    { startMinute: 600, wait: 45, ride: bare('Mystery') },
    { startMinute: 646, wait: 30, ride: bare('Berlin') }
  );
  test('a guessed hop is judged only on what is certain', tightNoCoords.verdict, 'broken');
  test(
    '…by exactly the certain terms',
    legDeficit(tightNoCoords),
    EXIT_MIN + RIDE_DURATION_MIN - 1
  );
}

// ── After a show or a free block there is no ride to leave (PAR-696) ─────────
{
  const afterShow = legBetween({ startMinute: 540, wait: 30, ride: taron, block: true }, to(570));
  const afterRide = legBetween(from(540, 30), to(570));
  test(
    'a show leaves no exit and no ride behind',
    afterShow.floorMinutes,
    afterRide.floorMinutes - EXIT_MIN - RIDE_DURATION_MIN
  );
  test(
    '…in the ceiling too',
    afterShow.ceilingMinutes,
    afterRide.ceilingMinutes - EXIT_MIN - RIDE_DURATION_MIN
  );
  const show = { startMinute: 540, wait: 30, ride: taron, block: true };
  test(
    '…and only the walk is certain: one minute short is broken',
    legBetween(show, to(570 + afterShow.floorMinutes - 1)).verdict,
    'broken'
  );
  test(
    '…and the floor itself is not',
    legBetween(show, to(570 + afterShow.floorMinutes)).verdict === 'broken',
    false
  );

  const placeless = legBetween({ startMinute: 540, wait: 30, ride: null, block: true }, to(570));
  test('a show with no position has a floor of 0', placeless.floorMinutes, 0);
  test('…and a ceiling of 0', placeless.ceilingMinutes, 0);
  test('…so a ride straight after it is not broken', placeless.verdict === 'broken', false);

  const intoPlaceless = legBetween(from(540, 30), {
    startMinute: 570,
    wait: 30,
    ride: null,
    block: true,
  });
  test(
    'a ride in front of a block with no position still spends exit and ride',
    intoPlaceless.floorMinutes,
    EXIT_MIN + RIDE_DURATION_MIN
  );
  test(
    '…and has no walk to add to it in the ceiling',
    intoPlaceless.ceilingMinutes,
    EXIT_MIN + RIDE_DURATION_MIN
  );
  const rideToRide = legBetween(
    { startMinute: 540, wait: 30, ride: bare('Berlin'), block: false },
    { startMinute: 600, wait: 30, ride: bare('Berlin'), block: false }
  );
  test(
    'ride to ride with block: false keeps its floor',
    rideToRide.floorMinutes,
    EXIT_MIN + RIDE_DURATION_MIN
  );
  test(
    '…and its ceiling',
    rideToRide.ceilingMinutes,
    EXIT_MIN + RIDE_DURATION_MIN + SAME_LAND_CEIL_MIN
  );

  const intoLocated = legBetween(from(540, 30), {
    startMinute: 600,
    wait: 30,
    ride: mamba,
    block: true,
  });
  test(
    'a ride before a located show still spends exit and ride',
    intoLocated.floorMinutes >= EXIT_MIN + RIDE_DURATION_MIN,
    true
  );
}

// ── A curated ride duration sharpens both bounds ─────────────────────────────
{
  const withDuration = legBetween(
    { startMinute: 600, wait: 45, ride: taron, rideSeconds: 47 },
    to(660)
  );
  test('a 47-second ride counts as one minute', withDuration.floorMinutes, EXIT_MIN + 1 + 2);
}

// ── No wait: nothing to be tight against ─────────────────────────────────────
{
  const noFigure = legBetween(from(600, null), to(660));
  test('a block with no figure yields no verdict', noFigure.verdict, 'unknown');
  test('…with its reason stated', noFigure.missing, 'no-wait');
}

// ── The repair snaps UP ──────────────────────────────────────────────────────
{
  const leg = legBetween(from(600, 45), to(650));
  const fixed = earliestGoodStart(from(600, 45), leg);
  test('the repair clears the ceiling', fixed >= 600 + 45 + leg.ceilingMinutes, true);
  test("…and lands on the optimiser's step", fixed % START_STEP_MIN, 0);
  test('…and never rounds back into the problem', fixed, 660);
}

// ── The detour factor is an assumption, and only touches the ceiling ─────────
test('the detour factor is the documented one', DETOUR_MAX, 1.6);

// ── A measured day runs the full ladder ──────────────────────────────────────
// A forecast stops at `good`: "großzügig" is a claim about room the forecast's
// own error might take back. On a day that already HAPPENED the gap is a fact,
// so capping it would understate every leg of every past day.
{
  const from = { startMinute: 600, wait: 20, ride: null };
  const to = { startMinute: 780, wait: 20, ride: null };

  const forecast = legBetween(from, to);
  test('die Prognose endet bei „gut"', forecast.verdict, 'good');

  const measured = legBetween(from, to, true);
  test('gemessen darf dieselbe Lücke großzügig sein', measured.verdict, 'generous');
  test('und es fehlt nichts', measured.missing, 'none');

  // Floor 6 (3 exit + 3 ride), ceiling 9 (+3 same-land walk) with no
  // coordinates. A gap of 8 clears the floor and misses the ceiling, so it is
  // tight whether or not the day is over: a walk does not get shorter because
  // the day is behind us.
  const tightTo = { startMinute: 628, wait: 20, ride: null };
  test('zu knapp bleibt zu knapp', legBetween(from, tightTo, true).verdict, 'tight');
  // And below the floor it is still impossible.
  const brokenTo = { startMinute: 622, wait: 20, ride: null };
  test('unmöglich bleibt unmöglich', legBetween(from, brokenTo, true).verdict, 'broken');
}

// ── A packed day reads gut ───────────────────────────────────────────────────
// The optimiser files the next stop on the first step after the ceiling, the
// same rounding `earliestGoodStart` uses, so a freshly packed leg clears the
// ceiling by less than a step and reads gut, not knapp.
{
  // Taron → Black Mamba: floor 10, ceiling 11, the queue ends at 645.
  const packedStart = earliestGoodStart(from(600, 45), legBetween(from(600, 45), to(700)));
  test('a packed day files the next stop on the step after the ceiling', packedStart, 660);
  test('…and that leg reads gut', legBetween(from(600, 45), to(packedStart)).verdict, 'good');
}

// ── Wo die Pille hängt, und wie groß sie dort sein darf ──────────────────────
// Die Lücke, gegen die gerechnet wird, ist die GEZEICHNETE — Unterkante des
// Kastens über der Pille bis Oberkante des nächsten Blocks. Sie ist nicht der
// Abstand der Warteschlangen: eine Schlange unter 16,7 Minuten wird trotzdem in
// einem Kasten gezeichnet, in den eine Textzeile passt, und der Überhang ist
// genau die Differenz. Gemessen an einem gepackten Phantasialand-Tag waren das
// 24 px Abstand und 16 px Lücke, in die eine 21-px-Pille gesetzt wurde.
{
  // 24 px Abstand, 8 px Überhang: 16 px Lücke, also die kurze Pille, mittig.
  const tight = legChipPlacement(24, 8);
  test('eine 16-px-Lücke bekommt die kurze Pille', tight.compact, true);
  test('…und die Lücke ist die gezeichnete, nicht die der Schlangen', tight.roomPx, 16);
  test('…und sie hängt mittig darin', tight.topPx, 8 + (16 - LEG_CHIP_COMPACT_PX) / 2);
  test(
    '…also unter der Unterkante des Kastens',
    tight.topPx >= 8 && tight.topPx + LEG_CHIP_COMPACT_PX <= 24,
    true
  );

  // Die kleinste Lücke, die ein geplanter Tag erzeugt: 12 px, 34 von 267 Legs.
  const smallest = legChipPlacement(12, 0);
  test('die kleinste gemessene Lücke trägt die kurze Pille genau', smallest.roomPx, 12);
  test('…ohne sie anzuschneiden', smallest.topPx, 0);
  test('…und ohne Rest', LEG_CHIP_COMPACT_PX, 12);

  // Ab 21 px die volle Pille, und zwar auf die Lücke gerechnet: 28 px Abstand
  // mit 8 px Überhang sind 20 px Lücke und damit noch die kurze.
  test('20 px Lücke sind noch zu wenig', legChipPlacement(28, 8).compact, true);
  test('21 px reichen für die volle', legChipPlacement(29, 8).compact, false);
  test('…und sie sitzt dann bündig', legChipPlacement(29, 8).topPx, 8);
  test('ohne Überhang entscheidet der Abstand selbst', legChipPlacement(21, 0).compact, false);

  // Der Reparieren-Knopf ist ein Ziel und kein Etikett: er schrumpft nicht, er
  // wird nur besser platziert.
  const repair = legChipPlacement(10, 0, true);
  test('der Reparieren-Knopf behält seine Größe', repair.compact, false);
  test('…und wird auf die Lücke zentriert', repair.topPx, (10 - LEG_CHIP_PX) / 2);

  // Ein Überhang, der größer ist als das Leg — zwei Blöcke, die einander
  // überlappen, also ein von Hand gezogener Tag. Die Lücke ist negativ, die
  // Pille wird auf ihre Mitte zentriert und weicht keiner der beiden Seiten aus.
  const overlap = legChipPlacement(10, 16);
  test('überlappende Blöcke ergeben eine negative Lücke', overlap.roomPx, -6);
  test('…und die Pille liegt auf deren Mitte', overlap.topPx, 16 + (-6 - LEG_CHIP_COMPACT_PX) / 2);
  // Ein negativer Überhang kann nicht vorkommen — der gezeichnete Kasten ist nie
  // kürzer als seine Schlange — und würde die Pille nach OBEN in den Block
  // darüber schieben, während er behauptet, ihr Platz verschafft zu haben.
  test('ein negativer Überhang wird geklemmt', legChipPlacement(24, -8).roomPx, 24);
}

// ── The day's walking: the walk inside each chip's ceiling, summed ───────────
{
  const day = { rides: [taron, mamba], shows: [] };
  const ride = (slug, startMinute) => ({ id: slug, attractionSlug: slug, startMinute });
  const leg = legBetween(from(600, 20, taron), { startMinute: 660, wait: 10, ride: mamba });
  const walk = leg.ceilingMinutes - EXIT_MIN - RIDE_DURATION_MIN;
  // Entered out of order on purpose: the grid pairs its legs in start order.
  const entries = [ride('taron', 720), ride('black-mamba', 660), ride('taron', 600)];
  test('the day walks what its two chips allow for', dayWalkMinutes(day, entries), 2 * walk);
  test('one entry has no walk', dayWalkMinutes(day, [ride('taron', 600)]), 0);
  test(
    'a free block with no place adds no walk',
    dayWalkMinutes(day, [ride('taron', 600), { id: 'lunch', startMinute: 660, custom: {} }]),
    0
  );
}

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
