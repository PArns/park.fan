/**
 * Every slug a blog widget or reference points at, checked against what the API serves today.
 *
 * Run: pnpm check:blog-slugs   (hits api.park.fan; no local server needed)
 *
 * A widget resolves its park through `resolvePark`, which is an exact lookup in the geo index —
 * so when the API renames a park, the widget stops resolving and the post renders
 * "Park „<slug>" wurde nicht gefunden" in all six locales. Nothing else catches it: the build is
 * green, the manifest generator only validates `parkLinks`/`rideLinks`, and the API keeps
 * answering the old slug with a 301, which makes the rename invisible from a browser.
 *
 * It has happened twice. `disney-magic-kingdom` → `magic-kingdom-park` broke one stats widget, and
 * `toverland` → `attractiepark-toverland` broke four widgets (map, best-days, stats, weather) in
 * the Toverland post. Both times the prose references had been pulled along and the `slug=` attrs
 * had not.
 *
 * Checked here:
 *   - `slug=` on the park widgets (park, map, weather, best-days, stats) and `park=` on
 *     attraction-widget → the geo index
 *   - `slug=` on glossary-widget → the term ids in content/glossary/en.ts
 *   - `(ref:…)`, `(park:…)`, `(attraction:…)` link targets, in both the bare-slug and the
 *     `/parks/<continent>/<country>/<city>/<park>` form → the same index
 *
 * Exits non-zero on the first unresolvable reference, listing every file it appears in.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { getServerApiHeaders } from '../lib/api/client.ts';

const API = process.env.CHECK_API ?? 'https://api.park.fan';
const BLOG_DIR = 'content/blog';

/** Park widgets that take a park `slug=`; the rest carry their own kind of id. */
const PARK_WIDGETS = new Set([
  'park-widget',
  'map-widget',
  'weather-widget',
  'best-days-widget',
  'stats-widget',
]);

const WIDGET = /```([a-z][a-z0-9-]*-widget)([^\n`]*)\n([\s\S]*?)\n?```/gm;
const REF = /\((?:ref|park|attraction):([^)?\s]+)/g;
const attr = (key) => new RegExp(`\\b${key}\\s*[:=]\\s*([A-Za-z0-9\\-/_]+)`, 'g');

function collect(re, text) {
  return [...text.matchAll(re)].map((m) => m[1]);
}

async function parkIndex() {
  // Named the way the app names itself, from the same helper — an ad-hoc
  // User-Agent is a second client to allow at the edge, and gets a 403.
  const res = await fetch(`${API}/v1/discovery/geo`, { headers: getServerApiHeaders() });
  if (!res.ok) throw new Error(`geo structure: ${res.status} ${res.statusText}`);
  const geo = await res.json();
  const slugs = new Set();
  const paths = new Set();
  for (const continent of geo.continents ?? []) {
    for (const country of continent.countries ?? []) {
      for (const city of country.cities ?? []) {
        for (const park of city.parks ?? []) {
          slugs.add(park.slug);
          paths.add(`${continent.slug}/${country.slug}/${city.slug}/${park.slug}`);
        }
      }
    }
  }
  return { slugs, paths };
}

/** Term ids off the English glossary — the id set is shared by every locale. */
function glossaryIds() {
  const source = readFileSync('content/glossary/en.ts', 'utf8');
  return new Set(collect(/^\s+id:\s*'([^']+)'/gm, source));
}

function blogFiles() {
  const files = [];
  for (const locale of readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue;
    for (const entry of readdirSync(join(BLOG_DIR, locale.name))) {
      if (entry.endsWith('.md')) files.push(join(BLOG_DIR, locale.name, entry));
    }
  }
  return files.sort();
}

const { slugs, paths } = await parkIndex();
const terms = glossaryIds();

/** problem → the files it appears in */
const broken = new Map();
const counts = { parkWidget: 0, glossary: 0, reference: 0 };

const report = (problem, file) => {
  if (!broken.has(problem)) broken.set(problem, new Set());
  broken.get(problem).add(file);
};

for (const file of blogFiles()) {
  const body = readFileSync(file, 'utf8');

  for (const [, name, info, inner] of body.matchAll(WIDGET)) {
    const blob = `${info}\n${inner}`;
    if (PARK_WIDGETS.has(name)) {
      for (const slug of collect(attr('slug'), blob)) {
        counts.parkWidget++;
        if (!slugs.has(slug)) report(`park slug "${slug}" (${name})`, file);
      }
    } else if (name === 'glossary-widget') {
      for (const id of collect(attr('slug'), blob)) {
        counts.glossary++;
        if (!terms.has(id)) report(`glossary term "${id}"`, file);
      }
    } else if (name === 'attraction-widget') {
      for (const slug of collect(attr('park'), blob)) {
        counts.parkWidget++;
        if (!slugs.has(slug)) report(`park slug "${slug}" (attraction-widget)`, file);
      }
    }
  }

  for (const target of collect(REF, body)) {
    counts.reference++;
    const clean = target.replace(/^\/+|\/+$/g, '');
    if (clean.startsWith('parks/')) {
      // `/parks/<continent>/<country>/<city>/<park>[/<ride>]`
      const segments = clean.split('/');
      const geoPath = segments.slice(1, 5).join('/');
      if (segments.length >= 5 && !paths.has(geoPath)) report(`reference path "/${clean}"`, file);
    } else if (!slugs.has(clean.split('/')[0])) {
      report(`reference park slug "${clean.split('/')[0]}"`, file);
    }
  }
}

const total = counts.parkWidget + counts.glossary + counts.reference;
if (broken.size === 0) {
  console.log(
    `✅ Blog slugs resolve — ${total} references checked ` +
      `(${counts.parkWidget} widget parks, ${counts.glossary} glossary terms, ${counts.reference} links) ` +
      `against ${slugs.size} parks.`
  );
  process.exit(0);
}

console.error(`❌ ${broken.size} unresolvable reference(s) in the blog:\n`);
for (const [problem, files] of [...broken].sort(([a], [b]) => a.localeCompare(b))) {
  console.error(`  ${problem}`);
  for (const file of [...files].sort()) console.error(`      ${file}`);
}
console.error(
  '\nA park the API renamed keeps answering its old slug with a 301, but `resolvePark` looks it up\n' +
    'exactly — so the widget renders "not found" while the URL still works in a browser.'
);
process.exit(1);
