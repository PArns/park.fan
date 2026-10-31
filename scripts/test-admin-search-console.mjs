// Tests for the pure half of the Search Console section on /admin/traffic/seo: how the four
// figures read, what a change against the window before says, the addresses of the reads and the
// drill-down, and what the status line concludes.
//
// A click rate and a position over no impressions do not exist, so they are a dash and never a
// zero. A position that goes from 8 to 4 is four places better, not "minus 50 percent", and a
// click rate moves in percent points. The filters of the traffic pages must not reach the API,
// which knows nothing of them.
import {
  googleWindowNote,
  defaultSearchConsoleInterval,
  formatPositionChange,
  formatSearchConsole,
  formatSearchConsoleRow,
  googleSearchHref,
  importFinished,
  importInProgress,
  parseSearchConsolePage,
  partialPeriods,
  seriesPartial,
  parseSearchConsoleQuery,
  plotSearchConsole,
  searchConsoleChip,
  searchConsoleFigure,
  searchConsoleInterval,
  searchConsoleIntervals,
  searchConsolePath,
  searchConsoleRowChange,
  searchConsoleState,
  missingTitleWords,
  weakSnippet,
} from '../lib/admin/search-console.ts';

const totals = (clicks, impressions, ctr, position) => ({ clicks, impressions, ctr, position });
const days30 = { kind: 'days', days: 30 };

