#!/usr/bin/env node
/**
 * Drive the trip planner in a browser and check what it actually says.
 *
 * `tsc` proves the types line up and the build proves it compiles. Neither
 * proves the store rehydrates from localStorage, the launcher appears, the sheet
 * opens on the right edge (or the bottom one on a phone), the rows keep the
 * fixed height the drag maths counts in, or that a tick survives a reload. Those
 * are the things that break, and every one of them breaks silently.
 *
 * The part worth explaining is how it treats a missing backend. `/plan/day` is a
 * new endpoint and it ships on its own schedule, so this script ASKS first and
 * then asserts against the answer:
 *
 *   200 → the panel must draw bars and a settled context band.
 *   404 → the panel must SAY there is no forecast for that day, and must draw
 *         neither a bar nor a skeleton. That is a real assertion, not a pass by
 *         omission: an empty bar track beside an em dash reads as a wait of
 *         zero, and a skeleton that never resolves reads as still loading.
 *   else → a failure, including a 502 from the proxy.
 *
 * Console errors fail the run, except the one 404 the probe already established.
 * Waiving it wholesale would blind the check to the next one.
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:planner
 *     BASE=http://localhost:3000 pnpm check:planner
 */

import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
// Same rule as scripts/check-card-framing.mjs: prefer a Chromium the image
// already ships (CI and the container block `playwright install`).
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

const PARK = {
  slug: 'phantasialand',
  name: 'Phantasialand',
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
};

/** Tomorrow, park-local enough for a fixture — never today, so the run is stable. */
const DATE = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

const PLAN_PATH = `/api/parks/${PARK.geo.continent}/${PARK.geo.country}/${PARK.geo.city}/${PARK.slug}/plan/day?date=${DATE}`;

/** A second park, five days out, so the overview has more than one row to draw. */
const OTHER = {
  slug: 'europa-park',
  name: 'Europa-Park',
  geo: { continent: 'europe', country: 'germany', city: 'rust' },
};
const OTHER_DATE = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);

const PLAN = {
  parks: {
    [OTHER.slug]: {
      ...OTHER,
      days: {
        [OTHER_DATE]: {
          date: OTHER_DATE,
          entries: [
            {
              id: 'voltron-1',
              attractionSlug: 'voltron-nevera',
              attractionName: 'Voltron Nevera',
              hour: 10,
            },
            {
              id: 'silver-star-1',
              attractionSlug: 'silver-star',
              attractionName: 'Silver Star',
              hour: 13,
            },
          ],
        },
      },
    },
    [PARK.slug]: {
      ...PARK,
      days: {
        [DATE]: {
          date: DATE,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', hour: 10 },
            { id: 'fly-1', attractionSlug: 'fly', attractionName: 'F.L.Y.', hour: 12 },
            {
              id: 'black-mamba-1',
              attractionSlug: 'black-mamba',
              attractionName: 'Black Mamba',
              hour: 15,
            },
          ],
        },
      },
    },
  },
  activeParkSlug: PARK.slug,
  activeDate: DATE,
  version: 2,
};

const LAUNCHER = 'button[aria-label="Planer öffnen"]';
const SHEET = '[data-slot="sheet-content"]';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/** Seeds the plan the way the store writes it, then loads the page fresh. */
async function seed(page) {
  await page.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((plan) => {
    window.localStorage.setItem('parkfan_planner', JSON.stringify(plan));
    document.cookie = 'planner=1; path=/';
  }, PLAN);
  await page.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
}

// ── Is the backend endpoint live? ────────────────────────────────────────────
let planStatus;
try {
  planStatus = (await fetch(`${BASE}${PLAN_PATH}`)).status;
} catch (error) {
  console.error(`Could not reach ${BASE} — is the site running? (${error.message})`);
  process.exit(1);
}

if (planStatus === 200) {
  console.log(`/plan/day answers 200 — checking the panel against real figures.\n`);
} else if (planStatus === 404) {
  console.log(
    `/plan/day answers 404 — the backend endpoint is not live for this park and date.\n` +
      `Checking that the panel SAYS so rather than drawing empty bars.\n`
  );
} else {
  console.error(`/plan/day answered ${planStatus}. Expected 200 or 404 — a 502 is a real failure.`);
  process.exit(1);
}
const live = planStatus === 200;

