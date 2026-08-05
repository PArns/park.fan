#!/usr/bin/env node

/**
 * Generate the media database manifests from `public/media`.
 *
 * The database is the filesystem: every image under `public/media/<collection>/`
 * is a row, and its `<name>.json` sidecar is the metadata. This script walks the
 * tree, normalizes each sidecar through `lib/media/sidecar.mjs` (the same module
 * the admin write path uses, so hand-edited and UI-edited files agree), bakes in
 * what only the file itself knows (intrinsic size, byte size) and emits:
 *
 *   lib/media/manifest.ts        MEDIA_IMAGES — structural rows, no prose
 *   lib/media/manifest-text.ts   MEDIA_TEXT   — localized alt/caption, keyed by id
 *   lib/media/manifest-search.ts MEDIA_SEARCH — prebuilt search strings + revision
 *
 * Split for the same reason the blog manifest is split: six locales of alt and
 * caption for every image is the bulk of the bytes, and most consumers only need
 * to resolve a path. Anything that just renders an <Image> imports the small one.
 *
 * The search manifest is the reason free-text search does NOT drag the text
 * manifest along: the searchable surface (id + slugs + tags + every localized
 * string) is flattened here, at build time, so `/api/media` and the admin browser
 * can search all six locales while importing only two small files.
 *
 * It ships two structures, because word-prefix search and substring search have
 * different right answers:
 *
 *   - an **inverted index** — a sorted token vocabulary plus postings — so
 *     "arach" resolves through a binary search and a short forward walk instead
 *     of touching every row. This is what keeps search flat as the database
 *     grows; the vocabulary grows with distinct words, not with images.
 *   - the flattened **haystack** per image, as the fallback for a query that
 *     matches mid-word ("phobia"), which no prefix index can answer.
 *
 * Both fold diacritics, so "grun" finds "grün" and "asterix" finds "Astérix".
 *
 * Run: pnpm generate:media (also runs in prebuild)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASPECT_SUFFIX_RE,
  MEDIA_IMAGE_EXTENSIONS,
  normalizeSidecar,
} from '../lib/media/sidecar.mjs';
import { foldText, tokenize } from '../lib/media/tokenize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'public/media');
const MANIFEST_OUT = path.join(ROOT, 'lib/media/manifest.ts');
const TEXT_OUT = path.join(ROOT, 'lib/media/manifest-text.ts');
const SEARCH_OUT = path.join(ROOT, 'lib/media/manifest-search.ts');
const PARKS_OUT = path.join(ROOT, 'lib/media/manifest-parks.ts');
const HERO_OUT = path.join(ROOT, 'lib/media/manifest-hero.ts');

// sharp is a hard dependency, but a missing optional image step must never break
// the build — without it images simply carry no intrinsic dimensions, and the
// layouts fall back to height-auto (the behaviour before dimensions existed).
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️  sharp not available — media manifest will carry no dimensions.');
  sharp = null;
}

// Parses the raw EXIF block sharp hands back. Optional for the same reason.
let exifReader;
try {
  exifReader = (await import('exif-reader')).default;
} catch {
  exifReader = null;
}

const warnings = [];
const warn = (message) => warnings.push(message);

/** Every image file under `public/media`, recursively, ignoring generated crops. */
function collectImages(dirAbs, collection = '') {
  const out = [];
  for (const entry of fs
    .readdirSync(dirAbs, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectImages(abs, collection ? `${collection}/${entry.name}` : entry.name));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!MEDIA_IMAGE_EXTENSIONS.includes(ext)) continue;
    const base = path.basename(entry.name, ext);
    if (ASPECT_SUFFIX_RE.test(base)) continue; // cut by generate:image-crops, not a row
    out.push({ abs, collection, base, ext, file: entry.name });
  }
  return out;
}

/** DMS triplet + hemisphere ref → signed decimal degrees. */
function toDecimalDegrees(dms, ref) {
  if (!Array.isArray(dms) || dms.length < 2) return null;
  const [degrees = 0, minutes = 0, seconds = 0] = dms.map(Number);
  if (![degrees, minutes, seconds].every(Number.isFinite)) return null;
  const value = degrees + minutes / 60 + seconds / 3600;
  return ref === 'S' || ref === 'W' ? -value : value;
}

