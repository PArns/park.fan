/**
 * Unit tests for `createSearchSession` (`lib/analytics/search-session.ts`), the per-opening
 * counting every search surface sends through: one `search_opened` per opening, at most one
 * `search_typed` and one `search_no_results` in it, a click before any opening opening one, and
 * a click after a close counting for the opening it closed, so the admin's click and no-result
 * rates stay between 0 and 1; a click naming the UUID it opened, and only a UUID. And whether a
 * search is open on the page (`lib/analytics/search-presence.ts`), which Parky searches along with.
 *
 * Run: `pnpm test:search-session`
 */
import assert from 'node:assert/strict';
import { createSearchSession, trackResultClick } from '../lib/analytics/search-session.ts';
import { createSearchPresence } from '../lib/analytics/search-presence.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** A session on `surface` and the events it sent, as `[name, props]` pairs, the entity third. */
function recorded(surface) {
  const sent = [];
  const session = createSearchSession(surface, (name, props, entity) =>
    sent.push(entity === undefined ? [name, props] : [name, props, entity])
  );
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

test('a tap on a resting row before any opening opens one first', () => {
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

test('a click after the field lost focus belongs to the opening it ended', () => {
  const { session, sent } = recorded('listing_guides');
  session.open();
  session.typed();
  // A click on a result blurs the field before the click lands.
  session.close();
  session.resultClicked('guide', 0);
  assert.deepEqual(
    sent.map(([name]) => name),
    ['search_opened', 'search_typed', 'search_result_clicked']
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

const PARK = '0B6F0D1C-6A49-4C38-9A2E-3F1D2B7C8E01';

test('a click names the park, ride or show it opened by UUID, and nothing else', () => {
  const { session, sent } = recorded('compare');
  session.resultClicked('park', 0, PARK);
  session.browseClicked('nearby_park', 1, PARK);
  session.resultClicked('location', 2, 'city:bruehl');
  session.resultClicked('guide', 0);
  assert.deepEqual(sent.slice(1), [
    [
      'search_result_clicked',
      { surface: 'compare', result: 'park', position: '1' },
      PARK.toLowerCase(),
    ],
    [
      'search_browse_clicked',
      { surface: 'compare', item: 'nearby_park', position: '2' },
      PARK.toLowerCase(),
    ],
    ['search_result_clicked', { surface: 'compare', result: 'location', position: '3' }],
    ['search_result_clicked', { surface: 'compare', result: 'guide', position: '1' }],
  ]);
});

/** A minimal element tree for `trackResultClick`: `closest`, `contains` and attributes. */
function element(tag, attrs = {}, parent = null) {
  const node = {
    tag,
    attrs,
    parent,
    pathname: attrs.href,
    getAttribute: (name) => attrs[name] ?? null,
    contains(other) {
      for (let at = other; at; at = at.parent) if (at === node) return true;
      return false;
    },
    closest(selector) {
      for (let at = node; at; at = at.parent) {
        if (selector === 'a[href]' && at.tag === 'a' && at.attrs.href) return at;
        if (selector === 'button' && at.tag === 'button') return at;
        const attr = /^\[([\w-]+)\]$/.exec(selector)?.[1];
        if (attr && attr in at.attrs) return at;
      }
      return null;
    },
  };
  return node;
}

test('a ride card opened from the hits is a click with its UUID; its alert bell is none', () => {
  // `trackResultClick` checks `instanceof Element`; in Node the stand-ins pass as objects.
  globalThis.Element = Object;
  const { session, sent } = recorded('park_rides');
  const row = element('li', {
    'data-search-result': 'attraction',
    'data-search-index': '2',
    'data-search-id': PARK,
  });
  const card = element('a', { href: '/de/parks/x/y' }, row);
  const name = element('span', {}, card);
  const bell = element('svg', {}, element('button', {}, card));
  trackResultClick(session, bell);
  trackResultClick(session, name);
  assert.deepEqual(sent.slice(1), [
    [
      'search_result_clicked',
      { surface: 'park_rides', result: 'attraction', position: '3' },
      PARK.toLowerCase(),
    ],
  ]);
});

test('a session reports each opening and each close once', () => {
  const changes = [];
  const session = createSearchSession(
    'hero',
    () => {},
    (open) => changes.push(open)
  );
  session.close();
  session.open();
  session.open();
  session.close();
  session.close();
  session.resultClicked('park', 0);
  assert.deepEqual(changes, [true, false]);
});

test('a search counts as open while an open session is on the page', () => {
  const presence = createSearchPresence();
  let heard = 0;
  presence.subscribe(() => heard++);
  const palette = {};
  const hero = {};
  presence.mount(palette);
  presence.mount(hero);
  assert.equal(presence.getSnapshot(), false);
  presence.setOpen(hero, true);
  presence.setOpen(palette, true);
  assert.equal(presence.getSnapshot(), true);
  presence.setOpen(hero, false);
  assert.equal(presence.getSnapshot(), true, 'the palette is still open');
  presence.setOpen(palette, false);
  assert.equal(presence.getSnapshot(), false);
  assert.equal(heard, 2, 'only a change from closed to open and back is news');
  assert.equal(presence.getServerSnapshot(), false);
});

test('a field that leaves the page open leaves no search behind; a remount brings it back', () => {
  const presence = createSearchPresence();
  const field = {};
  presence.mount(field);
  presence.setOpen(field, true);
  // Strict mode, or a navigation: unmounted while open.
  presence.unmount(field);
  assert.equal(presence.getSnapshot(), false);
  presence.mount(field);
  assert.equal(presence.getSnapshot(), true, 'the same session, still open, is back');
  presence.unmount(field);
  presence.setOpen(field, false);
  presence.mount(field);
  assert.equal(presence.getSnapshot(), false);
});

console.log(`\n${passed} assertions passed.`);
