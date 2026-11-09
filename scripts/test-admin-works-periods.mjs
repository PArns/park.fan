/**
 * Unit tests for the admin's works-period editor logic (`app/admin/_lib/works-periods.ts`): the
 * checks that mirror the API's 400s, the order a list is saved in, and which of the old
 * single-window fields the editor hides.
 *
 * Run: `pnpm test:admin-works-periods`
 */
import assert from 'node:assert/strict';
import {
  MAX_WORKS_PERIODS,
  isHiddenCuratedField,
  sortWorksPeriods,
  worksPeriodsError,
} from '../app/admin/_lib/works-periods.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const p = (from, to, toUncertain = false) => ({ from, to, toUncertain });

test('an empty list and separate windows are valid', () => {
  assert.equal(worksPeriodsError([]), null);
  assert.equal(
    worksPeriodsError([p('2027-01-04', '2027-03-25'), p('2026-11-09', '2026-11-20', true)]),
    null
  );
});

test('a window needs at least one bound', () => {
  assert.match(worksPeriodsError([p(null, null)]), /Zeile 1/);
});

test('from after to is rejected, the same day is allowed', () => {
  assert.match(worksPeriodsError([p('2026-03-04', '2026-03-03')]), /liegt nach/);
  assert.equal(worksPeriodsError([p('2026-03-03', '2026-03-03')]), null);
});

test('an estimated end needs an end', () => {
  assert.match(worksPeriodsError([p('2026-03-04', null, true)]), /Ende geschätzt/);
});

test('inclusive bounds: touching on the same day overlaps, the next day does not', () => {
  assert.match(
    worksPeriodsError([p('2026-01-01', '2026-01-10'), p('2026-01-10', '2026-01-20')]),
    /überschneiden/
  );
  assert.equal(worksPeriodsError([p('2026-01-01', '2026-01-10'), p('2026-01-11', null)]), null);
});

test('an open end overlaps everything after it, an open start everything before', () => {
  assert.match(
    worksPeriodsError([p('2026-01-01', null), p('2027-05-01', '2027-05-02')]),
    /überschneiden/
  );
  assert.equal(worksPeriodsError([p('2026-06-01', '2026-06-02'), p(null, '2026-01-01')]), null);
  assert.match(
    worksPeriodsError([p(null, '2026-06-01'), p('2026-05-01', '2026-05-02')]),
    /überschneiden/
  );
});

test('a window inside a long one overlaps, even when a short one sits between them', () => {
  assert.match(
    worksPeriodsError([
      p('2026-01-01', '2026-12-31'),
      p('2026-02-01', '2026-02-02'),
      p('2026-06-01', '2026-06-02'),
    ]),
    /überschneiden/
  );
});

test('more than the cap is rejected', () => {
  const many = Array.from({ length: MAX_WORKS_PERIODS + 1 }, (_, i) =>
    p(`2030-01-${String(i + 1).padStart(2, '0')}`, `2030-01-${String(i + 1).padStart(2, '0')}`)
  );
  assert.match(worksPeriodsError(many), /Höchstens/);
  assert.equal(worksPeriodsError(many.slice(0, MAX_WORKS_PERIODS)), null);
});

test('sorting: by start, an open start first, and it does not mutate', () => {
  const list = [p('2027-01-04', '2027-03-25'), p(null, '2026-01-01'), p('2026-11-09', null)];
  assert.deepEqual(sortWorksPeriods(list), [list[1], list[2], list[0]]);
  assert.equal(list[0].from, '2027-01-04');
});

test('legacy fields hide by flag, or by key next to a periods field in the same group', () => {
  const field = (key, extra = {}) => ({ key, type: 'date', group: 'Wartung', ...extra });
  const periods = field('curatedOutOfServicePeriods', { type: 'periods' });
  const from = field('curatedOutOfServiceFrom');
  assert.equal(isHiddenCuratedField(from, [from, periods]), true);
  assert.equal(isHiddenCuratedField(from, [from]), false);
  assert.equal(isHiddenCuratedField(periods, [from, periods]), false);
  assert.equal(isHiddenCuratedField(field('x', { legacy: true }), []), true);
  assert.equal(isHiddenCuratedField(field('x', { hidden: true }), []), true);
});

console.log(`\n${passed} passed`);
