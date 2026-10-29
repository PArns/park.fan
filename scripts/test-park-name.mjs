/**
 * Unit tests for `nameWithAbbreviations` (`lib/utils.ts`): the park page's H1 and meta description
 * carry the abbreviations a park is searched by, „Europa-Park (EP)", and nothing for a park the API
 * sends none for.
 *
 * Run: `pnpm test:park-name`
 */
import assert from 'node:assert/strict';
import { nameWithAbbreviations } from '../lib/utils.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test('one abbreviation follows the name in brackets', () => {
  assert.equal(nameWithAbbreviations('Europa-Park', ['EP']), 'Europa-Park (EP)');
});

test('several are joined with a comma', () => {
  assert.equal(
    nameWithAbbreviations('Universal Studios Singapore', ['USS', 'RWS']),
    'Universal Studios Singapore (USS, RWS)'
  );
});

test('a park without any keeps its bare name', () => {
  assert.equal(nameWithAbbreviations('Phantasialand', undefined), 'Phantasialand');
  assert.equal(nameWithAbbreviations('Phantasialand', []), 'Phantasialand');
});

console.log(`\n${passed} assertions passed.`);
