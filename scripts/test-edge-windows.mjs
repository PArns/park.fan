/**
 * Every localized URL of a route that renders per request gets a shared-cache window from its own
 * rule in `next.config.ts`.
 *
 * Run: `pnpm test:edge-windows`
 *
 * These routes are `force-dynamic`, so the page answers `Cache-Control: private, no-store` and the
 * `CDN-Cache-Control` rule is the only cache they have: Cloudflare's rule caches by that header and
 * bypasses without it. The segment lists in `next.config.ts` are hand copies of the modules below
 * (the config loads before the path aliases exist), and a segment missing there is a page that
 * renders on every request. The rules are matched the way Next matches them, against the URL a
 * browser asks for, before any rewrite. See docs/rules/an-isr-route-needs-both-halves.md.
 */
import assert from 'node:assert/strict';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match.js';
import nextConfig from '../next.config.ts';
import { locales } from '../i18n/config.ts';
import { GLOSSARY_SEGMENTS } from '../lib/glossary/segments.ts';
import { PARK_CALENDAR_SEGMENTS } from '../lib/parks/calendar-segments.ts';
import { PARK_STATS_SEGMENTS } from '../lib/parks/stats-segments.ts';
import { PARK_KIDS_SEGMENTS } from '../lib/parks/kids-segments.ts';
import { BEST_TIME_SEGMENTS } from '../lib/best-time/segments.ts';
import { RANKING_SEGMENTS } from '../lib/rankings/segments.ts';
import { LIVE_TRIP_REGIONS, tripRegionSegment } from '../lib/trip-regions/registry.ts';
import {
  FORECAST_WINDOW,
  NO_STORE,
  PARKY_TIP_NONE_WINDOW,
  PARKY_TIP_TODAY_WINDOW,
  CALENDAR_TODAY_WINDOW,
  PARKY_TIP_WINDOW,
  tagPurgedCacheHeaders,
} from '../lib/api/cdn-cache-headers.ts';

const PARK = 'parks/europe/germany/rust/europa-park';

/**
 * The routes whose only cache is the edge window: the URL each locale's reader requests, and the
 * rule that must decide its window. A sub-page answered by the ride rule's `:attraction` would
 * still pass a bare "has a window" check, with the wrong window.
 */
const ROUTES = {
  'blog/[slug]': {
    url: (l) => `/${l}/blog/a-post`,
    rule: (source) => source.includes(':section(blog|news)'),
  },
  'news/[slug]': {
    url: (l) => `/${l}/news/a-news-post`,
    rule: (source) => source.includes(':section(blog|news)'),
  },
  'glossary/[term]': {
    url: (l) => `/${l}/${GLOSSARY_SEGMENTS[l]}/airtime`,
    rule: (source, l) => source.endsWith(`/${GLOSSARY_SEGMENTS[l]}/:term`),
  },
  park: {
    url: (l) => `/${l}/${PARK}`,
    rule: (source) => source.endsWith('/:city/:park'),
  },
  ride: {
    url: (l) => `/${l}/${PARK}/silver-star`,
    rule: (source) => source.endsWith('/:park/:attraction'),
  },
  'wait-time-calendar': {
    url: (l) => `/${l}/${PARK}/${PARK_CALENDAR_SEGMENTS[l]}`,
    rule: (source, l) => source.endsWith(`/:park/${PARK_CALENDAR_SEGMENTS[l]}`),
  },
  'wait-time-calendar/[year]/[month]': {
    url: (l) => `/${l}/${PARK}/${PARK_CALENDAR_SEGMENTS[l]}/2026/10`,
    rule: (source, l) => source.endsWith(`/${PARK_CALENDAR_SEGMENTS[l]}/:year/:month`),
  },
  'average-wait-times': {
    url: (l) => `/${l}/${PARK}/${PARK_STATS_SEGMENTS[l]}`,
    rule: (source, l) => source.endsWith(`/:park/${PARK_STATS_SEGMENTS[l]}`),
  },
  'with-kids': {
    url: (l) => `/${l}/${PARK}/${PARK_KIDS_SEGMENTS[l]}`,
    rule: (source, l) => source.endsWith(`/:park/${PARK_KIDS_SEGMENTS[l]}`),
  },
  'longest-wait-times/[continent]/[country]/[year]': {
    url: (l) => `/${l}/${RANKING_SEGMENTS[l]}/europe/germany/2026`,
    rule: (source, l) => source.endsWith(`/${RANKING_SEGMENTS[l]}/:continent/:country/:year`),
  },
};

