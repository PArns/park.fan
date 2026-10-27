/**
 * Pins how the most-read lists turn the API's ranking into posts, and when a view is sent at all
 * (docs/features/most-read.md):
 *
 *   - one `translationKey` is one post in every locale: the same ranking resolves to each locale's
 *     own post at that locale's own `postPath`, so a view counted on /de and on /fr is one post
 *   - keys the manifest does not know are dropped, the ranking's order and counts are kept
 *   - a list is always a post longer than it shows: where fewer posts were read, the newest unread
 *     ones follow with 0 views, so the placeholder's height is the list's
 *   - news resolves to news with its date, articles to articles with their category
 *   - a post page's list leaves the post out, shows five and keeps every post's place
 *   - the flame and the badge go to a clear leader only
 *   - an API failure is an error, never an empty ranking someone would cache
 *   - a view is sent only on production's hosts, never under automation, Do Not Track, Global
 *     Privacy Control or the opt-out, once per tab, and straight to the API without `keepalive`
 *
 * Reads the real manifest; the API is a stubbed `fetch`. Needs the generated manifests: run
 * `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:most-read
 */

import assert from 'node:assert/strict';
import { locales } from '../i18n/config.ts';
import { listArticlesByRecency, listNewsByDate } from '../lib/blog/listing.ts';
import { postPath } from '../lib/blog/paths.ts';
import { getMostRead, getMostReadSeed, resolveMostRead } from '../lib/blog/most-read.ts';
import { MOST_READ_SEED } from '../lib/blog/most-read-seed.generated.ts';
import {
  MOST_READ_LEADER_MIN_VIEWS,
  MOST_READ_LIMIT,
  mostReadLeader,
  mostReadSeedOf,
  mostReadShown,
} from '../lib/blog/most-read-config.ts';
import { API_ORIGIN } from '../lib/api/client.ts';
import { ANALYTICS_OPT_OUT_KEY } from '../lib/analytics/opt-out.ts';
import { sendPageView, shouldCountPageView } from '../lib/analytics/page-views.ts';

let checks = 0;
const check = async (fn) => {
  await fn();
  checks += 1;
};

const keysIn = (list) => list.map((post) => post.key);

// Keys present in every locale, oldest first, so none of them is among the newest fillers.
const everywhere = (list) =>
  list('de')
    .map((post) => post.translationKey)
    .filter((key) => locales.every((l) => list(l).some((p) => p.translationKey === key)));
const articleKeys = everywhere(listArticlesByRecency)
  .reverse()
  .slice(0, MOST_READ_LIMIT + 3);
const newsKeys = everywhere(listNewsByDate)
  .reverse()
  .slice(0, MOST_READ_LIMIT + 3);
assert.ok(articleKeys.length >= MOST_READ_LIMIT + 2, 'the manifest needs articles in all locales');
assert.ok(newsKeys.length >= 3, 'the manifest needs news in all locales');

const ranked = (keys) => keys.map((key, index) => ({ key, views: 100 - index }));
const ranking = [
  { key: 'no-such-post', views: 500 },
  ...ranked(articleKeys.slice(0, 2)),
  { key: 'junk-key', views: 99 },
  ...ranked(articleKeys.slice(2)),
];

const perLocale = new Map();
for (const locale of locales) {
  const posts = listArticlesByRecency(locale);
  const list = resolveMostRead(ranking, posts, locale, false);
  perLocale.set(locale, list);

  await check(() =>
    assert.deepEqual(
      keysIn(list),
      articleKeys.slice(0, MOST_READ_LIMIT + 1),
      `${locale}: unknown keys dropped, order kept, one spare`
    )
  );
  await check(() => {
    for (const post of list) {
      const own = posts.find((p) => p.translationKey === post.key);
      assert.equal(post.path, postPath(own), `${locale}: ${post.key} at this locale's own URL`);
      assert.ok(post.category && !post.date, `${locale}: an article carries its category`);
    }
  });
}
await check(() =>
  assert.equal(
    perLocale.get('de')[0].views,
    ranking.find((item) => item.key === articleKeys[0]).views,
    'the counts come along'
  )
);

