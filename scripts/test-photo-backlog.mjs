/**
 * The photo backlog's ordering rules.
 *
 * Run: pnpm test:photo-backlog
 *
 * `lib/media/photo-backlog.ts` decides what somebody standing in a park photographs
 * next, and every rule in it exists because one of the three data sources reaches
 * further than the others: `/stats` ranks ten rides, `isHeadliner` flags about ten,
 * and today's wait times cover everything but say nothing at nine in the morning.
 * The layering is what makes the list survive a cold `/stats` and an empty morning,
 * and none of that is visible in a green build.
 *
 * The seasonal assertions are the ones worth keeping honest: `null` means "seasonal,
 * nothing else known" and MUST behave like in-season, because that is where most
 * seasonal rides sit — the detector will not name a month under 330 observation days.
 * Reading it as "hide it" would fold half the catalogue into a collapsed group.
 */

import { buildBacklog, scoreRide } from '../lib/media/photo-backlog.ts';

let failures = 0;

const check = (label, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`  ❌ ${label}\n       expected ${e}\n       got      ${a}`);
    failures++;
  }
};

/** A ride with nothing going for it; every case below overrides what it needs. */
const ride = (over = {}) => ({
  slug: over.slug ?? 'a-ride',
  name: over.name ?? 'A Ride',
  land: null,
  latitude: null,
  longitude: null,
  waitTime: null,
  peakWaitToday: null,
  isHeadliner: false,
  statsRank: null,
  p90: null,
  hasRideProfile: false,
  isCurrentlyInSeason: null,
  hasPhoto: false,
  ...over,
});

const names = (list) => list.map((r) => r.slug);

// ── The three layers, in order ──────────────────────────────────────────────
// A ranked ride outranks a headliner, and a headliner outranks the busiest ride
// in the park that is neither. The last one is the point: two hours of queue does
// not promote a ride the historical data never rated.
{
  const { missing } = buildBacklog([
    ride({ slug: 'busy', peakWaitToday: 120 }),
    ride({ slug: 'headliner', isHeadliner: true }),
    ride({ slug: 'ranked', statsRank: 7 }),
  ]);
  check('layers: stats rank > headliner > today', names(missing), ['ranked', 'headliner', 'busy']);
}

// Within layer one the rank is the order, not the P90 that produced it.
{
  const { missing } = buildBacklog([
    ride({ slug: 'third', statsRank: 3, p90: 90 }),
    ride({ slug: 'first', statsRank: 1, p90: 55 }),
    ride({ slug: 'second', statsRank: 2, p90: 60 }),
  ]);
  check('rank 1 first even with a lower P90', names(missing), ['first', 'second', 'third']);
}

// Within the tail, today's peak orders — and the peak beats the live figure, so a
// ride that had an hour at noon still outranks one with ten minutes right now.
{
  const { missing } = buildBacklog([
    ride({ slug: 'quiet-now', peakWaitToday: 60, waitTime: 5 }),
    ride({ slug: 'busy-now', peakWaitToday: 10, waitTime: 10 }),
  ]);
  check("tail: today's peak, not the live minute", names(missing), ['quiet-now', 'busy-now']);
}

// ── Degradation ────────────────────────────────────────────────────────────
// `/stats` cold or timed out: no ride carries a rank, and the headliners must
// still float above the tail on the park payload alone.
{
  const { missing } = buildBacklog([
    ride({ slug: 'tail', peakWaitToday: 45 }),
    ride({ slug: 'headliner', isHeadliner: true }),
  ]);
  check('no /stats: headliners still float', names(missing), ['headliner', 'tail']);
}

// Before the park opens nothing has a number, so the tail falls through to the
// name. Stable and alphabetical beats "whatever order the API happened to send".
{
  const { missing } = buildBacklog([
    ride({ slug: 'zebra', name: 'Zebra' }),
    ride({ slug: 'anton', name: 'Anton' }),
  ]);
  check('empty morning: alphabetical, not arbitrary', names(missing), ['anton', 'zebra']);
}

// ── The curated nudge ──────────────────────────────────────────────────────
// It breaks a tie between two otherwise identical rides…
{
  const { missing } = buildBacklog([
    ride({ slug: 'plain', name: 'Plain', peakWaitToday: 30 }),
    ride({ slug: 'curated', name: 'Curated', peakWaitToday: 30, hasRideProfile: true }),
  ]);
  check('curated wins an exact tie', names(missing), ['curated', 'plain']);
}
// …and must never outrank real data: one more minute of queue beats it.
{
  const { missing } = buildBacklog([
    ride({ slug: 'curated', peakWaitToday: 30, hasRideProfile: true }),
    ride({ slug: 'busier', peakWaitToday: 31 }),
  ]);
  check('curated does not outrank a minute of wait', names(missing), ['busier', 'curated']);
}

// ── Season ─────────────────────────────────────────────────────────────────
// `null` is the common case and behaves exactly like in-season.
{
  const backlog = buildBacklog([ride({ slug: 'unknown-season', isCurrentlyInSeason: null })]);
  check('season null stays in the main list', names(backlog.missing), ['unknown-season']);
  check('season null is not collapsed away', names(backlog.outOfSeason), []);
}
// `true` likewise.
{
  const backlog = buildBacklog([ride({ slug: 'in-season', isCurrentlyInSeason: true })]);
  check('season true stays in the main list', names(backlog.missing), ['in-season']);
}
// Only an explicit `false` moves a ride into the collapsed group.
{
  const backlog = buildBacklog([ride({ slug: 'ice-rink', isCurrentlyInSeason: false })]);
  check('season false is collapsed', names(backlog.outOfSeason), ['ice-rink']);
  check('season false leaves the main list', names(backlog.missing), []);
}
// A photograph settles it before the season is ever consulted.
{
  const backlog = buildBacklog([
    ride({ slug: 'ice-rink', isCurrentlyInSeason: false, hasPhoto: true }),
  ]);
  check('photographed and out of season is covered', names(backlog.covered), ['ice-rink']);
  check('…and not filed as outstanding', names(backlog.outOfSeason), []);
}

// ── Coverage ───────────────────────────────────────────────────────────────
// Every ride counts in the denominator, out-of-season ones included: this says
// "is the catalogue complete", not "what can I queue for today".
{
  const backlog = buildBacklog([
    ride({ slug: 'has', hasPhoto: true }),
    ride({ slug: 'has-not' }),
    ride({ slug: 'winter', isCurrentlyInSeason: false }),
  ]);
  check('coverage counts the whole catalogue', backlog.coverage, { withPhoto: 1, total: 3 });
}
{
  const backlog = buildBacklog([]);
  check('an empty park does not divide by zero', backlog.coverage, { withPhoto: 0, total: 0 });
}

// ── The reason shown next to the name ──────────────────────────────────────
check('reason: rank', scoreRide(ride({ statsRank: 2, p90: 60 })).reason, {
  kind: 'stats-rank',
  value: 2,
});
check(
  'reason: headliner carries its P90 when known',
  scoreRide(ride({ isHeadliner: true, p90: 45 })).reason,
  {
    kind: 'headliner',
    value: 45,
  }
);
check('reason: today', scoreRide(ride({ peakWaitToday: 35 })).reason, { kind: 'wait', value: 35 });
// Nothing known says nothing, rather than "0 Min." — which would read as measured.
check('reason: nothing measured says nothing', scoreRide(ride()).reason, {
  kind: 'none',
  value: null,
});

if (failures) {
  console.error(`\n❌ ${failures} check(s) failed.`);
  process.exit(1);
}
console.log('✅ photo backlog: ordering, degradation, season and coverage rules hold.');
