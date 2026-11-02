#!/usr/bin/env node
/**
 * Generate `lib/geo/world-map-data.ts` from `public/world.svg` (Simplemaps.com, MIT).
 *
 * The source SVG is 152 KB with one <path> per country — far too heavy to ship to the
 * client, and `lib/utils/geo-svg.ts` is server-only (fs). The hero's world map only
 * needs six clickable continent silhouettes, so this script:
 *
 *   1. groups every country path by continent (single-part countries carry `id="<ISO2>"`,
 *      multi-part countries carry `class="<Name>"` on each part),
 *   2. drops speck islands below an area threshold,
 *   3. simplifies each ring (Douglas-Peucker) and rounds coordinates,
 *   4. merges everything into ONE path per continent.
 *
 * Russia is grouped with Asia: most of its landmass is geographically Asian, and keeping
 * it out of Europe stops the Europe highlight from stretching to the Pacific (the OG
 * generator excludes RU from Europe for the same reason).
 *
 * Re-run with `node scripts/generate-hero-world-map.mjs` after changing thresholds.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public', 'world.svg');
const OUT = path.join(ROOT, 'lib', 'geo', 'world-map-data.ts');

/** Ring area below this (viewBox units², world is 2000×857) is a speck island — dropped. */
const MIN_RING_AREA = 130;
/** Douglas-Peucker tolerance in viewBox units (~2 px at natural size — the hero renders the
 * map at roughly a quarter of the 2000-unit viewBox width, so this stays invisible). */
const SIMPLIFY_EPSILON = 2.2;

const ISO_TO_CONTINENT = {
  // europe
  AL: 'europe',
  AT: 'europe',
  BA: 'europe',
  BE: 'europe',
  BG: 'europe',
  BY: 'europe',
  CH: 'europe',
  CZ: 'europe',
  DE: 'europe',
  EE: 'europe',
  ES: 'europe',
  FI: 'europe',
  HR: 'europe',
  HU: 'europe',
  IE: 'europe',
  IS: 'europe',
  LT: 'europe',
  LU: 'europe',
  LV: 'europe',
  MD: 'europe',
  ME: 'europe',
  MK: 'europe',
  NL: 'europe',
  PL: 'europe',
  PT: 'europe',
  RO: 'europe',
  RS: 'europe',
  SE: 'europe',
  SI: 'europe',
  SK: 'europe',
  UA: 'europe',
  XK: 'europe',
  // asia
  AE: 'asia',
  AF: 'asia',
  AM: 'asia',
  BD: 'asia',
  BH: 'asia',
  BN: 'asia',
  BT: 'asia',
  GE: 'asia',
  IL: 'asia',
  IN: 'asia',
  IQ: 'asia',
  IR: 'asia',
  JO: 'asia',
  KG: 'asia',
  KH: 'asia',
  KP: 'asia',
  KR: 'asia',
  KW: 'asia',
  KZ: 'asia',
  LA: 'asia',
  LB: 'asia',
  LK: 'asia',
  MM: 'asia',
  MN: 'asia',
  MV: 'asia',
  NP: 'asia',
  PK: 'asia',
  PS: 'asia',
  QA: 'asia',
  SA: 'asia',
  SY: 'asia',
  TH: 'asia',
  TJ: 'asia',
  TL: 'asia',
  TM: 'asia',
  TW: 'asia',
  UZ: 'asia',
  VN: 'asia',
  YE: 'asia',
  // africa
  BF: 'africa',
  BI: 'africa',
  BJ: 'africa',
  BW: 'africa',
  CD: 'africa',
  CF: 'africa',
  CG: 'africa',
  CI: 'africa',
  CM: 'africa',
  DJ: 'africa',
  DZ: 'africa',
  EG: 'africa',
  EH: 'africa',
  ER: 'africa',
  ET: 'africa',
  GA: 'africa',
  GH: 'africa',
  GM: 'africa',
  GN: 'africa',
  GQ: 'africa',
  GW: 'africa',
  KE: 'africa',
  LR: 'africa',
  LS: 'africa',
  LY: 'africa',
  MA: 'africa',
  MG: 'africa',
  ML: 'africa',
  MR: 'africa',
  MW: 'africa',
  MZ: 'africa',
  NA: 'africa',
  NE: 'africa',
  NG: 'africa',
  RE: 'africa',
  RW: 'africa',
  SD: 'africa',
  SL: 'africa',
  SN: 'africa',
  SO: 'africa',
  SS: 'africa',
  SZ: 'africa',
  TD: 'africa',
  TG: 'africa',
  TN: 'africa',
  TZ: 'africa',
  UG: 'africa',
  YT: 'africa',
  ZA: 'africa',
  ZM: 'africa',
  ZW: 'africa',
  // north-america (Greenland grouped here — it reads as part of the NA landmass)
  AI: 'north-america',
  AW: 'north-america',
  BB: 'north-america',
  BL: 'north-america',
  BM: 'north-america',
  BZ: 'north-america',
  CR: 'north-america',
  CU: 'north-america',
  CW: 'north-america',
  DM: 'north-america',
  DO: 'north-america',
  GD: 'north-america',
  GL: 'north-america',
  GT: 'north-america',
  HN: 'north-america',
  HT: 'north-america',
  JM: 'north-america',
  LC: 'north-america',
  MF: 'north-america',
  MQ: 'north-america',
  MS: 'north-america',
  MX: 'north-america',
  NI: 'north-america',
  PA: 'north-america',
  SV: 'north-america',
  SX: 'north-america',
  VC: 'north-america',
  VG: 'north-america',
  // south-america
  BO: 'south-america',
  BR: 'south-america',
  CO: 'south-america',
  EC: 'south-america',
  GF: 'south-america',
  GY: 'south-america',
  PE: 'south-america',
  PY: 'south-america',
  SR: 'south-america',
  UY: 'south-america',
  VE: 'south-america',
  // oceania
  GU: 'oceania',
  MH: 'oceania',
  NR: 'oceania',
  PW: 'oceania',
  TV: 'oceania',
};

