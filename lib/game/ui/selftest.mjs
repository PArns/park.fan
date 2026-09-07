/**
 * Unit tests for the half of this module a screenshot cannot show.
 *
 *   node --experimental-strip-types --import ./scripts/register-path-alias.mjs lib/game/ui/selftest.mjs
 *
 * A `.mjs` next to the code rather than a `scripts/test-game-*.mjs`, for the reason `camera`,
 * `paths`, `track`, `shops` and `rides` all give: these checks are about this module's internals
 * and a builder may not edit `package.json`. The request to wire it into `pnpm test:game` is
 * request 7 in `docs/game/requests/ui.md`.
 *
 * What is worth testing here is everything that is a number rather than a picture: the registry's
 * ordering rules, the formatters, and the telemetry collector — which is the part most likely to
 * be silently wrong, because it reads two typed-array buffers by index against a roster published
 * as a separate event, and a frame off by one would show every ride the state of its neighbour.
 * Everything imported is pure: no React, no Babylon, no DOM.
 */

import assert from 'node:assert/strict';
import { UiRegistry } from '@/lib/game/ui/api.ts';
import {
  clockTime,
  count,
  dayPart,
  decimal,
  logAge,
  minutesSince,
  money,
  moneyWhole,
  percent,
  queuePressure,
  ratingFraction,
} from '@/lib/game/ui/format.ts';
import { TelemetryCollector, localized } from '@/lib/game/ui/telemetry.ts';
import { MOTION_STRIDE, RideState } from '@/lib/game/rides/types.ts';
import { GuestState } from '@/lib/game/guests/types.ts';
import { Registry } from '@/lib/game/core/registry.ts';
import { createWorld } from '@/lib/game/core/world.ts';

let checks = 0;
const ok = (label, fn) => {
  fn();
  checks += 1;
  void label;
};

// ── The registry ──────────────────────────────────────────────────────────────────────────
ok('registry sorts by order, then by registration', () => {
  const registry = new UiRegistry();
  registry.register({ id: 'c', order: 10 });
  registry.register({ id: 'a', order: 10 });
  registry.register({ id: 'b', order: 5 });
  assert.deepEqual(
    registry.list().map((x) => x.id),
    ['b', 'c', 'a'],
    'ties fall back to the order things were registered, never to Map iteration of a re-register'
  );
});

ok('re-registering keeps the position', () => {
  const registry = new UiRegistry();
  registry.register({ id: 'a', order: 10 });
  registry.register({ id: 'b', order: 10 });
  registry.register({ id: 'a', order: 10, marker: 2 });
  assert.deepEqual(
    registry.list().map((x) => x.id),
    ['a', 'b'],
    'HMR replacing a panel must not move it to the end of the rail'
  );
  assert.equal(registry.get('a').marker, 2);
});

ok('unregister only removes the exact item it was handed back for', () => {
  const registry = new UiRegistry();
  const first = { id: 'a' };
  const off = registry.register(first);
  registry.register({ id: 'a', second: true });
  off();
  assert.equal(registry.get('a')?.second, true, 'a stale unregister must not delete the new one');
  assert.equal(registry.list().length, 1);
});

ok('rev bumps on register and on unregister', () => {
  const registry = new UiRegistry();
  const before = registry.rev();
  const off = registry.register({ id: 'a' });
  assert.ok(registry.rev() > before);
  const mid = registry.rev();
  off();
  assert.ok(registry.rev() > mid);
});

// ── Formatters ────────────────────────────────────────────────────────────────────────────
ok('clock time wraps and never rounds up', () => {
  assert.equal(clockTime(540), '09:00');
  assert.equal(clockTime(0), '00:00');
  assert.equal(clockTime(1439), '23:59');
  assert.equal(clockTime(1440), '00:00');
  assert.equal(clockTime(-30), '23:30');
  assert.equal(clockTime(599.99), '09:59', 'a fractional park minute is floored, not rounded');
});

ok('money drops the decimals only when there are none', () => {
  assert.equal(money(250, 'en').replace(/ /g, ' '), '€2.50');
  assert.equal(money(200, 'en').replace(/ /g, ' '), '€2');
  assert.equal(moneyWhole(250_000_00, 'en').replace(/ /g, ' '), '€250,000');
});

ok('counts and percentages', () => {
  assert.equal(count(1240, 'en'), '1,240');
  assert.equal(percent(0.634), '63 %');
  assert.equal(percent(1.4), '100 %', 'a ratio over one is a bug on screen, so it is clamped');
  assert.equal(percent(-1), '0 %');
  assert.equal(decimal(17.25, 'en', 1), '17.3');
});

