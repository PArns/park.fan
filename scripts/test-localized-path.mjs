/**
 * Unit tests for `lib/i18n/localized-path.ts`: a site path written without a locale gets the
 * reader's, with that locale's spelling of a localized segment, and everything that is not a page
 * of this site keeps its address.
 *
 * Run: pnpm test:localized-path
 */
import assert from 'node:assert/strict';
import { localizedPath } from '@/lib/i18n/localized-path.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test("a path without a locale gets the reader's", () => {
  assert.equal(localizedPath('/parks/europe', 'de'), '/de/parks/europe');
  assert.equal(localizedPath('/fancast', 'fr'), '/fr/fancast');
  assert.equal(localizedPath('/', 'nl'), '/nl');
});

test("a localized first segment is written in the reader's language", () => {
  assert.equal(localizedPath('/best-time-to-visit', 'de'), '/de/beste-reisezeit');
  assert.equal(localizedPath('/trip-planner', 'de'), '/de/tagesplaner');
  assert.equal(localizedPath('/beste-reisezeit', 'en'), '/en/best-time-to-visit');
  assert.equal(localizedPath('/glossary/looping', 'nl'), '/nl/woordenboek/looping');
  assert.equal(localizedPath('/how-park-fan-works', 'es'), '/es/como-funciona-park-fan');
});

test("a park's sub-page segment is respelled, its other segments are not", () => {
  assert.equal(
    localizedPath('/parks/europe/germany/rust/europa-park/wait-time-calendar/2026/12', 'de'),
    '/de/parks/europe/germany/rust/europa-park/wartezeiten-kalender/2026/12'
  );
  assert.equal(
    localizedPath('/parks/europe/germany/rust/europa-park/average-wait-times', 'it'),
    '/it/parks/europe/germany/rust/europa-park/tempi-di-attesa-medi'
  );
  assert.equal(
    localizedPath('/parks/europe/germany/rust/europa-park/blue-fire', 'fr'),
    '/fr/parks/europe/germany/rust/europa-park/blue-fire',
    'a ride named like nothing in the families'
  );
});

test('query and hash survive', () => {
  assert.equal(
    localizedPath('/compare?parks=europa-park,phantasialand', 'de'),
    '/de/compare?parks=europa-park,phantasialand'
  );
  assert.equal(localizedPath('/best-time-to-visit#germany', 'de'), '/de/beste-reisezeit#germany');
  assert.equal(localizedPath('/?q=taron', 'en'), '/en?q=taron');
  assert.equal(
    localizedPath('/orlando?from=2027-03-03&parks=epcot:1#planner', 'it'),
    '/it/orlando?from=2027-03-03&parks=epcot:1#planner',
    'the Orlando hub is the same word in every language'
  );
});

test('a path that names its locale, a file, the API, an anchor or another host stays', () => {
  for (const path of [
    '/en/blog/x',
    '/de/best-time-to-visit',
    '/media/legoland/photo-16x9.jpg',
    '/api/og/de/parks',
    '/admin',
    '/_next/static/chunk.js',
    '#faq',
    '?page=2',
    '//cdn.example.com/x',
    'https://park.fan/parks',
  ]) {
    assert.equal(localizedPath(path, 'de'), path, path);
  }
});

test('an unknown locale only prefixes', () => {
  assert.equal(localizedPath('/best-time-to-visit', 'xx'), '/xx/best-time-to-visit');
});

console.log(`\n${passed} cases passed.`);
