/**
 * The planner's empty-day sentence, one fixture per `ridesUnavailable.reason` the API can send.
 * Every reason must resolve to a key that exists in all six locales, and the days the API answers
 * with no curves must not offer to optimise.
 *
 *     pnpm test:planner-unavailable
 */

import { readFileSync } from 'node:fs';
import { unavailableNote } from '../lib/planner/unavailable.ts';
import { canOptimize } from '../lib/planner/optimize.ts';

const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];
const REASONS = [
  'park_closed',
  'hours_unknown',
  'no_rides_on_file',
  'no_wait_time_source',
  'never_measured',
  'feed_stale',
  'rides_cannot_open',
  'insufficient_history',
  'no_hourly_shape',
  'no_forecast',
  'no_observations',
  'data_unavailable',
];

const messages = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url))),
  ])
);

const day = (reason, extra = {}, liveWaitTimes) => ({
  parkSlug: 'x',
  timezone: 'Europe/Berlin',
  context: { date: '2026-10-14', status: 'OPERATING', ...(liveWaitTimes && { liveWaitTimes }) },
  tier: 'composed',
  leadDays: 8,
  rides: [],
  shows: [],
  ridesUnavailable: reason ? { reason, ...extra } : undefined,
});

const lookup = (locale, key) =>
  key.split('.').reduce((o, k) => o?.[k], messages[locale].planner.unavailable);

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) {
    failed++;
    console.error(`✗ ${name} ${detail}`);
  }
};

let applied = 0;
for (const reason of REASONS) {
  const fixtures =
    reason === 'no_wait_time_source'
      ? [
          day(reason, {}, { available: false, reason: 'in_park_app_only' }),
          day(reason, {}, { available: false, reason: 'not_published' }),
          day(reason, {}),
        ]
      : reason === 'feed_stale'
        ? [day(reason, { staleDays: 96 }), day(reason)]
        : [day(reason)];
  for (const fixture of fixtures) {
    const note = unavailableNote(fixture);
    applied++;
    check(`${reason}: note`, note !== null);
    if (!note) continue;
    for (const locale of LOCALES) {
      check(`${reason}/${locale}: key ${note.key}`, typeof lookup(locale, note.key) === 'string');
    }
    check(`${reason}: no Optimieren`, canOptimize(fixture, {}) === false);
  }
}

const sourceKeys = (d) => unavailableNote(d)?.key;
check(
  'no_wait_time_source follows the park flag',
  sourceKeys(day('no_wait_time_source', {}, { available: false, reason: 'in_park_app_only' })) ===
    'no_wait_time_source.in_park_app_only'
);
check(
  'feed_stale carries the days',
  unavailableNote(day('feed_stale', { staleDays: 96 }))?.values?.days === 96
);
check('a day with curves has no note', unavailableNote({ ...day(null), rides: [{}] }) === null);
check(
  'no flag on the park gets the neutral sentence',
  unavailableNote(day('no_wait_time_source', {}))?.key === 'no_wait_time_source.unknown'
);
check(
  'a reason beside rides is ignored',
  unavailableNote({ ...day('park_closed'), rides: [{}] }) === null
);
check(
  'feed_stale with 0 days falls back',
  unavailableNote(day('feed_stale', { staleDays: 0 }))?.key === 'feed_stale_unknown'
);
check(
  'no_wait_time_source with rides does not optimise',
  canOptimize(
    {
      ...day('no_wait_time_source', {}, { available: false, reason: 'not_published' }),
      rides: [{}],
    },
    {}
  ) === false
);
check('no day has no note', unavailableNote(null) === null);

const unused = Object.keys(messages.de.planner.unavailable).filter(
  (k) => k !== 'feed_stale_unknown' && !REASONS.includes(k)
);
check('no message without a reason', unused.length === 0, unused.join(','));

console.log(`${applied} fixtures, ${failed} failed`);
if (failed > 0) process.exit(1);