/**
 * Everything the file itself knows: painted size, and the EXIF the camera left
 * behind (capture date, GPS fix).
 *
 * The GPS fix is what lets the admin browser check an image's assigned park
 * against where it was actually taken, so it is worth reading even though most
 * web-optimized JPEGs have had their EXIF stripped.
 */
async function probeFile(abs) {
  const empty = { width: 0, height: 0, gps: null, exifShotAt: null };
  if (!sharp) return empty;

  let meta;
  try {
    meta = await sharp(abs).metadata();
  } catch (err) {
    warn(`could not read ${path.relative(ROOT, abs)}: ${err.message}`);
    return empty;
  }
  if (!meta.width || !meta.height) return empty;

  // EXIF orientations 5-8 swap the axes; the browser applies that rotation, so
  // the manifest has to report the size as painted, not as stored.
  const swap = Boolean(meta.orientation && meta.orientation >= 5);
  const size = swap
    ? { width: meta.height, height: meta.width }
    : { width: meta.width, height: meta.height };

  let gps = null;
  let exifShotAt = null;
  if (meta.exif && exifReader) {
    try {
      const tags = exifReader(meta.exif);
      const info = tags.GPSInfo;
      if (info) {
        const lat = toDecimalDegrees(info.GPSLatitude, info.GPSLatitudeRef);
        const lon = toDecimalDegrees(info.GPSLongitude, info.GPSLongitudeRef);
        if (lat !== null && lon !== null && (lat !== 0 || lon !== 0)) {
          gps = { lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)), source: 'exif' };
        }
      }
      const taken = tags.Photo?.DateTimeOriginal ?? tags.Image?.DateTime;
      if (taken instanceof Date && !Number.isNaN(taken.getTime())) {
        exifShotAt = taken.toISOString().slice(0, 10);
      }
    } catch {
      // Malformed EXIF is common in re-encoded images — not worth a warning.
    }
  }

  return { ...size, gps, exifShotAt };
}

/** Widest-first — 16:9 is the best generic thumbnail for a SERP surface. */
const ASPECTS = ['16x9', '4x3', '1x1'];

/**
 * Per-image content version: 8 hex chars over the file bytes and the focal point.
 *
 * This is what makes the database cacheable *aggressively* without going stale.
 * Image URLs are stable across deploys, so a global build id would bust every
 * image cache on every deploy — but a crop's URL stays the same while its bytes
 * change whenever the focal point is retargeted, so an unversioned URL would let
 * the CDN and the Next image optimizer serve the old crop indefinitely.
 *
 * Hashing the source and the focus together gives a token that changes exactly
 * when a rendition's pixels change, and never otherwise. Appended as `?v=`, it
 * becomes part of the optimizer's cache key, which is what lets everything
 * downstream be treated as immutable.
 */
function contentVersion(abs, focus) {
  return crypto
    .createHash('sha1')
    .update(fs.readFileSync(abs))
    .update(JSON.stringify(focus ?? null))
    .digest('hex')
    .slice(0, 8);
}

/**
 * The aspect-ratio crops that exist for an image, as public paths.
 *
 * Recorded here rather than probed at request time: `generate:image-crops` runs
 * immediately before this script in prebuild, so what is on disk now is exactly
 * what the deployment will serve. Baking it means the structured-data image set
 * costs no `fs` call per render, and can never advertise a crop that was not cut.
 */
function aspectVariants(abs, base, ext, collection) {
  const dir = path.dirname(abs);
  const prefix = `/media/${collection ? `${collection}/` : ''}`;
  const out = [];
  for (const aspect of ASPECTS) {
    const file = `${base}-${aspect}.jpg`;
    if (fs.existsSync(path.join(dir, file))) out.push(`${prefix}${file}`);
  }
  return out;
}

function readSidecar(abs, base, ext, id) {
  const sidecarPath = abs.slice(0, -ext.length) + '.json';
  if (!fs.existsSync(sidecarPath)) {
    warn(`${id}: no sidecar (${base}.json) — image carries no metadata`);
    return normalizeSidecar({});
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
  } catch (err) {
    warn(`${id}: sidecar is not valid JSON (${err.message})`);
    return normalizeSidecar({});
  }
  const result = normalizeSidecar(raw);
  for (const issue of result.issues) warn(`${id}: ${issue}`);
  return result;
}

