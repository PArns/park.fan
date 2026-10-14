/**
 * Pins the pagination of the blog and news listings (`lib/blog/pagination.ts`).
 *
 * The routes build their pages from `laterPageNumbers`, the pages slice with `paginate`, the
 * category catch-all reads its tail with `splitPageSegments` and every page's hreflang asks
 * `hasPage`. Nothing renders a disagreement between them: a post that falls between two pages, or
 * an alternate that points at a page another locale does not build, is a green build. So:
 *
 *   - the arithmetic at the edges: an empty listing, an exact multiple, one post over
 *   - a page segment is a page only in the form the links write it (`2`, never `1`, `02`, `x`)
 *   - every listing in every locale, cut into its pages, is the listing again, each post once
 *   - a tag page's alternates name only locales whose tag reaches that page
 *
 * Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:listing-pagination
 */

import assert from 'node:assert/strict';
import { locales } from '../i18n/config.ts';
import { listArticles, listNewsByDate } from '../lib/blog/listing.ts';
import { buildTagAlternates, listTags, normalizeTagSlug } from '../lib/blog/tags.ts';
import {
  hasPage,
  laterPageNumbers,
  pageCount,
  pagedPath,
  pagedSegments,
  pageWindow,
  paginate,
  parsePageNumber,
  POSTS_PER_PAGE,
  splitPageSegments,
} from '../lib/blog/pagination.ts';

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

const range = (n) => Array.from({ length: n }, (_, i) => i);

// ── arithmetic ───────────────────────────────────────────────────────────────
test('an empty listing has one page and no page to link', () => {
  assert.equal(pageCount(0), 1);
  assert.equal(hasPage(0, 1), false);
  assert.deepEqual(laterPageNumbers(0), []);
});

test('an exact multiple fills its last page, one post more opens the next', () => {
  assert.equal(pageCount(POSTS_PER_PAGE), 1);
  assert.equal(pageCount(POSTS_PER_PAGE + 1), 2);
  assert.deepEqual(laterPageNumbers(POSTS_PER_PAGE * 3), [2, 3]);
  assert.equal(paginate(range(POSTS_PER_PAGE + 1), 2)?.items.length, 1);
  assert.equal(paginate(range(POSTS_PER_PAGE + 1), 3), null);
  assert.equal(paginate(range(5), 0), null);
});

// ── URLs ─────────────────────────────────────────────────────────────────────
test('page 1 is the listing itself, a later page a /page/<n> path', () => {
  assert.equal(pagedPath('/blog', 1), '/blog');
  assert.equal(pagedPath('/blog', 2), '/blog/page/2');
  assert.deepEqual(pagedSegments(['guides'], 1), ['guides']);
  assert.deepEqual(pagedSegments(['guides'], 3), ['guides', 'page', '3']);
});

test('a page segment is a page only as the links write it', () => {
  assert.equal(parsePageNumber('2'), 2);
  assert.equal(parsePageNumber('12'), 12);
  for (const bad of ['1', '0', '02', '-2', '2.5', 'x', '', undefined]) {
    assert.equal(parsePageNumber(bad), null, String(bad));
  }
});

test('the category catch-all splits off its page tail and nothing else', () => {
  assert.deepEqual(splitPageSegments(['guides']), { segments: ['guides'], page: 1 });
  assert.deepEqual(splitPageSegments(['guides', 'page', '2']), { segments: ['guides'], page: 2 });
  assert.deepEqual(splitPageSegments(['reports', 'europe']), {
    segments: ['reports', 'europe'],
    page: 1,
  });
  assert.equal(splitPageSegments(['guides', 'page', '1']), null);
  assert.equal(splitPageSegments(['guides', 'page', 'x']), null);
  for (const page of [2, 7]) {
    assert.deepEqual(splitPageSegments(pagedSegments(['a', 'b'], page)), {
      segments: ['a', 'b'],
      page,
    });
  }
});

test('the page row lists short runs in full and elides long ones around the current page', () => {
  assert.deepEqual(pageWindow(1, 3), [1, 2, 3]);
  assert.deepEqual(pageWindow(1, 10), [1, 2, null, 10]);
  assert.deepEqual(pageWindow(5, 10), [1, null, 4, 5, 6, null, 10]);
  assert.deepEqual(pageWindow(3, 10), [1, 2, 3, 4, null, 10]);
  assert.deepEqual(pageWindow(10, 10), [1, null, 9, 10]);
});

// ── every listing, every locale ──────────────────────────────────────────────
function pagesOf(list) {
  const pages = [];
  for (let page = 1; hasPage(list.length, page); page++) pages.push(paginate(list, page));
  return pages;
}

let listings = 0;
for (const locale of locales) {
  const listingsOf = {
    articles: listArticles(locale),
    news: listNewsByDate(locale),
  };
  for (const tag of listTags(locale)) {
    listingsOf[`#${tag.slug}`] = listArticles(locale).filter((p) =>
      (p.frontmatter.tags ?? []).some((t) => normalizeTagSlug(t) === tag.slug)
    );
  }

  for (const [name, list] of Object.entries(listingsOf)) {
    if (list.length === 0) continue;
    listings++;
    test(`${locale} ${name}: the pages hold the listing, each post once, in order`, () => {
      const pages = pagesOf(list);
      assert.equal(pages.length, pageCount(list.length));
      assert.deepEqual(
        pages.map((p) => p.page),
        [1, ...laterPageNumbers(list.length)]
      );
      for (const page of pages) assert.ok(page.items.length <= POSTS_PER_PAGE);
      assert.deepEqual(
        pages.flatMap((p) => p.items).map((p) => p.translationKey),
        list.map((p) => p.translationKey)
      );
    });
  }

  test(`${locale}: a tag page's alternates name only locales that build that page`, () => {
    for (const tag of listTags(locale)) {
      for (const page of laterPageNumbers(tag.count)) {
        for (const [target, url] of Object.entries(buildTagAlternates(locale, tag.slug, page))) {
          const slug = url.split('/blog/tag/')[1].split('/')[0];
          const entry = listTags(target).find((t) => t.slug === slug);
          assert.ok(entry && hasPage(entry.count, page), `${url} for #${tag.slug} page ${page}`);
          assert.ok(url.endsWith(`/page/${page}`), url);
        }
      }
    }
  });
}

console.log(
  `\n${checks - failures}/${checks} checks passed · ${listings} listings over ${locales.length} locales, ${POSTS_PER_PAGE} posts a page`
);
process.exit(failures === 0 ? 0 : 1);
