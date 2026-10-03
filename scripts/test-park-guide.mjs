/**
 * Pins which post a park page opens with as its first-visit guide (`getGuideForPark` in
 * `lib/blog/backlinks.ts`).
 *
 * The round-up guides (Halloween, winter) name a dozen parks in their tags and none in
 * `parkLinks`; a rule built on tags would offer them as the primer for each of those parks. The
 * round-ups that do list their parks there (the Germany ranking, Halloween in the USA) list more
 * than `MAX_PRIMER_PARK_LINKS` and are nobody's guide either.
 * So the test walks the real manifest:
 *
 *   - a `guides` post with `parkLinks` is the guide of its FIRST entry, and only of that one
 *   - a guide without `parkLinks` is nobody's guide
 *   - a park that is only the second `parkLinks` entry gets no guide from that post
 *   - a park without a guide gets `null`, in every locale
 *
 * Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:park-guide
 */

import assert from 'node:assert/strict';
import { BLOG_POSTS_META } from '../lib/blog/manifest.ts';
import { getGuideForPark, MAX_PRIMER_PARK_LINKS } from '../lib/blog/backlinks.ts';
import { parseRefKey } from '../lib/blog/derive.mjs';

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
const isGuide = (entry) => (entry.frontmatter.category ?? '').split('/')[0] === 'guides';

const guides = new Map();
for (const entry of BLOG_POSTS_META.filter(isGuide)) {
  const group = guides.get(keyOf(entry)) ?? [];
  group.push(entry);
  guides.set(keyOf(entry), group);
}

const parkLinksOf = (entries) =>
  entries.map((e) => e.frontmatter.parkLinks).find((v) => Array.isArray(v) && v.length) ?? null;
const firstPark = (entries) => {
  const links = parkLinksOf(entries);
  return links ? parseRefKey(String(links[0])) : null;
};
const isRoundUp = (entries) => (parkLinksOf(entries)?.length ?? 0) > MAX_PRIMER_PARK_LINKS;

const configured = [...guides].filter(([, entries]) => firstPark(entries) && !isRoundUp(entries));
const unconfigured = [...guides].filter(([, entries]) => !firstPark(entries));
const listedRoundUps = [...guides].filter(([, entries]) => isRoundUp(entries));

test('there are configured guides and round-ups to test against', () => {
  assert.ok(configured.length >= 5, `configured guides: ${configured.length}`);
  assert.ok(unconfigured.length >= 1, `round-up guides: ${unconfigured.length}`);
});

for (const [translationKey, entries] of configured) {
  const primary = firstPark(entries);
  const slug = primary.key.split('/')[0];
  const geoPath = primary.geoPath;
  test(`${translationKey}: is the guide of ${slug}`, () => {
    const found = getGuideForPark('de', slug, geoPath ? { geoPath } : {});
    assert.equal(found?.translationKey, translationKey);
  });
}

for (const [translationKey, entries] of unconfigured) {
  test(`${translationKey}: has no parkLinks, so it is no park's guide`, () => {
    const seen = new Set(entries.flatMap((e) => e.parkRefs.map((ref) => ref.slug)));
    for (const slug of seen) {
      const found = getGuideForPark('de', slug);
      assert.notEqual(found?.translationKey, translationKey, `${slug} offers ${translationKey}`);
    }
  });
}

for (const [translationKey, entries] of listedRoundUps) {
  test(`${translationKey}: lists more than ${MAX_PRIMER_PARK_LINKS} parks, so it is no park's guide`, () => {
    for (const value of parkLinksOf(entries)) {
      const slug = parseRefKey(String(value)).key.split('/')[0];
      const found = getGuideForPark('de', slug);
      assert.notEqual(found?.translationKey, translationKey, `${slug} offers ${translationKey}`);
    }
  });
}

test('a park that is only a second parkLinks entry is not offered that guide', () => {
  const second = configured
    .map(([translationKey, entries]) => {
      const links = entries.map((e) => e.frontmatter.parkLinks).find(Array.isArray);
      return {
        translationKey,
        slug: links[1] ? parseRefKey(String(links[1])).key.split('/')[0] : null,
      };
    })
    .find(({ slug }) => slug);
  assert.ok(second, 'no guide lists a second park');
  assert.notEqual(getGuideForPark('de', second.slug)?.translationKey, second.translationKey);
});

test('a park without a guide gets null', () => {
  for (const locale of ['de', 'en', 'nl', 'fr', 'es', 'it']) {
    assert.equal(getGuideForPark(locale, 'a-park-that-does-not-exist'), null);
  }
});

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
