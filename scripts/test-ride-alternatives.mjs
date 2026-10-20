/**
 * Ride alternatives (`lib/parks/ride-alternatives.ts`): open rides at least 15 printed minutes
 * shorter, same type first and nearest first, three at most, nothing without a live wait.
 */

import assert from 'node:assert/strict';
import { rankRideAlternatives } from '@/lib/parks/ride-alternatives.ts';

let passed = 0;
function check(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label}: got ${JSON.stringify(actual)}`);
  passed++;
}

// 0.001 degrees of latitude is about 111 m.
const ride = (slug, wait, lat, types = [], minimumHeight = null) => ({
  slug,
  name: slug,
  wait,
  latitude: lat,
  longitude: 8,
  types,
  minimumHeight,
});
const here = { slug: 'here', wait: 60, latitude: 48, longitude: 8, types: ['coasters'] };
const slugs = (list) => list.map((r) => r.slug);

check(
  slugs(
    rankRideAlternatives(here, [
      ride('far-coaster', 10, 48.01, ['coasters']),
      ride('near-flat', 5, 48.001, ['flat']),
      ride('near-coaster', 20, 48.005, ['coasters']),
    ])
  ),
  ['near-coaster', 'far-coaster', 'near-flat'],
  'same type leads, each group nearest first'
);

check(
  slugs(
    rankRideAlternatives(
      here,
      ['a', 'b', 'c', 'd', 'e'].map((s, i) => ride(s, 10, 48 + 0.001 * (i + 1)))
    )
  ),
  ['a', 'b', 'c'],
  'three at most'
);

check(
  slugs(rankRideAlternatives(here, [ride('x', 50, 48.001), ride('y', 45, 48.001)])),
  ['y'],
  'a saving of 15 counts, 10 does not'
);

// 47 prints as 45, 31 as 30: the saving is the difference of the printed waits, 15.
const printed = rankRideAlternatives({ ...here, wait: 47 }, [ride('p', 31, 48.001)]);
check([printed[0].wait, printed[0].saving], [30, 15], 'saving is the difference of printed waits');

check(
  rankRideAlternatives({ ...here, wait: null }, [ride('x', 5, 48.001)]),
  [],
  'no live wait, nothing to compare'
);
check(rankRideAlternatives({ ...here, wait: 10 }, [ride('x', 0, 48.001)]), [], 'short queue');
check(
  rankRideAlternatives(here, [ride('x', null, 48.001), ride('here', 0, 48)]),
  [],
  'closed or self'
);

const tall = rankRideAlternatives(here, [ride('tall', 10, 48.001, [], 140)]);
check([tall[0].slug, tall[0].minimumHeight], ['tall', 140], 'a taller minimum height stays in');

const noPosition = rankRideAlternatives({ ...here, latitude: null }, [
  ride('b', 10, 48.002),
  ride('a', 10, 48.001),
]);
check(
  [slugs(noPosition), noPosition[0].distance],
  [['a', 'b'], null],
  'no position: no distance, name order'
);

const [near] = rankRideAlternatives(here, [ride('x', 10, 48.001)]);
check(Math.round(near.distance / 10) * 10, 110, 'distance in metres');

// A wait of 14 prints as 15, the smallest queue that can still save 15 minutes against a 0.
check(
  slugs(rankRideAlternatives({ ...here, wait: 14 }, [ride('x', 0, 48.001)])),
  ['x'],
  'a printed 15 against a walk-on counts'
);
check(
  slugs(rankRideAlternatives({ ...here, wait: 12 }, [ride('x', 0, 48.001)])),
  [],
  'a printed 10 saves too little'
);

const unplaced = { ...ride('unplaced', 10, null), latitude: null, longitude: null };
check(
  slugs(rankRideAlternatives(here, [unplaced, ride('placed', 10, 48.05)])),
  ['placed', 'unplaced'],
  'a ride without coordinates sorts after the placed ones'
);
check(
  rankRideAlternatives({ ...here, types: [] }, [ride('x', 10, 48.001, ['coasters'])])[0].sameType,
  false,
  'no type on the current ride, never the same type'
);

console.log(`ride-alternatives: ${passed} checks passed`);
