/**
 * Unit tests for what is counted where. Umami keeps pageviews and the two Web Vitals events, so
 * `lib/analytics/umami.ts` must not name any other non-search event; everything else goes to our
 * own counter, and the planner funnel (`lib/analytics/planner-funnel.ts`) keeps its edge and
 * once-per-opening semantics there: a closing is reported once per opening and only when no day
 * got its first block in it, and a day started while the panel is closed belongs to no opening.
 *
 * Run: pnpm test:umami-events
 */
import assert from 'node:assert/strict';
import { browser, hits } from './lib/fake-browser.mjs';
import { flushSiteAnalytics, trackSiteEvent } from '../lib/analytics/site-analytics.ts';
import {
  trackPlanDayStarted,
  trackPlannerClosed,
  trackPlannerOpened,
} from '../lib/analytics/planner-funnel.ts';
import * as umami from '../lib/analytics/umami.ts';
import { countNearbyResultOnce } from '../lib/hooks/use-nearby-analytics.ts';
import { askPushPermission } from '../lib/push/push-permission.ts';

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** The event names our own counter received from `run`, in order. */
async function counted(run, page = {}) {
  // What an earlier case left queued goes out first, to the browser that case set up.
  flushSiteAnalytics();
  browser(page);
  run();
  flushSiteAnalytics();
  return (await hits()).map((hit) => hit.name);
}

await test('Umami keeps no list of custom events', () => {
  assert.equal(umami.UMAMI_EVENTS, undefined);
});

await test('closing without a plan counts once per opening', async () => {
  assert.deepEqual(
    await counted(() => {
      trackPlannerOpened('tab');
      trackPlannerClosed();
      trackPlannerClosed();
    }),
    ['planner_opened', 'planner_closed_empty']
  );
});

await test('closing after a first block is silent', async () => {
  assert.deepEqual(
    await counted(() => {
      trackPlannerOpened('tab');
      trackPlanDayStarted();
      trackPlannerClosed();
    }),
    ['planner_opened', 'plan_day_started']
  );
});

await test('a day started while the panel is closed belongs to no opening', async () => {
  assert.deepEqual(
    await counted(() => {
      trackPlannerOpened('tab');
      trackPlannerClosed();
      trackPlanDayStarted();
      trackPlannerClosed();
    }),
    ['planner_opened', 'planner_closed_empty', 'plan_day_started']
  );
});

await test('planner_opened carries its source and nothing else', async () => {
  browser();
  trackPlannerOpened('home-hero');
  flushSiteAnalytics();
  const [hit] = await hits();
  assert.deepEqual(hit.props, { source: 'home-hero' });
  assert.equal('entity' in hit, false);
  trackPlannerClosed();
});

await test('the team testing (?sim=, ?state=) counts none of it', async () => {
  for (const search of ['?sim=in_park', '?sim=compass', '?state=rain', '?foo=1&sim=1']) {
    assert.deepEqual(
      await counted(
        () => {
          trackPlannerOpened('tab');
          trackPlannerClosed();
        },
        { search }
      ),
      [],
      search
    );
  }
});

await test('no custom event is sent through the Umami script', async () => {
  browser();
  const viaUmami = [];
  window.umami = { track: (name) => viaUmami.push(name) };
  trackPlannerOpened('tab');
  trackPlanDayStarted();
  trackPlannerClosed();
  trackSiteEvent('favorite_add', { type: 'park' });
  flushSiteAnalytics();
  assert.equal((await hits()).length, 3);
  assert.deepEqual(viaUmami, []);
});

await test('a nearby result is counted once per type and source in a tab, and names no park', async () => {
  browser();
  countNearbyResultOnce('in_park', 'gps');
  countNearbyResultOnce('in_park', 'gps');
  countNearbyResultOnce('nearby_parks', 'ip');
  countNearbyResultOnce('nearby_parks', 'ip');
  countNearbyResultOnce('nearby_parks', 'gps');
  flushSiteAnalytics();
  const sent = await hits();
  assert.deepEqual(
    sent.map((hit) => hit.props),
    [
      { type: 'in_park', source: 'gps' },
      { type: 'nearby_parks', source: 'ip' },
      { type: 'nearby_parks', source: 'gps' },
    ]
  );
  assert.equal(
    sent.some((hit) => 'entity' in hit),
    false
  );
});

await test('the push answer is counted only when the permission was undecided', async () => {
  const ask = async (before, answer) => {
    flushSiteAnalytics();
    browser();
    globalThis.Notification = { permission: before, requestPermission: async () => answer };
    const result = await askPushPermission();
    flushSiteAnalytics();
    return { result, counted: (await hits()).map((hit) => hit.props) };
  };
  assert.deepEqual(await ask('default', 'granted'), {
    result: 'granted',
    counted: [{ result: 'granted' }],
  });
  assert.deepEqual(await ask('default', 'denied'), {
    result: 'denied',
    counted: [{ result: 'denied' }],
  });
  assert.deepEqual(await ask('default', 'default'), {
    result: 'default',
    counted: [{ result: 'dismissed' }],
  });
  assert.deepEqual(await ask('granted', 'granted'), { result: 'granted', counted: [] });
  assert.deepEqual(await ask('denied', 'denied'), { result: 'denied', counted: [] });
  delete globalThis.Notification;
});

console.log(`\n${passed} cases passed.`);
process.exit(0);
