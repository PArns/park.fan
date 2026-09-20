#!/usr/bin/env node
/**
 * Assert that the header still carries its hub links in the HTML a crawler is served.
 *
 * Rule 1 of `components/layout/nav-menu.tsx` is what the whole header navigation rests on: a
 * panel's markup is always in the document and merely `hidden`, never unmounted. A crawler does
 * not hover, so a panel mounted on first open contributes nothing to the link graph — and the
 * continent and country links are in the header for no other reason than the link graph.
 *
 * Nothing used to check that. A later `{open && children}` in `NavMenu`, a `next/dynamic` around
 * a panel, or a panel dropped from the bar would take 33 hub links off ~35,000 pages with
 * `pnpm lint`, `pnpm build` and `pnpm check:client-messages` all green.
 *
 * WHY THIS FETCHES HTML INSTEAD OF DRIVING A BROWSER
 *
 * The premise of the rule is a reader that does not hover and runs no JavaScript here. A
 * Playwright run would see the panel after hydration and would therefore be blind to exactly the
 * regression this guards. Plain `fetch` is the crawler's view.
 *
 * WHERE THE EXPECTED LINKS COME FROM — NOT FROM THE PAGE
 *
 * The five hub paths per locale come from the segment modules the header itself links with. The
 * continent and country slugs come from `/v1/discovery/continents`, the same source `getGeoMenu()`
 * reads, so the number follows the inventory instead of being a 28 typed in here. An empty or
 * unreachable API FAILS the check rather than passing it against an empty expectation: the header
 * swallows that case on purpose (`catchNonFatal` in `lib/navigation/geo-menu.ts` renders the bar
 * without the geographic pane), which is the one way this could have gone green with nothing
 * checked. Every run prints how many links it compared (see G-72).
 *
 * Links are read out of the `<header>` element alone, so a match is the header's and never a
 * breadcrumb or a body link that happens to point at the same hub.
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:header-links
 *     BASE=http://localhost:3001 pnpm check:header-links
 *     pnpm check:header-links --path=/blog
 */

import { locales } from '@/i18n/config';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';

const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;

const BASE = (process.env.BASE ?? arg('base', 'http://localhost:3000')).replace(/\/$/, '');
const API = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan').replace(/\/$/, '');

/**
 * The route whose header is read. Any route serves the same header, so this is a sample and not a
 * subject — `/parks/europe/germany` is the one the PAR-191 run verified by hand.
 */
const PATH = arg('path', '/parks/europe/germany');

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

/**
 * The `<header>` element's markup, depth-aware so a nested `<header>` cannot end the slice early.
 * Returns null when the document has none, which is itself a failure worth naming.
 */
function headerMarkup(html) {
  const open = /<header[\s>]/gi;
  const first = open.exec(html);
  if (!first) return null;

  const tags = /<(\/?)header[\s>]/gi;
  tags.lastIndex = first.index;
  let depth = 0;
  let tag;
  while ((tag = tags.exec(html)) !== null) {
    depth += tag[1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(first.index, tags.lastIndex);
  }
  return html.slice(first.index);
}

/** Every `href` value in a chunk of markup, as a set of paths. */
function hrefs(markup) {
  return new Set(Array.from(markup.matchAll(/href="([^"]*)"/g), (m) => m[1]));
}

console.log(`\nheader links of ${BASE}${PATH}\n`);

// ── the expectation, from the same source the header reads ───────────────────
let continents = [];
try {
  const response = await fetch(`${API}/v1/discovery/continents`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  continents = await response.json();
} catch (error) {
  check('discovery API answers', false, `${API}/v1/discovery/continents: ${error.message}`);
}

/** Mirrors `getGeoMenu()`: a continent with no countries is not rendered. */
const geoPaths = continents
  .filter((continent) => (continent.countries ?? []).length > 0)
  .flatMap((continent) => [
    `/parks/${continent.slug}`,
    ...continent.countries.map((country) => `/parks/${continent.slug}/${country.slug}`),
  ]);

const continentCount = geoPaths.filter((p) => p.split('/').length === 3).length;
const countryCount = geoPaths.length - continentCount;

// The guard against a green run over an empty expectation: the header renders its plain links
// without the geographic pane when the API is down, and that must not read as "nothing missing".
check(
  'discovery API names continents and countries',
  geoPaths.length > 0,
  `${continentCount} continents + ${countryCount} countries = ${geoPaths.length} geo links expected`
);
if (geoPaths.length === 0) {
  console.log('\nNo expectation to check against — stopping here rather than passing.\n');
  process.exit(1);
}

// ── the header of every locale ───────────────────────────────────────────────
let compared = 0;

for (const locale of locales) {
  const url = `${BASE}/${locale}${PATH}`;
  let html;
  try {
    const response = await fetch(url, { redirect: 'manual' });
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
  } catch (error) {
    check(`${locale}: page serves`, false, `${url}: ${error.message}`);
    continue;
  }

  const header = headerMarkup(html);
  if (header === null) {
    check(`${locale}: document has a <header>`, false, url);
    continue;
  }

  const found = hrefs(header);
  const expected = [
    `/${locale}/parks`,
    `/${locale}/blog`,
    `/${locale}/${BEST_TIME_SEGMENTS[locale]}`,
    `/${locale}/${GLOSSARY_SEGMENTS[locale]}`,
    `/${locale}/${HOWTO_SEGMENTS[locale]}`,
    ...geoPaths.map((path) => `/${locale}${path}`),
  ];

  const missing = expected.filter((path) => !found.has(path));
  compared += expected.length;
  check(
    `${locale}: ${expected.length - missing.length}/${expected.length} header links present`,
    missing.length === 0,
    missing.length > 0 ? `missing ${missing.join(', ')}` : ''
  );
}

console.log(`\n${compared} links compared across ${locales.length} locales.`);
console.log(failures === 0 ? 'Header link graph intact.\n' : `${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
