/**
 * What is missing from the media database, image by image.
 *
 * Run: pnpm audit:media
 *
 * The build reports totals; this reports the backlog per file, split by whether a
 * gap can be closed by MACHINE (dimensions, EXIF capture date and GPS, the crops)
 * or only by a PERSON (alt text, captions, the focal point, which ride it shows).
 * That split is the point: a list mixing the two reads as one big pile of work
 * nobody starts, and the machine half can be closed in one pass.
 */

import fs from 'node:fs';
import path from 'node:path';

import { normalizeSidecar } from '../lib/media/sidecar.mjs';

const ROOT = 'public/media';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']);
const CROP = /-(?:16x9|4x3|1x1)\.[a-z0-9]+$/i;
const LOW_RES_LONG_EDGE = 2048;
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];

/** Every source image in the tree, crops excluded, in collection order. */
export function listSourceImages(root = ROOT) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase()) && !CROP.test(entry.name)) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

function idOf(file) {
  return file.replace(new RegExp(`^${ROOT}/`), '').replace(/\.[^.]+$/, '');
}

function main() {
  const files = listSourceImages();
  const rows = files.map((file) => {
    const sidecarPath = file.replace(/\.[^.]+$/, '.json');
    const exists = fs.existsSync(sidecarPath);
    // Normalized through the SAME module the generator uses, so the audit judges a
    // sidecar exactly as the build does — an audit with its own reading of the
    // format would report gaps the build does not have, and miss the ones it does.
    const { sidecar, text, issues } = normalizeSidecar(
      exists ? JSON.parse(fs.readFileSync(sidecarPath, 'utf8')) : {}
    );
    return { file, id: idOf(file), hasSidecar: exists, sidecar, text, issues };
  });

  const withIssues = rows.filter((r) => r.issues.length);
  if (withIssues.length) {
    console.log('\n⚠️  Sidecars with dropped values:');
    for (const row of withIssues) console.log(`  ${row.id}: ${row.issues.join('; ')}`);
  }

  const gap = (predicate) => rows.filter(predicate).map((r) => r.id);

  const missing = {
    sidecar: gap((r) => !r.hasSidecar),
    park: gap((r) => !r.sidecar.park),
    ride: gap((r) => !r.sidecar.ride),
    title: gap((r) => !r.sidecar.title),
    roles: gap((r) => !r.sidecar.roles?.length),
    tags: gap((r) => !r.sidecar.tags?.length),
    focus: gap((r) => !r.sidecar.focus),
    alt: gap((r) => !LOCALES.some((l) => r.text.alt?.[l])),
    caption: gap((r) => !LOCALES.some((l) => r.text.caption?.[l])),
    credit: gap((r) => !r.sidecar.credit?.author),
    license: gap((r) => !r.sidecar.credit?.license || r.sidecar.credit.license === 'unknown'),
  };

  console.log(`\n📁 ${rows.length} source images\n`);
  const label = (k) => `${k}:`.padEnd(12);
  for (const [key, ids] of Object.entries(missing)) {
    if (!ids.length) {
      console.log(`✅ ${label(key)} complete`);
      continue;
    }
    console.log(`⚠️  ${label(key)} ${ids.length} missing`);
  }

  if (process.argv.includes('--list')) {
    console.log('\n--- detail ---');
    for (const [key, ids] of Object.entries(missing)) {
      if (ids.length) console.log(`\n${key} (${ids.length}):\n  ${ids.join('\n  ')}`);
    }
  }

  console.log(`\nLow-resolution target: ${LOW_RES_LONG_EDGE}px long edge.`);
  console.log('Run with --list for the per-image backlog.\n');
}

main();
