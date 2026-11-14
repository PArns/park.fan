// Regression tests for the slot range of a ride's "wait times today" chart. Six Flags Qiddiya City
// opens 16:00 and closes at midnight (Asia/Riyadh); a closing bound of "00:00" left one bar at 00h.
import { dailyChartWindow } from '../lib/parks/daily-chart-window.ts';

const TZ = 'Asia/Riyadh';
const win = (open, close, tz = TZ) => {
  const { start, end } = dailyChartWindow(open, close, tz);
  return `${start}-${end}`;
};

const testCases = [
  {
    name: 'a same-day closing rounds to the quarter hour',
    actual: () => win('2026-11-14T06:10:00Z', '2026-11-14T15:50:00Z'),
    expected: '09:00-19:00',
  },
  {
    name: 'a closing at 23:50 rounds up to midnight and runs to 23:45',
    actual: () => win('2026-11-14T13:00:00Z', '2026-11-14T20:50:00Z'),
    expected: '16:00-23:45',
  },
  {
    name: 'a closing at midnight runs to 23:45',
    actual: () => win('2026-11-14T13:00:00Z', '2026-11-14T21:00:00Z'),
    expected: '16:00-23:45',
  },
  {
    name: 'a closing at 01:00 runs to 23:45',
    actual: () => win('2026-11-14T13:00:00Z', '2026-11-14T22:00:00Z'),
    expected: '16:00-23:45',
  },
  {
    name: 'a closing at 02:00 runs to 23:45',
    actual: () => win('2026-11-14T13:00:00Z', '2026-11-14T23:00:00Z'),
    expected: '16:00-23:45',
  },
  {
    name: 'a 24-hour day runs from 00:00 to 23:45',
    actual: () => win('2026-11-13T21:00:00Z', '2026-11-14T21:00:00Z'),
    expected: '00:00-23:45',
  },
  {
    name: 'no schedule times keep the fallback',
    actual: () => win(null, undefined),
    expected: '09:00-19:00',
  },
];

let failed = 0;
for (const { name, actual, expected } of testCases) {
  const got = actual();
  if (got === expected) {
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.error(`❌ ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  }
}
if (failed) process.exit(1);
console.log(`\n${testCases.length} cases passed`);
