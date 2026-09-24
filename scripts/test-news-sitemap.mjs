/**
 * Pins the Google News sitemap (`/sitemap-news.xml`, built by `lib/seo/news-sitemap.ts`).
 *
 * Nothing renders this file, and Google reports a broken one days later in Search Console, so the
 * rules are asserted here against fixed posts and a fixed date:
 *
 *   - the window is the build day and the two days before it, both ends inclusive
 *   - only news posts, only real translations (no EN fallback), no future-dated post
 *   - each entry carries publication name, language, date and the escaped title
 *   - an empty window is still a valid `<urlset>` with the news namespace
 *   - never more than 1000 entries, and the cap drops the oldest
 *
 * One more test runs the builder over the real manifest, so a post that breaks the XML (an
 * unescaped `&` in a title) fails here and not in Search Console.
 *
 * Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:news-sitemap
 */

import assert from 'node:assert/strict';
import { locales } from '../i18n/config.ts';
import { listPosts } from '../lib/blog/listing.ts';
import {
  buildNewsSitemap,
  newsWindowStart,
  NEWS_SITEMAP_MAX_URLS,
} from '../lib/seo/news-sitemap.ts';

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

const TODAY = '2026-09-24';
const post = (slug, date, { category = 'news', isFallback = false, title = slug } = {}) => ({
  slug,
  isFallback,
  frontmatter: { title, date, category },
});
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

test('the window starts two days back, across a month edge', () => {
  assert.equal(newsWindowStart('2026-09-24'), '2026-09-22');
  assert.equal(newsWindowStart('2026-10-01'), '2026-09-29');
  assert.equal(newsWindowStart('2027-01-01'), '2026-12-30');
});

test('today and the two days before are in, three days back and tomorrow are out', () => {
  const xml = buildNewsSitemap(
    [
      [
        'de',
        [
          post('today', '2026-09-24'),
          post('two-days', '2026-09-22'),
          post('three-days', '2026-09-21'),
          post('tomorrow', '2026-09-25'),
        ],
      ],
    ],
    TODAY
  );
  assert.deepEqual(locs(xml), [
    'https://park.fan/de/news/today',
    'https://park.fan/de/news/two-days',
  ]);
});

test('articles, news subcategories and EN fallbacks are told apart', () => {
  const xml = buildNewsSitemap(
    [
      [
        'en',
        [
          post('guide', TODAY, { category: 'guides' }),
          post('opening', TODAY, { category: 'news/openings' }),
        ],
      ],
      ['nl', [post('opening', TODAY, { category: 'news/openings', isFallback: true })]],
    ],
    TODAY
  );
  assert.deepEqual(locs(xml), ['https://park.fan/en/news/opening']);
});

test('an entry names publication, language, date and the escaped title', () => {
  const xml = buildNewsSitemap(
    [['fr', [post('fright', '2026-09-23', { title: 'Peur & <frissons>' })]]],
    TODAY
  );
  assert.match(xml, /<news:name>park\.fan<\/news:name>/);
  assert.match(xml, /<news:language>fr<\/news:language>/);
  assert.match(xml, /<news:publication_date>2026-09-23<\/news:publication_date>/);
  assert.match(xml, /<news:title>Peur &amp; &lt;frissons&gt;<\/news:title>/);
});

test('an empty window is a valid urlset with the news namespace', () => {
  const xml = buildNewsSitemap([['de', [post('old', '2026-01-01')]]], TODAY);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.match(
    xml,
    /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9">/
  );
  assert.match(xml, /<\/urlset>$/);
  assert.equal(locs(xml).length, 0);
});

test('the cap keeps the newest 1000', () => {
  const many = [];
  for (let i = 0; i < NEWS_SITEMAP_MAX_URLS; i++) many.push(post(`old-${i}`, '2026-09-22'));
  many.push(post('newest', TODAY));
  const urls = locs(buildNewsSitemap([['de', many]], TODAY));
  assert.equal(urls.length, NEWS_SITEMAP_MAX_URLS);
  assert.equal(urls[0], 'https://park.fan/de/news/newest');
});

// ── the real manifest ────────────────────────────────────────────────────────
const real = locales.map((locale) => [locale, listPosts(locale)]);
const newsDates = real.flatMap(([, posts]) =>
  posts.filter((p) => p.frontmatter.category?.startsWith('news')).map((p) => p.frontmatter.date)
);

test('every real news post builds into well-formed entries on its own day', () => {
  assert.ok(newsDates.length > 0, 'no news posts in the manifest');
  for (const date of new Set(newsDates)) {
    const xml = buildNewsSitemap(real, date);
    assert.ok(locs(xml).length > 0, `nothing listed on ${date}`);
    // Every `&` is an entity, every tag the builder opens is closed.
    assert.doesNotMatch(xml, /&(?!amp;|lt;|gt;|quot;|apos;)/, `unescaped & on ${date}`);
    assert.equal(
      (xml.match(/<news:news>/g) ?? []).length,
      (xml.match(/<\/news:news>/g) ?? []).length
    );
  }
});

console.log(
  `\n${checks - failures}/${checks} checks passed · ${newsDates.length} real news entries`
);
process.exit(failures === 0 ? 0 : 1);
