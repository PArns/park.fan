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
  VISITOR_FILTER_HINT,
  breakdownDetail,
  breakdownValueLabel,
  browseItemMatrix,
  countMatrix,
  crosstabDimensions,
  crosstabLabel,
  crosstabMatrix,
  crosstabValueLabel,
  defaultCrosstab,
  deltaOf,
  entityEditorHref,
  formatDuration,
  hasVisitFilter,
  hourlyNotice,
  unsupportedReason,
  languageName,
  trafficCrosstabDimensions,
  entityPublicHref,
  figureDelta,
  isResolvedEntity,
  mostCommonLabel,
  referrerHref,
  eventLabel,
  formatAxisDay,
  formatChange,
  formatLongDay,
  formatShare,
  hasTraffic,
  heroOrHeader,
  isHourlyPoint,
  isSearchEvent,
  orderKeys,
  parseTrafficFilter,
  parseTrafficFilters,
  parseTrafficLocale,
  pathEditorHref,
  positionRows,
  propValueLabel,
  serializeTrafficFilters,
  sortPropValues,
  surfaceOrder,
  surfacePageTypeMatrix,
  surfaceRows,
  surfaceSeries,
  surfaceDeviceMatrix,
  toggleTrafficFilter,
  trafficQuery,
  visitorsNote,
  withoutEmptyColumns,
  withoutTrafficFilter,
} from '../lib/admin/site-analytics.ts';
import {
  DEFAULT_METRICS,
  TRAFFIC_METRICS,
  formatMetric,
  formatPlotted,
  groupByUnit,
  metricValue,
  plotValue,
  sortPoints,
} from '../lib/admin/traffic-series.ts';

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
    opened: [120, 300, 40, 10, 0, 0, 5, 0][index],
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
  bySurfaceAndDevice: [
    { surface: 'hero', device: 'mobile', opened: 90 },
    { surface: 'hero', device: 'desktop', opened: 30 },
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

test('a language is one of the six or none', () => {
  assert.equal(parseTrafficLocale('de'), 'de');
  assert.equal(parseTrafficLocale('xx'), null);
  assert.equal(parseTrafficLocale(null), null);
});

test('the query carries the window, the language only when set, the filters and the extras', () => {
  const thirty = { kind: 'days', days: 30 };
  assert.equal(trafficQuery({ range: thirty, locale: null }), 'days=30');
  assert.equal(
    trafficQuery({ range: { kind: 'days', days: 7 }, locale: 'de' }, { limit: 50 }),
    'days=7&locale=de&limit=50'
  );
  assert.equal(
    trafficQuery({
      range: { kind: 'dates', from: '2026-10-01', to: '2026-10-27' },
      interval: 'week',
      locale: null,
    }),
    'from=2026-10-01&to=2026-10-27&interval=week'
  );
  assert.equal(
    trafficQuery({
      range: thirty,
      locale: null,
      filters: [
        { dim: 'channel', value: 'search' },
        { dim: 'country', value: 'de' },
      ],
    }),
    'days=30&filter=channel%3Asearch&filter=country%3Ade'
  );
});

test('a filter is a dimension and a value, split at the first colon', () => {
  assert.deepEqual(parseTrafficFilter('channel:search'), { dim: 'channel', value: 'search' });
  assert.deepEqual(parseTrafficFilter('path:/de/a:b'), { dim: 'path', value: '/de/a:b' });
  for (const junk of ['', 'channel', ':x', 'channel:', 'planet:mars']) {
    assert.equal(parseTrafficFilter(junk), null, junk);
  }
});

test('an address holds one value per dimension, the last one named', () => {
  assert.deepEqual(parseTrafficFilters(['channel:search', 'country:de', 'channel:ai', 'bogus:1']), [
    { dim: 'channel', value: 'ai' },
    { dim: 'country', value: 'de' },
  ]);
  assert.deepEqual(serializeTrafficFilters([{ dim: 'os', value: 'ios' }]), ['os:ios']);
});

test('an address from before the device filter, with a viewport or campaign filter, loses only those', () => {
  assert.equal(parseTrafficFilter('viewport:mobile'), null);
  assert.equal(parseTrafficFilter('campaign:summer'), null);
  assert.deepEqual(parseTrafficFilter('device:mobile'), { dim: 'device', value: 'mobile' });
  assert.deepEqual(
    parseTrafficFilters(['viewport:mobile', 'channel:search', 'campaign:summer', 'device:tablet']),
    [
      { dim: 'channel', value: 'search' },
      { dim: 'device', value: 'tablet' },
    ]
  );
  assert.equal(hasVisitFilter(parseTrafficFilters(['campaign:summer'])), false);
});

test('pressing a row sets its filter, replaces its dimension and the same row takes it off', () => {
  const held = [{ dim: 'channel', value: 'search' }];
  assert.deepEqual(toggleTrafficFilter([], 'country', 'de'), [{ dim: 'country', value: 'de' }]);
  assert.deepEqual(toggleTrafficFilter(held, 'channel', 'ai'), [{ dim: 'channel', value: 'ai' }]);
  assert.deepEqual(toggleTrafficFilter(held, 'channel', 'search'), []);
  assert.deepEqual(toggleTrafficFilter(held, 'os', 'ios'), [
    { dim: 'channel', value: 'search' },
    { dim: 'os', value: 'ios' },
  ]);
  assert.deepEqual(withoutTrafficFilter(held, 'channel'), []);
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
  assert.equal(formatShare(0), '0 %');
  assert.equal(formatShare(Number.NaN), '–');
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
  assert.equal(Object.keys(PAGE_TYPE_LABEL).length, 17);
  assert.equal(Object.keys(SURFACE_LABEL).length, 8);
  assert.equal(Object.keys(RESULT_KIND_LABEL).length, 8);
  assert.equal(Object.keys(BROWSE_ITEM_LABEL).length, 5);
  assert.equal(breakdownValueLabel('channel', 'ai'), 'KI-Assistenten');
  assert.equal(breakdownValueLabel('channel', 'new_channel'), 'new_channel');
  assert.equal(breakdownValueLabel('device', 'tablet'), 'Tablet');
  assert.equal(breakdownValueLabel('device', 'smart_tv'), 'smart_tv');
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
    entityEditorHref({ ...park, id: 's1', kind: 'show', url: `${park.url}#shows` }),
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
    [
      'header',
      'hero',
      'keyboard',
      'search_page',
      'guides_panel',
      'listing_guides',
      'listing_news',
      'home_steps',
    ]
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

test('the device matrix lists surfaces over the three device classes', () => {
  const matrix = surfaceDeviceMatrix(search);
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

test('hours of a one-day window read as hours, days as days', () => {
  assert.equal(isHourlyPoint('2026-10-28T07:00:00Z'), true);
  assert.equal(isHourlyPoint('2026-10-28'), false);
  assert.equal(formatAxisDay('2026-10-28T07:00:00Z'), '07:00');
  assert.equal(formatAxisDay('2026-10-28'), '28.10.');
  assert.equal(formatLongDay('2026-10-28T07:00:00Z'), '28.10. 07:00 UTC');
  assert.match(formatLongDay('2026-10-28'), /28\.10\.2026/);
});

test('a change in visits is signed', () => {
  assert.equal(formatChange(12), '+12');
  assert.equal(formatChange(-1234), '−1.234');
  assert.equal(formatChange(0), '±0');
});

test('keys are listed known first, then whatever else turned up, biggest first', () => {
  assert.deepEqual(
    orderKeys(
      ['a', 'b', 'c'],
      [
        { key: 'x', count: 1 },
        { key: 'c', count: 5 },
        { key: 'y', count: 9 },
        { key: 'a', count: 2 },
      ]
    ),
    ['a', 'c', 'y', 'x']
  );
});

test('a search field the build does not know is a row and a column of its own', () => {
  const withNew = {
    ...search,
    surfaces: [...search.surfaces, { ...search.surfaces[0], surface: 'footer_search', opened: 50 }],
    bySurfaceAndPageType: [
      ...search.bySurfaceAndPageType,
      { surface: 'footer_search', pageType: 'brand_new_type', opened: 50 },
    ],
    series: [...search.series, { day: '2026-10-27', surface: 'footer_search', opened: 7 }],
  };
  assert.deepEqual(surfaceOrder(withNew).slice(-1), ['footer_search']);
  const matrix = surfacePageTypeMatrix(withNew);
  assert.equal(matrix.columns.at(-1), 'footer_search');
  assert.equal(matrix.rows.at(-1).key, 'brand_new_type');
  assert.deepEqual(surfaceSeries(withNew, ['2026-10-26', '2026-10-27']).footer_search, [0, 7]);
});

const detail = {
  props: [
    { prop: 'surface', values: [] },
    { prop: 'result', values: [] },
  ],
};

test('an event is crossed by its own properties and the fixed dimensions', () => {
  assert.deepEqual(crosstabDimensions(detail), [
    'prop:surface',
    'prop:result',
    'page_type',
    'device',
    'locale',
    'day',
    'path',
    'country',
    'browser',
    'os',
  ]);
  assert.deepEqual(defaultCrosstab(detail), { row: 'prop:surface', col: 'page_type' });
  assert.deepEqual(defaultCrosstab({ props: [] }), { row: 'page_type', col: 'device' });
  assert.equal(crosstabLabel('prop:surface'), 'Suchfeld');
  assert.equal(crosstabLabel('prop:my_prop'), 'my_prop');
  assert.equal(crosstabLabel('page_type'), 'Seitenart');
});

test('a crosstab value reads in German where it can, and `other` is the remainder', () => {
  assert.equal(crosstabValueLabel('prop:surface', 'hero'), 'Hero (Startseite)');
  assert.equal(crosstabValueLabel('page_type', 'park'), 'Park');
  assert.equal(crosstabValueLabel('device', 'mobile'), 'Telefon');
  assert.equal(crosstabValueLabel('prop:surface', '__rest__'), 'Übrige');
  assert.equal(
    crosstabValueLabel('page_type', 'other'),
    'Sonstige',
    'a real page type is not the remainder'
  );
  assert.equal(crosstabValueLabel('prop:surface', '(none)'), 'Keine Angabe');
  assert.equal(crosstabValueLabel('prop:thing', 'raw'), 'raw');
});

test('a crosstab answer becomes a matrix in the order the API sent it', () => {
  const matrix = crosstabMatrix({
    rows: ['hero', 'header'],
    cols: ['home', 'park'],
    cells: [
      { row: 'hero', col: 'home', count: 10 },
      { row: 'header', col: 'home', count: 3 },
      { row: 'header', col: 'park', count: 20 },
    ],
  });
  assert.deepEqual(matrix.columns, ['home', 'park']);
  assert.deepEqual(matrix.rows, [
    { key: 'hero', cells: [10, 0], total: 10 },
    { key: 'header', cells: [3, 20], total: 23 },
  ]);
  assert.equal(matrix.max, 20);
  assert.deepEqual(matrix.columnTotals, [13, 20]);
});

test('a figure that is missing under a filter has no change, not NaN', () => {
  assert.equal(figureDelta(null, null), null);
  assert.equal(figureDelta(5, null), null);
  assert.equal(figureDelta(null, 5), null);
  assert.deepEqual(figureDelta(110, 100), { direction: 'up', percent: 10 });
});

test('an entity that resolves to nothing has no links to build', () => {
  const gone = { id: 'a-b', kind: null, name: null, url: null, count: 3 };
  const park = { id: 'c-d', kind: 'park', name: 'Phantasialand', url: '/parks/x/y/z/p', count: 9 };
  assert.equal(isResolvedEntity(gone), false);
  assert.equal(isResolvedEntity(park), true);
  assert.equal(entityPublicHref(park), '/de/parks/x/y/z/p');
});

test('a count hint names one entry in the singular', () => {
  assert.equal(mostCommonLabel(1), 'der häufigste');
  assert.equal(mostCommonLabel(12), 'die 12 häufigsten');
});

test('only a referrer that looks like a host is linked', () => {
  assert.equal(referrerHref('google.com'), 'https://google.com');
  assert.equal(referrerHref('l.instagram.com'), 'https://l.instagram.com');
  assert.equal(referrerHref('google'), null);
  assert.equal(referrerHref('chatgpt'), null);
  assert.equal(referrerHref('a b.com'), null);
  assert.equal(referrerHref('evil.com/path'), null);
});

test('a duration reads in seconds, minutes or hours, and a missing one as a dash', () => {
  assert.equal(formatDuration(45), '45 s');
  assert.equal(formatDuration(0), '0 s');
  assert.equal(formatDuration(59.6), '1:00 min');
  assert.equal(formatDuration(102), '1:42 min');
  assert.equal(formatDuration(3599), '59:59 min');
  assert.equal(formatDuration(3900), '1:05 h');
  assert.equal(formatDuration(null), '–');
  assert.equal(formatDuration(undefined), '–');
});

test('the series figures group by unit, never mixing counts with durations', () => {
  assert.deepEqual(
    groupByUnit(['avgVisitSeconds', 'pageviews', 'bounceRate', 'visits', 'viewsPerVisit']).map(
      (group) => [group.unit, group.metrics.map((metric) => metric.key)]
    ),
    [
      ['count', ['pageviews', 'visits']],
      ['ratio', ['viewsPerVisit']],
      ['percent', ['bounceRate']],
      ['seconds', ['avgVisitSeconds']],
    ]
  );
  assert.deepEqual(DEFAULT_METRICS, ['pageviews', 'visits', 'visitors']);
  assert.equal(new Set(TRAFFIC_METRICS.map((metric) => metric.slot)).size, TRAFFIC_METRICS.length);
});

test('a figure is read as the table prints it and plotted on its own scale', () => {
  const point = {
    visits: 1200,
    bounceRate: 0.46,
    avgVisitSeconds: 102,
    avgTimeOnPageSeconds: null,
    viewsPerVisit: 2.4,
  };
  assert.equal(metricValue(point, 'avgTimeOnPageSeconds'), null);
  assert.equal(metricValue(point, 'visits'), 1200);
  assert.equal(formatMetric('count', 1200), '1.200');
  assert.equal(formatMetric('ratio', 2.4), '2,4');
  assert.equal(formatMetric('percent', 0.46), '46 %');
  assert.equal(formatMetric('percent', 0), '0 %');
  assert.equal(formatMetric('seconds', 102), '1:42 min');
  assert.equal(formatMetric('seconds', null), '–');
  assert.equal(plotValue('percent', 0.46), 46);
  assert.equal(plotValue('count', 7), 7);
  assert.equal(plotValue('seconds', null), null);
  assert.equal(formatPlotted('percent', 46), '46 %');
  assert.equal(formatPlotted('seconds', 45), '45 s');
});

test('periods sort by a figure, and one without a figure goes last either way', () => {
  const point = (day, visits, visitors) => ({ day, visits, visitors });
  const points = [
    point('2026-10-01', 5, 3),
    point('2026-10-02', 9, null),
    point('2026-10-03', 1, 8),
  ];
  const days = (list) => list.map((entry) => entry.day);
  assert.deepEqual(days(sortPoints(points, 'period', 'desc')), [
    '2026-10-03',
    '2026-10-02',
    '2026-10-01',
  ]);
  assert.deepEqual(days(sortPoints(points, 'visits', 'desc')), [
    '2026-10-02',
    '2026-10-01',
    '2026-10-03',
  ]);
  assert.deepEqual(days(sortPoints(points, 'visits', 'asc')), [
    '2026-10-03',
    '2026-10-01',
    '2026-10-02',
  ]);
  assert.deepEqual(days(sortPoints(points, 'visitors', 'desc')), [
    '2026-10-03',
    '2026-10-01',
    '2026-10-02',
  ]);
  assert.deepEqual(days(sortPoints(points, 'visitors', 'asc')), [
    '2026-10-01',
    '2026-10-03',
    '2026-10-02',
  ]);
});

test('the traffic crosstab offers visit dimensions only for visits', () => {
  assert.ok(!trafficCrosstabDimensions('pageviews').includes('channel'));
  assert.ok(!trafficCrosstabDimensions('pageviews').includes('exit'));
  for (const dim of ['entry', 'exit', 'referrer', 'channel', 'os', 'device']) {
    assert.ok(trafficCrosstabDimensions('visits').includes(dim), dim);
  }
  for (const gone of ['campaign', 'viewport']) {
    assert.ok(!trafficCrosstabDimensions('visits').includes(gone), gone);
    assert.ok(!trafficCrosstabDimensions('pageviews').includes(gone), gone);
  }
  assert.equal(crosstabLabel('exit'), 'Ausstieg');
  assert.equal(crosstabLabel('browser_language'), 'Browsersprache');
  assert.equal(crosstabLabel('os'), 'System');
  assert.equal(crosstabValueLabel('os', 'ios'), 'iOS');
  assert.equal(crosstabValueLabel('device', 'mobile'), 'Telefon');
  assert.equal(crosstabValueLabel('channel', 'ai'), 'KI-Assistenten');
  assert.equal(crosstabValueLabel('country', '__rest__'), 'Übrige');
  assert.equal(crosstabValueLabel('day', '2026-10-26', 'week'), 'KW 44, ab 26.10.2026');
});

test('a browser language reads as its German name, and zz as unknown', () => {
  assert.equal(languageName('de'), 'Deutsch');
  assert.equal(languageName('nl'), 'Niederländisch');
  assert.equal(languageName('zz'), 'Unbekannt');
  assert.equal(breakdownValueLabel('browser_language', 'en'), 'Englisch');
});

test('a filter on how a visit began leaves no page views and no events to ask for', () => {
  const channel = [{ dim: 'channel', value: 'search' }];
  const language = [{ dim: 'browser_language', value: 'de' }];
  const device = [{ dim: 'device', value: 'mobile' }];
  assert.equal(hasVisitFilter(channel), true);
  assert.equal(hasVisitFilter([...device, { dim: 'entry', value: '/de' }]), true);
  assert.equal(hasVisitFilter(device), false);
  assert.match(unsupportedReason('events', channel), /Ereignisse gehören zu keinem Besuch/);
  assert.match(unsupportedReason('pageviews', channel), /Aufrufe gehören zu keinem Besuch/);
  assert.equal(unsupportedReason('events', device), null);
  assert.equal(
    unsupportedReason('pageviews', language),
    null,
    'page views do carry a browser language'
  );
  assert.match(unsupportedReason('events', language), /keine Browsersprache/);
});

test('visitors are explained by what was counted: the filters, the hours, or the days summed', () => {
  const point = (visitors) => ({ day: '2026-10-28', visitors });
  const overview = (visitors, interval, series, filters) => ({
    totals: { visitors },
    interval,
    series: series.map(point),
    ...(filters && { filters }),
  });
  // No count under this filter: the hint names the five dimensions that have one.
  assert.equal(
    VISITOR_FILTER_HINT,
    'Besucher gibt es für einen Filter auf Land, Gerät, Browser, Betriebssystem oder Kanal, nicht für mehrere zugleich.'
  );
  assert.equal(
    visitorsNote(overview(null, 'day', [null], ['country:de', 'device:mobile'])),
    VISITOR_FILTER_HINT
  );
  // A count under one filter is the days summed, like one without a filter.
  assert.equal(
    visitorsNote(overview(40, 'day', [20, 20], ['country:de'])),
    'Besucher sind die Summe der Tageswerte.'
  );
  assert.equal(visitorsNote(overview(40, 'week', [40])), 'Besucher sind die Summe der Tageswerte.');
  // The hours have none under a filter, and none before today without one.
  assert.match(
    visitorsNote(overview(12, 'hour', [null, null], ['country:de'])),
    /nur für den ganzen Zeitraum, nicht je Stunde/
  );
  assert.equal(
    visitorsNote(overview(12, 'hour', [4, null])),
    'Besucher gibt es stundenweise nur für heute.'
  );
  assert.equal(
    visitorsNote(overview(12, 'hour', [4, 8])),
    'Besucher sind die Summe der Tageswerte.'
  );
});

test('a row of a breakdown names its visitors first, then what the dimension adds', () => {
  const without = { value: 'de', views: 80, visits: 20, share: 0.8 };
  const country = { ...without, visitors: 1234 };
  assert.equal(
    breakdownDetail('country', { ...country, avgTimeOnPageSeconds: 45 }),
    '1.234 Besucher · Ø Zeit 45 s'
  );
  assert.equal(
    breakdownDetail('channel', {
      ...country,
      value: 'search',
      visitors: 7,
      bounceRate: 0.25,
      avgVisitSeconds: 102,
    }),
    '7 Besucher · Absprung 25 % · Ø Dauer 1:42 min'
  );
  // Without a visitor figure from the API the line is what it was.
  assert.equal(breakdownDetail('country', without), undefined);
  assert.equal(
    breakdownDetail('path', { ...without, exits: 5, exitRate: 0.25, avgTimeOnPageSeconds: 30 }),
    '20 Besuche · Ø Zeit 30 s · Ausstieg 25 %'
  );
  // A visitor count of zero is a count: a value with views and nobody counted says so.
  assert.equal(breakdownDetail('os', { ...country, visitors: 0 }), '0 Besucher');
});

test('a window the API could not read in full says from which day the hourly rows reach', () => {
  // Nothing cut: no notice, and none for an older API that sends no field.
  assert.equal(hourlyNotice(null, '2026-10-01'), null);
  assert.equal(hourlyNotice(undefined, '2026-10-01'), null);
  assert.equal(hourlyNotice('', '2026-10-01'), null);
  // The window starts before the first day the hourly rows hold: the window itself is short.
  assert.equal(
    hourlyNotice('2026-07-30', '2026-06-29'),
    'Diese Auswertung reicht nur bis 30.07.2026 zurück; ältere Tage gibt es nur als Tageswerte.'
  );
  // The window holds them whole, and the one before it does not: only the comparison is short.
  assert.equal(
    hourlyNotice('2026-07-30', '2026-08-30'),
    'Der Zeitraum davor ist nur ab 30.07.2026 vollständig; ältere Tage fehlen dort, die Vergleichswerte sind zu niedrig.'
  );
  // A window that starts on the first day is whole: the window before is the short one.
  assert.match(hourlyNotice('2026-07-30', '2026-07-30'), /^Der Zeitraum davor/);
  // The admin addresses nobody formally.
  for (const [from, hourlyFrom] of [
    ['2026-06-29', '2026-07-30'],
    ['2026-08-30', '2026-07-30'],
  ]) {
    assert.doesNotMatch(hourlyNotice(hourlyFrom, from), /\b(Sie|Ihr|Ihre)\b/);
  }
});

console.log(`\n${passed} cases passed.`);
