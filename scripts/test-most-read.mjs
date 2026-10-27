/**
 * Pins how the most-read lists turn the API's ranking into posts (docs/features/most-read.md):
 *
 *   - one `translationKey` is one post in every locale: the same ranking resolves to each locale's
 *     own post, with its own URL, so a view counted on /de and on /fr is the same post
 *   - keys the manifest does not know are dropped, the ranking's order is kept
 *   - a list with fewer than three known posts is empty, and one holds a post more than it shows
 *   - a post page's list leaves the post out and still shows five
 *
 * Reads the real manifest and asks no network: only articles are resolved, news would look up its
 * park. Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:most-read
 */

import assert from 'node:assert/strict';
import { locales } from '../i18n/config.ts';
import { listArticles } from '../lib/blog/listing.ts';
import { resolveMostRead } from '../lib/blog/most-read.ts';
import { MOST_READ_LIMIT, mostReadShown } from '../lib/blog/most-read-config.ts';

let checks = 0;
const check = (fn) => {
  fn();
  checks += 1;
};

// Keys present in every locale, in a stable order, as the API would rank them.
const shared = listArticles('de')
  .map((post) => post.translationKey)
  .filter((key) => locales.every((l) => listArticles(l).some((p) => p.translationKey === key)))
  .slice(0, MOST_READ_LIMIT + 3);
assert.ok(shared.length >= MOST_READ_LIMIT + 2, 'the manifest needs articles in all six locales');

const ranking = ['no-such-post', ...shared.slice(0, 2), 'junk-key', ...shared.slice(2)];

const perLocale = new Map();
for (const locale of locales) {
  const list = await resolveMostRead(ranking, listArticles(locale), locale, false);
  perLocale.set(locale, list);

  check(() =>
    assert.deepEqual(
      list.map((post) => post.key),
      shared.slice(0, MOST_READ_LIMIT + 1),
      `${locale}: unknown keys dropped, order kept, one spare`
    )
  );
  check(() =>
    assert.ok(
      list.every((post) => post.path.startsWith('/blog/') && post.categoryPath !== undefined),
      `${locale}: every article has its path and its category page`
    )
  );
}

// The same key, a different URL per locale, the same post.
const first = shared[0];
const paths = locales.map((l) => perLocale.get(l).find((post) => post.key === first).path);
check(() =>
  assert.equal(new Set(paths).size > 1, true, 'a translated post has its own URL per locale')
);

const thin = await resolveMostRead([shared[0], shared[1], 'junk'], listArticles('de'), 'de', false);
check(() => assert.deepEqual(thin, [], 'two known posts make no list'));

const data = { articles: perLocale.get('de'), news: [] };
check(() => {
  const shown = mostReadShown(data, 'article', shared[0]);
  assert.equal(shown.length, MOST_READ_LIMIT, 'a post page still lists five');
  assert.ok(!shown.some((post) => post.key === shared[0]), 'and not itself');
});
check(() =>
  assert.deepEqual(
    mostReadShown(data, 'article').map((post) => post.key),
    shared.slice(0, MOST_READ_LIMIT),
    'elsewhere the top five'
  )
);
check(() => assert.deepEqual(mostReadShown(data, 'news'), [], 'an empty kind is empty'));

console.log(
  `✓ ${checks} checks passed (${shared.length} shared keys over ${locales.length} locales).`
);