const NAME_TO_CONTINENT = {
  'Canary Islands (Spain)': 'europe',
  Cyprus: 'europe',
  Denmark: 'europe',
  'Faeroe Islands': 'europe',
  France: 'europe',
  Greece: 'europe',
  Italy: 'europe',
  Malta: 'europe',
  Norway: 'europe',
  'United Kingdom': 'europe',
  Azerbaijan: 'asia',
  China: 'asia',
  Indonesia: 'asia',
  Japan: 'asia',
  Malaysia: 'asia',
  Oman: 'asia',
  Philippines: 'asia',
  'Russian Federation': 'asia',
  Turkey: 'asia',
  Angola: 'africa',
  'Cape Verde': 'africa',
  Comoros: 'africa',
  Mauritius: 'africa',
  Seychelles: 'africa',
  'São Tomé and Principe': 'africa',
  'Antigua and Barbuda': 'north-america',
  Bahamas: 'north-america',
  Canada: 'north-america',
  'Cayman Islands': 'north-america',
  Guadeloupe: 'north-america',
  'Puerto Rico': 'north-america',
  'Saint Kitts and Nevis': 'north-america',
  'Trinidad and Tobago': 'north-america',
  'Turks and Caicos Islands': 'north-america',
  'United States Virgin Islands': 'north-america',
  'United States': 'north-america',
  Argentina: 'south-america',
  Chile: 'south-america',
  'Falkland Islands': 'south-america',
  'American Samoa': 'oceania',
  Australia: 'oceania',
  'Federated States of Micronesia': 'oceania',
  Fiji: 'oceania',
  'French Polynesia': 'oceania',
  'New Caledonia': 'oceania',
  'New Zealand': 'oceania',
  'Northern Mariana Islands': 'oceania',
  'Papua New Guinea': 'oceania',
  Samoa: 'oceania',
  'Solomon Islands': 'oceania',
  Tonga: 'oceania',
  Vanuatu: 'oceania',
};

const CONTINENT_ORDER = ['europe', 'north-america', 'south-america', 'asia', 'oceania', 'africa'];

// --- SVG parsing (world.svg uses only M/m L/l H/h V/v Z — verified by geo-svg.ts) ---

/** @returns {{x:number,y:number}[][]} rings of absolute points */
function parseRings(d) {
  const tokens = d.match(/([MmLlHhVvZz])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g) ?? [];
  const rings = [];
  let ring = null;
  let x = 0;
  let y = 0;
  let cmd = 'M';
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[MmLlHhVvZz]$/.test(t)) {
      cmd = t;
      i++;
      if (cmd === 'Z' || cmd === 'z') {
        if (ring && ring.length >= 3) rings.push(ring);
        ring = null;
      }
      continue;
    }
    switch (cmd) {
      case 'M':
        x = num();
        y = num();
        ring = [{ x, y }];
        cmd = 'L'; // subsequent pairs are implicit LineTos
        continue;
      case 'm':
        x += num();
        y += num();
        ring = [{ x, y }];
        cmd = 'l';
        continue;
      case 'L':
        x = num();
        y = num();
        break;
      case 'l':
        x += num();
        y += num();
        break;
      case 'H':
        x = num();
        break;
      case 'h':
        x += num();
        break;
      case 'V':
        y = num();
        break;
      case 'v':
        y += num();
        break;
      default:
        i++;
        continue;
    }
    ring?.push({ x, y });
  }
  if (ring && ring.length >= 3) rings.push(ring);
  return rings;
}

function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function ringCentroid(ring) {
  let cx = 0;
  let cy = 0;
  for (const p of ring) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / ring.length, y: cy / ring.length };
}

