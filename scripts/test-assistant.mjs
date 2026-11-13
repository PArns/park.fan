/**
 * Parky, the chat assistant: the stream reader (`lib/assistant/sse.ts`), the link check on its
 * answers (`lib/assistant/links.ts`), the action checks (`lib/assistant/actions.ts`), where a
 * language switch leads (`lib/assistant/switch-locale.ts`, `open.ts`), the rollout gate
 * (`lib/assistant/config.ts`), the post
 * text it reads (`lib/assistant/post-text.ts`), how bored its face gets
 * (`lib/assistant/parky/boredom.ts`), how a chat opens (`lib/assistant/opener.ts`) and Parky's easter
 * eggs (`lib/assistant/parky/easter-eggs.ts`, muting in `teaser-store.ts`), its rides
 * (`lib/assistant/parky/rides.ts`) and how it answers what the visitor does
 * (`lib/assistant/parky/reactions.ts`, heard through `onSiteEvent`), its facts and which line fills a slot
 * (`lib/assistant/parky/facts.ts`, `lines.ts`), when a hard scroll throws it
 * (`lib/assistant/fling-tracker.ts`), the calendar, tiles and shows cards (`lib/assistant/cards.ts`)
 * and the posts and glossary cards' checks.
 */

import assert from 'node:assert/strict';
import { readSse } from '@/lib/assistant/sse.ts';
import { directionsHref, safeAssistantHref } from '@/lib/assistant/links.ts';
import { assistantVisible } from '@/lib/assistant/config.ts';
import {
  postPlainText,
  postSections,
  postTextForQuery,
  POST_TEXT_LIMIT,
} from '@/lib/assistant/post-text.ts';
import { readAssistantAction } from '@/lib/assistant/actions.ts';
import { localeSwitchPath } from '@/lib/assistant/switch-locale.ts';
import { reopenAfterSwitch, takeReopen } from '@/lib/assistant/open.ts';
import { localizedPath } from '@/lib/i18n/localized-path.ts';
import { splitWaits } from '@/lib/assistant/wait-chips.ts';
import {
  ASLEEP_AFTER_MS,
  BORED_AFTER_MS,
  LATE_SLEEPY_FACTOR,
  boredomAfter,
  nextBoredomInMs,
  parkyBoredom,
} from '@/lib/assistant/parky/boredom.ts';
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
} from '@/lib/assistant/parky/easter-eggs.ts';
import { FACT_KEYS, parkyFacts } from '@/lib/assistant/parky/facts.ts';
import { lineSources, parkNewsKey } from '@/lib/assistant/parky/lines.ts';
import {
  headlinersOf,
  LIVE_ACT_GAP_MS,
  LIVE_LINES,
  liveActDue,
  liveChange,
  liveMoment,
  SHOW_RUN_MIN,
  SHOW_SOON_MIN,
  showRunning,
  showSoon,
} from '@/lib/assistant/parky/live.ts';
import {
  CLOCK_PARK_KEYS,
  opensToday,
  clockMoment,
  openingDaysOf,
} from '@/lib/assistant/parky/clock.ts';
import {
  answeredWithLine,
  countAnswer,
  linesMuted,
  muteLines,
} from '@/lib/assistant/teaser-store.ts';
import { isReactionAct, REACTION_ACTS, reactionTo } from '@/lib/assistant/parky/reactions.ts';
import { onSiteEvent, trackSiteEvent } from '@/lib/analytics/site-analytics.ts';
import { readFileSync } from 'node:fs';
import {
  isRide,
  REST,
  RIDE_MOTION,
  RIDES,
  rideFits,
  rideKeyframe,
} from '@/lib/assistant/parky/rides.ts';
import { FLING_HAND_MS, FlingTracker } from '@/lib/assistant/fling-tracker.ts';
import {
  calendarWeeks,
  parkClock,
  parkHours,
  presentTiles,
  showTimes,
} from '@/lib/assistant/cards.ts';
import { parkChapterUrl } from '@/lib/utils/url-utils.ts';

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
  safeAssistantHref('https://park.fan//evil.example/x'),
  null,
  'refuses a site URL whose path starts with two slashes'
);
check(safeAssistantHref('/.//evil.example'), null, 'refuses a dot path that collapses to //');
check(safeAssistantHref('https://park.fan/\\evil.example'), null, 'refuses a backslash path');
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
  assistantVisible({ config: on, bucket: 80, forced: false, invited: true }),
  true,
  "invited by Parky's page, outside the share"
);
check(
  assistantVisible({
    config: { enabled: false, rolloutPercent: 100 },
    bucket: 0,
    forced: false,
    invited: true,
  }),
  false,
  'an invitation does not switch a stopped Parky on'
);
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

