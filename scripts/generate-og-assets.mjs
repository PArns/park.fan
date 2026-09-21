#!/usr/bin/env node

/**
 * Cut the OG function's own asset root: `og-assets/`.
 *
 * ## Why this directory exists at all
 *
 * `lib/og/background-photo.ts` and `lib/og/brand-mark.tsx` read the pictures they paint off the
 * deployment's own filesystem instead of fetching them over HTTP on every render — that is what
 * took a place card from 860 ms and 734 MB/day of re-downloaded brand PNGs down to a local read
 * (the measurements are in those two files). The read is `join(process.cwd(), <root>, <variable>)`,
 * and **the tracer's answer to a path it cannot resolve statically is to bundle the whole directory
 * that path is rooted at.** While that root was `public/`, the OG function shipped every photo in
 * the media database:
 *
 * | traced into `api/og/[...path]`        |   size |
 * | ------------------------------------- | -----: |
 * | `public/media` sources + sidecars      | 109 MB |
 * | `public/media` `-4x3` crops            |  57 MB |
 * | `public/media` `-1x1` crops            |  47 MB |
 * | `public/media` `-16x9` crops           |  44 MB |
 * | everything else (sharp, Next, content) |  29 MB |
 * | **total**                              | **287 MB** |
 *
 * Vercel's limit is 250 MB uncompressed and the deploy failed at 290.96 MB. Of those 287, the card
 * paints **one** thing: a 16:9 photo, behind the headline, at `opacity: 0.4`. Everything else was
 * there because of where the read was rooted.
 *
 * So the root moves. This script writes the only files the OG function reads, and nothing else
 * goes in here — the sweep is then a feature: `og-assets/` **is** the list of what that function
 * carries, enforced by the directory rather than by a config key. (`outputFileTracingIncludes`
 * cannot do this job: `next build --turbo` never calls `collectBuildTraces`, which is the only
 * place includes and excludes are applied, so every key in that map is inert under the build this
 * project ships. See the note in next.config.ts.)
 *
 * ## Why 1200×630 and not the crop itself
 *
 * Copying the `-16x9` crops would already have fixed the build — 44 MB is comfortably inside the
 * limit. They are resized because the card frame is 1200×630 and `objectFit: cover` throws the
 * rest away: the crops are cut at the largest size that fits their source, so 11 of them are
 * 4096×2304 and the average is 286 KB. Satori decodes that at full resolution to paint 1200 px.
 * Resizing costs one build step and buys both halves — a smaller function AND a cheaper render —
 * and it is what keeps the number from drifting back up the next time somebody commits a 4K photo.
 *
 * `withoutEnlargement` so a source smaller than the card is left alone rather than upscaled into
 * bytes that carry no detail.
 *
 * ## Cache
 *
 * Content-addressed under `.next/cache`, exactly like `generate-image-crops.mjs` — that is the one
 * directory Vercel restores before each build with no configuration, and the key covers everything
 * the output bytes depend on (source bytes, card geometry, encoder settings, the sharp/libvips
 * version). A miss is slow, never wrong.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'public', 'media');
const OUT_DIR = path.join(ROOT, 'og-assets');
const CACHE_DIR = path.join(ROOT, '.next', 'cache', 'og-assets');

/**
 * Bump to invalidate every cached rendition at once — for a change to the card geometry or the
 * encoder settings, i.e. anything that makes the same inputs produce different bytes. The
 * sharp/libvips version is already part of the key, so an upgrade needs no bump.
 */
const CACHE_VERSION = 1;

/** The OG card frame. Both renderers draw 1200×630; see lib/og/blog-og.tsx and the route. */
const CARD = { width: 1200, height: 630 };

/** Same encoder as the crops, so the two steps produce comparable files. */
const JPEG_OPTIONS = { quality: 82, mozjpeg: true };

/**
 * The brand PNGs `OgBrandLockup` paints, copied verbatim — they are 80 KB together and already
 * sized for the card, so there is nothing to re-encode. Their names are repeated literally in
 * `lib/og/brand-mark.tsx`'s fallback; change one and change the other.
 */
const BRAND_FILES = ['logo-dark.png', 'parkfan-dark.png'];

/** Only the 16:9 crops. The `-4x3` and `-1x1` sets exist for structured data and no card reads them. */
const CROP_SUFFIX = '-16x9.jpg';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️  sharp not available — skipping OG asset generation.');
  process.exit(0);
}

const CONCURRENCY = (() => {
  const override = Number(process.env.IMAGE_CROP_CONCURRENCY);
  if (Number.isFinite(override) && override >= 1) return Math.floor(override);
  return Math.min(8, Math.max(2, os.cpus()?.length || 2));
})();

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

function cacheKey(sourceBytes) {
  return sha256(
    JSON.stringify({
      v: CACHE_VERSION,
      source: sha256(sourceBytes),
      card: CARD,
      jpeg: JPEG_OPTIONS,
      sharp: sharp.versions.sharp,
      vips: sharp.versions.vips,
    })
  );
}

/** Every `-16x9` crop in the media database, recursively. */
function collectCrops(dir) {
  const crops = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      crops.push(...collectCrops(abs));
      continue;
    }
    if (entry.name.endsWith(CROP_SUFFIX)) crops.push(abs);
  }
  return crops;
}

