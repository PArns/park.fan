/**
 * Unit tests for the curated transport list (`lib/utils/transport-attractions.ts`)
 * — the two predicates that decide whether the „Transportsystem" badge says
 * anything at all.
 *
 * The case worth pinning hardest is the spelling. PAR-343 was written against
 * „Stroomtrein Oost"; the API serves `stoomtrein-oost`. A curated list holding
 * the first spelling renders no badge, throws nothing and passes every other
 * check in this repo, so the slug is asserted here against the value read from
 * `/v1/parks/europe/netherlands/kaatsheuvel/efteling` on 2026-09-21.
 *
 * Run: `pnpm test:transport-attractions`
 */
import assert from 'node:assert/strict';
import {
  TRANSPORT_ATTRACTIONS,
  isTransportAttraction,
  isTransportAttractionPath,
  attractionPathSlugs,
} from '../lib/utils/transport-attractions.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('Efteling’s east steam-train station is curated, spelled as the API spells it', () => {
  assert.ok(
    TRANSPORT_ATTRACTIONS.some(
      (e) => e.parkSlug === 'efteling' && e.attractionSlug === 'stoomtrein-oost'
    ),
    'expected { efteling, stoomtrein-oost } in TRANSPORT_ATTRACTIONS'
  );
  assert.equal(isTransportAttraction('efteling', 'stoomtrein-oost'), true);
});

test('the ticket’s spelling is NOT what the list holds — one o, not "ro"', () => {
  assert.equal(isTransportAttraction('efteling', 'stroomtrein-oost'), false);
});

test('no entry carries a slug that is empty, uppercased or path-shaped', () => {
  for (const { parkSlug, attractionSlug } of TRANSPORT_ATTRACTIONS) {
    for (const slug of [parkSlug, attractionSlug]) {
      assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `not a slug: ${JSON.stringify(slug)}`);
    }
  }
});

test('every entry is unique — a duplicate pair is a curation mistake, not a second badge', () => {
  const seen = new Set(TRANSPORT_ATTRACTIONS.map((e) => `${e.parkSlug}/${e.attractionSlug}`));
  assert.equal(seen.size, TRANSPORT_ATTRACTIONS.length);
});

test('the pair is matched, not the ride slug alone', () => {
  // `monorail` and `gondoletta` exist in more than one park. Curating one
  // park's must never mark another park's.
  assert.equal(isTransportAttraction('phantasialand', 'stoomtrein-oost'), false);
  assert.equal(isTransportAttraction('efteling', 'baron-1898'), false);
});

test('a missing park or ride slug claims nothing', () => {
  assert.equal(isTransportAttraction(null, 'stoomtrein-oost'), false);
  assert.equal(isTransportAttraction(undefined, 'stoomtrein-oost'), false);
  assert.equal(isTransportAttraction('efteling', null), false);
  assert.equal(isTransportAttraction('efteling', undefined), false);
  assert.equal(isTransportAttraction('', ''), false);
});

test('a ride the algorithm did not promote is still curated — the badge is not gated on the crown', () => {
  // Measured 2026-09-21: `stoomtrein-oost` reads isHeadliner false, and the
  // station is a station either way. This assertion exists so that nobody
  // later "fixes" the list by pruning non-headliners.
  assert.equal(isTransportAttraction('efteling', 'stoomtrein-oost'), true);
});

test('an attraction path yields both slugs', () => {
  assert.deepEqual(
    attractionPathSlugs('/parks/europe/netherlands/kaatsheuvel/efteling/stoomtrein-oost'),
    { parkSlug: 'efteling', attractionSlug: 'stoomtrein-oost' }
  );
  assert.equal(
    isTransportAttractionPath('/parks/europe/netherlands/kaatsheuvel/efteling/stoomtrein-oost'),
    true
  );
});

test('a query string or hash on the path does not hide the badge', () => {
  assert.equal(
    isTransportAttractionPath(
      '/parks/europe/netherlands/kaatsheuvel/efteling/stoomtrein-oost#waits'
    ),
    true
  );
  assert.equal(
    isTransportAttractionPath('/parks/europe/netherlands/kaatsheuvel/efteling/stoomtrein-oost?a=1'),
    true
  );
});

test('a park path is not an attraction path — one segment short is null, not the park', () => {
  assert.equal(attractionPathSlugs('/parks/europe/netherlands/kaatsheuvel/efteling'), null);
  assert.equal(isTransportAttractionPath('/parks/europe/netherlands/kaatsheuvel/efteling'), false);
});

test('a deeper path is not an attraction path either', () => {
  assert.equal(
    attractionPathSlugs(
      '/parks/europe/netherlands/kaatsheuvel/efteling/stoomtrein-oost/wait-time-calendar'
    ),
    null
  );
});

test('`#` — what getHref answers when it has nothing to link to — yields null', () => {
  assert.equal(attractionPathSlugs('#'), null);
  assert.equal(isTransportAttractionPath('#'), false);
});

test('a path that is not under /parks/ yields null', () => {
  assert.equal(attractionPathSlugs('/de/parks/europe/netherlands/kaatsheuvel/efteling/x'), null);
  assert.equal(attractionPathSlugs('/blog/efteling/stoomtrein-oost'), null);
  assert.equal(attractionPathSlugs(''), null);
  assert.equal(attractionPathSlugs(null), null);
  assert.equal(attractionPathSlugs(undefined), null);
});

test('an empty segment is refused rather than collapsed', () => {
  // Dropping empty segments and then counting would read `efteling` and
  // `stoomtrein-oost` out of a path that names six things, not five, and mark
  // whatever happened to land in the last two positions.
  assert.equal(
    attractionPathSlugs('/parks/europe/netherlands//kaatsheuvel/efteling/stoomtrein-oost'),
    null
  );
  assert.equal(
    attractionPathSlugs('/parks/europe/netherlands/kaatsheuvel/efteling/stoomtrein-oost/'),
    null
  );
});

console.log(`\n${passed} assertions passed.`);
