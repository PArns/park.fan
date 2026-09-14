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

// ── A measured day runs the full ladder ──────────────────────────────────────
// On a forecast, no spread caps the verdict at `good`: "großzügig" is a claim
// about how much room the forecast's own error leaves, and without an error
// there is nothing to be generous about. On a day that already HAPPENED there
// is no forecast error to leave room for — the gap is a fact — so capping it
// would understate every leg of every past day.
{
  const from = { startMinute: 600, wait: 20, ride: null };
  const to = { startMinute: 780, wait: 20, ride: null };

  const forecast = legBetween(from, to, null);
  test('ohne Spanne kappt die Prognose bei „gut"', forecast.verdict, 'good');
  test('und markiert die fehlende Spanne', forecast.missing, 'no-spread');

  const measured = legBetween(from, to, null, true);
  test('gemessen darf dieselbe Lücke großzügig sein', measured.verdict, 'generous');
  test('und es fehlt nichts', measured.missing, 'none');

  // Floor 6 (3 exit + 3 ride), ceiling 9 (+3 same-land walk) with no
  // coordinates. A gap of 8 clears the floor and misses the ceiling, so it is
  // tight whether or not the day is over: a walk does not get shorter because
  // the day is behind us.
  const tightTo = { startMinute: 628, wait: 20, ride: null };
  test('zu knapp bleibt zu knapp', legBetween(from, tightTo, null, true).verdict, 'tight');
  // And below the floor it is still impossible.
  const brokenTo = { startMinute: 622, wait: 20, ride: null };
  test('unmöglich bleibt unmöglich', legBetween(from, brokenTo, null, true).verdict, 'broken');
}

// ── Die Schwelle ist das ganze Band, und sie bleibt es ───────────────────────
//
// Diese Sprosse ist nach PAR-169 zweimal angesehen worden, und beide Male sah
// sie nach einer Panne aus: vorher stand jeder Chip eines gerechneten Tages auf
// „gut", jetzt steht er auf „knapp". Der Grund ist keiner in dieser Datei — die
// Suche baut gegen dasselbe `ceilingMinutes`, gegen das hier geurteilt wird,
// also ist der Slack eines frisch gepackten Tages im Wesentlichen der
// Rundungsrest auf `SNAP_MIN_FINE`. Gemessen über 169 Tage aus `/plan/day`:
// median 6 Minuten gegen ein Band von median 15.
//
// Festgehalten wird deshalb beides — dass der gepackte Tag auf `tight` fällt
// (das ist erwartet, nicht kaputt) und dass die Leiter trotzdem vollständig
// durchläuft, sobald jemand den Tag auseinanderzieht. Sonst repariert der
// nächste Lauf das eine und merkt nicht, dass er das andere abschafft.
{
  const band = 15;

  // Taron → Black Mamba: floor 8, ceiling 9, Schlangenende 645. Wohin ein
  // gepackter Tag den nächsten Stopp legt, rechnet `earliestGoodStart` selbst
  // aus — dieselbe Aufrundung, die der Optimierer verwendet —, statt die 15 hier
  // aus SNAP_MIN_FINE nachzubauen: eine Formel neben der Funktion ist eine
  // zweite Antwort auf dieselbe Frage. Das Ziel des Probe-Legs liefert nur die
  // Geometrie, die Startzeit geht nicht ein.
  const packedStart = earliestGoodStart(from(600, 45), legBetween(from(600, 45), to(700), band));
  test('ein gepackter Tag legt den nächsten Stopp auf 11:00', packedStart, 660);

  // 660 − 645 = 15 Minuten Lücke, davon 9 Ceiling: 6 Minuten Slack, zwei Fünftel
  // des Bandes.
  test(
    'und dieser Rundungsrest gegen ein echtes Band ist knapp',
    legBetween(from(600, 45), to(packedStart), band).verdict,
    'tight'
  );

  // Lücke 21, Ceiling 9 → 12 Minuten Slack, also 80 % des Bandes: über drei
  // Vierteln (11,25) und unter dem ganzen. Genau hier entscheidet sich, gegen
  // WELCHEN Anteil geurteilt wird — ein Fall unterhalb jeder erwogenen Schwelle
  // wäre unter allen grün und pinnte nichts.
  test(
    'vier Fünftel des Bandes reichen nicht — gemessen wird gegen das ganze',
    legBetween(from(600, 45), to(666), band).verdict,
    'tight'
  );

  // Und auseinandergezogen läuft die Leiter durch: ein volles Band Slack ist
  // gut, zwei sind großzügig.
  test(
    'ein ganzes Band Slack ist gut',
    legBetween(from(600, 45), to(645 + 9 + band), band).verdict,
    'good'
  );
  test(
    'zwei Bänder Slack sind großzügig',
    legBetween(from(600, 45), to(645 + 9 + 2 * band), band).verdict,
    'generous'
  );
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
