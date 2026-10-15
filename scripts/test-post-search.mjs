/**
 * Unit tests for `lib/navigation/post-search.ts`, the site search over the guides and the news (the
 * guides panel, the fields on `/blog` and `/news`, the palette and `/search`), plus a grep over the
 * route that serves its list.
 *
 * What is pinned: every word of the query has to match; a word in the title outranks the same
 * word in a teaser; accents, case and "ß" fold; a fragment that only sits inside a word counts
 * from four letters on, so German compounds answer and "dis" does not find "Paradis"; equal scores
 * keep the index's order; a post is found by the parks whose pages list it, below a title hit and
 * above a teaser hit; the palette's split keeps articles and news apart and says whether the best
 * of each carries the query in its title, which decides where the palette ranks the group. The grep pins what a
 * browser cannot check: the route lists articles and news, the guides panel and `/blog` narrow it
 * to the articles, and its cache window agrees with next.config.ts, where Vercel and `next dev`
 * resolve a disagreement in opposite directions.
 *
 * Run: `pnpm test:post-search`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isPostQuery, searchPosts, searchPostsBySection } from '../lib/navigation/post-search.ts';

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
const entry = (path, title, { category = 'Guides', excerpt = '', terms, parks, news } = {}) => ({
  path,
  title,
  category,
  excerpt,
  terms,
  parks,
  ...(news && { news: true }),
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
  assert.equal(isPostQuery('d'), false);
  assert.deepEqual(searchPosts(INDEX, 'd'), { matches: [], total: 0 });
});

await test('punctuation and spaces are not letters', () => {
  assert.equal(isPostQuery(' - '), false);
  assert.equal(isPostQuery('a b'), true);
});

// ---------------------------------------------------------------------------
// What matches
// ---------------------------------------------------------------------------

await test('every word has to match', () => {
  assert.deepEqual(paths(searchPosts(INDEX, 'disneyland halloween')), [
    '/blog/disneyland-paris-halloween',
  ]);
});

await test('a title hit outranks a teaser hit, whatever the recency', () => {
  // The rain guide names Disneyland Paris only in its teaser.
  assert.deepEqual(paths(searchPosts(INDEX, 'disneyland')), [
    '/blog/disneyland-paris-halloween',
    '/blog/regen',
  ]);
});

await test('accents and case fold', () => {
  assert.deepEqual(paths(searchPosts(INDEX, 'ASTERIX')), ['/blog/parc-asterix']);
  assert.deepEqual(paths(searchPosts(INDEX, 'karnan')), ['/blog/hansa-park']);
});

await test('"ß" folds to "ss"', () => {
  assert.deepEqual(paths(searchPosts(INDEX, 'strasse')), ['/blog/strasse']);
});

await test('keywords and tags are searched without being shown', () => {
  assert.deepEqual(paths(searchPosts(INDEX, 'sierksdorf')), ['/blog/hansa-park']);
});

await test('the category is searched', () => {
  assert.deepEqual(paths(searchPosts(INDEX, 'park.fan')), ['/blog/kompass']);
});

await test('a fragment inside a word counts from four letters on', () => {
  // German compounds: „Jahreskarten" holds „karte".
  assert.deepEqual(paths(searchPosts(INDEX, 'karte')), ['/blog/jahreskarte']);
  // Three letters inside a word are noise: "dis" starts "Disneyland" but only sits in "Paradis".
  assert.deepEqual(paths(searchPosts(INDEX, 'dis')), [
    '/blog/disneyland-paris-halloween',
    '/blog/regen',
  ]);
});

await test('a word that starts a word outranks the same word inside one', () => {
  // "Park" starts a word in the compass guide's title and sits inside „Freizeitpark".
  const found = paths(searchPosts(INDEX, 'park'));
  assert.ok(found.indexOf('/blog/kompass') < found.indexOf('/blog/regen'));
});

await test('equal scores keep the panel order', () => {
  // Three titles carry „im" and score alike; the rain guide has it in its teaser only.
  assert.deepEqual(paths(searchPosts(INDEX, 'im')), [
    '/blog/disneyland-paris-halloween',
    '/blog/jahreskarte',
    '/blog/kompass',
    '/blog/regen',
  ]);
});

await test('the limit cuts the list, the total does not', () => {
  const result = searchPosts(INDEX, 'die', 1);
  assert.equal(result.matches.length, 1);
  assert.ok(result.total > 1);
});

await test('nothing found is an empty list', () => {
  assert.deepEqual(searchPosts(INDEX, 'xyzzy'), { matches: [], total: 0 });
});

// ---------------------------------------------------------------------------
// The parks a post is linked to, and the two sections
// ---------------------------------------------------------------------------

// Articles by recency, then the news, as `getPostSearchIndex` orders them.
const LINKED = [
  entry('/blog/single-rider', 'Single Rider in Freizeitparks', {
    parks: 'europa park efteling disneyland park',
  }),
  entry('/blog/disneyland-paris', 'Disneyland Paris: Wartezeiten und Tipps', {
    parks: 'disneyland park disney adventure world',
  }),
  entry('/blog/regen', 'Freizeitpark bei Regen', {
    excerpt: 'Welche Bahnen im Disneyland Paris überdacht sind.',
  }),
  entry('/news/schlossbruecke', 'Brücke zum Dornröschenschloss öffnet wieder', {
    category: 'News',
    parks: 'disneyland park',
    news: true,
  }),
  entry('/news/efteling-silvester', 'Efteling feiert Silvester', {
    category: 'News',
    parks: 'efteling',
    news: true,
  }),
];

await test('a park whose page lists the post finds it, whatever the title says', () => {
  assert.deepEqual(paths(searchPosts(LINKED, 'disneyland', LINKED.length)), [
    '/blog/disneyland-paris',
    '/blog/single-rider',
    '/news/schlossbruecke',
    '/blog/regen',
  ]);
});

await test('a park link ranks below a title hit and above a teaser hit', () => {
  const found = paths(searchPosts(LINKED, 'disneyland', LINKED.length));
  assert.ok(found.indexOf('/blog/disneyland-paris') < found.indexOf('/blog/single-rider'));
  assert.ok(found.indexOf('/blog/single-rider') < found.indexOf('/blog/regen'));
});

await test('the sections keep articles and news apart, each cut, each counted', () => {
  const { articles, news } = searchPostsBySection(LINKED, 'disneyland', 2);
  assert.deepEqual(paths(articles), ['/blog/disneyland-paris', '/blog/single-rider']);
  assert.equal(articles.total, 3);
  assert.deepEqual(paths(news), ['/news/schlossbruecke']);
  assert.equal(news.total, 1);
});

await test('a section nothing matched is empty, not missing', () => {
  const { articles, news } = searchPostsBySection(LINKED, 'silvester', 3);
  assert.deepEqual(articles, { matches: [], total: 0, titleMatch: false });
  assert.deepEqual(paths(news), ['/news/efteling-silvester']);
});

await test('a section says whether its best match carries the query in its title', () => {
  // The guide's title names Disneyland; the news post is found by its park only.
  const { articles, news } = searchPostsBySection(LINKED, 'disneyland', 3);
  assert.equal(articles.titleMatch, true);
  assert.equal(news.titleMatch, false);
  // Every word has to be in the title, not one of them.
  assert.equal(searchPostsBySection(LINKED, 'disneyland single', 3).articles.titleMatch, false);
  assert.equal(searchPostsBySection(LINKED, 'single rider', 3).articles.titleMatch, true);
});

// ---------------------------------------------------------------------------
// The route
// ---------------------------------------------------------------------------

const route = readFileSync(
  new URL('../app/api/nav/posts/[locale]/route.ts', import.meta.url),
  'utf8'
);
const menu = readFileSync(new URL('../lib/navigation/blog-menu.ts', import.meta.url), 'utf8');
const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
const scopes = readFileSync(
  new URL('../lib/hooks/use-post-search-index.ts', import.meta.url),
  'utf8'
);
const panel = readFileSync(
  new URL('../components/layout/blog-menu-panel.tsx', import.meta.url),
  'utf8'
);
const blogIndex = readFileSync(
  new URL('../components/blog/blog-index-page.tsx', import.meta.url),
  'utf8'
);

await test('the route serves the articles and the news, with their parks', () => {
  assert.match(route, /getPostSearchIndex\(/);
  const index = menu.slice(menu.indexOf('export function getPostSearchIndex'));
  assert.match(index, /listArticlesByRecency\(locale\)/);
  assert.match(index, /listNewsByDate\(locale\)/);
  assert.match(menu, /getParkSlugsOfPost\(post\.translationKey\)/);
});

await test('the guides panel and /blog search the articles only', () => {
  assert.match(scopes, /articles: \(posts\) => posts\.filter\(\(post\) => !post\.news\)/);
  assert.match(panel, /usePostSearchIndex\(armed, 'articles'\)/);
  assert.match(blogIndex, /<ListingSearch scope="articles">/);
});

await test('the route and next.config agree on the cache window', () => {
  const inRoute = route.match(/cdnCacheHeaders\('([^']+)'\)/)?.[1];
  const inConfig = config.match(
    /source: '\/api\/nav\/posts\/:locale',\s*headers: sharedCache\('([^']+)'\)/
  )?.[1];
  assert.ok(inRoute, 'no cdnCacheHeaders value in the route');
  assert.equal(inConfig, inRoute);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
