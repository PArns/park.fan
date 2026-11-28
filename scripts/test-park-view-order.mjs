/**
 * Pins how a country's park list follows the views in the reader's language (PAR-1090,
 * docs/features/most-read.md#country-lists):
 *
 *   - `parkOrderViews` keeps a park from PARK_ORDER_MIN_VIEWS on, and from a ranking that came back
 *     as long as asked for only the parks above its last entry, since an equal one may lie past
 *     the cut
 *   - `orderCitiesByViews` puts the cities in the order of their most viewed park and the parks of a
 *     city by views; what has no counted views keeps its input order after them, so no views means
 *     the input unchanged
 *   - `getParkOrderViews` asks the one park ranking the hero's fallback asks too, and a failed
 *     counter is no views
 *   - the header menu's country pane orders by the `?locale=` it is asked with and otherwise, or
 *     when the counter fails, by park count and name, still a 200
 *   - a hub's `<lastmod>` fingerprint does not see the order, so a reorder is no content change
 *
 * Synthetic cities in Germany's shape, views as measured for de and nl on 2026-11-28; stubbed API.
 *
 * Run: pnpm test:park-view-order
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PARK_ORDER_MIN_VIEWS,
  VIEWED_PARKS_ASK_FOR,
  VIEWED_PARKS_DAYS,
  orderCitiesByViews,
  parkOrderViews,
} from '../lib/parks/viewed-parks.ts';
import { getParkOrderViews } from '../lib/api/parks.ts';
import { fingerprintGeoHub } from '../lib/seo/content-changes/fingerprint.ts';
import { GET } from '../app/api/nav/geo/[continent]/[country]/route.ts';

let checks = 0;
const check = async (fn) => {
  await fn();
  checks += 1;
};

const city = (name, parks) => ({
  name,
  slug: name.toLowerCase(),
  parkCount: parks.length,
  parks: parks.map((slug) => ({ id: `id-${slug}`, name: slug, slug })),
});
// The API's order: cities A–Z, parks A–Z.
const germany = [
  city('Bottrop', ['movie-park-germany']),
  city('Bruehl', ['phantasialand']),
  city('Guenzburg', ['legoland-deutschland']),
  city('Hassloch', ['plopsaland-deutschland']),
  city('Rust', ['europa-park', 'rulantica', 'traumatica']),
  city('Sierksdorf', ['hansa-park']),
  city('Soltau', ['heide-park']),
];
const ranking = (entries) =>
  Object.entries(entries).map(([slug, views]) => ({ key: `id-${slug}`, views }));
const de = ranking({
  phantasialand: 582,
  'europa-park': 332,
  'heide-park': 40,
  'legoland-deutschland': 38,
  traumatica: 34,
  'movie-park-germany': 30,
  'plopsaland-deutschland': 27,
  rulantica: 23,
  'hansa-park': 7,
});
const nl = ranking({ phantasialand: 46, traumatica: 17, rulantica: 5, 'europa-park': 2 });
const order = (cities) => cities.map((c) => `${c.name}: ${c.parks.map((p) => p.slug).join(' ')}`);

await check(() => {
  const views = parkOrderViews(
    [
      { key: 'a', views: PARK_ORDER_MIN_VIEWS + 5 },
      { key: 'b', views: PARK_ORDER_MIN_VIEWS },
      { key: 'c', views: PARK_ORDER_MIN_VIEWS - 1 },
    ],
    VIEWED_PARKS_ASK_FOR
  );
  assert.deepEqual([...views.keys()], ['a', 'b'], 'from the minimum on, nothing under it');
  assert.equal(views.get('a'), PARK_ORDER_MIN_VIEWS + 5, 'with its views');
});

await check(() => {
  const full = parkOrderViews(
    [
      { key: 'a', views: 40 },
      { key: 'b', views: 20 },
      { key: 'c', views: 20 },
    ],
    3
  );
  assert.deepEqual([...full.keys()], ['a'], 'a full list counts only what lies above its cut');
  assert.equal(parkOrderViews([], VIEWED_PARKS_ASK_FOR).size, 0, 'nothing read, nothing counted');
});

await check(() => {
  assert.deepEqual(
    order(orderCitiesByViews(germany, parkOrderViews(de, VIEWED_PARKS_ASK_FOR))),
    [
      'Bruehl: phantasialand',
      'Rust: europa-park traumatica rulantica',
      'Soltau: heide-park',
      'Guenzburg: legoland-deutschland',
      'Bottrop: movie-park-germany',
      'Hassloch: plopsaland-deutschland',
      'Sierksdorf: hansa-park',
    ],
    'de: cities by their most viewed park, parks by views, Hansa-Park under the minimum last'
  );
});

await check(() => {
  assert.deepEqual(
    order(orderCitiesByViews(germany, parkOrderViews(nl, VIEWED_PARKS_ASK_FOR))),
    [
      'Bruehl: phantasialand',
      'Rust: traumatica europa-park rulantica',
      'Bottrop: movie-park-germany',
      'Guenzburg: legoland-deutschland',
      'Hassloch: plopsaland-deutschland',
      'Sierksdorf: hansa-park',
      'Soltau: heide-park',
    ],
    'nl, thin: the two counted parks lead, everything else keeps A–Z'
  );
});

await check(() => {
  const before = structuredClone(germany);
  const unchanged = orderCitiesByViews(germany, new Map());
  assert.deepEqual(unchanged, germany, 'no views: the input order');
  assert.deepEqual(germany, before, 'the input is not reordered in place');
});

// The API, stubbed for the fetcher and the menu route.
const asked = [];
let viewsDown = false;
globalThis.fetch = async (url) => {
  const { pathname, searchParams } = new URL(String(url));
  if (pathname === '/v1/page-views/top') {
    asked.push(Object.fromEntries(searchParams));
    if (viewsDown) return new Response('down', { status: 503 });
    return Response.json({ items: searchParams.get('locale') === 'nl' ? nl : de });
  }
  if (pathname === '/v1/discovery/continents/europe/germany') {
    return Response.json({ data: germany, breadcrumbs: [] });
  }
  return new Response('not stubbed', { status: 404 });
};

await check(async () => {
  asked.length = 0;
  const views = await getParkOrderViews('de');
  assert.equal(views.get('id-phantasialand'), 582, 'the language’s counted parks');
  assert.equal(views.has('id-hansa-park'), false, 'without the thin ones');
  assert.deepEqual(
    asked,
    [
      {
        kind: 'park',
        locale: 'de',
        days: String(VIEWED_PARKS_DAYS),
        limit: String(VIEWED_PARKS_ASK_FOR),
      },
    ],
    'the one park ranking the hero’s fallback asks for'
  );
  viewsDown = true;
  assert.equal((await getParkOrderViews('de')).size, 0, 'a failed counter is no views');
  viewsDown = false;
});

const menu = async (query) => {
  const response = await GET(
    new Request(`https://park.fan/api/nav/geo/europe/germany${query}`, {
      headers: { 'sec-fetch-site': 'same-origin' },
    }),
    { params: Promise.resolve({ continent: 'europe', country: 'germany' }) }
  );
  const body = await response.json();
  return {
    status: response.status,
    cache: response.headers.get('cache-control'),
    cities: body.cities.map((c) => `${c.name}: ${c.parks.map((p) => p.slug).join(' ')}`),
  };
};
const byParkCount = [
  'Rust: europa-park rulantica traumatica',
  'Bottrop: movie-park-germany',
  'Bruehl: phantasialand',
  'Guenzburg: legoland-deutschland',
  'Hassloch: plopsaland-deutschland',
  'Sierksdorf: hansa-park',
  'Soltau: heide-park',
];

await check(async () => {
  const nlMenu = await menu('?locale=nl');
  assert.equal(nlMenu.status, 200);
  assert.deepEqual(
    nlMenu.cities.slice(0, 3),
    ['Bruehl: phantasialand', 'Rust: traumatica europa-park rulantica', byParkCount[1]],
    'the counted parks lead, the rest keeps the park-count order'
  );
  assert.match(nlMenu.cache, /s-maxage=86400/, 'a day at the edge, per locale');
});

await check(async () => {
  asked.length = 0;
  assert.deepEqual((await menu('')).cities, byParkCount, 'no locale: by park count and name');
  assert.deepEqual((await menu('?locale=xx')).cities, byParkCount, 'an unknown one is none');
  assert.equal(asked.length, 0, 'and the counter is not asked');
  viewsDown = true;
  const down = await menu('?locale=de');
  viewsDown = false;
  assert.equal(down.status, 200, 'a failed counter still answers the cities');
  assert.deepEqual(down.cities, byParkCount, 'in the park-count order');
});

await check(() => {
  const panel = readFileSync(
    new URL('../components/layout/parks-menu-panel.tsx', import.meta.url),
    'utf8'
  );
  assert.match(
    panel,
    /fetch\(`\/api\/nav\/geo\/\$\{countryKey\}\?locale=\$\{locale\}`\)/,
    'the menu asks for its country in the reader’s language'
  );
});

await check(() => {
  const parks = germany.flatMap((c) => c.parks);
  assert.equal(
    fingerprintGeoHub(parks),
    fingerprintGeoHub([...parks].reverse()),
    'the hub fingerprint ignores the order, so a reorder moves no <lastmod>'
  );
});

console.log(`✓ ${checks} checks passed.`);
