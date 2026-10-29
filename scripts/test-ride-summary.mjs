/**
 * Unit tests for the ride page's data card (`lib/parks/ride-summary.ts`), the FAQ wait answer that
 * reads the same summary (`lib/faq/attraction-faq.ts`) and the facts-first meta description
 * (`lib/seo/attraction-meta.ts`).
 *
 * The card exists because Google crawls ride pages at night, when the live half reads „—", so
 * what it may depend on is the point of these cases: the same ride at noon and at 3 a.m. renders
 * the same text, every minute it prints is on the five-minute grid, and a ride with little on
 * file gets a short card or none rather than an empty template. Fixtures are trimmed from the
 * production park payload of 2026-10-17 (Europa-Park).
 *
 * Every message is rendered in all six locales, so a select branch or a tag missing from one
 * translation fails here rather than as a raw ICU string on a ride page.
 *
 * Run: pnpm test:ride-summary
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTranslator } from 'next-intl';
import { buildRideSummary, rideSummaryRenders } from '../lib/parks/ride-summary.ts';
import { buildAttractionFaqItems } from '../lib/faq/attraction-faq.ts';
import { buildAttractionDescription, buildAttractionFacts } from '../lib/seo/attraction-meta.ts';
import { MAX_DESCRIPTION_LENGTH } from '../lib/utils/metadata.ts';

const LOCALES = ['en', 'de', 'nl', 'fr', 'es', 'it'];
const messages = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url))),
  ])
);

let failed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}\n    ${err.message.split('\n').join('\n    ')}`);
  }
};

const VOLETARIUM = {
  id: 'bca60b06',
  name: 'Voletarium',
  slug: 'voletarium',
  land: 'Germany',
  minimumHeight: 130,
  hasSingleRider: true,
  hasVirtualLine: true,
  indoorOutdoor: 'indoor',
  status: 'CLOSED',
  queues: [],
  ropeDrop: {
    worth: true,
    strength: 'moderate',
    confidence: 'high',
    busyPeak: 85,
    openWait: 15,
    savings: 70,
    rideByMinutesAfterOpen: 30,
    bestSlotMinutesAfterOpen: 225,
    bestSlotWait: 15,
    endOfDayWorth: false,
    byDaytype: {
      weekday: { savings: 75, busyPeak: 85, openWait: 10 },
      weekend: { savings: 70, busyPeak: 85, openWait: 15 },
    },
    rideByUtc: null,
    bestSlotUtc: null,
  },
  typicalWaits: {
    peak: { date: '2026-10-05', value: 90 },
    dataFrom: '2025-10-16',
    dataTo: '2026-10-15',
    weekday: { busy: 85, typical: 55, sampleDays: 197 },
    weekend: { busy: 85, typical: 60, sampleDays: 80 },
    windowDays: 365,
    byDayOfWeek: [
      [0, 85, 55, 40],
      [1, 85, 60, 40],
      [2, 80, 55, 38],
      [3, 80, 60, 40],
      [4, 85, 45, 40],
      [5, 80, 50, 39],
      [6, 85, 65, 40],
    ].map(([dayOfWeek, busy, typical, sampleDays]) => ({
      dayOfWeek,
      busy,
      typical,
      sampleDays,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })),
    displayable: true,
    generatedAt: '2026-10-16T11:52:09.205Z',
  },
  rideProfile: {
    elements: [],
    types: ['flying-theater', 'pre-show'],
    manufacturer: 'Brogent Technologies',
    manufacturerTermId: 'brogent',
    model: 'i-Ride',
    openedYear: 2017,
  },
};

const BLUE_FIRE = {
  id: '48b5ba6c',
  name: 'blue fire Megacoaster',
  slug: 'blue-fire-megacoaster',
  land: 'Iceland',
  minimumHeight: 130,
  indoorOutdoor: 'outdoor',
  rideProfile: {
    elements: ['launch'],
    types: ['launch-coaster'],
    manufacturer: 'Mack Rides',
    openedYear: 2009,
    inversions: 4,
    stats: {
      topSpeedKmh: 100,
      heightM: 38,
      lengthM: 1056,
      durationSeconds: 145,
      source: 'curated',
    },
  },
};

const VINDJAMMER = {
  id: '0b3cbfff',
  name: 'Vindjammer',
  slug: 'vindjammer',
  land: 'Scandinavia',
  minimumHeight: 130,
  hasSingleRider: false,
  indoorOutdoor: 'outdoor',
  rideProfile: {
    elements: [],
    types: ['pendulum-ride', 'flat-ride'],
    manufacturer: 'Mondial',
    openedYear: 2009,
  },
};

const CAROUSEL = {
  id: 'c1',
  name: "Children's carousel",
  slug: 'childrens-carousel',
  land: null,
  hasSingleRider: false,
  indoorOutdoor: 'covered_queue',
};

const PARK = { name: 'Europa-Park', nameArticleDe: 'der', attractions: [] };

const TYPE = { name: 'Flying Theater', href: '/en/glossary/flying-theater' };

/** Plain text of the card, as a crawler without CSS reads its sentences (metric units only). */
function cardText(summary, locale) {
  const t = createTranslator({
    locale,
    messages: messages[locale],
    namespace: 'attraction.dataCard',
  });
  const f = summary.figures;
  const tags = {
    b: (c) => c,
    type: (c) => c,
    minHeight: () => `${f.minHeightCm} cm`,
    maxHeight: () => `${f.maxHeightCm} cm`,
    speed: () => `${f.speedKmh} km/h`,
    height: () => `${f.heightM} m`,
    length: () => `${f.lengthM} m`,
  };
  const list = new Intl.ListFormat(locale, { type: 'conjunction' }).format(
    summary.stats.map((s) => t.markup(`stat.${s.key}`, { ...s.values, ...tags }))
  );
  return summary.sentences
    .map((s) =>
      s.key === 'stats'
        ? t.markup('stats', { ...s.values, list: () => list })
        : t.markup(s.key, { ...s.values, ...tags })
    )
    .join(' ');
}