ok('queue pressure is bounded and defined for a ride with no seats', () => {
  assert.equal(queuePressure(0, 10), 0);
  assert.equal(queuePressure(25, 10), 0.5);
  assert.equal(queuePressure(500, 10), 1);
  assert.equal(queuePressure(3, 0), 1, 'people waiting for a ride with no capacity pins the bar');
  assert.equal(queuePressure(0, 0), 0);
  assert.equal(ratingFraction(7.5), 0.75);
  assert.equal(ratingFraction(12), 1);
});

ok('day parts land on the right side of their boundaries', () => {
  assert.equal(dayPart(3 * 60), 'night');
  assert.equal(dayPart(5 * 60), 'dawn');
  assert.equal(dayPart(8 * 60), 'day');
  assert.equal(dayPart(19 * 60), 'dusk');
  assert.equal(dayPart(22 * 60), 'night');
});

ok('a log line ages across the day rollover', () => {
  assert.equal(minutesSince({ day: 1, minute: 1400 }, { day: 2, minute: 20 }), 60);
  assert.equal(logAge(0), '0 min');
  assert.equal(logAge(59), '59 min');
  assert.equal(logAge(60), '1 h 00');
  assert.equal(logAge(135), '2 h 15');
});

ok('a localized name falls back to en and then to whatever is there', () => {
  assert.equal(localized({ de: 'Karussell', en: 'Carousel' }, 'de'), 'Karussell');
  assert.equal(localized({ en: 'Carousel' }, 'fr'), 'Carousel');
  assert.equal(localized({ it: 'Giostra' }, 'fr'), 'Giostra');
  assert.equal(localized({}, 'en'), '');
});

// ── The telemetry collector ───────────────────────────────────────────────────────────────
/**
 * A frame the way the worker builds one: two typed arrays per ride in roster order plus the
 * scalar stats. The point of the test is the indexing — `rides.state[i]` and
 * `rides.motion[i * MOTION_STRIDE + n]` belong to `roster[i]`, and the roster arrives as its own
 * event.
 */
function frameFor(rides, guests, stats = {}) {
  const state = new Uint8Array(rides.length);
  const motion = new Float32Array(rides.length * MOTION_STRIDE);
  rides.forEach((ride, i) => {
    state[i] = ride.state;
    motion[i * MOTION_STRIDE + 0] = 0;
    motion[i * MOTION_STRIDE + 1] = 0;
    motion[i * MOTION_STRIDE + 2] = ride.riders;
    motion[i * MOTION_STRIDE + 3] = ride.queue;
  });
  const anim = new Uint8Array(guests);
  return {
    tick: 1,
    clock: { day: 2, minute: 613, speed: 3 },
    ack: 0,
    tickMs: 1.2,
    buffers: {
      'rides.state': state.buffer,
      'rides.motion': motion.buffer,
      'guests.anim': anim.buffer,
    },
    stats: { 'guests.count': 3, 'finance.cash': 12345, ...stats },
  };
}

function collector() {
  const world = createWorld({ seed: 1, packs: [] });
  const registry = new Registry();
  const profiles = {
    r1: { name: { en: 'Carousel' }, capacity: 24, cycleMinutes: 2, excitement: 3, fear: 1, nausea: 1, minHeightCm: null, price: 0, upkeep: 500 },
    r2: { name: { en: 'Top Spin' }, capacity: 12, cycleMinutes: 3, excitement: 8, fear: 7, nausea: 6, minHeightCm: 140, price: 200, upkeep: 900 },
  };
  return new TelemetryCollector({
    world,
    registry,
    locale: 'en',
    rideProfile: (id) => profiles[id],
  });
}

ok('ride rows line the buffers up with the roster', () => {
  const c = collector();
  c.onRoster([
    { id: 'r1', key: 'core-classic:carousel' },
    { id: 'r2', key: 'core-classic:top-spin' },
  ]);
  c.onFrame(
    frameFor(
      [
        { state: RideState.RUNNING, riders: 18, queue: 42 },
        { state: RideState.BROKEN, riders: 0, queue: 7 },
      ],
      []
    )
  );
  const s = c.snapshot();
  assert.equal(s.rides.length, 2);
  assert.equal(s.rides[0].name, 'Carousel');
  assert.equal(s.rides[0].state, 'running');
  assert.equal(s.rides[0].riders, 18);
  assert.equal(s.rides[0].queue, 42);
  assert.equal(s.rides[1].state, 'broken');
  assert.equal(s.rides[1].queue, 7);
  assert.equal(s.rides[1].minHeightCm, 140);
});

ok('rated throughput is seats over the cycle, and zero when the cycle is unknown', () => {
  const c = collector();
  c.onRoster([{ id: 'r1', key: 'k' }, { id: 'unknown', key: 'k' }]);
  c.onFrame(
    frameFor(
      [
        { state: RideState.RUNNING, riders: 0, queue: 0 },
        { state: RideState.CLOSED, riders: 0, queue: 0 },
      ],
      []
    )
  );
  const s = c.snapshot();
  assert.equal(s.rides[0].ratedThroughput, 720, '24 seats / 2 min * 60');
  assert.equal(s.rides[1].ratedThroughput, 0, 'a ride with no profile gets no invented figure');
  assert.equal(s.rides[1].name, 'unknown', 'and falls back to its id rather than to an empty cell');
});

