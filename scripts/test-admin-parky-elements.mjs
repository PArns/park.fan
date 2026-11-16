/**
 * Unit tests for `/admin/assistant`'s element table (`lib/admin/parky-elements.ts`): the two
 * crosstabs become one row per element and kind, in the catalogue's order, with the click rate.
 *
 * Run: pnpm test:admin-parky-elements
 */
import assert from 'node:assert/strict';
import { parkyElementRows } from '../lib/admin/parky-elements.ts';
import { PARKY_ELEMENT_KINDS } from '../lib/analytics/parky-elements.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
}

const table = (cells) => ({
  row: 'prop:element',
  col: 'prop:kind',
  rows: [],
  cols: [],
  cells: cells.map(([row, col, count]) => ({ row, col, count })),
  total: cells.reduce((sum, [, , count]) => sum + count, 0),
});

const knownCount = Object.values(PARKY_ELEMENT_KINDS).reduce((n, kinds) => n + kinds.length, 0);

test('every known kind has a line, in the catalogue order, even with nothing counted', () => {
  const rows = parkyElementRows(table([]), table([]));
  assert.equal(rows.length, knownCount);
  assert.deepEqual(rows[0], {
    element: 'stamp',
    kind: 'walk_on',
    seen: 0,
    clicked: 0,
    rate: null,
  });
  assert.deepEqual(
    rows.map((row) => row.element),
    Object.entries(PARKY_ELEMENT_KINDS).flatMap(([element, kinds]) => kinds.map(() => element))
  );
});

test('seen and clicked meet in one row, with clicked / seen as the rate', () => {
  const rows = parkyElementRows(
    table([
      ['stamp', 'walk_on', 200],
      ['tip', 'bad', 40],
    ]),
    table([
      ['stamp', 'walk_on', 10],
      ['tip', 'bad', 4],
    ])
  );
  const walkOn = rows.find((row) => row.element === 'stamp' && row.kind === 'walk_on');
  assert.equal(walkOn.seen, 200);
  assert.equal(walkOn.clicked, 10);
  assert.equal(walkOn.rate, 0.05);
  assert.equal(rows.find((row) => row.kind === 'bad').rate, 0.1);
});

test('a click without a view has no rate rather than an infinite one', () => {
  const rows = parkyElementRows(table([]), table([['empty', 'search', 3]]));
  const search = rows.find((row) => row.kind === 'search');
  assert.equal(search.clicked, 3);
  assert.equal(search.rate, null);
});

test('a kind the site no longer sends, or `other`, comes after the known ones', () => {
  const rows = parkyElementRows(table([['other', 'other', 7]]), table([]));
  assert.equal(rows.length, knownCount + 1);
  assert.deepEqual(rows.at(-1), {
    element: 'other',
    kind: 'other',
    seen: 7,
    clicked: 0,
    rate: 0,
  });
});

console.log(`admin parky elements: ${passed} passed`);
