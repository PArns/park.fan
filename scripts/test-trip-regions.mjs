/**
 * Unit tests for the trip-region registry (`lib/trip-regions/registry.ts`) and what is built from
 * it: the URLs `next.config.ts` serves (`lib/trip-regions/routes.ts`), here for every region as if
 * it were live, so a coming region's segments are tested before it goes live; the month redirects
 * of the proxy; the region copy a route ships to its Client Components; the code words a region may
 * say its own way; and the calendar file's zones.
 *
 * Run: pnpm test:trip-regions
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match.js';
import { locales } from '../i18n/config.ts';
import { pickRouteMessages } from '../i18n/client-messages.ts';
import { BEST_TIME_SEGMENTS } from '../lib/best-time/segments.ts';
import {
  LIVE_TRIP_REGIONS,
  TRIP_REGIONS,
  liveTripRegion,
  tripRegionBySegment,
  tripRegionConfig,
  tripRegionSegment,
  tripRegionTitle,
} from '../lib/trip-regions/registry.ts';
import {
  tripRegionFolder,
  tripRegionHeaders,
  tripRegionRedirects,
  tripRegionRewrites,
} from '../lib/trip-regions/routes.ts';
import { tripRegionBestTimePath, tripRegionPath } from '../lib/trip-regions/paths.ts';
import { tripRegionRedirect } from '../lib/trip-regions/redirects.ts';
import { regionOrShared } from '../lib/trip-regions/region-words.ts';
import { buildTripIcs } from '../lib/trip-regions/plan-ics.ts';
import { shortParkName } from '../lib/trip-regions/hub-data.ts';

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

const messages = Object.fromEntries(
  locales.map((l) => [
    l,
    JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), 'utf8')),
  ])
);

// ── The registry ────────────────────────────────────────────────────────────

test('every region once, with a segment in every locale, written as a slug', () => {
  assert.equal(new Set(TRIP_REGIONS.map((r) => r.slug)).size, TRIP_REGIONS.length);
  for (const region of TRIP_REGIONS) {
    assert.match(region.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const locale of locales) {
      assert.match(region.segments[locale], /^[a-z0-9]+(-[a-z0-9]+)*$/, `${region.slug} ${locale}`);
    }
  }
});

test('the regions the owner decided on, with the segments he gave', () => {
  assert.deepEqual(
    TRIP_REGIONS.map((r) => r.slug),
    ['orlando', 'southern-california', 'japan', 'paris']
  );
  assert.deepEqual(tripRegionConfig('southern-california').segments, {
    en: 'california',
    de: 'kalifornien',
    nl: 'californie',
    fr: 'californie',
    es: 'california',
    it: 'california',
  });
  assert.deepEqual(
    locales.map((l) => tripRegionSegment(tripRegionConfig('japan'), l)),
    ['japan', 'japan', 'japon', 'giappone', 'japan', 'japon']
  );
  assert.ok(locales.every((l) => tripRegionSegment(tripRegionConfig('paris'), l) === 'paris'));
});

test('Orlando alone is live until the next regions have their hubs', () => {
  assert.deepEqual(
    LIVE_TRIP_REGIONS.map((r) => r.slug),
    ['orlando']
  );
  assert.equal(liveTripRegion('paris'), undefined);
  assert.equal(tripRegionConfig('paris')?.slug, 'paris');
});

test('no segment is another route, nor another region', () => {
  const folders = readdirSync(new URL('../app/[locale]/', import.meta.url), {
    withFileTypes: true,
  })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const owner = new Map();
  for (const region of TRIP_REGIONS) {
    for (const segment of new Set(Object.values(region.segments))) {
      assert.ok(!folders.includes(segment), `${region.slug}: /${segment} is a route folder`);
      assert.ok(
        !Object.values(BEST_TIME_SEGMENTS).includes(segment),
        `${region.slug}: /${segment} is the best-time hub`
      );
      assert.ok(!owner.has(segment), `${segment} is ${owner.get(segment)}'s and ${region.slug}'s`);
      owner.set(segment, region.slug);
    }
  }
});

test('a zone the browser knows, a middle on the map', () => {
  for (const region of TRIP_REGIONS) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en', { timeZone: region.timezone }));
    assert.ok(Math.abs(region.centre.latitude) <= 90 && Math.abs(region.centre.longitude) <= 180);
  }
});

test('a live region has its own words in every locale', () => {
  for (const region of LIVE_TRIP_REGIONS) {
    for (const locale of locales) {
      const own = messages[locale].tripRegions?.[region.slug];
      assert.ok(own, `${region.slug} has no tripRegions.${region.slug} in ${locale}`);
      for (const key of ['name', 'area', 'calendar', 'calendarHint']) {
        assert.equal(typeof own.nav?.[key], 'string', `${locale} ${region.slug}.nav.${key}`);
      }
      // The head, the metadata and the dataset have no fallback; every other block of the hub draws
      // nothing without its words (docs/features/trip-regions.md#for-every-hub).
      for (const key of [
        'title',
        'monthTitle',
        'metaTitle',
        'metaTitleMonth',
        'metaTitleMonthShort',
        'metaDescriptionPlain',
        'metaDescriptionMonthPlain',
      ]) {
        assert.equal(typeof own.hub?.[key], 'string', `${locale} ${region.slug}.hub.${key}`);
      }
      for (const key of ['name', 'description']) {
        assert.equal(
          typeof own.hub?.dataset?.[key],
          'string',
          `${locale} ${region.slug}.hub.dataset.${key}`
        );
      }
      for (const page of region.bestTime) {
        assert.equal(typeof own.bestTime?.title?.[page.id], 'string', `${locale} ${page.id}`);
      }
      for (const hotel of region.hotels) {
        assert.equal(typeof own.planner?.options?.hotelLabel?.[hotel.key], 'string', hotel.key);
      }
    }
  }
});

test('a live region names its own page first among its best-time pages', () => {
  for (const region of LIVE_TRIP_REGIONS) {
    assert.equal(region.bestTime[0]?.id, 'region');
    assert.equal(region.bestTime[0]?.segment, undefined);
  }
});

test('the admin writes a region in title case', () => {
  assert.equal(tripRegionTitle('southern-california'), 'Southern California');
  assert.equal(tripRegionTitle('orlando'), 'Orlando');
});

// ── The URLs ────────────────────────────────────────────────────────────────

/** Where the first rule of `rules` that matches `path` sends it, as Next fills a destination. */
function follow(rules, path) {
  for (const rule of rules) {
    const params = getPathMatch(rule.source)(path);
    if (!params) continue;
    return rule.destination.replace(/:([a-z]+)\*?/gi, (_, name) => {
      const value = params[name];
      return Array.isArray(value) ? value.join('/') : (value ?? '');
    });
  }
  return null;
}
const clean = (path) => path?.replace(/\/+$/, '') ?? null;

