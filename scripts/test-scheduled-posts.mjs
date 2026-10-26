/**
 * Pins the publication gate: a post dated after now is in no listing, feed, sitemap source,
 * hreflang set or post URL, and answers like an unknown slug, until its date (Europe/Berlin) is
 * reached. A production process reads the clock once when it starts, so the post appears with the
 * next production deploy.
 *
 * Two layers: the pure comparison against fixtures for yesterday, today and tomorrow (with and
 * without `time`), and the real listing against a pinned clock, moved around a real manifest post.
 *
 * Needs the generated manifests: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:scheduled-posts
 */

import assert from 'node:assert/strict';
import { locales } from '../i18n/config.ts';
import {
  buildPostAlternates,
  findTranslationKeyBySlug,
  getListItemByLocaleSlug,
  getMetaIndex,
  listAllUrlSlugsByLocale,
  listPosts,
  resolveEntryForLocale,
  setBlogClockForTest,
} from '../lib/blog/listing.ts';
import { berlinStamp, isScheduled } from '../lib/blog/published-at.ts';

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

// 2026-10-12 12:30 Berlin (CEST, UTC+2).
const NOW = Date.UTC(2026, 9, 12, 10, 30);
const stamp = berlinStamp(NOW);

test('berlinStamp reads Berlin wall time', () => {
  assert.equal(stamp, '2026-10-12T12:30');
  assert.equal(berlinStamp(Date.UTC(2026, 0, 15, 23, 30)), '2026-01-16T00:30');
});

test('a date without time: yesterday and today are out, tomorrow is scheduled', () => {
  assert.equal(isScheduled({ date: '2026-10-11' }, stamp), false);
  assert.equal(isScheduled({ date: '2026-10-12' }, stamp), false);
  assert.equal(isScheduled({ date: '2026-10-13' }, stamp), true);
});

test('a date with time: today counts from its minute', () => {
  assert.equal(isScheduled({ date: '2026-10-12', time: '12:30' }, stamp), false);
  assert.equal(isScheduled({ date: '2026-10-12', time: '12:31' }, stamp), true);
  assert.equal(isScheduled({ date: '2026-10-11', time: '23:59' }, stamp), false);
  assert.equal(isScheduled({ date: '2026-10-13', time: '00:00' }, stamp), true);
});

test('a malformed or missing date is never held back', () => {
  assert.equal(isScheduled({ date: undefined }, stamp), false);
  assert.equal(isScheduled({ date: 'soon' }, stamp), false);
});

test('the day turns at Berlin midnight, not UTC midnight', () => {
  const lateUtc = Date.UTC(2026, 9, 12, 22, 30); // 00:30 Berlin on the 13th
  assert.equal(isScheduled({ date: '2026-10-13' }, berlinStamp(lateUtc)), false);
  const earlyUtc = Date.UTC(2026, 9, 12, 21, 30); // 23:30 Berlin on the 12th
  assert.equal(isScheduled({ date: '2026-10-13' }, berlinStamp(earlyUtc)), true);
});

// The listing, against a real post: pin the clock one day before it, on it, and after it.
setBlogClockForTest(NOW);
const PROBE_KEY = 'welcome-to-park-fan-blog';
const probe = getMetaIndex().get(PROBE_KEY);
assert.ok(probe, `${PROBE_KEY} must exist and already be out at the pinned clock`);
const probeEntry = probe.get('en');
assert.ok(probeEntry, 'probe post needs an EN entry');
const probeSlug = probeEntry.slug;
const probeDate = probeEntry.fm.date;
const dayMs = 24 * 60 * 60 * 1000;
const probeNoon = Date.parse(`${probeDate}T10:00:00Z`);

function visibility() {
  return {
    meta: getMetaIndex().has(PROBE_KEY),
    resolved: locales.map((l) => resolveEntryForLocale(PROBE_KEY, l) !== null),
    listed: locales.map((l) => listPosts(l).some((p) => p.translationKey === PROBE_KEY)),
    byUrl: locales.map((l) => getListItemByLocaleSlug(probeSlug, l) !== null),
    urls: ['blog', 'news'].flatMap((s) =>
      listAllUrlSlugsByLocale(s).filter((p) => p.slug === probeSlug)
    ),
    alternates: Object.keys(buildPostAlternates(PROBE_KEY)),
    key: findTranslationKeyBySlug(probeSlug, 'en'),
  };
}

test('the day before: absent from every surface', () => {
  setBlogClockForTest(probeNoon - dayMs);
  const v = visibility();
  assert.equal(v.meta, false);
  assert.ok(
    v.resolved.every((x) => x === false),
    'resolveEntryForLocale'
  );
  assert.ok(
    v.listed.every((x) => x === false),
    'listPosts'
  );
  assert.ok(
    v.byUrl.every((x) => x === false),
    'getListItemByLocaleSlug'
  );
  assert.equal(v.urls.length, 0, 'post URL list');
  assert.equal(v.alternates.length, 0, 'hreflang');
  assert.equal(v.key, null, 'slug lookup');
});

test('on its day: listed everywhere again, from the same process', () => {
  setBlogClockForTest(probeNoon);
  const v = visibility();
  assert.equal(v.meta, true);
  assert.ok(v.resolved.every(Boolean), 'resolveEntryForLocale');
  assert.ok(v.listed.every(Boolean), 'listPosts');
  assert.ok(v.byUrl.every(Boolean), 'getListItemByLocaleSlug');
  assert.ok(v.urls.length > 0, 'post URL list');
  assert.ok(v.alternates.length > 0, 'hreflang');
  assert.equal(v.key, PROBE_KEY);
});

test('a day later: still listed', () => {
  setBlogClockForTest(probeNoon + dayMs);
  assert.equal(getMetaIndex().has(PROBE_KEY), true);
});

setBlogClockForTest(null);

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
