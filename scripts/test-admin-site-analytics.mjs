/**
 * Unit tests for the pure half of the traffic dashboards (`lib/admin/site-analytics.ts`): the
 * window and language a URL may ask for, the change against the window before, the words for the
 * API's closed lists, and the matrices the search page is drawn from.
 *
 * Run: pnpm test:admin-site-analytics
 */
import assert from 'node:assert/strict';
import {
  BROWSE_ITEM_LABEL,
  EVENT_INFO,
  PAGE_TYPE_LABEL,
  RESULT_KIND_LABEL,
  SEARCH_SURFACES,
  SURFACE_LABEL,
  breakdownValueLabel,
  browseItemMatrix,
  countMatrix,
  deltaOf,
  entityEditorHref,
  entityPublicHref,
  eventLabel,
  formatShare,
  hasTraffic,
  heroOrHeader,
  isSearchEvent,
  parseTrafficDays,
  parseTrafficLocale,
  pathEditorHref,
  positionRows,
  propValueLabel,
  sortPropValues,
  surfacePageTypeMatrix,
  surfaceRows,
  surfaceSeries,
  surfaceViewportMatrix,
  trafficQuery,
  withoutEmptyColumns,
} from '../lib/admin/site-analytics.ts';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const search = {
  from: '2026-10-26',
  to: '2026-10-28',
  days: 3,
  locale: null,
  surfaces: SEARCH_SURFACES.map((surface, index) => ({
    surface,
    opened: [120, 300, 40, 10, 0, 0, 5][index],
    typed: 0,
    resultClicks: 0,
    browseClicks: 0,
    noResults: 0,
    viewAll: 0,
    clickRate: 0,
    noResultRate: 0,
  })),
  bySurfaceAndPageType: [
    { surface: 'header', pageType: 'park', opened: 200 },
    { surface: 'header', pageType: 'home', opened: 20 },
    { surface: 'hero', pageType: 'home', opened: 120 },
    { surface: 'header', pageType: 'attraction', opened: 80 },
  ],
  bySurfaceAndViewport: [
    { surface: 'hero', viewport: 'mobile', opened: 90 },
    { surface: 'hero', viewport: 'desktop', opened: 30 },
  ],
  resultTypes: [],
  positions: [
    { position: '2', clicks: 5 },
    { position: '1', clicks: 20 },
  ],
  browseItems: [
    { surface: 'hero', item: 'popular_park', clicks: 12 },
    { surface: 'header', item: 'nearby_park', clicks: 30 },
    { surface: 'header', item: 'popular_park', clicks: 4 },
  ],
  series: [
    { day: '2026-10-27', surface: 'hero', opened: 4 },
    { day: '2026-10-26', surface: 'hero', opened: 3 },
    { day: '2026-10-26', surface: 'header', opened: 9 },
    { day: '2026-10-28', surface: 'header', opened: 7 },
  ],
};

test('the window falls back to 30 days for anything the dashboards do not offer', () => {
  assert.equal(parseTrafficDays('7'), 7);
  assert.equal(parseTrafficDays('365'), 365);
  assert.equal(parseTrafficDays('1'), 1);
  assert.equal(parseTrafficDays('14'), 30);
  assert.equal(parseTrafficDays('abc'), 30);
  assert.equal(parseTrafficDays(null), 30);
});

test('a language is one of the six or none', () => {
  assert.equal(parseTrafficLocale('de'), 'de');
  assert.equal(parseTrafficLocale('xx'), null);
  assert.equal(parseTrafficLocale(null), null);
});

test('the query carries the window, the language only when set, and the extras', () => {
  assert.equal(trafficQuery({ days: 30, locale: null }), 'days=30');
  assert.equal(trafficQuery({ days: 7, locale: 'de' }, { limit: 50 }), 'days=7&locale=de&limit=50');
});

test('a change is flat under half a percent, new out of nothing, and rounded otherwise', () => {
  assert.deepEqual(deltaOf(100, 100), { direction: 'flat', percent: 0 });
  assert.deepEqual(deltaOf(1002, 1000), { direction: 'flat', percent: 0 });
  assert.deepEqual(deltaOf(120, 100), { direction: 'up', percent: 20 });
  assert.deepEqual(deltaOf(75, 100), { direction: 'down', percent: 25 });
  assert.deepEqual(deltaOf(5, 0), { direction: 'new', percent: null });
  assert.deepEqual(deltaOf(0, 0), { direction: 'flat', percent: null });
  assert.deepEqual(deltaOf(0, 10), { direction: 'down', percent: 100 });
});

