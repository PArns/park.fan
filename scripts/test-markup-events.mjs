/**
 * Unit tests for what marked markup reports through `MarkupEventTracker`: which click on a link
 * inside a block marked with `linkBlockAttributes` becomes `internal_link_clicked` and with which
 * properties (`lib/analytics/internal-link.ts`), which click on the planner tile becomes
 * `trip_tile_clicked` (`lib/analytics/trip-tile.ts`), and which `toggle` of an FAQ row becomes
 * `faq_opened` (`lib/analytics/faq-open.ts`).
 *
 * Run: pnpm test:markup-events
 */
import assert from 'node:assert/strict';

// The modules check `instanceof Element`; in Node the stand-ins below pass as objects.
globalThis.Element = Object;

const { internalLinkClickOf, linkBlockAttributes, linkEntityAttributes } =
  await import('../lib/analytics/internal-link.ts');
const { faqOpenedOf, faqPositionAttributes } = await import('../lib/analytics/faq-open.ts');
const { tripTileAttributes, tripTileClickOf, tripTileLinkAttributes } =
  await import('../lib/analytics/trip-tile.ts');

const ORIGIN = 'https://park.fan';
const PARK = '313CA334-C04F-4855-BFD9-C8BEB7A00D98';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/**
 * A minimal element tree: `closest` for a tag, `a[href]` or `[attribute]`, `contains`,
 * `querySelectorAll('a[href]')` in document order, and an anchor's `origin` and `pathname`.
 */
function element(tag, attrs = {}, parent = null) {
  const node = {
    tag,
    attrs,
    parent,
    children: [],
    getAttribute: (name) => attrs[name] ?? null,
    contains(other) {
      for (let at = other; at; at = at.parent) if (at === node) return true;
      return false;
    },
    closest(selector) {
      for (let at = node; at; at = at.parent) {
        if (selector === 'a[href]' && at.tag === 'a' && at.attrs.href) return at;
        if (selector === at.tag) return at;
        const attr = /^\[([\w-]+)\]$/.exec(selector)?.[1];
        if (attr && attr in at.attrs) return at;
      }
      return null;
    },
    querySelectorAll(selector) {
      assert.equal(selector, 'a[href]');
      const found = [];
      const walk = (at) => {
        for (const child of at.children) {
          if (child.tag === 'a' && child.attrs.href) found.push(child);
          walk(child);
        }
      };
      walk(node);
      return found;
    },
  };
  if (tag === 'a' && attrs.href) {
    const url = new URL(attrs.href, ORIGIN);
    node.origin = url.origin;
    node.pathname = url.pathname;
  }
  parent?.children.push(node);
  return node;
}

test('a link inside a block names the block, the kind of page and its place', () => {
  const block = element('div', linkBlockAttributes('related'));
  element('a', { href: '/de/blog/europa-park-guide' }, block);
  const second = element('a', { href: '/de/news/phantasialand-petition' }, block);
  const title = element('span', {}, second);
  assert.deepEqual(internalLinkClickOf(title, ORIGIN), {
    props: { block: 'related', dest: 'news', position: '2' },
  });
});

test('two anchors to one page are one place, and a card names its park', () => {
  const block = element('div', linkBlockAttributes('parks'));
  const card = element('div', linkEntityAttributes(PARK), block);
  element('a', { href: '/de/parks/europe/germany/bruehl/phantasialand' }, card);
  const name = element('a', { href: '/de/parks/europe/germany/bruehl/phantasialand' }, card);
  const other = element('div', {}, block);
  const next = element('a', { href: '/de/parks/europe/germany/rust/europa-park' }, other);
  assert.deepEqual(internalLinkClickOf(name, ORIGIN), {
    props: { block: 'parks', dest: 'park', position: '1' },
    entity: PARK.toLowerCase(),
  });
  assert.deepEqual(internalLinkClickOf(next, ORIGIN), {
    props: { block: 'parks', dest: 'park', position: '2' },
  });
});

test('the closest block wins, so the tags under the text are not the text', () => {
  const body = element('div', linkBlockAttributes('body'));
  const tags = element('footer', linkBlockAttributes('tags'), body);
  const tag = element('a', { href: '/de/blog/tag/halloween' }, tags);
  assert.equal(internalLinkClickOf(tag, ORIGIN).props.block, 'tags');
});