await check(() => {
  const posts = listArticlesByRecency('de');
  const thin = resolveMostRead(
    [...ranked(articleKeys.slice(0, 2)), { key: 'junk', views: 9 }],
    posts,
    'de',
    false
  );
  assert.equal(thin.length, MOST_READ_LIMIT + 1, 'a thin ranking is filled up to the full list');
  assert.deepEqual(keysIn(thin).slice(0, 2), articleKeys.slice(0, 2), 'the read posts lead');
  const fill = posts
    .map((post) => post.translationKey)
    .filter((key) => !articleKeys.slice(0, 2).includes(key))
    .slice(0, MOST_READ_LIMIT - 1);
  assert.deepEqual(keysIn(thin).slice(2), fill, 'then the newest unread, newest first');
  assert.ok(
    thin.slice(2).every((post) => post.views === 0),
    'and they say they have no views'
  );
});

await check(() => {
  const empty = resolveMostRead([], listArticlesByRecency('fr'), 'fr', false);
  assert.equal(empty.length, MOST_READ_LIMIT + 1, 'no ranking at all still fills the list');
});

await check(() => {
  const posts = listNewsByDate('nl');
  const news = resolveMostRead(ranked(newsKeys.slice(0, 3)), posts, 'nl', true);
  assert.deepEqual(keysIn(news).slice(0, 3), newsKeys.slice(0, 3), 'news ranks news');
  assert.ok(
    news.every((post) => post.date && !post.category && post.path.startsWith('/news/')),
    'a news post carries its date and lives under /news'
  );
});

const data = { articles: perLocale.get('de'), news: [] };
await check(() => {
  const shown = mostReadShown(data, 'article', articleKeys[0]);
  assert.equal(shown.length, MOST_READ_LIMIT, 'the leader page still lists five');
  assert.deepEqual(
    shown.map(({ rank }) => rank),
    [2, 3, 4, 5, 6],
    'from place 2, not renumbered'
  );
});
await check(() =>
  assert.deepEqual(
    mostReadShown(data, 'article', articleKeys[2]).map(({ rank }) => rank),
    [1, 2, 4, 5, 6],
    'a page in the middle leaves a gap where it stands'
  )
);
await check(() =>
  assert.deepEqual(
    mostReadShown(data, 'article').map(({ post }) => post.key),
    articleKeys.slice(0, MOST_READ_LIMIT),
    'elsewhere the top five'
  )
);
await check(() => assert.deepEqual(mostReadShown(data, 'news'), [], 'an empty kind is empty'));

const withViews = (...views) => ({
  articles: views.map((count, index) => ({ key: `k${index}`, views: count })),
  news: [],
});
await check(() => {
  assert.equal(mostReadLeader(withViews(40, 12), 'article'), 'k0', 'a clear first leads');
  assert.equal(mostReadLeader(withViews(12, 12), 'article'), undefined, 'a tie leads nobody');
  assert.equal(
    mostReadLeader(withViews(MOST_READ_LEADER_MIN_VIEWS - 1, 0), 'article'),
    undefined,
    'too few views lead nobody'
  );
  assert.equal(mostReadLeader(withViews(0, 0), 'article'), undefined, 'a filled list neither');
  assert.equal(mostReadLeader(undefined, 'news'), undefined, 'nor a ranking still on its way');
});

// The API, stubbed: what `getMostRead` asks for and what the beacon sends.
const sent = [];
let apiDown = false;
globalThis.fetch = async (url, init = {}) => {
  sent.push({ url: String(url), init });
  if (apiDown) return new Response('down', { status: 503 });
  return Response.json({ items: [] });
};

await check(async () => {
  const lists = await getMostRead('it');
  assert.equal(lists.articles.length, MOST_READ_LIMIT + 1, 'an empty ranking is a full list');
  assert.ok(
    sent.some((call) => /kind=news/.test(call.url) && /days=7/.test(call.url)),
    'news asks for its seven days'
  );
});
await check(async () => {
  apiDown = true;
  await assert.rejects(getMostRead('es'), 'an API failure throws, the route answers 502');
  apiDown = false;
});