const guide = [
  'Intro about the park.',
  '## Getting there',
  'Take the [train](/x) from Cologne.',
  '```md\n## not a heading\n```',
  '### Parking',
  'Parking costs **ten** euros.',
  '## Food',
  `${'Restaurants serve schnitzel. '.repeat(150)}`,
  '## Best days to visit',
  `Tuesdays are quiet. ${'Crowds vary. '.repeat(300)}`,
].join('\n\n');
check(
  postSections(guide).sections.map((section) => section.heading),
  ['Getting there', 'Parking', 'Food', 'Best days to visit'],
  'splits at H2 and H3, not inside code'
);
check(postSections(guide).intro, 'Intro about the park.', 'keeps the intro apart');
check(
  postSections(guide).sections[0].body,
  'Take the train from Cologne.',
  'plain-texts each section'
);
const parking = postTextForQuery(guide, 'what does parking cost?');
check(parking.text.startsWith('Intro about the park.\n\nGetting there'), true, 'intro first');
check(parking.text.includes('Parking costs ten euros.'), true, 'keeps the matching section');
check(parking.omitted, [], 'leaves nothing out of a short post');
const big = [
  'Intro.',
  ...['Arrival', 'Food', 'Hotels', 'Rides', 'Shows', 'Tickets'].map(
    (heading) => `## ${heading}\n\n${`${heading} text here. `.repeat(100)}`
  ),
  '## Quiet days',
  'Tuesdays in May are the quietest.',
].join('\n\n');
const quiet = postTextForQuery(big, 'Which days are quiet?');
check(
  quiet.text.includes('Tuesdays in May are the quietest.'),
  true,
  'reaches the end of a long post'
);
check(quiet.text.length <= POST_TEXT_LIMIT, true, 'stays within the limit');
check(quiet.omitted.length > 0 && quiet.shortened, true, 'names what it left out');
check(quiet.sections.length, 7, 'lists every heading');
check(
  quiet.text.indexOf('Arrival') < quiet.text.indexOf('Quiet days'),
  true,
  "keeps the post's order"
);
check(
  postTextForQuery(big, 'hotels').omitted.includes('Hotels'),
  false,
  'a heading hit wins its section a place'
);
const filler = (heading) => `## ${heading}\n\n${`${heading} Text hier. `.repeat(150)}`;
const leer = postTextForQuery(
  [
    'Einleitung.',
    filler('Anreise'),
    filler('Essen'),
    '## Wann der Europa-Park am leersten ist',
    'Es hängt vom Kalender ab.',
    '### Der Wochentag',
    'Dienstag und Mittwoch sind ruhig.',
    '### Der Monat',
    'Im Mai ist wenig los.',
    '### Welche Ferien den Park füllen',
    'Sommerferien. '.repeat(250),
    '### Der Brückentag',
    'Freitag. '.repeat(450),
    filler('Hotels'),
    filler('Shows'),
    '## Häufige Fragen',
    '### Wann ist im Europa-Park am wenigsten los?',
    `Unter der Woche im Mai. ${'Mehr dazu oben. '.repeat(100)}`,
  ].join('\n\n'),
  'Wann ist Europa-Park am leersten?'
);
check(
  leer.omitted.includes('Wann ist im Europa-Park am wenigsten los?'),
  false,
  'a matching FAQ entry beats the H3s of a winning H2 that do not match'
);
check(leer.omitted.includes('Der Brückentag'), true, 'those H3s fill only the room left');
check(
  ['Der Wochentag', 'Der Monat'].filter((heading) => leer.omitted.includes(heading)),
  [],
  'a winning H2 brings its H3s'
);
check(
  leer.text.indexOf('Wann der') < leer.text.indexOf('Dienstag') &&
    leer.text.indexOf('Dienstag') < leer.text.indexOf('Im Mai'),
  true,
  'keeps the H3s in order under their H2'
);
const h3Alone = postTextForQuery(
  [
    'Intro.',
    filler('Arrival'),
    '## Tickets',
    `${'Prices change every season. '.repeat(320)}`,
    '### VIP tour',
    `The VIP tour skips every queue. ${'It starts at the gate. '.repeat(400)}`,
    filler('Food'),
    filler('Hotels'),
  ].join('\n\n'),
  'Can I book VIP?'
);
// Only the best section is cut to fit, so the long H3 is in only when "VIP" counted.
check(
  h3Alone.text.includes('The VIP tour skips every queue.'),
  true,
  'keeps a short word written in capitals'
);
check(h3Alone.text.includes('Tickets\n\nVIP tour'), true, 'a winning H3 keeps its H2 heading line');
check(h3Alone.omitted.includes('Tickets'), true, 'names the H2 whose text it left out');

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
check(
  readAssistantAction({
    type: 'navigate',
    path: '/orlando?from=2027-03-03&to=2027-03-10&parks=epcot:1#planner',
  }),
  { type: 'navigate', path: '/orlando?from=2027-03-03&to=2027-03-10&parks=epcot:1#planner' },
  'the Orlando hub keeps its plan and the planner anchor'
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
check(
  readAssistantAction({ type: 'navigate', path: 'https://park.fan/de/blog/x', extra: 1 }),
  { type: 'navigate', path: '/de/blog/x' },
  'a page is carried out as the path it was checked as'
);
check(
  readAssistantAction({
    type: 'card',
    card: {
      kind: 'ride',
      name: 'Taron',
      park: null,
      status: 'OPERATING',
      crowdLevel: null,
      waitMinutes: 15,
      url: 'https://www.park.fan/de/parks/europe/germany/bruehl/phantasialand/taron',
    },
  })?.card.url,
  '/de/parks/europe/germany/bruehl/phantasialand/taron',
  'a card links the path it was checked as'
);
{
  const post = {
    title: 'Im Phantasialand lohnt der Quick Pass nur an vollen Tagen',
    url: '/de/blog/phantasialand-tipps',
    date: '2026-10-14',
    updated: true,
    news: false,
    readingTimeMinutes: 14,
    excerpt: 'Den Quick Pass brauchst du nur an vollen Tagen.',
    category: 'Parkguides',
    image: '/media/blog/phantasialand-tipps/cover.webp?v=3',
    imagePosition: '50% 40%',
  };
  const read = (card) => readAssistantAction({ type: 'card', card: structuredClone(card) })?.card;
  check(read({ kind: 'posts', posts: [post] })?.posts[0], post, 'takes a posts card as sent');
  check(
    read({ kind: 'posts', posts: [{ ...post, image: 'https://evil.example/x.jpg' }] })?.posts[0],
    { ...post, image: null, imagePosition: null },
    'a cover from another host is dropped, not the post'
  );
  check(
    read({ kind: 'posts', posts: [{ ...post, url: 'https://evil.example/blog/x' }] }),
    undefined,
    'refuses a post linking off site'
  );
  check(
    read({ kind: 'posts', posts: [post, post, post, post] }),
    undefined,
    'refuses more than three posts'
  );
  check(read({ kind: 'posts', posts: [] }), undefined, 'refuses an empty posts card');
  const term = {
    name: 'Blockbremse',
    definition: 'Eine Bremse, die einen Zug anhält.',
    category: 'coasters',
    url: 'https://park.fan/de/glossar/blockbremse',
  };
  check(
    read({ kind: 'glossary', terms: [term] })?.terms[0],
    { ...term, url: '/de/glossar/blockbremse' },
    'takes a glossary card and links the path it checked'
  );
  check(
    read({ kind: 'glossary', terms: [{ ...term, name: '' }] }),
    undefined,
    'refuses a glossary term without a name'
  );
}
check(
  readAssistantAction({ type: 'planner_optimize', park, date: '2026-11-02', mode: 'drop' }),
  null,
  'refuses an optimise mode the planner does not have'
);
check(
  readAssistantAction({
    type: 'planner_open_day',
    park: { ...park, timezone: 'Mars/Olympus' },
    date: '2026-11-02',
  }),
  null,
  'refuses a time zone the browser cannot format'
);
for (const durationMinutes of ['lots', 10_000, 2.5]) {
  check(
    readAssistantAction({
      type: 'planner_add_block',
      park,
      date: '2026-11-02',
      block: { label: 'Essen', icon: 'food', durationMinutes },
    }),
    null,
    `refuses a block of ${durationMinutes} minutes`
  );
}

// The language switch: one of the six, nothing else rides along, and never off the site.
check(
  readAssistantAction({ type: 'switch_locale', locale: 'it', path: 'https://evil.example/' }),
  { type: 'switch_locale', locale: 'it' },
  'switches to one of the six, carrying nothing else'
);
for (const locale of ['pt', 'de-DE', 'EN', '../admin', '', null, 42, { toString: () => 'de' }]) {
  check(
    readAssistantAction({ type: 'switch_locale', locale }),
    null,
    `refuses the locale ${String(locale)}`
  );
}
check(
  readAssistantAction({ type: 'feedback_sent', message: '<b>x</b>' }),
  { type: 'feedback_sent' },
  'feedback sent is only a chip'
);
check(
  localeSwitchPath('/de/beste-reisezeit', 'en', null),
  '/best-time-to-visit',
  'respells a localized segment'
);
check(
  localeSwitchPath(
    '/de/parks/europe/germany/bruehl/phantasialand/wartezeiten-kalender',
    'fr',
    null
  ),
  '/parks/europe/germany/bruehl/phantasialand/calendrier-temps-attente',
  "respells a park's sub-page"
);
check(localeSwitchPath('/de', 'it', null), '/', 'the home page in the other language');
check(
  localeSwitchPath('/de/blog/taron-wartezeiten', 'en', '/en/blog/taron-wait-times'),
  '/blog/taron-wait-times',
  "the page's own hreflang alternate wins"
);
check(
  localeSwitchPath('/de/blog/x', 'en', '//evil.example/en/blog/x'),
  '/blog/x',
  'an alternate off the site is passed over'
);
check(
  localeSwitchPath('/de/blog/x', 'en', '/fr/blog/x'),
  '/blog/x',
  'an alternate in another language is passed over'
);
check(localeSwitchPath('//evil.example/de', 'en', null), null, 'never a path off the site');
{
  const store = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
    },
  };
  reopenAfterSwitch();
  check(takeReopen(), true, 'the switched page opens the window again');
  check(takeReopen(), false, 'once');
  reopenAfterSwitch();
  check(takeReopen(Date.now() + 60_000), false, 'a switch that never landed opens nothing later');
  delete globalThis.window;
}

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
check(boredomAfter(BORED_AFTER_MS * LATE_SLEEPY_FACTOR, 22), 'bored', 'at 22:00 sleepy sooner');
check(boredomAfter(BORED_AFTER_MS * LATE_SLEEPY_FACTOR, 21), 'awake', 'at 21:00 not yet');
check(boredomAfter(ASLEEP_AFTER_MS * LATE_SLEEPY_FACTOR, 2), 'asleep', 'asleep sooner at 02:00');
check(boredomAfter(BORED_AFTER_MS * LATE_SLEEPY_FACTOR, 5), 'awake', 'morning from 05:00');
check(
  nextBoredomInMs(0, 23),
  BORED_AFTER_MS * LATE_SLEEPY_FACTOR,
  'the late countdown is the shorter one'
);

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
  // Midday, so the run's own hour cannot make Parky sleepy sooner.
  const realHours = Date.prototype.getHours;
  Date.prototype.getHours = () => 12;
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
  Date.prototype.getHours = realHours;
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

