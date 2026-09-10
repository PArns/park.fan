#!/usr/bin/env node

/**
 * Generate aspect-ratio crops (16:9 / 4:3 / 1:1) for every photo in the media
 * database, for the structured-data image sets (see lib/utils/park-assets.ts).
 *
 * Google prefers the same picture supplied in several aspect ratios so it can
 * pick the best crop per SERP surface. We cut those crops from the CURRENT
 * assets at build time — they are never hand-authored. Output files are
 * gitignored (`*-16x9|4x3|1x1.jpg`) and therefore absent from a fresh clone.
 *
 * Crops are cut at the largest size that fits the source WITHOUT upscaling
 * (most photos are ≤1024px), using content-aware cropping.
 *
 * Runs BEFORE `generate:media` in prebuild: the media manifest records which
 * crops exist per image, which is what lets the structured-data image set be
 * resolved from the manifest instead of hitting the filesystem at request time.
 *
 * ## Why this step is content-addressed and parallel (Sep 2026)
 *
 * It was the most expensive thing in the whole build and both halves of that
 * were accidental. MEASURED on a 4-core box, 142 sources → 426 crops:
 *
 * | variant                                  | wall-clock |
 * | ---------------------------------------- | ---------: |
 * | sequential, no cache (what shipped)      |   125.94 s |
 * | concurrency 2                            |    62.91 s |
 * | concurrency 4                            |    33.98 s |
 * | concurrency 8 (4 cores — past the knee)  |    35.43 s |
 * | cache hit                                |    ~1 s    |
 *
 * That 126 s was ~40 % of a production build, and it was paid on EVERY build:
 *
 *   1. Freshness used to be an **mtime** comparison. A git checkout stamps every
 *      working-tree file with the checkout time, so on a Vercel builder the
 *      sources are always newer than crops that are not there at all — the
 *      incremental path could only ever hit locally. Freshness is a **content
 *      hash** now (source bytes + the sidecar's focal point + the crop geometry
 *      + the sharp/libvips version), which is what the output actually depends
 *      on. Verified deterministic: the same source re-encoded three times gives
 *      a byte-identical file, which is what makes a content-addressed cache
 *      sound rather than merely plausible.
 *
 *   2. The cache lives in **`.next/cache`**, because that is the one directory
 *      Vercel restores before each build with no configuration (Next's own docs:
 *      "The build cache lives in `.next/cache`. Builds only get faster when that
 *      directory is restored before each build."). Vercel Blob and a KV store
 *      would both work and both are wrong here: 426 objects over the network,
 *      per build, to avoid ~1 s of local file copying, plus a token to manage.
 *      The crops are a pure function of files already in the repo — they want a
 *      scratch directory, not a database.
 *
 *   3. The loop was `for (…) await cropOne(…)`, i.e. one core busy and the rest
 *      idle, while sharp's own `sharp.concurrency()` reports 1 on this machine.
 *      Concurrency is `cpus().length` (never below 2, capped at 8 — the table
 *      above shows the knee at the core count). This is what covers a cache
 *      MISS: a new photo, a retargeted focal point, a bumped sharp, or a build
 *      run with the cache cleared still costs 34 s rather than 126 s.
 *
 * Keep both halves. The cache alone leaves the first build after any media
 * change at 126 s; the parallelism alone pays 34 s on every build for ever.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';

import { normalizeSidecar } from '../lib/media/sidecar.mjs';
import { ASPECT_SUFFIX_RE, CROP_ASPECTS as ASPECTS, cropBox } from '../lib/media/crop-box.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = path.join(__dirname, '../public/media');
const SOURCE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Where the cross-build copies live.
 *
 * Under `.next/cache` on purpose (see the header): Vercel restores that
 * directory and nothing else for free. A miss is correct-but-slow, never wrong,
 * so a cold or evicted cache degrades to the parallel cut.
 */
const CACHE_DIR = path.join(__dirname, '../.next/cache/image-crops');

/**
 * Bump to invalidate every cached crop at once.
 *
 * For a change to the ENCODER SETTINGS or the crop policy — anything that makes
 * the same inputs produce different bytes without any input changing. The
 * sharp/libvips version is already part of the key, so an upgrade needs no bump.
 */
const CACHE_VERSION = 1;

/** Encoder settings, in one place so the cache key can name them. */
const JPEG_OPTIONS = { quality: 82, mozjpeg: true };

// sharp is a hard dependency, but never break the build over a missing optional
// image step — degrade to a warning (the pipeline falls back to the base image).
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️  sharp not available — skipping aspect-ratio crop generation.');
  process.exit(0);
}