const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);

const consoleErrors = [];
const noteErrors = (page) =>
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() !== 'error' && !/MISSING_MESSAGE/.test(text)) return;
    // The one 404 the probe above already established. Everything else counts.
    if (!live && /404/.test(text) && /plan\/day|Failed to load resource/.test(text)) return;
    consoleErrors.push(text);
  });

// ── Desktop ──────────────────────────────────────────────────────────────────
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
noteErrors(page);

// An empty plan must render no launcher — on the server AND after hydration, or
// the button appears out of nowhere a second after the page settles.
await page.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
check('ohne Plan kein Launcher', (await page.locator(LAUNCHER).count()) === 0);

await seed(page);

const launcher = page.locator(LAUNCHER);
await launcher.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
const hasLauncher = (await launcher.count()) === 1;
check('Launcher erscheint mit Plan', hasLauncher);

if (!hasLauncher) {
  console.error('\nOhne Launcher ist der Rest nicht prüfbar.');
  await browser.close();
  process.exit(1);
}

// Three in the active day plus two in the other park: the badge counts the
// whole plan, not the day on screen.
check('Launcher zählt beide Parks', /5/.test((await launcher.textContent()) ?? ''));

await launcher.click();
const sheet = page.locator(SHEET);
await sheet.waitFor({ state: 'visible', timeout: 10_000 });
check('Flyout öffnet', await sheet.isVisible());

// The query, and then the render it feeds.
await page
  .waitForFunction((sel) => !document.querySelector(`${sel} .animate-pulse`), SHEET, {
    timeout: 20_000,
  })
  .catch(() => {});

const rows = page.locator('li[data-planner-entry]');
check('drei Einträge in der Zeitleiste', (await rows.count()) === 3);

const sheetText = (await sheet.textContent()) ?? '';
check('Park steht im Kopf', /Phantasialand/.test(sheetText));
check('deutscher Text, keine rohen Keys', !/planner\.[a-z]|parks\.weather/i.test(sheetText));

// The drag maths indexes by a fixed row height; a row that grows with its data
// would drop an entry in the wrong place.
const heights = await rows.evaluateAll((els) =>
  els.map((el) => Math.round(el.getBoundingClientRect().height))
);
check(
  'Zeilen sind 56 px hoch',
  heights.length === 3 && heights.every((h) => h === 56),
  `Höhen: ${heights.join(', ')}`
);

// A skeleton that never resolves is a panel claiming to still be loading.
const pulsing = await page.locator(`${SHEET} .animate-pulse`).count();
check('kein hängender Skeleton', pulsing === 0, `pulsierende Blöcke: ${pulsing}`);

const bars = await page.locator(`${SHEET} li[data-planner-entry] .rounded-full`).count();
if (live) {
  check('Balken werden gezeichnet', bars > 0, `gefunden: ${bars}`);
  check('mindestens eine Minutenzahl', /\d+\s*Min\./.test(sheetText));
} else {
  // No figure means no bar: an empty track beside an em dash reads as zero.
  check('ohne Prognose keine leeren Balken', bars === 0, `gefunden: ${bars}`);
  check(
    'ohne Prognose steht der Grund da',
    /keine Prognose vor/.test(sheetText),
    sheetText.slice(0, 80)
  );
}

// Ticking off writes through to storage, which is the whole persistence path.
const firstCheck = rows.first().locator('button[aria-label="Als gefahren markieren"]');
if (await firstCheck.count()) {
  await firstCheck.click();
  await page.waitForTimeout(400);
  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}')
  );
  const done = stored?.parks?.[PLAN.activeParkSlug]?.days?.[PLAN.activeDate]?.entries?.[0]?.done;
  check('Abhaken wird gespeichert', done === true, `done=${done}`);
} else {
  check('Abhaken-Knopf vorhanden', false);
}

// On a phone this input is the only way to add anything, so it may never vanish
// — not even when the day payload is missing.
check('Ride-Suche vorhanden', (await sheet.locator('input[type="search"]').count()) === 1);