const rewrites = tripRegionRewrites(TRIP_REGIONS);
const redirects = tripRegionRedirects(TRIP_REGIONS);

test('every region answers on its own segment from one route folder', () => {
  for (const region of TRIP_REGIONS) {
    for (const locale of locales) {
      const seg = region.segments[locale];
      const folder = tripRegionFolder(locale, region.slug);
      assert.equal(clean(follow(rewrites, `/${locale}/${seg}`)), folder);
      assert.equal(follow(rewrites, `/${locale}/${seg}/2027/3`), `${folder}/2027/3`);
      if (region.bestTime.length > 0) {
        assert.equal(
          follow(rewrites, `/${locale}/${seg}/${BEST_TIME_SEGMENTS[locale]}`),
          `${folder}/best-time-to-visit`
        );
      }
    }
  }
});

test("Orlando's best-time pages and resorts go to the best-time folder", () => {
  assert.equal(
    follow(rewrites, '/de/orlando/beste-reisezeit/disney-world'),
    '/de/trip-regions/orlando/best-time-to-visit/disney-world'
  );
  assert.equal(
    follow(rewrites, '/en/orlando/best-time-to-visit/universal-orlando'),
    '/en/trip-regions/orlando/best-time-to-visit/universal-orlando'
  );
});

test('the route folder itself is never a second address', () => {
  assert.equal(clean(follow(redirects, '/de/trip-regions/orlando')), '/de/orlando');
  assert.equal(follow(redirects, '/fr/trip-regions/japan/2027/3'), '/fr/japon/2027/3');
});

test("another locale's spelling goes to the locale's own, one locale's spelling to its locale", () => {
  assert.equal(clean(follow(redirects, '/de/california')), '/de/kalifornien');
  assert.equal(follow(redirects, '/it/japon/2027/3'), '/it/giappone/2027/3');
  assert.equal(clean(follow(redirects, '/kalifornien')), '/de/kalifornien');
  assert.equal(clean(follow(redirects, '/giappone')), '/it/giappone');
  // Spelled by several locales: the proxy negotiates, as for /orlando.
  assert.equal(follow(redirects, '/californie'), null);
  assert.equal(follow(redirects, '/orlando'), null);
  assert.equal(follow(redirects, '/en/orlando'), null);
});

