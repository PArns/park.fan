import assert from 'node:assert/strict';
import { buildParkHoursIcs, hasOpeningDays, openingDays } from '../lib/parks/park-hours-ics.ts';

const op = (date, o, c, extra = {}) => ({
  date,
  scheduleType: 'OPERATING',
  openingTime: `${date}T${o}:00.000Z`,
  closingTime: `${date}T${c}:00.000Z`,
  ...extra,
});
const now = new Date('2026-10-06T05:00:00.000Z');
const schedule = [
  op('2026-10-05', '07:00', '17:00'), // over
  op('2026-10-06', '07:00', '16:00'),
  { ...op('2026-10-06', '06:30', '16:00'), scheduleType: 'EXTRA_HOURS' },
  op('2026-10-07', '07:00', '16:00', { isEstimated: true }),
  { date: '2026-10-08', scheduleType: 'CLOSED', openingTime: null, closingTime: null },
];
let checks = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  checks++;
};

const days = openingDays(schedule, now);
ok(
  days.length === 2 && days[0].date === '2026-10-06',
  'past, EXTRA_HOURS and CLOSED days drop out'
);
ok(openingDays(schedule).length === 3, 'without a clock only the type filter applies');
ok(!hasOpeningDays([schedule[4]]) && !hasOpeningDays(null), 'no opening day, no link');

const ics = buildParkHoursIcs({
  parkName: 'Europa-Park',
  parkSlug: 'europa-park',
  parkUrl: 'https://park.fan/en/parks/europe/germany/rust/europa-park',
  schedule,
  summary: 'Europa-Park: open',
  estimatedNote: 'Hours are estimated.',
  now,
});
ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'), 'CRLF frame');
ok((ics.match(/BEGIN:VEVENT/g) ?? []).length === 2, 'one event per opening day');
ok(ics.includes('DTSTART:20261006T070000Z\r\nDTEND:20261006T160000Z'), 'UTC times');
ok(ics.includes('UID:europa-park-2026-10-07@park.fan'), 'stable UID');
ok((ics.match(/DESCRIPTION:/g) ?? []).length === 1, 'only the estimated day has a note');
ok(!/EXTRA|2026-10-05|20261005|20261008/.test(ics), 'nothing from skipped days');
for (const line of ics.split('\r\n')) ok(Buffer.byteLength(line) <= 75, `folded: ${line}`);

const long = buildParkHoursIcs({
  parkName: 'Ä'.repeat(60),
  parkSlug: 'x',
  parkUrl: 'https://park.fan/x',
  schedule: [op('2026-10-06', '07:00', '16:00')],
  summary: `Ä, ;\\ ${'ö'.repeat(60)}`,
  estimatedNote: '',
  now,
});
ok(long.includes('\\,') && long.includes('\;') && long.includes('\\\\'), 'text is escaped');
const unfolded = long.replace(/\r\n /g, '');
ok(unfolded.includes('ö'.repeat(60)), 'folding never splits a UTF-8 character');

console.log(`park hours ics: ${checks} checks passed`);