// The overview: every park and day in one list, reached from the park name.
const toggle = sheet.locator('button[aria-expanded]').first();
check('Übersicht ist erreichbar', (await toggle.count()) === 1);
if (await toggle.count()) {
  await toggle.click();
  await page.waitForTimeout(400);
  const overviewText = (await sheet.textContent()) ?? '';
  check(
    'Übersicht listet beide Parks',
    /Europa-Park/.test(overviewText) && /Phantasialand/.test(overviewText)
  );
  // Picking a day switches park AND date, and drops back to the timeline.
  const otherDay = sheet.locator('button[aria-current], button').filter({ hasText: /Bahnen/ });
  const target = otherDay.first();
  await target.click();
  await page.waitForTimeout(600);
  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}')
  );
  check(
    'Auswahl in der Übersicht wechselt den Park',
    stored?.activeParkSlug === 'europa-park' && stored?.activeDate === OTHER_DATE,
    `${stored?.activeParkSlug} / ${stored?.activeDate}`
  );
  check('zurück auf der Zeitleiste', (await sheet.locator('input[type="search"]').count()) === 1);
}

// The sheet is a modal and outranks the language banner at z-[70]; at z-50 the
// banner painted straight across its header.
const covered = await page.evaluate((sel) => {
  const box = document.querySelector(sel)?.getBoundingClientRect();
  if (!box) return 'no sheet';
  const probe = document.elementFromPoint(box.x + box.width / 2, box.y + 12);
  return probe?.closest(sel) ? null : (probe?.tagName ?? 'nothing');
}, SHEET);
check('nichts liegt über dem Flyout', covered === null, covered ?? '');

// ── Phone ────────────────────────────────────────────────────────────────────
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
noteErrors(phone);
await seed(phone);

const phoneLauncher = phone.locator(LAUNCHER);
await phoneLauncher.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
if (await phoneLauncher.count()) {
  await phoneLauncher.click();
  await phone.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await phone.waitForTimeout(2500);
  // A bottom sheet spans the full width and sits on the bottom edge. Both are
  // measured against a REFERENCE element positioned the same way rather than
  // against the viewport: the scroll lock a modal installs changes what a fixed
  // element's `inset-x-0` resolves to, so `documentElement.clientWidth` and the
  // sheet legitimately disagree by a scrollbar and the check would fail for a
  // reason that has nothing to do with the sheet.
  const geometry = await phone.evaluate((sel) => {
    const sheet = document.querySelector(sel);
    if (!sheet) return null;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:1px;pointer-events:none';
    document.body.appendChild(probe);
    const full = probe.getBoundingClientRect();
    const box = sheet.getBoundingClientRect();
    probe.remove();
    return {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      bottom: Math.round(box.bottom),
      fullWidth: Math.round(full.width),
      floor: Math.round(full.bottom),
    };
  }, SHEET);
  const isBottom =
    geometry && geometry.width >= geometry.fullWidth - 1 && geometry.bottom >= geometry.floor - 1;
  check(
    'mobil als Bottom-Sheet',
    Boolean(isBottom),
    geometry
      ? `x=${geometry.x} y=${geometry.y} w=${geometry.width}/${geometry.fullWidth} unten ${geometry.bottom}/${geometry.floor}`
      : 'keine Box'
  );

  // 44 px is the phone tier the button scale already writes down.
  const handle = phone.locator('li[data-planner-entry] button[aria-label="Verschieben"]').first();
  const handleBox = await handle.boundingBox();
  check(
    'Griff ist auf dem Handy 44 px',
    Boolean(handleBox && Math.round(handleBox.height) >= 44),
    handleBox ? `${Math.round(handleBox.width)}×${Math.round(handleBox.height)}` : 'keine Box'
  );
} else {
  check('mobil als Bottom-Sheet', false, 'Launcher nicht gefunden');
}

check(
  'keine unerwarteten Konsolenfehler',
  consoleErrors.length === 0,
  consoleErrors.slice(0, 3).join(' | ')
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} bestanden`);
if (failed.length > 0) {
  console.log(failed.map((f) => `  · ${f.name}`).join('\n'));
}
process.exit(failed.length === 0 ? 0 : 1);
