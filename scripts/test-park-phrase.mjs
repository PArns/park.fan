/**
 * Unit tests for the German park phrase (`lib/i18n/park-phrase.ts`).
 *
 * Run: `pnpm test:park-phrase`
 *
 * German interpolation of a park name is an inflection, not a substitution, and
 * the copy used to hard-code the preposition: `im {park}`. That is right for the
 * Europa-Park and the Phantasialand and wrong for everything else — "im Cedar
 * Point", "im Alton Towers" — because most park names take no article at all.
 * The three cases below are the ones a naive prefix cannot produce: the `in dem`
 * → `im` contraction, the feminine that must NOT contract, and the empty
 * article that must not leave a stray space.
 */
import assert from 'node:assert/strict';
import { parkPhrase } from '../lib/i18n/park-phrase.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('parkPhrase — German');

test('contracts in + dem to im', () => {
  assert.equal(parkPhrase('de', 'in', 'Phantasialand', 'das'), 'im Phantasialand');
  assert.equal(parkPhrase('de', 'in', 'Europa-Park', 'der'), 'im Europa-Park');
});

test('does not contract in + der, which is why this is not a prefix', () => {
  assert.equal(parkPhrase('de', 'in', 'Movie World', 'die'), 'in der Movie World');
});

test('leaves the article out for the names that take none', () => {
  // The majority of the catalogue, and what `im {park}` got wrong for ~180 parks.
  assert.equal(parkPhrase('de', 'in', 'Cedar Point', null), 'in Cedar Point');
  assert.equal(parkPhrase('de', 'in', 'Toverland', undefined), 'in Toverland');
});

test('inflects the accusative after für', () => {
  assert.equal(parkPhrase('de', 'for', 'Europa-Park', 'der'), 'für den Europa-Park');
  assert.equal(parkPhrase('de', 'for', 'Efteling', 'das'), 'für das Efteling');
  assert.equal(parkPhrase('de', 'for', 'Gardaland', null), 'für Gardaland');
});

test('capitalises a subject, and drops it where there is no article', () => {
  assert.equal(parkPhrase('de', 'subject', 'Phantasialand', 'das'), 'Das Phantasialand');
  assert.equal(parkPhrase('de', 'subject', 'Toverland', null), 'Toverland');
});

test('ignores a value that is not one of the three articles', () => {
  // The API drops those too; this is the second line of the same defence.
  assert.equal(parkPhrase('de', 'in', 'Toverland', 'ein'), 'in Toverland');
});

console.log('parkPhrase — the other five locales');

test('uses the fixed preposition their strings already carried', () => {
  assert.equal(parkPhrase('en', 'in', 'Efteling', 'das'), 'at Efteling');
  assert.equal(parkPhrase('nl', 'in', 'Efteling', 'das'), 'in Efteling');
  assert.equal(parkPhrase('fr', 'in', 'Parc Astérix', null), 'à Parc Astérix');
  assert.equal(parkPhrase('it', 'for', 'Gardaland', null), 'per Gardaland');
});

test('never inflects outside German', () => {
  // The article is a German fact. Handing it to another locale would be a bug
  // in the other direction.
  assert.equal(parkPhrase('en', 'subject', 'Phantasialand', 'das'), 'Phantasialand');
});

console.log(`\n${passed} passed`);
