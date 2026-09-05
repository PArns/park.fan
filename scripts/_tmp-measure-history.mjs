#!/usr/bin/env node
/** scratch: precise geometry of the ride history calendar. */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = process.env.CLS_BASE_URL || 'http://localhost:3000';
const PRE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const LAUNCH = existsSync(PRE) ? { executablePath: PRE } : {};
const urls = process.argv.slice(2);

const browser = await chromium.launch(LAUNCH);
for (const path of urls) {
  for (const vp of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'tablet-768', width: 768, height: 900 },
    { name: 'desktop-1440', width: 1440, height: 900 },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      extraHTTPHeaders: { 'x-forwarded-for': '91.64.1.1' },
    });
    const page = await ctx.newPage();
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(12000);
    const out = await page.evaluate(() => {
      const r3 = (x) => Math.round(x * 1000) / 1000;
      const sec = document.querySelector('#history');
      if (!sec) return { error: 'no #history section', title: document.title, url: location.href, sections: [...document.querySelectorAll('section[id]')].map(x=>x.id) };
      const panel = sec.querySelector('[style*="--ride-cal-h"]');
      const s = panel ? getComputedStyle(panel) : null;
      const reservation = s && {
        base: s.getPropertyValue('--ride-cal-h').trim(),
        lg: s.getPropertyValue('--ride-cal-h-lg').trim(),
      };
      const kids = panel ? [...panel.children] : [];
      const visible = kids.filter((el) => getComputedStyle(el).display !== 'none');
      const gridWrap = visible.find((el) => el !== visible[0]);
      const cells = [...sec.querySelectorAll('div[aria-label]')].filter((el) =>
        el.className.includes('min-h-')
      );
      const heights = cells.map((el) => r3(el.getBoundingClientRect().height));
      const tall = cells
        .map((el, i) => ({ i, h: heights[i], label: el.getAttribute('aria-label') }))
        .filter((c) => c.h !== Math.min(...heights))
        .slice(0, 6);
      let detail = null;
      if (gridWrap) {
        const header = gridWrap.querySelector(':scope > div.mb-2');
        const rowsWrap = header ? gridWrap.querySelector(':scope > div:nth-child(2)') : null;
        const rows = rowsWrap ? [...rowsWrap.children] : [...gridWrap.children];
        detail = {
          wrapH: r3(gridWrap.getBoundingClientRect().height),
          headerH: header ? r3(header.getBoundingClientRect().height) : null,
          headerMB: header ? getComputedStyle(header).marginBottom : null,
          rowCount: rows.length,
          rowH: rows.map((x) => r3(x.getBoundingClientRect().height)),
          gap: rows.length > 1
            ? r3(rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().bottom)
            : null,
        };
      }
      return {
        reservation,
        gridWrapClass: gridWrap ? gridWrap.getAttribute('class') : null,
        cellCount: cells.length,
        cellMin: Math.min(...heights),
        cellMax: Math.max(...heights),
        cellHistogram: heights.reduce((m, h) => ((m[h] = (m[h] ?? 0) + 1), m), {}),
        tallExamples: tall,
        detail,
      };
    });
    console.log('\n===', path, vp.name, '===');
    console.log(JSON.stringify(out, null, 2));
    await ctx.close();
  }
}
await browser.close();
