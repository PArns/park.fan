#!/usr/bin/env node
/**
 * Assert that the hero's search dropdown is the same height in all three of the states it
 * passes through on load.
 *
 * The hero reserves that dropdown's RESTING height in its own flow, because the card itself
 * floats — so whatever is under it (the nearby pills, and with them the bottom of the plate)
 * sits exactly one card-height down. Three separate pieces of markup have to agree on what that
 * height is:
 *
 *   1. `HeroSearchRestingCard` — the skeleton the static shell paints before the search chunk
 *      exists, reserving `--hero-search-rest-h`.
 *   2. `SearchResultsPanel`'s pending branch — what the real panel shows while its browse
 *      lookup is in flight.
 *   3. The settled list of three parks, whose measured height then takes over the reservation.
 *
 * They had drifted to 252 / 288 / 270 px. Nothing errors when that happens: the build is green,
 * every state looks right on its own, and the only symptom is the pill row hopping 19 px down
 * when the panel mounts and back up two seconds later when its data lands. A locale with a
 * longer heading, a fourth row, a changed row padding or a new footer can each re-open the gap.
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:hero-search-rest
 *     BASE=http://localhost:3000 pnpm check:hero-search-rest
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
// Same rule as scripts/check-card-framing.mjs: prefer a Chromium the image already ships.
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

/** All six, because the heading, the hint and the park names are all translated. */
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];

/** The card's own `mt-3`, which the reservation includes — DROPDOWN_TOP_GAP_PX in the panel. */
const TOP_GAP = 12;

/**
 * How far the three may drift apart. Zero would fail on sub-pixel rounding in a locale whose
 * heading happens to land on a half pixel; 2 px is below what anybody can see move and well
 * under the 19 px regression this exists to catch.
 */
const TOLERANCE = 2;

const browser = await chromium.launch({ executablePath: PREINSTALLED });

/** Height of whichever resting card is currently on screen, plus the reserved figure. */
const measure = (page) =>
  page.evaluate(() => {
    const card = document.querySelector('[data-hero-search-card]');
    const reserved = getComputedStyle(document.documentElement)
      .getPropertyValue('--hero-search-rest-h')
      .trim();
    return {
      card: card ? +card.getBoundingClientRect().height.toFixed(1) : null,
      reserved: Number.parseFloat(reserved),
    };
  });

let failures = 0;

for (const locale of LOCALES) {
  // `reducedMotion` is not incidental: the hero's entrance scales its content to 0.965 for the
  // first second, so the shell's card measures ~3.5 % short if it is caught mid-animation — and
  // the panel it is compared against arrives right around when that finishes. Turning the
  // entrance off makes the comparison the layout one it is meant to be.
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${locale}`, { waitUntil: 'load' });

  // 1. the shell's skeleton, before the lazy panel exists
  const shell = await measure(page);

  // 2. the panel's own pending state, and 3. the settled list
  await page.waitForSelector('[cmdk-root]', { timeout: 30_000 });
  const pending = await measure(page);
  await page.waitForSelector('[cmdk-root] [cmdk-item]', { timeout: 30_000 });
  await page.waitForTimeout(500);
  const settled = await measure(page);
  await ctx.close();

  const heights = [shell.card, pending.card, settled.card];
  const spread = Math.max(...heights) - Math.min(...heights);
  const reservedGap = Math.abs(settled.card + TOP_GAP - settled.reserved);
  const ok = spread <= TOLERANCE && reservedGap <= TOLERANCE;
  if (!ok) failures++;

  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'} ${locale}  shell ${shell.card}  pending ${pending.card}  ` +
      `settled ${settled.card}  (spread ${spread.toFixed(1)}px) — ` +
      `reserved ${settled.reserved}px vs ${settled.card + TOP_GAP}px needed`
  );
}

await browser.close();

if (failures > 0) {
  console.error(
    `\n${failures} locale(s) where the hero's resting dropdown changes height as it loads.\n` +
      'The nearby pills sit directly under that card, so every pixel of drift moves them.\n' +
      'See components/search/search-skeleton-list.tsx and --hero-search-rest-h in globals.css.'
  );
  process.exit(1);
}
console.log(`\n${LOCALES.length} locales — the resting dropdown holds its height throughout.`);
