/**
 * Unit tests for the search ranking the site and the admin share (`lib/utils/search-ranking.ts`)
 * and the admin's merge of fuzzy and exact hits (`app/admin/_lib/search-hits.ts`).
 *
 * What is pinned: a whole-name match beats a prefix beats an inner match beats a typo only the
 * API found; punctuation and accents fold; equal scores put operating first and otherwise keep
 * their order; one entity found by both searches is listed once with the admin's fields and the
 * site's status; an exact curated-name hit outranks a fuzzy guess; a loaded list gains the
 * entries the fuzzy search found in its own order, never twice and never one it does not hold.
 *
 * Run: `pnpm test:search-hits`
 */
import assert from 'node:assert/strict';
import { rankByMatch, searchMatchScore } from '../lib/utils/search-ranking.ts';
import { mergeSearchHits, withFuzzyMatches } from '../app/admin/_lib/search-hits.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('whole name, then prefix, then inside, then typo', () => {
  assert.equal(searchMatchScore('Taron', 'taron'), 100);
  assert.equal(searchMatchScore('Blue Fire Megacoaster', 'blue fir'), 50);
  assert.equal(searchMatchScore('Europa-Park', 'park'), 30);
  assert.equal(searchMatchScore('Phantasialand', 'phantsialand'), 0);
});

test('punctuation and accents fold', () => {
  assert.equal(searchMatchScore('F.L.Y.', 'fly'), 100);
  assert.equal(searchMatchScore('Fårup Sommerland', 'farup'), 50);
});

test('equal scores put operating first and keep their order otherwise', () => {
  const ranked = rankByMatch(
    [
      { name: 'Taron Kids', status: 'CLOSED' },
      { name: 'Taron Shop' },
      { name: 'Taron Express', status: 'OPERATING' },
    ],
    'taron'
  ).map(({ item }) => item.name);
  assert.deepEqual(ranked, ['Taron Express', 'Taron Kids', 'Taron Shop']);
});

test('one entity found twice is listed once, admin fields and site status', () => {
  const merged = mergeSearchHits(
    [{ id: 'a', name: 'Phantasialand', status: 'OPERATING' }],
    [{ id: 'a', name: 'Phantasialand', upstreamName: 'Phantasialand Brühl' }],
    'phantsialand'
  );
  assert.deepEqual(merged, [
    { id: 'a', name: 'Phantasialand', status: 'OPERATING', upstreamName: 'Phantasialand Brühl' },
  ]);
});

test('an exact admin hit outranks a fuzzy guess', () => {
  const merged = mergeSearchHits(
    [{ id: 'f', name: 'Toverland', status: 'OPERATING' }],
    [{ id: 'e', name: 'Taron' }],
    'taron'
  ).map((hit) => hit.id);
  assert.deepEqual(merged, ['e', 'f']);
});

test('a loaded list gains the fuzzy hits it holds, in fuzzy order, once', () => {
  const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const result = withFuzzyMatches([pool[0]], pool, ['c', 'a', 'x', 'b'], (item) => item.id);
  assert.deepEqual(
    result.map((item) => item.id),
    ['a', 'c', 'b']
  );
});

console.log(`\n${passed} passed`);
