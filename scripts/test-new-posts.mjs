/**
 * Unit tests for `lib/blog/new-posts.ts` — what the new-posts toast counts as new, and when the
 * watcher may ask again.
 *
 * Two things are pinned here that the first version got wrong or left implicit:
 *
 *   - **News counts.** The teaser surfaces keep news apart from the articles (`isNewsPost`), the
 *     toast does not: it announces what arrived. A news post published after another one on the
 *     same day is new.
 *   - **The check expires.** It ran once per `sessionStorage` session, and a tab that stays open
 *     (or is restored by the browser, or is an installed app) keeps that session for days — a
 *     reload after a news deploy asked nothing, only a new tab did. It is now a timestamp in
 *     `localStorage` that allows one request per `CHECK_INTERVAL_MS`, across tabs.
 *
 * The last block is a grep over the watcher and the route: the interval is worth nothing if the
 * watcher still reads the session flag, and "news counts" is worth nothing if the route filters
 * news out before the browser ever sees it.
 *
 * Run: `pnpm test:new-posts`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storage = new Map();
let storageThrows = false;

globalThis.localStorage = {
  getItem: (key) => {
    if (storageThrows) throw new Error('site data blocked');
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem: (key, value) => {
    if (storageThrows) throw new Error('site data blocked');
    storage.set(key, String(value));
  },
  removeItem: (key) => {
    if (storageThrows) throw new Error('site data blocked');
    storage.delete(key);
  },
};

const { CHECK_INTERVAL_MS, CHECKED_AT_STORAGE_KEY, claimCheck, readSeen, unseenPosts, writeSeen } =
  await import('../lib/blog/new-posts.ts');

function reset() {
  storage.clear();
  storageThrows = false;
}

const post = (key, date, category = 'News') => ({
  key,
  path: `/blog/${key}`,
  title: key,
  date,
  category,
});

// The German list on 2026-09-23 at 08:46, when the toast went live: one news post on top.
const MORNING = [
  post('traumatica-ten-years', '2026-09-23'),
  post('hansa-park-guide', '2026-09-22', 'Guides'),
  post('heide-park-guide', '2026-09-20', 'Guides'),
  post('disneyland-paris-guide', '2026-09-11', 'Guides'),
  post('walibi-belgium-guide', '2026-09-11', 'Guides'),
  post('trip-planner-launch', '2026-09-05', 'Neu auf park.fan'),
];

// The same list after the Halloween news deploy at 11:37, as the route sorts it.
const NOON = [
  post('disneyland-paris-halloween-2026', '2026-09-23'),
  post('movie-park-germany-halloween-horror-festival-2026', '2026-09-23'),
  post('plopsaland-deutschland-fright-nights-2026', '2026-09-23'),
  post('traumatica-ten-years', '2026-09-23'),
  post('hansa-park-guide', '2026-09-22', 'Guides'),
  post('heide-park-guide', '2026-09-20', 'Guides'),
];

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

// ---------------------------------------------------------------------------
// What is new — news included
// ---------------------------------------------------------------------------

await test('news published later the same day is new', () => {
  reset();
  writeSeen(MORNING);
  const fresh = unseenPosts(readSeen(), NOON);
  assert.deepEqual(
    fresh.map((p) => p.key),
    [
      'disneyland-paris-halloween-2026',
      'movie-park-germany-halloween-horror-festival-2026',
      'plopsaland-deutschland-fright-nights-2026',
    ]
  );
});

await test('a news post already seen is not announced again', () => {
  reset();
  writeSeen(MORNING);
  assert.equal(
    unseenPosts(readSeen(), NOON).some((p) => p.key === 'traumatica-ten-years'),
    false
  );
});

await test('news and articles arriving together are both new', () => {
  reset();
  writeSeen(NOON);
  const next = [
    post('europa-park-halloween-2026', '2026-09-24'),
    post('phantasialand-winter-guide', '2026-09-24', 'Guides'),
    ...NOON.slice(0, 4),
  ];
  assert.deepEqual(
    unseenPosts(readSeen(), next).map((p) => p.key),
    ['europa-park-halloween-2026', 'phantasialand-winter-guide']
  );
});

await test('a post that only dropped out of the list is not new when it comes back', () => {
  reset();
  writeSeen(MORNING);
  // `walibi-belgium-guide` was in the morning list; `winter-parks-2026` never was, but it is
  // older than the newest post the visitor saw, so it did not arrive since.
  const back = [...NOON.slice(0, 4), post('winter-parks-2026', '2026-09-03', 'Guides')];
  assert.deepEqual(
    unseenPosts(readSeen(), back).map((p) => p.key),
    [
      'disneyland-paris-halloween-2026',
      'movie-park-germany-halloween-horror-festival-2026',
      'plopsaland-deutschland-fright-nights-2026',
    ]
  );
});

await test('the record is the list it was written from', () => {
  reset();
  writeSeen(NOON);
  assert.deepEqual(readSeen(), { newest: '2026-09-23', keys: NOON.map((p) => p.key) });
});

// ---------------------------------------------------------------------------
// When the watcher may ask
// ---------------------------------------------------------------------------

const T0 = Date.UTC(2026, 8, 23, 9, 0);

await test('the first check is allowed, and claims the interval', () => {
  reset();
  assert.equal(claimCheck(T0), true);
  assert.equal(storage.get(CHECKED_AT_STORAGE_KEY), String(T0));
});

await test('a second trigger inside the interval does not ask', () => {
  reset();
  claimCheck(T0);
  assert.equal(claimCheck(T0 + 1), false);
  assert.equal(claimCheck(T0 + CHECK_INTERVAL_MS - 1), false);
});

await test('the same tab asks again once the interval has passed', () => {
  // The case the session flag missed: a reload in a tab that has been open since the morning.
  reset();
  claimCheck(T0);
  assert.equal(claimCheck(T0 + CHECK_INTERVAL_MS), true);
  assert.equal(claimCheck(T0 + CHECK_INTERVAL_MS + 1), false);
});

await test('a check stamped in the future does not block', () => {
  reset();
  storage.set(CHECKED_AT_STORAGE_KEY, String(T0 + 24 * 60 * 60_000));
  assert.equal(claimCheck(T0), true);
});

await test('an unreadable stamp does not block', () => {
  reset();
  storage.set(CHECKED_AT_STORAGE_KEY, 'yesterday');
  assert.equal(claimCheck(T0), true);
});

await test('storage that throws never asks', () => {
  reset();
  storageThrows = true;
  assert.equal(claimCheck(T0), false);
});

// ---------------------------------------------------------------------------
// The callers
// ---------------------------------------------------------------------------

const watcher = readFileSync(
  new URL('../components/blog/new-posts-watcher.tsx', import.meta.url),
  'utf8'
);
const route = readFileSync(
  new URL('../app/api/blog-latest/[locale]/route.ts', import.meta.url),
  'utf8'
);
const config = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');

await test('the watcher asks through claimCheck, not a session flag', () => {
  assert.match(watcher, /claimCheck\(\)/);
  assert.doesNotMatch(watcher, /sessionStorage/);
});

await test('the watcher asks again when a tab comes back to the front', () => {
  assert.match(watcher, /visibilitychange/);
});

await test('the route lists news like every other post', () => {
  assert.match(route, /listPosts\(locale\)/);
  assert.doesNotMatch(route, /isNewsPost|listArticlesByRecency|NEWS_CATEGORY/);
});

await test('the route and next.config agree on the cache window', () => {
  const inRoute = route.match(/cdnCacheHeaders\('([^']+)'\)/)?.[1];
  const inConfig = config.match(
    /source: '\/api\/blog-latest\/:locale',\s*headers: sharedCache\('([^']+)'\)/
  )?.[1];
  assert.ok(inRoute, 'no cdnCacheHeaders value in the route');
  assert.equal(inConfig, inRoute);
  // The browser keeps it no longer than the watcher waits between checks.
  assert.equal(Number(inRoute.match(/max-age=(\d+)/)?.[1]) * 1000, CHECK_INTERVAL_MS);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
