/**
 * Unit tests for the country page's „quietest first" and „nearest first" orders
 * (`orderCountryParks`).
 *
 * Run: pnpm test:country-park-order
 */
import assert from 'node:assert/strict';
import { orderCountryParks } from '../lib/utils/country-park-order.ts';

const park = (id, latitude, longitude) => ({ id, latitude, longitude });
const open = (averageWaitTime) => ({ status: 'OPERATING', averageWaitTime });
const closed = { status: 'CLOSED', averageWaitTime: 1 };

assert.deepEqual(
  orderCountryParks(
    [park('c'), park('a'), park('b')],
    'quietest',
    { a: open(10), b: open(0), c: open(30) },
    null
  ),
  ['b', 'a', 'c'],
  'ascending by average wait, and a 0-minute average is a reading'
);

assert.deepEqual(
  orderCountryParks(
    [park('z'), park('closed'), park('nofig'), park('y'), park('tie1'), park('tie2')],
    'quietest',
    {
      z: open(20),
      closed,
      nofig: { status: 'OPERATING' },
      y: open(5),
      tie1: open(12),
      tie2: open(12),
    },
    null
  ),
  ['y', 'tie1', 'tie2', 'z', 'closed', 'nofig'],
  'ties keep input order; shut parks and parks without a figure follow, in input order'
);

assert.deepEqual(
  orderCountryParks([park('a'), park('b')], 'quietest', undefined, null),
  ['a', 'b'],
  'without live data nothing is ranked and the input order stands'
);

const viewer = { lat: 50, lng: 8 };
assert.deepEqual(
  orderCountryParks(
    [park('far', 40, 8), park('near', 50.1, 8), park('shut', 50, 8.01), park('nocoord')],
    'nearest',
    { far: open(1), near: open(50), shut: closed, nocoord: open(1) },
    viewer
  ),
  ['near', 'far', 'shut', 'nocoord'],
  'nearest first among open parks; shut and ungeocoded parks go last in input order'
);

assert.deepEqual(
  orderCountryParks(
    [park('a', '51', '8'), park('b', '50.5', '8')],
    'nearest',
    {
      a: open(1),
      b: open(1),
    },
    viewer
  ),
  ['b', 'a'],
  'coordinates sent as decimal strings are coerced'
);

assert.deepEqual(
  orderCountryParks(
    [park('a', 1, 1), park('b', 2, 2)],
    'nearest',
    { a: open(1), b: open(1) },
    null
  ),
  ['a', 'b'],
  'no viewer position means no ranking'
);

assert.deepEqual(
  orderCountryParks([park('b'), park('a')], 'standard', { a: open(1), b: open(9) }, viewer),
  ['b', 'a'],
  'standard keeps the input order'
);

console.log('country-park-order: all assertions passed');
