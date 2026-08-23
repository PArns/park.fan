#!/usr/bin/env node

/**
 * Generate aspect-ratio crops (16:9 / 4:3 / 1:1) for every photo in the media
 * database, for the structured-data image sets (see lib/utils/park-assets.ts).
 *
 * Google prefers the same picture supplied in several aspect ratios so it can
 * pick the best crop per SERP surface. We cut those crops from the CURRENT
 * assets at build time — they are never hand-authored. Output files are
 * gitignored (`*-16x9|4x3|1x1.jpg`) and regenerated on every build.
 *
 * Crops are cut at the largest size that fits the source WITHOUT upscaling
 * (most photos are ≤1024px), using content-aware cropping. Existing crops are
 * skipped so re-runs are idempotent and don't recursively re-crop.
 *
 * Runs BEFORE `generate:media` in prebuild: the media manifest records which
 * crops exist per image, which is what lets the structured-data image set be
 * resolved from the manifest instead of hitting the filesystem at request time.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { normalizeSidecar } from '../lib/media/sidecar.mjs';
import { ASPECT_SUFFIX_RE, CROP_ASPECTS as ASPECTS, cropBox } from '../lib/media/crop-box.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = path.join(__dirname, '../public/media');
const SOURCE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// sharp is a hard dependency, but never break the build over a missing optional
// image step — degrade to a warning (the pipeline falls back to the base image).
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️  sharp not available — skipping aspect-ratio crop generation.');
  process.exit(0);
}

/** True when `outPath` already exists and is at least as new as the source. */
function isFresh(outPath, sourceMtimeMs) {
  try {
    return fs.statSync(outPath).mtimeMs >= sourceMtimeMs;
  } catch {
    return false; // missing → not fresh
  }
}

/**
 * The focal point from the image's sidecar, if it has one.
 *
 * Read straight off disk rather than from the manifest because this script runs
 * BEFORE the manifest is generated (the manifest records which crops exist, so it
 * has to come second).
 */
function readFocus(sourcePath, ext) {
  const sidecarPath = sourcePath.slice(0, -ext.length) + '.json';
  try {
    const raw = JSON.parse(fs.readFileSync(sidecarPath, 'utf8'));
    return normalizeSidecar(raw).sidecar.focus;
  } catch {
    return null;
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

async function cropOne(sourcePath) {
  const dir = path.dirname(sourcePath);
  const ext = path.extname(sourcePath);
  const baseName = path.basename(sourcePath, ext);
  const focus = readFocus(sourcePath, ext);
  const sidecarPath = sourcePath.slice(0, -ext.length) + '.json';

  // Freshness is measured against the source AND its sidecar: retargeting the
  // focal point changes what the crop should contain without touching the photo,
  // and a crop cut around the old point would otherwise survive forever.
  const sourceMtimeMs = Math.max(
    fs.statSync(sourcePath).mtimeMs,
    fs.existsSync(sidecarPath) ? fs.statSync(sidecarPath).mtimeMs : 0
  );

  // Incremental: skip a source entirely when all three crops are already newer
  // than it — only re-cut when the photo was swapped/added (mtime moved forward).
  const outPaths = ASPECTS.map((a) => path.join(dir, `${baseName}-${a.name}.jpg`));
  if (outPaths.every((p) => isFresh(p, sourceMtimeMs)))
    return { written: 0, skipped: ASPECTS.length };

  let meta;
  try {
    meta = await sharp(sourcePath).metadata();
  } catch (err) {
    console.warn(`⚠️  Could not read ${sourcePath}: ${err.message}`);
    return { written: 0, skipped: 0 };
  }
  if (!meta.width || !meta.height) return { written: 0, skipped: 0 };

  let written = 0;
  let skipped = 0;
  for (let i = 0; i < ASPECTS.length; i += 1) {
    const aspect = ASPECTS[i];
    const outPath = outPaths[i];
    if (isFresh(outPath, sourceMtimeMs)) {
      skipped += 1;
      continue;
    }
    const box = cropBox(meta.width, meta.height, aspect.w, aspect.h);
    try {
      const pipeline = sharp(sourcePath).rotate(); // honour EXIF orientation first
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
      await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
      written += 1;
    } catch (err) {
      console.warn(`⚠️  Failed to crop ${outPath}: ${err.message}`);
    }
  }
  return { written, skipped };
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

async function main() {
  console.log('✂️  Generating aspect-ratio image crops…');

  if (!fs.existsSync(MEDIA_DIR)) {
    console.warn('⚠️  Media directory not found:', MEDIA_DIR);
    process.exit(0);
  }

  let sourceCount = 0;
  let cropCount = 0;
  let skipCount = 0;
  for (const source of collectSources(MEDIA_DIR)) {
    sourceCount += 1;
    const { written, skipped } = await cropOne(source);
    cropCount += written;
    skipCount += skipped;
  }

  console.log(
    `✅ Cut ${cropCount} crops from ${sourceCount} source images (${skipCount} already up to date).`
  );
}

await main();
