/**
 * Pins how the popular-parks surfaces use the page-view counter (docs/features/most-read.md):
 *
 *   - a park ranking (UUIDs) resolves against the geo structure; unknown ids and parks under
 *     VIEWED_PARK_MIN_VIEWS drop out, the order stays
 *   - `rankedFirst` puts the counted parks ahead of a hand-picked list, without doubles, at its
 *     length
 *   - the homepage's featured parks are the hand-picked ones where nothing was counted, and a
 *     counted park the structure has leads them
 *   - the parks menu's rail leads with the counted parks, with a photo or without one, and only a
 *     counted park goes without a photo
 *   - the hero's fallback (`getMostViewedParks`) leads with the language's most viewed parks in the
 *     request ranking's shape, tops up from it, and falls back to it when the counter fails
 *
 * Synthetic geo structure, stubbed API. Needs the generated manifests and seed (`pnpm prebuild`, or
 * `pnpm test:unit`, which writes an empty seed offline).
 *
 * Run: pnpm test:viewed-parks
 */

import assert from 'node:assert/strict';
import {
  VIEWED_PARK_MIN_VIEWS,
  rankedFirst,
  resolveViewedParks,
} from '../lib/parks/viewed-parks.ts';
import {
  FEATURED_PARK_SLUGS,
  extractFeaturedParks,
} from '../components/home/featured-parks-section.ts';
import { MOST_READ_SEED } from '../lib/blog/most-read-seed.generated.ts';
import { getMostViewedParks } from '../lib/api/parks.ts';
import { getFeaturedParksMenu } from '../lib/navigation/featured-parks-menu.ts';

let checks = 0;
const check = async (fn) => {
  await fn();
  checks += 1;
};

const park = (id, slug, extra = {}) => ({
  id,
  slug,
  name: slug,
  country: '',
  attractionCount: 1,
  hasOperatingSchedule: true,
  ...extra,
});
const city = (slug, parks) => ({
  name: slug,
  slug,
  parks,
  parkCount: parks.length,
  openParkCount: 0,
});
const country = (slug, cities) => ({
  name: slug,
  slug,
  code: slug.slice(0, 2).toUpperCase(),
  cities,
  cityCount: cities.length,
  parkCount: 0,
  openParkCount: 0,
});

// Every hand-picked German park, plus two more, under made-up ids.
const seedPark = MOST_READ_SEED.parks?.de?.[0];
const germanParks = FEATURED_PARK_SLUGS.de.map((slug, index) => park(`id-${index}`, slug));
const geo = {
  continents: [
    {
      name: 'Europe',
      slug: 'europe',
      countryCount: 1,
      parkCount: 0,
      openParkCount: 0,
      countries: [
        country('germany', [
          city('rust', [...germanParks, park('id-x', 'extra-park'), park('id-y', 'other-park')]),
        ]),
      ],
    },
  ],
  continentCount: 1,
  countryCount: 1,
  cityCount: 1,
  parkCount: 0,
  attractionCount: 0,
  generatedAt: '2026-10-27T00:00:00Z',
};

await check(() => {
  const resolved = resolveViewedParks(
    [
      { key: 'id-y', views: 40 },
      { key: 'not-a-park', views: 30 },
      { key: 'id-x', views: VIEWED_PARK_MIN_VIEWS },
      { key: 'id-0', views: VIEWED_PARK_MIN_VIEWS - 1 },
    ],
    geo
  );
  assert.deepEqual(
    resolved.map((p) => p.id),
    ['id-y', 'id-x'],
    'unknown ids and thin counts drop out, the order stays'
  );
  assert.equal(resolved[0].href, '/parks/europe/germany/rust/other-park', 'with its page path');
  assert.equal(resolved[0].views, 40, 'and its views');
});

await check(() => {
  const out = rankedFirst(['b', 'x'], ['a', 'b', 'c', 'd'], (s) => s, 4);
  assert.deepEqual(out, ['b', 'x', 'a', 'c'], 'counted first, no doubles, at the fallback length');
  assert.deepEqual(
    rankedFirst([], ['a', 'b'], (s) => s, 5),
    ['a', 'b'],
    'never longer than both'
  );
});

await check(() => {
  const featured = extractFeaturedParks(geo, 'de');
  assert.deepEqual(
    featured.map((p) => p.slug),
    FEATURED_PARK_SLUGS.de,
    'nothing counted that the structure has: the hand-picked parks, in their order'
  );
});

await check(() => {
  if (!seedPark) return;
  const withSeed = structuredClone(geo);
  withSeed.continents[0].countries[0].cities[0].parks.push(park(seedPark.id, 'seed-park'));
  const featured = extractFeaturedParks(withSeed, 'de');
  assert.equal(featured[0].parkId, seedPark.id, 'a counted park the structure has leads');
  assert.equal(featured.length, FEATURED_PARK_SLUGS.de.length, 'at the hand-picked length');
});

await check(() => {
  const counted = (MOST_READ_SEED.parks?.de ?? []).slice(0, 6).map((p) => p.href);
  const rail = getFeaturedParksMenu('de');
  assert.deepEqual(
    rail.slice(0, counted.length).map((card) => card.href),
    counted,
    'the counted parks lead the rail, with a photo or without'
  );
  assert.ok(
    rail.every((card) => card.image || counted.includes(card.href)),
    'only a counted park goes without a photo'
  );
});

// The API, stubbed for the hero's fallback.
let viewsDown = false;
globalThis.fetch = async (url) => {
  const { pathname } = new URL(String(url));
  if (pathname === '/v1/page-views/top') {
    if (viewsDown) return new Response('down', { status: 503 });
    return Response.json({
      items: [
        { key: 'id-y', views: 50 },
        { key: 'id-2', views: 20 },
      ],
    });
  }
  if (pathname === '/v1/discovery/geo') return Response.json(geo);
  if (pathname === '/v1/parks/popular') {
    return Response.json(
      ['id-2', 'id-4', 'id-5'].map((id, index) => ({
        rank: index + 1,
        requests: 900 - index,
        id,
        name: id,
        slug: id,
        url: `/v1/parks/europe/germany/rust/${id}`,
        country: 'Germany',
        city: 'Rust',
        continent: 'Europe',
      }))
    );
  }
  return new Response('not stubbed', { status: 404 });
};

await check(async () => {
  const parks = await getMostViewedParks('de', 4);
  assert.deepEqual(
    parks.map((p) => p.id),
    ['id-y', 'id-2', 'id-4', 'id-5'],
    'the language’s most viewed lead, the request ranking tops up without doubles'
  );
  assert.deepEqual(
    parks.map((p) => p.rank),
    [1, 2, 3, 4],
    'ranked anew'
  );
  assert.equal(parks[0].url, '/v1/parks/europe/germany/rust/other-park', 'in the API’s url shape');
});

await check(async () => {
  viewsDown = true;
  const parks = await getMostViewedParks('fr', 3);
  assert.deepEqual(
    parks.map((p) => p.id),
    ['id-2', 'id-4', 'id-5'],
    'a failed counter leaves the request ranking'
  );
  viewsDown = false;
});

console.log(`✓ ${checks} checks passed.`);
