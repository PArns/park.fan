/**
 * Parky, the chat assistant: the stream reader (`lib/assistant/sse.ts`), the link check on its
 * answers (`lib/assistant/links.ts`), the rollout gate (`lib/assistant/config.ts`), the post
 * text it reads (`lib/assistant/post-text.ts`), how bored its face gets
 * (`lib/assistant/parky-boredom.ts`), how a chat opens (`lib/assistant/opener.ts`) and Parky's easter
 * eggs (`lib/assistant/easter-eggs.ts`, muting in `teaser-store.ts`) and its rides
 * (`lib/assistant/parky-rides.ts`).
 */

import assert from 'node:assert/strict';
import { readSse } from '@/lib/assistant/sse.ts';
import { directionsHref, safeAssistantHref } from '@/lib/assistant/links.ts';
import { assistantVisible } from '@/lib/assistant/config.ts';
import { postPlainText, POST_TEXT_LIMIT } from '@/lib/assistant/post-text.ts';
import { localizedPath, readAssistantAction } from '@/lib/assistant/actions.ts';
import { splitWaits } from '@/lib/assistant/wait-chips.ts';
import {
  ASLEEP_AFTER_MS,
  BORED_AFTER_MS,
  boredomAfter,
  nextBoredomInMs,
  parkyBoredom,
} from '@/lib/assistant/parky-boredom.ts';
import {
  drawOpener,
  GREETING_KEYS,
  sessionOpener,
  SUGGESTION_KEYS,
  SUGGESTIONS_SHOWN,
} from '@/lib/assistant/opener.ts';
import { pickRandom, pickSome } from '@/lib/utils/pick-random.ts';
import {
  holidayOn,
  KONAMI_LENGTH,
  konamiProgress,
  PARK_FAVOURITES,
  parkNameIn,
  parkPageOf,
  parkPathOf,
  topCoaster,
} from '@/lib/assistant/easter-eggs.ts';
import { linesMuted, muteLines } from '@/lib/assistant/teaser-store.ts';
import { isRide, REST, RIDE_MOTION, rideKeyframe } from '@/lib/assistant/parky-rides.ts';

let passed = 0;
function check(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  passed++;
}

// A stream that splits events, and even a UTF-8 character, across chunks.
const text =
  'event: start\ndata: {"a":1}\n\nevent: delta\ndata: {"t":"Grüße"}\n\nevent: done\ndata: {}\n\n';
const bytes = new TextEncoder().encode(text);
const cut = bytes.indexOf(0xc3) + 1;
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(bytes.slice(0, 5));
    controller.enqueue(bytes.slice(5, cut));
    controller.enqueue(bytes.slice(cut));
    controller.close();
  },
});
const events = [];
for await (const event of readSse(stream)) events.push(event);
check(
  events,
  [
    { event: 'start', data: '{"a":1}' },
    { event: 'delta', data: '{"t":"Grüße"}' },
    { event: 'done', data: '{}' },
  ],
  'reads events split across chunks'
);

check(safeAssistantHref('/de/parks/europe'), '/de/parks/europe', 'keeps a site path');
check(
  safeAssistantHref('https://park.fan/de/blog/x?y=1#z'),
  '/de/blog/x?y=1#z',
  'turns a park.fan URL into a path'
);
check(safeAssistantHref('https://www.park.fan/en'), '/en', 'accepts www');
check(safeAssistantHref('javascript:alert(1)'), null, 'refuses javascript:');
check(safeAssistantHref('//evil.example/x'), null, 'refuses protocol-relative');
check(
  safeAssistantHref('/\\evil.example/x'),
  null,
  'refuses a backslash path that leaves the site'
);
check(safeAssistantHref('https://park.fan.evil.example/'), null, 'refuses a look-alike host');
check(safeAssistantHref('http://park.fan/'), null, 'refuses plain http');
check(safeAssistantHref(undefined), null, 'no href, no link');
check(
  directionsHref('https://www.google.com/maps/dir/?api=1&destination=50.8,6.88'),
  'https://www.google.com/maps/dir/?api=1&destination=50.8,6.88',
  'directions to coordinates'
);
check(
  directionsHref('https://www.google.com/maps/dir/?api=1&destination=evil'),
  null,
  'directions only to coordinates'
);
check(
  directionsHref('https://evil.example/maps/dir/?api=1&destination=1,2'),
  null,
  'directions only on google.com'
);

