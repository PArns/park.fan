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
 *     pnpm check:card-framing --url=/de/parks/north-america/united-states/…
 *
 * The four pages below are the regression set and run by default. `--url=` (repeatable)
 * checks a specific page instead — the invariant is on the box, so it holds for any
 * surface that renders cards, and a park only reaches some card states while its live
 * data says so, which the fixed list cannot reproduce.
 *
 * ## What this check cannot say about a ride that is DOWN
 *
 * Measured 2026-09-13 (PAR-13), because the obvious expectation is the wrong one: a
 * DOWN ride's card adds an outage line, so it looks like the clearest way to square a
 * box. It is not, and it never reaches this assertion. `hasBottomPanel` is
 * `isOperatingOrUnknown && waitTime !== null` (`components/parks/attraction-card.tsx`),
 * so a DOWN card renders NO bottom panel at all: its framed layer takes that row as
 * well (`row-span-2`) and lands in the unpanelled branch below, which is exempt by
 * design — the whole card is the visible photo there, so there is no crop to choose.
 * The outage note is therefore never the thing that squares a guarded box, and pointing
 * `--url=` at a park full of DOWN rides grades nothing rather than grading them.
 * What this check guards is the OPERATING card with a wait time. Same spelling as
 * `scripts/measure-cls.mjs`, so one page can be handed to both.
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
const DEFAULT_PAGES = [
  ['ride cards', '/de/parks/europe/netherlands/sevenum/attractiepark-toverland'],
  ['park cards', '/de/parks/europe/netherlands'],
  ['blog cards', '/de/blog'],
  ['home', '/de'],
];

// pnpm forwards a literal `--` ahead of the script's own arguments; it is a separator,
// not an argument, and rejecting it would fail `pnpm check:card-framing -- --url=…`.
const argv = process.argv.slice(2).filter((a) => a !== '--');
const urlArg = argv.filter((a) => a.startsWith('--url=')).map((a) => a.slice(6));

// A mistyped page must not read as "no page asked for". `--url /path` with a space,
// a bare path, or `--url=` with nothing after it would each fall through to
// DEFAULT_PAGES and print a green result for four pages nobody asked about — a pass
// that answers a different question than the one that was put. A path or a whole URL
// is accepted, the same two forms `scripts/measure-cls.mjs` takes, so the page really
// can be handed to both.
const wellFormed = (a) =>
  a.startsWith('--url=') && (a.slice(6).startsWith('/') || a.slice(6).startsWith('http'));
const bad = argv.filter((a) => !wellFormed(a));
if (bad.length) {
  console.error(
    `Unrecognised argument: ${bad.map((a) => `"${a}"`).join(' ')}\n` +
      'Usage: pnpm check:card-framing [--url=/de/… [--url=/de/…]]  (BASE=… to point elsewhere)'
  );
  process.exit(2);
}

const ASKED_FOR = urlArg.length > 0;
const PAGES = ASKED_FOR ? urlArg.map((path) => ['requested page', path]) : DEFAULT_PAGES;

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
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
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
/** Boxes that actually went square — the invariant this script is named after.
 *  Kept apart from `failures`, which also counts a page that could not be loaded
 *  or had nothing to measure: those make the run red without telling you anything
 *  about an aspect ratio, and the closing line used to report them as if they did. */
let squashed = 0;
let checked = 0;
/** Photos the invariant was actually applied to. `checked` counts every framed photo
 *  found, but an unpanelled card is explicitly exempt (its photo spans the card, there
 *  is no crop to choose), so a page whose cards are all unpanelled — a closed park with
 *  no live wait times renders exactly that — evaluates the rule zero times while
 *  printing a line per photo. Grading nothing is the case this script must not report
 *  as a pass, and "N photos checked" is not the number that says whether it did. */
let graded = 0;
/** Pages that never rendered — a timeout or a dead server, as opposed to a page that
 *  loaded fine and simply had no card to grade. The two want different advice. */
let unloadable = 0;

for (const [label, path] of PAGES) {
  let rows;
  try {
    rows = await measure(page, path);
  } catch (error) {
    console.error(`✗ ${label} (${path}) — could not load: ${error.message.split('\n')[0]}`);
    failures++;
    unloadable++;
    continue;
  }

  if (rows.length === 0) {
    // In the default set this is ordinary: not every surface renders a framed photo,
    // and the other three still grade the invariant. A page named with `--url=` is the
    // opposite case — it IS the run, and finding nothing to measure on it means the
    // question was not answered. Exiting 0 there reports "the box is fine" about a page
    // whose box was never looked at, which is the one outcome worse than a red run:
    // most parks whose rides go down carry no card photos at all, so this is the
    // common case for the flag rather than the exotic one.
    if (ASKED_FOR) {
      console.error(`✗ ${label} (${path}) — no framed photos on this page, nothing measured`);
      failures++;
      continue;
    }
    console.log(`· ${label} (${path}) — no framed photos on this page`);
    continue;
  }

  console.log(`\n${label} (${path})`);
  for (const row of rows) {
    checked++;
    if (row.panelled) graded++;
    const ok = !row.panelled || row.boxAspect >= MIN_BOX_ASPECT;
    if (!ok) {
      failures++;
      squashed++;
    }
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
  `\n${checked} framed photo${checked === 1 ? '' : 's'} found, ${graded} in a panelled card ` +
    `(the ones the rule applies to), ${squashed} below ${MIN_BOX_ASPECT}.`
);

// Nothing measured is not a pass, in either mode. The `--url=` branch above catches
// the single named page; this catches the whole run going quiet — rename the
// `data-card-photo="frame"` hook, or let every page 404 (`goto` with
// `domcontentloaded` resolves on a 404 as happily as on a 200), and the four default
// pages each print "no framed photos" while the gate reports success. A release check
// that cannot fail is worse than none: it answers the question it was asked.
const nothingMeasured = graded === 0;
if (nothingMeasured) {
  // Two different causes, and naming the wrong one sends the reader after a rename that
  // never happened: if every page threw, the pages are the story, not the selector.
  console.error(
    unloadable === PAGES.length
      ? `Nothing was measured — no page loaded far enough to grade. Is ${BASE} up?`
      : 'Nothing was measured — no framed photo sat in a panelled card, so the rule was\n' +
          `never applied. Check that ${BASE} is the site you meant, that ${FRAME} still\n` +
          'exists, and that the pages render cards with a bottom panel.'
  );
}

if (squashed > 0) {
  console.error(
    `A card's photo box has gone squarer than ${MIN_BOX_ASPECT}, so landscape photos in it\n` +
      'fill its height exactly and their focal point cannot move vertically.\n' +
      'See the note in components/parks/card-photo.tsx.'
  );
}

// `failures` counts pages that could not be graded and photos whose box went square;
// `nothingMeasured` is a property of the run as a whole and must not be added to it, or
// one empty page reports as two problems.
if (failures > 0 || nothingMeasured) {
  // Said plainly, because the line above it ("0 … fell below 1.5") reads like an
  // all-clear on a run that failed to load a page or found nothing to grade.
  const parts = [];
  if (squashed > 0)
    parts.push(`${squashed} photo${squashed === 1 ? '' : 's'} below ${MIN_BOX_ASPECT}`);
  const ungraded = failures - squashed;
  if (ungraded > 0) parts.push(`${ungraded} page${ungraded === 1 ? '' : 's'} not graded`);
  if (nothingMeasured && !parts.length) parts.push('nothing measured');
  console.error(`\nFAILED — ${parts.join(', ')}.`);
  process.exit(1);
}