async function renditionFor(cropPath, claimed) {
  // Mirrors the site-relative path, so `ogBackgroundSrc` needs no mapping table: the path it
  // derives for `/media/x/y-16x9.jpg` is the path this writes.
  const rel = path.relative(ROOT, cropPath).replace(/^public[\\/]/, '');
  const outPath = path.join(OUT_DIR, rel);

  let sourceBytes;
  try {
    sourceBytes = fs.readFileSync(cropPath);
  } catch (err) {
    console.warn(`⚠️  Could not read ${cropPath}: ${err.message}`);
    return { written: 0, restored: 0, skipped: 0 };
  }

  const key = cacheKey(sourceBytes);
  const cachePath = path.join(CACHE_DIR, key.slice(0, 2), `${key}.jpg`);
  claimed.cache.add(cachePath);
  claimed.out.add(outPath);

  if (fs.existsSync(outPath) && fs.existsSync(cachePath))
    return { written: 0, restored: 0, skipped: 1 };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  if (fs.existsSync(cachePath)) {
    try {
      fs.copyFileSync(cachePath, outPath);
      return { written: 0, restored: 1, skipped: 0 };
    } catch {
      /* cache entry vanished mid-build — fall through and cut it */
    }
  }

  try {
    await sharp(sourceBytes)
      .resize(CARD.width, CARD.height, { fit: 'cover', withoutEnlargement: true })
      .jpeg(JPEG_OPTIONS)
      .toFile(outPath);
  } catch (err) {
    console.warn(`⚠️  Failed to render ${outPath}: ${err.message}`);
    return { written: 0, restored: 0, skipped: 0 };
  }

  // Store for the next build. Write beside the target and rename, so two concurrent workers cannot
  // leave a half-copied file behind that a later build would then serve as a valid rendition.
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    const tmp = `${cachePath}.${process.pid}.tmp`;
    fs.copyFileSync(outPath, tmp);
    fs.renameSync(tmp, cachePath);
  } catch {
    /* out of disk, read-only cache dir — the rendition itself is already written */
  }

  return { written: 1, restored: 0, skipped: 0 };
}

function copyBrandAssets(claimed) {
  let copied = 0;
  for (const file of BRAND_FILES) {
    const from = path.join(ROOT, 'public', file);
    const to = path.join(OUT_DIR, file);
    claimed.out.add(to);
    try {
      fs.copyFileSync(from, to);
      copied += 1;
    } catch (err) {
      console.warn(`⚠️  Could not copy ${file}: ${err.message}`);
    }
  }
  return copied;
}

/**
 * Drop anything in `og-assets/` no current source claims.
 *
 * This directory is the function's manifest, so a photo that was renamed or deleted must not keep
 * shipping inside it. On a Vercel builder the tree starts empty and this finds nothing; locally it
 * survives between builds, which is exactly where a stale file would otherwise accumulate.
 */
function pruneDir(dir, claimed) {
  if (!fs.existsSync(dir)) return 0;
  let pruned = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      pruned += pruneDir(abs, claimed);
      try {
        if (fs.readdirSync(abs).length === 0) fs.rmdirSync(abs);
      } catch {
        /* raced with another worker */
      }
      continue;
    }
    if (claimed.has(abs)) continue;
    try {
      fs.rmSync(abs);
      pruned += 1;
    } catch {
      /* not worth failing a build over */
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

function directoryBytes(dir) {
  if (!fs.existsSync(dir)) return 0;
  let bytes = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    bytes += entry.isDirectory() ? directoryBytes(abs) : fs.statSync(abs).size;
  }
  return bytes;
}

async function main() {
  console.log('🖼️  Generating OG card assets…');

  if (!fs.existsSync(MEDIA_DIR)) {
    console.warn('⚠️  Media directory not found:', MEDIA_DIR);
    process.exit(0);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const started = Date.now();
  const crops = collectCrops(MEDIA_DIR);
  const claimed = { cache: new Set(), out: new Set() };

  const stats = await mapWithConcurrency(crops, CONCURRENCY, (crop) => renditionFor(crop, claimed));
  const brand = copyBrandAssets(claimed);

  const written = stats.reduce((sum, s) => sum + (s?.written ?? 0), 0);
  const restored = stats.reduce((sum, s) => sum + (s?.restored ?? 0), 0);
  const skipped = stats.reduce((sum, s) => sum + (s?.skipped ?? 0), 0);
  const pruned = pruneDir(OUT_DIR, claimed.out);
  const prunedCache = pruneDir(CACHE_DIR, claimed.cache);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const megabytes = (directoryBytes(OUT_DIR) / 1024 / 1024).toFixed(1);

  console.log(
    `✅ ${written} rendered, ${restored} from cache, ${skipped} already on disk, ` +
      `${brand} brand assets (${crops.length} crops → ${megabytes} MB in og-assets/, ` +
      `${CONCURRENCY} at a time, ${seconds}s` +
      `${pruned ? `, ${pruned} stale renditions pruned` : ''}` +
      `${prunedCache ? `, ${prunedCache} stale cache entries pruned` : ''}).`
  );
}

await main();
