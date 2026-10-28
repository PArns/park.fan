/**
 * Unit tests for `lib/analytics/site-analytics.ts`, our own counter's client: which page type each
 * real route gets (every locale's localized segments), what a pageview and an event carry, which
 * gates keep a hit from being sent at all, and how hits are batched.
 *
 * Run: pnpm test:site-analytics
 */
import assert from 'node:assert/strict';
import {
  browser,
  clock,
  fire,
  hits,
  navigate,
  requests,
  windowReads,
} from './lib/fake-browser.mjs';
import { ForegroundTimer, MAX_ENGAGEMENT_SECONDS } from '../lib/analytics/foreground-timer.ts';

// A fresh copy of the facade per case that depends on its module state (the first pageview of a
// load carries the referrer, later ones do not).
let copies = 0;
const facade = () => import(`../lib/analytics/site-analytics.ts?copy=${copies++}`);

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

browser();
const { sitePageTypeOf, searchPosition } = await facade();

await test('page types of the real routes, in every locale', () => {
  const cases = {
    home: ['/en', '/de', '/it/'],
    geo: [
      '/en/parks',
      '/de/parks/europe',
      '/de/parks/europe/germany',
      '/de/parks/europe/germany/bruehl',
    ],
    park: ['/de/parks/europe/germany/bruehl/phantasialand'],
    attraction: ['/de/parks/europe/germany/bruehl/phantasialand/taron'],
    park_calendar: [
      '/en/parks/europe/germany/bruehl/phantasialand/wait-time-calendar',
      '/en/parks/europe/germany/bruehl/phantasialand/wait-time-calendar/2026/9',
      '/de/parks/europe/germany/bruehl/phantasialand/wartezeiten-kalender',
      '/fr/parks/europe/germany/bruehl/phantasialand/calendrier-temps-attente/2026/12',
      '/it/parks/europe/germany/bruehl/phantasialand/calendario-tempi-attesa',
      '/nl/parks/europe/germany/bruehl/phantasialand/wachttijden-kalender',
      '/es/parks/europe/germany/bruehl/phantasialand/calendario-tiempos-espera',
    ],
    park_chapter: [
      '/en/parks/europe/germany/bruehl/phantasialand/average-wait-times',
      '/de/parks/europe/germany/bruehl/phantasialand/durchschnittliche-wartezeiten',
      '/fr/parks/europe/germany/bruehl/phantasialand/temps-attente-moyens',
      '/it/parks/europe/germany/bruehl/phantasialand/tempi-di-attesa-medi',
      '/nl/parks/europe/germany/bruehl/phantasialand/gemiddelde-wachttijden',
      '/es/parks/europe/germany/bruehl/phantasialand/tiempos-de-espera-medios',
      '/en/parks/europe/germany/bruehl/phantasialand/with-kids',
      '/de/parks/europe/germany/bruehl/phantasialand/mit-kindern',
      '/fr/parks/europe/germany/bruehl/phantasialand/avec-enfants',
      '/it/parks/europe/germany/bruehl/phantasialand/con-bambini',
      '/nl/parks/europe/germany/bruehl/phantasialand/met-kinderen',
      '/es/parks/europe/germany/bruehl/phantasialand/con-ninos',
    ],
    guide: ['/de/blog/phantasialand-tipps', '/en/blog/phantasialand-wait-times-tips'],
    guide_index: [
      '/de/blog',
      '/de/blog/page/2',
      '/en/blog/category/guides/parks',
      '/en/blog/tag/phantasialand',
      '/fr/blog/authors/patrick',
    ],
    news: ['/de/news/some-news-post'],
    news_index: ['/de/news', '/en/news/page/3'],
    glossary: [
      '/en/glossary/looping',
      '/de/glossar/looping',
      '/fr/glossaire/looping',
      '/it/glossario/looping',
      '/nl/woordenboek/looping',
      '/es/glosario/looping',
    ],
    glossary_index: [
      '/en/glossary',
      '/de/glossar',
      '/fr/glossaire',
      '/it/glossario',
      '/nl/woordenboek',
      '/es/glosario',
    ],
    search: ['/en/search', '/de/search'],
    planner: [
      '/en/trip-planner',
      '/de/tagesplaner',
      '/fr/planificateur',
      '/it/pianificatore',
      '/nl/dagplanner',
      '/es/planificador',
      '/de/trip-planner/shared',
    ],
    favorites: ['/de/favorites'],
    other: [
      '/de/impressum',
      '/en/datenschutz',
      '/de/so-funktioniert-park-fan',
      '/en/how-park-fan-works',
      '/de/beste-reisezeit',
      '/en/alerts',
      '/en/compare',
      '/en/changelog',
      '/de/parks/europe/germany/bruehl/phantasialand/taron/extra',
    ],
  };
  for (const [type, paths] of Object.entries(cases)) {
    for (const path of paths) assert.equal(sitePageTypeOf(path), type, `${path} is ${type}`);
  }
});