const on = { enabled: true, rolloutPercent: 25 };
check(assistantVisible({ config: on, bucket: 24, forced: false }), true, 'inside the share');
check(assistantVisible({ config: on, bucket: 25, forced: false }), false, 'outside the share');
check(
  assistantVisible({ config: { enabled: false, rolloutPercent: 100 }, bucket: 0, forced: false }),
  false,
  'off beats the share'
);
check(
  assistantVisible({ config: { enabled: false, rolloutPercent: 0 }, bucket: 99, forced: true }),
  true,
  '?assistant=on forces it'
);

const plain = postPlainText(
  '## Heading\n\nSee [the park](/de/parks/x) and ![a photo](/a.jpg).\n\n```js\ncode()\n```\n\n<div>html</div>**bold**'
);
check(
  plain,
  { text: 'Heading\n\nSee the park and .\n\nhtmlbold', shortened: false },
  'strips Markdown'
);
const long = postPlainText(`${'a'.repeat(6000)}\n\n${'b'.repeat(6000)}`);
check(long.shortened, true, 'marks a cut text');
check(long.text.length <= POST_TEXT_LIMIT, true, 'cuts at the limit');

const park = {
  slug: 'phantasialand',
  name: 'Phantasialand',
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
  timezone: 'Europe/Berlin',
};
check(
  readAssistantAction({ type: 'navigate', path: '/de/blog/x' })?.type,
  'navigate',
  'navigates on site'
);
check(
  readAssistantAction({ type: 'navigate', path: 'https://evil.example/' }),
  null,
  'never off site'
);
check(readAssistantAction({ type: 'drop_database' }), null, 'unknown actions are dropped');
check(
  readAssistantAction({
    type: 'planner_add_rides',
    park,
    date: '2026-11-02',
    rides: [{ slug: 'taron', name: 'Taron' }],
  })?.type,
  'planner_add_rides',
  'adds rides to a plan'
);
check(
  readAssistantAction({
    type: 'planner_add_rides',
    park: { ...park, slug: '../x' },
    date: '2026-11-02',
    rides: [],
  }),
  null,
  'refuses a park slug that is no slug'
);
check(
  readAssistantAction({
    type: 'planner_add_block',
    park,
    date: '2026-11-02',
    block: { label: 'Essen', icon: 'rocket', durationMinutes: 60 },
  }),
  null,
  'refuses a block icon the planner does not have'
);
check(
  readAssistantAction({
    type: 'card',
    card: {
      kind: 'ride',
      name: 'Taron',
      park: null,
      status: 'WEIRD',
      crowdLevel: null,
      waitMinutes: 45,
      url: 'https://evil.example',
    },
  }),
  null,
  'refuses a card linking off site'
);
check(
  readAssistantAction({
    type: 'card',
    card: {
      kind: 'parks',
      parks: [
        {
          name: 'Efteling',
          place: 'Kaatsheuvel',
          url: '/parks/europe/netherlands/kaatsheuvel/efteling',
        },
      ],
    },
  })?.type,
  'card',
  'takes a list of parks'
);
check(
  readAssistantAction({
    type: 'card',
    card: { kind: 'parks', parks: [{ name: 'X', place: null, url: 'https://evil.example' }] },
  }),
  null,
  'refuses a park row linking off site'
);
check(localizedPath('/parks/europe', 'de'), '/de/parks/europe', 'adds the locale');
check(localizedPath('/en/blog/x', 'de'), '/en/blog/x', 'keeps a locale already there');

