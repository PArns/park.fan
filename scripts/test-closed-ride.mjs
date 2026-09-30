/**
 * Pins the page of a ride that closed for good (`lib/parks/closed-ride.ts`,
 * `buildClosedRideTitle` / `buildClosedRideDescription` in `lib/seo/attraction-meta.ts`).
 *
 * X2 at Six Flags Magic Mountain was retired on 2026-07-13 with our own news post as the reason,
 * and its page answered 404 for two months. What must hold now:
 *
 *   - only `retiredKind: 'closed'` is a page; a reclassified row and a live name-duplicate are not
 *   - the news URL in the reason becomes the post in the reader's language, never the English slug
 *   - an outside source is shown by its host, without trailing punctuation
 *   - the closing day is the day the editor entered, in every timezone
 *   - the description carries the ride's own figures, and a wait time in steps of five
 *
 * Needs the generated blog manifest: run `pnpm generate:blog-manifest` (or `pnpm prebuild`) first.
 *
 * Run: pnpm test:closed-ride
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  closedRidePost,
  closedRideSource,
  formatClosedMonth,
  closedRidesForSearch,
  formatClosedOn,
  isClosedRide,
} from '../lib/parks/closed-ride.ts';
import { buildClosedRideDescription, buildClosedRideTitle } from '../lib/seo/attraction-meta.ts';

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

const X2_REASON = 'https://park.fan/news/x2-six-flags-magic-mountain-closed';

// ── Which responses are a page ───────────────────────────────────────────────

test('a ride retired as closed is a page', () => {
  assert.equal(
    isClosedRide({ retiredKind: 'closed', retiredAt: '2026-07-13T00:00:00.000Z' }),
    true
  );
});

test('a reclassified row is not: nothing closed', () => {
  assert.equal(
    isClosedRide({ retiredKind: 'reclassified', retiredAt: '2026-09-01T00:00:00.000Z' }),
    false
  );
});

test('a live name-duplicate the park payload dropped is not either', () => {
  assert.equal(isClosedRide({ retiredKind: null, retiredAt: null }), false);
  assert.equal(isClosedRide({}), false);
  assert.equal(isClosedRide(null), false);
});

// ── The news post ────────────────────────────────────────────────────────────

test('the English news URL becomes the German post on a German page', () => {
  const post = closedRidePost(X2_REASON, 'de');
  assert.ok(post, 'no post resolved');
  assert.equal(post.href, '/news/x2-six-flags-magic-mountain-geschlossen');
  assert.match(post.title, /X2/);
});

test('and stays the English post on an English page', () => {
  assert.equal(closedRidePost(X2_REASON, 'en')?.href, '/news/x2-six-flags-magic-mountain-closed');
});

test('a locale-prefixed URL to another translation resolves too', () => {
  const post = closedRidePost(
    'Source: https://park.fan/de/news/x2-six-flags-magic-mountain-geschlossen.',
    'nl'
  );
  assert.equal(post?.href, '/news/x2-six-flags-magic-mountain-gesloten');
});

test('a reason that names no post of ours has no post', () => {
  assert.equal(closedRidePost('Removed with DinoLand', 'de'), null);
  assert.equal(closedRidePost('https://blogmickey.com/2026/02/dino-sue-removed', 'de'), null);
  assert.equal(closedRidePost(null, 'de'), null);
});

test('a post that is not in the manifest has none either', () => {
  assert.equal(closedRidePost('https://park.fan/news/no-such-post-anywhere', 'de'), null);
});

// ── An outside source ────────────────────────────────────────────────────────

test('an outside source is its host, without the full stop that ends the sentence', () => {
  assert.deepEqual(
    closedRideSource('Removed with DinoLand, see https://www.blogmickey.com/2026/02/dino-sue.'),
    { href: 'https://www.blogmickey.com/2026/02/dino-sue', host: 'blogmickey.com' }
  );
});

test('our own site is never an outside source', () => {
  assert.equal(closedRideSource(X2_REASON), null);
});

test('a reason without a URL has no source', () => {
  assert.equal(closedRideSource('blogmickey.com/2026/02/dino-sue-removed'), null);
  assert.equal(closedRideSource(null), null);
});

// ── The day it closed ────────────────────────────────────────────────────────

test('the closing day is the day entered, not the evening before in California', () => {
  assert.equal(formatClosedOn('2026-07-13T00:00:00.000Z', 'de'), '13. Juli 2026');
  assert.equal(formatClosedOn('2026-07-13T00:00:00.000Z', 'en'), 'July 13, 2026');
  assert.equal(formatClosedMonth('2026-07-13T00:00:00.000Z', 'de'), 'Juli 2026');
});

// ── The park page's ride search ──────────────────────────────────────────────

test('the search gets each closed ride with the month it closed as finished text', () => {
  const rides = closedRidesForSearch(
    [
      {
        id: 'id-x2',
        name: 'X2',
        slug: 'x2',
        land: 'Thrill Rides',
        retiredAt: '2026-07-13T00:00:00.000Z',
      },
    ],
    'de',
    (month) => `seit ${month}`
  );
  assert.deepEqual(rides, [
    { id: 'id-x2', name: 'X2', slug: 'x2', land: 'Thrill Rides', since: 'seit Juli 2026' },
  ]);
});

test('a park without a closed ride ships no list at all', () => {
  assert.equal(
    closedRidesForSearch([], 'de', (m) => m),
    undefined
  );
  assert.equal(
    closedRidesForSearch(undefined, 'de', (m) => m),
    undefined
  );
});

// ── Title and description ────────────────────────────────────────────────────

const messages = JSON.parse(readFileSync(new URL('../messages/de.json', import.meta.url), 'utf8'));
/** The `seo.attraction` strings with plain `{name}` substitution — none of them use ICU syntax. */
const t = (key, values = {}) =>
  messages.seo.attraction[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
const phrase = { locale: 'de', articleDe: null };

test('the title says the ride is closed, not that it has live wait times', () => {
  const title = buildClosedRideTitle('X2', 'Six Flags Magic Mountain', t, phrase);
  assert.equal(title, 'X2 in Six Flags Magic Mountain – dauerhaft geschlossen');
  assert.doesNotMatch(title, /LIVE/);
});

test('a title too long for the park drops the park, not the closure', () => {
  const title = buildClosedRideTitle(
    'Batman The Ride: The Dark Knight Coaster Experience',
    'Six Flags Magic Mountain',
    t,
    phrase
  );
  assert.equal(
    title,
    'Batman The Ride: The Dark Knight Coaster Experience – dauerhaft geschlossen'
  );
});

test('the description carries the date, the weekday peak in steps of five and the builder', () => {
  const description = buildClosedRideDescription(
    'X2',
    'Six Flags Magic Mountain',
    '13. Juli 2026',
    { weekdayPeak: 83, manufacturer: 'Arrow Dynamics', openedYear: 2002 },
    t,
    phrase
  );
  assert.equal(
    description,
    'X2 in Six Flags Magic Mountain ist seit dem 13. Juli 2026 dauerhaft geschlossen. ' +
      'Davor dauerte das Anstehen an normalen Wochentagen bis zu 85 Minuten.'
  );
  assert.ok(description.length <= 160, `${description.length} characters`);
});

test('without wait figures it keeps the builder and the year', () => {
  const description = buildClosedRideDescription(
    'X2',
    'Six Flags Magic Mountain',
    '13. Juli 2026',
    { weekdayPeak: null, manufacturer: 'Arrow Dynamics', openedYear: 2002 },
    t,
    phrase
  );
  assert.equal(
    description,
    'X2 in Six Flags Magic Mountain ist seit dem 13. Juli 2026 dauerhaft geschlossen. ' +
      'Gebaut von Arrow Dynamics, eröffnet 2002.'
  );
});

test('with nothing else known it is the one sentence', () => {
  assert.equal(
    buildClosedRideDescription(
      'Dino-Sue',
      'Animal Kingdom',
      '1. Februar 2026',
      { weekdayPeak: null },
      t,
      phrase
    ),
    'Dino-Sue in Animal Kingdom ist seit dem 1. Februar 2026 dauerhaft geschlossen.'
  );
});

if (failures > 0) {
  console.error(`\n${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(`✓ closed-ride: ${checks} checks passed.`);
