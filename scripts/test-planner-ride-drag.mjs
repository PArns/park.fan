/**
 * Unit tests for what a dragged ride carries (`lib/planner/ride-drag.ts`).
 *
 * Every failure mode here is silent. A drop that is refused looks exactly like
 * a drop the visitor aimed badly: the block does not appear, nothing is logged,
 * and there is nothing on screen to tell the two apart. Which is how the
 * feature shipped broken three ways at once — a photo grabbed instead of the
 * card put an image URL on the drag, a ride's name could only be read out of a
 * payload that answers 404, and the URL parser counted path segments from the
 * left on a route that carries a locale prefix in five of six locales.
 *
 * Run: pnpm test:planner-ride-drag
 */

import {
  PLANNER_RIDE_MIME,
  activeRideDrag,
  buildRideDragPayload,
  parseRideDrag,
  rememberRideDrag,
  rideFromPath,
  rideFromUrl,
  serializeRideDrag,
  coverOffset,
} from '../lib/planner/ride-drag.ts';
import { buildDayGrid, clampStart, rideFloor } from '../lib/planner/day-grid.ts';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

// ── 1. Reading a ride out of a path ─────────────────────────────────────────
// By name, never by index: the German route has a locale in front of `parks`
// and the English one does not, and counting from the left read `bruehl` as the
// park on one of them.
{
  const de = rideFromPath('/de/parks/europe/germany/bruehl/phantasialand/taron');
  test('the park comes from the segment after the city', de?.parkSlug, 'phantasialand');
  test('and the ride from the one after that', de?.attractionSlug, 'taron');

  const en = rideFromPath('/parks/europe/germany/bruehl/phantasialand/taron');
  test('no locale prefix reads the same', en?.parkSlug, 'phantasialand');
  test('and the same ride', en?.attractionSlug, 'taron');
}

// A park page is not a ride: one segment short, and dropping it would file an
// entry with the park's own slug as its ride.
test('a park page is refused', rideFromPath('/de/parks/europe/germany/bruehl/phantasialand'), null);
// THE photo bug. Grabbing a card by its picture drags the image, and the image
// lives under /media with no `parks` segment anywhere in it.
test('an image URL is refused', rideFromPath('/media/phantasialand/taron.jpg'), null);
test('an unrelated path is refused', rideFromPath('/de/blog/halloween-2026'), null);
test('an empty path is refused', rideFromPath(''), null);

// ── 2. text/uri-list ─────────────────────────────────────────────────────────
// The format is a LIST with optional comment lines, so the first real line is
// the one that counts. Read whole, a leading comment made the URL unparseable.
{
  const list =
    '# a comment\r\nhttps://park.fan/de/parks/europe/germany/bruehl/phantasialand/taron\r\n';
  test('a comment line is skipped', rideFromUrl(list)?.attractionSlug, 'taron');
}
test(
  'a relative href resolves',
  rideFromUrl('/de/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac')
    ?.parkSlug,
  'europa-park'
);
test('an empty transfer is refused', rideFromUrl(''), null);
test('junk is refused', rideFromUrl('not a url at all'), null);

// ── 3. The payload ──────────────────────────────────────────────────────────
// Lowercase, because a DataTransfer lowercases every format it is handed: a
// mixed-case constant would be written under one key and read under another,
// and `getData` would answer an empty string forever.
test('the MIME type is lowercase', PLANNER_RIDE_MIME, PLANNER_RIDE_MIME.toLowerCase());

{
  const round = parseRideDrag(
    serializeRideDrag({
      parkSlug: 'phantasialand',
      attractionSlug: 'taron',
      attractionName: 'Taron',
    })
  );
  test('a payload survives the round trip', round?.attractionName, 'Taron');
  test('with its park', round?.parkSlug, 'phantasialand');
}

// Refused rather than repaired: a nameless block would render as an empty bar,
// which is worse than a drop that does not land.
test('junk is not a payload', parseRideDrag('{'), null);
test('an empty string is not a payload', parseRideDrag(''), null);
test('null is not a payload', parseRideDrag(null), null);
test('an array is not a payload', parseRideDrag('[]'), null);
test(
  'a missing name is refused',
  parseRideDrag('{"parkSlug":"phantasialand","attractionSlug":"taron"}'),
  null
);
test(
  'an empty name is refused',
  parseRideDrag('{"parkSlug":"p","attractionSlug":"t","attractionName":""}'),
  null
);
test(
  'a non-string name is refused',
  parseRideDrag('{"parkSlug":"p","attractionSlug":"t","attractionName":42}'),
  null
);
{
  const long = 'x'.repeat(400);
  const cut = parseRideDrag(
    serializeRideDrag({ parkSlug: 'p', attractionSlug: 't', attractionName: long })
  );
  test('a name is capped', cut?.attractionName.length, 120);
}

// ── 4. What the bridge builds off a card ────────────────────────────────────
{
  const ok = buildRideDragPayload({
    slug: 'taron',
    name: 'Taron',
    href: '/de/parks/europe/germany/bruehl/phantasialand/taron',
  });
  test('a card with both attributes drags', ok?.attractionName, 'Taron');
  test('and the park comes from its href', ok?.parkSlug, 'phantasialand');
}
test(
  'a card with no name does not drag',
  buildRideDragPayload({
    slug: 'taron',
    href: '/de/parks/europe/germany/bruehl/phantasialand/taron',
  }),
  null
);
// The href is the authority on which ride this is. An attribute left over from
// a re-render must not file one ride under another.
test(
  'a slug that disagrees with the href does not drag',
  buildRideDragPayload({
    slug: 'black-mamba',
    name: 'Black Mamba',
    href: '/de/parks/europe/germany/bruehl/phantasialand/taron',
  }),
  null
);
test(
  'a park card does not drag',
  buildRideDragPayload({
    slug: 'phantasialand',
    name: 'Phantasialand',
    href: '/de/parks/europe/germany/bruehl/phantasialand',
  }),
  null
);
test(
  'whitespace is not a name',
  buildRideDragPayload({
    slug: 'taron',
    name: '   ',
    href: '/de/parks/europe/germany/bruehl/phantasialand/taron',
  }),
  null
);

