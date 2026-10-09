/**
 * Unit tests for `lib/navigation/blog-menu-search.ts`, the search field in the header's guides
 * panel, plus a grep over the route that serves its list.
 *
 * What is pinned: every word of the query has to match; a word in the title outranks the same
 * word in a teaser; accents, case and "ß" fold; a fragment that only sits inside a word counts
 * from four letters on, so German compounds answer and "dis" does not find "Paradis"; equal scores
 * keep the panel's recency order. The grep pins what the panel cannot check from the browser: the
 * route lists articles only, and its cache window agrees with next.config.ts, where Vercel and
 * `next dev` resolve a disagreement in opposite directions.
 *
 * Run: `pnpm test:blog-menu-search`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isBlogMenuQuery, searchBlogMenu } from '../lib/navigation/blog-menu-search.ts';

let passed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`FAIL  ${name}\n      ${error.message}`);
  }
}

/** An index entry with only the fields the search reads. */
const entry = (path, title, { category = 'Guides', excerpt = '', terms } = {}) => ({
  path,
  title,
  category,
  excerpt,
  terms,
  date: '2026-10-01',
  updated: false,
  readingTimeMinutes: 5,
});

// In the panel's order: most recently touched first.
const INDEX = [
  entry('/blog/disneyland-paris-halloween', 'Halloween im Disneyland Paris', {
    excerpt: 'Paraden, Shows und die Wartezeiten im Oktober.',
  }),
  entry('/blog/jahreskarte', 'Jahreskarten im Vergleich', {
    excerpt: 'Efteling, Europa-Park, Toverland und Phantasialand.',
  }),
  entry('/blog/hansa-park', 'Hansa-Park: Tipps für den Tag', {
    excerpt: 'Wann es leer ist.',
    terms: 'Hansa-Park Tipps Sierksdorf Der Schwur des Kärnan',
  }),
  entry('/blog/regen', 'Freizeitpark bei Regen', {
    excerpt: 'Welche Bahnen im Disneyland Paris und anderswo überdacht sind.',
  }),
  entry('/blog/kompass', 'Der Kompass im Park', { category: 'park.fan' }),
  entry('/blog/parc-asterix', 'Parc Astérix: Wartezeiten', {
    excerpt: 'Die Gallier, ein Paradis für Familien.',
  }),
  entry('/blog/strasse', 'Die Straße der Achterbahnen'),
];

const paths = (result) => result.matches.map((match) => match.path);

// ---------------------------------------------------------------------------
// When the panel searches at all
// ---------------------------------------------------------------------------

await test('one letter is not a query', () => {
  assert.equal(isBlogMenuQuery('d'), false);
  assert.deepEqual(searchBlogMenu(INDEX, 'd'), { matches: [], total: 0 });
});

await test('punctuation and spaces are not letters', () => {
  assert.equal(isBlogMenuQuery(' - '), false);
  assert.equal(isBlogMenuQuery('a b'), true);
});

// ---------------------------------------------------------------------------
// What matches
// ---------------------------------------------------------------------------

await test('every word has to match', () => {
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'disneyland halloween')), [
    '/blog/disneyland-paris-halloween',
  ]);
});

await test('a title hit outranks a teaser hit, whatever the recency', () => {
  // The rain guide names Disneyland Paris only in its teaser.
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'disneyland')), [
    '/blog/disneyland-paris-halloween',
    '/blog/regen',
  ]);
});

await test('accents and case fold', () => {
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'ASTERIX')), ['/blog/parc-asterix']);
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'karnan')), ['/blog/hansa-park']);
});

await test('"ß" folds to "ss"', () => {
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'strasse')), ['/blog/strasse']);
});

await test('keywords and tags are searched without being shown', () => {
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'sierksdorf')), ['/blog/hansa-park']);
});

await test('the category is searched', () => {
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'park.fan')), ['/blog/kompass']);
});

await test('a fragment inside a word counts from four letters on', () => {
  // German compounds: „Jahreskarten" holds „karte".
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'karte')), ['/blog/jahreskarte']);
  // Three letters inside a word are noise: "dis" starts "Disneyland" but only sits in "Paradis".
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'dis')), [
    '/blog/disneyland-paris-halloween',
    '/blog/regen',
  ]);
});

await test('a word that starts a word outranks the same word inside one', () => {
  // "Park" starts a word in the compass guide's title and sits inside „Freizeitpark".
  const found = paths(searchBlogMenu(INDEX, 'park'));
  assert.ok(found.indexOf('/blog/kompass') < found.indexOf('/blog/regen'));
});

await test('equal scores keep the panel order', () => {
  // Three titles carry „im" and score alike; the rain guide has it in its teaser only.
  assert.deepEqual(paths(searchBlogMenu(INDEX, 'im')), [
    '/blog/disneyland-paris-halloween',
    '/blog/jahreskarte',
    '/blog/kompass',
    '/blog/regen',
  ]);
});

await test('the limit cuts the list, the total does not', () => {
  const result = searchBlogMenu(INDEX, 'die', 1);
  assert.equal(result.matches.length, 1);
  assert.ok(result.total > 1);
});

await test('nothing found is an empty list', () => {
  assert.deepEqual(searchBlogMenu(INDEX, 'xyzzy'), { matches: [], total: 0 });
});

// ---------------------------------------------------------------------------
// The route
// ---------------------------------------------------------------------------

const route = readFileSync(
  new URL('../app/api/nav/articles/[locale]/route.ts', import.meta.url),
  'utf8'
);
const menu = readFileSync(new URL('../lib/navigation/blog-menu.ts', import.meta.url), 'utf8');
const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');

await test('the route serves articles only, never news', () => {
  assert.match(route, /getBlogMenuSearchIndex\(/);
  const index = menu.slice(menu.indexOf('export function getBlogMenuSearchIndex'));
  assert.match(index, /listArticlesByRecency\(locale\)/);
});

await test('the route and next.config agree on the cache window', () => {
  const inRoute = route.match(/cdnCacheHeaders\('([^']+)'\)/)?.[1];
  const inConfig = config.match(
    /source: '\/api\/nav\/articles\/:locale',\s*headers: sharedCache\('([^']+)'\)/
  )?.[1];
  assert.ok(inRoute, 'no cdnCacheHeaders value in the route');
  assert.equal(inConfig, inRoute);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