// The build's snapshot: whatever it holds, every locale renders two full lists from it.
await check(() => {
  for (const locale of locales) {
    const seed = getMostReadSeed(locale);
    assert.equal(seed.articles.length, MOST_READ_LIMIT + 1, `${locale}: seeded articles are full`);
    assert.equal(seed.news.length, MOST_READ_LIMIT + 1, `${locale}: seeded news are full`);
    const posts = listArticlesByRecency(locale);
    const known = (MOST_READ_SEED.rankings[locale]?.article ?? [])
      .filter((item) => item.views > 0 && posts.some((post) => post.translationKey === item.key))
      .slice(0, MOST_READ_LIMIT + 1);
    assert.deepEqual(
      keysIn(seed.articles.slice(0, known.length)),
      known.map((item) => item.key),
      `${locale}: the seed's ranking leads the list`
    );
  }
});
await check(() => {
  const seed = getMostReadSeed('de');
  assert.deepEqual(mostReadSeedOf(seed, 'news').articles, [], 'a news page ships no articles');
  assert.deepEqual(mostReadSeedOf(seed, 'article').news, [], 'an article page ships no news');
});

// A browser, enough of one for the beacon's checks.
const storage = new Map();
const browser = {
  hostname: 'park.fan',
  webdriver: false,
  doNotTrack: null,
  windowDoNotTrack: undefined,
  gpc: undefined,
};
Object.defineProperty(globalThis, 'location', {
  configurable: true,
  get: () => ({ hostname: browser.hostname }),
});
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  get: () => ({
    webdriver: browser.webdriver,
    doNotTrack: browser.doNotTrack,
    globalPrivacyControl: browser.gpc,
  }),
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  get: () => ({ doNotTrack: browser.windowDoNotTrack }),
});
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  get: () => ({ getItem: (key) => storage.get(key) ?? null }),
});

const viewId = 'article:some-post:de';
const refused = (what, set, reset) =>
  check(() => {
    set();
    assert.equal(shouldCountPageView(viewId), false, what);
    reset();
  });

await check(() => assert.equal(shouldCountPageView(viewId), true, 'a reader on park.fan counts'));
await refused(
  'a preview host does not',
  () => (browser.hostname = 'park-git-x-arns.vercel.app'),
  () => (browser.hostname = 'www.park.fan')
);
await refused(
  'automation does not',
  () => (browser.webdriver = true),
  () => (browser.webdriver = false)
);
await refused(
  'Do Not Track does not',
  () => (browser.doNotTrack = '1'),
  () => (browser.doNotTrack = null)
);
await refused(
  "the old window.doNotTrack 'yes' neither",
  () => (browser.windowDoNotTrack = 'yes'),
  () => (browser.windowDoNotTrack = undefined)
);
await refused(
  'Global Privacy Control does not',
  () => (browser.gpc = true),
  () => (browser.gpc = undefined)
);
await refused(
  'the opt-out on the privacy page does not',
  () => storage.set(ANALYTICS_OPT_OUT_KEY, '1'),
  () => storage.delete(ANALYTICS_OPT_OUT_KEY)
);

await check(() => {
  sent.length = 0;
  sendPageView(viewId, { kind: 'article', key: 'some-post', locale: 'de' });
  assert.equal(sent.length, 1, 'one request');
  const [{ url, init }] = sent;
  assert.equal(url, `${API_ORIGIN}/v1/page-views`, 'straight to the API, no relay');
  assert.equal(init.method, 'POST');
  assert.deepEqual(JSON.parse(init.body), { kind: 'article', key: 'some-post', locale: 'de' });
  assert.equal(init.keepalive, undefined, 'no keepalive');
  assert.equal(shouldCountPageView(viewId), false, 'and only once per tab');
  assert.equal(shouldCountPageView('article:some-post:fr'), true, 'another language is a view');
});

console.log(
  `✓ ${checks} checks passed (${articleKeys.length} article and ${newsKeys.length} news keys over ${locales.length} locales).`
);
