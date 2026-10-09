/**
 * The planner's look-back day (`tier: 'climatology'`): no band with a figure, no error figure, and
 * a note in all six locales for each holiday situation the API can match on.
 *
 *     pnpm test:planner-climatology
 */

import { readFileSync } from 'node:fs';
import { bandCarriesFigure, estimateFor } from '../lib/planner/estimate.ts';
import { climatologyNote } from '../lib/planner/climatology.ts';

const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];
const STATES = ['holiday', 'school_vacation', 'regular'];

const messages = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url))).planner,
  ])
);

let failed = 0;
let applied = 0;
const check = (name, ok, detail = '') => {
  applied++;
  if (!ok) {
    failed++;
    console.error(`✗ ${name} ${detail}`);
  }
};

const day = (tier, extra = {}) => ({
  parkSlug: 'x',
  timezone: 'Europe/Berlin',
  context: { date: '2027-06-29', status: 'OPERATING', openHour: 9, closeHour: 18 },
  tier,
  leadDays: 264,
  rides: [
    {
      attractionSlug: 'a',
      attractionName: 'A',
      hours: [{ hour: 10, wait: 30 }],
      dayPeak: 40,
      uncertaintyMinutes: 12,
      expectedError: 9,
    },
  ],
  shows: [],
  ...extra,
});
const climatology = (holidayState, days = 4) => ({
  label: 'how_it_was_last_year',
  holidayState,
  referenceDates: Array.from({ length: days }, (_, i) => `2026-06-${10 + i}`),
  minObservationDays: 4,
});
const entry = { id: 'e', attractionSlug: 'a', startMinute: 600 };

check(
  'climatology: the band carries no figure, even beside a measured lead error',
  bandCarriesFigure(day('climatology', { leadTimeMae: 14 })) === false
);
check(
  'composed with a lead error keeps its figure',
  bandCarriesFigure(day('composed', { leadTimeMae: 14 }))
);
check('measured keeps its figure', bandCarriesFigure(day('measured')));

const look = estimateFor(day('climatology'), entry);
check('climatology: wait is the curve', look.wait === 30);
check('climatology: no spread', look.uncertaintyMinutes === null);
check('climatology: no typical error', look.expectedError === null);
check('climatology: the block says so', look.tier === 'climatology');
const composed = estimateFor(day('composed'), entry);
check(
  'composed: spread and error survive',
  composed.uncertaintyMinutes === 12 && composed.expectedError === 9
);

for (const state of STATES) {
  const note = climatologyNote(day('climatology', { climatology: climatology(state, 3) }));
  check(`${state}: note`, note !== null);
  if (!note) continue;
  check(`${state}: counts the reference days`, note.values.days === 3);
  check(`${state}: keeps the situation`, note.holidayState === state);
  for (const locale of LOCALES) {
    check(`${state}/${locale}: message`, typeof messages[locale].climatology?.[state] === 'string');
  }
}
for (const locale of LOCALES) {
  check(`${locale}: title`, typeof messages[locale].climatology?.title === 'string');
  check(`${locale}: tier label`, typeof messages[locale].tier?.climatology === 'string');
}
check(
  'a tier other than climatology has no note',
  climatologyNote(day('composed', { climatology: climatology('regular') })) === null
);
check('climatology without its object has no note', climatologyNote(day('climatology')) === null);
check('no day has no note', climatologyNote(null) === null);
const unused = Object.keys(messages.de.climatology).filter(
  (k) => k !== 'title' && !STATES.includes(k)
);
check('no message without a situation', unused.length === 0, unused.join(','));

console.log(`${applied} checks, ${failed} failed`);
if (failed > 0) process.exit(1);
