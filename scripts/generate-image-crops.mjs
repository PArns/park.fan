#!/usr/bin/env node

/**
 * Generate aspect-ratio crops (16:9 / 4:3 / 1:1) from the existing park & ride
 * photos, for the structured-data image sets (see lib/utils/park-assets.ts).
 *
 * Google prefers the same picture supplied in several aspect ratios so it can
 * pick the best crop per SERP surface. We cut those crops from the CURRENT
 * assets at build time — they are never hand-authored. Output files are
 * gitignored (`*-16x9|4x3|1x1.jpg`) and regenerated on every build.
 *
 * Crops are cut at the largest size that fits the source WITHOUT upscaling
 * (current heroes are ≤1024px), using content-aware cropping. Only `background`
 * and real ride photos are processed; existing crops are skipped so re-runs are
 * idempotent and don't recursively re-crop.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARKS_DIR = path.join(__dirname, '../public/images/parks');
const SOURCE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Google's recommended structured-data aspect ratios, widest-first.
const ASPECTS = [
  { name: '16x9', w: 16, h: 9 },
  { name: '4x3', w: 4, h: 3 },
  { name: '1x1', w: 1, h: 1 },
];
const ASPECT_SUFFIX_RE = /-(?:16x9|4x3|1x1)$/;

// sharp is a hard dependency, but never break the build over a missing optional
// image step — degrade to a warning (the pipeline falls back to the base image).
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️  sharp not available — skipping aspect-ratio crop generation.');
  process.exit(0);
}

/** Largest crop box for a target ratio that fits inside WxH without upscaling. */
function cropBox(width, height, ratioW, ratioH) {
  const target = ratioW / ratioH;
  const source = width / height;
  if (source > target) return { w: Math.round(height * target), h: height };
  return { w: width, h: Math.round(width / target) };
}

async function cropOne(sourcePath) {
  const dir = path.dirname(sourcePath);
  const ext = path.extname(sourcePath);
  const baseName = path.basename(sourcePath, ext);

  let meta;
  try {
    meta = await sharp(sourcePath).metadata();
  } catch (err) {
    console.warn(`⚠️  Could not read ${sourcePath}: ${err.message}`);
    return 0;
  }
  if (!meta.width || !meta.height) return 0;

  let written = 0;
  for (const aspect of ASPECTS) {
    const box = cropBox(meta.width, meta.height, aspect.w, aspect.h);
    const outPath = path.join(dir, `${baseName}-${aspect.name}.jpg`);
    try {
      await sharp(sourcePath)
        .resize(box.w, box.h, { fit: 'cover', position: 'attention' })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outPath);
      written += 1;
    } catch (err) {
      console.warn(`⚠️  Failed to crop ${outPath}: ${err.message}`);
    }
  }
  return written;
}

/** Collects source images (background + real ride photos, never existing crops). */
function collectSources(dir) {
  const sources = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'attractions') sources.push(...collectSources(path.join(dir, entry.name)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXTENSIONS.includes(ext)) continue;
    const baseName = path.basename(entry.name, ext);
    if (ASPECT_SUFFIX_RE.test(baseName)) continue; // never re-crop a crop
    sources.push(path.join(dir, entry.name));
  }
  return sources;
}

async function main() {
  console.log('✂️  Generating aspect-ratio image crops…');

  if (!fs.existsSync(PARKS_DIR)) {
    console.warn('⚠️  Parks directory not found:', PARKS_DIR);
    process.exit(0);
  }

  const parkDirs = fs
    .readdirSync(PARKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(PARKS_DIR, d.name));

  let sourceCount = 0;
  let cropCount = 0;
  for (const parkDir of parkDirs) {
    for (const source of collectSources(parkDir)) {
      sourceCount += 1;
      cropCount += await cropOne(source);
    }
  }

  console.log(`✅ Cut ${cropCount} crops from ${sourceCount} source images.`);
}

await main();
