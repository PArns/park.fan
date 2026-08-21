import { buildOpeningHoursSpecification } from '../lib/utils/opening-hours-schema.ts';

const op = (date, openingTime, closingTime, scheduleType = 'OPERATING') => ({
  date,
  scheduleType,
  openingTime,
  closingTime,
  description: null,
  purchases: null,
  holidayName: null,
});

const testCases = [
  {
    name: 'Europa-Park (CEST, +02:00) — the reported case',
    schedule: [op('2026-08-21', '2026-08-21T07:00:00.000Z', '2026-08-21T16:00:00.000Z')],
    timeZone: 'Europe/Berlin',
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '09:00',
        closes: '18:00',
        validFrom: '2026-08-21',
        validThrough: '2026-08-21',
      },
    ],
  },
  {
    name: 'Tokyo Disneyland (JST, +09:00) — read as midnight-to-noon before',
    schedule: [op('2026-08-21', '2026-08-21T00:00:00.000Z', '2026-08-21T12:00:00.000Z')],
    timeZone: 'Asia/Tokyo',
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '09:00',
        closes: '21:00',
        validFrom: '2026-08-21',
        validThrough: '2026-08-21',
      },
    ],
  },
  {
    name: 'Disney California Adventure (PDT, -07:00) — closes rolled to the next UTC day',
    schedule: [op('2026-08-21', '2026-08-21T15:00:00.000Z', '2026-08-22T05:00:00.000Z')],
    timeZone: 'America/Los_Angeles',
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '08:00',
        closes: '22:00',
        validFrom: '2026-08-21',
        validThrough: '2026-08-21',
      },
    ],
  },
  {
    name: 'Six Flags New England closing after local midnight — closes < opens, one entry',
    schedule: [op('2026-08-22', '2026-08-22T15:00:00.000Z', '2026-08-23T05:00:00.000Z')],
    timeZone: 'America/New_York',
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '11:00',
        closes: '01:00',
        validFrom: '2026-08-22',
        validThrough: '2026-08-22',
      },
    ],
  },
  {
    name: 'CLOSED day is dropped rather than emitted with no hours',
    schedule: [op('2026-08-21', null, null, 'CLOSED')],
    timeZone: 'America/Chicago',
    expected: undefined,
  },
  {
    name: 'UNKNOWN day with no hours is dropped',
    schedule: [op('2026-08-21', null, null, 'UNKNOWN')],
    timeZone: 'Europe/Berlin',
    expected: undefined,
  },
  {
    name: 'INFO day WITH hours is kept — Warner Bros. Movie World publishes all 17 of its days that way',
    schedule: [op('2026-08-22', '2026-08-22T00:30:00.000Z', '2026-08-22T06:00:00.000Z', 'INFO')],
    timeZone: 'Australia/Brisbane',
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '10:30',
        closes: '16:00',
        validFrom: '2026-08-22',
        validThrough: '2026-08-22',
      },
    ],
  },
  {
    name: 'OPERATING day missing its times is dropped',
    schedule: [op('2026-08-21', null, '2026-08-21T16:00:00.000Z')],
    timeZone: 'Europe/Berlin',
    expected: undefined,
  },
  {
    name: 'Mixed week keeps only the operating days, in order',
    schedule: [
      op('2026-08-21', '2026-08-21T07:00:00.000Z', '2026-08-21T16:00:00.000Z'),
      op('2026-08-22', null, null, 'CLOSED'),
      op('2026-08-23', '2026-08-23T08:00:00.000Z', '2026-08-23T20:00:00.000Z'),
    ],
    timeZone: 'Europe/Berlin',
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '09:00',
        closes: '18:00',
        validFrom: '2026-08-21',
        validThrough: '2026-08-21',
      },
      {
        '@type': 'OpeningHoursSpecification',
        opens: '10:00',
        closes: '22:00',
        validFrom: '2026-08-23',
        validThrough: '2026-08-23',
      },
    ],
  },
  {
    name: 'Winter date uses CET (+01:00), not a frozen summer offset',
    schedule: [op('2026-12-05', '2026-12-05T10:00:00.000Z', '2026-12-05T19:00:00.000Z')],
    timeZone: 'Europe/Berlin',
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '11:00',
        closes: '20:00',
        validFrom: '2026-12-05',
        validThrough: '2026-12-05',
      },
    ],
  },
  {
    name: 'Missing timezone falls back to UTC rather than throwing',
    schedule: [op('2026-08-21', '2026-08-21T07:00:00.000Z', '2026-08-21T16:00:00.000Z')],
    timeZone: null,
    expected: [
      {
        '@type': 'OpeningHoursSpecification',
        opens: '07:00',
        closes: '16:00',
        validFrom: '2026-08-21',
        validThrough: '2026-08-21',
      },
    ],
  },
  {
    name: 'Malformed timestamp drops that day instead of throwing',
    schedule: [op('2026-08-21', 'not-a-timestamp', '2026-08-21T16:00:00.000Z')],
    timeZone: 'Europe/Berlin',
    expected: undefined,
  },
  {
    name: 'No schedule at all',
    schedule: undefined,
    timeZone: 'Europe/Berlin',
    expected: undefined,
  },
  { name: 'Empty schedule', schedule: [], timeZone: 'Europe/Berlin', expected: undefined },
];

let passed = 0;
let failed = 0;

console.log('\nopening-hours-schema\n' + '='.repeat(80) + '\n');

for (const testCase of testCases) {
  const result = buildOpeningHoursSpecification(testCase.schedule, testCase.timeZone);
  const success = JSON.stringify(result) === JSON.stringify(testCase.expected);

  if (success) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`   Got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed.');
  process.exit(1);
}
