/**
 * Unit tests for the ride list's „shortest wait" order (`sortByShortestWait`) and the slicing the
 * flat list is mounted in (`chunk`).
 *
 * Run: pnpm test:attraction-sort
 */
import assert from 'node:assert/strict';
import { chunk, sortByShortestWait } from '../lib/utils/park-utils.ts';

const ride = (name, status, waitTime) => ({
  id: name,
  name,
  status,
  queues: waitTime === undefined ? [] : [{ queueType: 'STANDBY', waitTime }],
});
const names = (list) => list.map((a) => a.name);

assert.deepEqual(
  names(
    sortByShortestWait([
      ride('C', 'OPERATING', 30),
      ride('A', 'OPERATING', 5),
      ride('B', 'OPERATING', 0),
    ])
  ),
  ['B', 'A', 'C'],
  'ascending, and a 0-minute wait is a reading'
);

assert.deepEqual(
  names(
    sortByShortestWait([
      ride('Closed', 'CLOSED', 0),
      ride('NoValue', 'OPERATING', undefined),
      ride('Open', 'OPERATING', 45),
    ])
  ),
  ['Open', 'Closed', 'NoValue'],
  'shut rides and rides without a standby reading go after every readable wait, in name order'
);

assert.deepEqual(
  names(sortByShortestWait([ride('B', 'OPERATING', 10), ride('A', 'OPERATING', 10)])),
  ['A', 'B'],
  'a tie falls back to the name'
);

assert.deepEqual(
  names(sortByShortestWait([ride('B', 'CLOSED', 0), ride('A', 'CLOSED', 5)])),
  ['A', 'B'],
  'nothing readable: name order'
);
assert.deepEqual(sortByShortestWait([]), []);

const input = [ride('B', 'OPERATING', 10), ride('A', 'OPERATING', 5)];
sortByShortestWait(input);
assert.deepEqual(names(input), ['B', 'A'], 'does not reorder its input');

assert.deepEqual(chunk([], 12), []);
const thirteen = Array.from({ length: 13 }, (_, i) => i);
assert.deepEqual(
  chunk(thirteen, 12).map((s) => s.length),
  [12, 1],
  'the remainder is its own slice'
);

console.log('✅ attraction sort: all cases pass');