test("a best-time segment in another locale's spelling goes to the locale's own", () => {
  assert.equal(
    follow(redirects, '/de/orlando/best-time-to-visit/disney-world'),
    '/de/orlando/beste-reisezeit/disney-world'
  );
  assert.equal(follow(redirects, '/orlando/beste-reisezeit'), '/de/orlando/beste-reisezeit');
});

test("a region's hub, months and best-time pages each have an edge window", () => {
  const windows = tripRegionHeaders(TRIP_REGIONS, locales);
  const windowOf = (path) => {
    let found = null;
    for (const rule of windows) if (getPathMatch(rule.source)(path)) found = rule.window;
    return found;
  };
  assert.match(windowOf('/de/kalifornien'), /s-maxage=3600/);
  assert.match(windowOf('/fr/japon/2027/3'), /s-maxage=43200/);
  assert.match(windowOf('/de/orlando/beste-reisezeit/disney-world'), /s-maxage=3600/);
});

test('paths are spelled per locale, with the best-time segment after the region', () => {
  assert.equal(tripRegionPath('orlando', 'nl'), '/orlando');
  assert.equal(
    tripRegionPath('southern-california', 'de', { year: 2027, month: 3 }),
    '/kalifornien/2027/3'
  );
  assert.equal(tripRegionPath('japan', 'it'), '/giappone');
  assert.equal(tripRegionBestTimePath('orlando', 'fr'), '/orlando/meilleure-periode-pour-visiter');
  assert.equal(
    tripRegionBestTimePath('orlando', 'es', 'universal-orlando'),
    '/orlando/mejor-epoca-para-visitar/universal-orlando'
  );
  assert.equal(tripRegionBestTimePath('orlando', 'en', 'region'), '/orlando/best-time-to-visit');
});

test('a segment names its live region and the locales that spell it', () => {
  assert.deepEqual(tripRegionBySegment('orlando')?.locales.toSorted(), locales.toSorted());
  assert.equal(tripRegionBySegment('kalifornien'), null);
});

test('the proxy redirects months of live regions only', () => {
  const now = { year: 2026, month: 11 };
  assert.equal(tripRegionRedirect('/de/orlando/2027/03', now), '/de/orlando/2027/3');
  assert.equal(tripRegionRedirect('/de/kalifornien/2027/03', now), null);
});

// ── Messages, words, files ──────────────────────────────────────────────────

test("a route ships the region's own copy under the alias, and only that region's", () => {
  const all = {
    tripPlanner: { a: 'shared' },
    tripRegions: { orlando: { planner: { b: 'own' }, hub: { c: 'hub' } }, paris: { planner: {} } },
  };
  assert.deepEqual(pickRouteMessages(all, ['tripPlanner', 'tripRegion.planner'], 'orlando'), {
    tripPlanner: { a: 'shared' },
    tripRegion: { planner: { b: 'own' } },
  });
  assert.deepEqual(pickRouteMessages(all, ['tripPlanner'], 'orlando'), {
    tripPlanner: { a: 'shared' },
  });
});

test("a code reads the region's own words where it has them", () => {
  const words = (table) => Object.assign((key) => table[key], { has: (key) => key in table });
  const own = words({ 'reason.no_school_break': 'No US school holidays.' });
  const shared = words({ 'reason.weekday': 'Weekdays.' });
  assert.equal(regionOrShared(own, shared, 'reason.no_school_break'), 'No US school holidays.');
  assert.equal(regionOrShared(own, shared, 'reason.weekday'), 'Weekdays.');
});

test('every region zone has its VTIMEZONE in the calendar file', () => {
  for (const region of TRIP_REGIONS) {
    const file = buildTripIcs(
      [
        {
          date: '2027-03-01',
          uid: 'a@park.fan',
          summary: 'x',
          description: [],
          start: '2027-03-01T09:00:00Z',
          end: '2027-03-01T17:00:00Z',
        },
      ],
      { now: 0, calendarName: 'x', timeZone: region.timezone }
    );
    assert.ok(file.includes(`TZID:${region.timezone}\r\n`), region.timezone);
    assert.ok(file.includes(`DTSTART;TZID=${region.timezone}:`), region.timezone);
  }
});

test("a park's place word is dropped, every region's", () => {
  assert.equal(shortParkName('SeaWorld Orlando'), 'SeaWorld');
  assert.equal(shortParkName('Busch Gardens Tampa Bay'), 'Busch Gardens');
  assert.equal(shortParkName("Disney's Animal Kingdom Theme Park"), 'Animal Kingdom');
});

console.log(`\n${passed} passed`);