// Parky's facts: one per sentence a finding supports, none without its data.
{
  const labels = { weekdays: 'Weekdays', weekend: 'Weekends' };
  const full = {
    parkP50: 21,
    longestName: 'Taron',
    longestP50: 48,
    quietestDays: [1, 2, 3, 4, 5],
    quietestP50: 17,
    busiestMonths: [7, 8],
    busiestP50: 34,
  };
  const facts = parkyFacts(full, 'Phantasialand', 'en', labels);
  check(
    facts.map((f) => f.key),
    Object.values(FACT_KEYS).flat(),
    'every sentence once for a park with every finding'
  );
  check(
    facts.find((f) => f.key === 'factLongest1').values,
    { park: 'Phantasialand', ride: 'Taron', wait: 50 },
    'the longest queue on the five-minute grid'
  );
  check(facts.find((f) => f.key === 'factGap1').values.extra, 30, 'the gap between grid values');
  check(facts.find((f) => f.key === 'factQuietest1').values.days, 'Weekdays', 'the working week');
  check(
    facts.find((f) => f.key === 'factBusiest1').values.months,
    'July and August',
    'months named'
  );
  const close = parkyFacts({ ...full, longestP50: 27 }, 'P', 'en', labels).map((f) => f.key);
  check(close.includes('factGap1'), false, 'no gap under ten minutes');
  check(
    parkyFacts(
      { ...full, longestName: null, quietestDays: [], busiestP50: null, parkP50: 1 },
      'P',
      'en',
      labels
    ),
    [],
    'nothing without data, nor for a wait the grid rounds below five'
  );
  for (const locale of ['de', 'en', 'nl', 'fr', 'es', 'it']) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')).assistant;
    for (const key of Object.values(FACT_KEYS).flat()) {
      check(typeof messages[key], 'string', `${locale} has ${key}`);
    }
  }
}

// Which source fills a session slot, best first.
{
  const slot = {
    slot: 0,
    lastSlot: 1,
    arrival: false,
    holiday: false,
    page: 'other',
    parkLuck: false,
    parkNews: false,
    forced: null,
  };
  check(lineSources(slot), ['invitation'], 'an ordinary page invites');
  check(
    lineSources({ ...slot, arrival: true, holiday: true }),
    ['entrance', 'holiday', 'invitation'],
    'the entrance first, then the holiday'
  );
  check(
    lineSources({ ...slot, slot: 1, arrival: true, holiday: true }),
    ['invitation'],
    'entrance and holiday only in the first slot'
  );
  check(
    lineSources({ ...slot, slot: 1, page: 'park', parkLuck: true }),
    ['live', 'clock', 'fact', 'park', 'invitation'],
    'live and clock before the fact, a fact in the last slot before the park line'
  );
  check(
    lineSources({ ...slot, page: 'park', arrival: true, holiday: true }),
    ['entrance', 'live', 'clock', 'holiday', 'invitation'],
    'the entrance before the live waits, the live waits before the clock'
  );
  check(
    lineSources({ ...slot, page: 'park' }),
    ['live', 'clock', 'invitation'],
    'the park line only on its draw'
  );
  check(
    lineSources({ ...slot, page: 'park', parkNews: true }),
    ['clock', 'invitation'],
    'live is level with the weather: once the park had its news, no live line'
  );
  check(
    lineSources({ ...slot, page: 'park', parkNews: true, forced: 'live' }),
    ['live', 'clock', 'invitation'],
    '?parky=live past the news already said'
  );
  check(
    lineSources({ ...slot, page: 'park', parkNews: true, forced: 'show' }),
    ['live', 'clock', 'invitation'],
    '?parky=show puts the live line first, past the news already said'
  );
  check(lineSources({ ...slot, slot: 1, page: 'home' }), ['fact', 'invitation'], 'home: a fact');
  check(lineSources({ ...slot, slot: 1 }), ['invitation'], 'no fact on other pages');
  check(
    lineSources({ ...slot, page: 'park', forced: 'fact' }),
    ['fact', 'live', 'clock', 'invitation'],
    '?parky=fact in any slot, first'
  );
  check(
    lineSources({ ...slot, page: 'park', arrival: true, forced: 'clock' }),
    ['clock', 'entrance', 'live', 'invitation'],
    '?parky=clock first, even over an entrance'
  );
  check(
    lineSources({ ...slot, page: 'park', forced: 'egg' }),
    ['live', 'clock', 'park', 'invitation'],
    '?parky=egg'
  );
  check(lineSources({ ...slot, forced: 'live' }), ['invitation'], 'live only on a park page');
  check(parkNewsKey('europe/a/b/c'), 'news:europe/a/b/c', 'one news key per park');
}

