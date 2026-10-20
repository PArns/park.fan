/**
 * Show order (`lib/utils/show-order.ts`): the next show to begin leads, past and timeless shows
 * follow in the API's order, and a null clock leaves the order alone.
 */

import assert from 'node:assert/strict';
import { sortShowsByNextStart } from '@/lib/utils/show-order.ts';

const at = (hhmm) => ({ startTime: `2026-10-20T${hhmm}:00+02:00` });
const show = (id, ...times) => ({ id, showtimes: times.map(at) });
const now = Date.parse('2026-10-20T13:00:00+02:00');
const ids = (list) => list.map((s) => s.id).join(',');

let passed = 0;
function check(actual, expected, label) {
  assert.equal(actual, expected, `${label}: got "${actual}", want "${expected}"`);
  passed++;
}

const shows = [
  show('past', '10:00', '11:00'),
  show('late', '17:00'),
  { id: 'none' },
  show('soon', '09:00', '13:30', '16:00'),
  { id: 'empty', showtimes: [] },
  show('mid', '15:00'),
  show('tie', '17:00'),
];

check(
  ids(sortShowsByNextStart(shows, now)),
  'soon,mid,late,tie,past,none,empty',
  'upcoming by next start, rest in API order'
);
check(ids(sortShowsByNextStart(shows, null)), ids(shows), 'null clock keeps the API order');
check(sortShowsByNextStart(shows, null), shows, 'null clock returns the same array');
check(
  sortShowsByNextStart([show('a', '09:00'), show('b', '10:00')], now).length,
  2,
  'all past keeps every show'
);
check(
  ids(sortShowsByNextStart([show('a', '09:00'), { id: 'b' }], now)),
  'a,b',
  'nothing upcoming keeps the order'
);
check(sortShowsByNextStart(shows, now).length, shows.length, 'same count');
check(ids(shows), 'past,late,none,soon,empty,mid,tie', 'input is not mutated');
check(
  ids(sortShowsByNextStart([show('x', '13:00')], now)),
  'x',
  'a show starting exactly now counts as upcoming'
);
check(
  ids(
    sortShowsByNextStart(
      [{ id: 'bad', showtimes: [{ startTime: 'nope' }] }, show('ok', '14:00')],
      now
    )
  ),
  'ok,bad',
  'unparseable time counts as none'
);

console.log(`show-order: ${passed} checks passed`);
