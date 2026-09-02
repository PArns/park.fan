#!/usr/bin/env node

/**
 * Cut the detailed pin out of the brand lockup, as real vector.
 *
 * `public/logo.svg` and `public/logo-dark.svg` are the site's mark on its own — the footer draws
 * them, and they were the last raster in the brand set: a 1563×1116 PNG wrapped in an `<svg>`,
 * 77 KB each, 154 KB for a drawing that exists as paths one file over. Nothing was visibly wrong
 * with them at the 32 and 48 px the footer asks for, which is exactly why they survived: a raster
 * with enough resolution for today's largest call site fails silently the first time somebody
 * draws it bigger.
 *
 * They are generated now, and that is the point rather than a convenience. `logo-big*.svg` is the
 * full lockup (pin above, `park.fan` under it) and the pin here is the same drawing — so it is one
 * claim stored twice, and a re-export of the lockup would leave this copy behind with no failing
 * build anywhere. `pnpm check:brand-pin` is what notices.
 *
 * THE SPLIT IS THE EXPORTER'S OWN, NOT A GUESS. Affinity names the two halves: `<g id="park.fan">`
 * holds the wordmark, `<g id="Icon">` the pin. So the wordmark is removed by id, not by hunting for
 * an empty band the way `generate-icons` has to when it composes an icon out of the whole lockup.
 * The gradients follow: `_Linear1` is the wordmark's green dot and nothing else, `_Linear2`–`5`
 * belong to the pin, and an unreferenced one is dropped rather than shipped.
 *
 * Everything else in the file is left exactly where it is — the enclosing `<g>` transforms above
 * all, which carry coordinates in the tens of thousands and mean nothing on their own. The only
 * value computed here is the `viewBox`, and it is the **ink box**, measured by rendering and
 * walking the alpha channel, never typed: a height on this file has to be the height of the mark,
 * the same contract the header lockup now holds to.
 *
 * Run: `pnpm generate:brand-pin` — writes. `pnpm check:brand-pin` — fails if the committed files
 * no longer match the lockup they are cut from.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PAIRS = [
  { from: 'public/logo-big.svg', to: 'public/logo.svg' },
  { from: 'public/logo-big-dark.svg', to: 'public/logo-dark.svg' },
];

/** The group the wordmark lives in. Affinity writes the id; nothing here infers it. */
const WORDMARK_ID = 'park.fan';

/** Resolution the ink box is measured at, on the longer edge. */
const MEASURE_PX = 4000;

// ---------------------------------------------------------------------------------------------

function viewBoxOf(svg, file) {
  const match = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!match) throw new Error(`${file}: no viewBox`);
  const [x, y, w, h] = match[1].trim().split(/\s+/).map(Number);
  return { x, y, w, h };
}

/**
 * Remove `<tag id="…">…</tag>` and everything inside it, matching the close by depth.
 *
 * A regex cannot do this: the wordmark group holds seven nested `<g>`s of its own, so the first
 * `</g>` after the opening tag is six levels too early.
 */
function dropElementById(svg, id, file) {
  const open = new RegExp(
    `<(\\w[\\w:-]*)\\b[^>]*\\bid="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`
  );
  const start = svg.search(open);
  if (start < 0) throw new Error(`${file}: no element with id="${id}"`);
  const tag = svg.slice(start).match(open)[1];
  const scan = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'g');
  scan.lastIndex = start;
  let depth = 0;
  for (let m; (m = scan.exec(svg));) {
    if (m[2] === '/') continue; // self-closing, no depth change
    depth += m[1] ? -1 : 1;
    if (depth === 0) return svg.slice(0, start) + svg.slice(m.index + m[0].length);
  }
  throw new Error(`${file}: id="${id}" is never closed`);
}

/** Gradients the remaining markup no longer points at. Shipping them is dead weight and a lie. */
function dropUnusedGradients(svg) {
  const used = new Set([...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]));
  return svg.replace(
    /[ \t]*<linearGradient id="([^"]+)"[\s\S]*?<\/linearGradient>\n?/g,
    (block, id) => (used.has(id) ? block : '')
  );
}

/**
 * Bounding box of what the file actually paints, in viewBox units.
 *
 * The `fill:none` rect is the exporter's artboard: invisible, spans the whole viewBox, and would
 * answer this question with "all of it".
 */
async function inkBox(svg, file) {
  const vb = viewBoxOf(svg, file);
  const k = MEASURE_PX / Math.max(vb.w, vb.h);
  const { data, info } = await sharp(Buffer.from(svg))
    .resize({ width: Math.round(vb.w * k), height: Math.round(vb.h * k), fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let x0 = info.width;
  let y0 = info.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error(`${file}: renders nothing`);

  const round = (n) => Number(n.toFixed(2));
  return {
    x: round(vb.x + x0 / k),
    y: round(vb.y + y0 / k),
    w: round((x1 - x0 + 1) / k),
    h: round((y1 - y0 + 1) / k),
  };
}

async function build(from) {
  const source = fs.readFileSync(path.join(ROOT, from), 'utf8');

  let svg = dropElementById(source, WORDMARK_ID, from);
  svg = svg.replace(/\s*<rect\b[^>]*style="fill:none;?"[^>]*\/>\n?/g, '');
  svg = svg.replace(/\s+serif:[\w-]+="[^"]*"/g, '').replace(/\s+xmlns:serif="[^"]*"/g, '');
  svg = dropUnusedGradients(svg);
  svg = svg.replace(/\n[ \t]*\n/g, '\n');

  const ink = await inkBox(svg, from);
  return svg.replace(/viewBox="[^"]+"/, `viewBox="${ink.x} ${ink.y} ${ink.w} ${ink.h}"`);
}

// ---------------------------------------------------------------------------------------------

const check = process.argv.includes('--check');
const stale = [];

for (const { from, to } of PAIRS) {
  const built = await build(from);
  const target = path.join(ROOT, to);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;

  if (check) {
    if (current === built) console.log(`✓ ${to}`);
    else {
      console.log(`✗ ${to} — does not match ${from}`);
      stale.push(to);
    }
    continue;
  }

  if (current === built) console.log(`· ${to} (unchanged)`);
  else {
    fs.writeFileSync(target, built);
    console.log(`✓ ${to} (${built.length.toLocaleString('en-US')} B, from ${from})`);
  }
}

if (check) {
  if (stale.length) {
    console.log(`\n${stale.length} file(s) out of date — run \`pnpm generate:brand-pin\`.`);
    process.exit(1);
  }
  console.log('✓ pin files match the lockups they are cut from');
}