// The live waits: moments, changes and the act's rate limit.
{
  const ride = (name, status, wait) => ({
    id: name,
    name,
    slug: name,
    land: null,
    effectiveStatus: status,
    queues: [{ queueType: 'STANDBY', status, waitTime: wait }],
  });
  const park = (rides, extra = {}) => ({ status: 'OPERATING', attractions: rides, ...extra });
  const heads = ['Taron', 'Black Mamba'];
  check(
    liveMoment(park([ride('Taron', 'OPERATING', 10), ride('Maus', 'OPERATING', 5)]), heads, false),
    { kind: 'walkOn', ride: 'Taron', wait: 10 },
    'a headliner at 10 minutes is a walk-on'
  );
  check(
    liveMoment(park([ride('Taron', 'OPERATING', 15), ride('Maus', 'OPERATING', 5)]), heads, false),
    null,
    'a walk-on counts only for a headliner, and 15 minutes is no walk-on'
  );
  check(
    liveMoment(park([ride('Taron', 'OPERATING', 75), ride('Maus', 'OPERATING', 61)]), heads, false),
    { kind: 'queue', ride: 'Taron', wait: 75 },
    'the longest queue over an hour'
  );
  check(
    liveMoment(park([ride('Taron', 'OPERATING', 60)]), heads, false),
    null,
    'an hour exactly is not over an hour'
  );
  check(
    liveMoment(park([ride('Taron', 'DOWN', 90)]), heads, false),
    null,
    'a ride that is down has no queue to grumble at'
  );
  check(
    liveMoment(
      park([ride('Taron', 'OPERATING', 75)], { currentLoad: { crowdLevel: 'very_high' } }),
      heads,
      false
    ),
    { kind: 'full' },
    'a very full park before a long queue'
  );
  check(
    liveMoment(
      park([], {
        analytics: { statistics: { crowdLevel: 'extreme' } },
        currentLoad: { crowdLevel: 'low' },
      }),
      heads,
      false
    ),
    { kind: 'full' },
    "the day's crowd statistic first, as the park header reads it"
  );
  check(
    liveMoment(
      park([ride('Taron', 'OPERATING', 5)], { currentLoad: { crowdLevel: 'extreme' } }),
      heads,
      false
    ),
    { kind: 'walkOn', ride: 'Taron', wait: 5 },
    'a walk-on is better news than a full park'
  );
  check(liveMoment(park([], { status: 'CLOSED' }), heads, true), { kind: 'closed' }, 'shut today');
  check(liveMoment(park([], { status: 'CLOSED' }), heads, false), null, 'shut for the night');
  check(
    liveMoment(park([ride('Taron', 'OPERATING', 40)]), heads, false, true),
    { kind: 'queue', ride: 'Taron', wait: 40 },
    '?parky=live counts any open queue as long'
  );
  check(
    liveMoment(park([ride('New: Taron', 'OPERATING', 5)]), ['Taron'], false)?.ride,
    'Taron',
    'names without their "New" prefix'
  );

  // Shows: the window before a start, the order among the moments, and a show on right now.
  const now = Date.parse('2026-11-06T15:00:00+08:00');
  const at = (minutes) => new Date(now + minutes * 60_000).toISOString();
  const show = (name, minutes, status = 'OPERATING') => ({
    id: name,
    name,
    status,
    showtimes: minutes.map((m) => ({ startTime: at(m) })),
  });
  const quiet = (shows) => park([ride('Taron', 'OPERATING', 30)], { shows });
  check(
    showSoon(quiet([show('Parade', [SHOW_SOON_MIN.from])]), now),
    { kind: 'show', show: 'Parade', minutes: 15 },
    'a show 15 minutes off is soon'
  );
  check(showSoon(quiet([show('Parade', [SHOW_SOON_MIN.to])]), now)?.minutes, 30, 'and 30 still');
  check(showSoon(quiet([show('Parade', [14, 31])]), now), null, 'outside the window, nothing');
  check(
    showSoon(quiet([show('Late', [25]), show('Early', [-60, 20])]), now),
    { kind: 'show', show: 'Early', minutes: 20 },
    'the next show of all, from any of its showtimes'
  );
  check(showSoon(quiet([show('Gone', [20], 'CLOSED')]), now), null, 'a closed show is no show');
  check(
    showSoon(quiet([show('Tonight', [240])]), now, true),
    { kind: 'show', show: 'Tonight', minutes: 240 },
    '?parky=show takes any show still to start'
  );
  check(showSoon(quiet([show('Earlier', [-5])]), now, true), null, 'but none that started');
  check(
    liveMoment(quiet([show('Parade', [20])]), heads, false, false, { now }),
    { kind: 'show', show: 'Parade', minutes: 20 },
    'a show soon when nothing else holds'
  );
  check(
    liveMoment(quiet([show('Parade', [20])]), heads, false),
    null,
    'shows count only with a clock to read them at'
  );
  check(
    liveMoment(
      park([ride('Taron', 'OPERATING', 75)], { shows: [show('Parade', [20])] }),
      heads,
      false,
      false,
      { now }
    )?.kind,
    'queue',
    'a long queue before a show'
  );
  check(
    liveMoment(
      park([ride('Taron', 'OPERATING', 5)], { shows: [show('Parade', [20])] }),
      heads,
      false,
      false,
      { now }
    )?.kind,
    'walkOn',
    'a walk-on before a show'
  );
  check(
    liveMoment(
      park([ride('Taron', 'OPERATING', 5)], { shows: [show('Tonight', [240])] }),
      heads,
      false,
      false,
      { now, preview: true }
    ),
    { kind: 'show', show: 'Tonight', minutes: 240 },
    '?parky=show ahead of every other moment'
  );
  check(
    liveMoment(
      park([], { status: 'CLOSED', shows: [show('Parade', [20], 'CLOSED')] }),
      heads,
      true,
      false,
      { now }
    ),
    { kind: 'closed' },
    'a park shut today has no show line'
  );
  check(showRunning(quiet([show('Parade', [0])]), now), true, 'a show that starts now is on');
  check(showRunning(quiet([show('Parade', [-SHOW_RUN_MIN + 1])]), now), true, 'and still on');
  check(showRunning(quiet([show('Parade', [-SHOW_RUN_MIN])]), now), false, 'then over');
  check(showRunning(quiet([show('Parade', [5])]), now), false, 'not on before it starts');
  check(showRunning(park([]), now), false, 'no shows, none on');

  const before = park([ride('Taron', 'OPERATING', 60), ride('Black Mamba', 'OPERATING', 40)]);
  check(
    liveChange(
      before,
      park([ride('Taron', 'DOWN', null), ride('Black Mamba', 'OPERATING', 40)]),
      heads
    ),
    { kind: 'down', ride: 'Taron' },
    'a headliner went down'
  );
  check(
    liveChange(
      before,
      park([ride('Taron', 'OPERATING', 25), ride('Black Mamba', 'OPERATING', 40)]),
      heads
    ),
    { kind: 'drop', ride: 'Taron', wait: 25 },
    'a sharp drop: 35 minutes less, more than half gone'
  );
  check(
    liveChange(
      before,
      park([ride('Taron', 'OPERATING', 35), ride('Black Mamba', 'OPERATING', 40)]),
      heads
    ),
    null,
    'not half gone: no drop'
  );
  check(
    liveChange(
      before,
      park([ride('Taron', 'OPERATING', 60), ride('Black Mamba', 'OPERATING', 25)]),
      heads
    ),
    null,
    '15 minutes less is no drop'
  );
  check(
    liveChange(park([ride('Maus', 'OPERATING', 20)]), park([ride('Maus', 'DOWN', null)]), heads),
    null,
    'a ride outside the headliners going down is no news'
  );
  check(
    liveChange(park([ride('Maus', 'OPERATING', 20)]), park([ride('Maus', 'DOWN', null)]), []),
    { kind: 'down', ride: 'Maus' },
    'without known headliners every ride counts'
  );
  check(
    liveChange(
      before,
      park([ride('Taron', 'OPERATING', 75), ride('Black Mamba', 'OPERATING', 40)]),
      heads
    ),
    { kind: 'queue', ride: 'Taron', wait: 75 },
    'a queue newly over an hour'
  );
  check(
    liveChange(
      park([ride('Taron', 'OPERATING', 75)]),
      park([ride('Taron', 'OPERATING', 80)]),
      heads
    ),
    null,
    'a long queue that stays long is nothing new'
  );
  check(liveChange(before, before, heads), null, 'the same reading changes nothing');
  check(liveActDue(null, 0), true, 'the first act plays');
  check(liveActDue(0, LIVE_ACT_GAP_MS - 1), false, 'then not before the gap');
  check(liveActDue(0, LIVE_ACT_GAP_MS), true, 'and again after it');
  check(
    headlinersOf(
      'Taron',
      [1, 2, 3, 4, 5, 6].map((n) => ({ attractionName: `R${n}` }))
    ),
    ['Taron', 'R1', 'R2', 'R3', 'R4', 'R5'],
    'the favourite and five top attractions'
  );
  check(
    Object.values(LIVE_LINES).every((lines) => lines.length >= 3),
    true,
    'several lines for every reading'
  );
}

