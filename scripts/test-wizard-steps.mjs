/**
 * The trip planner's assistant asks per region what its data asks for, and a step with one question
 * goes into its neighbour (`lib/trip-regions/wizard-steps.ts`). The four regions' lists are the
 * ones the approved design shows: Orlando and Japan six steps each, Japan's evening question in
 * Tempo, a Paris weekend's hotel in the Route.
 *
 * Pure local data, no server, no network. Run: pnpm test:wizard-steps
 */

import assert from 'node:assert/strict';
import { daysBetween } from '../lib/utils/park-day.ts';
import { tripRegionConfig } from '../lib/trip-regions/registry.ts';
import {
  stepQuestions,
  tripWizardFacts,
  tripWizardSteps,
  wizardStepIndex,
} from '../lib/trip-regions/wizard-steps.ts';
import { answerSpare, longestFreeRun, spareQuestion } from '../lib/trip-regions/spare-days.ts';
import { DEFAULT_PLAN_STATE } from '../lib/trip-regions/plan.ts';

const keys = (steps) => steps.map((s) => s.key);
const config = (slug) => {
  const found = tripRegionConfig(slug);
  assert.ok(found, slug);
  return found;
};
const noDates = { from: null, to: null };
const catalog = { size: 12 };

// The API's regions, reduced to what the steps read.
const ORLANDO = { hotelAreas: [{}, {}, {}, {}, {}, {}], bases: undefined, stayRules: undefined };
const CALIFORNIA = { hotelAreas: [{}, {}, {}], bases: undefined, stayRules: undefined };
const JAPAN = {
  hotelAreas: [],
  bases: [
    { key: 'tokyo', hotelAreas: ['a', 'b', 'c'], gateways: [{}], parks: [] },
    { key: 'osaka', hotelAreas: ['a', 'b'], gateways: [{}], parks: [] },
  ],
  stayRules: { moveBufferOptions: [30, 60, 90, 120] },
};
const PARIS = {
  hotelAreas: [],
  bases: [
    { key: 'disneyland', hotelAreas: ['a', 'b'], gateways: [{}], parks: [] },
    { key: 'paris', hotelAreas: ['a'], gateways: [{}], parks: [] },
  ],
  stayRules: { moveBufferOptions: [30, 60, 90, 120] },
};

const steps = (region, slug, state = noDates) =>
  tripWizardSteps(tripWizardFacts(region, config(slug), state, daysBetween, catalog));

// Orlando: Hotel, and the evenings with fireworks, blocks and hopping.
const orlando = steps(ORLANDO, 'orlando');
assert.deepEqual(keys(orlando), ['dates', 'parks', 'hotel', 'pace', 'evenings', 'tickets']);
assert.deepEqual(orlando[4].questions, ['evenings', 'fireworks', 'blocks', 'hop']);

// Southern California: evening shows and hopping keep Evenings a step of its own.
assert.deepEqual(keys(steps(CALIFORNIA, 'southern-california')), [
  'dates',
  'parks',
  'hotel',
  'pace',
  'evenings',
  'tickets',
]);

// Japan: no hopper, so Evenings has one question and goes into Tempo; six steps.
const japan = steps(JAPAN, 'japan');
assert.deepEqual(keys(japan), ['dates', 'parks', 'route', 'hotels', 'pace', 'tickets']);
const pace = japan[4];
assert.deepEqual(pace.merged, ['evenings']);
assert.deepEqual(stepQuestions(pace, 'pace'), ['rest', 'second_days', 'travel_days']);
assert.deepEqual(stepQuestions(pace, 'evenings'), ['evenings']);
assert.equal(wizardStepIndex(japan, 'evenings'), 4, 'Evenings opens Tempo in Japan');
assert.equal(wizardStepIndex(japan, 'hotel'), 2, 'a region without Hotel opens the next step');

