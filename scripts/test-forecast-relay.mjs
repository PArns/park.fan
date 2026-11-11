// The forecast relays under /api/parks/* answer only park.fan's own pages, and the server asks the
// API's mixed routes for their forecast fields with `forecast=true`. These cases pin which relay
// paths count as forecasts, which requests count as the site's own, and how the flag is appended.
import { isForecastRelayPath, isSameOriginRequest } from '../lib/api/forecast-relay.ts';
import { withForecast } from '../lib/api/forecast-query.ts';

const park = ['north-america', 'united-states', 'orlando', 'magic-kingdom-park'];
const request = (headers) => new Request('https://park.fan/api/parks/x', { headers });

const testCases = [
  {
    name: 'the live poll is a forecast path',
    actual: () => isForecastRelayPath(park),
    expected: true,
  },
  {
    name: 'calendar, best days, the day plan and the day curve are forecast paths',
    actual: () =>
      [
        ['calendar'],
        ['calendar', 'hourly'],
        ['best-days'],
        ['plan', 'day'],
        ['stats', 'day'],
      ].every((rest) => isForecastRelayPath([...park, ...rest])),
    expected: true,
  },
  {
    name: "a ride's detail is a forecast path",
    actual: () => isForecastRelayPath([...park, 'attractions', 'tron-lightcycle-run']),
    expected: true,
  },
  {
    name: 'wait times, history and positions stay open',
    actual: () =>
      [['wait-times'], ['stats'], ['stats', 'hourly'], ['positions'], ['weather', 'nowcast']].some(
        (rest) => isForecastRelayPath([...park, ...rest])
      ),
    expected: false,
  },
  {
    name: "a page's own fetch is same-origin",
    actual: () => isSameOriginRequest(request({ 'sec-fetch-site': 'same-origin' })),
    expected: true,
  },
  {
    name: 'a fetch from another site is not',
    actual: () => isSameOriginRequest(request({ 'sec-fetch-site': 'cross-site' })),
    expected: false,
  },
  {
    name: 'a browser without Sec-Fetch-Site counts by its Referer',
    actual: () => isSameOriginRequest(request({ referer: 'https://park.fan/en/parks' })),
    expected: true,
  },
  {
    name: 'a script with neither header is refused',
    actual: () => isSameOriginRequest(request({})),
    expected: false,
  },
  {
    name: 'a foreign Referer is refused',
    actual: () => isSameOriginRequest(request({ referer: 'https://example.com/' })),
    expected: false,
  },
  {
    name: 'the flag opens a query string',
    actual: () => withForecast('/v1/parks/a/b/c/d'),
    expected: '/v1/parks/a/b/c/d?forecast=true',
  },
  {
    name: 'the flag joins an existing query string',
    actual: () => withForecast('/v1/parks/a/b/c/d/stats/day?attraction=x'),
    expected: '/v1/parks/a/b/c/d/stats/day?attraction=x&forecast=true',
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
  if (result === testCase.expected) {
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
