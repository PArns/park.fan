/**
 * Unit tests for the export check on `/admin/system` (`lib/admin/news-export-lag.ts`): which posts
 * of the site the app's export lacks, how long they have waited, counted from the post's date or
 * the deployment, whichever is later, when that turns amber and red, what an unreadable list does,
 * and the verdict's words.
 *
 * Run: pnpm test:admin-news-export
 */
import assert from 'node:assert/strict';
import {
  EXPORT_BEHIND_MINUTES,
  compareExportFeed,
  exportIsLate,
  exportNeedsRun,
  exportVerdict,
  parseExportList,
} from '../lib/admin/news-export-lag.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];
const NOW = Date.parse('2026-11-28T12:00:00Z');
const minutesBefore = (minutes) => new Date(NOW - minutes * 60_000).toISOString();
/** Deployed a day ago, so a post's own date decides unless a test says otherwise. */
const DEPLOYED = minutesBefore(24 * 60);

/** One post in every locale: the slug and title carry the locale, as the real files do. */
function post(key, publishedAt) {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      { translationKey: key, slug: `${key}-${locale}`, title: `${key} (${locale})`, publishedAt },
    ])
  );
}

const OLDER = post('winterpause', '2026-11-26T09:00:00+01:00');
const NEWEST = post('hollywood-christmas', '2026-11-28T11:10:00+01:00');

/** The site's posts per locale, newest first. */
function site(...posts) {
  return Object.fromEntries(LOCALES.map((locale) => [locale, posts.map((p) => p[locale])]));
}

/** Every locale's list as one run wrote it, holding these posts. */
function exported(generatedAt, ...posts) {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      {
        state: 'ok',
        generatedAt,
        posts: posts.map(({ [locale]: { slug, title, publishedAt } }) => ({
          slug,
          title,
          publishedAt,
        })),
      },
    ])
  );
}

const compare = (overrides) =>
  compareExportFeed({
    feed: 'news',
    site: site(NEWEST, OLDER),
    exported: exported(minutesBefore(30), NEWEST, OLDER),
    deployedAt: DEPLOYED,
    now: NOW,
    ...overrides,
  });

test('an export holding every post is current', () => {
  const status = compare();
  assert.equal(status.tone, 'ok');
  assert.deepEqual(status.missing, []);
  assert.equal(status.behindMinutes, null);
  assert.equal(status.generatedAt, minutesBefore(30));
  assert.equal(exportVerdict(status), 'aktuell');
  assert.equal(exportNeedsRun([status]), false);
});

test('the newest posts are shown with their German titles', () => {
  const status = compare({ exported: exported(minutesBefore(300), OLDER) });
  assert.equal(status.newestOnSite?.title, 'hollywood-christmas (de)');
  assert.equal(status.newestExported?.title, 'winterpause (de)');
});

test('a post missing for less than an hour is not yet late', () => {
  // 11:10 Berlin is 10:10 UTC, so 110 minutes before noon UTC; the deployment came 30 minutes ago.
  const status = compare({
    exported: exported(minutesBefore(300), OLDER),
    deployedAt: minutesBefore(30),
  });
  assert.equal(status.missing.length, 1);
  assert.deepEqual(status.missing[0].locales, ['de', 'en', 'fr', 'it', 'nl', 'es']);
  assert.equal(status.missing[0].title, 'hollywood-christmas (de)');
  assert.equal(status.behindMinutes, 30);
  assert.equal(status.tone, 'ok');
  assert.equal(exportIsLate(status), false);
  assert.equal(exportVerdict(status), '1 Meldung noch nicht drin');
  assert.equal(exportNeedsRun([status]), false);
});

test('an hour after its date a missing post is late', () => {
  const status = compare({ exported: exported(minutesBefore(300), OLDER) });
  assert.equal(status.behindMinutes, 110);
  assert.equal(status.tone, 'warn');
  assert.equal(exportIsLate(status), true);
  assert.equal(exportVerdict(status), '1 Meldung fehlt');
  assert.equal(exportNeedsRun([status]), true);
});

test('past the push window it is a fault', () => {
  const status = compare({
    site: site(OLDER),
    exported: exported(minutesBefore(4 * 24 * 60)),
  });
  assert.ok(status.behindMinutes >= EXPORT_BEHIND_MINUTES.bad);
  assert.equal(status.tone, 'bad');
});

test('a backdated post counts from the deployment that brought it', () => {
  const status = compare({
    site: site(NEWEST, OLDER),
    exported: exported(minutesBefore(300), NEWEST),
    deployedAt: minutesBefore(10),
  });
  assert.equal(status.missing[0].translationKey, 'winterpause');
  assert.equal(status.behindMinutes, 10);
  assert.equal(status.tone, 'ok');
});

