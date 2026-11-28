/**
 * Unit tests for the day prices of paid queue products (`lib/parks/purchases.ts`): what the
 * purchases relay keeps of a park's `/schedule` rows, which day a card shows, the order of its rows,
 * a placeholder price, and which days a trip sheet asks the relay for.
 *
 * Run: pnpm test:park-purchases
 */
import assert from 'node:assert/strict';
import {
  PURCHASE_DAYS_AHEAD,
  formattedPurchasePrice,
  inPurchaseWindow,
  pickPurchaseDay,
  purchaseDays,
  sortPurchases,
} from '../lib/parks/purchases.ts';

const multiPass = {
  id: 'lightninglanemultipass_80007944',
  name: 'Lightning Lane Multi Pass',
  type: 'PACKAGE',
  price: { amount: 3700, currency: 'USD', formatted: '$37.00' },
  available: true,
};
const tron = {
  id: 'lightninglane_411504498',
  name: 'Lightning Lane for TRON Lightcycle / Run',
  type: 'ATTRACTION',
  price: { amount: 2300, currency: 'USD', formatted: '$23.00' },
  available: false,
};
const dwarfs = {
  id: 'lightninglane_18904138',
  name: 'Lightning Lane for Seven Dwarfs Mine Train',
  type: 'ATTRACTION',
  price: { amount: 1500, currency: 'USD', formatted: '$15.00' },
  available: true,
};

const tests = [];
const test = (name, run) => tests.push({ name, run });

test('the relay keeps only days with purchases, one row per date, in date order', () => {
  const days = purchaseDays([
    { date: '2026-12-02', scheduleType: 'OPERATING', purchases: [multiPass] },
    { date: '2026-12-01', scheduleType: 'OPERATING', purchases: [tron, multiPass] },
    { date: '2026-12-01', scheduleType: 'TICKETED_EVENT', purchases: [dwarfs] },
    { date: '2026-12-03', scheduleType: 'OPERATING' },
    { date: '2026-12-04', scheduleType: 'CLOSED', purchases: [] },
  ]);
  assert.deepEqual(
    days.map((d) => [d.date, d.purchases.length]),
    [
      ['2026-12-01', 2],
      ['2026-12-02', 1],
    ]
  );
});

test('the relay drops every field the card does not draw', () => {
  const [day] = purchaseDays([
    {
      date: '2026-12-01',
      scheduleType: 'OPERATING',
      openingTime: '2026-12-01T13:00:00.000Z',
      influencingHolidays: [],
      purchases: [{ ...multiPass, description: 'x', price: { ...multiPass.price, tax: 1 } }],
    },
  ]);
  assert.deepEqual(day, { date: '2026-12-01', purchases: [multiPass] });
});

test('the relay keeps a purchase without a price or an id', () => {
  const [day] = purchaseDays([
    { date: '2026-12-01', purchases: [{ name: 'Lightning Lane Premier Pass', price: null }] },
  ]);
  assert.deepEqual(day.purchases, [{ name: 'Lightning Lane Premier Pass', price: null }]);
});

test('the relay answers an empty list for a park without a schedule', () => {
  assert.deepEqual(purchaseDays(undefined), []);
  assert.deepEqual(purchaseDays([]), []);
});

const schedule = purchaseDays([
  { date: '2026-11-30', purchases: [multiPass] },
  { date: '2026-12-01', purchases: [tron, multiPass] },
  { date: '2026-12-05', purchases: [dwarfs] },
]);

test('a named day is that day', () => {
  assert.equal(pickPurchaseDay(schedule, { date: '2026-12-01' })?.date, '2026-12-01');
});

test('a named day without prices is nothing, never the next day', () => {
  assert.equal(pickPurchaseDay(schedule, { date: '2026-12-03' }), null);
});

test('without a named day the card falls forward to the next day with prices', () => {
  assert.equal(pickPurchaseDay(schedule, { from: '2026-12-02' })?.date, '2026-12-05');
  assert.equal(pickPurchaseDay(schedule, { from: '2026-12-06' }), null);
});

test('packages come first, then the ride passes A to Z', () => {
  assert.deepEqual(
    sortPurchases([tron, dwarfs, multiPass]).map((p) => p.name),
    [multiPass.name, dwarfs.name, tron.name]
  );
});

test('a placeholder price shows none', () => {
  assert.equal(formattedPurchasePrice(multiPass), '$37.00');
  assert.equal(formattedPurchasePrice({ ...multiPass, price: null }), null);
  assert.equal(
    formattedPurchasePrice({
      ...multiPass,
      price: { amount: 0, currency: 'USD', formatted: '$0' },
    }),
    null
  );
  assert.equal(
    formattedPurchasePrice({
      ...multiPass,
      price: { amount: 3700, currency: 'USD', formatted: 'Unknown' },
    }),
    null
  );
});

test('a sheet asks from today to the end of the relay window, and not before the clock is read', () => {
  const today = '2026-11-28';
  assert.equal(PURCHASE_DAYS_AHEAD, 30);
  assert.equal(inPurchaseWindow('2026-11-27', today), false);
  assert.equal(inPurchaseWindow(today, today), true);
  assert.equal(inPurchaseWindow('2026-12-28', today), true);
  assert.equal(inPurchaseWindow('2026-12-29', today), false);
  assert.equal(inPurchaseWindow(today, null), false);
});

let failed = 0;
for (const { name, run } of tests) {
  try {
    run();
  } catch (error) {
    failed++;
    console.log(`FAIL: ${name}\n   ${error.message.split('\n').join('\n   ')}`);
  }
}
console.log(`\nResults: ${tests.length - failed}/${tests.length} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
