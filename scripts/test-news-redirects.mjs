/**
 * Pins the move of the news posts from `/blog/<slug>` to `/news/<slug>`.
 *
 * Three modules have to agree, and nothing renders the disagreement: `lib/blog/paths.ts` says
 * where a post lives, `lib/blog/listing.ts` decides which slugs each post route prerenders, and
 * `lib/blog/news-redirects-rule.ts` (run by `proxy.ts`) 308s the old URLs from a map that
 * `scripts/generate-blog-manifest.mjs` writes. If the map and the routes drift, a news post is
 * reachable under both paths, or an article starts 308ing to a 404. So the test walks every post
 * in every locale:
 *
 *   - every URL the news route prerenders is the target of exactly the old `/blog/` URL
 *   - no URL the blog route prerenders is redirected
 *   - no slug is prerendered under both routes in the same locale
 *   - `/blog/category/news` goes to `/news`, other categories and other paths fall through
 *
 * Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:news-redirects
 */

import assert from 'node:assert/strict';
import { locales } from '../i18n/config.ts';
import { getMetaIndex, listAllUrlSlugsByLocale } from '../lib/blog/listing.ts';
import {
  categoryPath,
  isNewsCategory,
  NEWS_INDEX_PATH,
  newsPostPath,
  postPath,
} from '../lib/blog/paths.ts';
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

// ── paths.ts ─────────────────────────────────────────────────────────────────
test('isNewsCategory takes news and its subcategories, nothing else', () => {
  assert.equal(isNewsCategory('news'), true);
  assert.equal(isNewsCategory('news/openings'), true);
  assert.equal(isNewsCategory('newsletter'), false);
  assert.equal(isNewsCategory('guides'), false);
  assert.equal(isNewsCategory(undefined), false);
  assert.equal(isNewsCategory(null), false);
});

test('postPath puts news under /news and everything else under /blog', () => {
  assert.equal(postPath({ slug: 'a', frontmatter: { category: 'news' } }), '/news/a');
  assert.equal(postPath({ slug: 'a', frontmatter: { category: 'guides' } }), '/blog/a');
  assert.equal(postPath({ slug: 'a', frontmatter: {} }), '/blog/a');
  assert.equal(newsPostPath('a'), '/news/a');
});

test('categoryPath sends only the news category to the overview', () => {
  assert.equal(categoryPath('news'), NEWS_INDEX_PATH);
  assert.equal(categoryPath('guides'), '/blog/category/guides');
  assert.equal(categoryPath('news/openings'), '/blog/category/news/openings');
});

// ── the two routes and the proxy map ─────────────────────────────────────────
const newsUrls = listAllUrlSlugsByLocale('news');
const blogUrls = listAllUrlSlugsByLocale('blog');

test('there are news posts to test against', () => {
  assert.ok(newsUrls.length > 0, 'listAllUrlSlugsByLocale("news") is empty');
});

test('every news URL is the 308 target of its old /blog/ URL, in one hop', () => {
  for (const { locale, slug } of newsUrls) {
    const target = newsRedirect(`/${locale}/blog/${slug}`);
    assert.equal(target, `/${locale}/news/${slug}`, `/${locale}/blog/${slug}`);
    assert.equal(newsRedirect(target), null, `${target} redirects again`);
  }
});

test('no article is redirected', () => {
  for (const { locale, slug } of blogUrls) {
    assert.equal(newsRedirect(`/${locale}/blog/${slug}`), null, `/${locale}/blog/${slug}`);
  }
});

test('no slug is prerendered under both routes in one locale', () => {
  const blog = new Set(blogUrls.map(({ locale, slug }) => `${locale}/${slug}`));
  for (const { locale, slug } of newsUrls) {
    assert.ok(!blog.has(`${locale}/${slug}`), `${locale}/${slug} is under /blog and /news`);
  }
});

test("a news post's slug from another locale lands on that locale's canonical /news URL", () => {
  for (const localeMap of getMetaIndex().values()) {
    const entries = [...localeMap.values()];
    if (!entries.some((entry) => isNewsCategory(entry.fm.category))) continue;
    for (const locale of locales) {
      const served = localeMap.get(locale) ?? localeMap.get('en');
      if (!served || !isNewsCategory(served.fm.category)) continue;
      for (const other of entries) {
        assert.equal(
          newsRedirect(`/${locale}/blog/${other.slug}`),
          `/${locale}/news/${served.slug}`,
          `/${locale}/blog/${other.slug}`
        );
      }
    }
  }
});

test('/blog/category/news goes to /news in every locale; other paths fall through', () => {
  for (const locale of locales) {
    assert.equal(newsRedirect(`/${locale}/blog/category/news`), `/${locale}/news`);
    assert.equal(newsRedirect(`/${locale}/blog/category/guides`), null);
    assert.equal(newsRedirect(`/${locale}/blog`), null);
    assert.equal(newsRedirect(`/${locale}/news`), null);
    assert.equal(newsRedirect(`/${locale}/blog/feed.xml`), null);
  }
  const [{ slug }] = newsUrls;
  assert.equal(newsRedirect(`/xx/blog/${slug}`), null, 'unknown locale');
  assert.equal(newsRedirect(`/blog/${slug}`), null, 'unprefixed: next-intl adds the locale first');
  assert.equal(newsRedirect(`/en/blog/${slug}/extra`), null, 'deeper path');
});

console.log(
  `\n${checks - failures}/${checks} checks passed · ${newsUrls.length} news URLs, ` +
    `${blogUrls.length} article URLs`
);
process.exit(failures === 0 ? 0 : 1);
