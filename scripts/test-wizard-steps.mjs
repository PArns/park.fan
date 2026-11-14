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

console.log('wizard steps: ok');