check(
  splitWaits('Taron: 30 Min. und F.L.Y. 40 min'),
  [{ text: 'Taron: ' }, { minutes: 30 }, { text: ' und F.L.Y. ' }, { minutes: 40 }],
  'waits become chips'
);
check(
  splitWaits('wait 25 minutes now'),
  [{ text: 'wait ' }, { minutes: 25 }, { text: ' now' }],
  'english'
);
check(splitWaits('20 minuti'), [{ minutes: 20 }], 'italian');
check(splitWaits('Minimum 120 cm'), [{ text: 'Minimum 120 cm' }], 'other numbers stay text');
check(splitWaits('10 Minutenkarten'), [{ text: '10 Minutenkarten' }], 'only whole words');
check(boredomAfter(0), 'awake', 'awake with company');
check(boredomAfter(BORED_AFTER_MS), 'bored', 'bored after a quiet spell');
check(boredomAfter(ASLEEP_AFTER_MS), 'asleep', 'asleep after a long one');
check(nextBoredomInMs(1_000), BORED_AFTER_MS - 1_000, 'counts down to boredom');
check(nextBoredomInMs(BORED_AFTER_MS), ASLEEP_AFTER_MS - BORED_AFTER_MS, 'then to sleep');
check(nextBoredomInMs(ASLEEP_AFTER_MS), null, 'only activity ends sleep');

// The store on a fake clock: one timer for the next stage, activity resets the quiet time.
{
  const realTimeout = globalThis.setTimeout;
  const realClear = globalThis.clearTimeout;
  const realNow = performance.now;
  let now = 0;
  const timers = [];
  globalThis.setTimeout = (fn, ms) => timers.push({ at: now + ms, fn });
  globalThis.clearTimeout = (id) => {
    if (id) timers[id - 1].fn = null;
  };
  performance.now = () => now;
  globalThis.window = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false }) });
  const advance = (ms) => {
    now += ms;
    for (const timer of timers) {
      if (timer.fn && timer.at <= now) {
        const fn = timer.fn;
        timer.fn = null;
        fn();
      }
    }
  };
  let notified = 0;
  const unsubscribe = parkyBoredom.subscribe(() => notified++);
  check(parkyBoredom.getSnapshot(), 'awake', 'starts awake');
  advance(BORED_AFTER_MS - 1_000);
  window.dispatchEvent(new Event('pointermove'));
  advance(1_000);
  check(parkyBoredom.getSnapshot(), 'awake', 'a move pushes boredom back');
  advance(BORED_AFTER_MS);
  check(parkyBoredom.getSnapshot(), 'bored', 'bored once quiet long enough');
  advance(ASLEEP_AFTER_MS - BORED_AFTER_MS);
  check(parkyBoredom.getSnapshot(), 'asleep', 'then asleep');
  const armed = timers.filter((timer) => timer.fn).length;
  check(armed, 0, 'no timer while asleep');
  check(parkyBoredom.wokeUp(), false, 'falling asleep is no waking');
  window.dispatchEvent(new Event('keydown'));
  check(parkyBoredom.getSnapshot(), 'awake', 'a key wakes it');
  check(parkyBoredom.wokeUp(), true, 'and says so');
  check(notified, 3, 'one notice per change');
  unsubscribe();
  check(
    timers.filter((timer) => timer.fn).length,
    0,
    'the last subscriber leaving stops the timer'
  );
  globalThis.setTimeout = realTimeout;
  globalThis.clearTimeout = realClear;
  performance.now = realNow;
  delete globalThis.window;
}
for (let i = 0; i < 50; i++) {
  if (pickRandom(['a', 'b'], 'a') !== 'b') throw new Error('pickRandom returned the excluded item');
}
check(pickRandom(['a'], 'a'), 'a', 'a list of one has nothing else to give');
check(pickSome([1, 2, 3, 4], 4).sort(), [1, 2, 3, 4], 'picks each item once');
check(pickSome([1, 2], 5).length, 2, 'never more than there are');