test('without a build time the post date alone counts', () => {
  const status = compare({ exported: exported(minutesBefore(300), OLDER), deployedAt: null });
  assert.equal(status.behindMinutes, 110);
});

test('a post dated after its deployment counts from its date', () => {
  // Scheduled: deployed and exported ten hours ago, out at 11:10 today, and no run since.
  const status = compare({
    exported: exported(minutesBefore(600), OLDER),
    deployedAt: minutesBefore(600),
  });
  assert.equal(status.behindMinutes, 110);
});

test('several missing posts count as one each and wait as long as the oldest', () => {
  const status = compare({ exported: exported(minutesBefore(5 * 24 * 60)) });
  assert.deepEqual(
    status.missing.map((m) => m.translationKey),
    ['hollywood-christmas', 'winterpause']
  );
  assert.equal(exportVerdict(status), '2 Meldungen fehlen');
  assert.equal(exportVerdict({ ...status, feed: 'guides' }), '2 Guides fehlen');
});

test('a run that stopped halfway shows its oldest list and the locales it missed', () => {
  const lists = exported(minutesBefore(20), NEWEST, OLDER);
  lists.it = exported(minutesBefore(3000), OLDER).it;
  const status = compare({ exported: lists });
  assert.equal(status.generatedAt, minutesBefore(3000));
  assert.deepEqual(status.missing[0].locales, ['it']);
  assert.equal(status.tone, 'warn');
});

test('a post without German takes the title of its first locale', () => {
  const status = compare({
    site: { ...site(OLDER), en: [NEWEST.en, OLDER.en] },
    exported: exported(minutesBefore(300), OLDER),
  });
  assert.equal(status.missing[0].title, 'hollywood-christmas (en)');
  assert.deepEqual(status.missing[0].locales, ['en']);
});

test('a post only the export holds is not a problem', () => {
  const status = compare({ site: site(OLDER) });
  assert.equal(status.tone, 'ok');
  assert.deepEqual(status.missing, []);
});

test('an unreadable list is a fault and the others are still compared', () => {
  const lists = exported(minutesBefore(30), NEWEST, OLDER);
  lists.fr = { state: 'failed', message: 'HTTP 404' };
  const status = compare({ exported: lists });
  assert.equal(status.tone, 'bad');
  assert.deepEqual(status.unreadable, [{ locale: 'fr', message: 'HTTP 404' }]);
  assert.deepEqual(status.missing, []);
  assert.equal(exportVerdict(status), '1 Sprache nicht lesbar');
  assert.equal(exportNeedsRun([status]), true);
});

test('a locale without a list counts as unreadable', () => {
  const lists = exported(minutesBefore(30), NEWEST, OLDER);
  delete lists.es;
  assert.deepEqual(compare({ exported: lists }).unreadable, [
    { locale: 'es', message: 'nicht gelesen' },
  ]);
});

test('no list at all says so', () => {
  const failed = Object.fromEntries(
    LOCALES.map((locale) => [locale, { state: 'failed', message: 'keine Antwort' }])
  );
  const status = compare({ exported: failed });
  assert.equal(status.generatedAt, null);
  assert.equal(status.newestExported, null);
  assert.equal(status.tone, 'bad');
  assert.equal(exportVerdict(status), 'nicht lesbar');
});

test('the worst feed decides whether a run is the answer', () => {
  const ok = compare();
  const late = compare({ exported: exported(minutesBefore(300), OLDER) });
  assert.equal(exportNeedsRun([ok, ok]), false);
  assert.equal(exportNeedsRun([ok, late]), true);
});

test('an export list parses to its time and posts', () => {
  const reading = parseExportList({
    schema: 1,
    generatedAt: '2026-11-27T16:36:16.407Z',
    locale: 'de',
    posts: [
      { slug: 'a', title: 'A', publishedAt: '2026-11-27T11:10:00+01:00', cover: null },
      { slug: 'b', title: 'B' },
      null,
    ],
  });
  assert.deepEqual(reading, {
    state: 'ok',
    generatedAt: '2026-11-27T16:36:16.407Z',
    posts: [{ slug: 'a', title: 'A', publishedAt: '2026-11-27T11:10:00+01:00' }],
  });
});

test('a list without a time or posts fails', () => {
  const failed = { state: 'failed', message: 'unerwartetes Format' };
  assert.deepEqual(parseExportList(null), failed);
  assert.deepEqual(parseExportList('{}'), failed);
  assert.deepEqual(parseExportList({ generatedAt: 'gestern', posts: [] }), failed);
  assert.deepEqual(parseExportList({ generatedAt: '2026-11-27T16:36:16.407Z' }), failed);
});

console.log(`\n${passed} passed`);
