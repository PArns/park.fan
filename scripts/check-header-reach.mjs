#!/usr/bin/env node
/**
 * Assert that the header's navigation can be reached on every page the bar floats over a hero.
 *
 * On six pages the header opens transparent over a full-bleed hero and turns solid after 50 px
 * of scroll (`isHeroPage` / `isTransparent` in components/layout/header.tsx). Until PAR-170 that
 * floating state also decided whether the navigation existed: `opacity-0 pointer-events-none` on
 * the nav row, the search trigger and the burger, `aria-hidden` on the `<nav>` and `tabIndex={-1}`
 * on every link. The menu was unclickable, untabbable and out of the accessibility tree until the
 * visitor scrolled, and that survived a green build, lint and every other check — a person
 * looking at the page found it. This script is the check that would have caught it.
 *
 * For each hero page × 360 px (touch) and 1440 px × light and dark, at scroll 0:
 *
 *   1. the bar is really in its floating state (the corner logo is the visible one), so a page
 *      that stopped being a hero does not pass for the wrong reason;
 *   2. the target — the first link in `<nav aria-label="Main navigation">` at 1440 px, the burger
 *      at 360 px, where the nav row is not drawn — is visible: a box, `visibility: visible`, and
 *      an opacity product over its ancestors of at least 0.99;
 *   3. its `pointer-events` is not `none`, and `elementFromPoint` on its centre lands on it;
 *   4. neither it nor the `<nav>` sits under an `aria-hidden`;
 *   5. it is in the tab order: pressing Tab from the top of the page reaches it;
 *   6. its ink reads at least 4.5 : 1 against the pixels the bar actually paints behind it.
 *
 * The contrast is measured, not looked up. `getComputedStyle` returns the ink as `lab(…)` with an
 * alpha (`text-foreground/90`), so it is resolved to sRGB through a canvas, and the ground is a
 * screenshot of the target's box with the target hidden — the hero photo, the scrim and the
 * material as composited. The ink is blended over each ground pixel at its own alpha and the
 * 5th-percentile contrast of those pixels is the figure (one stray highlight in a photo does not
 * decide it; a wash of them does).
 *
 * Needs a running site (`pnpm start` after a build, or `pnpm dev`):
 *
 *     pnpm check:header-reach
 *     BASE=http://localhost:3183 pnpm check:header-reach
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3000';
/** Same fallback as scripts/check-card-framing.mjs and check-hero-search-rest.mjs. */
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};

const LOCALE = 'en';
const MIN_CONTRAST = 4.5;
/** Presses of Tab before the target counts as out of the tab order. Corner logo, skip links and
 *  the entries before the first nav link come first; 20 is well clear of all of them. */
const MAX_TABS = 20;

const VIEWPORTS = [
  { name: '360', viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true },
  { name: '1440', viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false },
];
const THEMES = ['light', 'dark'];

/** The six hero pages, as `isHeroPage` in components/layout/header.tsx lists them. The article is
 *  looked up from the blog index so the check does not depend on one post's slug. */