async function build() {
  if (!fs.existsSync(MEDIA_DIR)) {
    console.error('❌ media directory not found:', MEDIA_DIR);
    process.exit(1);
  }

  const files = collectImages(MEDIA_DIR);
  const images = [];
  const text = {};

  for (const { abs, collection, base, ext, file } of files) {
    const id = collection ? `${collection}/${base}` : base;
    const { sidecar, text: localized } = readSidecar(abs, base, ext, id);
    const { width, height, gps, exifShotAt } = await probeFile(abs);

    images.push({
      id,
      collection,
      src: `/media/${collection ? `${collection}/` : ''}${file}`,
      width,
      height,
      bytes: fs.statSync(abs).size,
      format: ext.slice(1),
      park: sidecar.park,
      parkPath: sidecar.parkPath,
      ride: sidecar.ride,
      area: sidecar.area,
      title: sidecar.title ?? base,
      tags: sidecar.tags,
      roles: sidecar.roles,
      credit: sidecar.credit,
      // The sidecar wins over EXIF in both cases: it is the human's correction of
      // what the camera recorded (or failed to).
      shotAt: sidecar.shotAt ?? exifShotAt,
      order: sidecar.order,
      gps: sidecar.gps ?? gps,
      focus: sidecar.focus,
      version: contentVersion(abs, sidecar.focus),
      variants: aspectVariants(abs, base, ext, collection),
    });

    if (localized.alt || localized.caption) {
      text[id] = {};
      if (localized.alt) text[id].alt = localized.alt;
      if (localized.caption) text[id].caption = localized.caption;
    }
  }

  // Gallery order: explicit `order` first, then filename — so MEDIA_IMAGES is
  // already in the order a collection should render and no consumer re-sorts.
  images.sort((a, b) => {
    if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
    const ao = a.order ?? Number.POSITIVE_INFINITY;
    const bo = b.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });

  auditRoles(images);
  const catalog = await loadCatalog();
  const parkTables = writeParksManifest(images, catalog) ?? { byPath: {}, bySlug: {} };
  await verifySlugs(images, catalog);

  // Flatten the searchable surface once, here, so runtime search never has to
  // touch MEDIA_TEXT. Everything a human might type is folded in: the id, the
  // slugs, the tags, the credit and every localized alt/caption.
  const search = {};
  const postingsByToken = new Map();

  images.forEach((image, index) => {
    const localized = text[image.id];
    const surface = [
      image.id,
      image.title,
      image.park ?? '',
      image.ride ?? '',
      image.area ?? '',
      image.credit.author ?? '',
      ...image.tags,
      ...Object.values(localized?.alt ?? {}),
      ...Object.values(localized?.caption ?? {}),
    ]
      .filter(Boolean)
      .join(' ');

    search[image.id] = foldText(surface);

    for (const token of tokenize(surface)) {
      const postings = postingsByToken.get(token);
      // Postings are appended in ascending image order, so they come out sorted
      // for free — which is what lets the query side intersect them cheaply.
      if (postings) {
        if (postings[postings.length - 1] !== index) postings.push(index);
      } else postingsByToken.set(token, [index]);
    }
  });

  const vocabulary = [...postingsByToken.keys()].sort();
  const postings = vocabulary.map((token) => postingsByToken.get(token));

  return { images, text, search, vocabulary, postings, parkTables };
}

const API_BASE = 'https://api.park.fan';

/**
 * Park catalog, used to check that the slugs in the sidecars actually exist.
 *
 * The build must not fail because the API is unreachable, so every failure here
 * degrades to "skip verification" — the manifests are built from the filesystem
 * either way. Set MEDIA_VERIFY=0 to skip it deliberately (offline work, CI
 * without egress).
 */