// The park's clock, in the park's zone, across midnight.
{
  const hours = [
    { date: '2026-07-01', opens: '09:00', closes: '18:00' },
    { date: '2026-07-02', opens: '10:00', closes: '01:00' },
  ];
  const berlin = 'Europe/Berlin';
  // Berlin is UTC+2 in July.
  const at = (iso) => Date.parse(iso);
  check(clockMoment(hours, berlin, at('2026-07-01T06:00:00Z')), 'ropeDrop', '08:00: an hour to go');
  check(clockMoment(hours, berlin, at('2026-07-01T05:59:00Z')), null, '07:59: too early');
  check(clockMoment(hours, berlin, at('2026-07-01T07:00:00Z')), null, '09:00: open, no rope drop');
  check(clockMoment(hours, berlin, at('2026-07-01T12:00:00Z')), null, 'midday: nothing');
  check(clockMoment(hours, berlin, at('2026-07-01T15:30:00Z')), 'closing', '17:30: half an hour');
  check(clockMoment(hours, berlin, at('2026-07-01T16:00:00Z')), null, '18:00: closed');
  check(clockMoment(hours, berlin, at('2026-07-02T22:45:00Z')), 'closing', '00:45: past midnight');
  check(clockMoment(hours, berlin, at('2026-07-02T21:45:00Z')), null, '23:45: still over an hour');
  check(clockMoment(hours, berlin, at('2026-07-02T23:00:00Z')), null, '01:00: the day is over');
  check(
    clockMoment(hours, 'America/New_York', at('2026-07-01T12:30:00Z')),
    'ropeDrop',
    'the same hours in New York: 08:30 there'
  );
  check(clockMoment(hours, berlin, at('2026-07-03T08:00:00Z')), null, 'no hours, no clock');
  check(clockMoment(hours, berlin, at('2026-07-01T02:00:00Z'), true), 'ropeDrop', 'preview: early');
  check(clockMoment(hours, berlin, at('2026-07-01T12:00:00Z'), true), 'closing', 'preview: open');
  check(clockMoment(hours, berlin, at('2026-07-01T20:00:00Z'), true), 'closing', 'preview: late');
  check(opensToday(hours, berlin, at('2026-07-01T20:00:00Z')), true, 'opens today');
  check(opensToday(hours, berlin, at('2026-07-03T08:00:00Z')), false, 'shut today');
  check(
    openingDaysOf({
      openingHoursSpecification: [
        { opens: '09:00', closes: '18:00', validFrom: '2026-07-01' },
        { opens: 'soon', closes: '18:00', validFrom: '2026-07-02' },
        null,
      ],
    }),
    [{ date: '2026-07-01', opens: '09:00', closes: '18:00' }],
    'hours from structured data, the unreadable left out'
  );
  check(openingDaysOf(null), [], 'no structured data, no hours');
  check(
    CLOCK_PARK_KEYS.test('parkRopeDrop1') &&
      CLOCK_PARK_KEYS.test('parkClosing2') &&
      !CLOCK_PARK_KEYS.test('parkLine1'),
    true,
    'the clock keeps the general opening and closing lines out'
  );
}
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
  'translate(-4px, -9px) rotate(45deg) translate(0px, 0px) scale(1, 1)',
  'a stop as a keyframe, turned about the wheels'
);
check(
  rideKeyframe({ x: 24, y: 20, angle: 0, at: 0.5, lift: 6 }).transform,
  'translate(0px, -29px) rotate(0deg) translate(0px, -6px) scale(1, 1)',
  'airtime floats Parky up off his seat in the car'
);
for (const ride of ['hills', 'tower', 'flume']) {
  check(
    RIDE_MOTION[ride].stops.some((stop) => stop.lift > 0),
    true,
    `${ride}: Parky gets airtime`
  );
}
check(
  RIDE_MOTION.flume.splash,
  RIDE_MOTION.flume.stops.find((stop) => stop.scaleY < 1)?.at,
  'the flume splashes as the boat hits the water'
);
check(
  RIDE_MOTION.flume.stops.some((stop) => stop.opacity === 0),
  true,
  'the log boat drifts out of the picture and floats back in'
);
check(
  RIDE_MOTION.teacups.stops.filter((stop) => stop.x === REST.x && stop.y === REST.y).length > 3,
  true,
  'the teacup passes the station on each lap'
);
check([isRide('tower'), isRide('egg'), isRide(null)], [true, false, false], 'a ride by name');
{
  const fitting = (box) => RIDES.filter((ride) => rideFits(ride, box));
  check(
    fitting({ left: 318, top: 772, width: 56 }),
    [...RIDES],
    'the button in a phone corner has room for every ride'
  );
  check(
    fitting({ left: 18, top: 62, width: 64 }),
    ['coaster'],
    "in the phone's open window only the loop fits"
  );
  check(
    fitting({ left: 828, top: 102, width: 80 }),
    ['coaster', 'hills', 'flume', 'teacups'],
    'in the window on a short laptop screen the launch and the free fall would leave the top'
  );
  check(fitting({ left: 828, top: 290, width: 80 }), [...RIDES], 'a tall screen fits them all');
  check(
    RIDE_MOTION.tower.reach.top < RIDE_MOTION.launch.reach.top &&
      RIDE_MOTION.hills.reach.left < RIDE_MOTION.launch.reach.left,
    true,
    'the free fall reaches highest, the hills furthest left'
  );
  check(
    rideFits('tower', { left: 0, top: 0, width: 0 }),
    true,
    'a drawing not laid out yet has room'
  );
}
// Answers to what the visitor does.
{
  const act = (name, props) => reactionTo(name, props)?.act ?? null;
  check(
    [
      act('planner_opened', { source: 'tab' }),
      act('planner_wizard_finished', { headliners: true }),
    ],
    ['plan', 'cheer'],
    'the planner opened gets the checklist, a finished plan the confetti'
  );
  check(
    [
      act('theme_toggled', { theme: 'dark' }),
      act('theme_toggled', { theme: 'light' }),
      act('theme_toggled', { theme: 'system' }),
    ],
    ['nightcap', 'shades', null],
    'the dark brings out the nightcap, the light the sunglasses'
  );
  check(
    [act('favorite_add', { type: 'park' }), act('favorite_remove', { type: 'park' })],
    ['love', null],
    'a favourite added, not one removed'
  );
  check(
    [act('ride_alert_set', { source: 'card' }), act('show_follow_add', { source: 'panel' })],
    ['bell', 'bell'],
    'an alert and a followed show ring the bell'
  );
  check([act('search_typed', { surface: 'hero' }), act('nonsense')], [null, null], 'others pass');
  check([isReactionAct('love'), isReactionAct('coaster')], [true, false], 'a reaction by name');

  // Every line a reaction can say is there in all six languages.
  const names = [
    ['planner_opened', {}],
    ['planner_wizard_finished', {}],
    ['plan_optimized', {}],
    ['favorite_add', {}],
    ['ride_alert_set', {}],
    ['theme_toggled', { theme: 'dark' }],
    ['theme_toggled', { theme: 'light' }],
    ['pwa_installed', {}],
    ['home_parky_seen', {}],
  ];
  const keys = names.flatMap(([name, props]) => reactionTo(name, props).keys);
  const acts = new Set(names.map(([name, props]) => reactionTo(name, props).act));
  check([...acts].sort(), [...REACTION_ACTS].sort(), 'every reaction act answers something');
  for (const locale of ['de', 'en', 'nl', 'fr', 'es', 'it']) {
    const lines = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')).assistant;
    check(
      keys.filter((key) => typeof lines[key] !== 'string'),
      [],
      `${locale}: every reaction line exists`
    );
  }
}

