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
  buildRideDragPayload,
  parseRideDrag,
  rideFromPath,
  rideFromUrl,
  serializeRideDrag,
} from '../lib/planner/ride-drag.ts';

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
test(
  'a park page is refused',
  rideFromPath('/de/parks/europe/germany/bruehl/phantasialand'),
  null
);
// THE photo bug. Grabbing a card by its picture drags the image, and the image
// lives under /media with no `parks` segment anywhere in it.
test('an image URL is refused', rideFromPath('/media/phantasialand/taron.jpg'), null);
test('an unrelated path is refused', rideFromPath('/de/blog/halloween-2026'), null);
test('an empty path is refused', rideFromPath(''), null);

// ── 2. text/uri-list ─────────────────────────────────────────────────────────
// The format is a LIST with optional comment lines, so the first real line is
// the one that counts. Read whole, a leading comment made the URL unparseable.
{
  const list = '# a comment\r\nhttps://park.fan/de/parks/europe/germany/bruehl/phantasialand/taron\r\n';
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
