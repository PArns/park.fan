#!/usr/bin/env node

/**
 * Generate the whole icon set from ONE source file: `public/logo-small-dark.svg`.
 *
 * Why a generator rather than six hand-exported files: the set that shipped before this had
 * three different artworks in it. `BrandLockup` renders `logo-small.svg` (pin, castle, road),
 * `app/icon.svg` carried the same pin as a stale copy, and `favicon.ico` / `icon-192.png` /
 * `icon-512.png` / `apple-touch-icon.png` carried a completely different mark — the bar-chart
 * pin with the orbit, plus the `park.fan` wordmark baked in. Nothing compared them, so the
 * favicon drifted away from the logo without a single failing build.
 *
 * Three decisions live here so an export cannot get them wrong:
 *
 * 1. NO WORDMARK. Google renders the favicon at 16 CSS px. The wordmark took ~25 % of the
 *    artwork's height, which is ~4 px of cap height at that size — unreadable, and it stole a
 *    quarter of the canvas from the only part that can still be recognised.
 *
 * 2. THE ICON BRINGS ITS OWN GROUND. The mark is a pin OUTLINE with a hole for a head, drawn in
 *    #FCFCFC. On transparency it has no figure/ground at all: the light colourway's #293B47 pin
 *    on Google's dark result page (#202124) is what the reported screenshot showed — a smudge.
 *    A full-bleed tile in the brand navy means the icon looks the same wherever it is composited:
 *    Google light and dark, a browser tab, a bookmark bar, a home screen, a link unfurl.
 *
 * 3. THE INK BOX IS MEASURED, NEVER TYPED. `logo-small-dark.svg` draws the pin inside a 144×144
 *    viewBox at 62.5 % width and 86 % height, so scaling the viewBox to the tile would leave a
 *    seventh of the icon empty on every edge. The bbox is found by rendering the file and
 *    walking the alpha channel, so re-exporting the logo at a different size cannot silently
 *    shrink the favicon.
 *
 * Run: `pnpm generate:icons` — writes. `pnpm check:icons` — verifies the committed files still
 * match the source, and fails if they do not.
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** The one file every icon below is cut from. */
const SOURCE = path.join(ROOT, 'public/logo-small-dark.svg');

/**
 * Ground colour. Same value as the manifest's `background_color` and the same navy the pin's
 * light colourway is drawn in, so the tile is a brand colour rather than a new one.
 */
const TILE = '#293B47';

/** Share of the tile left empty around the mark, per edge. */
const INSET = 0.03;

/**
 * Corner radius as a share of the tile, for the surfaces that composite the icon as-is
 * (favicon, browser tab, Google's result row). Surfaces that apply their own mask — iOS, an
 * Android adaptive icon — get a square tile instead, or the OS rounds an already-rounded
 * corner and leaves transparent slivers.
 */
const RADIUS = 0.18;

/**
 * A maskable icon may lose everything outside the central 80 % circle, so the mark sits in a
 * smaller box there. 0.18 keeps the pin's tip and the top of its head inside that circle.
 */
const MASKABLE_INSET = 0.18;

// ---------------------------------------------------------------------------------------------

function viewBoxOf(svg) {
  const match = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!match) throw new Error(`${SOURCE}: no viewBox`);
  const [x, y, w, h] = match[1].trim().split(/\s+/).map(Number);
  return { x, y, w, h };
}

/**
 * The source's markup with the `<svg>` wrapper stripped, ready to be re-parented.
 *
 * The two removals are not cosmetic. `serif:id` is Affinity/Serif export cruft, and a
 * namespaced attribute whose `xmlns:serif` was left behind on the old wrapper is a hard XML
 * parse error in every renderer. The `fill:none` rect is the exporter's artboard: invisible,
 * but it is the full 144×144 box, so it would set the measured ink bbox to the whole viewBox
 * and defeat the point of measuring.
 */
function innerOf(svg) {
  return svg
    .replace(/^[\s\S]*?<svg\b[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s+serif:[\w-]+="[^"]*"/g, '')
    .replace(/\s*<rect\b[^>]*style="fill:none;?"[^>]*\/>/g, '')
    .trimEnd();
}

/** Render the source at a fixed pixel size, whatever intrinsic size the file declares. */
function rasterizable(svg, px) {
  const vb = viewBoxOf(svg);
  const k = px / Math.max(vb.w, vb.h);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"` +
      ` width="${vb.w * k}" height="${vb.h * k}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">` +
      innerOf(svg) +
      `</svg>`
  );
}