// Every live trip region's hub, a month, its best-time page and a resort's, under its own segment.
for (const region of LIVE_TRIP_REGIONS) {
  const seg = (l) => tripRegionSegment(region, l);
  const resort = region.bestTime.find((page) => page.segment)?.segment;
  ROUTES[`${region.slug}`] = {
    url: (l) => `/${l}/${seg(l)}`,
    rule: (source, l) => source.endsWith(`/${seg(l)}`),
  };
  ROUTES[`${region.slug}/[year]/[month]`] = {
    url: (l) => `/${l}/${seg(l)}/2026/12`,
    rule: (source, l) => source.endsWith(`/${seg(l)}/:year(\\d{4})/:month(\\d{1,2})`),
  };
  if (region.bestTime.length > 0) {
    ROUTES[`${region.slug}/best-time-to-visit`] = {
      url: (l) => `/${l}/${seg(l)}/${BEST_TIME_SEGMENTS[l]}`,
      rule: (source, l) => source.endsWith(`/${seg(l)}/${BEST_TIME_SEGMENTS[l]}`),
    };
  }
  if (resort) {
    ROUTES[`${region.slug}/best-time-to-visit/[resort]`] = {
      url: (l) => `/${l}/${seg(l)}/${BEST_TIME_SEGMENTS[l]}/${resort}`,
      rule: (source, l) => source.includes(`/${seg(l)}/${BEST_TIME_SEGMENTS[l]}/:resort`),
    };
  }
}

const rules = await nextConfig.headers();

/**
 * The value a header ends up with for `path`, and the source of the rule that set it: every
 * matching rule applies, the last one wins.
 */
function headerFor(path, key) {
  let value;
  let source;
  for (const rule of rules) {
    if (!getPathMatch(rule.source)(path)) continue;
    for (const header of rule.headers) {
      if (header.key.toLowerCase() === key) {
        value = header.value;
        source = rule.source;
      }
    }
  }
  return { value, source };
}

let passed = 0;
for (const [route, { url, rule }] of Object.entries(ROUTES)) {
  const windows = new Set();
  for (const locale of locales) {
    const path = url(locale);
    const { value, source } = headerFor(path, 'cdn-cache-control');
    assert.ok(value, `${route}: ${path} gets no CDN-Cache-Control`);
    assert.match(value, /\bpublic\b/, `${route}: ${path} gets "${value}"`);
    assert.match(value, /\bs-maxage=\d+/, `${route}: ${path} gets "${value}"`);
    assert.ok(rule(source, locale), `${route}: ${path} takes its window from ${source}`);
    windows.add(value);
    passed++;
  }
  console.log(`  ✓ ${route}: ${[...windows].join(' | ')} in all ${locales.length} locales`);
}

// A region's best-time pages under `/<segment>/<best-time segment>/<resort>` are two segments
// after the hub too, and must not take the month pages' window.
for (const region of LIVE_TRIP_REGIONS) {
  const resort = region.bestTime.find((page) => page.segment)?.segment;
  if (!resort) continue;
  for (const locale of locales) {
    const seg = tripRegionSegment(region, locale);
    const path = `/${locale}/${seg}/${BEST_TIME_SEGMENTS[locale]}/${resort}`;
    const { source } = headerFor(path, 'cdn-cache-control');
    assert.ok(!source?.includes(`/${seg}/:year`), `${path} matched the month rule`);
    passed++;
  }
  console.log(`  ✓ a best-time path under ${region.slug}'s hub is not a month`);
}

// The relays the backend rings by tag: under `next start` the rule decides, on Vercel the handler,
// so the rule must send exactly the handler's windows, and Cloudflare must get the short one. Where
// a handler sends more than one window, which a path rule cannot tell apart, the rule carries the
// shortest and must never outlast any of them: the calendar's for a range holding the park's today,
// the tip's for a 204.
const TAG = 'park-calendar:europe/germany/rust/europa-park';
const RUNG_KEYS = ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control'];
const RUNG_ROUTES = {
  calendar: {
    window: FORECAST_WINDOW,
    rule: CALENDAR_TODAY_WINDOW,
    sent: [FORECAST_WINDOW, CALENDAR_TODAY_WINDOW],
  },
  'best-days': { window: FORECAST_WINDOW, rule: FORECAST_WINDOW, sent: [FORECAST_WINDOW] },
  'parky-tip': {
    window: PARKY_TIP_WINDOW,
    rule: PARKY_TIP_NONE_WINDOW,
    sent: [PARKY_TIP_WINDOW, PARKY_TIP_TODAY_WINDOW, PARKY_TIP_NONE_WINDOW],
  },
};
const DIRECTIVES = ['max-age', 's-maxage', 'stale-while-revalidate'];
const seconds = (value, directive) =>
  Number(new RegExp(`\\b${directive}=(\\d+)`).exec(value)?.[1] ?? 0);
