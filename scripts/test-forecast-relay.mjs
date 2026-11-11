// The forecast relays under /api/parks/* answer only park.fan's own pages, and the server asks the
// API's mixed routes for their forecast fields with `forecast=true`. These cases pin which relay
// paths count as forecasts, which requests count as the site's own, and how the flag is appended.
import { isForecastRelayPath, isSameOriginRequest } from '../lib/api/forecast-relay.ts';
import { fetchWithForecast, readWithForecast, withForecast } from '../lib/api/forecast-query.ts';

const park = ['north-america', 'united-states', 'orlando', 'magic-kingdom-park'];
const request = (headers) => new Request('https://park.fan/api/parks/x', { headers });

/** Runs `read` with the server's keys set as given, then puts the environment back. */
function withEnv(values, read) {
  const saved = Object.fromEntries(Object.keys(values).map((name) => [name, process.env[name]]));
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    return read();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
const withServerKey = (read) => withEnv({ API_DATA_KEY: 'pfk_test' }, read);
const withoutServerKeys = (read) =>
  withEnv({ API_DATA_KEY: undefined, API_AUTH_KEY: undefined }, read);

/** Runs an async `read` with a site key set, and records the URLs `fetch` was called with. */
async function withKeyAndFetch(statuses, read) {
  const saved = { key: process.env.API_DATA_KEY, fetch: globalThis.fetch, warn: console.warn };
  const urls = [];
  process.env.API_DATA_KEY = 'pfk_test';
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response('{}', { status: statuses[urls.length - 1] ?? 200 });
  };
  console.warn = () => {};
  try {
    const result = await read();
    return { result, urls };
  } finally {
    if (saved.key === undefined) delete process.env.API_DATA_KEY;
    else process.env.API_DATA_KEY = saved.key;
    globalThis.fetch = saved.fetch;
    console.warn = saved.warn;
  }
}

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
    actual: () => withServerKey(() => withForecast('/v1/parks/a/b/c/d')),
    expected: '/v1/parks/a/b/c/d?forecast=true',
  },
  {
    name: 'the flag joins an existing query string',
    actual: () => withServerKey(() => withForecast('/v1/parks/a/b/c/d/stats/day?attraction=x')),
    expected: '/v1/parks/a/b/c/d/stats/day?attraction=x&forecast=true',
  },
  {
    name: 'a refused site key reads the route again without the flag',
    actual: async () => {
      const { result, urls } = await withKeyAndFetch([401, 200], () =>
        fetchWithForecast('https://api/v1/parks/a/b/c/d')
      );
      return [result.status, urls];
    },
    expected: [200, ['https://api/v1/parks/a/b/c/d?forecast=true', 'https://api/v1/parks/a/b/c/d']],
  },
  {
    name: 'any other failure is not retried',
    actual: async () => {
      const { result, urls } = await withKeyAndFetch([500], () =>
        fetchWithForecast('https://api/v1/parks/a/b/c/d')
      );
      return [result.status, urls.length];
    },
    expected: [500, 1],
  },
  {
    name: 'a read that throws a 403 is retried without the flag',
    actual: async () =>
      (
        await withKeyAndFetch([], () =>
          readWithForecast('/v1/parks/a/b/c/d', async (path) => {
            if (path.includes('forecast=true'))
              throw Object.assign(new Error('x'), { status: 403 });
            return path;
          })
        )
      ).result,
    expected: '/v1/parks/a/b/c/d',
  },
  {
    name: 'a server without a key leaves the flag off rather than draw a 401',
    actual: () => withoutServerKeys(() => withForecast('/v1/parks/a/b/c/d')),
    expected: '/v1/parks/a/b/c/d',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = await testCase.actual();
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
