/**
 * Pins the split between the blog and the news: nothing under `/blog` lists a news post, and
 * nothing in the news section lists an article (`docs/rules/news-is-set-apart-from-the-articles.md`).
 *
 * `/blog` listed both once, and so did its category tree (a "News" branch), its tag cloud (tags
 * only news carried), the blog menu (a news strip and a "News" pill) and an article's prev/next.
 * None of that shows up as an error anywhere, so this walks the real manifest in every locale:
 *
 *   - `listArticles` holds no news post, `listNewsByDate` nothing else, and together they are
 *     `listPosts`
 *   - the category tree has no news branch, and every tag counted for an archive is on an article
 *   - a tag only news carries is exactly what the proxy 308s from `/blog/tag/…` to `/news`, so an
 *     archive that disappeared with the split answers a redirect, not a 404
 *   - the blog menu lists articles and no news category, the news menu lists news only
 *
 * Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:news-split
 */

import assert from 'node:assert/strict';
import { locales } from '../i18n/config.ts';
import { isNewsPost, listArticles, listNewsByDate, listPosts } from '../lib/blog/listing.ts';
import { buildCategoryTree } from '../lib/blog/categories.ts';
import { listTags, normalizeTagSlug } from '../lib/blog/tags.ts';
import { isNewsCategory, postPath } from '../lib/blog/paths.ts';
import { getBlogMenu } from '../lib/navigation/blog-menu.ts';
import { getNewsMenu } from '../lib/navigation/news-menu.ts';
import { NEWS_ONLY_TAGS } from '../lib/blog/news-redirects.ts';
import { newsRedirect } from '../lib/blog/news-redirects-rule.ts';

let failures = 0;
let checks = 0;
function test(name, fn) {
  checks++;
  try {
    fn();
  } catch (error) {
    failures++;
    console.error(`✗ ${name}\n  ${error.message}`);
  }
}

let newsSeen = 0;
let articlesSeen = 0;

for (const locale of locales) {
  const all = listPosts(locale);
  const articles = listArticles(locale);
  const news = listNewsByDate(locale);
  newsSeen += news.length;
  articlesSeen += articles.length;

  test(`${locale}: the articles hold no news post`, () => {
    const leaked = articles.filter(isNewsPost).map((p) => p.slug);
    assert.deepEqual(leaked, []);
  });

  test(`${locale}: the news holds nothing but news`, () => {
    const leaked = news.filter((p) => !isNewsPost(p)).map((p) => p.slug);
    assert.deepEqual(leaked, []);
  });

  test(`${locale}: articles and news together are every listed post, each once`, () => {
    const keys = [...articles, ...news].map((p) => p.translationKey).sort();
    assert.deepEqual(keys, all.map((p) => p.translationKey).sort());
  });

  test(`${locale}: every article lives under /blog, every news post under /news`, () => {
    for (const post of articles) assert.match(postPath(post), /^\/blog\//, post.slug);
    for (const post of news) assert.match(postPath(post), /^\/news\//, post.slug);
  });

  test(`${locale}: the category tree has no news branch`, () => {
    const { flat } = buildCategoryTree(locale);
    const newsPaths = [...flat.keys()].filter((path) => isNewsCategory(path));
    assert.deepEqual(newsPaths, []);
  });

  test(`${locale}: every tag archive counts articles only`, () => {
    for (const tag of listTags(locale)) {
      const onArticles = articles.filter((p) =>
        (p.frontmatter.tags ?? []).some((t) => normalizeTagSlug(t) === tag.slug)
      ).length;
      assert.equal(tag.count, onArticles, `#${tag.slug}`);
    }
  });

  test(`${locale}: the news-only tags are the ones the proxy sends to /news`, () => {
    const tagsOf = (posts) =>
      new Set(
        posts.flatMap((p) => (p.frontmatter.tags ?? []).map(normalizeTagSlug)).filter(Boolean)
      );
    const articleTags = tagsOf(articles);
    const expected = [...tagsOf(news)].filter((slug) => !articleTags.has(slug)).sort();
    assert.deepEqual([...(NEWS_ONLY_TAGS[locale] ?? [])].sort(), expected);
    for (const slug of expected) {
      assert.equal(newsRedirect(`/${locale}/blog/tag/${slug}`), `/${locale}/news`, slug);
    }
    for (const tag of listTags(locale)) {
      assert.equal(newsRedirect(`/${locale}/blog/tag/${tag.slug}`), null, tag.slug);
    }
  });

  test(`${locale}: the blog menu lists articles and blog categories only`, () => {
    const menu = getBlogMenu(locale);
    for (const post of menu.recent) assert.match(post.path, /^\/blog\//, post.path);
    assert.deepEqual(
      menu.categories.filter((c) => isNewsCategory(c.path)).map((c) => c.path),
      []
    );
  });

  test(`${locale}: the news menu lists the newest news, newest first`, () => {
    const menu = getNewsMenu(locale);
    assert.equal(menu.total, news.length);
    assert.deepEqual(
      menu.items.map((item) => item.slug),
      news.slice(0, menu.items.length).map((p) => p.slug)
    );
  });
}

test('the manifest has both kinds, or this test proves nothing', () => {
  assert.ok(newsSeen > 0, 'no news post in any locale');
  assert.ok(articlesSeen > 0, 'no article in any locale');
});

if (failures > 0) {
  console.error(`\n${failures}/${checks} checks failed.`);
  process.exit(1);
}
console.log(
  `✓ ${checks} checks passed (${articlesSeen} article and ${newsSeen} news listings over ${locales.length} locales).`
);