test('an empty window has no traffic, one visit is traffic', () => {
  const zero = { pageviews: 0, visits: 0, visitors: 0, events: 0, viewsPerVisit: 0 };
  assert.equal(hasTraffic(zero), false);
  assert.equal(hasTraffic({ ...zero, visits: 1 }), true);
});

test('a share reads as a percentage with a decimal under ten', () => {
  assert.equal(formatShare(0), '–');
  assert.equal(formatShare(0.0004), '< 0,1 %');
  assert.equal(formatShare(0.042), '4,2 %');
  assert.equal(formatShare(0.42), '42 %');
  assert.equal(formatShare(1), '100 %');
});

test('every event of the schema has a label and a sentence, and no dash that reads as a tell', () => {
  const names = Object.keys(EVENT_INFO);
  // The type makes a missing event a compile error; this only guards the list against emptying.
  assert.ok(names.length >= 36);
  for (const name of names) {
    const { label, when } = EVENT_INFO[name];
    assert.ok(label.length > 0 && when.endsWith('.'), name);
    assert.doesNotMatch(label + when, /—/, name);
  }
  assert.equal(eventLabel('search_opened'), 'Suche geöffnet');
  assert.equal(eventLabel('brand_new_event'), 'brand_new_event');
});

test('search events are the ones that start with search_', () => {
  assert.equal(isSearchEvent('search_opened'), true);
  assert.equal(isSearchEvent('favorite_add'), false);
});

test('every closed list has a word for each value', () => {
  assert.equal(Object.keys(PAGE_TYPE_LABEL).length, 16);
  assert.equal(Object.keys(SURFACE_LABEL).length, 7);
  assert.equal(Object.keys(RESULT_KIND_LABEL).length, 8);
  assert.equal(Object.keys(BROWSE_ITEM_LABEL).length, 5);
  assert.equal(breakdownValueLabel('os', 'macos'), 'macOS');
  assert.equal(breakdownValueLabel('browser', 'samsung'), 'Samsung Internet');
  assert.equal(breakdownValueLabel('country', 'DE'), 'Deutschland');
  assert.equal(breakdownValueLabel('country', 'zz'), 'Unbekannt');
  assert.equal(breakdownValueLabel('locale', 'nl'), 'Nederlands');
  assert.equal(breakdownValueLabel('page_type', 'park_calendar'), 'Park, Kalender');
  assert.equal(breakdownValueLabel('referrer', 'google.com'), 'google.com');
  assert.equal(breakdownValueLabel('page_type', 'new_type'), 'new_type');
  assert.equal(propValueLabel('surface', 'hero'), 'Hero (Startseite)');
  assert.equal(propValueLabel('type', 'park'), 'park');
  assert.equal(propValueLabel('position', '4-5'), 'Platz 4-5');
});

test('positions are listed first to last, other properties as sent', () => {
  const values = [{ value: '4-5' }, { value: '1' }, { value: '11+' }, { value: '2' }];
  assert.deepEqual(
    sortPropValues('position', values).map((entry) => entry.value),
    ['1', '2', '4-5', '11+']
  );
  assert.deepEqual(sortPropValues('result', values), values);
});

test('an entity links to its editor by id, a show through its public address', () => {
  const park = { id: 'p1', kind: 'park', url: '/parks/europe/germany/bruehl/phantasialand' };
  assert.equal(entityPublicHref(park), '/de/parks/europe/germany/bruehl/phantasialand');
  assert.equal(entityEditorHref(park), '/admin/parks/p1');
  assert.equal(
    entityEditorHref({ ...park, id: 'a1', kind: 'attraction' }),
    '/admin/attractions/a1'
  );
  assert.equal(
    entityEditorHref({ ...park, id: 's1', kind: 'show' }),
    '/admin/go?path=%2Fde%2Fparks%2Feurope%2Fgermany%2Fbruehl%2Fphantasialand'
  );
});