await test('page types ignore the case of the path', () => {
  assert.equal(sitePageTypeOf('/DE/Parks/Europe/Germany/Bruehl/Phantasialand'), 'park');
});

await test('result positions fall into the six buckets', () => {
  const buckets = [1, 2, 3, 4, 5, 6, 10, 11, 40].map(searchPosition);
  assert.deepEqual(buckets, ['1', '2', '3', '4-5', '4-5', '6-10', '6-10', '11+', '11+']);
});

await test('a pageview carries path, page type and locale, and nothing of the screen', async () => {
  browser({ path: '/de/glossar/looping/' });
  const { trackSitePageview, flushSiteAnalytics } = await facade();
  trackSitePageview();
  flushSiteAnalytics();
  assert.deepEqual(await hits(), [
    {
      t: 'pageview',
      locale: 'de',
      path: '/de/glossar/looping',
      pageType: 'glossary',
    },
  ]);
  assert.equal(requests[0].url, 'https://api.park.fan/v1/analytics/collect');
  assert.equal(requests[0].type, 'text/plain;charset=UTF-8');
  assert.equal(requests[0].keepalive, true);
});

await test('no hit carries a viewport, a device or a campaign, and the window width is never read', async () => {
  browser({ search: '?utm_campaign=summer' });
  const { trackSitePageview, trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSitePageview();
  trackSiteEvent('favorite_add', { type: 'park' });
  clock.now += 5000;
  fire('visibilitychange', 'hidden');
  flushSiteAnalytics();
  const sent = await hits();
  assert.deepEqual(
    sent.map((hit) => hit.t),
    ['pageview', 'event', 'engagement']
  );
  for (const hit of sent) {
    for (const field of ['viewport', 'device', 'campaign']) {
      assert.equal(field in hit, false, `${hit.t} has no ${field}`);
    }
  }
  assert.equal(windowReads.width, 0);
});

await test('the referrer is the external host, once per load', async () => {
  browser({ referrer: 'https://www.google.com/search?q=phantasialand' });
  const { trackSitePageview, flushSiteAnalytics } = await facade();
  trackSitePageview();
  trackSitePageview();
  flushSiteAnalytics();
  const [first, second] = await hits();
  assert.equal(first.referrer, 'google.com');
  assert.equal('referrer' in second, false);
});

await test('a utm_source in the address sends no referrer, and the referrer host is left alone', async () => {
  for (const search of [
    '?utm_source=Newsletter',
    '?utm_source=news.example.com&utm_campaign=summer',
  ]) {
    browser({ search });
    const { trackSitePageview, flushSiteAnalytics } = await facade();
    trackSitePageview();
    flushSiteAnalytics();
    const [hit] = await hits();
    assert.equal('referrer' in hit, false, search);
    assert.equal('campaign' in hit, false, search);
  }
  browser({ search: '?utm_source=Newsletter', referrer: 'https://google.com/' });
  const { trackSitePageview, flushSiteAnalytics } = await facade();
  trackSitePageview();
  flushSiteAnalytics();
  assert.equal((await hits())[0].referrer, 'google.com');
});

await test('an internal or missing referrer sends none', async () => {
  for (const referrer of [
    '',
    'https://park.fan/de',
    'https://www.park.fan/en/parks',
    'not a url',
  ]) {
    browser({ referrer });
    const { trackSitePageview, flushSiteAnalytics } = await facade();
    trackSitePageview();
    flushSiteAnalytics();
    assert.equal('referrer' in (await hits())[0], false, `referrer "${referrer}"`);
  }
});

await test('a referrer the API would refuse is not sent', async () => {
  browser({ referrer: 'https://under_score.example/' });
  const { trackSitePageview, flushSiteAnalytics } = await facade();
  trackSitePageview();
  flushSiteAnalytics();
  assert.equal('referrer' in (await hits())[0], false);
});

await test('an event carries its props and a lowercase entity', async () => {
  browser({ path: '/en/parks/europe/germany/bruehl/phantasialand' });
  const { trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSiteEvent('favorite_add', { type: 'park' }, 'A1B2C3D4-E5F6-4789-A012-3456789ABCDE');
  trackSiteEvent('compass_viewed', {});
  trackSiteEvent('tab_changed', { tab: 'map' }, 'not-a-uuid');
  trackSiteEvent('ride_alert_removed', {}, null);
  flushSiteAnalytics();
  const base = {
    t: 'event',
    locale: 'en',
    path: '/en/parks/europe/germany/bruehl/phantasialand',
    pageType: 'park',
  };
  assert.deepEqual(await hits(), [
    {
      ...base,
      name: 'favorite_add',
      props: { type: 'park' },
      entity: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
    },
    { ...base, name: 'compass_viewed' },
    { ...base, name: 'tab_changed', props: { tab: 'map' } },
    { ...base, name: 'ride_alert_removed' },
  ]);
});

await test('any event name goes through, with properties of a text, a number or a flag', async () => {
  browser();
  const { trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSiteEvent('brand_new_event', {
    depth: 50,
    enabled: true,
    label: 'Ride 7',
    note: 'a:b/c+d#e',
  });
  flushSiteAnalytics();
  const [hit] = await hits();
  assert.equal(hit.name, 'brand_new_event');
  assert.deepEqual(hit.props, { depth: 50, enabled: true, label: 'Ride 7', note: 'a:b/c+d#e' });
});

await test('a name outside the API pattern is dropped, and nothing throws', async () => {
  browser();
  const { trackSiteEvent, flushSiteAnalytics } = await facade();
  for (const name of [
    '',
    'a',
    'Upper_case',
    '1abc',
    'has space',
    'x'.repeat(49),
    'dash-name',
    'ünï',
  ]) {
    trackSiteEvent(name, { a: 1 });
  }
  trackSiteEvent('ok_name', undefined, undefined);
  flushSiteAnalytics();
  assert.deepEqual(
    (await hits()).map((hit) => hit.name),
    ['ok_name']
  );
});

await test('a bad property is dropped and the hit stays, at most eight are kept', async () => {
  browser();
  const { trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSiteEvent('mixed_props', {
    Bad_Key: 'x',
    ok: 'fine',
    nan: Number.NaN,
    inf: Infinity,
    obj: { a: 1 },
    nested: [1],
    typed: 'a query typed by someone, with a comma',
    empty: '',
    long: 'x'.repeat(121),
    edge: 'x'.repeat(120),
    leading: ' space',
    zero: 0,
    off: false,
  });
  trackSiteEvent('only_bad', { 'Bad Key': 1, tooLong: 'x'.repeat(200) });
  flushSiteAnalytics();
  const [mixed, onlyBad] = await hits();
  assert.deepEqual(mixed.props, { ok: 'fine', edge: 'x'.repeat(120), zero: 0, off: false });
  assert.equal('props' in onlyBad, false, 'an event with no valid property carries none');
});

await test('no more than eight properties go out', async () => {
  browser();
  const { trackSiteEvent, flushSiteAnalytics } = await facade();
  const props = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`k${i}`, i]));
  trackSiteEvent('wide_event', props);
  flushSiteAnalytics();
  assert.equal(Object.keys((await hits())[0].props).length, 8);
});

await test('letters of any language are text, a restaurant may be the entity', async () => {
  browser();
  const { trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSiteEvent(
    'unicode_event',
    { name: 'Königsklasse 2' },
    'A1B2C3D4-E5F6-4789-A012-3456789ABCDE'
  );
  flushSiteAnalytics();
  const [hit] = await hits();
  assert.equal(hit.props.name, 'Königsklasse 2');
  assert.equal(hit.entity, 'a1b2c3d4-e5f6-4789-a012-3456789abcde');
});

await test('a page read sends the post by its key and a park as the entity', async () => {
  browser({ path: '/de/blog/phantasialand-tipps' });
  const { trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSiteEvent('page_read', { kind: 'article', key: 'phantasialand-tips' });
  trackSiteEvent('page_read', { kind: 'park' }, '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d');
  flushSiteAnalytics();
  const [post, park] = await hits();
  assert.deepEqual(post.props, { kind: 'article', key: 'phantasialand-tips' });
  assert.equal(park.entity, '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d');
});

await test('the not-found page turns its pageview into not_found, queued or not yet', async () => {
  browser({ path: '/de/parks/europe/germany/gone' });
  const first = await facade();
  first.trackSitePageview();
  first.markPageNotFound();
  first.flushSiteAnalytics();
  assert.equal((await hits())[0].pageType, 'not_found', 'declared after the pageview');

  browser({ path: '/de/parks/europe/germany/gone' });
  const second = await facade();
  second.markPageNotFound();
  second.trackSitePageview();
  second.flushSiteAnalytics();
  assert.equal((await hits())[0].pageType, 'not_found', 'declared before the pageview');

  browser({ path: '/de/parks/europe/germany/bruehl/phantasialand' });
  second.trackSitePageview();
  second.flushSiteAnalytics();
  assert.equal((await hits())[0].pageType, 'park', 'the next page is a page again');
});

await test('a pageview goes ahead of the events its page sent while it mounted', async () => {
  browser({ path: '/en/parks/europe/germany/bruehl/phantasialand' });
  const { trackSitePageview, trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSitePageview();
  trackSiteEvent('compass_viewed');
  location.pathname = '/en/search';
  trackSiteEvent('search_opened', { surface: 'search_page' });
  trackSiteEvent('search_typed', { surface: 'search_page' });
  trackSitePageview();
  flushSiteAnalytics();
  assert.deepEqual(
    (await hits()).map((hit) => `${hit.t === 'pageview' ? 'view' : hit.name} ${hit.path}`),
    [
      'view /en/parks/europe/germany/bruehl/phantasialand',
      'compass_viewed /en/parks/europe/germany/bruehl/phantasialand',
      'view /en/search',
      'search_opened /en/search',
      'search_typed /en/search',
    ]
  );
});

await test('a gate that holds can be asked before work starts', async () => {
  browser();
  const open = await facade();
  assert.equal(open.canCountSite(), true);
  browser({ dnt: '1' });
  assert.equal((await facade()).canCountSite(), false);
});

await test('nothing is sent off the production hosts, or without a locale path', async () => {
  for (const page of [
    { host: 'localhost' },
    { host: 'park-fan-git-branch.vercel.app' },
    { path: '/admin/parks' },
    { path: '/' },
    { path: '/de/parks/%C3%A4' },
    { path: `/de/${'x'.repeat(101)}` },
    { path: '/de/a/b/c/d/e/f/g/h/i' },
  ]) {
    browser(page);
    const { trackSitePageview, trackSiteEvent, flushSiteAnalytics } = await facade();
    trackSitePageview();
    trackSiteEvent('compass_viewed', {});
    flushSiteAnalytics();
    assert.equal(requests.length, 0, JSON.stringify(page));
  }
});

await test('www.park.fan counts as production', async () => {
  browser({ host: 'www.park.fan' });
  const { trackSitePageview, flushSiteAnalytics } = await facade();
  trackSitePageview();
  flushSiteAnalytics();
  assert.equal(requests.length, 1);
});

await test('Do Not Track, Global Privacy Control, the opt-out and automation send nothing', async () => {
  for (const page of [
    { dnt: '1' },
    { dnt: 'yes' },
    { gpc: true },
    { storage: { 'umami.disabled': '1' } },
    { webdriver: true },
  ]) {
    browser(page);
    const { trackSitePageview, trackSiteEvent, flushSiteAnalytics } = await facade();
    trackSitePageview();
    trackSiteEvent('compass_viewed', {});
    flushSiteAnalytics();
    assert.equal(requests.length, 0, JSON.stringify(page));
  }
});

await test('a "0" Do Not Track and a cleared opt-out are counted', async () => {
  browser({ dnt: '0', storage: { 'umami.disabled': '0' } });
  const { trackSitePageview, flushSiteAnalytics } = await facade();
  trackSitePageview();
  flushSiteAnalytics();
  assert.equal(requests.length, 1);
});

await test('the team testing (?sim=, ?state=) is not a visitor', async () => {
  for (const search of ['?sim=in_park', '?sim=compass', '?state=rain', '?foo=1&sim=1']) {
    browser({ search });
    const { trackSitePageview, trackSiteEvent, flushSiteAnalytics } = await facade();
    trackSitePageview();
    trackSiteEvent('attraction_filter_used', { filter: 'wet' });
    flushSiteAnalytics();
    assert.equal(requests.length, 0, search);
  }
});

await test('hits are batched, twenty to a request', async () => {
  browser();
  const { trackSitePageview, trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSitePageview();
  for (let i = 0; i < 45; i++) trackSiteEvent('compass_viewed', {});
  // The pageview and 45 events: two full requests went out by themselves, the last six wait for
  // the timer or a flush.
  assert.equal(requests.length, 2);
  flushSiteAnalytics();
  assert.equal(requests.length, 3);
  const sizes = (await Promise.all(requests.map((r) => r.pending))).map((b) => b.hits.length);
  assert.deepEqual(sizes, [20, 20, 6]);
  assert.equal((await Promise.all(requests.map((r) => r.pending)))[0].v, 1);
});

/** `seconds` for each engagement hit, with the path it names, in the order they went out. */
async function engagement() {
  return (await hits())
    .filter((hit) => hit.t === 'engagement')
    .map((hit) => [hit.path, hit.seconds]);
}

await test('the foreground timer counts visible time, whole seconds, once', () => {
  let now = 0;
  const timer = new ForegroundTimer(() => now, true);
  now = 400;
  assert.equal(timer.take(), 0, 'under a second reports nothing');
  now = 5400;
  assert.equal(timer.take(), 5);
  assert.equal(timer.take(), 0, 'nothing new since the last read');
  timer.pause();
  now = 65400;
  assert.equal(timer.take(), 0, 'a hidden minute counts for nothing');
  timer.resume();
  now = 68000;
  assert.equal(timer.take(), 3, 'the fraction left over from 5.4 s is not lost: 8.0 s in all');
});

await test('the foreground timer starts paused in a hidden tab and stops at the cap', () => {
  let now = 10_000;
  const timer = new ForegroundTimer(() => now, false);
  now = 99_000;
  assert.equal(timer.take(), 0);
  timer.resume();
  now += 2000 * 1000;
  assert.equal(timer.take(), MAX_ENGAGEMENT_SECONDS);
  now += 500 * 1000;
  assert.equal(timer.take(), 0, 'the page view as a whole is capped');
});

await test('hiding the tab reports the foreground seconds, by beacon, once', async () => {
  browser({ path: '/de/parks/europe/germany/bruehl/phantasialand' });
  const { trackSitePageview } = await facade();
  trackSitePageview();
  clock.now += 12_000;
  fire('visibilitychange', 'hidden');
  fire('pagehide');
  assert.equal(requests.length, 1, 'the pagehide that follows has nothing left to send');
  assert.equal(requests[0].via, 'beacon');
  const [view, time] = (await requests[0].pending).hits;
  assert.equal(view.t, 'pageview');
  assert.deepEqual(time, {
    t: 'engagement',
    locale: 'de',
    path: '/de/parks/europe/germany/bruehl/phantasialand',
    pageType: 'park',
    seconds: 12,
  });
  assert.equal('referrer' in time, false);
});

await test('a tab that comes back reports only the time since it left', async () => {
  browser();
  const { trackSitePageview } = await facade();
  trackSitePageview();
  clock.now += 5000;
  fire('visibilitychange', 'hidden');
  clock.now += 600_000;
  fire('visibilitychange', 'visible');
  clock.now += 4000;
  fire('visibilitychange', 'hidden');
  assert.deepEqual(
    (await engagement()).map(([, seconds]) => seconds),
    [5, 4]
  );
});

await test('a navigation reports the page it leaves, under its own path, ahead of the next pageview', async () => {
  browser({ path: '/en/parks/europe/germany/bruehl/phantasialand' });
  const { trackSitePageview, trackSiteEvent, flushSiteAnalytics } = await facade();
  trackSitePageview();
  clock.now += 7000;
  navigate('/en/search');
  trackSiteEvent('search_opened', { surface: 'search_page' });
  trackSitePageview();
  clock.now += 3000;
  navigate('/en/favorites');
  trackSitePageview();
  flushSiteAnalytics();
  assert.deepEqual(
    (await hits()).map((hit) =>
      hit.t === 'event' ? hit.name : `${hit.t} ${hit.path}${hit.seconds ? ` ${hit.seconds}s` : ''}`
    ),
    [
      'pageview /en/parks/europe/germany/bruehl/phantasialand',
      'engagement /en/parks/europe/germany/bruehl/phantasialand 7s',
      'pageview /en/search',
      'search_opened',
      'engagement /en/search 3s',
      'pageview /en/favorites',
    ]
  );
});

await test('under a second and a hidden-at-load page send no engagement', async () => {
  browser();
  const quick = await facade();
  quick.trackSitePageview();
  clock.now += 400;
  fire('visibilitychange', 'hidden');
  assert.deepEqual(await engagement(), []);

  browser({ visibility: 'hidden' });
  const background = await facade();
  background.trackSitePageview();
  clock.now += 90_000;
  fire('visibilitychange', 'hidden');
  assert.deepEqual(await engagement(), [], 'a page opened in the background earns nothing');
  clock.now += 1000;
  fire('visibilitychange', 'visible');
  clock.now += 2000;
  fire('visibilitychange', 'hidden');
  assert.deepEqual(
    (await engagement()).map(([, seconds]) => seconds),
    [2]
  );
});

await test('one page view reports at most half an hour, however long it stays', async () => {
  browser();
  const { trackSitePageview } = await facade();
  trackSitePageview();
  clock.now += 3 * 3600 * 1000;
  fire('visibilitychange', 'hidden');
  fire('visibilitychange', 'visible');
  clock.now += 3600 * 1000;
  fire('visibilitychange', 'hidden');
  assert.deepEqual(
    (await engagement()).map(([, seconds]) => seconds),
    [1800]
  );
});

await test('engagement follows every gate of the pageview', async () => {
  for (const page of [
    { dnt: '1' },
    { gpc: true },
    { webdriver: true },
    { search: '?sim=1' },
    { host: 'localhost' },
  ]) {
    browser(page);
    const { trackSitePageview } = await facade();
    trackSitePageview();
    clock.now += 30_000;
    fire('visibilitychange', 'hidden');
    assert.equal(requests.length, 0, JSON.stringify(page));
  }
});

await test('the not-found page turns its engagement into not_found too', async () => {
  browser({ path: '/de/parks/europe/germany/gone' });
  const { trackSitePageview, markPageNotFound } = await facade();
  trackSitePageview();
  markPageNotFound();
  clock.now += 3000;
  fire('visibilitychange', 'hidden');
  const [, time] = await hits();
  assert.equal(time.t, 'engagement');
  assert.equal(time.pageType, 'not_found');
});

await test("a page load's first flush waits for its pageview, three seconds at most", async () => {
  const timers = [];
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn, ms) => timers.push({ fn, ms }) && timers.length;
  try {
    browser({ path: '/en/search' });
    const early = await facade();
    early.trackSiteEvent('search_opened', { surface: 'search_page' });
    assert.equal(requests.length, 0, 'the event does not leave first');
    assert.deepEqual(
      timers.map((timer) => timer.ms),
      [3000]
    );
    early.trackSitePageview();
    assert.equal(requests.length, 0, 'the pageview starts the normal one-second timer');
    assert.deepEqual(
      timers.map((timer) => timer.ms),
      [3000, 1000]
    );
    timers[1].fn();
    assert.deepEqual(
      (await hits()).map((hit) => hit.t),
      ['pageview', 'event'],
      "the pageview is ahead of its page's event"
    );

    timers.length = 0;
    browser({ path: '/en/search' });
    const lonely = await facade();
    lonely.trackSiteEvent('search_opened', { surface: 'search_page' });
    timers[0].fn();
    assert.equal(requests.length, 1, 'with no pageview in sight the wait ends after three seconds');
    lonely.trackSiteEvent('search_typed', { surface: 'search_page' });
    assert.equal(timers.at(-1).ms, 1000, 'and later hits flush on the usual timer');
  } finally {
    globalThis.setTimeout = realSetTimeout;
  }
});

await test('a tab that is hidden before the pageview does not keep events back', async () => {
  browser({ path: '/en/search' });
  const { trackSiteEvent } = await facade();
  trackSiteEvent('search_opened', { surface: 'search_page' });
  fire('visibilitychange', 'hidden');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].via, 'beacon');
});

console.log(`\n${passed} cases passed.`);
// The facade's flush timer would keep Node alive for a second after the last case.
process.exit(0);