// The opener on a stand-in sessionStorage: kept across a reload, a new chat draws again.
{
  const store = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  };
  const first = sessionOpener();
  check(GREETING_KEYS.includes(first.greeting), true, 'draws one of the greetings');
  check(first.site.length, SUGGESTIONS_SHOWN, 'offers a few questions');
  check(new Set(first.park).size, SUGGESTIONS_SHOWN, 'never the same question twice');
  check(
    first.park.every((key) => SUGGESTION_KEYS.park.includes(key)),
    true,
    'a park page asks about that park'
  );
  check(sessionOpener(), first, 'a reload keeps the opener');
  const next = drawOpener(first);
  check(next.greeting !== first.greeting, true, 'a new chat greets differently');
  check(sessionOpener(), next, 'and keeps that');
  store.set(
    'parkfan:assistant-opener',
    JSON.stringify({ greeting: 'greeting', site: [], park: [] })
  );
  check(GREETING_KEYS.includes(sessionOpener().greeting), true, 'a stale opener draws afresh');
  delete globalThis.window;
}
check(
  parkPathOf('/de/parks/europe/germany/bruehl/phantasialand'),
  'europe/germany/bruehl/phantasialand',
  "a park's page has its geo path"
);
check(
  parkPathOf('/en/parks/europe/germany/bruehl/phantasialand/taron'),
  'europe/germany/bruehl/phantasialand',
  "a ride's page belongs to its park"
);
check(parkPathOf('/de/parks/europe/germany'), null, 'a country is no park');
check(
  PARK_FAVOURITES['europe/germany/bruehl/phantasialand'].ride,
  'Taron',
  'Parky wants to ride Taron'
);
check(
  parkPageOf('/de/parks/europe/germany/soltau/heide-park'),
  { continent: 'europe', country: 'germany', city: 'soltau', parkSlug: 'heide-park' },
  "a park's own page"
);
check(parkPageOf('/de/parks/europe/germany/soltau/heide-park/colossos'), null, 'not a ride page');
check(
  topCoaster([
    { attractionName: 'Meet Mickey', attractionType: 'Meet & Greet' },
    { attractionName: 'Big Thunder Mountain', attractionType: 'Roller Coaster' },
  ]),
  'Big Thunder Mountain',
  'the coaster with the longest waits, not the top attraction'
);
check(topCoaster([{ attractionName: 'Piraten', attractionType: null }]), 'Piraten', 'else the top');
check(topCoaster([]), null, 'no ranking, no ride');
check(
  parkNameIn([
    { textContent: 'not json' },
    {
      textContent: JSON.stringify({
        '@graph': [{ '@type': 'WebPage' }, { '@type': 'AmusementPark', name: 'Heide Park' }],
      }),
    },
  ]),
  'Heide Park',
  "the park's name from the page's structured data"
);
check(holidayOn(new Date(2026, 9, 31)), 'halloween', 'Halloween');
check(holidayOn(new Date(2026, 11, 25)), 'christmas', 'Christmas');
check(holidayOn(new Date(2027, 0, 1)), 'newyear', 'New Year');
check(holidayOn(new Date(2026, 9, 30)), null, 'an ordinary day');
{
  const keys = ['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown'];
  keys.push('ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'a');
  const reached = keys.reduce((progress, key) => konamiProgress(progress, key), 0);
  check(reached, KONAMI_LENGTH, 'the Konami code, with a third ↑ and a capital B');
  check(konamiProgress(5, 'x'), 0, 'a wrong key starts over');
}

// Muting on a stand-in sessionStorage: a line closed by hand silences the rest of the session.
{
  const store = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  };
  check(linesMuted(), false, 'not muted at first');
  muteLines();
  check(linesMuted(), true, 'a line closed by hand mutes the rest');
  delete globalThis.window;
}
for (const [name, motion] of Object.entries(RIDE_MOTION)) {
  const { stops } = motion;
  const at = stops.map((stop) => stop.at);
  check(
    at.every((value, i) => i === 0 || value >= at[i - 1]),
    true,
    `${name}: its moments run forward`
  );
  check([at[0], at[at.length - 1]], [0, 1], `${name}: from start to end`);
  const rest = (stop) => [stop.x, stop.y, stop.angle];
  check(rest(stops[0]), [REST.x, REST.y, 0], `${name}: starts at rest`);
  check(rest(stops[stops.length - 1]), [REST.x, REST.y, 0], `${name}: ends at rest`);
  check(motion.track.startsWith('M'), true, `${name}: has rails`);
}
check(
  Math.max(...RIDE_MOTION.launch.stops.map((stop) => stop.angle)),
  90,
  'the launch stands upright in its spike'
);
check(
  RIDE_MOTION.hills.stops.some((stop) => stop.opacity === 0),
  true,
  'the hills ride leaves the picture and comes back'
);
check(
  rideKeyframe({ x: 20, y: 40, angle: 45, at: 0.5 }).transform,
  'translate(-4px, -9px) rotate(45deg) scale(1, 1)',
  'a stop as a keyframe, turned about the wheels'
);
check([isRide('tower'), isRide('egg'), isRide(null)], [true, false, false], 'a ride by name');
console.log(`assistant: ${passed} checks passed`);
