/**
 * Every server read of a park-day forecast that the Data Cache keeps carries a tag of the API's
 * forecast ring, so the warmup's ring ends all of them at once.
 *
 * The ring sends `best-days:<slug>` and `park-calendar:<geo>` (`forecastCacheTags` in the API's
 * `park-status-transitions.ts`). The yearly outlook carried only the park's own tag, which the ring
 * does not send, and stayed up to a day behind the calendar grid and the month summary on the same
 * page. See docs/architecture/caching-strategy.md#one-park-day-on-several-surfaces.
 *
 * Run: pnpm test:forecast-ring-tags
 */
import { getParkYearlyPredictions } from '../lib/api/parks.ts';
import { getBestDaysCalendar, getCalendarMonthSeed } from '../lib/api/integrated-calendar.ts';

const GEO = ['europe', 'germany', 'rust', 'europa-park'];
const CALENDAR_TAG = 'park-calendar:europe/germany/rust/europa-park';
const BEST_DAYS_TAG = 'best-days:europa-park';

/** Runs `read` against a stubbed fetch and returns the tags of every request it made. */
async function tagsOf(read) {
  const original = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (_input, init) => {
    seen.push(...(init?.next?.tags ?? []));
    const body = { park: { id: 'p', name: 'P', slug: 'p' }, predictions: [], days: [], meta: {} };
    return new Response(JSON.stringify({ ...body, generatedAt: new Date().toISOString() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    await read();
  } finally {
    globalThis.fetch = original;
  }
  return seen;
}

const reads = [
  ['yearly outlook', () => getParkYearlyPredictions(...GEO), CALENDAR_TAG],
  ['best-days seed', () => getBestDaysCalendar(...GEO), BEST_DAYS_TAG],
  ['month summary', () => getCalendarMonthSeed(...GEO, { year: 2026, month: 12 }), CALENDAR_TAG],
];

let failed = 0;
for (const [name, read, expected] of reads) {
  const tags = await tagsOf(read);
  if (tags.includes(expected)) {
    console.log(`ok   ${name}: ${expected}`);
  } else {
    console.log(`FAIL ${name}: expected ${expected}, got ${JSON.stringify(tags)}`);
    failed++;
  }
}

console.log(`\nResults: ${reads.length - failed}/${reads.length} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
