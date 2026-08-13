#!/usr/bin/env node
/**
 * Assert that the focal point can still move a card photo vertically.
 *
 * This exists because the failure it catches is invisible. `object-fit: cover`
 * scales an image to the LARGER of the two ratios it needs, so it overflows on one
 * axis and fits exactly on the other. If a card's photo box ends up taller (or
 * squarer) than the picture in it, the picture fills the box's height exactly,
 * there is no vertical overflow, and the Y half of `object-position` has nothing
 * to move. Nothing errors. The build is green. Dragging the focal point up and
 * down in `/admin/media` just renders byte-identical pixels, and the only symptom
 * is somebody saying "the focal point does nothing".
 *
 * The invariant is on the **box**, not on any one photo:
 *
 *     box aspect (w / h)  ≥  MIN_BOX_ASPECT
 *
 * …which is what `CardPhotoFrame` buys by living in the card's photo-spacer row
 * (the strip the two glass panels leave visible) instead of spanning the whole
 * card. Checking `box aspect > image aspect` instead would be wrong: a photo that
 * is natively 16:9 has no vertical range in a 1.67 box and never can, and that is
 * a property of the picture, not a regression in the layout. What must not happen
 * is the BOX going square — a third badge row, a wider footer, a changed `min-h`
 * can each quietly do that, and then every landscape photo loses its Y axis at once.
 *
 * Per-photo slack is reported anyway, because it is the number that answers "why
 * does the focal point barely move this one".
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:card-framing
 *     BASE=http://localhost:3000 pnpm check:card-framing
 *
 * Exits non-zero when a photo box has gone too square, naming the page and the
 * card, so it can gate a release check as easily as a manual look.
 */

import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
// Same rule as scripts/render-coaster-elements.mjs: prefer a Chromium the image
// already ships (CI and the container block `playwright install`).
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const FRAME = 'div[data-card-photo="frame"] img';

/** Surfaces that render the three card kinds, in the states they ship in. */
const PAGES = [
  ['ride cards', '/de/parks/europe/netherlands/sevenum/attractiepark-toverland'],
  ['park cards', '/de/parks/europe/netherlands'],
  ['blog cards', '/de/blog'],
  ['home', '/de'],
];

/**
 * How wide the photo strip has to stay. 1.5 is comfortably below where the cards
 * actually land (1.67 on the home tiles, 1.84 on ride and park cards) and well
 * above the ~1.0 that a full-card box collapses to, so it fails on the regression
 * and not on ordinary layout drift.
 *
 * Only applied to cards that actually have a bottom glass panel. A ride with no
 * live wait time renders none, its framed layer takes that row as well
 * (`row-span-2`), and the box is legitimately squarer — the whole card IS the
 * visible photo there, so there is no crop to choose and nothing to guard.
 */
const MIN_BOX_ASPECT = 1.5;

async function measure(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(5000);
  // Cards below the fold lazy-load their photos; walk the page so they all decode.
  await page.evaluate(() => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) window.scrollTo(0, y);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(3000);

  return page.evaluate((sel) => {
    const rows = [];
    for (const article of document.querySelectorAll('article')) {
      // A blog post page wraps its whole body in an <article>; only the innermost
      // ones are cards, and the wrapper would otherwise report the first card's
      // photo against the wrapper's own chrome.
      if (article.querySelector('article')) continue;
      const img = article.querySelector(sel);
      if (!img || !img.naturalWidth) continue;
      const box = img.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      rows.push({
        title: (article.querySelector('h3')?.textContent || '(untitled)').trim().slice(0, 32),
        imgAspect,
        boxAspect: box.width / box.height,
        box: `${Math.round(box.width)}×${Math.round(box.height)}`,
        slack: Math.round(Math.max(0, box.width / imgAspect - box.height)),
        panelled: !!article.querySelector('.pk-panel-bot'),
      });
    }
    return rows;
  }, FRAME);
}

const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });

let failures = 0;
let checked = 0;

for (const [label, path] of PAGES) {
  let rows;
  try {
    rows = await measure(page, path);
  } catch (error) {
    console.error(`✗ ${label} (${path}) — could not load: ${error.message.split('\n')[0]}`);
    failures++;
    continue;
  }

  if (rows.length === 0) {
    console.log(`· ${label} (${path}) — no framed photos on this page`);
    continue;
  }

  console.log(`\n${label} (${path})`);
  for (const row of rows) {
    checked++;
    const ok = !row.panelled || row.boxAspect >= MIN_BOX_ASPECT;
    if (!ok) failures++;
    const note = !row.panelled
      ? '  (no bottom panel — the photo spans the card, nothing to crop)'
      : row.slack === 0
        ? '  (photo is wider than the box — nothing to slide)'
        : '';
    console.log(
      `  ${ok ? (row.panelled ? 'ok  ' : 'full') : 'FAIL'} ${row.title.padEnd(32)} box ${row.box.padEnd(9)} ` +
        `${row.boxAspect.toFixed(2)} vs image ${row.imgAspect.toFixed(2)} — ${row.slack}px of vertical range` +
        note
    );
  }
}

await browser.close();

console.log(
  `\n${checked} framed photo${checked === 1 ? '' : 's'} checked, ` +
    `${failures} in a panelled card whose box fell below ${MIN_BOX_ASPECT}.`
);
if (failures > 0) {
  console.error(
    `A card's photo box has gone squarer than ${MIN_BOX_ASPECT}, so landscape photos in it\n` +
      'fill its height exactly and their focal point cannot move vertically.\n' +
      'See the note in components/parks/card-photo.tsx.'
  );
  process.exit(1);
}
