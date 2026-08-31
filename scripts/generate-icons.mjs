#!/usr/bin/env node

/**
 * Generate the whole icon set from the brand files — never hand-exported.
 *
 * Why a generator: the set that shipped before this had three different artworks in it.
 * `BrandLockup` renders `logo-small.svg` (pin, castle, road), `app/icon.svg` carried the same pin
 * as a stale copy, and `favicon.ico` / `icon-192.png` / `icon-512.png` / `apple-touch-icon.png`
 * carried a completely different mark — the bar-chart pin with the orbit, plus the `park.fan`
 * wordmark baked in. Nothing compared them, so the favicon drifted away from the logo without a
 * single failing build.
 *
 * TWO SOURCES, AND THE SPLIT IS ABOUT PIXELS. The detailed pin is the site's mark — it is what the
 * footer, the OG images, the Organization logo in structured data and the maintenance page show,
 * and it is the better drawing. It stops working below about 24 px: the orbit cuts through the
 * pin's white ring and the three bars merge into one green-blue smear, so at 16 and 20 px the
 * silhouette is no longer a pin.
 *
 * The line is not the file's own pixel size, it is **the smallest size any surface may draw it
 * at**. That puts `apple-touch-icon.png` on the simple pin despite being 180 px: Google reads it
 * as a favicon candidate and documents no priority against `rel="icon"`, so it is free to take
 * that file and scale it to 16 px itself — the exact failure this change exists to fix. With it on
 * the simple source, Google has no detailed candidate anywhere, since the manifest is not a
 * favicon source.
 *
 * What is left on the detailed pin is the app icon — the manifest's three files, which every
 * documented surface (home screen, launcher, task switcher, splash) draws large.
 *
 * Two more decisions live here so an export cannot get them wrong:
 *
 * 1. NO WORDMARK. Google composes the favicon at 16 CSS px. The wordmark took ~25 % of the old
 *    artwork's height, which is ~4 px of cap height at that size — unreadable, and it stole a
 *    quarter of the canvas from the only part that can still be recognised. `logo-big-dark.svg`
 *    still contains it, so the mark is isolated and clipped (see `markInkBox`).
 *
 * 2. THE ICON BRINGS ITS OWN GROUND. Both marks are a pin OUTLINE with a hole for a head. On
 *    transparency they have no figure/ground at all: the light colourway's #293B47 pin on Google's
 *    dark result page (#202124) is what the reported screenshot showed — a smudge. A full-bleed
 *    tile means the icon looks the same wherever it is composited: Google light and dark, a
 *    browser tab, a bookmark bar, a home screen, a link unfurl.
 *
 * Run: `pnpm generate:icons` — writes. `pnpm check:icons` — verifies the committed files still
 * match the sources, and fails if they do not.
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/**
 * `simple` is the header's own pin and holds together at 16 px. `detail` is the site's fuller mark
 * — and it is `logo-big-dark.svg` rather than `logo-dark.svg` because only that one is real
 * vector; `logo-dark.svg` is a 1563×1116 PNG in an SVG wrapper, which is why it weighs 77 KB.
 */
const SOURCES = {
  simple: 'public/logo-small-dark.svg',
  detail: 'public/logo-big-dark.svg',
};

/**
 * Ground colour. Same value as the manifest's `background_color` and the same navy the pins'
 * light colourways are drawn in, so the tile is a brand colour rather than a new one.
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

function viewBoxOf(svg, file) {
  const match = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!match) throw new Error(`${file}: no viewBox`);
  const [x, y, w, h] = match[1].trim().split(/\s+/).map(Number);
  return { x, y, w, h };
}

/**
 * The source's markup with the `<svg>` wrapper stripped, ready to be re-parented.
 *
 * The two removals are not cosmetic. `serif:id` is Affinity/Serif export cruft, and a
 * namespaced attribute whose `xmlns:serif` was left behind on the old wrapper is a hard XML
 * parse error in every renderer. The `fill:none` rect is the exporter's artboard: invisible,
 * but it spans the whole viewBox, so it would set the measured ink box to the whole viewBox
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
function rasterizable(svg, file, px) {
  const vb = viewBoxOf(svg, file);
  const k = px / Math.max(vb.w, vb.h);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"` +
      ` width="${vb.w * k}" height="${vb.h * k}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">` +
      innerOf(svg) +
      `</svg>`
  );
}

/**
 * Bounding box of the MARK, in viewBox units, measured by rendering and walking the alpha
 * channel — never typed. `logo-small-dark.svg` draws its pin inside a 144×144 viewBox at 62.5 %
 * width and 86 % height, so scaling the viewBox instead of the ink would leave a seventh of the
 * icon empty on every edge, and a re-export at different margins would silently shrink the
 * favicon.
 *
 * `logo-big-dark.svg` is the lockup, so it holds the wordmark under the pin. The two are
 * separated by a band of rows with no ink at all, which is what this looks for: the widest fully
 * empty band inside the artwork, taken as a separator only when it spans at least 4 % of the ink
 * height (a pin has no internal gap anywhere near that). Everything above it is the mark. Files
 * with no such band — the simple pin — measure whole.
 */
