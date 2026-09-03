/**
 * Unit tests for which notifications a plan asks for (`lib/planner/push-topics.ts`)
 * and for the geography a nearby answer hides in its URLs (`lib/planner/park-url.ts`).
 *
 * Both are silent when wrong. A topic set that resolves to nothing produces a
 * switch reading "on" that receives no push at all — indistinguishable from a
 * quiet day — and a geo that fails to parse makes the in-park offer render
 * nothing, which looks exactly like not being in a park.
 *
 * Run: pnpm test:planner-push-topics
 */

import { resolvePushTopics } from '../lib/planner/push-topics.ts';
import { parkGeoFromUrl } from '../lib/planner/park-url.ts';

const cases = [];
const test = (name, actual, expected) =>
  cases.push({ name, actual: JSON.stringify(actual), expected: JSON.stringify(expected) });

// ── 1. Resolving the wanted topics ──────────────────────────────────────────
const ALL = ['next-up', 'show-times', 'ride-status'];

test('never chosen means everything the deploy offers', resolvePushTopics(ALL, null), ALL);
test('a narrowing is kept', resolvePushTopics(ALL, ['next-up', 'ride-status']), [
  'next-up',
  'ride-status',
]);
// A stored id the API has since retired must not resurrect itself.
test('a retired id is dropped', resolvePushTopics(ALL, ['next-up', 'gone']), ['next-up']);
// A topic added after the visitor last chose is INCLUDED rather than silently
// missed — the intersection is against the deploy's list, and this is the case
// that argues for it: somebody who once ticked two boxes should still hear about
// a third kind the API grows into. (This is the deliberate looseness: they can
// untick it.)
test(
  'an id chosen before the deploy offered it is simply absent',
  resolvePushTopics(['next-up'], ['next-up', 'wait-change']),
  ['next-up']
);
// The fence: an empty result would be a subscription that receives nothing.
test('unticking everything falls back to everything', resolvePushTopics(ALL, []), ALL);
test('no overlap at all falls back too', resolvePushTopics(ALL, ['nothing-here']), ALL);
test('an empty deploy list stays empty', resolvePushTopics([], ['next-up']), []);

// ── 2. Reading the geography out of a URL ───────────────────────────────────
// The `in_park` answer carries no park URL — checked against the running
// endpoint — so the geo comes off a ride's API URL, which has `/v1` where a
// frontend path has a locale or nothing.
test(
  'API ride URL',
  parkGeoFromUrl('/v1/parks/europe/germany/bruehl/phantasialand/attractions/taron'),
  { continent: 'europe', country: 'germany', city: 'bruehl' }
);
test(
  'frontend park URL with a locale',
  parkGeoFromUrl('/de/parks/europe/germany/bruehl/phantasialand'),
  {
    continent: 'europe',
    country: 'germany',
    city: 'bruehl',
  }
);
test(
  'frontend park URL without a locale',
  parkGeoFromUrl('/parks/europe/germany/bruehl/phantasialand'),
  {
    continent: 'europe',
    country: 'germany',
    city: 'bruehl',
  }
);
test(
  'absolute URL',
  parkGeoFromUrl('https://park.fan/en/parks/europe/netherlands/kaatsheuvel/efteling'),
  {
    continent: 'europe',
    country: 'netherlands',
    city: 'kaatsheuvel',
  }
);
test('a path with no parks segment', parkGeoFromUrl('/de/blog/etwas'), null);
test('a truncated path', parkGeoFromUrl('/parks/europe/germany'), null);
test('nothing at all', parkGeoFromUrl(null), null);

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — erwartet ${expected}, bekommen ${actual}`}`
  );
}
console.log(`\n${cases.length - failed}/${cases.length} bestanden`);
process.exit(failed === 0 ? 0 : 1);