const minutesIn = (text) =>
  [...text.matchAll(/(\d+) (?:minutes|Minuten|minuten|minutos|minuti|min)\b/g)].map((m) => +m[1]);

console.log('Ride data card');

test('a headliner gets every sentence its data supports, in order', () => {
  const s = buildRideSummary(VOLETARIUM, TYPE, 'en');
  assert.deepEqual(
    s.sentences.map((x) => x.key),
    ['identity', 'place', 'height', 'queues', 'typical', 'quietDay', 'record', 'ropeDrop']
  );
  assert.deepEqual(
    s.metrics.map((m) => m.key),
    ['typicalPeak', 'record', 'opened', 'minHeight']
  );
  assert.ok(rideSummaryRenders(s));
});

test('the English text reads as the facts, 60 to 130 words', () => {
  const text = cardText(buildRideSummary(VOLETARIUM, TYPE, 'en'), 'en');
  console.log(`    EN: ${text}`);
  assert.match(
    text,
    /^Voletarium is a Flying Theater built by Brogent Technologies and opened in 2017\./
  );
  assert.match(text, /about 55 minutes on weekdays and 60 minutes at weekends/);
  assert.match(text, /Thursday is usually the quietest day, with a peak of about 45 minutes\./);
  assert.match(text, /90 minutes, on Oct 5, 2026/);
  const words = text.split(/\s+/).length;
  assert.ok(words >= 60 && words <= 130, `${words} words`);
});

test('and so does the German', () => {
  const text = cardText(buildRideSummary(VOLETARIUM, { ...TYPE, href: '/de/x' }, 'de'), 'de');
  console.log(`    DE: ${text}`);
  assert.match(
    text,
    /^Voletarium ist eine Attraktion vom Typ Flying Theater, gebaut von Brogent Technologies und 2017 eröffnet\./
  );
  assert.match(text, /Am ruhigsten ist es meist am Donnerstag/);
  assert.doesNotMatch(text, /\.\./);
});