// One line per kind of answer a session, on a stand-in sessionStorage; none without storage.
{
  const store = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  };
  check(answeredWithLine('favourite'), false, 'no favourite line yet');
  countAnswer('favourite');
  countAnswer('favourite');
  check(
    [answeredWithLine('favourite'), answeredWithLine('theme')],
    [true, false],
    'the favourite line is said, the theme line is still to come'
  );
  globalThis.window = {
    sessionStorage: {
      getItem: () => {
        throw new Error('blocked');
      },
    },
  };
  check(answeredWithLine('theme'), true, 'without storage no answer gets a line');
  delete globalThis.window;
}

// The page's events reach a listener even where nothing is counted; one that throws breaks nothing.
{
  const heard = [];
  const stopThrowing = onSiteEvent(() => {
    throw new Error('listener');
  });
  const stop = onSiteEvent((name, props) => heard.push([name, props]));
  trackSiteEvent('favorite_add', { type: 'park' });
  stop();
  stopThrowing();
  trackSiteEvent('favorite_add', { type: 'show' });
  check(heard, [['favorite_add', { type: 'park' }]], 'heard once, then not after unsubscribing');
}
// Thrown by a scroll: distance by hand, how far by the hand, not one fast frame.
{
  const FRAME = 1000 / 120;
  const VIEWPORT = 800;
  /** One reading a frame while `kind` moves the page at `speed(t)` px/ms; the first fling called. */
  const flingOf = (
    tracker,
    speed,
    { kind = 'touch', from = 0, ms = 1200, y = 10_000, hand } = {}
  ) => {
    for (let t = 0; t <= ms; t += FRAME) {
      y += speed(t) * FRAME;
      const { fling } = tracker.read(
        from + t,
        y,
        VIEWPORT,
        hand === undefined ? { kind, at: from + t } : hand
      );
      if (fling) return fling;
    }
    return null;
  };
  /** A flick with the momentum a phone gives it: `v0` px/ms, slowing down over half a second. */
  const flick = (v0) => (t) => v0 * Math.exp(-t / 500);
  /** A mouse wheel turned `perSecond` notches a second, 100 px each, smoothed over 100 ms. */
  const wheel = (perSecond, ms) => (t) => (t < ms ? (perSecond * 100) / 1000 : 0);

  check(flingOf(new FlingTracker(), flick(2)), null, 'a reading swipe leaves Parky in his corner');
  check(flingOf(new FlingTracker(), flick(5)), null, 'so does a brisk one');
  check(flingOf(new FlingTracker(), flick(9)), 'down', 'a hard flick down throws him up');
  check(flingOf(new FlingTracker(), flick(-9)), 'up', 'a hard flick up presses him flat');
  check(
    flingOf(new FlingTracker(), (t) => (t >= 100 && t < 100 + FRAME ? 30 : 1)),
    null,
    'one frame read late, at 30 px/ms, is no throw'
  );
  check(
    flingOf(new FlingTracker(), wheel(15, 1_000), { kind: 'wheel' }),
    null,
    'a wheel turned briskly is no throw'
  );
  check(
    flingOf(new FlingTracker(), (t) => (t % 500 < 200 ? 4 : 0), { kind: 'wheel', ms: 2_000 }),
    null,
    'nor is a wheel turned bit by bit, eight notches at a time'
  );
  check(
    flingOf(new FlingTracker(), wheel(25, 1_000), { kind: 'wheel' }),
    'down',
    'a wheel rolled hard is'
  );
  check(
    flingOf(new FlingTracker(), (t) => (t < 600 ? 2.2 : 0), { kind: 'bar' }),
    'down',
    "the scrollbar's thumb pulled briskly, a screen in half a second, is"
  );
  check(
    flingOf(new FlingTracker(), (t) => (t < 300 ? 5 : 0), { kind: 'bar' }),
    'down',
    "the scrollbar's thumb pulled quickly is"
  );
  check(
    flingOf(new FlingTracker(), () => 0.8, { kind: 'bar' }),
    null,
    'pulled slowly, to read along, it is not'
  );
  check(
    flingOf(new FlingTracker(), (t) => (t < 100 ? 120 : 0), { kind: 'bar' }),
    'down',
    'on a long page the thumb moves more than a screen a frame, and that is no jump'
  );
  check(
    [
      flingOf(new FlingTracker(), (t) => (t < 500 ? 3.4 : 0), { kind: 'wheel' }),
      flingOf(new FlingTracker(), (t) => (t < 500 ? 3.4 : 0), { kind: 'touch' }),
    ],
    ['down', null],
    'the same distance throws him by wheel, which has no momentum, and not by finger, which has'
  );
  check(
    flingOf(new FlingTracker(), (t) => (t % 400 < 150 ? 4.7 : 0), { kind: 'key' }),
    null,
    'the space bar, pressed again and again, is no throw'
  );
  check(
    flingOf(new FlingTracker(), (t) => (t < 600 ? 7 : 0), { kind: 'key' }),
    'down',
    'a held key is'
  );
  {
    // A link to a new page: the page jumps to its top in one frame.
    const tracker = new FlingTracker();
    flingOf(tracker, () => 0.5, { ms: 100 });
    check(
      tracker.read(120, 0, VIEWPORT, { kind: 'touch', at: 120 }).fling,
      null,
      'a jump to the top is no throw'
    );
  }
  check(
    [
      flingOf(new FlingTracker(), flick(9), { hand: null }),
      flingOf(new FlingTracker(), flick(9), { hand: { kind: 'touch', at: -FLING_HAND_MS - 1 } }),
    ],
    [null, null],
    'a page scrolled by a script, with no hand on it lately, never throws him'
  );

  const tracker = new FlingTracker();
  const touch = { kind: 'touch', at: 2_000 };
  check(flingOf(tracker, flick(9)), 'down', 'thrown');
  check(
    tracker.read(2_000, 0, VIEWPORT, touch),
    { fling: 'down', holding: false },
    'a jump neither turns him over nor holds him up'
  );
  check(
    tracker.read(2_010, 50, VIEWPORT, touch),
    { fling: 'down', holding: true },
    'the page still moving holds him'
  );
  check(
    tracker.read(2_020, 40, VIEWPORT, touch),
    { fling: 'down', holding: true },
    'back up as well: the first direction holds until he lets go'
  );
  check(tracker.read(2_120, 42, VIEWPORT, touch).holding, false, 'the page all but stopped');
  tracker.letGo();
  check(
    flingOf(tracker, flick(9), { from: 3_000 }),
    'down',
    'once he has let go, the same throw again throws him again'
  );
  tracker.letGo();
  check(
    flingOf(tracker, flick(-9), { from: 4_500 }),
    'up',
    'and the other way: down and back up plays both'
  );
}
// The calendar and tiles cards (`lib/assistant/cards.ts`) and their checks in `actions.ts`.
{
  const calendarDay = (date, extra = {}) => ({
    date,
    status: 'OPERATING',
    crowdLevel: 'low',
    opens: `${date}T10:00:00+01:00`,
    closes: `${date}T18:00:00+01:00`,
    holiday: false,
    ...extra,
  });
  const run = (from, count) =>
    Array.from({ length: count }, (_, i) =>
      calendarDay(new Date(Date.parse(from) + i * 86_400_000).toISOString().slice(0, 10))
    );

  // 2026-11-05 is a Thursday: three blanks before it, Monday first.
  const weeks = calendarWeeks(run('2026-11-05', 7));
  check(weeks.length, 2, 'a week from a Thursday spans two rows');
  check(
    weeks[0].map((cell) => cell?.date ?? null),
    [null, null, null, '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'],
    'the first row is padded to the first weekday'
  );
  check(
    weeks[1].map((cell) => cell?.date ?? null),
    ['2026-11-09', '2026-11-10', '2026-11-11', null, null, null, null],
    'the last row is padded after the last day'
  );
  check(calendarWeeks(run('2026-11-02', 14)).length, 2, 'two weeks from a Monday need no blanks');
  check(
    calendarWeeks([calendarDay('2026-11-02'), calendarDay('2026-11-04')])[0]
      .slice(0, 3)
      .map((cell) => cell?.date ?? null),
    ['2026-11-02', null, '2026-11-04'],
    'a missing day stays a gap'
  );
  check(calendarWeeks([]), [], 'no days, no weeks');

  check(
    parkHours('2026-11-07T10:00:00+01:00', '2026-11-07T18:30:00+01:00', 'de'),
    '10:00–18:30',
    'hours in the park clock the offset gives, not the reader’s'
  );
  check(
    parkHours('2026-07-04T09:00:00-04:00', '2026-07-04T23:00:00-04:00', 'en'),
    '9 AM–11 PM',
    'an offset west of Greenwich, on a 12-hour clock'
  );
  check(parkHours('2026-11-07T10:00:00+01:00', null, 'de'), null, 'no closing time, no hours');
  check(parkHours('2026-11-07T10:00:00', '2026-11-07T18:00:00', 'de'), null, 'no offset, no hours');

  const tiles = {
    kind: 'tiles',
    park: 'Efteling',
    url: '/parks/europe/netherlands/kaatsheuvel/efteling',
    date: '2026-11-07',
    live: false,
    crowdLevel: 'moderate',
    avgWaitMinutes: 22,
    peakWaitMinutes: 55,
    openRides: 30,
    totalRides: 41,
    opens: '2026-11-07T10:00:00+01:00',
    closes: '2026-11-07T18:00:00+01:00',
    weather: { condition: 'rain', tempMin: 4, tempMax: 9, climateNormal: true },
  };
  check(
    presentTiles(tiles),
    ['crowd', 'avgWait', 'peakWait', 'rides', 'hours', 'weather'],
    'every stat with a value has a tile'
  );
  check(
    presentTiles({
      ...tiles,
      crowdLevel: null,
      peakWaitMinutes: null,
      openRides: null,
      closes: null,
      weather: { condition: null, tempMin: null, tempMax: null, climateNormal: false },
    }),
    ['avgWait'],
    'a stat without a value has none'
  );

  const read = (card) => readAssistantAction({ type: 'card', card: structuredClone(card) })?.card;
  check(read(tiles)?.kind, 'tiles', 'takes a tiles card');
  check(
    read({ ...tiles, avgWaitMinutes: 'lots', weather: { condition: 'sun' } }),
    {
      ...tiles,
      avgWaitMinutes: null,
      weather: {
        condition: 'sun',
        tempMin: null,
        tempMax: null,
        weatherCode: null,
        climateNormal: false,
      },
    },
    'a tiles value it cannot draw is dropped, not the card'
  );
  check(read({ ...tiles, date: 'tomorrow' }), undefined, 'refuses a tiles card without a day');
  const calendar = {
    kind: 'calendar',
    park: 'Efteling',
    url: '/parks/europe/netherlands/kaatsheuvel/efteling',
    days: run('2026-11-05', 7),
  };
  check(read(calendar)?.days.length, 7, 'takes a calendar card');
  check(
    read({
      ...calendar,
      days: [calendarDay('2026-11-05', { status: 'CLOSED', crowdLevel: 'low', holiday: 'yes' })],
    })?.days[0],
    calendarDay('2026-11-05', { status: 'CLOSED', crowdLevel: null }),
    'a closed day carries no level, and a holiday is true or false'
  );
  check(
    read({ ...calendar, days: [calendarDay('2026-11-05', { crowdLevel: 'unknown' })] })?.days[0]
      .crowdLevel,
    'unknown',
    'a day may say its level is unknown'
  );
  check(
    read({ ...calendar, days: [calendarDay('2026-11-06'), calendarDay('2026-11-05')] }),
    undefined,
    'refuses days out of order'
  );
  check(
    read({ ...calendar, days: run('2026-11-01', 43) }),
    undefined,
    'refuses more than six weeks'
  );
  check(
    read({ ...calendar, url: 'https://evil.example' }),
    undefined,
    'refuses a calendar off site'
  );
  check(
    read({ kind: 'hologram', name: 'X', url: null }),
    undefined,
    'refuses a kind it does not know'
  );
  check(
    localizedPath(`${calendar.url}/wait-time-calendar`, 'fr'),
    '/fr/parks/europe/netherlands/kaatsheuvel/efteling/calendrier-temps-attente',
    'the calendar link lands on the crowd calendar in the reader’s spelling'
  );
}
// Ride extras, rides rows without a wait, shows and restaurants.
{
  const read = (card) => readAssistantAction({ type: 'card', card: structuredClone(card) })?.card;
  const parkUrl = '/parks/europe/germany/bruehl/phantasialand';

  const times = [
    '2026-11-05T11:00:00+01:00',
    '2026-11-05T14:00:00+01:00',
    '2026-11-05T17:00:00+01:00',
  ];
  check(
    showTimes(times, Date.parse('2026-11-05T13:30:00+01:00')).map(({ past, next }) => [past, next]),
    [
      [true, false],
      [false, true],
      [false, false],
    ],
    'times before now are past, the first one after is next'
  );
  check(
    showTimes(times, null).some(({ past, next }) => past || next),
    false,
    'without a clock no time is past or next, so the server render and hydration agree'
  );
  check(
    showTimes(times, Date.parse('2026-11-05T18:00:00+01:00')).filter(({ next }) => next).length,
    0,
    'after the last show nothing is next'
  );
  check(parkClock('2026-11-05T14:00:00+01:00', 'de'), '14:00', 'a show time in the park clock');
  check(parkClock('soon', 'de'), null, 'an unreadable time has no clock');

  const ride = {
    kind: 'ride',
    name: 'Taron',
    park: 'Phantasialand',
    status: 'OPERATING',
    crowdLevel: null,
    waitMinutes: 40,
    url: `${parkUrl}/taron`,
  };
  check(
    read({
      ...ride,
      ropeDrop: { strength: 'high', savings: 35 },
      singleRider: true,
      virtualLine: false,
      paidExpress: 'yes',
      outOfSeason: true,
    }),
    { ...ride, ropeDrop: { strength: 'high', savings: 35 }, singleRider: true, outOfSeason: true },
    'a ride keeps the extras that hold and drops any flag that is not true'
  );
  check(
    read({ ...ride, ropeDrop: { strength: 'huge', savings: 35 } }),
    ride,
    'a rope-drop hint the badge cannot draw is dropped'
  );

  const rides = { kind: 'rides', park: 'Phantasialand', order: 'longest', url: parkUrl };
  check(
    read({
      ...rides,
      rides: [
        { name: 'Taron', waitMinutes: 40, url: null },
        { name: 'F.L.Y.', waitMinutes: null, status: 'DOWN', url: null },
        { name: 'Chiapas', waitMinutes: null, status: 'BROKEN', url: null },
      ],
    })?.rides,
    [
      { name: 'Taron', waitMinutes: 40, status: null, url: null },
      { name: 'F.L.Y.', waitMinutes: null, status: 'DOWN', url: null },
      { name: 'Chiapas', waitMinutes: null, status: null, url: null },
    ],
    'a row without a wait keeps its status; a status without a badge is dropped'
  );
  check(
    read({ ...rides, rides: [{ name: 'Taron', waitMinutes: 40 }] })?.rides[0].waitMinutes,
    40,
    'a row from before rows had a status still reads'
  );

  const shows = {
    kind: 'shows',
    park: 'Phantasialand',
    url: parkUrl,
    date: '2026-11-05',
    shows: [{ name: 'Rookburgh Show', status: 'OPERATING', times, url: null }],
  };
  check(read(shows)?.shows[0].times, times, 'takes a shows card');
  check(
    read({ ...shows, shows: [{ name: 'X', status: 'ON', times: ['noon', times[0]], url: null }] })
      ?.shows[0],
    { name: 'X', status: null, times: [times[0]], url: null },
    'an unreadable time or status is dropped, not the show'
  );
  check(
    read({ ...shows, shows: [{ ...shows.shows[0], url: 'https://evil.example' }] }),
    undefined,
    'refuses a show linking off site'
  );
  check(read({ ...shows, date: null }), undefined, 'refuses a shows card without a day');

  const restaurants = {
    kind: 'restaurants',
    park: 'Phantasialand',
    url: parkUrl,
    restaurants: [
      {
        name: 'Uhrwerk',
        status: 'OPERATING',
        land: 'Rookburgh',
        cuisine: null,
        requiresReservation: true,
      },
      {
        name: 'Cocorico',
        status: 'nope',
        land: null,
        cuisine: 'Burger',
        requiresReservation: 'maybe',
      },
    ],
  };
  check(
    read(restaurants)?.restaurants,
    [
      restaurants.restaurants[0],
      { name: 'Cocorico', status: null, land: null, cuisine: 'Burger', requiresReservation: null },
    ],
    'a restaurant keeps what it knows and drops the rest'
  );
  check(
    read({ ...restaurants, restaurants: [{ name: null }] }),
    undefined,
    'refuses a restaurant without a name'
  );
  check(
    [parkChapterUrl(parkUrl, 'shows'), parkChapterUrl(parkUrl, 'restaurants')],
    [`${parkUrl}#shows`, `${parkUrl}#restaurants`],
    'the list cards link the park page chapter'
  );

  check(
    presentTiles({
      kind: 'tiles',
      park: 'X',
      url: null,
      date: '2026-11-05',
      live: true,
      crowdLevel: null,
      avgWaitMinutes: null,
      peakWaitMinutes: null,
      openRides: null,
      totalRides: null,
      opens: null,
      closes: null,
      weather: {
        condition: null,
        tempMin: null,
        tempMax: null,
        weatherCode: 61,
        climateNormal: false,
      },
    }),
    ['weather'],
    'a weather code alone is a weather tile'
  );
}
console.log(`assistant: ${passed} checks passed`);
