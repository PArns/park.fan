/**
 * Unit tests for Parky's ideas in the trip planner (`lib/trip-regions/plan-ideas.ts`): which of the
 * API's ideas the visitor gets to see once the assistant knows their answers, how an idea's query
 * part is applied to the planner's state, which day an idea belongs under, and its card's figure
 * and verb.
 *
 * Run: pnpm test:plan-ideas
 */

import {
  applyIdea,
  ideaDay,
  ideaFigure,
  ideaOnDay,
  ideaTravelDay,
  ideaTravelEnd,
  ideaVerb,
  shownIdeas,
  withQueryPart,
} from '../lib/trip-regions/plan-ideas.ts';
import { DEFAULT_PLAN_STATE, writePlanQuery } from '../lib/trip-regions/plan-query.ts';
import { runCases } from './lib/run-cases.mjs';

const cases = [];
const test = (name, actual, expected) => cases.push({ name, actual, expected });

const idea = (kind, extra = {}) => ({
  kind,
  query: `${kind}=1`,
  headlinerWait: {},
  totals: {},
  savedMinutes: 0,
  ...extra,
});
const all = [
  idea('travel_day'),
  idea('hopper'),
  idea('move', { from: '2026-12-08', to: '2026-12-10' }),
  idea('add', { to: '2026-12-11' }),
];

test(
  'without answers the API’s ideas stand, at most three',
  shownIdeas(all, new Set()).map((i) => i.kind),
  ['travel_day', 'hopper', 'move']
);
test(
  'a travel-day answer drops the travel-day idea',
  shownIdeas(all, new Set(['travel_days'])).map((i) => i.kind),
  ['hopper', 'move', 'add']
);
test(
  'a hopper answer drops the hopper idea',
  shownIdeas(all, new Set(['hop', 'travel_days'])).map((i) => i.kind),
  ['move', 'add']
);
test(
  'a kind this client does not know is not shown',
  shownIdeas([idea('teleport'), idea('swap')], new Set()).map((i) => i.kind),
  ['swap']
);
test('no answer, no ideas', shownIdeas(undefined, new Set()), []);

test(
  'a query part replaces each of its values whole and keeps the rest',
  withQueryPart(
    'from=2026-12-06&to=2026-12-13&lock=epcot@2026-12-08',
    'lock=epcot@2026-12-08,magic-kingdom-park@2026-12-10&arrival=park'
  ),
  'from=2026-12-06&to=2026-12-13&lock=epcot%402026-12-08%2Cmagic-kingdom-park%402026-12-10&arrival=park'
);

const trip = {
  ...DEFAULT_PLAN_STATE,
  from: '2026-12-06',
  to: '2026-12-13',
  locks: [{ target: 'epcot', date: '2026-12-08' }],
};
const moved = applyIdea(trip, {
  query: 'lock=epcot@2026-12-08,magic-kingdom-park@2026-12-10',
});
test('an applied idea keeps the pins it lists and adds its own', moved.locks, [
  { target: 'epcot', date: '2026-12-08' },
  { target: 'magic-kingdom-park', date: '2026-12-10' },
]);
test(
  'an applied travel-day idea sets both ends and nothing else',
  writePlanQuery(applyIdea(trip, { query: 'arrival=park&departure=park' })),
  writePlanQuery({ ...trip, arrival: 'park', departure: 'park' })
);
test(
  'an applied add idea chooses the park and pins it',
  (() => {
    const s = applyIdea(trip, {
      query:
        'parks=epcot,magic-kingdom-park,universal-epic-universe,volcano-bay&lock=epcot@2026-12-08,volcano-bay@2026-12-11',
    });
    return [s.parks?.map((p) => p.slug).includes('volcano-bay'), s.locks.length];
  })(),
  [true, 2]
);

test('an idea belongs under the day it takes a park from', ideaDay({ from: 'a', to: 'b' }), 'a');
test('else under the day it puts one on', ideaDay({ to: 'b' }), 'b');
test('the first idea about a day is its hint', ideaOnDay(all, '2026-12-08')?.kind, 'move');
test('a day without an idea has no hint', ideaOnDay(all, '2026-12-09'), null);

test(
  'the verbs: add for a park, swap for a day that moves, plan for the rest',
  ['add', 'move', 'swap', 'avoid_party', 'travel_day', 'hopper'].map(ideaVerb),
  ['add', 'swap', 'swap', 'swap', 'plan', 'plan']
);
test(
  'a moved park says both figures, rounded',
  ideaFigure({ headlinerWait: { before: 60.4, after: 54.6 } }),
  {
    after: 55,
    before: 60,
  }
);
test('an added park says its own', ideaFigure({ headlinerWait: { after: 50 } }), {
  after: 50,
  before: null,
});
test('no figure after, no figure', ideaFigure({ headlinerWait: { before: 50 } }), null);

test(
  'a travel-day idea names the end it makes a park day',
  ['arrival=park', 'departure=park', 'arrival=park&departure=park'].map(ideaTravelEnd),
  ['arrival', 'departure', 'both']
);
// The Paris weekend: opening the departure day lets Disney Adventure World in on the Friday, so the
// sentence names Sunday as the travel day beside the park's own day.
const weekend = { from: '2027-05-06', to: '2027-05-09' };
test(
  'a travel-day idea names the day it opens, not the park’s day',
  ['departure=park', 'arrival=park', 'arrival=park&departure=park'].map((q) =>
    ideaTravelDay(q, weekend)
  ),
  ['2027-05-09', '2027-05-06', null]
);

await runCases(cases, { json: true });