/**
 * How many sources to crop at once.
 *
 * The measurement in the header puts the knee at the core count; past it the
 * wall-clock gets slightly worse, so there is nothing to win by over-committing.
 * Floor of 2 so a single-core CI box still overlaps encode with file IO.
 */
const CONCURRENCY = (() => {
  const override = Number(process.env.IMAGE_CROP_CONCURRENCY);
  if (Number.isFinite(override) && override >= 1) return Math.floor(override);
  return Math.min(8, Math.max(2, os.cpus()?.length || 2));
})();

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/**
 * The focal point from the image's sidecar, if it has one.
 *
 * Read straight off disk rather than from the manifest because this script runs
 * BEFORE the manifest is generated (the manifest records which crops exist, so it
 * has to come second).
 */
function readFocus(sidecarPath) {
  try {
    const raw = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
    return normalizeSidecar(raw).sidecar.focus;
  } catch {
    return null;
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Everything the crop's bytes depend on, hashed.
 *
 * The SOURCE BYTES rather than its path or mtime — a photo swapped for a
 * different one at the same name has to miss, and a `git clone` that stamps a
 * new mtime on an unchanged file has to hit. The focal point rides along
 * because retargeting it changes what the crop contains without touching the
 * photo, which is the case the old mtime check was extended to cover and the
 * reason a naive "hash the image" key would be wrong.
 */
function cacheKey(sourceBytes, focus, aspect) {
  return sha256(
    JSON.stringify({
      v: CACHE_VERSION,
      source: sha256(sourceBytes),
      focus: focus ? { x: focus.x, y: focus.y } : null,
      aspect,
      jpeg: JPEG_OPTIONS,
      // A libvips upgrade may legitimately re-encode differently. Keying on it
      // means an upgrade cuts fresh crops instead of serving the old encoder's.
      sharp: sharp.versions.sharp,
      vips: sharp.versions.vips,
    })
  );
}

/** Copy a cached crop into place. Returns false when the cache entry is gone. */
function restoreFromCache(cachePath, outPath) {
  try {
    fs.copyFileSync(cachePath, outPath);
    return true;
  } catch {
    return false;
  }
}

/** Store a freshly cut crop for the next build. Never fatal — a cache is a cache. */
function saveToCache(outPath, cachePath) {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    // Write beside the target and rename, so two concurrent workers (or two
    // builds sharing a checkout) cannot leave a half-copied file behind that a
    // later build would then serve as a valid crop.
    const tmp = `${cachePath}.${process.pid}.tmp`;
    fs.copyFileSync(outPath, tmp);
    fs.renameSync(tmp, cachePath);
  } catch {
    /* out of disk, read-only cache dir — the crop itself is already written */
  }
}

async function cropOne(sourcePath, seen) {
  const dir = path.dirname(sourcePath);
  const ext = path.extname(sourcePath);
  const baseName = path.basename(sourcePath, ext);
  const sidecarPath = sourcePath.slice(0, -ext.length) + '.json';
  const focus = readFocus(sidecarPath);

  let sourceBytes;
  try {
    sourceBytes = fs.readFileSync(sourcePath);
  } catch (err) {
    console.warn(`⚠️  Could not read ${sourcePath}: ${err.message}`);
    return { written: 0, restored: 0, skipped: 0 };
  }

  // Which crops are already correct on disk, and which the cache can hand over
  // without touching sharp. Both answers come from the same key, so a crop that
  // is present but was cut around a stale focal point is re-cut rather than kept.
  const plan = ASPECTS.map((aspect) => {
    const key = cacheKey(sourceBytes, focus, aspect);
    return {
      aspect,
      key,
      outPath: path.join(dir, `${baseName}-${aspect.name}.jpg`),
      cachePath: path.join(CACHE_DIR, key.slice(0, 2), `${key}.jpg`),
    };
  });

  for (const entry of plan) seen.add(entry.cachePath);

  let written = 0;
  let restored = 0;
  let skipped = 0;
  let meta = null;

  for (const entry of plan) {
    // Already cut in a previous run of THIS checkout, around this exact input.
    if (fs.existsSync(entry.outPath) && fs.existsSync(entry.cachePath)) {
      skipped += 1;
      continue;
    }
    if (fs.existsSync(entry.cachePath) && restoreFromCache(entry.cachePath, entry.outPath)) {
      restored += 1;
      continue;
    }

    if (!meta) {
      try {
        meta = await sharp(sourceBytes).metadata();
      } catch (err) {
        console.warn(`⚠️  Could not read ${sourcePath}: ${err.message}`);
        return { written, restored, skipped };
      }
      if (!meta.width || !meta.height) return { written, restored, skipped };
    }

    const box = cropBox(meta.width, meta.height, entry.aspect.w, entry.aspect.h);
    try {
      const pipeline = sharp(sourceBytes).rotate(); // honour EXIF orientation first
      if (focus) {
        // An explicit focal point beats saliency detection: `position: 'attention'`
        // is a guess about what matters, and on a photo like the Troy horse it
        // guesses the bright sky and cuts the head off. Extract the box around the
        // focal point instead, clamped so it stays inside the image.
        const left = clamp(Math.round(focus.x * meta.width - box.w / 2), 0, meta.width - box.w);
        const top = clamp(Math.round(focus.y * meta.height - box.h / 2), 0, meta.height - box.h);
        pipeline.extract({ left, top, width: box.w, height: box.h });
      } else {
        pipeline.resize(box.w, box.h, { fit: 'cover', position: 'attention' });
      }
      await pipeline.jpeg(JPEG_OPTIONS).toFile(entry.outPath);
      saveToCache(entry.outPath, entry.cachePath);
      written += 1;
    } catch (err) {
      console.warn(`⚠️  Failed to crop ${entry.outPath}: ${err.message}`);
    }
  }

  return { written, restored, skipped };
}

/**
 * Every croppable source in the database, recursively.
 *
 * Collections nest (`halloween-2026/kulissen`), so this walks the whole tree
 * rather than the fixed two levels the old park-only layout had. SVGs are skipped
 * — they are resolution-independent and cropping one to a raster loses the point.
 */
function collectSources(dir) {
  const sources = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sources.push(...collectSources(abs));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXTENSIONS.includes(ext)) continue;
    const baseName = path.basename(entry.name, ext);
    if (ASPECT_SUFFIX_RE.test(baseName)) continue; // never re-crop a crop
    sources.push(abs);
  }
  return sources;
}

