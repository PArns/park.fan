// The admin's data API key page: what the hourly-limit field accepts and how a key's usage reads.
import {
  createDataApiKeyBody,
  formatAllowedParks,
  formatHourlyUsage,
  formatKeyExpiry,
  formatKeyUsage,
  formatUsageMonth,
  keyExpiryDay,
  keyExpiryFrom,
  parseRequestsPerHour,
  usedMonths,
} from '../lib/admin/api-keys.ts';

// 11 November 2026, 10:00 in Berlin (UTC+1).
const NOW = Date.parse('2026-11-11T09:00:00Z');

const testCases = [
  {
    name: 'a whole number is an allowance',
    actual: () => parseRequestsPerHour('1000'),
    expected: 1000,
  },
  {
    name: 'German thousands separators are read',
    actual: () => parseRequestsPerHour('1.000'),
    expected: 1000,
  },
  {
    name: 'an empty field means no per-key limit',
    actual: () => parseRequestsPerHour('  '),
    expected: null,
  },
  { name: 'zero is refused', actual: () => parseRequestsPerHour('0'), expected: undefined },
  {
    name: 'a fraction is refused',
    actual: () => parseRequestsPerHour('12,5'),
    expected: undefined,
  },
  {
    name: 'a decimal point is not a thousands point',
    actual: () => parseRequestsPerHour('2.5'),
    expected: undefined,
  },
  {
    name: 'more than a million is refused',
    actual: () => parseRequestsPerHour('1000001'),
    expected: undefined,
  },
  {
    name: 'usage against an allowance',
    actual: () => formatHourlyUsage({ requestsPerHour: 1000, requestsThisHour: 12 }),
    expected: '12 von 1.000 in dieser Stunde',
  },
  {
    name: 'usage without an allowance',
    actual: () => formatHourlyUsage({ requestsPerHour: null }),
    expected: '0 in dieser Stunde, ohne eigenes Limit',
  },
  {
    name: 'the create body sends the allowance and leaves empty fields out',
    actual: () =>
      createDataApiKeyBody({
        name: ' Club ',
        contact: '',
        usage: 'non-commercial',
        note: '',
        requestsPerHour: null,
        allowedParkIds: [],
        expiresAt: null,
      }),
    expected: {
      name: 'Club',
      usage: 'non-commercial',
      requestsPerHour: null,
      allowedParkIds: null,
    },
  },
  {
    // adminFetch serializes the body itself; a string here reached the API encoded twice, as a
    // quoted string the API refused ("… is not valid JSON").
    name: 'the create body is an object, not JSON text',
    actual: () =>
      typeof createDataApiKeyBody({
        name: 'Club',
        contact: 'a@b.c',
        usage: 'internal',
        note: '',
        requestsPerHour: null,
        allowedParkIds: [],
        expiresAt: '2027-06-30T21:59:59.999Z',
      }),
    expected: 'object',
  },
  {
    name: 'use reads as today, 30 days and the refusals, if any',
    actual: () => [
      formatKeyUsage({
        days: [
          { date: '2026-11-10', requests: 3000, limited: 0 },
          { date: '2026-11-11', requests: 120, limited: 0 },
        ],
        months: [],
      }),
      formatKeyUsage({
        days: [{ date: '2026-11-11', requests: 1040, limited: 40 }],
        months: [],
      }),
    ],
    expected: [
      'heute 120 · 30 Tage 3.120',
      'heute 1.040 · 30 Tage 1.040 · 40 über dem Limit abgelehnt',
    ],
  },
  {
    name: 'months before the first request are left out, newest first',
    actual: () => [
      usedMonths({
        days: [],
        months: [
          { month: '2026-09', requests: 0 },
          { month: '2026-10', requests: 40 },
          { month: '2026-11', requests: 0 },
        ],
      }).map((month) => month.month),
      usedMonths({ days: [], months: [{ month: '2026-11', requests: 0 }] }).length,
    ],
    expected: [['2026-11', '2026-10'], 1],
  },
  {
    name: 'a month reads in German',
    actual: () => formatUsageMonth('2026-11'),
    expected: 'November 2026',
  },
  {
    name: 'a chosen day ends at midnight in Berlin, summer time included',
    actual: () => [
      keyExpiryFrom('date', '2027-06-30', NOW),
      keyExpiryFrom('date', '2026-12-31', NOW),
    ],
    expected: ['2027-06-30T21:59:59.999Z', '2026-12-31T22:59:59.999Z'],
  },
  {
    name: 'today still counts, yesterday and a half-typed day do not',
    actual: () => [
      keyExpiryFrom('date', '2026-11-11', NOW) !== undefined,
      keyExpiryFrom('date', '2026-11-10', NOW),
      keyExpiryFrom('date', '2026-11', NOW),
    ],
    expected: [true, undefined, undefined],
  },
  {
    name: 'a lifetime counts from now, never is null',
    actual: () => [keyExpiryFrom('90', '', NOW), keyExpiryFrom('never', '', NOW)],
    expected: ['2027-02-09T09:00:00.000Z', null],
  },
  {
    name: 'the end date reads as a Berlin day, before and after it passes',
    actual: () => [
      keyExpiryDay('2027-06-30T21:59:59.999Z'),
      formatKeyExpiry('2027-06-30T21:59:59.999Z', NOW),
      formatKeyExpiry('2026-01-31T22:59:59.999Z', NOW),
      formatKeyExpiry(null, NOW),
    ],
    expected: ['2027-06-30', 'gültig bis 30.06.2027', 'abgelaufen am 31.01.2026', 'unbefristet'],
  },
  {
    name: 'a key limited to parks names them',
    actual: () =>
      formatAllowedParks({
        allowedParkIds: ['a', 'b'],
        allowedParks: [
          { id: 'a', name: 'Magic Kingdom Park' },
          { id: 'b', name: 'EPCOT' },
        ],
      }),
    expected: 'nur Magic Kingdom Park, EPCOT',
  },
  {
    name: 'a key without parks covers all of them',
    actual: () => formatAllowedParks({ allowedParkIds: null }),
    expected: 'alle Parks',
  },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  let result;
  try {
    result = testCase.actual();
  } catch (error) {
    result = `threw: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
    passed++;
    console.log(`  ✓ ${testCase.name}`);
  } else {
    failed++;
    console.log(`  ✗ ${testCase.name}`);
    console.log(`      expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`      actual:   ${JSON.stringify(result)}`);
  }
}

console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
console.log('🎉 All tests passed!');