// ── 5. The chip's thumbnail, framed like the card it came from ──────────────
// The drag chip draws its picture into a canvas, so `object-fit: cover` and
// `object-position` are not doing the framing any more — this pair is. A focal
// point a curator set on a ride's photograph has to survive into a 32 px box,
// or the chip shows the middle of a picture that was aimed at a coaster.
const offset = (value) => coverOffset(value).join(',');

test('nothing named is the centre', offset(undefined), '0.5,0.5');
test('an empty string is the centre', offset(''), '0.5,0.5');
test('the top edge', offset('50% 0%'), '0.5,0');
test('the bottom right', offset('100% 100%'), '1,1');
test('a curated focal point', offset('30% 20%'), '0.3,0.2');
// `getComputedStyle` normalises a keyword pair to percentages, so a keyword
// arriving here means somebody passed a raw authored value.
test('a keyword is not a percentage and does not guess', offset('center top'), '0.5,0.5');
// A LENGTH is an offset in the source element's own box and means something
// else entirely in a 32 px one, so it falls back rather than being reused.
test('a length falls back to the centre', offset('12px 4px'), '0.5,0.5');
test('one value applies to both axes', offset('25%'), '0.25,0.25');
// Nothing on the page should produce these, but the value is a string off the
// CSSOM and a negative or over-100 % offset would draw the picture off the box.
test('past the right edge is clamped', offset('140% 50%'), '1,0.5');
test('a negative offset is clamped', offset('-30% 50%'), '0,0.5');
test('a value that is not a number is the centre', offset('abc% 50%'), '0.5,0.5');

// ── 6. The preview and the drop land on the same floor ──────────────────────
// The bug this is written for is a promise the app broke by itself: `onDrop`
// clamps a dropped ride to `rideFloor().softMin`, `onDragOver` clamped to the
// park's opening, so the line drawn under the pointer named a minute the
// release could not use. Taron opens at 11:00 in a park that opens at 09:00 —
// the preview offered 09:00 and the block appeared at 11:00.
//
// The two halves are asserted against the SAME function the two handlers call,
// with the slug arriving the way each of them gets it: the preview from
// `activeRideDrag`, the drop from the payload on the DataTransfer. What the
// pair proves is that the two paths cannot answer differently — a floor read
// off one of them and not the other is the defect itself.
const GRID = buildDayGrid(9, 18);
const TARON = {
  attractionSlug: 'taron',
  attractionName: 'Taron',
  opensAt: '11:00',
  hours: [],
  sampleDays: 0,
};
const DAY_RIDES = [TARON];
/** The grid's own lookup, copied by neither handler: both call this one. */
const floorForSlug = (slug) =>
  rideFloor(
    GRID,
    DAY_RIDES.find((ride) => ride.attractionSlug === slug)
  ).softMin;

const DRAG = {
  parkSlug: 'phantasialand',
  attractionSlug: 'taron',
  attractionName: 'Taron',
};
/** 09:30 — before the ride opens, which is the minute the bug was visible at. */
const POINTER_MINUTE = 570;

rememberRideDrag(DRAG);
test('a drag remembers itself for the handler that cannot read it', activeRideDrag(), DRAG);

// `dragover`: the slug comes from the remembered drag, and the park is checked
// the way the grid checks it — a ride from another park is a floor this day
// knows nothing about.
const remembered = activeRideDrag();
const previewFloor =
  remembered && remembered.parkSlug === 'phantasialand'
    ? floorForSlug(remembered.attractionSlug)
    : GRID.openMin;
// `drop`: the slug comes off the DataTransfer, which is the one channel that
// survives a drag from another tab.
const dropped = parseRideDrag(serializeRideDrag(DRAG));
const dropFloor = floorForSlug(dropped.attractionSlug);

test('the preview clamps to the ride, not to the park', previewFloor, 660);
test('the drop clamps to the same minute', dropFloor, previewFloor);
test(
  'so a pointer at 09:30 previews where the drop puts it',
  clampStart(GRID, POINTER_MINUTE, previewFloor),
  clampStart(GRID, POINTER_MINUTE, dropFloor)
);
// And the control: the value the preview used to pass. Without it the three
// assertions above would pass over a ride whose own opening IS the park's.
test(
  'the old preview floor was a different minute',
  clampStart(GRID, POINTER_MINUTE, GRID.openMin) === clampStart(GRID, POINTER_MINUTE, dropFloor),
  false
);

// A ride belonging to another park is refused rather than looked up: `rideFloor`
// with no ride answers the park's opening, which is where the line was before.
const FOREIGN = { ...DRAG, parkSlug: 'europa-park', attractionSlug: 'voltron-nevera' };
rememberRideDrag(FOREIGN);
const foreign = activeRideDrag();
test(
  'a ride from another park falls back to the park opening',
  foreign.parkSlug === 'phantasialand' ? floorForSlug(foreign.attractionSlug) : GRID.openMin,
  GRID.openMin
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
console.log(`\n${cases.length - failed}/${cases.length} bestanden`);
process.exit(failed === 0 ? 0 : 1);
