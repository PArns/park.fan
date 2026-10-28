/**
 * Unit tests for `createSearchSession` (`lib/analytics/search-session.ts`), the per-opening
 * counting every search surface sends through: one `search_opened` per opening, at most one
 * `search_typed` and one `search_no_results` in it, and a click outside an opening opening one,
 * so the admin's click and no-result rates stay between 0 and 1.
 *
 * Run: `pnpm test:search-session`
 */
import assert from 'node:assert/strict';
import { createSearchSession } from '../lib/analytics/search-session.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** A session on `surface` and the events it sent, as `[name, props]` pairs. */
function recorded(surface) {
  const sent = [];
  const session = createSearchSession(surface, (name, props) => sent.push([name, props]));
  return { session, sent };
}

test('a focus that follows a blur is a new opening; a second focus in one opening is not', () => {
  const { session, sent } = recorded('hero');
  session.open();
  session.open();
  session.close();
  session.open();
  assert.deepEqual(sent, [
    ['search_opened', { surface: 'hero' }],
    ['search_opened', { surface: 'hero' }],
  ]);
});

test('an opening types once and finds nothing once, however many queries it runs', () => {
  const { session, sent } = recorded('header');
  session.open();
  session.typed();
  session.noResults();
  session.typed();
  session.noResults();
  assert.deepEqual(
    sent.map(([name]) => name),
    ['search_opened', 'search_typed', 'search_no_results']
  );
});

test('the next opening counts its query again', () => {
  const { session, sent } = recorded('listing_news');
  session.open();
  session.typed();
  session.close();
  session.open();
  session.typed();
  assert.equal(sent.filter(([name]) => name === 'search_typed').length, 2);
});

test('the palette opens as the way it was opened, and its events carry that surface', () => {
  const { session, sent } = recorded('header');
  session.open('keyboard');
  session.resultClicked('park', 0);
  session.close();
  session.open();
  session.viewAll();
  assert.deepEqual(sent, [
    ['search_opened', { surface: 'keyboard' }],
    ['search_result_clicked', { surface: 'keyboard', result: 'park', position: '1' }],
    ['search_opened', { surface: 'header' }],
    ['search_view_all', { surface: 'header' }],
  ]);
});

test('a tap on a resting row without an opening opens one first', () => {
  const { session, sent } = recorded('hero');
  session.browseClicked('nearby_park', 1);
  assert.deepEqual(sent, [
    ['search_opened', { surface: 'hero' }],
    ['search_browse_clicked', { surface: 'hero', item: 'nearby_park', position: '2' }],
  ]);
});

test('positions are 1-based buckets of the 0-based index', () => {
  const { session, sent } = recorded('search_page');
  for (const index of [0, 2, 3, 4, 5, 9, 10, 40]) session.resultClicked('guide', index);
  assert.deepEqual(
    sent.slice(1).map(([, props]) => props.position),
    ['1', '3', '4-5', '4-5', '6-10', '6-10', '11+', '11+']
  );
});

test('the step card counts as its own surface', () => {
  const { session, sent } = recorded('home_steps');
  session.typed();
  assert.deepEqual(sent, [
    ['search_opened', { surface: 'home_steps' }],
    ['search_typed', { surface: 'home_steps' }],
  ]);
});

console.log(`\n${passed} assertions passed.`);
