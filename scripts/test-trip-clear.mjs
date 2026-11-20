/**
 * Unit tests for `clearTrip` (`lib/trip-regions/trip-clear.ts`), the one clearing behind „Reise
 * löschen“ and „Neue Reise planen“: every store of one region's trip on this device emptied (the
 * planner on screen, the address bar, the remembered trip, the assistant's answers, the ticket
 * answer, the parks ticked off as visited, Parky's interview and his last change), another
 * region's trip left alone, and the copy in memory put back whole, or let go with the interview
 * counted as left.
 *
 * Run: pnpm test:trip-clear
 */
import assert from 'node:assert/strict';

let passed = 0;
function check(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  console.log(`  ✓ ${label}`);
  passed++;
}

const storage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};
const ORIGIN = 'https://park.fan';
const location = { origin: ORIGIN, pathname: '/de/orlando', search: '', hash: '' };
const go = (href) => {
  const url = new URL(href, ORIGIN);
  location.pathname = url.pathname;
  location.search = url.search;
  location.hash = url.hash;
};
globalThis.window = {
  localStorage: storage(),
  sessionStorage: storage(),
  location,
  history: { replaceState: (_state, _title, href) => go(href) },
};
const href = () => `${location.pathname}${location.search}${location.hash}`;

const { connectPlannerBridge, tripPlannerBridge } =
  await import('@/lib/trip-regions/planner-bridge.ts');
const { readPlanQuery, writePlanQuery } = await import('@/lib/trip-regions/plan-query.ts');
const { rememberParty, rememberTrip, rememberedTrip } =
  await import('@/lib/trip-regions/remembered-trip.ts');
const { tripWizardAnswered } = await import('@/lib/trip-regions/planner-ui.ts');
const { tripTicketAnswer } = await import('@/lib/trip-regions/ticket-answer.ts');
const { visitedParks } = await import('@/lib/trip-regions/visited-parks.ts');
const { interviewStore } = await import('@/lib/assistant/interview.ts');
const { rememberTripChange, takeTripUndo } = await import('@/lib/assistant/trip-context.ts');
const { onSiteEvent } = await import('@/lib/analytics/site-analytics.ts');
const { clearTrip } = await import('@/lib/trip-regions/trip-clear.ts');

const TRIP = 'from=2027-10-14&to=2027-10-21&lock=epcot@2027-10-15';
const JAPAN = 'from=2027-04-01&to=2027-04-08';
const interview = {
  kind: 'trip',
  region: 'orlando',
  step: 'parks',
  answered: ['region', 'dates'],
  skipped: [],
  mustDoRides: [],
  source: 'chat',
};
const events = [];
onSiteEvent((name, props) => events.push({ name, props }));

/** A planner on screen as `usePlanState` connects it: its state, its edits, its own clear. */
function mountPlanner(query) {
  const planner = { state: readPlanQuery(new URLSearchParams(query)), history: ['pin'] };
  const connect = () =>
    connectPlannerBridge('orlando', planner.state, planner.state, () => undefined, undefined, {
      edit: () => undefined,
      undo: () => false,
      clear: () => {
        const kept = { state: planner.state, history: planner.history };
        planner.state = readPlanQuery(new URLSearchParams());
        planner.history = [];
        go(`${location.pathname}#planner`);
        connect();
        return () => {
          planner.state = kept.state;
          planner.history = kept.history;
          go(`${location.pathname}?${writePlanQuery(kept.state)}#planner`);
          connect();
        };
      },
    });
  connect();
  return planner;
}

/** Every store holds a trip for Orlando, and Japan has one of its own. */
function seed() {
  go(`/de/orlando?${TRIP}#calendar-2027-10-16`);
  rememberTrip('orlando', TRIP, 1);
  rememberParty('orlando', { size: 4, heightsCm: [105] }, 2);
  rememberTrip('japan', JAPAN, 3);
  tripWizardAnswered.mark('orlando', ['hotel', 'pace']);
  tripWizardAnswered.mark('japan', ['route']);
  tripTicketAnswer('orlando').set('no');
  tripTicketAnswer('japan').set('yes');
  visitedParks('orlando').toggle('epcot', '2027-10-15');
  visitedParks('japan').toggle('tokyo-disneyland', '2027-04-02');
  interviewStore.set(interview);
  rememberTripChange('orlando', '', TRIP);
}