test('only the path of a park or a ride has an editor', () => {
  assert.equal(
    pathEditorHref('/de/parks/europe/germany/bruehl/phantasialand'),
    '/admin/go?path=%2Fde%2Fparks%2Feurope%2Fgermany%2Fbruehl%2Fphantasialand'
  );
  assert.ok(pathEditorHref('/en/parks/europe/germany/bruehl/phantasialand/taron'));
  assert.equal(pathEditorHref('/en/parks/europe/germany'), null);
  assert.equal(pathEditorHref('/en/blog/some-post'), null);
  assert.equal(pathEditorHref('/de'), null);
});

test('the surfaces are ranked by openings with their share of all of them', () => {
  const rows = surfaceRows(search);
  assert.deepEqual(
    rows.map((row) => row.surface),
    ['header', 'hero', 'keyboard', 'search_page', 'guides_panel', 'listing_guides', 'listing_news']
  );
  assert.equal(rows[0].openedShare, 300 / 475);
});

test('hero or header names the leader and the factor', () => {
  assert.deepEqual(heroOrHeader(search), { hero: 120, header: 300, leader: 'header', ratio: 2.5 });
  const tie = { ...search, surfaces: search.surfaces.map((row) => ({ ...row, opened: 7 })) };
  assert.equal(heroOrHeader(tie).leader, null);
  const none = { ...search, surfaces: search.surfaces.map((row) => ({ ...row, opened: 0 })) };
  assert.deepEqual(heroOrHeader(none), { hero: 0, header: 0, leader: null, ratio: null });
  const onlyHero = {
    ...search,
    surfaces: search.surfaces.map((row) => ({ ...row, opened: row.surface === 'hero' ? 9 : 0 })),
  };
  assert.deepEqual(heroOrHeader(onlyHero), { hero: 9, header: 0, leader: 'hero', ratio: null });
});

test('the page type matrix drops page types nobody searched from and sums rows and columns', () => {
  const matrix = surfacePageTypeMatrix(search);
  assert.deepEqual(
    matrix.rows.map((row) => row.key),
    ['home', 'park', 'attraction']
  );
  const home = matrix.rows.find((row) => row.key === 'home');
  assert.equal(home.total, 140);
  assert.equal(matrix.max, 200);
  const headerColumn = matrix.columns.indexOf('header');
  assert.equal(matrix.columnTotals[headerColumn], 300);
});

test('the viewport matrix lists surfaces over the three widths', () => {
  const matrix = surfaceViewportMatrix(search);
  assert.deepEqual(matrix.columns, ['mobile', 'tablet', 'desktop']);
  assert.deepEqual(matrix.rows, [{ key: 'hero', cells: [90, 0, 30], total: 120 }]);
});

test('a matrix adds cells that name the same row and column', () => {
  const matrix = countMatrix(
    [
      { row: 'a', column: 'x', value: 2 },
      { row: 'a', column: 'x', value: 3 },
    ],
    ['a', 'b'],
    ['x', 'y']
  );
  assert.deepEqual(matrix.rows, [{ key: 'a', cells: [5, 0], total: 5 }]);
});

test('the suggestion matrix lists the kinds that were picked, over the surfaces', () => {
  const matrix = browseItemMatrix(search);
  assert.deepEqual(
    matrix.rows.map((row) => [row.key, row.total]),
    [
      ['nearby_park', 30],
      ['popular_park', 16],
    ]
  );
  assert.equal(matrix.max, 30);
});

test('a matrix can drop the columns nobody counted in', () => {
  const matrix = withoutEmptyColumns(browseItemMatrix(search));
  assert.deepEqual(matrix.columns, ['hero', 'header']);
  assert.deepEqual(matrix.columnTotals, [12, 34]);
  assert.deepEqual(matrix.rows[0], { key: 'nearby_park', cells: [0, 30], total: 30 });
});

test('positions keep all six buckets in order, a missing one at zero', () => {
  assert.deepEqual(positionRows(search), [
    { position: '1', clicks: 20 },
    { position: '2', clicks: 5 },
    { position: '3', clicks: 0 },
    { position: '4-5', clicks: 0 },
    { position: '6-10', clicks: 0 },
    { position: '11+', clicks: 0 },
  ]);
});

test('a daily series is laid on the days given, a missing day at zero', () => {
  const days = ['2026-10-26', '2026-10-27', '2026-10-28'];
  const series = surfaceSeries(search, days);
  assert.deepEqual(series.hero, [3, 4, 0]);
  assert.deepEqual(series.header, [9, 0, 7]);
  assert.deepEqual(series.keyboard, [0, 0, 0]);
});

console.log(`\n${passed} cases passed.`);