test('every minute printed is on the five-minute grid', () => {
  const raw = structuredClone(VOLETARIUM);
  raw.typicalWaits.weekday.typical = 53;
  raw.typicalWaits.peak.value = 91;
  raw.ropeDrop.openWait = 12;
  for (const locale of LOCALES) {
    const mins = minutesIn(cardText(buildRideSummary(raw, TYPE, locale), locale));
    assert.ok(mins.length > 0, locale);
    for (const m of mins) assert.equal(m % 5, 0, `${locale}: ${m}`);
  }
});

test('the same ride reads the same at noon and at night', () => {
  const day = {
    ...VOLETARIUM,
    status: 'OPERATING',
    queues: [{ queueType: 'STANDBY', waitTime: 45 }],
    statistics: { avgWaitToday: 40, minWaitToday: 10, maxWaitToday: 70 },
  };
  const night = { ...VOLETARIUM, status: 'CLOSED', queues: [], statistics: { avgWaitToday: 0 } };
  assert.deepEqual(buildRideSummary(day, TYPE, 'en'), buildRideSummary(night, TYPE, 'en'));
});

test('a coaster lists its figures with the locale’s own list pattern', () => {
  const s = buildRideSummary(BLUE_FIRE, { name: 'Launch Coaster', href: '/x' }, 'en');
  const text = cardText(s, 'en');
  assert.match(
    text,
    /In figures: a top speed of 100 km\/h, a height of 38 m, 1056 m of track, 4 inversions, and a ride time of 2:25 min\./
  );
  assert.match(text, /^blue fire Megacoaster is a Launch Coaster/);
  const fr = cardText(
    buildRideSummary(BLUE_FIRE, { name: 'Launch Coaster', href: '/x' }, 'fr'),
    'fr'
  );
  assert.match(fr, /4 inversions et un tour de 2:25 min\./);
});

test('English picks „an" before a vowel', () => {
  const text = cardText(
    buildRideSummary(BLUE_FIRE, { name: 'Inverted Coaster', href: '/x' }, 'en'),
    'en'
  );
  assert.match(text, /is an Inverted Coaster/);
});

test('a minor ride gets the short honest version, without wait sentences', () => {
  const s = buildRideSummary(VINDJAMMER, { name: 'Pendulum Ride', href: '/x' }, 'en');
  assert.deepEqual(
    s.sentences.map((x) => x.key),
    ['identity', 'place', 'height']
  );
  assert.ok(rideSummaryRenders(s));
  assert.equal(
    cardText(s, 'en'),
    'Vindjammer is a Pendulum Ride built by Mondial and opened in 2009. It sits in the Scandinavia area and runs in the open air. Riders must be at least 130 cm tall.'
  );
});

test('a ride with one fact on file gets no card at all', () => {
  const s = buildRideSummary(CAROUSEL, null, 'en');
  assert.equal(s.sentences.length, 1);
  assert.equal(rideSummaryRenders(s), false);
});

test('a wait that rounds to zero is left out, not printed as „0 minutes"', () => {
  const quiet = structuredClone(VOLETARIUM);
  quiet.typicalWaits.weekday.typical = 1;
  quiet.typicalWaits.weekend.typical = 2;
  const s = buildRideSummary(quiet, TYPE, 'en');
  assert.equal(
    s.sentences.some((x) => x.key === 'typical'),
    false
  );
  assert.equal(
    s.sentences.some((x) => x.key === 'record'),
    false
  );
});

test('figures the API does not mark displayable are not used', () => {
  const thin = structuredClone(VOLETARIUM);
  thin.typicalWaits.displayable = false;
  const keys = buildRideSummary(thin, TYPE, 'en').sentences.map((x) => x.key);
  assert.equal(keys.includes('typical'), false);
  assert.equal(keys.includes('quietDay'), false);
});

test('every sentence and branch renders in all six locales', () => {
  const variants = [
    VOLETARIUM,
    BLUE_FIRE,
    VINDJAMMER,
    { ...VINDJAMMER, rideProfile: { elements: [], types: [], manufacturer: 'Mondial' } },
    { ...VINDJAMMER, rideProfile: { elements: [], types: [], openedYear: 1999 } },
    { ...VINDJAMMER, land: null, indoorOutdoor: 'indoor', maximumHeight: 140 },
    { ...VOLETARIUM, ropeDrop: { ...VOLETARIUM.ropeDrop, worth: false, endOfDayWorth: true } },
  ];
  for (const locale of LOCALES) {
    for (const ride of variants) {
      const text = cardText(buildRideSummary(ride, TYPE, locale), locale);
      assert.doesNotMatch(text, /[{}<>]/, `${locale}: ${text}`);
      assert.doesNotMatch(text, /\s\./, `${locale}: ${text}`);
    }
  }
});

