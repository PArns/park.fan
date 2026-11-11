// The admin's data API key page: what the hourly-limit field accepts and how a key's usage reads.
import {
  createDataApiKeyBody,
  formatAllowedParks,
  formatHourlyUsage,
  parseRequestsPerHour,
} from '../lib/admin/api-keys.ts';

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
      }),
    expected:
      '{"name":"Club","usage":"non-commercial","requestsPerHour":null,"allowedParkIds":null}',
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
    expected: 'Magic Kingdom Park, EPCOT',
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
  if (result === testCase.expected) {
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