async function loadCatalog() {
  if (process.env.MEDIA_VERIFY === '0') return null;
  try {
    const response = await fetch(`${API_BASE}/v1/parks?limit=1000`, {
      headers: { 'User-Agent': 'park.fan-build/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parks = (await response.json()).data ?? [];
    if (!parks.length) throw new Error('empty park list');

    const bySlug = new Map();
    for (const park of parks) {
      const list = bySlug.get(park.slug);
      if (list) list.push(park);
      else bySlug.set(park.slug, [park]);
    }
    return { parks, bySlug };
  } catch (err) {
    console.warn(`   ⚠️  Park catalog unreachable (${err.message}) — skipping slug verification.`);
    return null;
  }
}

/** Attractions of one park, keyed by the park's hierarchy path. Cached per run. */
const attractionCache = new Map();
async function loadAttractions(park) {
  const url = park.url ?? `/v1/parks/${park.slug}`;
  if (attractionCache.has(url)) return attractionCache.get(url);
  let slugs = null;
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: { 'User-Agent': 'park.fan-build/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok) {
      const body = await response.json();
      slugs = new Set((body.attractions ?? []).map((a) => a.slug));
    }
  } catch {
    // Leave null — a park we could not read simply isn't verified.
  }
  attractionCache.set(url, slugs);
  return slugs;
}

/**
 * Check every park and ride slug against the live catalog.
 *
 * The two failures this exists to catch are both silent otherwise: a slug that
 * drifted upstream (the image stops resolving and nothing errors), and an
 * ambiguous slug. Two parks in the catalog genuinely share a slug —
 * `disneyland-park` is both Anaheim and Paris — so a bare slug there is not an
 * identity, and the sidecar has to say which park it means via `parkPath`.
 */
/**
 * Emit the park reference table the UI needs: display name, city, country and
 * page path for every park the database has images of.
 *
 * Written ONLY when the catalog was reachable, and committed to the repo. That
 * combination is deliberate — an offline or rate-limited build keeps the last
 * known values instead of regenerating an empty table, which is how the previous
 * hero-image generator silently dropped every ride name from the homepage caption
 * on a single transient API blip.
 */
function writeParksManifest(images, catalog) {
  if (!catalog) {
    console.warn('   ⚠️  Catalog unavailable — keeping the committed park reference table.');
    // Re-read the committed table so the hero captions survive an offline build
    // instead of silently losing every park name.
    return readCommittedParkRefs();
  }

  const wanted = new Set(images.map((i) => i.park).filter(Boolean));
  const byPath = {};
  const bySlug = {};

  // Sorted by path, because the API does not promise an order and "first writer
  // wins" below turns that into a coin toss. It flipped once already: the same
  // sources regenerated `universal-islands-of-adventure` from Orlando to Tampa,
  // which is both a spurious diff and a silent change to what a slug-only lookup
  // resolves to. Sorting makes the generator a function of its inputs again.
  const relevant = catalog.parks
    .filter((park) => wanted.has(park.slug))
    .map((park) => ({ park, segments: (park.url ?? '').split('/').filter(Boolean).slice(2) }))
    // API url shape: /v1/parks/{continent}/{country}/{city}/{slug}
    .filter(({ segments }) => segments.length === 4)
    .sort((a, b) => a.segments.join('/').localeCompare(b.segments.join('/')));

  for (const { park, segments } of relevant) {
    const parkPath = segments.join('/');
    byPath[parkPath] = {
      slug: park.slug,
      name: park.name,
      city: park.city ?? null,
      // Matches the `geo.countries.*` translation key.
      countrySlug: segments[1],
      path: parkPath,
    };
    // First writer wins for a colliding slug; images that care carry `parkPath`.
    bySlug[park.slug] ??= parkPath;
  }

  fs.writeFileSync(
    PARKS_OUT,
    `${header('generate-media-manifest.mjs')}
import type { MediaParkRef } from './types';

/** Park reference data for every park the media database has images of, by path. */
export const MEDIA_PARKS: Record<string, MediaParkRef> = ${JSON.stringify(byPath, null, 2)};

/**
 * Default path per slug. Two slugs in the catalog are not unique
 * (\`disneyland-park\`, \`universal-islands-of-adventure\`); images of those carry
 * an explicit \`parkPath\` and never rely on this.
 */
export const MEDIA_PARK_PATH_BY_SLUG: Record<string, string> = ${JSON.stringify(bySlug, null, 2)};
`,
    'utf8'
  );

  return { byPath, bySlug };
}

/** Parse the committed manifest-parks.ts back into objects (offline builds). */
function readCommittedParkRefs() {
  try {
    const source = fs.readFileSync(PARKS_OUT, 'utf8');
    const grab = (name) => {
      const start = source.indexOf(`${name} = `);
      if (start < 0) return {};
      const open = source.indexOf('{', start);
      const end = source.indexOf('\n};', open);
      return JSON.parse(source.slice(open, end + 2));
    };
    return { byPath: grab('MEDIA_PARKS'), bySlug: grab('MEDIA_PARK_PATH_BY_SLUG') };
  } catch {
    return { byPath: {}, bySlug: {} };
  }
}

async function verifySlugs(images, catalog) {
  if (!catalog) return;

  const parksUsed = new Map();
  for (const image of images) {
    if (image.park) parksUsed.set(image.park, image);
  }

  for (const [slug, sample] of parksUsed) {
    const matches = catalog.bySlug.get(slug);
    if (!matches) {
      warn(`park "${slug}" is not in the catalog (e.g. ${sample.id})`);
      continue;
    }
    if (matches.length > 1) {
      const ambiguous = images.filter((i) => i.park === slug && !i.parkPath);
      if (ambiguous.length) {
        const where = matches.map((p) => `${p.city}/${p.country}`).join(' vs ');
        warn(
          `park "${slug}" is ambiguous (${where}) — set parkPath on: ${ambiguous
            .map((i) => i.id)
            .join(', ')}`
        );
      }
    }
  }

  for (const image of images) {
    if (!image.ride || !image.park) continue;
    const matches = catalog.bySlug.get(image.park);
    if (!matches) continue;
    // With a colliding slug, verify against the park the sidecar actually named.
    const park =
      matches.find((p) => image.parkPath && (p.url ?? '').endsWith(`/${image.parkPath}`)) ??
      matches[0];
    const slugs = await loadAttractions(park);
    if (slugs && !slugs.has(image.ride)) {
      warn(`${image.id}: ride "${image.ride}" is not an attraction of ${image.park}`);
    }
  }
}

/**
 * Roles are claims about uniqueness ("this is THE background for Europa-Park"),
 * so a second claimant is a data error the build should surface rather than
 * resolve by array order.
 */
function auditRoles(images) {
  const backgrounds = new Map();
  const rideCards = new Map();

  for (const img of images) {
    if (img.roles.includes('park-background')) {
      if (!img.park) warn(`${img.id}: role park-background but no park set`);
      else if (backgrounds.has(img.park)) {
        warn(
          `park ${img.park}: two park-background images (${backgrounds.get(img.park)}, ${img.id})`
        );
      } else backgrounds.set(img.park, img.id);
    }
    if (img.roles.includes('ride-card')) {
      if (!img.park || !img.ride) warn(`${img.id}: role ride-card needs both park and ride`);
      else {
        const key = `${img.park}/${img.ride}`;
        if (rideCards.has(key))
          warn(`ride ${key}: two ride-card images (${rideCards.get(key)}, ${img.id})`);
        else rideCards.set(key, img.id);
      }
    }
  }
}

function header(script) {
  return `// Auto-generated by scripts/${script}
// DO NOT EDIT MANUALLY — edit the sidecar JSON next to the image and re-run
// 'pnpm generate:media' (also runs in prebuild).
`;
}

const { images, text, search, vocabulary, postings, parkTables } = await build();
const parkRefs = parkTables.byPath;
const parkPathBySlug = parkTables.bySlug;

// Content hash over everything the manifests contain. It changes when — and only
// when — the database changes, which is what lets `/api/media` hand out a strong
// ETag and a long max-age instead of guessing a TTL for data that only moves on
// deploy. Clients (the native app) can also compare it to decide whether to
// re-download the catalog at all.
const revision = crypto
  .createHash('sha256')
  .update(JSON.stringify({ images, text }))
  .digest('hex')
  .slice(0, 12);

fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });

