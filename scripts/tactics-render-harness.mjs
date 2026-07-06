/**
 * Queue Tactics headless render harness (project convention #12: verify
 * three.js scenes VISUALLY from every perspective before shipping).
 *
 * Boots the dev server, opens /dev/tactics in headless Chromium with
 * SwiftShader (software WebGL), drives a REAL deterministic match through
 * the window.__TACTICS__ hook (fixed seed: buy → place → clear both PvE
 * rounds → round 3 vs the AI), and screenshots:
 *
 *   planning + battle × cameras (default/top/side) × themes (dark/light)
 *   plus a portrait-phone planning/battle set.
 *
 * Output: screenshots/tactics/*.png  (gitignored artefacts for review)
 *
 * Usage:
 *   node scripts/tactics-render-harness.mjs [--url http://localhost:3000]
 */

import { mkdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const OUT = 'screenshots/tactics';
mkdirSync(OUT, { recursive: true });

const urlArg = process.argv.indexOf('--url');
const BASE = urlArg !== -1 ? process.argv[urlArg + 1] : null;
const SEED = 424242;

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

let server = null;
let base = BASE;
if (!base) {
  base = 'http://localhost:3199';
  console.log('▶ starting dev server on :3199 …');
  server = spawn('pnpm', ['next', 'dev', '--turbopack', '-p', '3199'], {
    stdio: 'ignore',
    detached: true,
  });
  if (!(await waitForServer(`${base}/dev/tactics`))) {
    console.error('dev server did not come up');
    process.exit(1);
  }
}

// The container pre-installs Chromium at /opt/pw-browsers (PLAYWRIGHT_SKIP_
// BROWSER_DOWNLOAD=1); fall back to it when the pinned playwright revision
// doesn't match the preinstalled one.
const preinstalled = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(preinstalled) ? { executablePath: preinstalled } : {}),
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
});

async function shoot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  📸 ${name}`);
}

/** Buy affordable shop cards + auto-place them on the board. */
async function buyAndPlace(page, rerolls = 1) {
  await page.evaluate((n) => {
    const T = window.__TACTICS__;
    for (let r = 0; r <= n; r++) {
      for (let s = 0; s < 5; s++) T.buy(s);
      if (r < n) T.reroll();
    }
    T.autoPlace();
  }, rerolls);
}

/** Skip through one battle round (fight, skip, wait for planning). */
async function clearRound(page) {
  await page.evaluate(() => window.__TACTICS__.fight());
  await page.waitForFunction(() => window.__TACTICS__.uiPhase() === 'battle', undefined, {
    timeout: 20000,
  });
  await page.evaluate(() => window.__TACTICS__.skip());
  await page.waitForFunction(() => window.__TACTICS__.uiPhase() === 'planning', undefined, {
    timeout: 20000,
  });
}

/** Fresh deterministic game advanced to round 3 (first PvP round vs the AI). */
async function driveGame(page) {
  await page.goto(`${base}/dev/tactics`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__TACTICS__, undefined, { timeout: 60000 });
  // Hide the Next.js dev-tools badge in screenshots.
  await page.addStyleTag({
    content: 'nextjs-portal, [data-nextjs-dev-tools-button] { display: none !important; }',
  });
  await page.evaluate((seed) => window.__TACTICS__.newGame(seed), SEED);
  await buyAndPlace(page, 1);
  await clearRound(page); // round 1 (minions)
  await buyAndPlace(page, 0);
  await clearRound(page); // round 2 (minions)
  // Round 3 planning: buy a couple, place, then reroll so the shop is
  // stocked in screenshots and the AI board is visible for scouting.
  await page.evaluate(() => {
    const T = window.__TACTICS__;
    T.buy(0);
    T.buy(1);
    T.autoPlace();
    T.reroll();
  });
  await page.waitForTimeout(1200); // settle assets/shadows
}

const suffix = (theme, cam) => `${theme}-${cam}`;

/* ---------------- landscape (desktop) ---------------- */
{
  const page = await (
    await browser.newContext({ viewport: { width: 1280, height: 800 } })
  ).newPage();
  page.on('pageerror', (e) => console.log('  ⚠ pageerror:', e.message));
  await driveGame(page);

  for (const theme of ['dark', 'light']) {
    await page.evaluate((t) => window.__TACTICS__.setTheme(t), theme);
    await page.waitForTimeout(300);
    for (const cam of ['default', 'top', 'side']) {
      await page.evaluate((c) => window.__TACTICS__.setCamera(c), cam);
      await page.waitForTimeout(900); // camera easing
      await shoot(page, `planning-${suffix(theme, cam)}`);
    }
  }

  // Battle: fight at 1×, capture early/mid frames in all cams/themes.
  await page.evaluate(() => {
    window.__TACTICS__.setCamera('default');
    window.__TACTICS__.setTheme('dark');
    window.__TACTICS__.setSpeed(1);
    window.__TACTICS__.fight();
  });
  await page.waitForTimeout(2000);
  await shoot(page, `battle-early-dark-default`);
  await page.waitForTimeout(1600);
  await shoot(page, `battle-mid-dark-default`);
  for (const cam of ['top', 'side']) {
    await page.evaluate((c) => window.__TACTICS__.setCamera(c), cam);
    await page.waitForTimeout(900);
    await shoot(page, `battle-mid-dark-${cam}`);
  }
  await page.evaluate(() => {
    window.__TACTICS__.setTheme('light');
    window.__TACTICS__.setCamera('default');
  });
  await page.waitForTimeout(900);
  await shoot(page, `battle-mid-light-default`);
  // Ride the battle to the end → banner.
  await page.waitForFunction(() => window.__TACTICS__.uiPhase() !== 'battle', undefined, {
    timeout: 120000,
  });
  await page.waitForTimeout(400);
  await shoot(page, `after-battle-banner`);
  await page.close();
}

/* ---------------- portrait (phone) ---------------- */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('  ⚠ pageerror:', e.message));
  await driveGame(page);
  await page.evaluate(() => window.__TACTICS__.setTheme('dark'));
  await page.waitForTimeout(600);
  await shoot(page, 'phone-planning-dark');
  await page.evaluate(() => window.__TACTICS__.setTheme('light'));
  await page.waitForTimeout(400);
  await shoot(page, 'phone-planning-light');
  await page.evaluate(() => {
    window.__TACTICS__.setTheme('dark');
    window.__TACTICS__.setSpeed(1);
    window.__TACTICS__.fight();
  });
  await page.waitForTimeout(2800);
  await shoot(page, 'phone-battle-dark');
  await page.close();
}

await browser.close();
if (server) {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
}
console.log(`\n✅ contact sheet in ${OUT}/`);