/** Douglas-Peucker over an OPEN polyline (endpoints always kept). */
function simplifyLine(points, epsilon) {
  if (points.length <= 2) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    const a = points[start];
    const b = points[end];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    let maxDist = 0;
    let maxIdx = -1;
    for (let i = start + 1; i < end; i++) {
      const p = points[i];
      const dist =
        len < 1e-9
          ? Math.hypot(p.x - a.x, p.y - a.y)
          : Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }
    if (maxDist > epsilon && maxIdx > 0) {
      keep[maxIdx] = true;
      stack.push([start, maxIdx], [maxIdx, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * Douglas-Peucker for a CLOSED ring. The naive form uses first→last as its baseline, but in a
 * closed ring those are the same point — a degenerate baseline that collapses the whole ring.
 * Split at the point farthest from the start and simplify the two halves as open polylines.
 */
function simplify(ring, epsilon) {
  let pts = ring;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (Math.hypot(last.x - first.x, last.y - first.y) < 1e-6) pts = pts.slice(0, -1);
  if (pts.length <= 4) return pts;

  let split = 1;
  let maxDist = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[0].x, pts[i].y - pts[0].y);
    if (d > maxDist) {
      maxDist = d;
      split = i;
    }
  }
  const half1 = simplifyLine(pts.slice(0, split + 1), epsilon);
  const half2 = simplifyLine([...pts.slice(split), pts[0]], epsilon);
  // Drop half2's duplicated endpoints (its first point is half1's last, its last is the ring start).
  return [...half1, ...half2.slice(1, -1)];
}

const round1 = (n) => Math.round(n * 10) / 10;

function ringToPath(ring) {
  const parts = [`M${round1(ring[0].x)} ${round1(ring[0].y)}`];
  for (let i = 1; i < ring.length; i++) parts.push(`${round1(ring[i].x)} ${round1(ring[i].y)}`);
  return `${parts.join('L')}Z`;
}

// --- Main ---

const svg = fs.readFileSync(SRC, 'utf-8');
const byContinent = new Map(CONTINENT_ORDER.map((slug) => [slug, []]));
const unmapped = new Set();

const pathRegex = /<path\s+([^>]+)>/g;
let match;
while ((match = pathRegex.exec(svg)) !== null) {
  const attrs = match[1];
  const d = attrs.match(/d=["']([^"']+)["']/)?.[1];
  if (!d) continue;
  const id = attrs.match(/id=["']([^"']+)["']/)?.[1];
  const cls = attrs.match(/class=["']([^"']+)["']/)?.[1];
  const name = attrs.match(/name=["']([^"']+)["']/)?.[1];
  const continent =
    (id && ISO_TO_CONTINENT[id]) ??
    (cls && NAME_TO_CONTINENT[cls]) ??
    (name && NAME_TO_CONTINENT[name]);
  if (!continent) {
    unmapped.add(id ?? cls ?? name ?? '?');
    continue;
  }
  byContinent.get(continent).push(...parseRings(d));
}

if (unmapped.size) {
  console.warn(`Unmapped (skipped): ${[...unmapped].join(', ')}`);
}

const continents = CONTINENT_ORDER.map((slug) => {
  const rings = byContinent
    .get(slug)
    .filter((ring) => ringArea(ring) >= MIN_RING_AREA)
    .map((ring) => simplify(ring, SIMPLIFY_EPSILON))
    .filter((ring) => ring.length >= 3);

  // Area-weighted centroid across the continent's rings — starting point for bubble anchors.
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (const ring of rings) {
    const a = ringArea(ring);
    const c = ringCentroid(ring);
    area += a;
    cx += c.x * a;
    cy += c.y * a;
  }
  const d = rings.map(ringToPath).join('');
  const points = rings.reduce((n, r) => n + r.length, 0);
  console.log(
    `${slug}: ${rings.length} rings, ${points} points, ${(d.length / 1024).toFixed(1)} KB, centroid ${(cx / area).toFixed(0)},${(cy / area).toFixed(0)}`
  );
  return { slug, d };
});

const total = continents.reduce((n, c) => n + c.d.length, 0);
console.log(`total path data: ${(total / 1024).toFixed(1)} KB`);

const out = `// GENERATED FILE — do not edit by hand.
// Run \`node scripts/generate-hero-world-map.mjs\` to regenerate.
// Source: public/world.svg (Simplemaps.com, MIT). One simplified silhouette per continent
// for the homepage hero map; country detail and speck islands are intentionally dropped
// to keep this client-safe module small.

export type WorldMapContinentSlug =
${CONTINENT_ORDER.map((s) => `  | '${s}'`).join('\n')};

export const WORLD_MAP_VIEWBOX = '0 0 2000 857';

export const WORLD_MAP_CONTINENTS: { slug: WorldMapContinentSlug; d: string }[] = [
${continents.map((c) => `  { slug: '${c.slug}', d: '${c.d}' },`).join('\n')}
];
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${(out.length / 1024).toFixed(1)} KB)`);
