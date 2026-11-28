/**
 * The blog's inline ride chip for a ride that starts at set times (`inlinePerformanceSlot`): the
 * next start between performances, where the feed reads CLOSED, and the usual status otherwise.
 * Die 3 Mausketiere in the Wintertraum 2026/27 are the case: 13, 14, 15, 16 and 17 o'clock.
 *
 * Run: pnpm test:blog-performance-chip
 */
import { inlinePerformanceSlot } from '../lib/blog/live-display.ts';
import { check, finishChecks, quietChecks } from './lib/run-cases.mjs';

quietChecks();

const schedules = [
  { from: '2026-11-14', to: '2027-01-24', times: ['13:00', '14:00', '15:00', '16:00', '17:00'] },
];
const gate = (status, parkStatus = 'OPERATING', worksPeriods = []) => ({
  schedules,
  worksPeriods,
  status,
  parkStatus,
});
const at = (date, time) => ({ date, time });

check(
  'before the first show',
  inlinePerformanceSlot(gate('OPERATING'), at('2026-11-18', '12:52')),
  '13:00'
);
check(
  'CLOSED between two shows',
  inlinePerformanceSlot(gate('CLOSED'), at('2026-11-18', '13:51')),
  '14:00'
);
check(
  'in the minute a show starts',
  inlinePerformanceSlot(gate('CLOSED'), at('2026-11-18', '15:00')),
  '15:00'
);
check(
  'after the last show began',
  inlinePerformanceSlot(gate('CLOSED'), at('2026-11-18', '17:01')),
  null
);
check(
  'a day outside the programme',
  inlinePerformanceSlot(gate('CLOSED'), at('2027-02-01', '14:00')),
  null
);
check(
  'a closed park',
  inlinePerformanceSlot(gate('CLOSED', 'CLOSED'), at('2026-11-18', '13:51')),
  null
);
check(
  'an outage keeps its badge',
  inlinePerformanceSlot(gate('DOWN'), at('2026-11-18', '13:51')),
  null
);
check(
  'a works window keeps its badge',
  inlinePerformanceSlot(
    gate('CLOSED', 'OPERATING', [{ from: '2026-11-17', to: '2026-11-20', toUncertain: false }]),
    at('2026-11-18', '13:51')
  ),
  null
);
check('before the first clock tick', inlinePerformanceSlot(gate('CLOSED'), null), 'pending');
check(
  'no programme before the tick',
  inlinePerformanceSlot({ ...gate('CLOSED'), schedules: [] }, null),
  null
);
check('closed park before the tick', inlinePerformanceSlot(gate('CLOSED', 'CLOSED'), null), null);

finishChecks();
console.log('✅ blog-performance-chip: all checks passed');