const testCases = [
  // snippet
  {
    name: 'a query word missing from the title is named, accents, case and short words ignored',
    actual: () =>
      missingTitleWords(
        'phantasialand brühl wartezeiten heute in',
        'Phantasialand Bruhl: Wartezeit'
      ),
    expected: ['wartezeiten', 'heute'],
  },
  {
    name: 'a word inside a longer word of the title counts as present',
    actual: () => missingTitleWords('wartezeit', 'Wartezeiten heute'),
    expected: [],
  },
  {
    name: 'first page and under 1 % click rate is a weak snippet',
    actual: () => weakSnippet(totals(2, 400, 0.005, 6.2)),
    expected: true,
  },
  {
    name: 'past position 10 or over 1 % click rate is no weak snippet',
    actual: () => [weakSnippet(totals(2, 400, 0.005, 11)), weakSnippet(totals(8, 400, 0.02, 3))],
    expected: [false, false],
  },
  {
    name: 'no impressions is no weak snippet',
    actual: () => weakSnippet(totals(0, 0, 0, 0)),
    expected: false,
  },
  // figures
  {
    name: 'a click rate over no impressions is not a figure',
    actual: () => searchConsoleFigure(totals(0, 0, 0, 0), 'ctr'),
    expected: null,
  },
  {
    name: 'a position over no impressions is not a figure',
    actual: () => searchConsoleFigure(totals(0, 0, 0, 0), 'position'),
    expected: null,
  },
  {
    name: 'zero clicks over some impressions is a figure',
    actual: () => searchConsoleFigure(totals(0, 40, 0, 12.5), 'clicks'),
    expected: 0,
  },
  {
    name: 'a missing number is not a figure',
    actual: () =>
      searchConsoleFigure({ clicks: 3, impressions: 10, ctr: null, position: 2 }, 'ctr'),
    expected: null,
  },
  {
    name: 'counts print with the German thousands separator',
    actual: () => formatSearchConsole('impressions', 1234567),
    expected: '1.234.567',
  },
  {
    name: 'a click rate prints as a share',
    actual: () => formatSearchConsole('ctr', 0.0312),
    expected: '3,1 %',
  },
  {
    name: 'a position prints with one decimal',
    actual: () => formatSearchConsole('position', 8.4),
    expected: '8,4',
  },
  {
    name: 'a figure that does not exist prints as a dash',
    actual: () => formatSearchConsole('position', null),
    expected: '–',
  },
  {
    name: 'a row prints its four figures',
    actual: () => formatSearchConsoleRow(totals(120, 4000, 0.03, 7.25)),
    expected: { clicks: '120', impressions: '4.000', ctr: '3,0 %', position: '7,3' },
  },
  {
    name: 'a row with no impressions prints dashes for rate and position',
    actual: () => formatSearchConsoleRow(totals(0, 0, 0, 0)),
    expected: { clicks: '0', impressions: '0', ctr: '–', position: '–' },
  },
  {
    name: 'the chart plots a click rate in percent points',
    actual: () => plotSearchConsole({ day: '2026-10-01', ...totals(3, 100, 0.03, 9) }, 'ctr'),
    expected: 3,
  },
  {
    name: 'the chart leaves a gap where a day had no impressions',
    actual: () => plotSearchConsole({ day: '2026-10-01', ...totals(0, 0, 0, 0) }, 'position'),
    expected: null,
  },

  // change
  {
    name: 'a position change is signed in places',
    actual: () => [
      formatPositionChange(1.24),
      formatPositionChange(-0.4),
      formatPositionChange(0.02),
    ],
    expected: ['+1,2', '−0,4', '±0'],
  },
  {
    name: 'clicks up by half are plus 50 percent',
    actual: () => searchConsoleChip('clicks', totals(150, 1, 0.1, 5), totals(100, 1, 0.1, 5)),
    expected: {
      delta: { direction: 'up', percent: 50 },
      title: 'gegenüber dem Zeitraum davor, mit gleich vielen Tagen mit Daten: 100',
    },
  },
  {
    name: 'clicks out of nothing are new',
    actual: () => searchConsoleChip('clicks', totals(5, 50, 0.1, 5), totals(0, 50, 0, 5))?.delta,
    expected: { direction: 'new', percent: null },
  },
  {
    name: 'a change under half a percent is flat',
    actual: () =>
      searchConsoleChip('impressions', totals(1, 10002, 0, 1), totals(1, 10000, 0, 1))?.delta,
    expected: { direction: 'flat', percent: 0 },
  },
  {
    name: 'a click rate moves in percent points',
    actual: () => {
      const chip = searchConsoleChip('ctr', totals(1, 100, 0.034, 5), totals(1, 100, 0.031, 5));
      return [chip?.delta.direction, chip?.label];
    },
    expected: ['up', '+0,3 Pp'],
  },
  {
    name: 'a position from 8 to 4 is four places better',
    actual: () => {
      const chip = searchConsoleChip(
        'position',
        totals(1, 100, 0.01, 4),
        totals(1, 100, 0.01, 8),
        30
      );
      return [chip?.delta.direction, chip?.label];
    },
    expected: ['down', '−4,0 Plätze'],
  },
  {
    name: 'an unchanged position says so',
    actual: () => {
      const chip = searchConsoleChip(
        'position',
        totals(1, 100, 0.01, 8),
        totals(1, 100, 0.01, 8.02),
        30
      );
      return [chip?.delta.direction, chip?.label];
    },
    expected: ['flat', 'gleich'],
  },
  {
    name: 'there is no change without a window before',
    actual: () => searchConsoleChip('clicks', totals(5, 50, 0.1, 5), null),
    expected: null,
  },
  {
    name: 'there is no change for a figure the window before does not have',
    actual: () => searchConsoleChip('position', totals(5, 50, 0.1, 5), totals(0, 0, 0, 0)),
    expected: null,
  },
  {
    name: 'a row that gained clicks and climbed is good news twice',
    actual: () => searchConsoleRowChange({ clicks: 12, position: -1.3 }),
    expected: { clicks: '+12', position: '−1,3', clicksTone: 'good', positionTone: 'good' },
  },
  {
    name: 'a row that lost clicks and fell is bad news twice',
    actual: () => searchConsoleRowChange({ clicks: -8, position: 2 }),
    expected: { clicks: '−8', position: '+2,0', clicksTone: 'bad', positionTone: 'bad' },
  },
  {
    name: 'a row that did not move is flat',
    actual: () => searchConsoleRowChange({ clicks: 0, position: 0.04 }),
    expected: { clicks: '±0', position: '±0', clicksTone: 'flat', positionTone: 'flat' },
  },
  {
    name: 'a row without a change has none',
    actual: () => searchConsoleRowChange(null),
    expected: null,
  },

  {
    name: 'a position the API sends as null is not a figure and prints as a dash',
    actual: () => [
      searchConsoleFigure(totals(0, 0, 0, null), 'position'),
      formatSearchConsole('position', searchConsoleFigure(totals(3, 10, 0.3, null), 'position')),
    ],
    expected: [null, '–'],
  },
  {
    name: 'a row with a null position prints a dash for it',
    actual: () => formatSearchConsoleRow(totals(2, 10, 0.2, null)).position,
    expected: '–',
  },
  {
    name: 'the chart leaves a gap for a null position',
    actual: () => plotSearchConsole({ day: '2026-10-01', ...totals(0, 0, 0, null) }, 'position'),
    expected: null,
  },
  {
    name: 'a position that has no figure in the window before gets no chip',
    actual: () => searchConsoleChip('position', totals(5, 50, 0.1, 5), totals(0, 0, 0, null)),
    expected: null,
  },
  {
    name: 'a null position change is no change, not a change of zero',
    actual: () => searchConsoleRowChange({ clicks: 4, position: null }),
    expected: { clicks: '+4', position: null, clicksTone: 'good', positionTone: 'flat' },
  },

  // addresses
  {
    name: 'the series asks for the step, the window and the language',
    actual: () => searchConsolePath('series', { range: days30, locale: 'de', interval: 'week' }),
    expected: '/api/admin/search-console/series?days=30&interval=week&locale=de',
  },
  {
    name: 'the queries get no step, even when the address names one',
    actual: () =>
      searchConsolePath(
        'queries',
        { range: days30, locale: null, interval: 'week' },
        { limit: 50 }
      ),
    expected: '/api/admin/search-console/queries?days=30&limit=50',
  },
  {
    name: 'a custom window goes as from and to',
    actual: () =>
      searchConsolePath(
        'pages',
        { range: { kind: 'dates', from: '2026-10-01', to: '2026-10-27' }, locale: 'fr' },
        { query: 'parc astérix' }
      ),
    expected:
      '/api/admin/search-console/pages?from=2026-10-01&to=2026-10-27&locale=fr&query=parc+ast%C3%A9rix',
  },
  {
    name: 'the traffic filters never reach the Search Console reads',
    actual: () => {
      const path = searchConsolePath('queries', {
        range: days30,
        locale: null,
        filters: [{ dim: 'channel', value: 'search' }],
      });
      return path.includes('filter');
    },
    expected: false,
  },

  // steps
  {
    name: 'a single day is drawn by the day, not by the hour',
    actual: () => [searchConsoleInterval('hour'), defaultSearchConsoleInterval(1)],
    expected: ['day', 'day'],
  },
  {
    name: 'a window of 30 days offers days and weeks',
    actual: () => searchConsoleIntervals(30),
    expected: ['day', 'week'],
  },
  {
    name: 'a window of a year offers days, weeks and months',
    actual: () => searchConsoleIntervals(365),
    expected: ['day', 'week', 'month'],
  },
  {
    name: 'two days offer only days, never hours',
    actual: () => searchConsoleIntervals(2),
    expected: ['day'],
  },
  {
    name: 'a window of 120 days starts by the week',
    actual: () => defaultSearchConsoleInterval(120),
    expected: 'week',
  },

  // partial periods
  {
    name: 'days are never partial',
    actual: () =>
      partialPeriods(
        ['2026-10-24', '2026-10-25'],
        'day',
        { from: '2026-09-29', to: '2026-10-28' },
        '2026-10-25'
      ),
    expected: [false, false],
  },
  {
    name: 'a week the window starts inside and a week past the last reported day are partial',
    actual: () =>
      partialPeriods(
        ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'],
        'week',
        { from: '2026-10-01', to: '2026-10-28' },
        '2026-10-25'
      ),
    expected: [true, false, false, false, true],
  },
  {
    name: 'a week that starts on the window start but not on a Monday is partial',
    actual: () =>
      partialPeriods(
        ['2026-10-01', '2026-10-05'],
        'week',
        { from: '2026-10-01', to: '2026-10-11' },
        null
      ),
    expected: [true, false],
  },
  {
    name: 'the last month is partial while Google is days behind',
    actual: () =>
      partialPeriods(
        ['2026-08-01', '2026-09-01', '2026-10-01'],
        'month',
        { from: '2026-08-01', to: '2026-10-28' },
        '2026-10-25'
      ),
    expected: [false, false, true],
  },
  {
    name: 'the first month is partial when the window starts mid-month',
    actual: () =>
      partialPeriods(
        ['2025-10-01', '2025-11-01'],
        'month',
        { from: '2025-10-29', to: '2025-11-30' },
        '2026-10-25'
      ),
    expected: [true, false],
  },

  {
    name: 'the API flags win over the page working it out',
    actual: () =>
      seriesPartial(
        [
          { day: '2026-10-05', ...totals(1, 1, 1, 1), partial: true },
          { day: '2026-10-12', ...totals(1, 1, 1, 1) },
        ],
        'week',
        { from: '2026-10-05', to: '2026-10-18' },
        '2026-10-18'
      ),
    expected: [true, false],
  },
  {
    name: 'without any flag the page works the cut periods out itself',
    actual: () =>
      seriesPartial(
        [
          { day: '2026-10-19', ...totals(1, 1, 1, 1) },
          { day: '2026-10-26', ...totals(1, 1, 1, 1) },
        ],
        'week',
        { from: '2026-10-19', to: '2026-10-28' },
        '2026-10-25'
      ),
    expected: [false, true],
  },

  // drill-down
  {
    name: 'a query is trimmed',
    actual: () => parseSearchConsoleQuery('  freizeitpark wartezeiten '),
    expected: 'freizeitpark wartezeiten',
  },
  {
    name: 'an empty query is none',
    actual: () => [parseSearchConsoleQuery('   '), parseSearchConsoleQuery(null)],
    expected: [null, null],
  },
  {
    name: 'a query of 301 characters is none',
    actual: () => parseSearchConsoleQuery('a'.repeat(301)),
    expected: null,
  },
  {
    name: 'a page is one of our paths',
    actual: () => parseSearchConsolePage('/de/parks/europa/deutschland/rust/europa-park'),
    expected: '/de/parks/europa/deutschland/rust/europa-park',
  },
  {
    name: 'a page that is a full address, has a query or holds a space is none',
    actual: () => [
      parseSearchConsolePage('https://park.fan/de'),
      parseSearchConsolePage('/de?x=1'),
      parseSearchConsolePage('/de/a b'),
      parseSearchConsolePage('de/parks'),
    ],
    expected: [null, null, null, null],
  },
  {
    name: 'the Google link encodes the query',
    actual: () => googleSearchHref('europa park & mehr'),
    expected: 'https://www.google.com/search?q=europa+park+%26+mehr',
  },

  // status
  {
    name: 'no credentials is off',
    actual: () =>
      searchConsoleState({
        configured: false,
        siteUrl: null,
        lastImportAt: null,
        lastError: null,
        coverage: null,
        rows: 0,
      }),
    expected: 'off',
  },
  {
    name: 'credentials without rows wait for the first import',
    actual: () =>
      searchConsoleState({
        configured: true,
        siteUrl: 'sc-domain:park.fan',
        lastImportAt: null,
        lastError: null,
        coverage: null,
        rows: 0,
      }),
    expected: 'waiting',
  },
  {
    name: 'stored rows are ready, even when the last import failed',
    actual: () =>
      searchConsoleState({
        configured: true,
        siteUrl: 'sc-domain:park.fan',
        lastImportAt: '2026-10-27T03:00:00Z',
        lastError: 'quota exceeded',
        coverage: { from: '2025-06-25', to: '2026-10-25' },
        rows: 1200,
      }),
    expected: 'ready',
  },
  {
    name: 'a rolling window says which days it covers and that it ends at the last day with data',
    actual: () =>
      googleWindowNote(
        days30,
        { from: '2026-09-29', to: '2026-10-25', days: 28 },
        { from: '2025-06-25', to: '2026-10-25' }
      ),
    expected: 'Google-Zahlen: 28 Tage bis 25.10.2026 (letzter Tag mit Daten).',
  },
  {
    name: 'a fixed window that ends after the stored days says the last days are missing',
    actual: () =>
      googleWindowNote(
        { kind: 'dates', from: '2026-09-29', to: '2026-10-28' },
        { from: '2026-09-29', to: '2026-10-28', days: 30 },
        { from: '2025-06-25', to: '2026-10-25' }
      ),
    expected:
      'Google-Zahlen: 29.09.2026 bis 28.10.2026. Google hat Daten bis 25.10.2026, die Tage danach fehlen noch.',
  },
  {
    name: 'a window before the first stored day says nothing was imported then',
    actual: () =>
      googleWindowNote(
        { kind: 'dates', from: '2025-01-01', to: '2025-12-31' },
        { from: '2025-01-01', to: '2025-12-31', days: 365 },
        { from: '2025-06-25', to: '2026-10-25' }
      ),
    expected: 'Google-Zahlen: 01.01.2025 bis 31.12.2025. Vor dem 25.06.2025 ist nichts importiert.',
  },
  {
    name: 'an import has run when the last import or the error changed',
    actual: () => {
      const mark = { lastImportAt: '2026-10-27T03:00:00Z', lastError: null };
      return [
        importFinished(mark, mark),
        importFinished(mark, { ...mark, lastImportAt: '2026-10-28T09:00:00Z' }),
        importFinished(mark, { ...mark, lastError: 'quota exceeded' }),
      ];
    },
    expected: [false, true, true],
  },
  {
    name: 'an import is in progress while the API names its start, and not for an older API',
    actual: () => [
      importInProgress({ runningSince: '2026-10-30T09:20:00Z' }),
      importInProgress({ runningSince: null }),
      importInProgress({}),
    ],
    expected: [true, false, false],
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `threw: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
    passed++;
    console.log(`  ✓ ${testCase.name}`);
  } else {
    failed++;
    console.log(`  ✗ ${testCase.name}`);
    console.log(`      expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`      actual:   ${JSON.stringify(result)}`);
  }
}

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
console.log('🎉 All tests passed!');
