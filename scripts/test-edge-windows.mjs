/**
 * Every localized URL of a route that renders per request gets a shared-cache window from
 * `next.config.ts`.
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
import { PARK_STATS_SEGMENTS } from '../lib/parks/stats-segments.ts';
import { PARK_KIDS_SEGMENTS } from '../lib/parks/kids-segments.ts';

const PARK = 'parks/europe/germany/rust/europa-park';

/** The routes whose only cache is the edge window, as the URL each locale's reader requests. */
const ROUTES = {
  'blog/[slug]': (locale) => `/${locale}/blog/a-post`,
  'news/[slug]': (locale) => `/${locale}/news/a-news-post`,
  'glossary/[term]': (locale) => `/${locale}/${GLOSSARY_SEGMENTS[locale]}/airtime`,
  'average-wait-times': (locale) => `/${locale}/${PARK}/${PARK_STATS_SEGMENTS[locale]}`,
  'with-kids': (locale) => `/${locale}/${PARK}/${PARK_KIDS_SEGMENTS[locale]}`,
};

const rules = await nextConfig.headers();

/** The value a header ends up with for `path`: every matching rule applies, the last one wins. */
function headerFor(path, key) {
  let value;
  for (const rule of rules) {
    if (!getPathMatch(rule.source)(path)) continue;
    for (const header of rule.headers) {
      if (header.key.toLowerCase() === key) value = header.value;
    }
  }
  return value;
}

let passed = 0;
for (const [route, url] of Object.entries(ROUTES)) {
  for (const locale of locales) {
    const path = url(locale);
    const window = headerFor(path, 'cdn-cache-control');
    assert.ok(window, `${route}: ${path} gets no CDN-Cache-Control`);
    assert.match(window, /\bpublic\b/, `${route}: ${path} gets "${window}"`);
    assert.match(window, /\bs-maxage=\d+/, `${route}: ${path} gets "${window}"`);
    passed++;
  }
  console.log(`  ✓ ${route}: a window in all ${locales.length} locales`);
}

console.log(`\n${passed} passed`);