fs.writeFileSync(
  MANIFEST_OUT,
  `${header('generate-media-manifest.mjs')}
import type { MediaImage } from './types';

/**
 * Every image in the database, in collection + gallery order.
 *
 * Structural data only — localized alt/caption live in './manifest-text' so a
 * component that just needs a path doesn't pull six locales of prose into its
 * bundle.
 */
export const MEDIA_IMAGES: readonly MediaImage[] = ${JSON.stringify(images, null, 2)};
`,
  'utf8'
);

fs.writeFileSync(
  TEXT_OUT,
  `${header('generate-media-manifest.mjs')}
import type { MediaText } from './types';

/** Localized alt/caption per image id. Absent id = image ships no prose. */
export const MEDIA_TEXT: Record<string, MediaText> = ${JSON.stringify(text, null, 2)};
`,
  'utf8'
);

fs.writeFileSync(
  SEARCH_OUT,
  `${header('generate-media-manifest.mjs')}
/**
 * Content hash of the whole database. Changes only when the database changes,
 * so it doubles as the ETag for /api/media and as the "do I need to re-sync"
 * marker for offline clients.
 */
export const MEDIA_REVISION = ${JSON.stringify(revision)};

/**
 * Prebuilt, lower-cased haystack per image id: id, slugs, area, tags, credit and
 * every localized alt/caption folded into one string. Lets search cover all six
 * locales without importing './manifest-text'.
 */
export const MEDIA_SEARCH: Record<string, string> = ${JSON.stringify(search, null, 2)};

/**
 * Sorted token vocabulary. A prefix query binary-searches this and walks forward
 * while entries still share the prefix, so lookup cost tracks the number of
 * matches rather than the number of images.
 */
export const MEDIA_VOCABULARY: readonly string[] = ${JSON.stringify(vocabulary)};

/**
 * Postings parallel to MEDIA_VOCABULARY: indexes into MEDIA_IMAGES, ascending.
 * Sorted order is what lets multi-word queries intersect in a linear merge.
 */
export const MEDIA_POSTINGS: readonly (readonly number[])[] = ${JSON.stringify(postings)};
`,
  'utf8'
);