/** Bounding box of everything that actually paints, in viewBox units. */
async function inkBox(svg, px = 1400) {
  const vb = viewBoxOf(svg);
  const { data, info } = await sharp(rasterizable(svg, px))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`${SOURCE}: renders nothing`);

  const k = px / Math.max(vb.w, vb.h);
  return {
    x: vb.x + minX / k,
    y: vb.y + minY / k,
    w: (maxX - minX + 1) / k,
    h: (maxY - minY + 1) / k,
  };
}

/** The source artwork, untouched, centred and scaled to fill `size` minus `inset`. */
function composeSvg({ inner, ink, size, inset, radius }) {
  const box = {
    x: size * inset,
    y: size * inset,
    w: size * (1 - 2 * inset),
    h: size * (1 - 2 * inset),
  };
  const scale = Math.min(box.w / ink.w, box.h / ink.h);
  const tx = box.x + (box.w - ink.w * scale) / 2 - ink.x * scale;
  const ty = box.y + (box.h - ink.h * scale) / 2 - ink.y * scale;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" rx="${(radius * size).toFixed(2)}" fill="${TILE}"/>`,
    `  <g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(6)})">`,
    inner,
    `  </g>`,
    `</svg>`,
    ``,
  ].join('\n');
}

/**
 * An .ico holding PNG frames.
 *
 * The set it replaces held 16 and 32 only, while the `<link>` Next writes for the file
 * convention claims `sizes="48x48"` — so Google was told 48 and handed 32 to upscale. Google's
 * own guidance asks for something larger than 48×48, hence the 96 frame; 16 and 32 stay because
 * that is what a browser tab and a Retina tab actually draw.
 */
function buildIco(frames) {
  const HEADER = 6;
  const ENTRY = 16;
  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(frames.length, 4);

  const entries = [];
  let offset = HEADER + ENTRY * frames.length;
  for (const { size, png } of frames) {
    const entry = Buffer.alloc(ENTRY);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.png)]);
}

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// ---------------------------------------------------------------------------------------------

const check = process.argv.includes('--check');

const source = fs.readFileSync(SOURCE, 'utf8');
const inner = innerOf(source);
const ink = await inkBox(source);

const rounded = composeSvg({ inner, ink, size: 512, inset: INSET, radius: RADIUS });
const square = composeSvg({ inner, ink, size: 512, inset: INSET, radius: 0 });
const maskable = composeSvg({ inner, ink, size: 512, inset: MASKABLE_INSET, radius: 0 });

const outputs = [
  // The vector favicon every current browser prefers — one file, crisp at any size.
  { file: 'public/icon.svg', bytes: Buffer.from(rounded) },
  // What Google reads. Google does not support SVG favicons, so this file is the one that
  // decides what the search result shows.
  {
    file: 'app/favicon.ico',
    bytes: buildIco(
      await Promise.all(
        [16, 32, 48, 96].map(async (size) => ({ size, png: await png(rounded, size) }))
      )
    ),
  },
  // iOS ignores SVG and masks the corners itself, so this one is square.
  { file: 'public/apple-touch-icon.png', bytes: await png(square, 180) },
  { file: 'public/icon-192.png', bytes: await png(rounded, 192) },
  { file: 'public/icon-512.png', bytes: await png(rounded, 512) },
  { file: 'public/icon-maskable-512.png', bytes: await png(maskable, 512) },
];

let drifted = 0;
for (const { file, bytes } of outputs) {
  const abs = path.join(ROOT, file);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
  const same = current !== null && current.equals(bytes);

  if (check) {
    if (!same) {
      drifted++;
      console.error(`✗ ${file} — ${current === null ? 'missing' : 'does not match the source'}`);
    }
    continue;
  }

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, bytes);
  console.log(`${same ? '·' : '✓'} ${file} (${bytes.length.toLocaleString('en-US')} B)`);
}

if (check) {
  if (drifted > 0) {
    console.error(`\n${drifted} icon(s) out of date — run \`pnpm generate:icons\`.`);
    process.exit(1);
  }
  console.log(`✓ icon set matches ${path.relative(ROOT, SOURCE)}`);
}
