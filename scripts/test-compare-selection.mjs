/**
 * Unit tests for the `parks` query value of `/compare` (`lib/compare/selection.ts`).
 *
 * The value is typed by hand, pasted from chats and sent by crawlers, so what matters is what the
 * parser refuses and that a shared link round-trips: `disneyland-park` is Paris and Anaheim.
 *
 * Run: `pnpm test:compare-selection`
 */
import assert from 'node:assert/strict';
import {
  MAX_COMPARE_PARKS,
  parseCompareParam,
  serializeCompare,
} from '../lib/compare/selection.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const park = (continent, country, city, parkSlug) => ({
  slug: `${continent}/${country}/${city}/${parkSlug}`,
  name: parkSlug,
  href: `/parks/${continent}/${country}/${city}/${parkSlug}`,
  continent,
  country,
  city,
  parkSlug,
});

test('reads bare slugs in the order written', () => {
  assert.deepEqual(parseCompareParam('europa-park,phantasialand'), [
    { slug: 'europa-park' },
    { slug: 'phantasialand' },
  ]);
});

test('reads the long form, with or without the /parks/ prefix', () => {
  const want = [{ slug: 'disneyland-park', geoPath: 'europe/france/paris' }];
  assert.deepEqual(parseCompareParam('europe/france/paris/disneyland-park'), want);
  assert.deepEqual(parseCompareParam('/parks/europe/france/paris/disneyland-park'), want);
});

test('drops empty, malformed and repeated entries', () => {
  assert.deepEqual(parseCompareParam(',, a/b ,efteling,efteling'), [{ slug: 'efteling' }]);
  assert.deepEqual(parseCompareParam(undefined), []);
  assert.deepEqual(parseCompareParam(''), []);
});

test('joins a repeated key instead of ignoring all but one', () => {
  assert.deepEqual(parseCompareParam(['a', 'b']), [{ slug: 'a' }, { slug: 'b' }]);
});

test(`keeps at most ${MAX_COMPARE_PARKS} parks`, () => {
  assert.equal(parseCompareParam('a,b,c,d,e,f').length, MAX_COMPARE_PARKS);
});

test('writes nothing for an empty selection', () => {
  assert.equal(serializeCompare([], new Set()), null);
});

test('writes the short form, and the long form for a shared slug', () => {
  const parks = [
    park('europe', 'germany', 'rust', 'europa-park'),
    park('europe', 'france', 'paris', 'disneyland-park'),
  ];
  const value = serializeCompare(parks, new Set(['disneyland-park']));
  assert.equal(value, 'europa-park,europe/france/paris/disneyland-park');
});

test('what is written is read back as the same parks', () => {
  const parks = [
    park('europe', 'germany', 'rust', 'europa-park'),
    park('north-america', 'united-states', 'anaheim', 'disneyland-park'),
  ];
  const value = serializeCompare(parks, new Set(['disneyland-park']));
  assert.deepEqual(parseCompareParam(value), [
    { slug: 'europa-park' },
    { slug: 'disneyland-park', geoPath: 'north-america/united-states/anaheim' },
  ]);
});

console.log(`\n${passed} passed`);
