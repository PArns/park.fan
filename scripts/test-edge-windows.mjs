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
  orlando: {
    url: (l) => `/${l}/orlando`,
    rule: (source) => source.endsWith('/orlando'),
  },
  'orlando/[year]/[month]': {
    url: (l) => `/${l}/orlando/2026/12`,
    rule: (source) => source.endsWith('/orlando/:year(\\d{4})/:month(\\d{1,2})'),
  },
  'orlando/best-time-to-visit': {
    url: (l) => `/${l}/orlando/${BEST_TIME_SEGMENTS[l]}`,
    rule: (source, l) => source.endsWith(`/orlando/${BEST_TIME_SEGMENTS[l]}`),
  },
  'orlando/best-time-to-visit/[resort]': {
    url: (l) => `/${l}/orlando/${BEST_TIME_SEGMENTS[l]}/universal-orlando`,
    rule: (source, l) => source.includes(`/orlando/${BEST_TIME_SEGMENTS[l]}/:resort`),
  },
  'with-kids': {
    url: (l) => `/${l}/${PARK}/${PARK_KIDS_SEGMENTS[l]}`,
    rule: (source, l) => source.endsWith(`/:park/${PARK_KIDS_SEGMENTS[l]}`),
  },
};

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

// The best-time pages under `/orlando/<segment>/<resort>` are two segments after `/orlando` too,
// and must not take the month pages' window.
for (const locale of locales) {
  const path = `/${locale}/orlando/beste-reisezeit/disney-world`;
  const { source } = headerFor(path, 'cdn-cache-control');
  assert.ok(!source?.includes('/orlando/:year'), `${path} matched the Orlando month rule`);
  passed++;
}
console.log('  ✓ a best-time path under /orlando is not an Orlando month');

console.log(`\n${passed} passed`);