/**
 * Drop cache entries no current source claims.
 *
 * Without this the directory keeps every crop of every photo ever committed,
 * and it is the directory Vercel has to ship to the builder before each build —
 * so an unbounded cache eventually costs more to restore than it saves.
 */
function pruneCache(seen) {
  if (!fs.existsSync(CACHE_DIR)) return 0;
  let pruned = 0;
  for (const shard of fs.readdirSync(CACHE_DIR, { withFileTypes: true })) {
    if (!shard.isDirectory()) continue;
    const shardDir = path.join(CACHE_DIR, shard.name);
    for (const file of fs.readdirSync(shardDir)) {
      const abs = path.join(shardDir, file);
      if (seen.has(abs)) continue;
      try {
        fs.rmSync(abs);
        pruned += 1;
      } catch {
        /* nothing to do about it, and it is not worth failing a build over */
      }
    }
    try {
      if (fs.readdirSync(shardDir).length === 0) fs.rmdirSync(shardDir);
    } catch {
      /* raced with another worker */
    }
  }
  return pruned;
}

/** Run `task` over `items` with at most `limit` in flight. */
async function mapWithConcurrency(items, limit, task) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const index = next++;
        if (index >= items.length) return;
        results[index] = await task(items[index]);
      }
    })
  );
  return results;
}

async function main() {
  console.log('✂️  Generating aspect-ratio image crops…');

  if (!fs.existsSync(MEDIA_DIR)) {
    console.warn('⚠️  Media directory not found:', MEDIA_DIR);
    process.exit(0);
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const started = Date.now();
  const sources = collectSources(MEDIA_DIR);
  // Shared across workers: every cache path the current sources legitimately
  // claim, so the prune below can tell a live entry from a leftover.
  const seen = new Set();

  const stats = await mapWithConcurrency(sources, CONCURRENCY, (source) => cropOne(source, seen));

  const written = stats.reduce((sum, s) => sum + (s?.written ?? 0), 0);
  const restored = stats.reduce((sum, s) => sum + (s?.restored ?? 0), 0);
  const skipped = stats.reduce((sum, s) => sum + (s?.skipped ?? 0), 0);
  const pruned = pruneCache(seen);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(
    `✅ ${written} cut, ${restored} from cache, ${skipped} already on disk ` +
      `(${sources.length} sources, ${CONCURRENCY} at a time, ${seconds}s` +
      `${pruned ? `, ${pruned} stale cache entries pruned` : ''}).`
  );
}

await main();
