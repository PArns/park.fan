#!/usr/bin/env node
/**
 * Assert that the hero's search list keeps one height through the three states it passes on load,
 * on a desktop and on a phone, and that the flow reserves exactly that height.
 *
 * The list hangs from the field and floats (`HeroSearchFrame`), so the hero reserves its RESTING
 * height in its own flow with a spacer under the field; the bottom of the plate sits exactly one
 * list-height down. Three pieces of markup have to agree on that height:
 *
 *   1. `HeroSearchShell` — the skeleton the static shell paints before any search code runs,
 *      reserving `--hero-search-rest-h`.
 *   2. The pending list — the desktop panel (`HeroInlineSearchPanel`) or the phone's list
 *      (`HeroPhoneList`) while the nearby lookup is in flight.
 *   3. The settled list, whose measured height takes over the reservation from `md` up.
 *
 * Each frame carries its state in `data-state`; a requestAnimationFrame loop records the frame's
 * height in every state it passes. They had drifted to 252 / 288 / 270 px once. Nothing errors when
 * that happens: the build is green, every state looks right on its own, and the only symptom is
 * the plate's lower edge hopping when the panel mounts and again when its data lands. A locale
 * with a longer string, another row, a changed row height or a new footer can each re-open it.
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:hero-search-rest
 *     BASE=http://localhost:3000 pnpm check:hero-search-rest
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
/** Same fallback the other Playwright scripts use: the CI image's build when it is there, and
 *  otherwise nothing, which hands the choice to Playwright's own resolution. `CHROMIUM_PATH` is
 *  the name `check-card-framing`, `check-webmcp` and `render-coaster-elements` already honour —
 *  a second spelling would be a variable a developer exports and this script ignores. */
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};

/** All six, because the heading, the hint and the park names are all translated. */
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'];

/** The panel's viewport and the phone list's, the two lists the hero reserves. */
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
];

/**
 * How far the states may drift apart. Zero would fail on sub-pixel rounding in a locale whose
 * heading happens to land on a half pixel; 2 px is below what anybody can see move and well
 * under the 19 px regression this exists to catch.
 */
const TOLERANCE = 2;

const browser = await chromium.launch(LAUNCH);

let failures = 0;

for (const viewport of VIEWPORTS) {
  for (const locale of LOCALES) {
    // `reducedMotion` is not incidental: the hero's entrance scales its content to 0.965 for the
    // first second, so the shell's frame measures ~3.5 % short if it is caught mid-animation. Turning
    // the entrance off makes the comparison the layout one it is meant to be.
    const ctx = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      reducedMotion: 'reduce',
    });
    await ctx.addInitScript(() => {
      const seen = (window.__heroSearchHeights = {});
      const record = () => {
        const frame = document.querySelector('[data-hero-search-card]');
        if (frame) {
          const state = frame.getAttribute('data-state');
          const height = +frame.getBoundingClientRect().height.toFixed(1);
          (seen[state] ??= new Set()).add(height);
        }
        requestAnimationFrame(record);
      };
      requestAnimationFrame(record);
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${locale}`, { waitUntil: 'load' });
    // The first frame is the hero's; the step card further down has one too, settled from mount.
    await page.waitForFunction(
      () =>
        document.querySelector('[data-hero-search-card]')?.getAttribute('data-state') === 'settled',
      null,
      { timeout: 30_000 }
    );
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const frame = document.querySelector('[data-hero-search-card]');
      const spacer = frame.previousElementSibling.getBoundingClientRect();
      const field = spacer.top;
      return {
        heights: Object.fromEntries(
          Object.entries(window.__heroSearchHeights).map(([state, set]) => [state, [...set]])
        ),
        reserved: +spacer.height.toFixed(1),
        // The list's part of the frame: everything below the field's lower edge.
        needed: +(frame.getBoundingClientRect().bottom - field).toFixed(1),
      };
    });
    await ctx.close();

    const all = Object.values(result.heights).flat();
    const spread = Math.max(...all) - Math.min(...all);
    const missing = ['shell', 'settled'].filter((state) => !result.heights[state]);
    const reservedGap = Math.abs(result.needed - result.reserved);
    const ok = spread <= TOLERANCE && reservedGap <= TOLERANCE && missing.length === 0;
    if (!ok) failures++;

    const states = ['shell', 'pending', 'settled']
      .map((state) => `${state} ${result.heights[state]?.join('/') ?? '–'}`)
      .join('  ');
    console.log(
      `  ${ok ? 'ok  ' : 'FAIL'} ${viewport.name.padEnd(7)} ${locale}  ${states}  ` +
        `(spread ${spread.toFixed(1)}px) — reserved ${result.reserved}px vs ${result.needed}px needed` +
        (missing.length ? `  missing: ${missing.join(', ')}` : '')
    );
  }
}

await browser.close();

if (failures > 0) {
  console.error(
    `\n${failures} run(s) where the hero's resting search list changes height as it loads.\n` +
      'The plate ends right under that list, so every pixel of drift moves it.\n' +
      'See components/search/search-skeleton-list.tsx and --hero-search-rest-h in globals.css.'
  );
  process.exit(1);
}
console.log(
  `\n${LOCALES.length} locales × ${VIEWPORTS.length} viewports — the resting list holds its height throughout.`
);
