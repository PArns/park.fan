/**
 * Unit tests for the park headline store (`lib/parks/park-headline.ts`).
 *
 * The fault it guards against: Phantasialand read 20 min in the favourites band and Ø 25 min on
 * the nearby card of the same page, because the two answers were fetched minutes apart. Every
 * surface now offers its reading and shows the newest one, by the time the API took it, not by
 * when the request returned.
 *
 * Run: pnpm test:park-headline
 */

import {
  heldParkHeadline,
  newerParkHeadline,
  recordParkHeadline,
  resetParkHeadlines,
  subscribeParkHeadlines,
} from '../lib/parks/park-headline.ts';

const PARK = 'phantasialand';
const EARLY = '2026-11-24T13:50:50.000Z';
const LATE = '2026-11-24T13:55:49.000Z';

let failed = 0;
let passed = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    console.log(`❌ FAIL: ${name}\n   Expected: ${e}\n   Got:      ${a}`);
  }
}

// A newer reading replaces an older one, whatever order they arrive in.
resetParkHeadlines();
recordParkHeadline(PARK, { avgWaitTime: 20, crowdLevel: 'low', updatedAt: LATE });
recordParkHeadline(PARK, { avgWaitTime: 25, crowdLevel: 'moderate', updatedAt: EARLY });
check('an older reading arriving later is ignored', heldParkHeadline(PARK)?.avgWaitTime, 20);

resetParkHeadlines();
recordParkHeadline(PARK, { avgWaitTime: 25, crowdLevel: 'moderate', updatedAt: EARLY });
recordParkHeadline(PARK, { avgWaitTime: 20, crowdLevel: 'low', updatedAt: LATE });
check('a newer reading replaces the held one', heldParkHeadline(PARK)?.crowdLevel, 'low');

// A reading without a time cannot be ordered, so it never enters.
resetParkHeadlines();
recordParkHeadline(PARK, { avgWaitTime: 25, crowdLevel: 'moderate' });
check('a reading without a time is not held', heldParkHeadline(PARK), undefined);
recordParkHeadline(PARK, { avgWaitTime: 25, crowdLevel: 'moderate', updatedAt: 'not a date' });
check('a reading with an unparsable time is not held', heldParkHeadline(PARK), undefined);

// Listeners hear a change and nothing else.
resetParkHeadlines();
let calls = 0;
const unsubscribe = subscribeParkHeadlines(() => calls++);
recordParkHeadline(PARK, { avgWaitTime: 20, crowdLevel: 'low', updatedAt: EARLY });
recordParkHeadline(PARK, { avgWaitTime: 20, crowdLevel: 'low', updatedAt: EARLY });
recordParkHeadline(PARK, { avgWaitTime: 25, crowdLevel: 'moderate', updatedAt: EARLY });
check('the same or an equally old reading wakes nobody', calls, 1);
recordParkHeadline(PARK, { avgWaitTime: 15, crowdLevel: 'low', updatedAt: LATE });
check('a newer reading wakes the listeners', calls, 2);
unsubscribe();
recordParkHeadline(PARK, {
  avgWaitTime: 10,
  crowdLevel: 'very_low',
  updatedAt: '2026-11-24T14:00:00Z',
});
check('an unsubscribed listener hears nothing', calls, 2);

// The identity holds until a newer reading lands, as useSyncExternalStore needs.
resetParkHeadlines();
recordParkHeadline(PARK, { avgWaitTime: 20, crowdLevel: 'low', updatedAt: EARLY });
const first = heldParkHeadline(PARK);
recordParkHeadline(PARK, { avgWaitTime: 30, crowdLevel: 'high', updatedAt: EARLY });
check('the held object keeps its identity', heldParkHeadline(PARK) === first, true);

// Which one a surface shows.
const own = { avgWaitTime: 25, crowdLevel: 'moderate', updatedAt: EARLY };
const held = { avgWaitTime: 20, crowdLevel: 'low', updatedAt: LATE };
check('nothing held: the own reading', newerParkHeadline(own, undefined).avgWaitTime, 25);
check('a newer held reading wins', newerParkHeadline(own, held).avgWaitTime, 20);
check(
  'an own reading as new as the held one stays',
  newerParkHeadline({ ...own, updatedAt: LATE }, held).avgWaitTime,
  25
);
check(
  'an own reading without a time gives way to a held one',
  newerParkHeadline({ avgWaitTime: 10, crowdLevel: 'low' }, held).avgWaitTime,
  20
);
check(
  'a held reading without a time never wins',
  newerParkHeadline(own, { avgWaitTime: 5, crowdLevel: 'low' }).avgWaitTime,
  25
);
check('no park id: nothing held', heldParkHeadline(undefined), undefined);

console.log(`\n📊 Results: ${passed}/${passed + failed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