async function heroPages(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${LOCALE}/blog`, { waitUntil: 'domcontentloaded' });
  const post = await page.evaluate((locale) => {
    const prefix = `/${locale}/blog/`;
    const skip = ['category/', 'tag/', 'authors/'];
    for (const a of document.querySelectorAll(`main a[href^="${prefix}"]`)) {
      const rest = a.getAttribute('href').slice(prefix.length);
      if (rest && !skip.some((s) => rest.startsWith(s))) return a.getAttribute('href');
    }
    return null;
  }, LOCALE);
  await ctx.close();
  if (!post) throw new Error(`No article link found on ${BASE}/${LOCALE}/blog`);
  return [
    ['home', `/${LOCALE}`],
    ['fancast', `/${LOCALE}/fancast`],
    ['best-time', `/${LOCALE}/best-time-to-visit`],
    ['guide', `/${LOCALE}/how-park-fan-works`],
    ['blog', `/${LOCALE}/blog`],
    ['article', post.split(/[?#]/)[0]],
  ];
}

/** Marks the target with `data-header-reach` and reports everything checked in the DOM. */
const inspect = (page, wide) =>
  page.evaluate((wide) => {
    const header = document.querySelector('header');
    const nav = header?.querySelector('nav[aria-label="Main navigation"]');
    const homes = header ? [...header.querySelectorAll('a[aria-label="park.fan - Home"]')] : [];
    const target = wide
      ? [...(nav?.querySelectorAll('a[href]') ?? [])].find((a) => a.getClientRects().length > 0)
      : header?.querySelector('button svg.lucide-menu')?.closest('button');
    if (!target) return { error: wide ? 'no visible link in the nav' : 'no burger button' };
    target.setAttribute('data-header-reach', '');

    let opacity = 1;
    let ariaHidden = null;
    for (let el = target; el && el !== document.documentElement; el = el.parentElement) {
      opacity *= Number.parseFloat(getComputedStyle(el).opacity);
      if (el.getAttribute('aria-hidden') === 'true') ariaHidden ??= el.tagName.toLowerCase();
    }
    const r = target.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const cs = getComputedStyle(target);
    return {
      floating: homes.length >= 2 && Number.parseFloat(getComputedStyle(homes[0]).opacity) > 0.5,
      scrollY: window.scrollY,
      box: { x: r.x, y: r.y, width: r.width, height: r.height },
      visibility: cs.visibility,
      opacity,
      pointerEvents: cs.pointerEvents,
      hitsTarget: !!hit && (hit === target || target.contains(hit)),
      ariaHidden,
      navAriaHidden: nav?.getAttribute('aria-hidden') ?? null,
      tabIndex: target.tabIndex,
      ink: cs.color,
      label: (target.textContent || target.getAttribute('aria-label') || '').trim().slice(0, 24),
    };
  }, wide);

/** Presses Tab from the top until the target has focus; returns the press count or null. */
async function tabsToTarget(page) {
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });
  for (let i = 1; i <= MAX_TABS; i++) {
    await page.keyboard.press('Tab');
    const found = await page.evaluate(() =>
      document.activeElement?.closest?.('[data-header-reach]') ? true : false
    );
    if (found) return i;
  }
  return null;
}

/**
 * Contrast of the ink against the ground under the target. The ground is screenshotted with the
 * target hidden (`visibility`, which `transition-colors` does not animate), then decoded and the
 * ink resolved in the page's own canvas, so `lab()` and `color-mix()` resolve exactly as painted.
 */
async function measureContrast(page, box, ink) {
  await page.addStyleTag({
    content: '[data-header-reach]{visibility:hidden!important;transition:none!important}',
  });
  await page.waitForTimeout(50);
  const png = await page.screenshot({
    clip: {
      x: Math.max(0, Math.floor(box.x)),
      y: Math.max(0, Math.floor(box.y)),
      width: Math.max(1, Math.round(box.width)),
      height: Math.max(1, Math.round(box.height)),
    },
  });
  return page.evaluate(
    async ({ b64, ink }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const ground = ctx.getImageData(0, 0, c.width, c.height).data;

      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, 1, 1);
      const [ir, ig, ib, ia] = ctx.getImageData(0, 0, 1, 1).data;
      const alpha = ia / 255;

      const lin = (v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratios = [];
      for (let i = 0; i < ground.length; i += 4) {
        const [gr, gg, gb] = [ground[i], ground[i + 1], ground[i + 2]];
        const lg = lum(gr, gg, gb);
        const li = lum(
          ir * alpha + gr * (1 - alpha),
          ig * alpha + gg * (1 - alpha),
          ib * alpha + gb * (1 - alpha)
        );
        ratios.push((Math.max(lg, li) + 0.05) / (Math.min(lg, li) + 0.05));
      }
      ratios.sort((a, b) => a - b);
      return {
        p05: ratios[Math.floor(ratios.length * 0.05)],
        min: ratios[0],
        ink: `rgba(${ir},${ig},${ib},${alpha.toFixed(2)})`,
      };
    },
    { b64: png.toString('base64'), ink }
  );
}

const browser = await chromium.launch(LAUNCH);
const pages = await heroPages(browser);
let failures = 0;
let cases = 0;
let worst = Infinity;
let worstAt = '';

for (const [name, path] of pages) {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      cases++;
      const ctx = await browser.newContext({
        viewport: vp.viewport,
        hasTouch: vp.hasTouch,
        isMobile: vp.isMobile,
        reducedMotion: 'reduce',
      });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {}
      }, theme);
      const page = await ctx.newPage();
      const tag = `${name.padEnd(9)} ${vp.name.padStart(4)} ${theme.padEnd(5)}`;
      const problems = [];
      let detail = '';
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => window.scrollTo(0, 0));
        // The hero image, the scrim and the header's own colour transitions settle.
        await page.waitForTimeout(1500);

        const wide = vp.viewport.width >= 1024;
        const s = await inspect(page, wide);
        if (s.error) {
          problems.push(s.error);
        } else {
          if (s.scrollY !== 0) problems.push(`scrollY ${s.scrollY}, not 0`);
          if (!s.floating) problems.push('bar is not in its floating state (not a hero page?)');
          if (s.box.width < 1 || s.box.height < 1) problems.push('target has no box');
          if (s.visibility !== 'visible') problems.push(`visibility ${s.visibility}`);
          if (s.opacity < 0.99) problems.push(`opacity ${s.opacity.toFixed(2)}`);
          if (s.pointerEvents === 'none') problems.push('pointer-events: none');
          if (!s.hitsTarget) problems.push('elementFromPoint misses the target');
          if (s.ariaHidden) problems.push(`aria-hidden on <${s.ariaHidden}>`);
          if (s.navAriaHidden === 'true') problems.push('aria-hidden on <nav>');
          if (s.tabIndex < 0) problems.push(`tabIndex ${s.tabIndex}`);

          // A second walk, because the first request against a cold server can still be
          // hydrating while the first walk runs and a re-render drops focus mid-way (seen once on
          // the homepage). A real regression — `tabIndex={-1}`, `disabled` — fails both.
          const tabs = (await tabsToTarget(page)) ?? (await tabsToTarget(page));
          if (tabs === null) problems.push(`not reached in ${MAX_TABS} tabs`);

          await page.evaluate(() => window.scrollTo(0, 0));
          const c = await measureContrast(page, s.box, s.ink);
          if (c.p05 < MIN_CONTRAST) problems.push(`contrast ${c.p05.toFixed(2)} : 1`);
          if (c.p05 < worst) {
            worst = c.p05;
            worstAt = tag.replace(/\s+/g, ' ');
          }
          detail =
            `"${s.label}"  tab ${tabs ?? '–'}  ink ${c.ink}  ` +
            `contrast ${c.p05.toFixed(2)} : 1 (min ${c.min.toFixed(2)})`;
        }
      } catch (err) {
        problems.push(err.message.split('\n')[0]);
      }
      if (problems.length) failures++;
      console.log(
        `  ${problems.length ? 'FAIL' : 'ok  '} ${tag}  ${detail}` +
          (problems.length ? `  — ${problems.join('; ')}` : '')
      );
      await ctx.close();
    }
  }
}

await browser.close();

if (failures > 0) {
  console.error(
    `\n${failures} of ${cases} cases where the header cannot be reached on a hero page at scroll 0.\n` +
      'The floating bar may change its material, never whether the navigation exists.\n' +
      'See components/layout/header.tsx (isTransparent) and headerNavInk in nav-menu.tsx.'
  );
  process.exit(1);
}
console.log(
  `\n${cases} of ${cases} reachable — worst contrast ${worst.toFixed(2)} : 1 (${worstAt}).`
);
