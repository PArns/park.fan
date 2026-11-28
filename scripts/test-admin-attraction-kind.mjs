/**
 * Unit tests for the admin's attraction-kind helpers (`lib/admin/attraction-kind.ts`): every kind
 * has a German name and a later one shows as itself, only an attraction kind gets labels, a row
 * shows the editor's kind before the API's derived one and never a stale curated copy, the admin
 * list's kind columns give the served kinds or say they are missing, and a data-quality card takes
 * the report's ids or finds its rows by name and an empty kind.
 *
 * Run: `pnpm test:admin-attraction-kind`
 */
import assert from 'node:assert/strict';
import {
  attractionKindLabel,
  curatedEnumOptions,
  curatedFieldOptions,
  kindlessAttractions,
  rowsWithoutKind,
  servedKindsFromList,
  shownAttractionKind,
} from '../lib/admin/attraction-kind.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

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

test('the report names find the rows that store no kind, two of one name both', () => {
  const rows = [
    { id: 'a', name: 'Pools', attractionKind: null },
    { id: 'b', name: 'Main Train', attractionKind: null },
    { id: 'c', name: 'Main Train', attractionKind: undefined },
    { id: 'd', name: 'Abyssus', attractionKind: 'RIDE' },
    { id: 'e', name: 'Not listed', attractionKind: null },
  ];
  assert.deepEqual(
    rowsWithoutKind(['Abyssus', 'Main Train', 'Pools'], rows).map((row) => row.id),
    ['a', 'b', 'c']
  );
  assert.deepEqual(rowsWithoutKind([], rows), []);
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

test('a list without the kind columns asks for the fallback, an empty one does not', () => {
  assert.equal(
    servedKindsFromList([
      { id: 'a', attractionKind: 'RIDE' },
      { id: 'b', attractionKind: null },
    ]),
    null
  );
  assert.deepEqual(servedKindsFromList([]), {});
});

test("a card takes the report's ids where it sends them, and needs no list", () => {
  const entry = {
    withoutKind: ['Main Train'],
    withoutKindRefs: [{ id: 'x', name: 'Main Train', slug: 'main-train' }],
  };
  assert.deepEqual(kindlessAttractions(entry, undefined), [{ id: 'x', name: 'Main Train' }]);
});

test('without ids a card waits for the list, then matches names', () => {
  const entry = { withoutKind: ['Main Train'] };
  assert.equal(kindlessAttractions(entry, undefined), null);
  assert.deepEqual(
    kindlessAttractions(entry, [
      { id: 'b', name: 'Main Train', attractionKind: null },
      { id: 'd', name: 'Main Train', attractionKind: 'TRANSPORT' },
    ]),
    [{ id: 'b', name: 'Main Train' }]
  );
});

console.log(`admin-attraction-kind: ${passed} tests passed`);
