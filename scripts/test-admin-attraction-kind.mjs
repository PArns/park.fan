/**
 * Unit tests for the admin's attraction-kind helpers (`lib/admin/attraction-kind.ts`): every kind
 * has a German name and a later one shows as itself, only an attraction kind gets labels, a row
 * shows the editor's kind before the API's derived one and never a stale curated copy, and the
 * admin list's kind columns give the served kinds.
 *
 * Run: `pnpm test:admin-attraction-kind`
 */
import assert from 'node:assert/strict';
import {
  attractionKindLabel,
  curatedEnumOptions,
  curatedFieldOptions,
  servedKindsFromList,
  shownAttractionKind,
} from '../lib/admin/attraction-kind.ts';
import { reportPassed, test } from './lib/run-cases.mjs';

test('every kind the API lists has a German name, GAME included', () => {
  for (const kind of ['RIDE', 'TRANSPORT', 'SHOW', 'WALKTHROUGH', 'MAZE', 'GAME']) {
    assert.notEqual(attractionKindLabel(kind), kind, kind);
  }
  assert.equal(attractionKindLabel('GAME'), 'Spiel');
});

test('a kind the API adds later shows as itself, an inherited key too', () => {
  assert.equal(attractionKindLabel('FLUME'), 'FLUME');
  assert.equal(attractionKindLabel('toString'), 'toString');
});

test('enum options: labels for the kind only, in the order given', () => {
  assert.deepEqual(curatedEnumOptions('attractionKind', ['SHOW', 'FLUME']), [
    { value: 'SHOW', label: 'Show' },
    { value: 'FLUME', label: 'FLUME' },
  ]);
  assert.deepEqual(curatedEnumOptions('indoorOutdoor', ['indoor']), [
    { value: 'indoor', label: 'indoor' },
  ]);
  assert.deepEqual(curatedEnumOptions('attractionKind', undefined), []);
});

test('field options come from the descriptor of that key, empty before it loads', () => {
  const specs = [
    { key: 'indoorOutdoor', options: ['indoor', 'outdoor'] },
    { key: 'attractionKind', options: ['RIDE', 'GAME'] },
  ];
  assert.deepEqual(
    curatedFieldOptions(specs, 'attractionKind').map((option) => option.label),
    ['Fahrgeschäft', 'Spiel']
  );
  assert.deepEqual(curatedFieldOptions(undefined, 'attractionKind'), []);
  assert.deepEqual(curatedFieldOptions(specs, 'hasSingleRider'), []);
});

test("the editor's kind wins over the derived one", () => {
  assert.deepEqual(shownAttractionKind('TRANSPORT', { kind: 'RIDE', source: 'derived' }), {
    kind: 'TRANSPORT',
    derived: false,
  });
  assert.deepEqual(shownAttractionKind('MAZE', undefined), { kind: 'MAZE', derived: false });
});

test('without an editor, the derived kind shows and says so', () => {
  assert.deepEqual(shownAttractionKind(null, { kind: 'SHOW', source: 'derived' }), {
    kind: 'SHOW',
    derived: true,
  });
});

test('a served curated kind the row no longer stores, or no kind at all, shows nothing', () => {
  assert.equal(shownAttractionKind(null, { kind: 'RIDE', source: 'curated' }), null);
  assert.equal(shownAttractionKind(undefined, undefined), null);
  assert.equal(shownAttractionKind('', { kind: '', source: 'derived' }), null);
});

test("the list's kind columns give the served kind by who decided it", () => {
  const rows = [
    {
      id: 'a',
      attractionKind: null,
      derivedAttractionKind: 'SHOW',
      attractionKindSource: 'derived',
    },
    {
      id: 'b',
      attractionKind: 'TRANSPORT',
      derivedAttractionKind: 'RIDE',
      attractionKindSource: 'curated',
    },
    { id: 'c', attractionKind: null, derivedAttractionKind: null, attractionKindSource: null },
  ];
  assert.deepEqual(servedKindsFromList(rows), {
    a: { kind: 'SHOW', source: 'derived' },
    b: { kind: 'TRANSPORT', source: 'curated' },
  });
  assert.deepEqual(shownAttractionKind(null, servedKindsFromList(rows).a), {
    kind: 'SHOW',
    derived: true,
  });
});

test('rows not loaded yet, or an empty list, give an empty map', () => {
  assert.deepEqual(servedKindsFromList(undefined), {});
  assert.deepEqual(servedKindsFromList([]), {});
});

reportPassed();