async function markInkBox(svg, file, px = 1400) {
  const vb = viewBoxOf(svg, file);
  const { data, info } = await sharp(rasterizable(svg, file, px))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rows = [];
  for (let y = 0; y < info.height; y++) {
    let minX = Infinity;
    let maxX = -1;
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    rows.push({ y, empty: maxX < 0, minX, maxX });
  }

  const inked = rows.filter((r) => !r.empty);
  if (inked.length === 0) throw new Error(`${file}: renders nothing`);
  const first = inked[0].y;
  const last = inked[inked.length - 1].y;

  // Widest run of empty rows strictly between the first and last inked row.
  let widest = null;
  let run = null;
  for (let y = first; y <= last; y++) {
    if (rows[y].empty) run = run ? { ...run, b: y } : { a: y, b: y };
    else if (run) {
      if (!widest || run.b - run.a > widest.b - widest.a) widest = run;
      run = null;
    }
  }

  const separator =
    widest && (widest.b - widest.a + 1) / (last - first + 1) >= 0.04 ? widest : null;
  const mark = separator ? inked.filter((r) => r.y < separator.a) : inked;

  const top = mark[0].y;
  const bottom = mark[mark.length - 1].y;
  const left = Math.min(...mark.map((r) => r.minX));
  const right = Math.max(...mark.map((r) => r.maxX));
  const k = px / Math.max(vb.w, vb.h);

  return {
    x: vb.x + left / k,
    y: vb.y + top / k,
    w: (right - left + 1) / k,
    h: (bottom - top + 1) / k,
    clipped: Boolean(separator),
  };
}

/**
 * The source artwork, untouched, centred and scaled to fill `size` minus `inset`.
 *
 * A clip is not optional for the lockup: scaled so the pin fills the tile, the wordmark starts
 * exactly at the pin's lower edge and would paint into the bottom strip of the icon rather than
 * falling outside the viewBox.
 */
function composeSvg({ inner, ink, size, inset, radius, clip }) {
  const box = {
    x: size * inset,
    y: size * inset,
    w: size * (1 - 2 * inset),
    h: size * (1 - 2 * inset),
  };
  const scale = Math.min(box.w / ink.w, box.h / ink.h);
  const tx = box.x + (box.w - ink.w * scale) / 2 - ink.x * scale;
  const ty = box.y + (box.h - ink.h * scale) / 2 - ink.y * scale;

  const art = clip
    ? `    <clipPath id="mark"><rect x="${ink.x}" y="${ink.y}" width="${ink.w}" height="${ink.h}"/></clipPath>\n` +
      `    <g clip-path="url(#mark)">\n${inner}\n    </g>`
    : inner;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" rx="${(radius * size).toFixed(2)}" fill="${TILE}"/>`,
    `  <g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(6)})">`,
    art,
    `  </g>`,
    `</svg>`,
    ``,
  ].join('\n');
}

/**
 * An .ico holding PNG frames.
 *
 * The set it replaces held 16 and 32 only, while the `link` element Next writes for the file
 * convention reports the largest frame in the file as its `sizes` — so the markup claimed 48×48
 * and handed Google 32 to upscale. Google's own guidance asks for something larger than 48×48,
 * hence the 96 frame; 16 and 32 stay because that is what a browser tab and a Retina tab draw.
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

/** `{ rounded, square, maskable }` per source, all cut from the same measured mark box. */
async function artwork(file) {
  const svg = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const inner = innerOf(svg);
  const ink = await markInkBox(svg, file);
  const make = (inset, radius) =>
    composeSvg({ inner, ink, size: 512, inset, radius, clip: ink.clipped });
  return {
    rounded: make(INSET, RADIUS),
    square: make(INSET, 0),
    maskable: make(MASKABLE_INSET, 0),
  };
}

const simple = await artwork(SOURCES.simple);
const detail = await artwork(SOURCES.detail);

const outputs = [
  // --- simple pin: everything a surface may draw small ---
  //
  // What Google reads. Google does not support SVG favicons, so this file is the one that decides
  // what the search result shows.
  {
    file: 'app/favicon.ico',
    bytes: buildIco(
      await Promise.all(
        [16, 32, 48, 96].map(async (size) => ({ size, png: await png(simple.rounded, size) }))
      )
    ),
  },
  // The vector favicon browsers prefer — one file, crisp at any size, drawn in the tab at 16.
  { file: 'public/icon.svg', bytes: Buffer.from(simple.rounded) },
  // 180 px on an iOS home screen, but SMALL wherever it counts: Google reads `apple-touch-icon`
  // as a favicon candidate and documents no priority against `rel="icon"`, so it may take this
  // file and scale it to 16 px itself. That is the exact failure this whole change exists to fix,
  // so it takes the simple pin and Google is left with no detailed candidate at all. Square,
  // because iOS masks the corners itself and rounding an already-rounded corner leaves
  // transparent slivers.
  { file: 'public/apple-touch-icon.png', bytes: await png(simple.square, 180) },

  // --- detailed pin: the app icon, which every documented surface draws large ---
  //
  // These three are the manifest's, and they move together on purpose: a launcher free to pick
  // the 192 or the 512 must not get a different mark depending on which it picked.
  { file: 'public/icon-192.png', bytes: await png(detail.rounded, 192) },
  { file: 'public/icon-512.png', bytes: await png(detail.rounded, 512) },
  { file: 'public/icon-maskable-512.png', bytes: await png(detail.maskable, 512) },
];

let drifted = 0;
for (const { file, bytes } of outputs) {
  const abs = path.join(ROOT, file);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
  const same = current !== null && current.equals(bytes);

  if (check) {
    if (!same) {
      drifted++;
      console.error(`✗ ${file} — ${current === null ? 'missing' : 'does not match its source'}`);
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
  console.log(`✓ icon set matches ${SOURCES.simple} and ${SOURCES.detail}`);
}
