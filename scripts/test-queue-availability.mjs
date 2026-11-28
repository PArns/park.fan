/**
 * Unit tests for the reading of a queue's `state` and the card's chip selection
 * (`lib/parks/queue-availability.ts`).
 *
 * `TEMP_FULL` and `FULL` are full, `FINISHED` and `CLOSED` finished, on the paid lanes as on the
 * free ones; a missing or unknown state is no statement, so a paid lane keeps its price. The card
 * shows every queue but standby as a live chip, single rider only with a wait, and a live chip
 * hides the fact chip of the same lane.
 *
 * Run: pnpm test:queue-availability
 */

import {
  factChipsCoveredByLive,
  liveQueueChips,
  queueAvailability,
  queueShut,
} from '../lib/parks/queue-availability.ts';
import { runCases } from './lib/run-cases.mjs';

const lastUpdated = '2026-11-27T23:30:21.363Z';
const price = { amount: 1600, currency: 'USD', formatted: '$16.00' };
const paidReturn = (state) => ({
  queueType: 'PAID_RETURN_TIME',
  status: 'OPERATING',
  lastUpdated,
  ...(state === undefined ? {} : { state }),
  returnStart: null,
  returnEnd: null,
  price,
});
const paidStandby = (state) => ({
  queueType: 'PAID_STANDBY',
  status: 'OPERATING',
  lastUpdated,
  ...(state === undefined ? {} : { state }),
  waitTime: 15,
  price,
});
const returnTime = (state) => ({
  queueType: 'RETURN_TIME',
  status: 'OPERATING',
  lastUpdated,
  state,
  returnStart: null,
  returnEnd: null,
});
const standby = { queueType: 'STANDBY', status: 'OPERATING', lastUpdated, waitTime: 35 };
const singleRider = (waitTime) => ({
  queueType: 'SINGLE_RIDER',
  status: 'OPERATING',
  lastUpdated,
  waitTime,
});
const boardingGroup = {
  queueType: 'BOARDING_GROUP',
  status: 'OPERATING',
  lastUpdated,
  allocationStatus: 'AVAILABLE',
  currentGroupStart: 100,
  currentGroupEnd: 150,
  estimatedWait: 30,
};

const testCases = [];
const test = (name, actual, expected) => testCases.push({ name, actual, expected });

test('AVAILABLE is available', () => queueAvailability(paidReturn('AVAILABLE')), 'available');
test('TEMP_FULL is full', () => queueAvailability(returnTime('TEMP_FULL')), 'full');
test('FULL is full', () => queueAvailability(paidStandby('FULL')), 'full');
test('FINISHED is finished', () => queueAvailability(paidReturn('FINISHED')), 'finished');
test('CLOSED is finished', () => queueAvailability(returnTime('CLOSED')), 'finished');
test('a null state says nothing', () => queueAvailability(returnTime(null)), null);
test('an absent state says nothing', () => queueAvailability(paidStandby(undefined)), null);
test('an unknown state says nothing', () => queueAvailability(paidReturn('SOLD_OUT_SOON')), null);
test('a standby queue has no state', () => queueAvailability(standby), null);

test('a finished paid lane is shut', () => queueShut(paidReturn('FINISHED')), 'finished');
test('a full paid standby is shut', () => queueShut(paidStandby('TEMP_FULL')), 'full');
test('an available lane is not shut', () => queueShut(paidReturn('AVAILABLE')), null);
test('a lane without a state is not shut', () => queueShut(paidStandby(undefined)), null);

test(
  'standby and a single rider without a wait are no chips',
  () =>
    liveQueueChips([
      standby,
      singleRider(null),
      singleRider(0),
      singleRider(10),
      paidReturn('FINISHED'),
    ]).map((q) => `${q.queueType}:${q.waitTime ?? q.state}`),
  JSON.stringify(['SINGLE_RIDER:10', 'PAID_RETURN_TIME:FINISHED'])
);
test('no queues, no chips', () => liveQueueChips(undefined), JSON.stringify([]));

test(
  'a finished Lightning Lane still covers the fact chip',
  () => factChipsCoveredByLive(liveQueueChips([standby, paidReturn('FINISHED')])),
  JSON.stringify({ singleRider: false, virtualLine: false, fastPass: true })
);
test(
  'paid standby covers the fact chip',
  () => factChipsCoveredByLive([paidStandby(undefined)]),
  JSON.stringify({ singleRider: false, virtualLine: false, fastPass: true })
);
test(
  'a return time or a boarding group covers the virtual-line chip',
  () => [returnTime('FINISHED'), boardingGroup].map((q) => factChipsCoveredByLive([q]).virtualLine),
  JSON.stringify([true, true])
);
test(
  'a single rider with a wait covers its chip, one without does not reach the chips',
  () => factChipsCoveredByLive(liveQueueChips([singleRider(10)])).singleRider,
  true
);
test(
  'standby alone covers nothing',
  () => factChipsCoveredByLive(liveQueueChips([standby, singleRider(null)])),
  JSON.stringify({ singleRider: false, virtualLine: false, fastPass: false })
);

// A case expects a string or a boolean as it is, and anything else serialised.
const comparable = (result) =>
  result !== null && typeof result !== 'string' && typeof result !== 'boolean'
    ? JSON.stringify(result)
    : result;
await runCases(testCases, {
  quiet: true,
  same: (result, expected) => comparable(result) === expected,
});