// Paris: a weekend has no hotel change, so the hotel per city goes into the Route.
const weekend = steps(PARIS, 'paris', { from: '2027-05-14', to: '2027-05-16' });
assert.deepEqual(keys(weekend), ['dates', 'parks', 'route', 'pace', 'evenings', 'tickets']);
assert.deepEqual(weekend[2].merged, ['hotels']);
assert.deepEqual(weekend[2].questions, ['gateways', 'cities', 'city_areas']);
// Three nights can change hotels: Hotels is a step again.
assert.deepEqual(keys(steps(PARIS, 'paris', { from: '2027-05-14', to: '2027-05-17' })), [
  'dates',
  'parks',
  'route',
  'hotels',
  'pace',
  'evenings',
  'tickets',
]);

// Dates, parks and tickets never merge, even with one question each.
for (const list of [orlando, japan, weekend]) {
  for (const key of ['dates', 'parks', 'tickets']) {
    assert.ok(keys(list).includes(key), `${key} stays a step`);
  }
}

// Without a ticket catalog the hopper cannot count, so Orlando's evenings drop it.
const noCatalog = tripWizardSteps(
  tripWizardFacts(ORLANDO, config('orlando'), noDates, daysBetween, { size: 0 })
);
assert.deepEqual(noCatalog[4].questions, ['evenings', 'fireworks', 'blocks']);
assert.ok(!keys(noCatalog).includes('tickets'), 'no catalog, no ticket question');

// Days without a park: Japan, 14–30 January, three parks twice each (the API's answer for it).
const kinds = 'A P R P T P P R R R R R P R R P D'.split(' ');
const KIND = { A: 'arrival', P: 'park', R: 'rest', T: 'travel', D: 'departure' };
const japanPlan = {
  days: kinds.map((k, i) => ({
    date: `2027-01-${String(14 + i).padStart(2, '0')}`,
    kind: KIND[k],
    parks: k === 'P' ? [{ slug: 'x', part: 'full' }] : [],
    reasons: [],
    warnings: [],
  })),
  parks: [
    { slug: 'tokyo-disneyland', dates: ['a', 'b'], alternatives: [] },
    { slug: 'tokyo-disneysea', dates: ['a', 'b'], alternatives: [] },
    { slug: 'universal-studios-japan', dates: ['a', 'b'], alternatives: [] },
  ],
  totals: { parkDays: 6, restDays: 8, visits: 6 },
};
const order = [
  'tokyo-disneyland',
  'tokyo-disneysea',
  'fuji-q-highland',
  'legoland-japan',
  'universal-studios-japan',
];
assert.equal(longestFreeRun(japanPlan.days), 5);
const question = spareQuestion(japanPlan, order);
assert.ok(question, 'eight free days against six park days are asked about');
assert.equal(question.free, 8);
assert.equal(question.others, 3, 'arrival, the travel day and departure');
assert.equal(question.shorter, 9);
assert.deepEqual(question.moreParks, ['fuji-q-highland', 'legoland-japan']);
assert.equal(question.moreDays.length, 3);
// The API's own candidates win where it sends them.
assert.deepEqual(
  spareQuestion({ ...japanPlan, spareDayParks: [{ park: 'fuji-q-highland', days: [] }] }, order)
    .moreParks,
  ['fuji-q-highland']
);
// A free day the API marks is the only kind counted once it marks them.
const marked = japanPlan.days.map((d) => ({ ...d, spare: false }));
assert.equal(spareQuestion({ ...japanPlan, days: marked }, order), null);
// A week with one free day is not asked about.
const week = { ...japanPlan, days: japanPlan.days.slice(0, 5), totals: { parkDays: 2 } };
assert.equal(spareQuestion(week, order), null);
const state = { ...DEFAULT_PLAN_STATE, from: '2027-01-14', to: '2027-01-30' };
const shorter = answerSpare(state, 'shorter', question, japanPlan, order, []);
assert.equal(shorter.to, '2027-01-22');
assert.equal(answerSpare(state, 'free', question, japanPlan, order, []), state);
const more = answerSpare(state, 'more_days', question, japanPlan, order, []);
assert.ok(more.parks?.every((p) => p.visits === 3));

console.log('wizard steps: ok');