for (const [route, { window, rule, sent }] of Object.entries(RUNG_ROUTES)) {
  const path = `/api/${PARK}/${route}`;
  const handler = tagPurgedCacheHeaders(window, [TAG]);
  const ruled = tagPurgedCacheHeaders(rule, [TAG]);
  for (const key of RUNG_KEYS) {
    const { value } = headerFor(path, key.toLowerCase());
    assert.equal(
      value,
      ruled[key],
      `${path}: ${key} is "${value}", the handler sends "${ruled[key]}"`
    );
    for (const handled of sent) {
      const sentValue = tagPurgedCacheHeaders(handled, [TAG])[key];
      for (const directive of DIRECTIVES) {
        assert.ok(
          seconds(value, directive) <= seconds(sentValue, directive),
          `${path}: the rule's ${key} ${directive} outlasts the handler's "${sentValue}"`
        );
      }
    }
    passed++;
  }
  assert.match(
    handler['CDN-Cache-Control'],
    /\bs-maxage=3600\b/,
    `${route}: Cloudflare keeps an hour`
  );
  assert.match(
    handler['Vercel-CDN-Cache-Control'],
    /\bs-maxage=86400\b/,
    `${route}: Vercel keeps a day`
  );
  assert.equal(handler['Vercel-Cache-Tag'], TAG);
  passed += 3;
  console.log(
    `  ✓ /api/…/${route}: ${rule === window ? 'rule and handler agree' : 'the rule is the shortest window the handler sends'}, Vercel until the ring, Cloudflare an hour`
  );
}

// Today's tip says how busy the day has been so far, which moves during the day and no ring
// announces: Vercel and Cloudflare together keep it an hour at most, and the browser no longer than
// Cloudflare.
const todayTip = tagPurgedCacheHeaders(PARKY_TIP_TODAY_WINDOW, [TAG]);
const longest = (value) => seconds(value, 's-maxage') + seconds(value, 'stale-while-revalidate');
assert.ok(
  longest(todayTip['Vercel-CDN-Cache-Control']) + longest(todayTip['CDN-Cache-Control']) <= 3600,
  'parky-tip today: Vercel and Cloudflare together keep it longer than an hour'
);
assert.ok(
  seconds(todayTip['Cache-Control'], 'max-age') +
    seconds(todayTip['Cache-Control'], 'stale-while-revalidate') <=
    longest(todayTip['CDN-Cache-Control']),
  'parky-tip today: the browser keeps it longer than Cloudflare'
);
assert.equal(todayTip['Vercel-Cache-Tag'], TAG);
passed += 3;
console.log('  ✓ /api/…/parky-tip for today: an hour at most at Vercel and Cloudflare together');

// A calendar range holding the park's today carries its level so far, which moves without a ring:
// an hour at most at Vercel and Cloudflare together, and nothing in the browser's HTTP cache, as
// for any other range.
const todayCalendar = tagPurgedCacheHeaders(CALENDAR_TODAY_WINDOW, [TAG]);
assert.ok(
  longest(todayCalendar['Vercel-CDN-Cache-Control']) +
    longest(todayCalendar['CDN-Cache-Control']) <=
    3600,
  'calendar today: Vercel and Cloudflare together keep it longer than an hour'
);
assert.equal(seconds(todayCalendar['Cache-Control'], 'max-age'), 0);
assert.equal(todayCalendar['Vercel-Cache-Tag'], TAG);
passed += 3;
console.log('  ✓ /api/…/calendar holding today: an hour at most at Vercel and Cloudflare together');

// A tip relay's 204 is kept minutes everywhere, not until the ring: what the API has nothing to say
// about now (a spent budget, a failed call) it may have in an hour.
for (const key of RUNG_KEYS) {
  const value = tagPurgedCacheHeaders(PARKY_TIP_NONE_WINDOW, [TAG])[key];
  assert.ok(seconds(value, 's-maxage') > 0, `parky-tip 204: ${key} "${value}" keeps nothing`);
  for (const directive of DIRECTIVES) {
    assert.ok(
      seconds(value, directive) <= 600,
      `parky-tip 204: ${key} keeps ${directive} longer than minutes`
    );
  }
  passed++;
}
console.log('  ✓ /api/…/parky-tip 204: minutes in every cache');

// An error under a rung route's rule must not take any of the rule's windows, Vercel's included.
for (const key of RUNG_KEYS) {
  assert.match(NO_STORE[key] ?? '', /\bno-store\b/, `NO_STORE sends no ${key}`);
  passed++;
}
console.log("  ✓ NO_STORE overrides every header a rung route's rule sets");

console.log(`\n${passed} passed`);