console.log('FAQ');

const faq = (ride, locale) =>
  buildAttractionFaqItems(
    ride,
    PARK,
    createTranslator({ locale, messages: messages[locale], namespace: 'seo.faq.attraction' }),
    locale
  );

test('the wait answer is the ride’s typical and record wait, never today’s', () => {
  const answer = faq(VOLETARIUM, 'en').find((f) => f.iconName === 'Clock').answer;
  console.log(`    EN: ${answer}`);
  assert.match(
    answer,
    /55 minutes, at weekends at about 60 minutes\. The longest wait in the past 12 months was 90 minutes/
  );
  const de = faq(VOLETARIUM, 'de').find((f) => f.iconName === 'Clock').answer;
  console.log(`    DE: ${de}`);
  const live = { ...VOLETARIUM, statistics: { avgWaitToday: 0, minWaitToday: 0, maxWaitToday: 0 } };
  assert.equal(faq(live, 'en').find((f) => f.iconName === 'Clock').answer, answer);
});

test('a ride without typical waits keeps the general answer', () => {
  const answer = faq(VINDJAMMER, 'en').find((f) => f.iconName === 'Clock').answer;
  assert.equal(
    answer,
    messages.en.seo.faq.attraction.waitTimeA.replace('{attraction}', 'Vindjammer')
  );
});

test('the single-rider question follows the curated flag when the night feed drops the queue', () => {
  assert.ok(faq(VOLETARIUM, 'en').some((f) => f.iconName === 'Users'));
  assert.ok(!faq(VINDJAMMER, 'en').some((f) => f.iconName === 'Users'));
});

test('every FAQ answer renders in all six locales', () => {
  for (const locale of LOCALES) {
    for (const item of faq(VOLETARIUM, locale)) assert.doesNotMatch(item.answer, /[{}]/, locale);
  }
});

console.log('Meta description');

const describe = (ride, locale, typeName) => {
  const t = createTranslator({ locale, messages: messages[locale], namespace: 'seo.attraction' });
  return buildAttractionDescription(
    ride.name,
    'Europa-Park',
    buildAttractionFacts(ride, t, typeName),
    t,
    { locale, articleDe: 'der' }
  );
};

test('the ride’s own facts lead, and the description fits', () => {
  for (const locale of LOCALES) {
    for (const [ride, type] of [
      [VOLETARIUM, 'Flying Theater'],
      [BLUE_FIRE, 'Launch Coaster'],
      [VINDJAMMER, 'Pendulum Ride'],
      [CAROUSEL, null],
    ]) {
      const d = describe(ride, locale, type);
      assert.ok(d.length <= MAX_DESCRIPTION_LENGTH, `${locale} ${d.length}: ${d}`);
      assert.doesNotMatch(d, /\.\.|[{}]/, d);
    }
  }
  const en = describe(VOLETARIUM, 'en', 'Flying Theater');
  const de = describe(VOLETARIUM, 'de', 'Flying Theater');
  console.log(`    EN: ${en}\n    DE: ${de}`);
  assert.match(en, /^Voletarium at Europa-Park: Flying Theater, built by Brogent Technologies/);
  assert.match(de, /^Voletarium im Europa-Park: Flying Theater/);
});

test('speed, height and ride time follow the type, where a ride is searched with them', () => {
  const en = describe(BLUE_FIRE, 'en', 'Launch Coaster');
  const it = describe(BLUE_FIRE, 'it', 'Launch Coaster');
  console.log(`    EN: ${en}\n    IT: ${it}`);
  assert.match(
    en,
    /^Blue Fire Megacoaster at Europa-Park: Launch Coaster, top speed 100 km\/h, 38 m tall/i
  );
  assert.match(it, /velocità max 100 km\/h, altezza 38 m/);
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
