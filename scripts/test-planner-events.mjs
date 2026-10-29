/**
 * Unit tests for the planner's events beyond the open/close funnel (`lib/analytics/planner-funnel.ts`)
 * and the ids they name (`lib/planner/entity-ids.ts`): a wizard opening counts each step once
 * however often it is shown, and its inline fit assistant once; an item event names a ride's or a
 * show's UUID and never the park's; a park event names the park's; an id nobody has named, or
 * anything that is not a UUID, sends no entity rather than a guess.
 *
 * Run: pnpm test:planner-events
 */
import assert from 'node:assert/strict';
import { browser, hits } from './lib/fake-browser.mjs';
import { flushSiteAnalytics } from '../lib/analytics/site-analytics.ts';
import {
  createPlannerWizardSession,
  planItemOf,
  trackPlanDayStarted,
  trackPlanItemAdded,
  trackPlanItemRemoved,
  trackPlanOptimized,
  trackPlannerClosed,
  trackPlannerFitLever,
  trackPlannerOpened,
  trackSharedPlanOpened,
} from '../lib/analytics/planner-funnel.ts';
import {
  parkIdOf,
  rememberParkId,
  rememberPlanDayIds,
  rememberRideId,
  rideIdOf,
  showIdOf,
} from '../lib/planner/entity-ids.ts';

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const PARK = '0b6f0d1c-6a49-4c38-9a2e-3f1d2b7c8e01';
const RIDE = '1c7e2a3d-4b5f-4d6e-8f70-819a2b3c4d5e';
const SHOW = '2d8f3b4e-5c6a-4e7f-9a81-92ab3c4d5e6f';

/** What `send` was called with, as `[name, props, entity]`. */
function recorder() {
  const sent = [];
  const send = (name, props, entity) => sent.push([name, props, entity]);
  return { sent, send };
}

await test('a wizard opening counts each step once, however often it is shown', () => {
  const { sent, send } = recorder();
  const wizard = createPlannerWizardSession(send);
  wizard.step('park', null);
  wizard.step('date', 'europa-park');
  wizard.step('park', null);
  wizard.step('date', 'europa-park');
  wizard.step('setup', 'europa-park');
  assert.deepEqual(
    sent.map(([name, props]) => [name, props.step]),
    [
      ['planner_wizard_step', 'park'],
      ['planner_wizard_step', 'date'],
      ['planner_wizard_step', 'setup'],
    ]
  );
});

await test('a new opening counts its steps again, and the inline fit assistant once', () => {
  const { sent, send } = recorder();
  const first = createPlannerWizardSession(send);
  first.step('headliners', 'europa-park');
  first.fitShown('europa-park');
  first.fitShown('europa-park');
  const second = createPlannerWizardSession(send);
  second.step('headliners', 'europa-park');
  second.fitShown('europa-park');
  assert.deepEqual(
    sent.map(([name, props]) => [name, props.step ?? props.source]),
    [
      ['planner_wizard_step', 'headliners'],
      ['planner_fit_opened', 'wizard'],
      ['planner_wizard_step', 'headliners'],
      ['planner_fit_opened', 'wizard'],
    ]
  );
});

await test('the finish says whether it planned the headliners', () => {
  const { sent, send } = recorder();
  createPlannerWizardSession(send).finished(true, 'europa-park');
  assert.deepEqual(sent[0].slice(0, 2), ['planner_wizard_finished', { headliners: true }]);
});

await test('a stored block is a show, a ride or a block of its own, in that order', () => {
  assert.deepEqual(planItemOf({ showSlug: 'parade', attractionSlug: undefined }), {
    kind: 'show',
    slug: 'parade',
  });
  assert.deepEqual(planItemOf({ attractionSlug: 'blue-fire' }), {
    kind: 'ride',
    slug: 'blue-fire',
  });
  assert.deepEqual(planItemOf({}), { kind: 'block' });
});

await test('an id nobody named, or one that is not a UUID, sends no entity', () => {
  const { sent, send } = recorder();
  rememberRideId('phantasialand', 'taron', 'taron');
  trackPlanItemAdded('ride', 'search', 'phantasialand', 'taron', send);
  trackPlanItemAdded('ride', 'search', 'phantasialand', 'black-mamba', send);
  assert.deepEqual(
    sent.map(([, , entity]) => entity),
    [undefined, undefined]
  );
  assert.equal(rideIdOf('phantasialand', 'taron'), undefined);
});

await test('an item event names the ride or the show, never the park', () => {
  const { sent, send } = recorder();
  rememberParkId('europa-park', PARK);
  rememberRideId('europa-park', 'blue-fire', RIDE.toUpperCase());
  trackPlanItemAdded('ride', 'add_button', 'europa-park', 'blue-fire', send);
  trackPlanItemAdded('block', 'block_menu', 'europa-park', undefined, send);
  trackPlanItemRemoved('ride', 'keyboard', 'europa-park', 'blue-fire', send);
  assert.deepEqual(sent, [
    ['plan_item_added', { kind: 'ride', source: 'add_button' }, RIDE],
    ['plan_item_added', { kind: 'block', source: 'block_menu' }, undefined],
    ['plan_item_removed', { kind: 'ride', source: 'keyboard' }, RIDE],
  ]);
});

await test('a /plan/day answer teaches the park, its rides and its shows', () => {
  rememberPlanDayIds({
    parkSlug: 'efteling',
    parkId: PARK,
    rides: [{ attractionSlug: 'baron-1898', attractionId: RIDE }, { attractionSlug: 'python' }],
    shows: [{ showSlug: 'aquanura', showId: SHOW }],
  });
  assert.equal(parkIdOf('efteling'), PARK);
  assert.equal(rideIdOf('efteling', 'baron-1898'), RIDE);
  assert.equal(rideIdOf('efteling', 'python'), undefined);
  assert.equal(showIdOf('efteling', 'aquanura'), SHOW);
});

await test('a park event names the park, a lever its underscored kind', () => {
  const { sent, send } = recorder();
  trackPlanOptimized('headliners', 'efteling', send);
  trackPlannerFitLever('drop-all-blocks', send);
  trackSharedPlanOpened('missing', send);
  assert.deepEqual(sent, [
    ['plan_optimized', { mode: 'headliners' }, PARK],
    ['planner_fit_lever', { lever: 'drop_all_blocks' }, undefined],
    ['planner_shared_opened', { outcome: 'missing' }, undefined],
  ]);
});

await test('plan_day_started reaches the collector with the park as its entity', async () => {
  flushSiteAnalytics();
  browser();
  trackPlanDayStarted('efteling');
  trackPlanDayStarted('unknown-park');
  flushSiteAnalytics();
  const [named, unnamed] = await hits();
  assert.equal(named.name, 'plan_day_started');
  assert.equal(named.entity, PARK);
  assert.equal('entity' in unnamed, false);
});

await test('plan_day_started names the way into its opening, and none with the panel shut', async () => {
  flushSiteAnalytics();
  browser();
  trackPlannerClosed();
  trackPlanDayStarted('efteling');
  trackPlannerOpened('park-header');
  trackPlanDayStarted('efteling');
  trackPlannerClosed();
  flushSiteAnalytics();
  assert.deepEqual(
    (await hits()).map((hit) => [hit.name, hit.props]),
    [
      ['plan_day_started', { source: 'none' }],
      ['planner_opened', { source: 'park-header' }],
      ['plan_day_started', { source: 'park-header' }],
    ]
  );
});

console.log(`\n${passed} assertions passed.`);