test('nothing for a link outside any block, another site, a button in a card or an unknown block', () => {
  const loose = element('a', { href: '/de/parks' });
  assert.equal(internalLinkClickOf(loose, ORIGIN), null);

  const block = element('div', linkBlockAttributes('body'));
  const away = element('a', { href: 'https://www.phantasialand.de/' }, block);
  assert.equal(internalLinkClickOf(away, ORIGIN), null);

  const card = element('a', { href: '/de/parks/europe/germany/rust/europa-park' }, block);
  const star = element('svg', {}, element('button', {}, card));
  assert.equal(internalLinkClickOf(star, ORIGIN), null);

  const unknown = element('div', { 'data-link-block': 'sidebar' });
  const inside = element('a', { href: '/de/parks' }, unknown);
  assert.equal(internalLinkClickOf(inside, ORIGIN), null);

  assert.equal(internalLinkClickOf(null, ORIGIN), null);
});

test('an entity outside the block is not the card of the link', () => {
  const page = element('main', linkEntityAttributes(PARK));
  const block = element('nav', linkBlockAttributes('breadcrumbs'), page);
  const crumb = element('a', { href: '/de/parks/europe/germany' }, block);
  assert.deepEqual(internalLinkClickOf(crumb, ORIGIN), {
    props: { block: 'breadcrumbs', dest: 'geo', position: '1' },
  });
});

test('only a UUID is an entity', () => {
  assert.deepEqual(linkEntityAttributes('city:bruehl'), {});
  assert.deepEqual(linkEntityAttributes(undefined), {});
});

test('an FAQ row that opens reports its place; a closing row and other details report nothing', () => {
  const row = { ...element('details', faqPositionAttributes(2)), open: true };
  assert.deepEqual(faqOpenedOf(row), { position: 3 });
  assert.equal(faqOpenedOf({ ...row, open: false }), null);
  const other = { ...element('details'), open: true };
  assert.equal(faqOpenedOf(other), null);
  assert.equal(faqOpenedOf(null), null);
});

test('a hub question reports its key beside its place, which moves with the data', () => {
  const row = { ...element('details', faqPositionAttributes(0, 'accuracy')), open: true };
  assert.deepEqual(faqOpenedOf(row), { position: 1, key: 'accuracy' });
});

test('the planner tile: both links are one place, and only the tile event tells them apart', () => {
  const tile = element('aside', {
    ...tripTileAttributes('orlando'),
    ...linkBlockAttributes('trip_tile'),
    ...linkEntityAttributes(PARK),
  });
  const plan = element(
    'a',
    { href: '/de/orlando?parks=magic-kingdom-park#planner', ...tripTileLinkAttributes('plan') },
    tile
  );
  const calendar = element(
    'a',
    { href: '/de/orlando', ...tripTileLinkAttributes('calendar') },
    tile
  );
  const label = element('span', {}, plan);
  assert.deepEqual(internalLinkClickOf(label, ORIGIN), {
    props: { block: 'trip_tile', dest: 'trip_hub', position: '1' },
    entity: PARK.toLowerCase(),
  });
  assert.equal(internalLinkClickOf(calendar, ORIGIN).props.position, '1');
  assert.deepEqual(tripTileClickOf(label), {
    props: { region: 'orlando', link: 'plan' },
    entity: PARK.toLowerCase(),
  });
  assert.deepEqual(tripTileClickOf(calendar).props, { region: 'orlando', link: 'calendar' });
});

test('nothing for a tile link outside a tile, an unknown link or a slug of another shape', () => {
  const loose = element('a', { href: '/de/orlando', ...tripTileLinkAttributes('plan') });
  assert.equal(tripTileClickOf(loose), null);
  const tile = element('aside', tripTileAttributes('orlando'));
  const odd = element('a', { href: '/de/orlando', 'data-trip-tile-link': 'parky' }, tile);
  assert.equal(tripTileClickOf(odd), null);
  const forged = element('aside', tripTileAttributes('Orlando <b>'));
  const link = element('a', { href: '/de/orlando', ...tripTileLinkAttributes('plan') }, forged);
  assert.equal(tripTileClickOf(link), null);
  assert.equal(tripTileClickOf(null), null);
});

console.log(`\n${passed} cases passed.`);