// ─── client-safe hero slice ──────────────────────────────────────────────────

// The hero rotation runs in CLIENT components (the crossfade, the in-park switch,
// the caption that follows it), so whatever they import is shipped to every
// visitor. The full manifest is ~107 KB and none of it is needed there, so this
// emits only the hero images and only the fields the caption paints — the same
// shape the old generated hero-images.ts / hero-images-meta.ts pair had.
const heroImages = images.filter((i) => i.roles.includes('hero'));
const heroSrcs = [];
const heroByPark = {};
const heroMeta = {};

for (const image of heroImages) {
  const src = `${image.src}?v=${image.version}`;
  heroSrcs.push(src);
  if (image.park) (heroByPark[image.park] ??= []).push(src);

  const parkPath = image.parkPath ?? parkPathBySlug[image.park] ?? null;
  const park = parkPath ? parkRefs[parkPath] : null;
  heroMeta[src] = {
    parkName: park?.name ?? '',
    city: park?.city ?? '',
    countrySlug: park?.countrySlug ?? '',
    parkUrl: park ? `/parks/${park.path}` : undefined,
    attractionName: image.ride ? image.title : undefined,
    area: image.area ?? undefined,
    // Carried along so background components can honour the focal point without
    // pulling the catalog into the client bundle.
    focus: image.focus ?? undefined,
  };
}

fs.writeFileSync(
  HERO_OUT,
  `${header('generate-media-manifest.mjs')}
import type { HeroImageMeta } from './hero';

/**
 * The hero rotation pool, as public paths. CLIENT-SAFE: this file exists so the
 * hero components never import the full media manifest.
 */
export const HERO_SRCS: readonly string[] = ${JSON.stringify(heroSrcs, null, 2)};

/** Hero images per park, for the in-park rotation. */
export const HERO_BY_PARK: Record<string, string[]> = ${JSON.stringify(heroByPark, null, 2)};

/** Caption data per hero image path. */
export const HERO_META: Record<string, HeroImageMeta> = ${JSON.stringify(heroMeta, null, 2)};
`,
  'utf8'
);

// ─── report ──────────────────────────────────────────────────────────────────

const unlicensed = images.filter((i) => i.credit.license === 'unknown').length;
const unassigned = images.filter((i) => !i.park).length;
const collections = new Set(images.map((i) => i.collection)).size;

console.log(
  `🖼️  Media database: ${images.length} images in ${collections} collections (rev ${revision}).`
);
console.log(`   ${Object.keys(text).length} carry localized text.`);
if (unlicensed) console.log(`   ⚠️  ${unlicensed} with unestablished rights (license: unknown).`);
if (unassigned) console.log(`   ⚠️  ${unassigned} without a park assigned.`);
for (const message of warnings) console.log(`   ⚠️  ${message}`);
for (const out of [MANIFEST_OUT, TEXT_OUT, SEARCH_OUT]) {
  console.log(
    `✅ Wrote ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(1)} KB).`
  );
}
