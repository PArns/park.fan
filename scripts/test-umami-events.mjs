/**
 * Unit tests for the three events of PAR-577 in `lib/analytics/umami.ts`: `attraction_filter_used`,
 * `covered_ride_opened` and `planner_closed_empty`.
 *
 * The cases that matter: nothing fires under `?sim=` or `?state=` (checked with a URL, not a dev
 * flag), a closing is reported once per opening and only when no day got its first block in it, and
 * a day started while the panel is closed belongs to no opening.
 *
 * Run: pnpm test:umami-events
 */

import {
  trackAttractionFilterUsed,
  trackCoveredRideOpened,
  trackPlanDayStarted,
  trackPlannerClosed,
  trackPlannerOpened,
} from '../lib/analytics/umami.ts';

let sent = [];
const visit = (search) => {
  sent = [];
  globalThis.window = {
    location: { search },
    umami: { track: (name, data) => sent.push(data ? [name, data] : [name]) },
  };
};

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

visit('');
trackAttractionFilterUsed('covered');
test('filter pill reports its name', sent, [['attraction_filter_used', { filter: 'covered' }]]);

visit('');
trackCoveredRideOpened();
test('covered ride opened has no property', sent, [['covered_ride_opened']]);

visit('');
trackPlannerOpened('tab');
trackPlannerClosed();
trackPlannerClosed();
test(
  'closing without a plan fires once per opening',
  sent.map((e) => e[0]),
  ['planner_opened', 'planner_closed_empty']
);

visit('');
trackPlannerOpened('tab');
trackPlanDayStarted('Efteling');
trackPlannerClosed();
test(
  'closing after a first block is silent',
  sent.map((e) => e[0]),
  ['planner_opened', 'plan_day_started']
);

visit('');
trackPlannerOpened('tab');
trackPlannerClosed();
trackPlanDayStarted('Efteling');
trackPlannerClosed();
test(
  'a day started while closed is no opening',
  sent.map((e) => e[0]),
  ['planner_opened', 'planner_closed_empty', 'plan_day_started']
);

for (const search of ['?sim=in_park', '?sim=compass', '?state=rain', '?foo=1&sim=1']) {
  visit(search);
  trackAttractionFilterUsed('wet');
  trackCoveredRideOpened();
  trackPlannerOpened('tab');
  trackPlannerClosed();
  test(
    `${search}: only planner_opened (an existing event) is sent`,
    sent.map((e) => e[0]),
    ['planner_opened']
  );
}

let failed = 0;
for (const { name, actual, expected } of cases) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed++;
    console.error(
      `FAIL ${name}\n  got      ${JSON.stringify(actual)}\n  expected ${JSON.stringify(expected)}`
    );
  }
}
console.log(`${cases.length - failed}/${cases.length} passed`);
if (failed) process.exit(1);