console.log('\nclearTrip: with the planner on screen');
seed();
const planner = mountPlanner(TRIP);
const keptOrlando = rememberedTrip('orlando');
let cleared = clearTrip('orlando');
check(href(), '/de/orlando', 'the address bar is the hub, no query and no fragment');
check(writePlanQuery(planner.state), '', 'the planner on screen is empty, its pins with it');
check(planner.history, [], 'and so is its edit history');
check(tripPlannerBridge.current()?.query, '', 'Parky reads no trip on screen');
check(rememberedTrip('orlando'), null, 'the remembered trip is gone, so a reload restores nothing');
check(rememberedTrip('japan')?.query, JAPAN, "another region's trip stays");
check([...tripWizardAnswered.get('orlando')], [], "the assistant's answers are forgotten");
check([...tripWizardAnswered.get('japan')], ['route'], "another region's answers stay");
check(tripTicketAnswer('orlando').getSnapshot(), null, 'the ticket question will be asked again');
check(tripTicketAnswer('japan').getSnapshot(), 'yes', "another region's ticket answer stays");
check(visitedParks('orlando').getSnapshot(), {}, 'no park is ticked off as visited any more');
check(
  visitedParks('japan').getSnapshot(),
  { 'tokyo-disneyland': '2027-04-02' },
  "another region's ticks stay"
);
check(interviewStore.getSnapshot(), null, "Parky's interview for the trip ends");

cleared.restore();
check(href(), `/de/orlando?${TRIP}#calendar-2027-10-16`, 'the undo puts the address back');
check(writePlanQuery(planner.state), TRIP, 'the plan comes back with its pins');
check(planner.history, ['pin'], 'and its edit history');
check(rememberedTrip('orlando'), keptOrlando, 'the remembered trip comes back, party and all');
check([...tripWizardAnswered.get('orlando')], ['hotel', 'pace'], 'the answers come back');
check(tripTicketAnswer('orlando').getSnapshot(), 'no', 'the ticket answer comes back');
check(visitedParks('orlando').getSnapshot(), { epcot: '2027-10-15' }, 'and so do the ticks');
check(interviewStore.getSnapshot(), interview, 'the interview comes back where it stood');
check(
  events.filter((e) => e.name === 'assistant_interview_ended'),
  [],
  'a delete taken back counts no ended interview'
);
cleared.drop();
check(events.length, 0, 'a copy put back is spent: dropping it counts nothing');

console.log('\nclearTrip: let go');
cleared = clearTrip('orlando');
check(takeTripUndo('orlando'), 'none', "Parky's undo has no change left to bring the trip back");
cleared.drop();
check(
  events.map((e) => e.name),
  ['assistant_interview_ended'],
  'letting the copy go counts the interview it ended'
);
check(events[0].props.outcome, 'left', 'as left');
cleared.restore();
check(rememberedTrip('orlando'), null, 'and nothing is kept after it');
check(writePlanQuery(planner.state), '', 'the planner stays empty');

console.log('\nclearTrip: without a planner on screen');
seed();
interviewStore.set({ ...interview, region: 'japan' });
connectPlannerBridge(
  'japan',
  readPlanQuery(new URLSearchParams(JAPAN)),
  readPlanQuery(new URLSearchParams(JAPAN)),
  () => undefined,
  undefined,
  {
    edit: () => undefined,
    undo: () => false,
    clear: () => () => undefined,
  }
)();
check(tripPlannerBridge.current(), null, 'no planner on screen');
cleared = clearTrip('orlando');
check(href(), '/de/orlando', "the address bar's query goes all the same");
check(interviewStore.getSnapshot()?.region, 'japan', "another region's interview runs on");
cleared.restore();
check(href(), `/de/orlando?${TRIP}#calendar-2027-10-16`, 'and the undo puts it back as it was');

console.log(`\n${passed} passed`);
