/**
 * Pins which park a news post belongs to (`getNewsParkRef` in `lib/blog/backlinks.ts`).
 *
 * That park is the label on every note on `/news`, the `?park=` filter value, and the "more news
 * from" list at the end of a news post. Nothing renders a wrong pick as an error, so the test
 * walks the real manifest:
 *
 *   - a post with `parkLinks` belongs to its first entry, in the order the author wrote them
 *   - the full-path form keeps its geo path, so a shared slug resolves to the right park
 *   - `parkLinks: false` means no park
 *   - without `parkLinks`, the pick is one of the parks the post itself references
 *
 * Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:news-park
 */

import assert from 'node:assert/strict';
import { BLOG_POSTS_META } from '../lib/blog/manifest.ts';
import { getNewsParkRef } from '../lib/blog/backlinks.ts';
import { parseRefKey } from '../lib/blog/derive.mjs';
import { isNewsCategory } from '../lib/blog/paths.ts';

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

const keyOf = (entry) => entry.frontmatter.translationKey?.trim() || entry.slug;

/** translationKey → every manifest entry (one per locale) of that post. */
const byPost = new Map();
for (const entry of BLOG_POSTS_META) {
  const group = byPost.get(keyOf(entry)) ?? [];
  group.push(entry);
  byPost.set(keyOf(entry), group);
}

const newsPosts = [...byPost].filter(([, entries]) =>
  entries.some((e) => isNewsCategory(e.frontmatter.category))
);

test('there are news posts to test against', () => {
  assert.ok(newsPosts.length > 0, 'no post in the manifest has category news');
});

let configured = 0;
test('a post with parkLinks belongs to its first entry', () => {
  for (const [key, entries] of byPost) {
    const list = entries.map((e) => e.frontmatter.parkLinks).find((v) => Array.isArray(v));
    if (!list || list.length === 0) continue;
    if (entries.some((e) => e.frontmatter.parkLinks === false)) continue;
    configured++;
    const first = parseRefKey(String(list[0]).trim());
    const ref = getNewsParkRef(key);
    assert.ok(ref, `${key}: no park, expected ${first.key}`);
    assert.equal(ref.slug, first.key.split('/')[0], key);
    if (first.geoPath) assert.deepEqual(ref.geo, [first.geoPath], `${key}: geo path lost`);
  }
  assert.ok(configured > 0, 'no post with parkLinks in the manifest');
});

test('every news post today names its park', () => {
  for (const [key] of newsPosts) {
    assert.ok(getNewsParkRef(key), `${key} resolves to no park`);
  }
});

test('the Disneyland Paris note keeps the Paris geo path of its first entry', () => {
  const ref = getNewsParkRef('disneyland-paris-halloween-2026');
  assert.deepEqual(ref, { slug: 'disneyland-park', geo: ['europe/france/paris'] });
});

test('parkLinks: false means no park', () => {
  for (const [key, entries] of byPost) {
    if (!entries.some((e) => e.frontmatter.parkLinks === false)) continue;
    assert.equal(getNewsParkRef(key), null, key);
  }
});

test('without parkLinks the pick is a park the post references', () => {
  for (const [key, entries] of byPost) {
    if (entries.some((e) => e.frontmatter.parkLinks !== undefined)) continue;
    const referenced = new Set(
      entries.flatMap((e) => [
        ...e.parkRefs.map((r) => r.slug),
        ...(e.frontmatter.relatedParks ?? []).map((p) => parseRefKey(String(p)).key),
      ])
    );
    const ref = getNewsParkRef(key);
    if (referenced.size === 0) assert.equal(ref, null, key);
    else assert.ok(ref && referenced.has(ref.slug), `${key}: ${ref?.slug} is not referenced`);
  }
});

test('an unknown post has no park', () => {
  assert.equal(getNewsParkRef('no-such-post-at-all'), null);
});

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(
  `✓ ${checks} checks passed (${newsPosts.length} news posts, ${configured} posts with parkLinks).`
);