ok('the open/down counts come from the states the reader is looking at', () => {
  const c = collector();
  c.onRoster([{ id: 'r1', key: 'k' }, { id: 'r2', key: 'k' }]);
  c.onFrame(
    frameFor(
      [
        { state: RideState.LOADING, riders: 2, queue: 5 },
        { state: RideState.MAINTENANCE, riders: 0, queue: 0 },
      ],
      [],
      { 'rides.open': 99 }
    )
  );
  const s = c.snapshot();
  assert.equal(s.totals.ridesOpen, 1, 'not the frame scalar, which would disagree with the list');
  assert.equal(s.totals.ridesDown, 1);
  assert.equal(s.totals.queued, 5);
  assert.equal(s.totals.riding, 2);
});

ok('the crowd histogram skips free slots', () => {
  const c = collector();
  c.onFrame(
    frameFor(
      [],
      [
        GuestState.GONE,
        GuestState.WALKING,
        GuestState.WALKING,
        GuestState.QUEUING,
        GuestState.GONE,
        GuestState.RIDING,
      ]
    )
  );
  const s = c.snapshot();
  const total = s.crowd.reduce((sum, row) => sum + row.count, 0);
  assert.equal(total, 4, 'the store never compacts, so state 0 is an empty slot and not a person');
  assert.equal(s.crowd[0].state, 'walking');
  assert.equal(s.crowd[0].count, 2);
});

ok('happiness is -1 rather than 0 when the park is empty', () => {
  const c = collector();
  c.onFrame(frameFor([], [], { 'guests.count': 0, 'guests.happiness': 0 }));
  assert.equal(c.snapshot().totals.happiness, -1, 'nobody in the park is not a mood of zero');
  const c2 = collector();
  c2.onFrame(frameFor([], [], { 'guests.count': 5, 'guests.happiness': 71.5 }));
  assert.equal(c2.snapshot().totals.happiness, 71.5);
});

ok('shop takings accumulate and reset on the day rollover', () => {
  const c = collector();
  c.onSale('s1', 250);
  c.onSale('s1', 250);
  c.onSale('s2', 400);
  const before = c.snapshot();
  assert.equal(before.shops.length, 0, 'no shop entities in this world, so no rows');
  c.onDayRollover();
  c.onSale('s1', 100);
  assert.equal(c.snapshot().rev > before.rev, true);
});

ok('the notice history takes each notice once and drops a repeat inside one minute', () => {
  const c = collector();
  c.onFrame(frameFor([], []));
  c.ingestNotices([
    { id: 1, level: 'info', text: 'a' },
    { id: 2, level: 'warning', text: 'b' },
  ]);
  c.ingestNotices([
    { id: 1, level: 'info', text: 'a' },
    { id: 2, level: 'warning', text: 'b' },
    { id: 3, level: 'error', text: 'c' },
  ]);
  const s = c.snapshot();
  assert.equal(s.log.length, 3, 'the same notice arriving twice is one line');
  assert.equal(s.log[0].text, 'c', 'newest first');
  c.addLog('ride', 'c');
  assert.equal(c.snapshot().log.length, 3, 'and the same text inside one park minute is one line');
});

ok('a load clears everything counted on this side', () => {
  const c = collector();
  c.onFrame(frameFor([], []));
  c.onRoster([{ id: 'r1', key: 'k' }]);
  c.onSale('s1', 500);
  c.onThought(1, 'I want a drink', -2);
  c.addLog('info', 'something');
  c.setShut('r1', true);
  assert.equal(c.isShut('r1'), true);
  c.reset();
  const s = c.snapshot();
  assert.equal(s.rides.length, 0);
  assert.equal(s.thoughts.length, 0);
  assert.equal(s.log.length, 0);
  assert.equal(c.isShut('r1'), false);
});

ok('thoughts are newest first and bounded', () => {
  const c = collector();
  c.onFrame(frameFor([], []));
  for (let i = 0; i < 40; i++) c.onThought(i, `thought ${i}`, i % 2 ? 1 : -1);
  const s = c.snapshot();
  assert.equal(s.thoughts[0].text, 'thought 39');
  assert.ok(s.thoughts.length <= 24, 'the feed is a window, not a transcript');
});

ok('with no frame at all the snapshot is inert rather than wrong', () => {
  const s = collector().snapshot();
  assert.equal(s.live, false);
  assert.equal(s.rides.length, 0);
  assert.equal(s.totals.guests, 0);
  assert.equal(s.totals.happiness, -1);
});

console.log(`✓ game ui: ${checks} checks`);
