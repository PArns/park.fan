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
 * That assertion is only worth something against `pnpm dev`. React 19 compares
 * hydrated attributes in its DEVELOPMENT build alone — the production bundle
 * carries neither the comparison nor the "A tree hydrated but some attributes"
 * string — so a run against `pnpm start` is green on every hydration mismatch
 * in the app, including one that is a real bug.
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:planner
 *     BASE=http://localhost:3000 pnpm check:planner
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.env.BASE ?? 'http://localhost:3000';
// Same rule as scripts/check-card-framing.mjs: prefer a Chromium the image
// already ships (CI and the container block `playwright install`).
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

const PARK = {
  slug: 'phantasialand',
  name: 'Phantasialand',
  geo: { continent: 'europe', country: 'germany', city: 'bruehl' },
};

/**
 * Today in the PARK's zone, and the fixtures counted forward from it.
 *
 * "Park-local enough" was `Date.now() + 86_400_000` read in UTC, and it is not
 * enough for two hours every night: between 22:00 and 24:00 UTC, Berlin has
 * already rolled over while the UTC arithmetic has not, so "tomorrow" resolves
 * to the very date the panel calls TODAY. The run then took the today branch
 * everywhere — a now line, a minute clock, a live poll — while every assertion
 * was written for a stable future day, and two of them failed for the clock
 * rather than for the code. Both dates are counted in the park's own calendar
 * now, which is the same reading `parkToday()` does in the app.
 */
function parkDay(offsetDays) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + offsetDays)).toISOString().slice(0, 10);
}

const DATE = parkDay(1);

/**
 * The day after {@link DATE}, DERIVED from it rather than counted again.
 *
 * The same trap `parkDay` was written for, one level up: a second
 * `parkDay(2)` evaluated later in the run is a second reading of the clock, and
 * a run that crosses local midnight between the two gets two dates a day apart
 * that were meant to be adjacent. It happened — a full run started at 23:5x
 * Berlin seeded 2026-09-05, asserted against 2026-09-07 and failed three
 * two-column checks with the DOM showing exactly what had been asked for.
 */
const NEXT_DATE = new Date(new Date(`${DATE}T12:00:00Z`).getTime() + 86_400_000)
  .toISOString()
  .slice(0, 10);

const PLAN_PATH = `/api/parks/${PARK.geo.continent}/${PARK.geo.country}/${PARK.geo.city}/${PARK.slug}/plan/day?date=${DATE}`;

/** A second park, five days out, so the overview has more than one row to draw. */
const OTHER = {
  slug: 'europa-park',
  name: 'Europa-Park',
  geo: { continent: 'europe', country: 'germany', city: 'rust' },
};
const OTHER_DATE = parkDay(5);

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
              startMinute: 600,
            },
            {
              id: 'silver-star-1',
              attractionSlug: 'silver-star',
              attractionName: 'Silver Star',
              startMinute: 780,
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
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
            { id: 'fly-1', attractionSlug: 'fly', attractionName: 'F.L.Y.', startMinute: 750 },
            // Deliberately the OLD shape: the store lifts `hour * 60` for one
            // release, and a visitor with a second tab open across a deploy
            // would otherwise watch that tab quietly empty their trip.
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

// The way in is a tab on the window's edge, not a floating pill in the corner,
// and it is drawn on every page whether or not anything is planned — so this
// selector is a data attribute rather than an aria-label: the tab's accessible
// name is its own visible word, which differs per locale.
/**
 * How many chapters the planner's own page explains itself in.
 *
 * Three assertions below counted it separately and the number was written into
 * all three — so a seventh chapter turned two of them red and left the third
 * quietly passing, because it sliced at six and therefore stopped looking
 * exactly where the new one begins. The page will get more chapters.
 */
const CHAPTER_COUNT = 7;
/** `010203…`, derived rather than typed, for the no-gap assertion. */
const CHAPTER_NUMBERS = Array.from({ length: CHAPTER_COUNT }, (_, i) =>
  String(i + 1).padStart(2, '0')
).join('');

const LAUNCHER = '[data-planner-edge-tab]';
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
  }, PLAN);
  await page.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
}

/**
 * Wait until the main thread has nothing left to do, and only then open a MODAL
 * sheet.
 *
 * A modal Radix dialog marks everything outside itself `aria-hidden` +
 * `data-aria-hidden` — correct, and the whole reason a bottom sheet traps. Do it
 * while the page is still hydrating and React finds those attributes on nodes
 * the server never wrote them on, and reports "A tree hydrated but some
 * attributes … didn't match" once per boundary that hydrates afterwards.
 * Measured in isolation on the homepage at 390 px: 17 of them when the sheet
 * opens at `networkidle`, zero without opening it, zero on a desktop viewport
 * (the panel there is deliberately not modal) and zero with eight seconds of
 * quiet first. The mismatch is real and it is dev-only — the production React
 * build carries neither the comparison nor the string — so this is a
 * precondition of the measurement rather than a waiver: any hydration error
 * outside this window still fails the run.
 *
 * It does not make the RUN green, and that is worth stating rather than hiding:
 * the three warnings this file still reports arrive before the first assertion
 * has executed, from the pages the earlier blocks open, not from the phone one.
 * Waiting here fixes the block it is in and nothing else.
 *
 * It watched a MutationObserver first, and that was the wrong instrument for a
 * reason worth writing down: **hydration barely mutates the DOM.** React walks
 * server-rendered nodes and attaches to them, so the observer went quiet long
 * before React was done, and the check passed or failed depending on which of
 * the two won a race it could not see. Idle callbacks measure the thing that is
 * actually busy — three consecutive idle periods with real time left in them,
 * which a hydrating main thread does not hand out.
 */
async function settleHydration(page, idleRuns = 3, timeoutMs = 15_000) {
  await page
    .evaluate(
      ([runs, limit]) =>
        new Promise((resolve) => {
          const started = performance.now();
          let quiet = 0;
          const step = () => {
            if (performance.now() - started > limit) return resolve();
            requestIdleCallback(
              (deadline) => {
                quiet = deadline.timeRemaining() > 40 ? quiet + 1 : 0;
                if (quiet >= runs) resolve();
                else step();
              },
              { timeout: 500 }
            );
          };
          if (typeof requestIdleCallback === 'function') step();
          else setTimeout(resolve, 3000);
        }),
      [idleRuns, timeoutMs]
    )
    .catch(() => {});
}

// ── Every `quality` a planner image asks for must be configured ─────────────
//
// Next 16 answers an unconfigured `quality` with a 400 from the image
// optimizer, so the picture is simply absent in production — while `next dev`
// serves it and prints a warning nobody reads. Three planner surfaces shipped
// `quality={70}` and `quality={80}` against a configured `[50, 60, 75, 85, 90]`:
// the ride search's avatar, the page's polaroids and the wizard's photo band,
// i.e. every photograph the feature has. Static, so it runs before the browser
// starts and needs no site.
{
  const configured = new Set(
    (readFileSync('next.config.ts', 'utf8').match(/qualities:\s*\[([^\]]*)\]/)?.[1] ?? '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter(Number.isFinite)
  );
  const offenders = [];
  for (const file of readdirSync('components/planner')) {
    const source = readFileSync(`components/planner/${file}`, 'utf8');
    for (const [, value] of source.matchAll(/quality=\{(\d+)\}/g)) {
      if (!configured.has(Number(value))) offenders.push(`${file}: quality={${value}}`);
    }
  }
  check(
    'every planner image quality is in next.config images.qualities',
    configured.size > 0 && offenders.length === 0,
    offenders.length ? offenders.join(', ') : `configured: ${[...configured].join(', ')}`
  );
}

// ── The undo belongs to the day it was taken from ───────────────────────────
//
// `PlannerOptimizeActions` keeps the snapshot in component state while
// `parkSlug` and `date` arrive as props, and it is mounted with no `key` — so
// switching the panel to another day leaves the banner and its "Rückgängig"
// standing over a snapshot of the day before. `restoreDay` REPLACES a day, so
// pressing it wrote the 5th's rides into the 6th, and across a park switch a
// set of foreign slugs into a day that had never been optimised. Both of these
// are read off the source rather than driven in the browser: reproducing it
// needs the panel walked onto a SECOND day whose payload also carries a curve,
// and a check that silently passes because the second day was CLOSED would be
// worse than no check.
{
  const source = readFileSync('components/planner/planner-optimize-actions.tsx', 'utf8');
  check(
    'das Rückgängig schreibt in den Tag, aus dem der Schnappschuss stammt',
    /restoreDay\(\s*shownUndo\.parkSlug,\s*shownUndo\.date,\s*shownUndo\.entries\s*\)/.test(
      source
    ) && !/restoreDay\(\s*parkSlug\s*,\s*date\s*,/.test(source),
    (source.match(/restoreDay\([^)]*\)/) ?? ['keiner'])[0]
  );
  // A press that returns no plan has nothing to take back — and clearing the
  // snapshot there took away the way back from the press BEFORE it: plan the
  // headliners, press "Tag optimieren" to check, and the undo was gone.
  const noPlan = source.slice(source.indexOf('if (!plan) {'), source.indexOf('setUndoTo({'));
  check(
    'ein Druck ohne Plan fasst den Schnappschuss nicht an',
    noPlan.length > 0 && !/setUndoTo\(/.test(noPlan),
    noPlan.slice(0, 120).replace(/\s+/g, ' ')
  );
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
/**
 * Pages that ask `/plan/day` for a 404 ON PURPOSE.
 *
 * The waiver below covers the run's own stubbed pages, and only while the
 * backend is not answering (`!live`). One check needs the opposite: it routes a
 * 404 deliberately, to see what the wizard's photo band does when a day has no
 * answer — and the browser logs a failed resource for it either way. Keyed by
 * the page, so the waiver stops at that flow instead of covering the run.
 */
const allowPlanDay404 = new Set();
const noteErrors = (page) =>
  page.on('console', async (msg) => {
    // ARGUMENTS, not just `msg.text()`. The text is the FORMATTED message, and
    // React puts a hydration diff — the `+`/`-` lines that name the attribute
    // and its two values — in the arguments its `%s%s` placeholders consume. A
    // waiver or a diagnosis written against the text alone is deciding on a
    // string that does not contain the evidence: the same mismatch printed a
    // deep tree with the class in one run and a tree truncated at `<main>` in
    // another. Capped, because one of these arguments is a component tree.
    let text = msg.text();
    try {
      const args = await Promise.all(
        msg.args().map((a) =>
          a
            .jsonValue()
            .then((v) => (typeof v === 'string' ? v : ''))
            .catch(() => '')
        )
      );
      text = [text, ...args].join('\n').slice(0, 20_000);
    } catch {
      // A closed page cannot be asked; the formatted text still counts.
    }
    if (msg.type() !== 'error' && !/MISSING_MESSAGE/.test(text)) return;
    // The one 404 the probe above already established. Everything else counts.
    if (!live && /404/.test(text) && /plan\/day|Failed to load resource/.test(text)) return;
    // …and the one a check asks for itself — see {@link allowPlanDay404}.
    if (allowPlanDay404.has(page) && /404|Failed to load resource/.test(text)) return;
    // WHERE it happened, because this array is fed by every page in the run —
    // desktop, phone, the stubbed grid, the drag pair, the locale sweep — and a
    // failure that only prints the message sends the next reader hunting
    // through nine flows. An intermittent hydration warning cost exactly that:
    // it did not reproduce on any plain page load, and the report could not say
    // which of the run's navigations had produced it.
    consoleErrors.push(`[${page.url()}] ${text}`);
  });

// ── Desktop ──────────────────────────────────────────────────────────────────
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
noteErrors(page);

// An empty plan must STILL render the tab, which is the whole point of moving
// the way in out of the lazily-loaded chunk: a feature nobody can see is a
// feature nobody starts. What must not appear before the chunk lands is a raw
// message key, so the label is asserted too — the tab reads `navigation`, which
// the layout chrome already carries, and nothing from `planner`.
await page.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
await page
  .locator(LAUNCHER)
  .waitFor({ state: 'visible', timeout: 20_000 })
  .catch(() => {});
check('ohne Plan trotzdem der Tab', (await page.locator(LAUNCHER).count()) === 1);
{
  const label = await page
    .locator(LAUNCHER)
    .textContent()
    .catch(() => null);
  check(
    'der Tab nennt sich beim Namen, nicht beim Schlüssel',
    label?.trim() === 'Tagesplaner',
    JSON.stringify(label)
  );
}

await seed(page);

const launcher = page.locator(LAUNCHER);
await launcher.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
const hasLauncher = (await launcher.count()) === 1;
check('Launcher bleibt mit Plan', hasLauncher);

if (!hasLauncher) {
  console.error('\nOhne Launcher ist der Rest nicht prüfbar.');
  await browser.close();
  process.exit(1);
}

// Three in the active day plus two in the other park: the badge counts the
// whole plan, not the day on screen. Read from the tab's own text, which is the
// localized word plus the count and nothing else.
// WAITED for, and that is new: the tab is drawn on every page whether or not
// anything is planned, so `waitFor({ state: 'visible' })` above no longer
// implies the plan has been read out of localStorage. The count is what has to
// be waited for now, or this asserts against a tab that is merely present.
{
  const badge = await launcher
    .filter({ hasText: /5$/ })
    .waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  const tabText = ((await launcher.textContent()) ?? '').trim();
  check('Launcher zählt beide Parks', badge, JSON.stringify(tabText));
}

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
// "Meine Pläne", never the active park's name. The header used to print the
// plan's park, so standing on Toverland's page with a Phantasialand plan open
// put the wrong park's name over the panel — and the control it labels opens
// the list of ALL plans, so naming it after one of them was wrong twice.
check('der Kopf nennt die Planliste, nicht einen Park', /Meine Pläne/.test(sheetText));
check('deutscher Text, keine rohen Keys', !/planner\.[a-z]|parks\.weather/i.test(sheetText));

// The one claim the grid makes: a block's HEIGHT is its duration. Forty-five
// minutes at 1.2 px/min is 54 px, wherever the block sits — and the distance
// between two blocks is the distance between their times.
const blocks = page.locator('li[data-planner-block]');
const geometry = await blocks.evaluateAll((els) =>
  els.map((el) => ({
    id: el.dataset.plannerEntry,
    top: el.getBoundingClientRect().top,
    height: el.getBoundingClientRect().height,
  }))
);
if (live && geometry.length >= 2) {
  // 600 and 750 in the seed: 150 minutes apart, so 180 px apart.
  const delta = geometry[1].top - geometry[0].top;
  check(
    'Blockabstand ist der Zeitabstand',
    Math.abs(delta - 150 * 1.2) <= 1.5,
    `${Math.round(delta)} px`
  );
}
check(
  'kein Block ist kleiner als die Mindestbox',
  geometry.every((b) => b.height >= 19.5),
  geometry.map((b) => Math.round(b.height)).join(', ')
);

// The canvas is exactly the axis: (close + 30) − (open − 30) minutes × 1.2. It
// exists only where the park's hours are known, which is what `live` means here.
if (live) {
  const canvasHeight = await page
    .locator('[data-planner-grid] > div:last-child')
    .evaluate((el) => el.getBoundingClientRect().height)
    .catch(() => 0);
  check(
    'Achse ist so hoch wie der Tag lang ist',
    canvasHeight > 200,
    `${Math.round(canvasHeight)} px`
  );
}

// A skeleton that never resolves is a panel claiming to still be loading.
const pulsing = await page.locator(`${SHEET} .animate-pulse`).count();
check('kein hängender Skeleton', pulsing === 0, `pulsierende Blöcke: ${pulsing}`);

// The figure inside a block, and nothing else: the leg chips, the now pill and
// the show labels are all `rounded-full`, so the old selector would have gone
// red for entirely the wrong reason.
const bars = await page.locator(`${SHEET} [data-planner-block] [data-figure]`).count();
if (live) {
  check('Blöcke tragen ihre Zahl', bars > 0, `gefunden: ${bars}`);
  check('mindestens eine Minutenzahl', /\d+\s*Min\./.test(sheetText));
} else {
  // No figure means no bar: an empty track beside an em dash reads as zero.
  check('ohne Prognose keine Zahlen an den Blöcken', bars === 0, `gefunden: ${bars}`);
  check(
    'ohne Prognose steht der Grund da',
    /keine Prognose vor/.test(sheetText),
    sheetText.slice(0, 80)
  );
}

// Ticking off writes through to storage, which is the whole persistence path —
// and the tick is in a DIFFERENT PLACE on the two paths this panel has. The flat
// list (what a visitor sees while `/plan/day` 404s) puts it in the entry row; the
// grid puts it in the action bar a selected block raises, because a 24 px block
// has no room for a control and a plan is read before it is edited. This block
// used to look only in the row, so the day the endpoint went live it reported
// "Abhaken-Knopf vorhanden: false" on a panel whose tick-off works — and took
// the MIGRATION assertion down with it, which is the one that matters most here
// and is not about ticking at all.
const rowTick = rows.first().locator('button[aria-label="Als gefahren markieren"]');
let tickPath = null;
if (await rowTick.count()) {
  await rowTick.click();
  tickPath = 'Zeile';
} else {
  // The grid: select the first block, then use the bar it raises.
  const firstBlock = page.locator('li[data-planner-block]').first();
  if (await firstBlock.count()) {
    await firstBlock.click();
    await page.waitForTimeout(300);
    const barTick = page.locator('button[aria-label="Als gefahren markieren"]').first();
    if (await barTick.count()) {
      await barTick.click();
      tickPath = 'Aktionsleiste';
    }
  }
}
check('Abhaken ist erreichbar', tickPath !== null, tickPath ?? 'weder Zeile noch Aktionsleiste');

if (tickPath) {
  await page.waitForTimeout(400);
  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}')
  );
  const done = stored?.parks?.[PLAN.activeParkSlug]?.days?.[PLAN.activeDate]?.entries?.[0]?.done;
  check('Abhaken wird gespeichert', done === true, `done=${done} über ${tickPath}`);

  // The tick-off is the first store WRITE, and the store rewrites the whole plan
  // — so this is the first moment the migration is observable. The entry was
  // seeded in the old shape (`hour: 15`) on purpose: localStorage is a plan's
  // only copy, and a tab still running the previous build must not empty it.
  const migrated =
    stored?.parks?.[PLAN.activeParkSlug]?.days?.[PLAN.activeDate]?.entries?.find(
      (e) => e.id === 'black-mamba-1'
    )?.startMinute ?? null;
  check('alter Eintrag mit `hour` wird auf Minuten gehoben', migrated === 900, `${migrated}`);
}

// On a phone this input is the only way to add anything, so it may never vanish
// — not even when the day payload is missing.
check('Ride-Suche vorhanden', (await sheet.locator('input[type="search"]').count()) === 1);

// The overview: every park and day in one list, reached from the panel header.
// NOT `button[aria-expanded]` alone. The phone sheet's grab handle sits earlier
// in the DOM; it is `sm:hidden`, so on this desktop viewport `.first()` resolved
// to an invisible element and the click timed out for thirty seconds. The
// attribute exists for exactly this — the label is a translated string and was
// the park's name until it became "Meine Pläne".
const toggle = sheet.locator('[data-planner-overview-toggle]').first();
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
// banner painted straight across its header. Checked HERE rather than after the
// overview walk below, because that walk ends by finishing the wizard — which
// navigates to the park's own page, so the panel this measures is no longer the
// one on screen.
const covered = await page.evaluate((sel) => {
  const box = document.querySelector(sel)?.getBoundingClientRect();
  if (!box) return 'no sheet';
  const probe = document.elementFromPoint(box.x + box.width / 2, box.y + 12);
  return probe?.closest(sel) ? null : (probe?.tagName ?? 'nothing');
}, SHEET);
check('nichts liegt über dem Flyout', covered === null, covered ?? '');

// A park that is NOT in the plan yet. The overview lists parks WITH entries, so
// without a way to start a park from in here the visitor had to leave the panel,
// navigate to that park, and use a control there. Toverland is deliberately
// neither of the two seeded parks.
//
// The way in used to be a bare search field in this list. It is the WIZARD now,
// because that field asked which park and nothing else, leaving the two
// questions that decide whether a day works — which day, and who is coming — to
// be discovered in the panel afterwards. So the walk is longer: open the
// overview, press the button, land on the wizard's park step, search, pick, and
// only then is a park in the plan. Every claim the old block made about the hit
// row and the stored geo path still holds and is still checked; they have simply
// moved one dialog along.
const reopen = sheet.locator('button[data-planner-overview-toggle]');
// Asserted, not merely branched on: a block that quietly skips itself when its
// entry point is missing reports the same green as one that passed.
check('die Übersicht hat einen benannten Schalter', (await reopen.count()) === 1);
if (await reopen.count()) {
  await reopen.click();
  await page.waitForTimeout(300);

  const startWizard = sheet.locator('button[data-planner-new-day]');
  check('die Übersicht startet den Assistenten', (await startWizard.count()) === 1);

  if (await startWizard.count()) {
    await startWizard.first().click();
    const wizard = page.locator('[data-slot="dialog-content"]');
    await wizard.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    check('der Assistent öffnet', await wizard.isVisible());

    // The rail is the step counter, and it must show three marks and no footer
    // on the first step: picking a park IS the advance there, so a `Weiter`
    // button beside it is a control nobody ever presses.
    check(
      'der Assistent zeigt drei Schritte',
      (await wizard.locator('ol[aria-label] li').count()) === 3,
      `${await wizard.locator('ol[aria-label] li').count()}`
    );
    check(
      'im ersten Schritt kein Weiter-Knopf',
      (await wizard.locator('[data-planner-wizard-next]').count()) === 0
    );

    const parkSearch = wizard.locator('[data-planner-park-search] input[type="search"]');
    check('Parksuche im Assistenten', (await parkSearch.count()) === 1);

    if (await parkSearch.count()) {
      await parkSearch.fill('toverland');
      const hit = wizard
        .locator('[data-planner-park-search] button')
        .filter({ hasText: /Toverland/i });
      let found = false;
      try {
        await hit.first().waitFor({ state: 'visible', timeout: 6000 });
        found = true;
      } catch {
        found = false;
      }
      check('die Suche findet einen Park außerhalb des Plans', found);

      if (found) {
        // The row carries where the park IS, because two parks share a name
        // often enough — Disneyland Park is Anaheim and Paris.
        const rowText = (await hit.first().textContent()) ?? '';
        check(
          'die Trefferzeile nennt Ort und Land',
          /Sevenum/.test(rowText) && /Netherlands|Niederlande/i.test(rowText),
          rowText.trim()
        );

        await hit.first().click();
        await page.waitForTimeout(2500);

        // Picking a park does NOT write to the plan any more, and that is the
        // point of the wizard: the date is still unanswered, and the old
        // behaviour filed the park under today in the READER's zone — tomorrow's
        // plan for a Florida park picked from Germany after 18:00.
        const midway = await page.evaluate(() =>
          JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}')
        );
        check(
          'ein gewählter Park ohne Tag steht noch nicht im Plan',
          !midway?.parks?.['attractiepark-toverland']
        );

        // The park's own photograph, out of the search payload, in the band.
        // Matched against the ENCODED path: `next/image` rewrites the src to
        // `/_next/image?url=%2Fmedia%2F…`, so a `*="/media/"` selector finds
        // nothing and reports a missing picture that is on screen.
        const heroPhoto = await wizard
          .locator('img[src*="%2Fmedia%2F"], img[src^="/media/"]')
          .count();
        check('das Parkfoto steht im Kopf des Assistenten', heroPhoto >= 1, `${heroPhoto}`);
        const heroText = (await wizard.locator('[data-slot="dialog-title"]').textContent()) ?? '';
        check('der Kopf nennt den Park', /Toverland/i.test(heroText), heroText.trim());

        // The date step, on the month grid, and then the finish.
        const day = wizard.locator('[data-planner-day]:not([disabled])');
        const dayCount = await day.count();
        check('der Monatskalender bietet wählbare Tage', dayCount > 0, `${dayCount}`);

        if (dayCount > 0) {
          await day.nth(Math.min(dayCount - 1, 5)).click();
          await page.waitForTimeout(400);
          await wizard.locator('[data-planner-wizard-next]').click();
          await page.waitForTimeout(400);
          await wizard.locator('[data-planner-wizard-finish]').click();
          // Waited FOR rather than slept through: the wizard ends on the park's
          // own page, and under `next dev` that route is compiled on first
          // request — a fixed 1.2 s reported a navigation that had not committed
          // yet on a run where nothing was wrong.
          const landed = await page
            .waitForURL(/attractiepark-toverland/, { timeout: 45_000 })
            .then(() => true)
            .catch(() => false);
          await page.waitForTimeout(300);

          const after = await page.evaluate(() =>
            JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}')
          );
          const picked = after?.parks?.['attractiepark-toverland'];
          check(
            'nach dem Assistenten steht der Park im Plan',
            after?.activeParkSlug === 'attractiepark-toverland' && Boolean(picked),
            `${after?.activeParkSlug}`
          );
          // The geo path is TAKEN from the API's own URL, never rebuilt from the
          // display names in the row: "Netherlands" is not `netherlands` in every
          // language, and a guessed path is a plan pointing at a 404.
          check(
            'der Geopfad kommt aus der API',
            picked?.geo?.continent === 'europe' &&
              picked?.geo?.country === 'netherlands' &&
              picked?.geo?.city === 'sevenum',
            JSON.stringify(picked?.geo)
          );
          // The zone the best-days snapshot named, which is what stops the day
          // being filed under the reader's own date.
          check(
            'die Zeitzone des Parks kommt mit',
            picked?.timezone === 'Europe/Amsterdam',
            `${picked?.timezone}`
          );
          // The wizard ends on the park's page, so this panel is no longer on
          // the planner page it was opened from.
          check('der Assistent landet auf der Parkseite', landed, page.url());
        }
      }
    }
  }
}

// ── Phone ────────────────────────────────────────────────────────────────────
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
noteErrors(phone);
await seed(phone);

const phoneLauncher = phone.locator(LAUNCHER);
await phoneLauncher.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
// The one modal sheet in this file, and the only place that needs this — see
// `settleHydration`. The desktop panel is deliberately NOT modal and marks
// nothing outside itself, which is why the same open on a 1280 px viewport
// reports no hydration error at all.
await settleHydration(phone);
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
  // The grab handle. Two directions, two meanings: pull up and the sheet gives
  // the day more screen, push down far enough and it goes away. Asserted by
  // HEIGHT rather than by a class, because the first version resized nothing at
  // all — a pointer drag always ends in a click, and the tap handler toggled the
  // state straight back one event later. 717 px in, 717 px out, green build.
  const grab = phone.locator(`${SHEET} [data-planner-sheet-handle]`).first();
  // The CEILING, not the rendered height. The sheet is `h-auto` under a
  // `max-h`, so with a three-entry plan the content is 551 px and sits well
  // under the cap — raising the cap then moves nothing, correctly. What the
  // handle actually changes is the ceiling, so that is what is asserted.
  const sheetCap = () =>
    phone.locator(SHEET).evaluate((el) => Math.round(parseFloat(getComputedStyle(el).maxHeight)));

  check('der Anfasser ist da', (await grab.count()) === 1);
  if (await grab.count()) {
    const before = await sheetCap();
    const box = await grab.boundingBox();
    await phone.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await phone.mouse.down();
    await phone.mouse.move(box.x + box.width / 2, box.y - 80, { steps: 8 });
    await phone.mouse.up();
    await phone.waitForTimeout(500);
    const after = await sheetCap();
    check('hochziehen hebt die Obergrenze', after > before + 40, `${before} px -> ${after} px`);

    // And back down, so the geometry assertions below measure the sheet in the
    // state they were written for.
    const box2 = await grab.boundingBox();
    await phone.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await phone.mouse.down();
    await phone.mouse.move(box2.x + box2.width / 2, box2.y + 40, { steps: 6 });
    await phone.mouse.up();
    await phone.waitForTimeout(500);
    check(
      'herunterziehen senkt sie wieder',
      (await sheetCap()) === before,
      `${await sheetCap()} px`
    );
  }

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

  // The touch target on the grid's grip. Measured with `elementFromPoint` and
  // not with `boundingBox()`, because on a short block the target is grown by an
  // `after:` pseudo-element that a bounding box does not see.
  const phoneBlocks = phone.locator('li[data-planner-block]');
  if ((await phoneBlocks.count()) > 0) {
    // SCROLLED INTO VIEW first, and only then sampled. `elementFromPoint` takes
    // viewport coordinates and answers about whatever is painted there — so for
    // a block that the grid has scrolled out of sight it reports the element
    // that happens to occupy those coordinates instead. On the day the endpoint
    // went live this returned a suggestion pill from the ride search two hundred
    // pixels further down (`inBlock: false`), and the run called it a grip that
    // could not be touched. The desktop pass had always been fine because
    // nothing there scrolls the first block away.
    // The GRIP itself, asked of Playwright, rather than a point sampled off the
    // block. `click({ trial: true })` runs the full actionability chain —
    // visible, stable, enabled, RECEIVES EVENTS — scrolls the element in on its
    // own, and when something intercepts it names that element in the error.
    // That is exactly the question, and it is the one thing this probe never
    // asked: three earlier versions hit-tested a coordinate and were wrong three
    // times, first at a block the grid had scrolled away (a suggestion pill in
    // the ride search, "BUTTON"), then flush under the show band at
    // `sticky top-0 z-40` ("DIV"), then out of the scroller again while still
    // inside the viewport, which `getBoundingClientRect` cannot tell you because
    // it knows nothing about a clipping ancestor.
    //
    // The grip has a stable hook of its own, `aria-label="Verschieben"`, and it
    // carries the phone touch floor as `max-sm:w-11` — 44 px, the width
    // `globals.css` documents and `controls.tsx` uses. Both are asserted, and
    // the width is the deterministic half: a grip that shrinks below the floor
    // is a real regression whatever any hit test says.
    const grip = phoneBlocks.first().locator('button[aria-label="Verschieben"]');
    check('der Block hat genau einen Griff', (await grip.count()) === 1, `${await grip.count()}`);
    if ((await grip.count()) === 1) {
      const gripBox = await grip.boundingBox();
      check(
        'der Griff hält die Touch-Breite',
        Math.round(gripBox?.width ?? 0) >= 44,
        `${Math.round(gripBox?.width ?? 0)} px`
      );
      const reachable = await grip
        .click({ trial: true, timeout: 10_000 })
        .then(() => 'erreichbar')
        .catch((error) => String(error.message).split('\n')[0].slice(0, 120));
      check('Griff ist auf dem Handy treffbar', reachable === 'erreichbar', reachable);
    }
  } else {
    // No opening hours (which is what a 404 leaves), so the grid cannot draw and
    // the flat list is the honest fallback. It carries no grip by design: with
    // no axis there is no time to drag onto.
    const fallbackRows = await phone.locator('li[data-planner-entry]').count();
    check('ohne Achse rendert die Liste', fallbackRows > 0, `Zeilen: ${fallbackRows}`);
  }
} else {
  check('mobil als Bottom-Sheet', false, 'Launcher nicht gefunden');
}

// ── The calendar's way in ────────────────────────────────────────────────────
// A day is picked BEFORE any ride, so the launcher has to appear on a signal
// rather than on the count — with an empty plan it would otherwise stay hidden
// and the click would do nothing visible.
const cal = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
noteErrors(cal);
const CAL_URL = `${BASE}/de/parks/${PARK.geo.continent}/${PARK.geo.country}/${PARK.geo.city}/${PARK.slug}/wait-time-calendar`;
await cal.goto(CAL_URL, { waitUntil: 'domcontentloaded' });
// No plan at all: the point is that this works from nothing.
await cal.evaluate(() => {
  window.localStorage.removeItem('parkfan_planner');
});
await cal.reload({ waitUntil: 'networkidle' });
await cal.waitForTimeout(4000);

// The cell is a `div[role="button"]`, and the plan control only renders on a day
// the park is OPERATING — so try a few until one is open rather than assuming
// the first of the month is.
const cells = cal.locator('[role="button"][tabindex="0"][aria-label*="—"]');
const planButton = cal.getByRole('button', { name: 'Bahnen für diesen Tag einplanen' });
const cellCount = await cells.count();
let reachable = false;
for (let i = 0; i < Math.min(cellCount, 8) && !reachable; i++) {
  await cells.nth(i).click();
  await cal.waitForTimeout(1200);
  reachable = (await planButton.count()) > 0;
  if (!reachable) await cal.keyboard.press('Escape');
}
check('„Bahnen für diesen Tag einplanen" im Kalendertag', reachable, `Zellen: ${cellCount}`);

if (reachable) {
  await planButton.first().click();
  await cal
    .locator(SHEET)
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => {});
  check('Kalender öffnet den Planer', await cal.locator(SHEET).isVisible());
  const stored = await cal.evaluate(() =>
    JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}')
  );
  const entries = stored?.parks?.[PARK.slug]?.days?.[stored?.activeDate]?.entries ?? [];
  check(
    'Kalender setzt Park und Tag, ohne eine Bahn zu erfinden',
    stored?.activeParkSlug === PARK.slug && Boolean(stored?.activeDate) && entries.length === 0,
    `${stored?.activeParkSlug} / ${stored?.activeDate} / ${entries.length} Einträge`
  );
}

// ── The grid itself, against a stubbed payload ───────────────────────────────
// `/plan/day` answers 404 until the backend PR merges, so without this the whole
// day grid — the thing this feature IS — would go unverified by a green check.
// The fixture is a fixture and is labelled as one; what it exercises is the real
// geometry, the real drag and the real reducers.
{
  const grid = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(grid);

  const OPEN_HOUR = 9;
  const CLOSE_HOUR = 18;
  const curve = (peak) =>
    Array.from({ length: CLOSE_HOUR - OPEN_HOUR + 1 }, (_, i) => ({
      hour: OPEN_HOUR + i,
      wait: Math.round((peak * (0.4 + 0.6 * Math.sin((i / 9) * Math.PI))) / 5) * 5,
    }));

  await grid.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: 'Europe/Berlin',
        context: {
          date: DATE,
          status: 'OPERATING',
          openHour: OPEN_HOUR,
          closeHour: CLOSE_HOUR,
          crowdLevel: 'high',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 9,
        rides: [
          {
            attractionSlug: 'taron',
            attractionName: 'Taron',
            land: 'Klugheim',
            hours: curve(75),
            dayPeak: 75,
            uncertaintyMinutes: 18,
            sampleDays: 410,
            latitude: 50.7996,
            longitude: 6.8797,
            backgroundImage: '/media/phantasialand/taron.jpg?v=test',
            backgroundPosition: '50% 30%',
            downYesterday: true,
          },
          {
            attractionSlug: 'fly',
            attractionName: 'F.L.Y.',
            land: 'Rookburgh',
            hours: curve(95),
            dayPeak: 95,
            uncertaintyMinutes: 25,
            sampleDays: 380,
            latitude: 50.8001,
            longitude: 6.8812,
            // Warned as well as Taron, and for a different reason: at 12:30 its
            // queue is 85 minutes and the sentence has all the room it needs,
            // but its curve reads 40 at 09:00 — a 48 px box, which is the window
            // the clipping bug lived in. The move below is what exercises it.
            downYesterday: true,
          },
          {
            attractionSlug: 'black-mamba',
            attractionName: 'Black Mamba',
            land: 'Deep in Africa',
            hours: curve(35),
            dayPeak: 35,
            uncertaintyMinutes: null,
            sampleDays: 402,
            latitude: 50.7987204,
            longitude: 6.8807868,
          },
        ],
        shows: [],
      }),
    })
  );

  await seed(grid);
  await grid.locator(LAUNCHER).click();
  await grid.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await grid.waitForTimeout(2500);

  const blocks = grid.locator('li[data-planner-block]');
  const count = await blocks.count();
  check('das Raster zeichnet Blöcke', count === 3, `${count}`);

  if (count === 3) {
    const boxes = await blocks.evaluateAll((els) =>
      els.map((el) => ({
        id: el.dataset.plannerEntry,
        top: el.getBoundingClientRect().top,
        height: el.getBoundingClientRect().height,
      }))
    );
    const byId = Object.fromEntries(boxes.map((b) => [b.id, b]));

    // Taron sits at 600 and F.L.Y. at 750 — 150 minutes, so 180 px.
    check(
      'Blockabstand ist der Zeitabstand',
      Math.abs(byId['fly-1'].top - byId['taron-1'].top - 180) <= 1.5,
      `${Math.round(byId['fly-1'].top - byId['taron-1'].top)} px`
    );

    // And the height IS the wait. The fixture's curve is rounded to five, so
    // every block is a multiple of 5 × 1.2 px — or the 20 px minimum box, which
    // is a box and not a height claim.
    check(
      'Blockhöhe ist ein Vielfaches von 1,2 Minuten',
      boxes.every((b) => b.height === 20 || Math.abs((b.height / 1.2) % 5) < 0.01),
      boxes.map((b) => Math.round(b.height)).join(', ')
    );

    // The warning a ride carries when it was down all of yesterday, and the
    // photo. BOTH are asserted here, before the keyboard test moves the block
    // to a quieter hour: at 09:45 the queue is 30 minutes, the block is 36 px,
    // and under 48 px neither is drawn — deliberately, because a picture behind
    // two lines of text is a smear and a sentence has nowhere to go.
    const warned = await grid.locator('li[data-planner-block]').first().textContent();
    check(
      'gestern ganztägig ausgefallen wird gewarnt',
      /außer Betrieb/.test(warned ?? ''),
      (warned ?? '').slice(0, 60)
    );

    // The photo, resolved by the proxy route rather than shipped as a 107 KB
    // catalogue to every visitor.
    const hasPhoto = await grid.evaluate(() => {
      const block = document.querySelector('li[data-planner-block]');
      return [...(block?.querySelectorAll('div') ?? [])].some((el) =>
        el.style.backgroundImage.includes('taron.jpg')
      );
    });
    check('das Bild der Bahn liegt im Block', hasPhoto);

    // The text column is `overflow-hidden`, so a row let into a box too short
    // for it is not merely tight — it is cut through the middle of its glyphs,
    // and nothing about that fails a build, a typecheck or any assertion above.
    // The warning sentence did exactly this: it hung on the threshold that
    // admits the time range while being a THIRD line, so every block between
    // 48 and 54 px showed half a sentence. Assert the geometry rather than any
    // one threshold, and the next row added to this column is covered too.
    const clippedBlocks = () =>
      grid.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('li[data-planner-block]')) {
          const column = el.querySelector('div.min-w-0.flex-1');
          if (!column) continue;
          const box = el.getBoundingClientRect().height;
          const rows = [...column.children].reduce(
            (sum, child) => sum + child.getBoundingClientRect().height,
            0
          );
          // The column's own `py-0.5`.
          const needed = rows + 4;
          if (needed > box + 0.5) {
            const name = (el.textContent ?? '').trim().split('\n')[0].slice(0, 24);
            out.push(`${name}: ${Math.round(needed)}px in ${Math.round(box)}px`);
          }
        }
        return out;
      });

    check('kein Block schneidet seinen Text ab', (await clippedBlocks()).length === 0);

    // Nothing in the grid may start left of the grid itself. Overflow past the
    // INLINE-START edge of an LTR scroller is unreachable overflow: it never
    // enters `scrollWidth`, no scrollbar appears, and nothing reports it — which
    // is how "schließt ~19:00" sat in a 40 px gutter needing 50 (de) to 73 (it)
    // and was cut off in all six locales, on every park, every day.
    const overflowingLeft = await grid.evaluate(() => {
      const root = document.querySelector('[data-planner-grid]');
      if (!root) return ['no grid'];
      const left = root.getBoundingClientRect().left;
      const out = [];
      for (const el of root.querySelectorAll('span, p')) {
        const box = el.getBoundingClientRect();
        if (box.width === 0) continue;
        if (box.left < left - 0.5) {
          out.push(
            `"${(el.textContent ?? '').trim().slice(0, 22)}" ${Math.round(left - box.left)}px`
          );
        }
      }
      return out;
    });
    check(
      'nichts im Raster ragt links heraus',
      overflowingLeft.length === 0,
      overflowingLeft.join('; ')
    );

    // And the same question at the height where the answer was wrong. Moving
    // F.L.Y. to the day's FIRST slot puts a WARNED ride in a 48 px box, which is
    // the one shape the fixture above never produces on its own — without this
    // the assertion is green against the bug it exists to catch, which is worth
    // less than no assertion at all.
    //
    // Read off the input rather than typed: the earliest slot is the park's
    // opening PLUS `GATE_TO_FIRST_RIDE_MIN`, so a hard-coded 09:00 is below the
    // control's own `min` and Playwright answers "Malformed value" — a crash
    // rather than a failure, which took the rest of the run with it.
    // By id, never by position: a locator resolves when it is used, and moving a
    // block re-sorts the list — `nth(1)` after the move is a different ride than
    // `nth(1)` before it, so the restore below would put the WRONG block back.
    const flyBlock = grid.locator('li[data-planner-entry="fly-1"]');
    const flyRange = flyBlock.locator('input[type="range"]');
    const earliest = await flyRange.getAttribute('min');
    await flyRange.fill(earliest ?? '540');
    await grid.waitForTimeout(400);
    const shortBox = await flyBlock.evaluate((el) => Math.round(el.getBoundingClientRect().height));
    const clippedShort = await clippedBlocks();
    check(
      'auch ein 48-px-Block mit Warnung schneidet nichts ab',
      shortBox === 48 && clippedShort.length === 0,
      `Box ${shortBox}px${clippedShort.length ? ` — ${clippedShort.join('; ')}` : ''}`
    );
    // Back where it was: at 09:00 F.L.Y. sorts ahead of Taron, and everything
    // below here reaches for `blocks.first()` meaning Taron.
    await flyRange.fill('750');
    await grid.waitForTimeout(400);

    // The legs between them, with a verdict each.
    const legs = await grid
      .locator('li[data-planner-leg]')
      .evaluateAll((els) => els.map((el) => el.dataset.verdict));
    check('zwischen den Blöcken liegt je ein Bein', legs.length === 2, legs.join(', '));
    check(
      'jedes Bein trägt ein Urteil',
      legs.every((v) => ['broken', 'tight', 'good', 'generous', 'unknown'].includes(v)),
      legs.join(', ')
    );

    // Requirement 2: the drag may not go earlier than the ride can be ridden.
    // The floor is the ride's own `opensAt` where the API has one and the
    // park's opening otherwise — a FACT either way, which is why it is allowed
    // to refuse a placement. The stub's rides carry no `opensAt`, so this is the
    // park branch.
    const range = blocks.first().locator('input[type="range"]');
    const min = await range.getAttribute('min');
    check('die Untergrenze ist die Öffnung der Bahn', Number(min) === OPEN_HOUR * 60, `min=${min}`);

    // The keyboard equivalent writes through the same path a drag does.
    await range.focus();
    await grid.keyboard.press('ArrowDown');
    await grid.waitForTimeout(400);
    const afterKey = await grid.evaluate(() => {
      const plan = JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}');
      const days = plan?.parks?.phantasialand?.days ?? {};
      return Object.values(days)[0]?.entries?.find((e) => e.id === 'taron-1')?.startMinute ?? null;
    });
    check('die Tastatur verschiebt um genau einen Schritt', afterKey === 585, `${afterKey}`);

    // The band, on a day whose stub carries no shows at all. It used to say
    // "showtimes are only settled on the day itself", which was true while they
    // came off the live park payload and is not any more: `/plan/day` answers
    // for every date, so an empty array is now a statement about the PARK rather
    // than about the distance, and the band says it in those terms.
    const bandText = await grid.locator(`${SHEET} [data-planner-show-band]`).first().textContent();
    check(
      'Show-Band sagt, was es über Vorstellungen weiß',
      /Keine Spielzeiten/.test(bandText ?? ''),
      (bandText ?? '(leer)').slice(0, 60)
    );

    // Selecting a block has to reach its actions: a 20 px block cannot carry two
    // 44 px targets, so they dock instead — and until this was wired a block
    // could be selected and then neither ticked off nor removed.
    // Anywhere on the block, not on its 24 px grip.
    await blocks.first().click({ position: { x: 80, y: 8 } });
    await grid.waitForTimeout(300);
    const actionRow = grid.locator(`${SHEET} button[aria-label="Als gefahren markieren"]`);
    check('Auswahl blendet die Aktionen ein', (await actionRow.count()) > 0);
    if ((await actionRow.count()) > 0) {
      await actionRow.first().click();
      await grid.waitForTimeout(400);
      const done = await grid.evaluate(() => {
        const plan = JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}');
        const days = plan?.parks?.phantasialand?.days ?? {};
        return Object.values(days)[0]?.entries?.find((e) => e.id === 'taron-1')?.done ?? false;
      });
      check('Abhaken aus der Aktionsleiste greift', done === true, `${done}`);

      // Un-tick, so the `pointercancel` assertion below still reads a planned
      // block. A DIFFERENT selector on purpose: the button's `aria-label` flips
      // with its state, which is what makes it announce the action rather than
      // the noun — and re-using the first locator here times out precisely
      // because that works.
      const undo = grid.locator(`${SHEET} button[aria-label="Doch noch nicht gefahren"]`);
      check('der Knopf benennt jetzt die Gegenaktion', (await undo.count()) > 0);
      if ((await undo.count()) > 0) {
        await undo.first().click();
        await grid.waitForTimeout(300);
      }
    }

    // A gesture the browser steals must write nothing.
    const before = afterKey;
    await blocks.first().evaluate((el) => {
      const handle = el.querySelector('button');
      const box = el.getBoundingClientRect();
      const opts = { bubbles: true, clientY: box.top + 5, button: 0, pointerId: 1 };
      handle?.dispatchEvent(new PointerEvent('pointerdown', opts));
      handle?.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientY: box.top + 200 }));
      handle?.dispatchEvent(new PointerEvent('pointercancel', opts));
    });
    await grid.waitForTimeout(400);
    const afterCancel = await grid.evaluate(() => {
      const plan = JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}');
      const days = plan?.parks?.phantasialand?.days ?? {};
      return Object.values(days)[0]?.entries?.find((e) => e.id === 'taron-1')?.startMinute ?? null;
    });
    check('eine abgebrochene Geste schreibt nichts', afterCancel === before, `${afterCancel}`);
  }

  await grid.close();
}

// ── The headliner a plan is missing ─────────────────────────────────────────
// The CURATED flag, not the day's tallest bars. A plan holding Taron but not
// F.L.Y. has to say so, and has to stop saying it the moment F.L.Y. goes in —
// a hint that never goes away is a decoration.
{
  const hl = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(hl);

  const ride = (slug, name, headliner) => ({
    attractionSlug: slug,
    attractionName: name,
    land: 'Mystery',
    hours: Array.from({ length: 10 }, (_, i) => ({ hour: 9 + i, wait: 40 })),
    dayPeak: 40,
    uncertaintyMinutes: 10,
    sampleDays: 400,
    ...(headliner ? { isHeadliner: true } : {}),
  });

  await hl.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: 'Europe/Berlin',
        context: {
          date: DATE,
          status: 'OPERATING',
          openHour: 9,
          closeHour: 18,
          crowdLevel: 'moderate',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 7,
        rides: [
          // Taron is seeded into the plan; F.L.Y. is not. Black Mamba is a
          // headliner in neither sense — it must not appear in the hint.
          ride('taron', 'Taron', true),
          ride('fly', 'F.L.Y.', true),
          ride('black-mamba', 'Black Mamba', false),
        ],
        shows: [],
      }),
    })
  );

  await hl.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await hl.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE]
  );
  await hl.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await hl.locator(LAUNCHER).click();
  await hl.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await hl.waitForTimeout(2500);

  // The band of headliner pills is gone: it repeated rides the list below
  // already showed, with the same add handler, so an unplanned headliner in the
  // top eight rendered twice. What it said now sits on the ride's own row as a
  // crown, and this asserts the two halves of that — every ride is offered, and
  // the crown is on the curated headliners and on nothing else.
  const rows = hl.locator(`${SHEET} ul li button[draggable="true"]`);
  const listed = await rows.evaluateAll((els) =>
    els.map((el) => ({
      // The NAME span, not the first one: the first is the thumbnail's box, and
      // its `RollerCoaster` fallback is an svg, so `querySelectorAll('svg')`
      // reported a crown on every row in the park.
      name: (el.querySelector('span.min-w-0.flex-1')?.textContent ?? '').trim(),
      crown: Boolean(el.querySelector('svg[class*="crowd-high"]')),
    }))
  );
  check(
    'der fehlende Headliner wird angeboten',
    listed.some((r) => r.name === 'F.L.Y.'),
    JSON.stringify(listed.map((r) => r.name))
  );
  // The regression this replaced the band with: the list used to be
  // `day.rides.slice(0, 8)` over a payload the API sorts busiest first, so at
  // any park the first eight rows WERE its headliners and nothing else could be
  // found. Black Mamba is the fixture's non-headliner.
  check(
    'eine gewöhnliche Bahn steht auch in der Liste',
    listed.some((r) => r.name === 'Black Mamba'),
    JSON.stringify(listed.map((r) => r.name))
  );
  check(
    'die Liste steht alphabetisch',
    listed.map((r) => r.name).join('|') ===
      [...listed.map((r) => r.name)].sort((a, b) => a.localeCompare(b, 'de')).join('|'),
    JSON.stringify(listed.map((r) => r.name))
  );
  check(
    'die Krone sitzt auf den Headlinern und nur dort',
    listed.find((r) => r.name === 'F.L.Y.')?.crown === true &&
      listed.find((r) => r.name === 'Black Mamba')?.crown === false,
    JSON.stringify(listed)
  );
  // And the band names what the plan is still missing. It was taken out once,
  // because the eight rows under it repeated the same rides, and asked for back:
  // the list is a catalogue of everything the day has, the band a short
  // statement about THIS plan. It also has to survive the ride search being
  // `sm:hidden` — it is a sibling of the search now, not a child, or it would
  // have vanished from the desktop with it.
  const bandCount = await hl.locator(`${SHEET} [data-planner-headliner-hint]`).count();
  const bandText = bandCount
    ? ((await hl.locator(`${SHEET} [data-planner-headliner-hint]`).innerText()) ?? '').replace(
        /\s+/g,
        ' '
      )
    : '';
  check('die Headliner-Bande nennt die fehlenden', bandCount === 1, bandText.slice(0, 60));
  check(
    'sie zählt nur, was NICHT im Plan steht',
    /Headliner fehl/.test(bandText) && !/\bTaron\b/.test(bandText),
    bandText.slice(0, 90)
  );

  await hl.close();
}

// ── CPU: no clock where there is no now line ────────────────────────────────
// The minute tick was subscribed unconditionally, so on any date that is not
// today — nearly every date somebody plans — the panel installed a 60-second
// interval and re-rendered the whole grid once a minute for a line it never
// draws. Counted rather than reasoned about, and counted twice over, because the
// first version of this measurement went red on a page where nothing was wrong:
//
//   - It counted CREATIONS and never removals, so a subscribe / clear /
//     subscribe cycle — which is what React's development double-mount and a
//     `visibilitychange` both produce — read as two live clocks.
//   - It sampled its baseline straight after `networkidle`, and the page's OWN
//     minute clock (`lib/hooks/use-minute-now.ts`, two stores, restarted on
//     visibility) is installed later than that. Both of its intervals landed
//     inside the window the panel was being blamed for.
//
// So intervals are tracked by ID, the live 60-second ones are what gets
// compared, and the baseline is taken only once that number has stopped moving.
{
  const cpu = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(cpu);
  await cpu.addInitScript(() => {
    const w = window;
    w.__liveIntervals = new Map();
    const original = w.setInterval;
    w.setInterval = function (handler, delay, ...rest) {
      const id = original.call(this, handler, delay, ...rest);
      w.__liveIntervals.set(id, delay);
      return id;
    };
    const originalClear = w.clearInterval;
    w.clearInterval = function (id) {
      w.__liveIntervals.delete(id);
      return originalClear.call(this, id);
    };
  });

  await cpu.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: 'Europe/Berlin',
        context: {
          date: DATE,
          status: 'OPERATING',
          openHour: 9,
          closeHour: 18,
          crowdLevel: 'moderate',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 7,
        rides: [
          {
            attractionSlug: 'taron',
            attractionName: 'Taron',
            land: 'Mystery',
            hours: Array.from({ length: 10 }, (_, i) => ({ hour: 9 + i, wait: 40 })),
            dayPeak: 40,
            uncertaintyMinutes: 10,
            sampleDays: 400,
          },
        ],
        shows: [],
      }),
    })
  );

  await seed(cpu);

  const liveMinuteClocks = () =>
    cpu.evaluate(
      () => [...(window.__liveIntervals ?? new Map()).values()].filter((d) => d === 60_000).length
    );

  // The baseline is taken with the panel ALREADY OPENED ONCE AND CLOSED AGAIN,
  // and that is the only version of this measurement that holds still. Waiting
  // for the count to stop moving does not: the homepage's own minute clock
  // (`lib/hooks/use-minute-now.ts`) is installed by components that mount well
  // after `networkidle`, non-deterministically, so consecutive runs of the same
  // page read 0 → 0 and 0 → 1 with nothing different about the planner. Opening
  // the panel first forces the page to finish mounting; closing it takes the
  // planner's own subscription back off. What is left is a page whose clocks are
  // all running and a planner that has none — which is exactly the thing the
  // second open is being measured against.
  await cpu.locator(LAUNCHER).click();
  await cpu.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cpu.waitForTimeout(2500);
  await cpu.keyboard.press('Escape');
  await cpu.locator(SHEET).waitFor({ state: 'hidden', timeout: 10_000 });
  await cpu.waitForTimeout(1500);
  const beforeOpen = await liveMinuteClocks();

  await cpu.locator(LAUNCHER).click();
  await cpu.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cpu.waitForTimeout(2500);

  // The DELTA across opening the panel, not the page's total: the app runs a
  // minute clock of its own before the planner exists, so counting every timer
  // on the page would fail this for somebody else's work.
  const after = await liveMinuteClocks();
  const added = after - beforeOpen;
  check(
    'kein Minutentakt an einem Tag ohne Jetzt-Linie',
    added === 0,
    `${beforeOpen} vor dem Öffnen, ${after} danach`
  );

  await cpu.close();
}

// ── Dragging a ride in from the park page ───────────────────────────────────
// The card is a Server Component rendered in eight places and it knows nothing
// about the planner: its root is an `<a>`, every browser makes links draggable,
// and the drag already carries `text/uri-list`. The grid reads that URL. Two
// things have to hold for it to work at all, and both were false before:
// the desktop sheet must be NON-modal (Radix's default puts `pointer-events:
// none` on the page and a shield over it, so the card cannot be touched), and
// the park in the dropped URL must match the plan's, or a Europa-Park ride would
// be filed under a Phantasialand day whose forecast does not contain it.
{
  const drag = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  noteErrors(drag);

  const OPEN = 9;
  const CLOSE = 18;
  await drag.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: 'Europe/Berlin',
        context: {
          date: DATE,
          status: 'OPERATING',
          openHour: OPEN,
          closeHour: CLOSE,
          crowdLevel: 'moderate',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 7,
        // `backgroundImage` is what the PROXY route adds — this stub answers in
        // its place, so without it the ride list draws its coaster-icon
        // fallback and the drag chip has no picture to clone. `winjas-force` is
        // not in the seeded plan, which is what makes the headliner band render
        // and gives the third drag source something to grab.
        rides: [
          { slug: 'taron', name: 'Taron' },
          { slug: 'black-mamba', name: 'Black Mamba' },
          { slug: 'winjas-force', name: 'Winja‘s Force' },
        ].map(({ slug, name }) => ({
          attractionSlug: slug,
          attractionName: name,
          land: 'Mystery',
          hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({ hour: OPEN + i, wait: 40 })),
          dayPeak: 40,
          uncertaintyMinutes: 10,
          sampleDays: 400,
          isHeadliner: true,
          backgroundImage: `/media/phantasialand/${slug === 'winjas-force' ? 'winjas-fear' : slug}.jpg`,
          backgroundPosition: '50% 50%',
        })),
        shows: [],
      }),
    })
  );

  await seed(drag);
  // `networkidle`, not `domcontentloaded`. The edge tab is server-rendered and
  // visible before React has hydrated — it used to appear only once the store
  // had rehydrated, which made the wait for it a wait for hydration by accident
  // — so a click on `domcontentloaded` lands on markup with no handler on it and
  // the panel never opens.
  await drag.goto(`${BASE}/de/parks/europe/germany/bruehl/phantasialand`, {
    waitUntil: 'networkidle',
  });
  await drag.locator(LAUNCHER).click();
  await drag.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await drag.waitForTimeout(2500);

  // The page behind must still be reachable. With a modal sheet it is not, and
  // no drag can start.
  const reachable = await drag.evaluate(() => {
    const link = document.querySelector('a[href*="/phantasialand/taron"]');
    if (!link) return 'no ride link';
    // The card is far down the park page; `elementFromPoint` outside the
    // viewport answers null and would fail this for the wrong reason.
    link.scrollIntoView({ block: 'center' });
    const box = link.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + 8, box.y + 8);
    return hit && link.contains(hit) ? 'reachable' : (hit?.tagName ?? 'nothing');
  });
  check('die Seite hinter dem Panel bleibt anfassbar', reachable === 'reachable', `${reachable}`);

  // The drop itself, through real DataTransfer events.
  const before = await drag.locator('li[data-planner-block]').count();
  const dropped = await drag.evaluate(() => {
    const canvas = document.querySelector('[data-planner-grid] > div:last-child');
    if (!canvas) return 'no canvas';
    const box = canvas.getBoundingClientRect();
    const dt = new DataTransfer();
    dt.setData(
      'text/uri-list',
      `${location.origin}/de/parks/europe/germany/bruehl/phantasialand/taron`
    );
    const at = { clientX: box.x + 40, clientY: box.y + 200, bubbles: true, cancelable: true };
    canvas.dispatchEvent(new DragEvent('dragover', { ...at, dataTransfer: dt }));
    canvas.dispatchEvent(new DragEvent('drop', { ...at, dataTransfer: dt }));
    return 'dropped';
  });
  await drag.waitForTimeout(600);
  const after = await drag.locator('li[data-planner-block]').count();
  check(
    'ein Ride-Link landet als Block',
    after === before + 1,
    `${dropped}: ${before} -> ${after}`
  );

  // A ride from ANOTHER park is refused: the forecast is per park, so the block
  // would draw nothing and the day would claim a ride it has no number for.
  const foreign = await drag.evaluate(() => {
    const canvas = document.querySelector('[data-planner-grid] > div:last-child');
    if (!canvas) return -1;
    const box = canvas.getBoundingClientRect();
    const dt = new DataTransfer();
    dt.setData(
      'text/uri-list',
      `${location.origin}/de/parks/europe/germany/rust/europa-park/voltron-nevera`
    );
    const at = { clientX: box.x + 40, clientY: box.y + 300, bubbles: true, cancelable: true };
    canvas.dispatchEvent(new DragEvent('drop', { ...at, dataTransfer: dt }));
    return document.querySelectorAll('li[data-planner-block]').length;
  });
  await drag.waitForTimeout(400);
  check(
    'eine Bahn aus einem anderen Park wird abgelehnt',
    (await drag.locator('li[data-planner-block]').count()) === after,
    `${foreign}`
  );

  // Nobody finds a gesture nobody names. The badge that named it used to sit on
  // every ride card permanently — forty ride names under a label repeating one
  // sentence — so it waits for the pointer now, and the sentence is said once in
  // the panel instead. Both halves are checked here because both are invisible
  // by default and a broken one looks exactly like a working one.
  const coach = drag.locator(`${SHEET} [data-planner-drag-coach]`);
  check('der Hinweis nennt die Geste einmal', (await coach.count()) === 1);
  const coachText = (await coach.count()) ? await coach.innerText() : '';
  check(
    'er sagt sie in Worten, nicht als Schlüssel',
    /Zieh eine Bahn/.test(coachText) && !/planner\./.test(coachText),
    coachText.replace(/\s+/g, ' ').slice(0, 80)
  );
  await drag.locator(`${SHEET} [data-planner-drag-coach] button`).click();
  await drag.waitForTimeout(300);
  check('ausgeblendet bleibt ausgeblendet', (await coach.count()) === 0);

  // The card badge. `a.group`, not the `<article>` around the listing: the page
  // has one article and it contains every card, so hovering that measured the
  // wrong box and reported an opacity that never moved.
  const card = drag.locator('a.group:has([data-planner-drag-hint])').first();
  await card.scrollIntoViewIfNeeded();
  await drag.waitForTimeout(400);
  const badge = card.locator('[data-planner-drag-hint]');
  const restOpacity = await badge.evaluate((el) => getComputedStyle(el).opacity);
  await card.hover();
  await drag.waitForTimeout(300);
  const hoverOpacity = await badge.evaluate((el) => getComputedStyle(el).opacity);
  check(
    'der Anfasser erscheint erst unter dem Zeiger',
    restOpacity === '0' && hoverOpacity === '1',
    `ruhend ${restOpacity}, unter dem Zeiger ${hoverOpacity}`
  );
  // And it may not sit on the ride's name, which is what put it there in the
  // first place: it was a corner badge over the title row.
  const overlaps = await card.evaluate((el) => {
    const title = el.querySelector('h3, h2')?.getBoundingClientRect();
    const hint = el.querySelector('[data-planner-drag-hint]')?.getBoundingClientRect();
    if (!title || !hint) return null;
    return !(
      hint.right < title.left ||
      hint.left > title.right ||
      hint.bottom < title.top ||
      hint.top > title.bottom
    );
  });
  check('er verdeckt den Namen der Bahn nicht', overlaps === false, `${overlaps}`);

  // What the drag LOOKS like while it is in the air. Nothing set a drag image,
  // so the browser snapshotted whatever the gesture started on, and the two ways
  // into a plan therefore looked like two different features: a 400 x 36 px row
  // out of the panel's list, the whole 405 x 404 px `AttractionCard` off a park
  // page, and a bare pill out of the headliner band. All three hand over the
  // same chip now, and this reads it off `setDragImage` rather than off a
  // screenshot, because an OS-level drag image is not in the page to capture.
  await drag.evaluate(() => {
    window.__plannerChips = [];
    const painted = (canvas) => {
      if (!canvas.width || !canvas.height) return false;
      try {
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
        return false;
      } catch {
        // A tainted canvas cannot be read back — which only happens when
        // something WAS drawn onto it from another origin.
        return true;
      }
    };
    const real = DataTransfer.prototype.setDragImage;
    DataTransfer.prototype.setDragImage = function (el, x, y) {
      const box = el.getBoundingClientRect();
      // `canvas`, not `img`: the thumbnail is DRAWN from pixels the page
      // already holds, because a drag image is snapshotted in this very tick
      // and an `<img>` given a fresh `src` would not have arrived. Which is
      // also why the count alone is not the assertion — a canvas that was
      // never drawn into is the same element with nothing in it, so the
      // painted flag walks its alpha channel and says whether anything is
      // actually on it.
      const art = el.querySelector('canvas');
      window.__plannerChips.push({
        marked: el.getAttribute('data-planner-drag-chip') !== null,
        cls: el.className,
        text: (el.textContent ?? '').trim(),
        height: Math.round(box.height),
        images: el.querySelectorAll('canvas, img').length,
        painted: art ? painted(art) : false,
      });
      return real.call(this, el, x, y);
    };
  });
  // Hovered before it is dragged, which is not decoration: the headliner pill
  // has no picture of its own and asks for one on `pointerenter`, exactly as a
  // mouse always does on its way to pressing the control. A synthetic
  // `dragstart` with no pointer anywhere near it would measure a chip nobody
  // can produce with a mouse.
  const fireDrag = async (selector) => {
    const target = drag.locator(selector).first();
    if ((await target.count()) === 0) return false;
    await target.scrollIntoViewIfNeeded();
    // A real pointer, not a synthetic `pointerover`: React derives enter/leave
    // from the pointer's own path, so a dispatched event is a different thing.
    // Guarded because a control the panel overlaps cannot be hovered, and that
    // is a worse chip rather than a failed run.
    try {
      await target.hover({ timeout: 3000 });
    } catch {}
    await drag.waitForTimeout(600);
    return drag.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.dispatchEvent(
        new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer(),
        })
      );
      return true;
    }, selector);
  };

  // A card WITH a picture: a ride the media database has none for would produce
  // an honest name-only chip and make this compare two different things.
  const firedCard = await fireDrag('a[data-planner-ride]:has(img)');
  const firedBand = await fireDrag(`${SHEET} [data-planner-headliner-hint] button`);
  await drag.setViewportSize({ width: 390, height: 1000 });
  await drag.waitForTimeout(800);
  const firedList = await fireDrag(`${SHEET} ul li button[draggable="true"]`);
  await drag.waitForTimeout(200);
  const chips = await drag.evaluate(() => window.__plannerChips ?? []);
  check(
    'alle drei Quellen starten eine Ziehgeste',
    firedCard && firedBand && firedList && chips.length === 3,
    `Karte ${firedCard}, Bande ${firedBand}, Liste ${firedList}, Chips ${chips.length}`
  );
  check(
    'und übergeben denselben Chip',
    chips.length === 3 &&
      chips.every((c) => c.marked && c.cls === chips[0].cls && c.height === chips[0].height),
    JSON.stringify(chips.map((c) => `${c.height}px`))
  );
  check(
    'mit dem Namen und dem Bild der Bahn',
    chips.length === 3 && chips.every((c) => c.text.length > 0 && c.images === 1),
    chips.map((c) => `${c.text}/${c.images}`).join(' · ')
  );
  // The whole point of the canvas. `images === 1` was true of the version this
  // replaced as well — it appended an `<img>` whose picture had not arrived and
  // never would, so the chip counted one image and showed a hole.
  check(
    'und das Bild ist gezeichnet, nicht angefordert',
    chips.length === 3 && chips.every((c) => c.painted),
    chips.map((c) => `${c.text}: ${c.painted}`).join(' · ')
  );
  // It is appended to draw and taken away again; one left behind is a chip
  // sitting off-screen in the document for the rest of the session. Polled
  // rather than sampled once: the removal rides two `requestAnimationFrame`s,
  // and a frame is not owed to anybody inside a fixed wait.
  let leftBehind = await drag.locator('[data-planner-drag-chip]').count();
  for (let i = 0; leftBehind > 0 && i < 20; i++) {
    await drag.waitForTimeout(100);
    leftBehind = await drag.locator('[data-planner-drag-chip]').count();
  }
  check('und räumt sich wieder ab', leftBehind === 0, `${leftBehind} übrig`);

  await drag.close();
}

// ── Where a figure came from, and whether anybody checked it ────────────────
// Three fields the API grew and the panel typed without reading: `tier` names
// the day's regime, `hours[].source` names the hours that DEPART from it,
// `accuracy.basis` says whether anybody has ever measured how wrong the forecast
// is this far out, and `context.hoursSource` says whether the opening hours were
// published or derived. Each is stubbed here rather than fetched, because the
// interesting values are a park past its publication horizon and a date three
// months out — neither of which is reproducible on a given morning.
{
  const acc = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  noteErrors(acc);

  const OPEN = 9;
  const CLOSE = 18;
  /**
   * The day payload, with only the four fields under test varied.
   *
   * `context` is merged and re-applied LAST on purpose: a plain `...over` at the
   * top level clobbers the whole context object, which is what a first version
   * did — the observed-hours case then rendered "undefined bis undefined Uhr
   * (gemessen)" and its assertion passed on the suffix alone.
   */
  const dayBody = (over = {}) => {
    const { context: contextOver, ...rest } = over;
    return {
      parkSlug: PARK.slug,
      timezone: 'Europe/Berlin',
      tier: 'measured',
      leadDays: 1,
      accuracy: { basis: 'measured', typicalError: 8.9, sampleSize: 50_759 },
      rides: [
        {
          attractionSlug: 'taron',
          attractionName: 'Taron',
          land: 'Mystery',
          hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({
            hour: OPEN + i,
            wait: 45,
            // One hour that is not the day's regime, which is what the field is
            // for: today's payload really does carry fifty of these.
            ...(OPEN + i === 17 ? { source: 'composed' } : {}),
          })),
          dayPeak: 45,
          uncertaintyMinutes: null,
          sampleDays: 400,
        },
      ],
      shows: [],
      ...rest,
      context: {
        date: DATE,
        status: 'OPERATING',
        openHour: OPEN,
        closeHour: CLOSE,
        crowdLevel: 'moderate',
        weather: null,
        isHoliday: false,
        isBridgeDay: false,
        isSchoolVacation: false,
        isWeekend: false,
        hoursSource: 'schedule',
        ...contextOver,
      },
    };
  };

  let body = dayBody({});
  await acc.route('**/plan/day**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  );

  /** Reopen the panel on a fresh payload. */
  const reload = async () => {
    await acc.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
    await acc.locator(LAUNCHER).click();
    await acc.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
    await acc.waitForTimeout(2200);
  };

  await acc.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await acc.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'm', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
            { id: 'c', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 1020 },
          ],
        },
      };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
      window.localStorage.setItem('parkfan_planner_dragcoach', '1');
    },
    [PLAN, DATE]
  );
  await reload();

  // The block's lower edge is the whole point of `hours[].source`: a hard end
  // for a measurement, a fade for a composition. Read off the mask rather than
  // off a class, because that is what actually draws it.
  const edges = await acc.locator(`${SHEET} li[data-planner-block]`).evaluateAll((els) =>
    els.map((el) => ({
      time: (el.textContent ?? '').match(/\d{1,2}:\d{2}/)?.[0] ?? '?',
      // ANY layer of the block, not the first one with an inline height: the
      // uncertainty band above the fill carries one too and is written first,
      // so picking the first read `none` on both blocks and would have passed
      // the measured case for the wrong reason.
      faded: Array.from(el.querySelectorAll('[style]')).some((node) => {
        const mask = getComputedStyle(node).maskImage;
        return mask !== 'none' && mask.includes('gradient');
      }),
    }))
  );
  check(
    'die gemessene Stunde endet hart',
    edges.find((e) => e.time === '10:00')?.faded === false,
    JSON.stringify(edges)
  );
  check(
    'die zusammengesetzte Stunde desselben Tages verläuft',
    edges.find((e) => e.time === '17:00')?.faded === true,
    JSON.stringify(edges)
  );

  const bandText = async () =>
    ((await acc.locator(`${SHEET} [data-planner-context-band]`).innerText()) ?? '').replace(
      /\s+/g,
      ' '
    );
  let band = await bandText();
  check(
    'der Tag nennt seinen typischen Fehler',
    /typisch 9 Min\. daneben/.test(band),
    band.slice(0, 120)
  );
  check(
    'veröffentlichte Zeiten bleiben unkommentiert',
    /09 bis 18 Uhr/.test(band) && !/\(gemessen\)/.test(band),
    band.slice(0, 120)
  );

  // Past the publication horizon: the window is DERIVED from hours somebody
  // recorded, so it is narrower than the truth by construction and the panel
  // says where it came from.
  body = dayBody({ context: { hoursSource: 'observed' } });
  await reload();
  band = await bandText();
  // The hours themselves are asserted with it: without them this passed on the
  // suffix alone, over a chip reading "undefined bis undefined Uhr".
  check('abgeleitete Zeiten sagen es', /09 bis 18 Uhr \(gemessen\)/.test(band), band.slice(0, 120));

  // Nobody has ever checked how wrong the forecast is this far out.
  body = dayBody({ tier: 'composed', accuracy: { basis: 'unmeasured' } });
  await reload();
  band = await bandText();
  check(
    'ohne geprüfte Genauigkeit sagt der Tag das',
    /Ohne geprüfte Treffsicherheit/.test(band),
    band.slice(0, 120)
  );
  check(
    'und nennt dann keinen Fehler',
    !/typisch \d+ Min\. daneben/.test(band),
    band.slice(0, 120)
  );

  // The trap in that field: a day that has already HAPPENED also answers
  // `unmeasured` — nothing predicted it, so nothing verified a prediction —
  // while its figures are measurements. Reading the basis there would put
  // "nobody has checked these numbers" under the only numbers on this panel
  // that are facts.
  body = dayBody({ tier: 'observed', accuracy: { basis: 'unmeasured' } });
  await reload();
  band = await bandText();
  check(
    'ein vergangener Tag bleibt gemessen',
    /Gemessen/.test(band) && !/Ohne geprüfte Treffsicherheit/.test(band),
    band.slice(0, 120)
  );

  await acc.close();
}

// ── What the panel says about itself, and what is actually under it ─────────
// Three sentences promised a ride search "unten". The search has ONE call site
// and it is behind `park && activeDate` AND `sm:hidden`, so the desktop line was
// displayed at exactly the widths where the search does not exist, the phone
// line pointed at nothing whenever no day was open, and the sentence inside the
// phone-only search named an HTML5 drag — the one gesture a coarse pointer does
// not have. Each state is checked against what is really rendered below it.
{
  const OPEN = 9;
  const CLOSE = 18;
  const emptyDay = {
    parkSlug: PARK.slug,
    timezone: 'Europe/Berlin',
    context: {
      date: DATE,
      status: 'OPERATING',
      openHour: OPEN,
      closeHour: CLOSE,
      hoursSource: 'schedule',
      crowdLevel: 'moderate',
      weather: null,
      isHoliday: false,
      isBridgeDay: false,
      isSchoolVacation: false,
      isWeekend: false,
    },
    tier: 'measured',
    leadDays: 1,
    accuracy: { basis: 'measured', typicalError: 9 },
    rides: ['taron', 'black-mamba'].map((slug) => ({
      attractionSlug: slug,
      attractionName: slug === 'taron' ? 'Taron' : 'Black Mamba',
      land: 'Mystery',
      hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({ hour: OPEN + i, wait: 40 })),
      dayPeak: 40,
      sampleDays: 400,
      isHeadliner: true,
    })),
    shows: [],
  };

  /** The panel with a day that HAS an axis and nothing on it. */
  const openEmptyDay = async (width) => {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    noteErrors(page);
    await page.route('**/plan/day**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyDay),
      })
    );
    await page.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([plan, date]) => {
        const seeded = JSON.parse(JSON.stringify(plan));
        seeded.parks.phantasialand.timezone = 'Europe/Berlin';
        seeded.parks.phantasialand.days = { [date]: { date, entries: [] } };
        seeded.activeParkSlug = 'phantasialand';
        seeded.activeDate = date;
        window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
        window.localStorage.removeItem('parkfan_planner_dragcoach');
      },
      [PLAN, DATE]
    );
    await page.goto(`${BASE}/de/parks/europe/germany/bruehl/phantasialand`, {
      waitUntil: 'networkidle',
    });
    await page.locator(LAUNCHER).click();
    await page.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(2500);
    return page;
  };

  /** Only the sentence CSS is actually showing, never both halves of a pair. */
  const shownLines = (page) =>
    page
      .locator(`${SHEET} [data-planner-grid] p`)
      .evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).display !== 'none')
          .map((el) => (el.textContent ?? '').trim())
      );

  {
    const desk = await openEmptyDay(1400);
    const lines = (await shownLines(desk)).join(' | ');
    const searchVisible = await desk
      .locator(`${SHEET} input[type="search"]`)
      .first()
      .isVisible()
      .catch(() => false);
    check(
      'das leere Raster nennt am Rechner die Geste',
      /Zieh eine Bahn/.test(lines) && !/unten/.test(lines),
      lines.slice(0, 90)
    );
    check('und es gibt dort keine Suche, auf die es zeigen könnte', searchVisible === false);
    // The same sentence twice, 300 px apart, is how a hint stops reading as one.
    check(
      'der Hinweis am Fuß schweigt, solange das Raster leer ist',
      (await desk.locator('[data-planner-drag-coach]').count()) === 0
    );
    await desk.close();
  }

  {
    const phone = await openEmptyDay(390);
    const lines = (await shownLines(phone)).join(' | ');
    const searchVisible = await phone
      .locator(`${SHEET} input[type="search"]`)
      .first()
      .isVisible()
      .catch(() => false);
    check(
      'auf dem Handy verweist es auf die Suche, und die ist da',
      /unten/.test(lines) && searchVisible,
      `${lines.slice(0, 70)} · Suche ${searchVisible}`
    );
    const hint = await phone
      .locator(`${SHEET} input[type="search"]`)
      .locator('xpath=../../p')
      .first()
      .innerText()
      .catch(() => '');
    check(
      'und die Suche beschreibt einen Tipp, keine Zieh-Geste',
      /Tippe eine Bahn an/.test(hint) && !/[Zz]ieh/.test(hint),
      hint.slice(0, 70)
    );
    await phone.close();
  }

  // Nothing planned at all: the branch with no axis, where the search is not
  // mounted at either width and the two sentences pointed at three lines of
  // help text.
  for (const width of [1400, 390]) {
    const bare = await browser.newPage({ viewport: { width, height: 1000 } });
    noteErrors(bare);
    await bare.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await bare.evaluate(() => {
      window.localStorage.removeItem('parkfan_planner');
    });
    await bare.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
    await bare.locator(LAUNCHER).click();
    await bare.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
    await bare.waitForTimeout(1500);
    const text = ((await bare.locator(SHEET).innerText()) ?? '').replace(/\s+/g, ' ');
    check(
      `${width} px: der leere Planer verweist auf nichts, was nicht da ist`,
      !/unten/i.test(text),
      text.slice(0, 80)
    );
    check(
      `${width} px: er bietet den Assistenten und die drei Schritte`,
      (await bare.locator('[data-planner-start-wizard]').count()) === 1 &&
        /Park und Tag wählen/.test(text),
      text.slice(0, 60)
    );
    await bare.close();
  }
}

// ── The chrome has to survive the photo behind it ───────────────────────────
// The panel carries the park's picture now, and the first version put it in the
// positioned layer: an `absolute` element with `z-index: auto` paints ABOVE the
// inline content of every in-flow sibling, so the header, the context band and
// the foot rows were drawn UNDER the wash rather than over it. Nothing about
// that is visible to a DOM assertion — the classes were all correct — so this
// samples the composited pixels.
{
  const shot = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  noteErrors(shot);
  await seed(shot);
  await shot.goto(`${BASE}/de/parks/europe/germany/bruehl/phantasialand`, {
    waitUntil: 'networkidle',
  });
  await shot.locator(LAUNCHER).click();
  await shot.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await shot.waitForTimeout(4000);

  const photo = shot.locator(`${SHEET} [aria-hidden="true"].-z-10`);
  const hasPhoto = (await photo.count()) > 0;
  check('der Park bringt sein Bild mit', hasPhoto);

  if (hasPhoto) {
    check(
      'es liegt in einer negativen Ebene',
      Number(await photo.evaluate((el) => getComputedStyle(el).zIndex)) < 0
    );
    check(
      'und das Panel hält es mit `isolate` bei sich',
      (await shot.locator(SHEET).evaluate((el) => getComputedStyle(el).isolation)) === 'isolate'
    );

    const boxes = await shot.evaluate(() => {
      const sheet = document.querySelector('[data-slot="sheet-content"]');
      const s = sheet.getBoundingClientRect();
      const rel = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: Math.max(0, Math.round(r.x - s.x)),
          top: Math.max(0, Math.round(r.y - s.y)),
          width: Math.max(1, Math.round(r.width)),
          height: Math.max(1, Math.round(r.height)),
        };
      };
      return {
        Kopfzeile: rel(document.querySelector('[data-slot="sheet-header"]')),
        Kontextband: rel(document.querySelector('[data-planner-context-band]')),
      };
    });
    const png = await shot.locator(SHEET).screenshot();
    for (const [name, box] of Object.entries(boxes)) {
      if (!box) continue;
      const { data, info } = await sharp(png)
        .extract(box)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const channel = (c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      const ls = [];
      for (let i = 0; i < data.length; i += info.channels) {
        ls.push(
          0.2126 * channel(data[i]) + 0.7152 * channel(data[i + 1]) + 0.0722 * channel(data[i + 2])
        );
      }
      ls.sort((a, b) => a - b);
      const at = (q) => ls[Math.min(ls.length - 1, Math.floor(q * ls.length))];
      // Ink against ground, off the composited panel: the 97th percentile is
      // the text, the 30th the surface it sits on. Measured 1.49:1 and 1.45:1
      // with the photo in the positioned layer, 8.47:1 and 6.02:1 without.
      const contrast = (Math.max(at(0.97), at(0.3)) + 0.05) / (Math.min(at(0.97), at(0.3)) + 0.05);
      check(`${name} bleibt über dem Foto lesbar`, contrast >= 4.5, `${contrast.toFixed(2)}:1`);
    }
  }
  await shot.close();
}

// ── Shows, on a day that HAS them ───────────────────────────────────────────
// The run above deliberately seeds tomorrow, "so the run is stable" — and
// showtimes used to exist for today and no other date, so every pass watched the
// band say "not knowable yet" and never once saw a show line. That gap is why
// the lines could be a dashed rule with a bare time in the hour column,
// indistinguishable from the grid they sit in, through every green check.
//
// They come from `/plan/day` now, for every date and with a `source` on each:
// the operator's own listing, or the last matching weekday carried forward. The
// second kind may never be drawn like the first, so the stub serves both and the
// checks below read the treatment off the markup rather than trusting the copy.
{
  const shows = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(shows);

  const todayInPark = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const OPEN = 9;
  const CLOSE = 18;
  // Two at 15:00 to prove one line can stand for more than one show, and a third
  // 5 minutes later, which `showLinePositions` folds into it.
  const SHOWS = [
    { showSlug: 'a', showName: 'Miji African Dancers', times: ['11:30'], source: 'scheduled' },
    { showSlug: 'b', showName: 'Nobis Vol. 2', times: ['15:00'], source: 'scheduled' },
    { showSlug: 'c', showName: 'BATTLE of the BEST', times: ['15:00'], source: 'scheduled' },
    { showSlug: 'd', showName: 'Rock on Ice', times: ['15:05'], source: 'scheduled' },
    {
      showSlug: 'e',
      showName: 'Aqua Ballett',
      times: ['16:30'],
      source: 'projected',
      observedOn: '2026-08-27',
      sampleDays: 8,
    },
  ];

  await shows.route('**/api/parks/**', async (route) => {
    const url = route.request().url();
    // Only the two the panel reads. `**/api/parks/**` also matches the stats and
    // best-days routes, and answering those with a park payload made
    // `use-park-comparison-stats` read `stats.meta.displayable` off an object
    // with no `meta` — a console error from the stub, not from the planner.
    const isPark = /\/api\/parks\/[^/]+\/[^/]+\/[^/]+\/[^/?]+(\?|$)/.test(url);
    if (!isPark && !url.includes('/plan/day')) return route.continue();
    if (url.includes('/plan/day')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          parkSlug: PARK.slug,
          timezone: 'Europe/Berlin',
          context: {
            date: todayInPark,
            status: 'OPERATING',
            openHour: OPEN,
            closeHour: CLOSE,
            crowdLevel: 'moderate',
            weather: null,
            isHoliday: false,
            isBridgeDay: false,
            isSchoolVacation: false,
            isWeekend: false,
          },
          tier: 'measured',
          leadDays: 0,
          leadTimeMae: 7,
          rides: [
            {
              attractionSlug: 'taron',
              attractionName: 'Taron',
              land: 'Mystery',
              hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({
                hour: OPEN + i,
                wait: 45,
              })),
              dayPeak: 45,
              uncertaintyMinutes: 15,
              sampleDays: 400,
            },
          ],
          shows: SHOWS,
        }),
      });
    }
    // The live park payload. It carries no showtimes any more and must not need
    // to: a stub that still served them here would keep passing if the panel
    // went back to reading them off the poll, which only ever knew today.
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slug: PARK.slug,
        name: PARK.name,
        status: 'OPERATING',
        timezone: 'Europe/Berlin',
        liveWaitTimes: { available: true },
        attractions: [],
      }),
    });
  });

  await shows.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await shows.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, todayInPark]
  );
  await shows.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await shows.locator(LAUNCHER).click();
  await shows.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await shows.waitForTimeout(2500);

  // A dashed rule and a time in the hour column is not a show. The NAME is what
  // makes it one, and it has to be on the line rather than only in the band.
  const pills = shows.locator(`${SHEET} [data-planner-show]`);
  const pillCount = await pills.count();
  check('jede Showlinie trägt ihren Namen', pillCount >= 2, `${pillCount} Pillen`);

  const pillText = (await pills.allTextContents()).join(' | ');
  check(
    'der Name steht an der Linie, nicht nur im Band',
    /Miji African Dancers/.test(pillText),
    pillText.slice(0, 80)
  );

  // Two shows at one minute share a line and BOTH are named — and the 15:05 one
  // is folded in by the 14 px rule, which used to drop it silently:
  // `collapsedWith` was written and read by nothing.
  check(
    'eine Linie für zwei Shows nennt beide',
    /Nobis Vol. 2/.test(pillText) && /BATTLE of the BEST/.test(pillText),
    pillText.slice(0, 120)
  );
  check(
    'eine eingeklappte Showzeit verschwindet nicht',
    /Rock on Ice/.test(pillText) || /\+\d/.test(pillText),
    pillText.slice(0, 120)
  );

  // The one rule the API states outright: a projection may never be drawn like a
  // listing. Read off the markup, not off the copy — the pill and the gutter
  // chip both carry the source, so a restyle that flattens the two shows up here
  // rather than in a screenshot nobody takes.
  const projectedPills = await shows
    .locator(`${SHEET} [data-planner-show-source="projected"]`)
    .count();
  const scheduledPills = await shows
    .locator(`${SHEET} [data-planner-show-source="scheduled"]`)
    .count();
  check(
    'Hochrechnung und Betreiberangabe sind getrennt ausgezeichnet',
    projectedPills === 1 && scheduledPills >= 2,
    `${projectedPills} projected / ${scheduledPills} scheduled`
  );

  const projectedTime = await shows
    .locator(`${SHEET} [data-planner-show-time="projected"]`)
    .first()
    .textContent();
  check(
    'eine hochgerechnete Zeit trägt ihr Ungefähr-Zeichen',
    (projectedTime ?? '').includes('~'),
    projectedTime ?? '(keine)'
  );

  // The band used to be four proper nouns joined by a dot: no time, no label,
  // nothing the grid did not already draw. It names ONE show now and says what
  // that naming means — which of the three it is depends on the wall clock the
  // run happens to start at, so all three are accepted and a bare list is not.
  const bandText = (await shows.locator(`${SHEET} [data-planner-show-band]`).textContent()) ?? '';
  check(
    'das Show-Band sagt, was es zeigt',
    /Als Nächstes|Voraussichtlich|gelaufen/.test(bandText),
    bandText.slice(0, 120)
  );
  check(
    'das Show-Band ist keine Namensliste mehr',
    !(/Miji African Dancers/.test(bandText) && /Nobis Vol\. 2/.test(bandText)),
    bandText.slice(0, 120)
  );

  await shows.close();
}

// ── The planner's own page ──────────────────────────────────────────────────
// The feature had no URL. Its launcher appears only once something is planned
// and its panel opens from a floating button, so a visitor who had not already
// used it could not find it, could not link to it, and could not be sent to it.
// The page is the answer, and its EMPTY state is the half that matters: it is
// what somebody arriving from the menu sees.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(page);

  const PATHS = {
    de: '/de/tagesplaner',
    en: '/en/trip-planner',
    nl: '/nl/dagplanner',
    fr: '/fr/planificateur',
    es: '/es/planificador',
    it: '/it/pianificatore',
  };

  // Every locale answers on its OWN segment. One page, six URLs, and a rewrite
  // per language — a 404 here is a menu entry pointing at nothing.
  for (const [locale, path] of Object.entries(PATHS)) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
    check(
      `${locale}: die Planer-Seite antwortet`,
      response?.status() === 200,
      `${response?.status()}`
    );
  }

  // And a visitor who lands on somebody else's segment is sent to their own,
  // rather than served a second copy at a URL that then competes with it.
  const wrong = await page.goto(`${BASE}/de/trip-planner`, { waitUntil: 'domcontentloaded' });
  check(
    'ein fremdes Segment landet bei der eigenen Sprache',
    wrong?.url().endsWith('/de/tagesplaner'),
    `${wrong?.url()}`
  );

  // ── Empty ─────────────────────────────────────────────────────────────────
  await page.evaluate(() => {
    window.localStorage.removeItem('parkfan_planner');
  });
  await page.goto(`${BASE}/de/tagesplaner`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  check(
    'ohne Plan erklärt die Seite, wofür der Planer da ist',
    (await page.locator('[data-planner-page-intro]').count()) === 1
  );
  const introText = (await page.locator('[data-planner-page-intro]').textContent()) ?? '';
  check(
    'und zwar auf Deutsch, nicht in rohen Keys',
    !/planner\.[a-z]/i.test(introText) && /Noch nichts geplant/.test(introText),
    introText.slice(0, 80)
  );
  // The way in, and it is a BUTTON rather than a search field on the page.
  // That field asked which park and nothing else, so the two questions that
  // decide whether a day works — which day, and who is coming — were left to be
  // discovered in the panel afterwards. The search is the wizard's first step
  // now, so the assertion is that the empty page offers the wizard and that
  // pressing it arrives on that step.
  const emptyStart = page.locator('[data-planner-new-day]');
  check('ohne Plan führt ein Knopf in den Assistenten', (await emptyStart.count()) >= 1);
  check(
    'die Parksuche steht auf der leeren Seite noch nicht im Weg',
    (await page.locator('[data-planner-park-search]').count()) === 0
  );
  if (await emptyStart.count()) {
    await emptyStart.first().click();
    const emptyWizard = page.locator('[data-slot="dialog-content"]');
    await emptyWizard.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    check(
      'der Assistent öffnet auf der Parksuche',
      (await emptyWizard.locator('[data-planner-park-search] input[type="search"]').count()) === 1
    );
    await page.keyboard.press('Escape');
    await emptyWizard.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }
  // Nothing planned, so nothing to list — and no empty "0 geplante Tage" heading.
  check(
    'kein leerer Plan-Abschnitt',
    (await page.locator('[data-planner-page-day]').count()) === 0
  );

  // ── The article under the directory ───────────────────────────────────────
  // The page used to be a directory and three cards, which is nothing for a
  // search engine to index and nothing for a first-time reader to learn from.
  // The chapters under it explain the thing with the planner's OWN components
  // drawing a real, dated payload — so this asserts that the demo is the
  // product rather than a picture of it, and that it writes nothing.
  const chapters = await page.locator('article h2').allInnerTexts();
  check(
    `die Seite erklärt sich in ${CHAPTER_COUNT} Kapiteln`,
    chapters.length === CHAPTER_COUNT,
    `${chapters.length}`
  );
  const numbers = await page
    .locator('article section')
    .evaluateAll((sections) =>
      sections.map((s) => s.querySelector('[aria-hidden="true"]')?.textContent?.trim() ?? '')
    );
  check(
    'die Kapitelnummern laufen ohne Lücke',
    numbers.slice(0, CHAPTER_COUNT).join('') === CHAPTER_NUMBERS,
    JSON.stringify(numbers)
  );
  const articleText = (await page.locator('article').innerText()) ?? '';
  check(
    'der Text steht auf Deutsch da, nicht in rohen Keys',
    !/\b(planner|parks)\.[a-z]/i.test(articleText),
    (articleText.match(/\b(planner|parks)\.[a-zA-Z.]+/) ?? [''])[0]
  );
  check(
    'die Demo ist der echte Planer, kein Bild davon',
    (await page.locator('article li[data-planner-block]').count()) === 7 &&
      (await page.locator('article [data-planner-leg]').count()) > 0,
    `${await page.locator('article li[data-planner-block]').count()} Blöcke`
  );
  check(
    'die Zahlen der Demo sind datiert',
    /12\. September 2026/.test(articleText),
    articleText.slice(articleText.indexOf('Echte Werte'), articleText.indexOf('Echte Werte') + 60)
  );
  // A reader operating the exhibit must not find a plan in their own planner
  // afterwards: the demo holds its state in the component, never in the store.
  await page.locator('article li[data-planner-block]').first().click();
  await page.waitForTimeout(300);
  check(
    'die Demo schreibt nichts in den Plan',
    (await page.evaluate(() => window.localStorage.getItem('parkfan_planner'))) === null
  );

  // A second language, because the article is six modules and a missing one is
  // a build error only for the locale that lost it.
  await page.goto(`${BASE}/fr/planificateur`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const frText = (await page.locator('article').innerText()) ?? '';
  check(
    'und auf Französisch genauso',
    (await page.locator('article h2').count()) === CHAPTER_COUNT &&
      (await page.locator('article li[data-planner-block]').count()) === 7 &&
      /Phantasialand/.test(frText),
    frText.slice(0, 60).replace(/\s+/g, ' ')
  );
  await page.goto(`${BASE}/de/tagesplaner`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // ── With plans ────────────────────────────────────────────────────────────
  const PAST = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  await page.evaluate(
    ([plan, future, past]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      const entry = (id, done) => ({
        id,
        attractionSlug: 'taron',
        attractionName: 'Taron',
        startMinute: 600,
        ...(done ? { done: true, actualWait: 35 } : {}),
      });
      park.days = {
        [past]: { date: past, entries: [entry('old-1', true)] },
        [future]: { date: future, entries: [entry('f-1', false)] },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = null;
      seeded.activeDate = null;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE, PAST]
  );
  await page.goto(`${BASE}/de/tagesplaner`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  check(
    'mit Plänen erklärt sie nicht mehr, sondern listet',
    (await page.locator('[data-planner-page-intro]').count()) === 0
  );
  const days = page.locator('[data-planner-page-day]');
  check(
    'beide Tage stehen da, auch der vergangene',
    (await days.count()) === 2,
    `${await days.count()}`
  );

  // The page is the DIRECTORY, not a second editor: picking a day sets the
  // active day and asks the panel to open, which is the same signal the park
  // calendar's "plan this day" already sends.
  await days.first().click();
  await page.waitForTimeout(900);
  check('ein Klick auf einen Tag öffnet das Panel', (await page.locator(SHEET).count()) === 1);
  const active = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('parkfan_planner') ?? '{}')
  );
  check(
    'und zwar auf genau diesem Tag',
    active?.activeDate === new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10),
    `${active?.activeDate}`
  );

  await page.close();
}

// ── Notifications, all the way on and all the way off ───────────────────────
// The three states earlier in this file check what the CONTROL offers. This
// checks what pressing it does, which is the half that can be broken while
// every label is right: a switch that turns on and cannot be turned off is
// worse than one that never worked, because the visitor cannot tell whether
// they are still subscribed.
//
// `PushManager` is stubbed. That is not a shortcut around the hard part — the
// hard part is this app's order of operations (store the plan, then subscribe,
// and undo the browser's subscription when the server refuses), and a real push
// service would only add a dependency on Google's uptime to a test about our
// own sequencing.
{
  const push = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(push);

  const VAPID =
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
  const ENDPOINT = 'https://fcm.example.test/fcm/send/abc123';

  await push.addInitScript(
    ([endpoint]) => {
      // Permission is granted without a prompt: the prompt is the browser's,
      // not ours, and Playwright cannot answer it.
      Object.defineProperty(Notification, 'permission', {
        get: () => 'granted',
        configurable: true,
      });
      Notification.requestPermission = async () => 'granted';

      let subscription = null;
      const fakeSubscription = {
        endpoint,
        toJSON: () => ({ endpoint, keys: { p256dh: 'p256dh-value', auth: 'auth-value' } }),
        unsubscribe: async () => {
          subscription = null;
          window.__pushUnsubscribed = (window.__pushUnsubscribed ?? 0) + 1;
          return true;
        },
      };
      const registration = {
        pushManager: {
          getSubscription: async () => subscription,
          subscribe: async () => {
            subscription = fakeSubscription;
            return subscription;
          },
        },
      };
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        get: () => ({
          register: async () => registration,
          getRegistration: async () => registration,
          ready: Promise.resolve(registration),
        }),
      });
      // The page checks `'PushManager' in window` before offering anything.
      if (!('PushManager' in window)) {
        window.PushManager = function PushManager() {};
      }
    },
    [ENDPOINT]
  );

  await push.route('**/api/push', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: true, publicKey: VAPID, topics: ['next-up'] }),
    })
  );

  // The two writes the flow makes, recorded so the ORDER can be asserted.
  const calls = [];
  await push.route('**/api/trips', async (route) => {
    calls.push({ what: 'trip-create', body: route.request().postDataJSON() });
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'n7Qk2Fd3Xb9pLmZa', payload: {}, expiresAt: '', updatedAt: '' }),
    });
  });
  await push.route('**/api/trips/*', async (route) => {
    calls.push({ what: 'trip-update' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await push.route('**/api/push/subscriptions', async (route) => {
    calls.push({
      what: `subscription-${route.request().method()}`,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({ status: 204, body: '' });
  });

  await push.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await push.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE]
  );
  await push.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await push.locator(LAUNCHER).click();
  await push.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await push.waitForTimeout(2000);

  const toggle = push.locator('[data-planner-push] button');
  check('der Schalter ist erreichbar', (await toggle.count()) === 1);

  if (await toggle.count()) {
    // ── On ───────────────────────────────────────────────────────────────────
    await toggle.click();
    await push.waitForTimeout(1500);

    check(
      'einschalten meldet den Browser an',
      (await push.locator('[data-planner-push="on"]').count()) === 1
    );
    check(
      'der Schalter sagt jetzt, dass sie an sind',
      /Benachrichtigungen sind an/.test(
        (await push.locator('[data-planner-push]').textContent()) ?? ''
      )
    );
    // The sentence about the plan living on a server, where the button is.
    check(
      'und sagt, dass der Plan dafür auf dem Server liegt',
      /auf dem Server/.test((await push.locator('[data-planner-push]').textContent()) ?? '')
    );

    // The order is the point. The API refuses a subscription against a trip it
    // does not have, so the plan has to be stored first — and a plan stored
    // with no subscription is a row that expires, while a subscription with no
    // plan is a switch that is on and does nothing.
    const first = calls.findIndex((c) => c.what === 'trip-create');
    const sub = calls.findIndex((c) => c.what === 'subscription-POST');
    check(
      'der Plan geht VOR dem Abo raus',
      first !== -1 && sub !== -1 && first < sub,
      calls.map((c) => c.what).join(' → ')
    );
    check(
      'das Abo nennt den Trip, den es gerade angelegt hat',
      calls[sub]?.body?.tripId === 'n7Qk2Fd3Xb9pLmZa',
      `${calls[sub]?.body?.tripId}`
    );
    // The subscriber's language and zone, stored with the subscription: the job
    // runs with no request to read an Accept-Language from.
    check(
      'und die Sprache des Lesers',
      calls[sub]?.body?.locale === 'de',
      `${calls[sub]?.body?.locale}`
    );

    const storedId = await push.evaluate(() => localStorage.getItem('parkfan_trip_id'));
    check('der Browser merkt sich seinen Trip', storedId === 'n7Qk2Fd3Xb9pLmZa', `${storedId}`);

    // Reopening must still say "on". The state is read back from the browser's
    // own subscription AND the stored id, so losing either has to read as off.
    await push.locator(`${SHEET} button[aria-label]`).first().press('Escape');
    await push.waitForTimeout(400);
    await push.locator(LAUNCHER).click();
    await push.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
    await push.waitForTimeout(1500);
    check(
      'nach dem Wiederöffnen sind sie immer noch an',
      (await push.locator('[data-planner-push="on"]').count()) === 1
    );

    // ── Off ──────────────────────────────────────────────────────────────────
    await push.locator('[data-planner-push] button').click();
    await push.waitForTimeout(1500);

    check('ausschalten geht auch', (await push.locator('[data-planner-push="off"]').count()) === 1);
    const del = calls.filter((c) => c.what === 'subscription-DELETE');
    check('der Server erfährt davon', del.length === 1, `${del.length}`);
    check(
      'und zwar mit dem Endpunkt, den er kennt',
      del[0]?.body?.endpoint === ENDPOINT,
      `${del[0]?.body?.endpoint}`
    );
    // The browser's own subscription goes too, or the push service keeps
    // delivering to a page that no longer thinks it is subscribed.
    const unsub = await push.evaluate(() => window.__pushUnsubscribed ?? 0);
    check('der Browser meldet sich auch selbst ab', unsub >= 1, `${unsub}`);
    const afterId = await push.evaluate(() => localStorage.getItem('parkfan_trip_id'));
    check('und vergisst den Trip', afterId === null, `${afterId}`);

    // ── And on again ─────────────────────────────────────────────────────────
    // A switch that only works once is the shape of bug that survives a demo.
    await push.locator('[data-planner-push] button').click();
    await push.waitForTimeout(1500);
    check('und wieder an', (await push.locator('[data-planner-push="on"]').count()) === 1);
  }

  await push.close();
}

// ── Every plan is reachable, including the ones already walked ──────────────
{
  const past = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(past);

  const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const LAST_WEEK = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

  await past.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await past.evaluate(
    ([plan, future, yesterday, lastWeek]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      const entry = (id, done) => ({
        id,
        attractionSlug: 'taron',
        attractionName: 'Taron',
        startMinute: 600,
        ...(done ? { done: true, actualWait: 35 } : {}),
      });
      park.days = {
        [lastWeek]: { date: lastWeek, entries: [entry('old-1', true)] },
        [yesterday]: { date: yesterday, entries: [entry('yesterday-1', true)] },
        [future]: { date: future, entries: [entry('future-1', false)] },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = future;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE, YESTERDAY, LAST_WEEK]
  );
  await past.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await past.locator(LAUNCHER).click();
  await past.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await past.waitForTimeout(1500);

  await past.locator('button[data-planner-overview-toggle]').click();
  await past.waitForTimeout(500);

  // A finished day is a record of what was actually queued — the ticked entries
  // carry real measured minutes — so it is kept and shown greyed rather than
  // swept up on a date change.
  const rows = past.locator(`${SHEET} li button[type="button"]`);
  const labels = (await rows.allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());
  check('die Übersicht listet auch die vergangenen Tage', labels.length >= 3, labels.join(' | '));

  // Pick the oldest one and check the panel actually goes there.
  const oldest = rows.first();
  await oldest.click();
  await past.waitForTimeout(800);
  const active = await past.evaluate(() =>
    JSON.parse(localStorage.getItem('parkfan_planner') ?? '{}')
  );
  check(
    'ein vergangener Tag lässt sich öffnen',
    active?.activeDate === lastWeekOf(),
    `${active?.activeDate}`
  );
  function lastWeekOf() {
    return new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  }

  // And what it shows is the record: the entry is ticked and carries the
  // minutes it was ticked with, not a forecast. Scoped to the ENTRY — read off
  // the whole sheet, a "35" in a date or in another ride's figure would pass
  // this without the row being right at all.
  const oldRow = past.locator('li[data-planner-entry="old-1"]');
  check('der Eintrag des Tages steht da', (await oldRow.count()) === 1);
  const rowText = ((await oldRow.first().textContent()) ?? '').replace(/\s+/g, ' ').trim();
  check('und zeigt, was an dem Tag wirklich anstand', /35/.test(rowText), rowText);

  await past.close();
}

// ── The photos the payload already carries ──────────────────────────────────
// The plan-day proxy resolves a ride's picture from the media database on every
// request, and for most of this feature's life nothing showed one: the block's
// floor was 48 px, which at 1.2 px per minute is a FORTY-minute queue, so a day
// of twenty-to-thirty-five minute blocks — which is most days — drew none.
// Measured before the fix on a four-ride day where every ride had a picture:
// blocks 30, 20, 36 and 42 px tall, four photos in, zero out.
{
  const photos = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  noteErrors(photos);

  const OPEN = 9;
  const CLOSE = 19;
  // Real paths from the media database. A fabricated one would 404 and the
  // assertion would still pass, since it asks whether the element is drawn.
  const PHOTO = {
    taron: ['/media/phantasialand/taron.jpg?v=04eb2f11', '55% 58%'],
    'black-mamba': ['/media/phantasialand/black-mamba.jpg?v=5cbf7070', '50% 38%'],
    'winjas-fear': ['/media/phantasialand/winjas-fear.jpg?v=de8fcfe6', '33% 48%'],
  };
  const curve = (peak) =>
    Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({ hour: OPEN + i, wait: peak }));

  await photos.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: 'Europe/Berlin',
        context: {
          date: DATE,
          status: 'OPERATING',
          openHour: OPEN,
          closeHour: CLOSE,
          crowdLevel: 'moderate',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 7,
        rides: [
          // 25 minutes — a 30 px block, and the commonest queue there is.
          {
            attractionSlug: 'taron',
            attractionName: 'Taron',
            land: 'Mystery',
            hours: curve(25),
            dayPeak: 25,
            uncertaintyMinutes: 8,
            sampleDays: 400,
            backgroundImage: PHOTO.taron[0],
            backgroundPosition: PHOTO.taron[1],
          },
          // 15 minutes — an 18 px block, below the floor: one line of text and
          // nowhere for a picture to be.
          {
            attractionSlug: 'winjas-fear',
            attractionName: "Winja's Fear",
            land: 'Fantasy',
            hours: curve(15),
            dayPeak: 15,
            uncertaintyMinutes: 5,
            sampleDays: 400,
            backgroundImage: PHOTO['winjas-fear'][0],
            backgroundPosition: PHOTO['winjas-fear'][1],
          },
          // A headliner nobody planned: the hint below the search offers it.
          {
            attractionSlug: 'black-mamba',
            attractionName: 'Black Mamba',
            land: 'Deep in Africa',
            hours: curve(35),
            dayPeak: 35,
            uncertaintyMinutes: 8,
            sampleDays: 400,
            isHeadliner: true,
            backgroundImage: PHOTO['black-mamba'][0],
            backgroundPosition: PHOTO['black-mamba'][1],
          },
        ],
        shows: [],
      }),
    })
  );

  await photos.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await photos.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
            {
              id: 'winjas-fear-1',
              attractionSlug: 'winjas-fear',
              attractionName: "Winja's Fear",
              startMinute: 720,
            },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE]
  );
  await photos.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await photos.locator(LAUNCHER).click();
  await photos.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await photos.waitForTimeout(2500);

  const drawn = await photos.evaluate(() =>
    [...document.querySelectorAll('li[data-planner-block]')].map((el) => ({
      id: el.getAttribute('data-planner-entry'),
      height: Math.round(el.getBoundingClientRect().height),
      photo: Boolean(el.querySelector('div[style*="background-image"]')),
    }))
  );
  const taron = drawn.find((b) => b.id === 'taron-1');
  const winja = drawn.find((b) => b.id === 'winjas-fear-1');

  check(
    'ein gewöhnlicher Block trägt sein Foto',
    taron?.photo === true,
    `${taron?.height} px, Foto: ${taron?.photo}`
  );
  // And so does the shortest one. There used to be a floor — 48 px first, then
  // 28 — and both were the same mistake in two sizes: a plan is mostly made of
  // twenty-to-thirty-five-minute blocks, so the picture appeared on a
  // headliner's worst hour and nowhere else. The floor is gone; a ten-minute
  // block is a thin band of a photograph, which is a small thing rather than a
  // wrong one, and the block beside it having none was the real inconsistency.
  check(
    'und ein sehr kurzer trägt es auch',
    winja?.photo === true && (winja?.height ?? 0) < 28,
    `${winja?.height} px, Foto: ${winja?.photo}`
  );

  // Every ride search row carries its photo.
  const searchThumbs = await photos
    .locator(`${SHEET} img[src*="taron"], ${SHEET} img[src*="black-mamba"]`)
    .count();
  check('die Suchzeilen tragen ihre Fotos', searchThumbs >= 2, `${searchThumbs}`);

  // The headliner band carries them too, and it did not before: a pill was a
  // word in a rounded box, which is what a FILTER chip looks like, while these
  // are rides — the same objects the rows above draw with a photograph each.
  // Both halves are asserted, because the interesting case is the ride with no
  // picture: twenty-four of Phantasialand's thirty-four have none, so the
  // coaster mark is the common case and every pill has to carry one of the two
  // or the band reads as a loading state.
  const pills = await photos.locator(`${SHEET} [data-planner-headliner-hint] button`).count();
  const marked = await photos.evaluate(
    () =>
      [...document.querySelectorAll('[data-planner-headliner-hint] button')].filter(
        (el) => el.querySelector('img') || el.querySelector('svg')
      ).length
  );
  check(
    'jede Headliner-Pille trägt ein Bild oder das Bahn-Zeichen',
    pills > 0 && marked === pills,
    `${marked} von ${pills}`
  );

  await photos.close();
}

// ── Notifications ───────────────────────────────────────────────────────────
// The rule the whole feature is built around is that a switch which turns on
// and does nothing is worse than no switch, and there are two ways to get one:
// a deploy with no VAPID keypair, and a browser that has refused. Both are
// checked here, because both look exactly like "working" from the code's side.
{
  const push = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(push);

  const seedPlan = async (page) => {
    await page.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([plan, date]) => {
        const seeded = JSON.parse(JSON.stringify(plan));
        const park = seeded.parks.phantasialand;
        park.timezone = 'Europe/Berlin';
        park.days = {
          [date]: {
            date,
            entries: [
              {
                id: 'taron-1',
                attractionSlug: 'taron',
                attractionName: 'Taron',
                startMinute: 600,
              },
            ],
          },
        };
        seeded.parks = { phantasialand: park };
        seeded.activeParkSlug = 'phantasialand';
        seeded.activeDate = date;
        window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
      },
      [PLAN, DATE]
    );
    await page.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
    await page.locator(LAUNCHER).click();
    await page.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(1800);
  };

  // 1. A deploy with no keypair offers nothing at all. Not a disabled switch —
  //    a visitor cannot tell "not yet" from "never" by looking at one.
  await push.route('**/api/push', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, topics: [] }),
    })
  );
  await seedPlan(push);
  check(
    'ohne Schlüssel gibt es keinen Schalter',
    (await push.locator('[data-planner-push]').count()) === 0
  );
  await push.close();
}

{
  // 2. A configured deploy offers it, off.
  const push = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(push);
  await push.route('**/api/push', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        available: true,
        // A real VAPID public key's shape: 65 uncompressed P-256 bytes as
        // base64url, 87 characters. The control never decodes it, but a
        // placeholder that is not one would hide a bug in the decoder.
        publicKey:
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
        topics: ['next-up'],
      }),
    })
  );

  await push.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await push.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE]
  );
  await push.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await push.locator(LAUNCHER).click();
  await push.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await push.waitForTimeout(2000);

  const toggle = push.locator('[data-planner-push]');
  check('mit Schlüssel steht der Schalter da', (await toggle.count()) === 1);
  if (await toggle.count()) {
    check('und er ist aus', (await toggle.first().getAttribute('data-planner-push')) === 'off');
    const text = (await toggle.first().textContent()) ?? '';
    check(
      'er sagt auf Deutsch, was er tut',
      /Benachrichtigungen einschalten/.test(text),
      text.trim()
    );
    // The sentence about the plan being stored belongs to the ON state: before
    // that it is a warning about something that has not happened.
    check('der Speicher-Hinweis steht noch nicht da', !/auf dem Server/.test(text), text.trim());
  }
  await push.close();
}

{
  // 3. A browser that has refused says so instead of offering. It is the only
  //    state where the visitor has to go somewhere else to change the answer.
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  // Playwright grants nothing by default; denying explicitly is what makes
  // `Notification.permission` read "denied" rather than "default".
  await context.clearPermissions();
  const push = await context.newPage();
  noteErrors(push);
  await push.addInitScript(() => {
    Object.defineProperty(Notification, 'permission', {
      get: () => 'denied',
      configurable: true,
    });
  });
  await push.route('**/api/push', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        available: true,
        publicKey:
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
        topics: ['next-up'],
      }),
    })
  );

  await push.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await push.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE]
  );
  await push.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await push.locator(LAUNCHER).click();
  await push.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await push.waitForTimeout(2000);

  const denied = push.locator('[data-planner-push="denied"]');
  check('ein abgelehnter Browser bekommt eine Erklärung', (await denied.count()) === 1);
  if (await denied.count()) {
    const text = (await denied.first().textContent()) ?? '';
    check(
      'und keinen Knopf, der nichts tut',
      (await denied.first().locator('button').count()) === 0,
      text.trim()
    );
  }
  await context.close();
}

// ── The tint is the crowd scale, and it moves with the block ────────────────
// Both halves matter and neither is visible in a still: the colour has to be
// the site's own six-level crowd palette — the same one a park card and a blog
// badge use, so 20 minutes is the same green everywhere — and it has to follow
// the block, because the whole reason to drag one to 09:00 is that the queue is
// shorter there.
{
  const tint = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(tint);

  const OPEN = 9;
  const CLOSE = 18;
  // A day with a real spread in it: a walk-on at opening, an hour's queue at
  // midday. `waitTimeCrowdTier` puts 10 minutes in `low` and 80 in `extreme`.
  const CURVE = { 9: 10, 10: 15, 11: 35, 12: 60, 13: 80, 14: 80, 15: 65, 16: 45, 17: 25, 18: 15 };

  await tint.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: 'Europe/Berlin',
        context: {
          date: DATE,
          status: 'OPERATING',
          openHour: OPEN,
          closeHour: CLOSE,
          crowdLevel: 'high',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 7,
        rides: [
          {
            attractionSlug: 'taron',
            attractionName: 'Taron',
            land: 'Mystery',
            hours: Object.entries(CURVE).map(([hour, wait]) => ({ hour: Number(hour), wait })),
            dayPeak: 80,
            uncertaintyMinutes: 10,
            sampleDays: 400,
          },
        ],
        shows: [],
      }),
    })
  );

  await tint.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await tint.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            // 13:00, the day's peak.
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 780 },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE]
  );
  await tint.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await tint.locator(LAUNCHER).click();
  await tint.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await tint.waitForTimeout(2000);

  /** The crowd level the block is currently painted at, off its tile classes. */
  const toneOf = async () =>
    tint.evaluate(() => {
      const block = document.querySelector('li[data-planner-entry="taron-1"]');
      if (!block) return null;
      for (const el of block.querySelectorAll('*')) {
        const match = /\bbg-crowd-([a-z-]+?)\/\d/.exec(el.className?.toString?.() ?? '');
        if (match) return match[1];
      }
      return null;
    });

  const atPeak = await toneOf();
  check('die Farbe kommt aus der Crowd-Skala', atPeak !== null && atPeak !== '', `${atPeak}`);
  // 80 minutes is the top of the scale, not "somewhere warm".
  check('80 Minuten sind das obere Ende', atPeak === 'extreme', `${atPeak}`);

  // Move it to 09:00, where the same ride is a walk-on. The keyboard, not a
  // drag: the assertion is about the colour following the block, and a pointer
  // gesture would put the drag's own correctness in front of it.
  // The `input[type="range"]` IS the move control — it writes through the same
  // path a drag does — so focusing the list item does nothing.
  const range = tint.locator('li[data-planner-entry="taron-1"] input[type="range"]');
  await range.focus();
  // Down is EARLIER on this control: the range runs in minutes, and up is later.
  for (let i = 0; i < 16; i++) await tint.keyboard.press('ArrowDown');
  await tint.waitForTimeout(900);

  const atOpening = await toneOf();
  const startMinute = await tint.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('parkfan_planner') ?? '{}');
    const park = state.parks?.phantasialand;
    const day = park?.days?.[state.activeDate];
    return day?.entries?.[0]?.startMinute ?? null;
  });
  check('der Block ist wirklich in den Morgen gewandert', startMinute === 540, `${startMinute}`);
  check(
    'die Farbe zieht mit',
    atOpening !== null && atOpening !== atPeak,
    `${atPeak} -> ${atOpening}`
  );
  // 10 minutes at opening: the quiet end of the same scale, not merely a
  // different colour.
  check(
    'und landet am ruhigen Ende der Skala',
    atOpening === 'low' || atOpening === 'very-low',
    `${atOpening}`
  );

  await tint.close();
}

// ── A day that already happened ─────────────────────────────────────────────
// The panel offers dates in the past — a plan is a record once it is walked —
// and the figures on such a day are not a forecast. The API answers
// `tier: "observed"` there, from the nightly 15-minute rollup, and the panel
// has to say so: calling a measurement "Stundenprognose" is the panel
// predicting the past.
{
  const past = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(past);

  const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const OPEN = 9;
  const CLOSE = 18;

  await past.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: 'Europe/Berlin',
        context: {
          date: YESTERDAY,
          status: 'OPERATING',
          openHour: OPEN,
          closeHour: CLOSE,
          crowdLevel: 'moderate',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'observed',
        leadDays: -1,
        leadTimeMae: null,
        rides: [
          {
            attractionSlug: 'taron',
            attractionName: 'Taron',
            land: 'Mystery',
            hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({
              hour: OPEN + i,
              wait: 25 + i * 5,
            })),
            dayPeak: 70,
            // An observation has no band. A width of zero would be a claim
            // about precision rather than the absence of one.
            uncertaintyMinutes: null,
            sampleDays: 1,
          },
        ],
        shows: [],
      }),
    })
  );

  await past.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await past.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            {
              id: 'taron-1',
              attractionSlug: 'taron',
              attractionName: 'Taron',
              startMinute: 780, // 13:00 — the rollup says 45 minutes there
            },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, YESTERDAY]
  );
  await past.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await past.locator(LAUNCHER).click();
  await past.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await past.waitForTimeout(2500);

  const text = (await past.locator(SHEET).textContent()) ?? '';
  check(
    'ein vergangener Tag heißt gemessen, nicht Prognose',
    /Gemessen/.test(text),
    text.slice(0, 120)
  );
  check('und sagt, dass der Tag vorbei ist', /Dieser Tag ist vorbei/.test(text));
  // Both forward labels, not just the hourly one: an unknown tier used to fall
  // through the ternary to `longRange`, so a measured day came out as "Grobe
  // Schätzung" — wrong in the other direction and just as invisible.
  check(
    'kein Prognose-Etikett auf einem gemessenen Tag',
    !/Stundenprognose/.test(text) && !/Grobe Schätzung/.test(text),
    text.slice(0, 160)
  );

  // The block carries the number the queue actually stood at, not a forecast.
  // 13:00 is the fifth hour of the day, so 25 + 4×5 = 45.
  const block = past.locator('li[data-planner-entry="taron-1"]');
  if (await block.count()) {
    const figure = (await block.first().textContent()) ?? '';
    check('der Block trägt die echte Wartezeit von damals', /45/.test(figure), figure.trim());
    // No band around a measurement — the ± figure belongs to a prediction.
    check('keine Unsicherheitsspanne an einer Messung', !/±/.test(figure), figure.trim());
  } else {
    check('der Block trägt die echte Wartezeit von damals', false, 'kein Block');
  }

  await past.close();
}

// ── The weather rail ────────────────────────────────────────────────────────
// A band down the edge of the day and a label only where the weather turns.
// It lives in the HOUR GUTTER, which is the whole reason it can exist: the
// canvas is where the blocks are and its three lanes are already down to 112 px
// on a phone. So the assertion that matters is geometric — nothing the rail
// draws may leave that column, in either direction.
{
  const OPEN = 9;
  const CLOSE = 19;
  // Overcast morning, rain from 13:00, thunderstorm at 16:00, showers at 18:00.
  const CODES = {
    9: 3,
    10: 3,
    11: 2,
    12: 2,
    13: 61,
    14: 63,
    15: 65,
    16: 95,
    17: 95,
    18: 80,
    19: 3,
  };
  const MM = { 13: 0.4, 14: 1.2, 15: 2.4, 16: 3.6, 17: 1.1, 18: 0.3 };

  for (const [label, width, height] of [
    ['Desktop', 1280, 1200],
    ['Handy', 390, 844],
  ]) {
    const rail = await browser.newPage({ viewport: { width, height } });
    noteErrors(rail);

    await rail.route('**/api/weather/hourly**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          timezone: 'Europe/Berlin',
          points: Array.from({ length: 24 }, (_, h) => ({
            time: `${DATE}T${String(h).padStart(2, '0')}:00`,
            temperatureC: 16,
            precipitationMm: MM[h] ?? 0,
            precipitationProbability: MM[h] ? 80 : 10,
            weatherCode: CODES[h] ?? 3,
            isDay: h >= 7 && h < 20,
          })),
        }),
      })
    );
    await rail.route('**/plan/day**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          parkSlug: PARK.slug,
          timezone: 'Europe/Berlin',
          context: {
            date: DATE,
            status: 'OPERATING',
            openHour: OPEN,
            closeHour: CLOSE,
            crowdLevel: 'high',
            weather: null,
            isHoliday: false,
            isBridgeDay: false,
            isSchoolVacation: false,
            isWeekend: false,
          },
          tier: 'measured',
          leadDays: 1,
          leadTimeMae: 8,
          rides: [
            {
              attractionSlug: 'taron',
              attractionName: 'Taron',
              land: 'Mystery',
              hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({
                hour: OPEN + i,
                wait: 45,
              })),
              dayPeak: 45,
              uncertaintyMinutes: 10,
              sampleDays: 400,
              // The park's position, to about a kilometre. Nothing else the
              // planner fetches carries one — this is where the rail gets it.
              latitude: 50.7985,
              longitude: 6.8792,
            },
          ],
          shows: [],
        }),
      })
    );

    await rail.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await rail.evaluate(
      ([plan, date]) => {
        const seeded = JSON.parse(JSON.stringify(plan));
        const park = seeded.parks.phantasialand;
        park.timezone = 'Europe/Berlin';
        park.days = {
          [date]: {
            date,
            entries: [
              { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
            ],
          },
        };
        seeded.parks = { phantasialand: park };
        seeded.activeParkSlug = 'phantasialand';
        seeded.activeDate = date;
        window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
      },
      [PLAN, DATE]
    );
    await rail.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
    await rail.locator(LAUNCHER).click();
    await rail.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
    await rail.waitForTimeout(2500);

    const band = rail.locator('[data-planner-weather-rail]');
    check(`${label}: das Wetterband ist da`, (await band.count()) === 1);
    if ((await band.count()) !== 1) {
      await rail.close();
      continue;
    }

    // The band paints and the words arrive on demand. Two vocabularies to
    // check and they live in different places now: the sparse per-change
    // sentence — overcast → rain → storm → showers → overcast, plus the hour
    // the axis opens in — is the `sr-only` list, and the hint a pointer gets is
    // built per hour. A figure drawn at every hour would be a table; a figure
    // drawn at every CHANGE was three type sizes in a 44 px column, which is
    // why neither is drawn any more.
    const spoken = await band
      .locator('ul li')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ''));
    check(`${label}: nur die Wechsel werden vorgelesen`, spoken.length === 5, spoken.join(' | '));
    check(
      `${label}: ein nasser Wechsel nennt die Menge`,
      spoken.some((line) => /Gewitter/.test(line) && /mm/.test(line)),
      spoken.join(' | ')
    );
    // German decimals. `toFixed(1)` writes "3.6 mm", which is a different
    // number to everybody reading a German sentence.
    check(
      `${label}: die Menge ist deutsch geschrieben`,
      spoken.some((line) => /\d,\d\s*mm/.test(line)),
      spoken.join(' | ')
    );

    // Every hour is pointable, not just the five that change: the question a
    // reader has is "what is it at three", and an answer only at the turns
    // makes them work out which turn they are after.
    const targets = band.locator('button');
    const targetCount = await targets.count();
    check(`${label}: jede Stunde ist anfassbar`, targetCount >= 5, `Ziele: ${targetCount}`);

    // And the hint really opens. Hovered by the first target whose box is
    // inside the viewport — the rail is taller than the panel's scroller, so
    // the top of it can sit above the visible area.
    let hint = null;
    for (let i = 0; i < targetCount; i++) {
      const box = await targets.nth(i).boundingBox();
      if (!box || box.height < 6 || box.y < 60 || box.y + box.height > 880) continue;
      await rail.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await rail.waitForTimeout(250);
      hint = await rail.evaluate(
        () => document.querySelector('[role="tooltip"]')?.textContent?.trim() ?? null
      );
      if (hint) break;
    }
    check(`${label}: ein Zeigen öffnet den Hinweis`, hint !== null, hint ?? 'kein Tooltip');
    check(
      `${label}: der Hinweis nennt die Stunde`,
      hint !== null && /\d{2}:00/.test(hint),
      hint ?? ''
    );
    await rail.mouse.move(2, 2);

    // The geometric one. The rail is a guest in the hour gutter, so nothing it
    // draws may hang off either edge of that column — the first version gave the
    // container no width, and every label sat OUTSIDE the panel entirely.
    const escaped = await rail.evaluate(() => {
      const rail = document.querySelector('[data-planner-weather-rail]');
      if (!rail) return 'no rail';
      const column = rail.getBoundingClientRect();
      const bad = [];
      for (const el of rail.querySelectorAll('button, div[class*="bg-"]')) {
        const box = el.getBoundingClientRect();
        if (box.width === 0) continue;
        if (box.left < column.left - 0.5 || box.right > column.right + 0.5) {
          bad.push(
            `${el.getAttribute('aria-label') ?? el.className} @ ${Math.round(box.left)}..${Math.round(box.right)} vs ${Math.round(column.left)}..${Math.round(column.right)}`
          );
        }
      }
      return bad.length === 0 ? null : bad.join('; ');
    });
    check(`${label}: nichts hängt aus der Stundenspalte`, escaped === null, escaped ?? '');

    // Continuous: the band is one column with no seams, because a gap in it
    // reads as a gap in the day.
    const seams = await rail.evaluate(() => {
      const slices = [
        ...document.querySelectorAll('[data-planner-weather-rail] > div:first-child > div'),
      ].map((el) => el.getBoundingClientRect());
      if (slices.length < 2) return `nur ${slices.length} Scheiben`;
      for (let i = 1; i < slices.length; i++) {
        if (Math.abs(slices[i].top - slices[i - 1].bottom) > 0.6) {
          return `Lücke bei ${i}: ${slices[i - 1].bottom} -> ${slices[i].top}`;
        }
      }
      return null;
    });
    check(`${label}: das Band hat keine Nähte`, seams === null, seams ?? '');

    await rail.close();
  }
}

// ── The zone a park learns from its first day payload ───────────────────────
// A park added from the overview's search arrives with no timezone — the search
// payload has none to give — and every other way into a plan starts on a park
// page that knows it. So the day payload has to teach it, or that park reckons
// its dates in the READER's zone for as long as it stays in the plan.
//
// Against a fixture, and it has to be: `/plan/day` answers 404 on this backend
// today, so the live path cannot exercise a field that only arrives with a 200.
{
  const learn = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  noteErrors(learn);

  const ZONE = 'America/New_York';
  await learn.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: ZONE,
        context: {
          date: DATE,
          status: 'OPERATING',
          openHour: 9,
          closeHour: 18,
          crowdLevel: 'moderate',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 7,
        rides: [],
        shows: [],
      }),
    })
  );

  await learn.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await learn.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      // Exactly the state the park search leaves behind: name, geo, one day, NO
      // zone.
      delete park.timezone;
      park.days = {
        [date]: {
          date,
          entries: [
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
    },
    [PLAN, DATE]
  );
  await learn.goto(`${BASE}/de`, { waitUntil: 'networkidle' });

  const before = await learn.evaluate(
    () => JSON.parse(localStorage.getItem('parkfan_planner') ?? '{}').parks?.phantasialand?.timezone
  );
  check('ohne Parkseite kennt der Plan keine Zone', before === undefined, `${before}`);

  await learn.locator(LAUNCHER).click();
  await learn.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await learn.waitForTimeout(2000);

  const after = await learn.evaluate(
    () => JSON.parse(localStorage.getItem('parkfan_planner') ?? '{}').parks?.phantasialand?.timezone
  );
  check('die erste Tagesantwort lehrt dem Plan die Zone', after === ZONE, `${after}`);

  await learn.close();
}

// ── All six locales ─────────────────────────────────────────────────────────
// The `planner` namespace existed in German alone for a while, and neither
// guard noticed: `check:untranslated` looks for German COPIED into the others,
// and `validate:translations` compares against the English master — which had
// no `planner` key either. Meanwhile `/en` and `/nl` rendered `planner.title`
// and `planner.day.today` verbatim, because next-intl logs MISSING_MESSAGE and
// prints the raw key rather than throwing. Only opening the panel finds that.
{
  // The word the TAB prints, which comes from `navigation` — the namespace the
  // layout chrome already ships — and not from `planner`, which arrives with the
  // chunk. Asserting it is how this sweep catches the one mistake that would
  // otherwise be invisible: an eager control reading a lazily-loaded namespace
  // renders its raw key on every page of the site.
  const LOCALE_TAB = {
    de: 'Tagesplaner',
    en: 'Trip planner',
    nl: 'Dagplanner',
    fr: 'Planificateur',
    es: 'Planificador',
    it: 'Pianificatore',
  };

  for (const [locale, label] of Object.entries(LOCALE_TAB)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const missing = [];
    page.on('console', (msg) => {
      if (/MISSING_MESSAGE/.test(msg.text())) missing.push(msg.text());
    });

    await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((plan) => {
      window.localStorage.setItem('parkfan_planner', JSON.stringify(plan));
    }, PLAN);
    await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle' });

    const launcher = page.locator(LAUNCHER);
    // WAITED for, not counted. The tab is a Client Component in the layout, so
    // it mounts after `networkidle` resolves — and this block sits at the end of
    // a long run, where the dev server is slowest and loses that race every
    // time. A bare `count()` here reported "Launcher fehlt" for all six locales
    // on a page that had the control, which reads as a broken feature rather
    // than as a missed beat. Every other launcher assertion in this file waits.
    const found = await launcher
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (found) {
      const tabText = ((await launcher.textContent().catch(() => '')) ?? '').trim();
      check(
        `${locale}: der Tab trägt das Wort dieser Sprache`,
        tabText.startsWith(label),
        `${JSON.stringify(tabText)} statt ${JSON.stringify(label)}`
      );
    }
    if (found) {
      await launcher.click();
      await page
        .locator(SHEET)
        .waitFor({ state: 'visible', timeout: 10_000 })
        .catch(() => {});
      await page.waitForTimeout(1500);
    }
    const text = (
      (await page
        .locator(SHEET)
        .textContent()
        .catch(() => '')) ?? ''
    ).replace(/\s+/g, ' ');

    check(
      `${locale}: Planer öffnet und spricht die Sprache`,
      found && missing.length === 0 && !/planner\.[a-z]/i.test(text),
      `Launcher ${found ? 'da' : 'fehlt'}, ${missing.length} fehlende Texte`
    );
    await page.close();
  }
}

// ── The day sorts itself ────────────────────────────────────────────────────
// Two buttons over one engine (`lib/planner/optimize.ts`), whose maths is pinned
// by `pnpm test:planner-optimize` against a brute force over every permutation.
// What THIS has to prove is the half a unit test cannot see: that pressing them
// writes the plan, that the sentence underneath says what happened, that the
// undo puts it back byte for byte, and that a lunch break survives all of it.
{
  const opt = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  noteErrors(opt);

  const seedOptimize = async () => {
    await opt.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await opt.evaluate(
      ([plan, date]) => {
        const seeded = JSON.parse(JSON.stringify(plan));
        const park = seeded.parks.phantasialand;
        park.timezone = 'Europe/Berlin';
        // Deliberately the wrong way round — Taron, the headliner whose queue is
        // shortest at opening, parked at 16:00 — but written in START order,
        // which is the order the store keeps a day in. The undo assertion below
        // compares the stored array literally, and a seed that was not already
        // sorted would fail on `byStart` alone while every minute matched.
        park.days = {
          [date]: {
            date,
            entries: [
              {
                id: 'black-mamba-1',
                attractionSlug: 'black-mamba',
                attractionName: 'Black Mamba',
                startMinute: 600,
              },
              {
                id: 'lunch-1',
                startMinute: 780,
                custom: { label: 'Mittag', durationMinutes: 60, icon: 'food' },
              },
              { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 960 },
            ],
          },
        };
        seeded.parks = { phantasialand: park };
        seeded.activeParkSlug = 'phantasialand';
        seeded.activeDate = date;
        window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
        window.localStorage.setItem('parkfan_planner_width', '520');
        window.localStorage.removeItem('parkfan_planner_column2');
      },
      [PLAN, DATE]
    );
    await opt.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
    await opt.locator(LAUNCHER).click();
    await opt.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
    await opt.waitForTimeout(3000);
  };

  /** The stored day as `slug@minute`, which is what a re-plan actually writes. */
  const readDay = () =>
    opt.evaluate(() => {
      const plan = JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}');
      const day = Object.values(plan.parks?.phantasialand?.days ?? {})[0];
      return (day?.entries ?? [])
        .map((e) => `${e.attractionSlug ?? e.custom?.label}@${e.startMinute}`)
        .join(' | ');
    });

  await seedOptimize();

  const before = await readDay();
  check(
    'die Optimier-Leiste ist da, mit beiden Knöpfen',
    (await opt.locator(`${SHEET} [data-planner-optimize]`).count()) === 1 &&
      (await opt.locator(`${SHEET} [data-planner-optimize-run]`).count()) === 1 &&
      (await opt.locator(`${SHEET} [data-planner-optimize-headliners]`).count()) === 1
  );

  await opt.locator(`${SHEET} [data-planner-optimize-run]`).click();
  await opt.waitForTimeout(1200);
  const after = await readDay();
  check('ein Druck sortiert den Tag um', after !== before, `${before}  →  ${after}`);

  // „Passt schon so" is the answer to "there was nothing to do", and the
  // assertion above has just proved there WAS — so accepting it here let the one
  // real failure through: a day scoring 60 minutes before and 70 after (a block
  // dragged past closing carries no figure until the optimiser brings it back
  // inside) printed it over a plan it had just rebuilt. Every other outcome of a
  // change is named instead, including the ones that gain no minutes.
  const said = (await opt.locator(`${SHEET} [data-planner-optimize-result]`).textContent()) ?? '';
  check(
    'und sagt in Minuten, was es gebracht hat',
    /\d+\s*Min\.\s*weniger Warten|gleiche Wartezeit|umgestellt|passt jetzt in den Tag|passen jetzt in den Tag/i.test(
      said
    ) && !/Passt schon so/.test(said),
    said.slice(0, 80)
  );

  // The lunch break is a decision, not a queue. It keeps its minute, and every
  // ride is scheduled around it.
  check('die Mittagspause bleibt, wo sie war', after.includes('Mittag@780'), after);

  // Pressing it again must be a no-op, not a reshuffle with the same total —
  // which is the difference between an optimiser and a dice roll.
  await opt.locator(`${SHEET} [data-planner-optimize-run]`).click();
  await opt.waitForTimeout(900);
  check('ein zweiter Druck ändert nichts mehr', (await readDay()) === after);
  const twice = (await opt.locator(`${SHEET} [data-planner-optimize-result]`).textContent()) ?? '';
  check('und sagt das auch', /Passt schon so/.test(twice), twice.slice(0, 80));

  // Back to a day it can improve, so the undo has something to take back.
  await seedOptimize();
  await opt.locator(`${SHEET} [data-planner-optimize-run]`).click();
  await opt.waitForTimeout(1200);
  check(
    'nach dem Sortieren steht ein Rückgängig daneben',
    (await opt.locator(`${SHEET} [data-planner-optimize-undo]`).count()) === 1
  );
  await opt.locator(`${SHEET} [data-planner-optimize-undo]`).click();
  await opt.waitForTimeout(900);
  check('und es stellt den Tag exakt wieder her', (await readDay()) === before, await readDay());
  check(
    'danach ist das Rückgängig weg',
    (await opt.locator(`${SHEET} [data-planner-optimize-undo]`).count()) === 0
  );

  // The headliner button: it adds, and then it has nothing left to add.
  await seedOptimize();
  const rideCountBefore = (await readDay()).split(' | ').length;
  await opt.locator(`${SHEET} [data-planner-optimize-headliners]`).click();
  await opt.waitForTimeout(2000);
  const withHeadliners = await readDay();
  check(
    'alle Headliner einplanen füllt den Tag',
    withHeadliners.split(' | ').length > rideCountBefore,
    `${rideCountBefore} → ${withHeadliners.split(' | ').length}`
  );
  check(
    'und der Knopf verschwindet, wenn keiner mehr fehlt',
    (await opt.locator(`${SHEET} [data-planner-optimize-headliners]`).count()) === 0
  );
  check(
    'die Mittagspause hat auch das überlebt',
    withHeadliners.includes('Mittag@780'),
    withHeadliners
  );
  // Planning the headliners and then pressing "Tag optimieren" to check is one
  // gesture somebody actually makes, and the second press answers "nothing to
  // do" — which used to throw away the undo for the first.
  check(
    'nach dem Einplanen steht ein Rückgängig da',
    (await opt.locator(`${SHEET} [data-planner-optimize-undo]`).count()) === 1
  );
  await opt.locator(`${SHEET} [data-planner-optimize-run]`).click();
  await opt.waitForTimeout(900);
  check(
    'und ein Druck, der nichts ändert, nimmt es nicht weg',
    (await opt.locator(`${SHEET} [data-planner-optimize-undo]`).count()) === 1,
    (await opt.locator(`${SHEET} [data-planner-optimize-result]`).textContent()) ?? ''
  );
  // Nothing may be scheduled before the park lets anybody queue.
  const tooEarly = withHeadliners
    .split(' | ')
    .map((part) => Number(part.split('@')[1]))
    .filter((minute) => minute < 9 * 60);
  check('und nichts liegt vor der Parköffnung', tooEarly.length === 0, tooEarly.join(', '));

  await opt.close();
}

// A park whose wait times nobody can read gets no optimiser: every ride costs
// the same assumed nothing, so every order is as good as every other and a
// button that reshuffled them would be a promise about a comparison that cannot
// be made. Hansa-Park publishes its numbers only in its own app on the park
// WLAN — the same park `noLiveWaitTimesReason` is asserted against elsewhere in
// this file.
{
  const bare = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  noteErrors(bare);
  await bare.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await bare.evaluate(
    ([date]) => {
      window.localStorage.setItem(
        'parkfan_planner',
        JSON.stringify({
          parks: {
            'hansa-park': {
              slug: 'hansa-park',
              name: 'Hansa-Park',
              geo: { continent: 'europe', country: 'germany', city: 'sierksdorf' },
              timezone: 'Europe/Berlin',
              days: {
                [date]: {
                  date,
                  entries: [
                    {
                      id: 'a-1',
                      attractionSlug: 'highlander',
                      attractionName: 'Highlander',
                      startMinute: 600,
                    },
                    {
                      id: 'b-1',
                      attractionSlug: 'der-schwur-des-kaernan',
                      attractionName: 'Der Schwur des Kärnan',
                      startMinute: 720,
                    },
                  ],
                },
              },
            },
          },
          activeParkSlug: 'hansa-park',
          activeDate: date,
          version: 2,
        })
      );
      window.localStorage.setItem('parkfan_planner_width', '520');
    },
    [DATE]
  );
  await bare.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await bare.locator(LAUNCHER).click();
  await bare.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await bare.waitForTimeout(3000);
  check(
    'ein Park ohne lesbare Wartezeiten bekommt keine Optimier-Leiste',
    (await bare.locator(`${SHEET} [data-planner-optimize]`).count()) === 0
  );
  await bare.close();
}

// ── Two day columns ─────────────────────────────────────────────────────────
// The panel is resizable and a wide one drew ONE column with 500 px of empty
// hour rules beside it. Two columns is what that width is for — "and what if we
// went Saturday instead", side by side rather than one behind a picker — and the
// whole feature is three questions this block asks in order: does it appear only
// where it fits, does the second column carry its own head, and is the
// arrangement remembered.
{
  const cols = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  noteErrors(cols);

  await cols.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await cols.evaluate((plan) => {
    window.localStorage.setItem('parkfan_planner', JSON.stringify(plan));
    window.localStorage.removeItem('parkfan_planner_column2');
  }, PLAN);
  await cols.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await cols.locator(LAUNCHER).click();
  await cols.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cols.waitForTimeout(1500);

  /** The panel's real box, because the stored number is not what is on screen. */
  const panelBox = () =>
    cols.locator(SHEET).evaluate((el) => Math.round(el.getBoundingClientRect().width));

  // This used to assert the opposite — "schmales Panel bietet keine zweite
  // Spalte an" — on the grounds that the default panel is 448 px, two columns
  // need 681, and a switch offering what the panel cannot hold would either draw
  // a column below the floor or do nothing when pressed. What that reasoning
  // missed is that 448 is the width EVERY visitor starts on: the switch was
  // invisible until somebody dragged the edge past 681 for reasons of their own,
  // so the feature announced itself to nobody. The switch is now gated on the
  // WINDOW and the press is what widens the panel, so at 1440 px it is here at
  // 448 px too — off, over a single column.
  const narrowPanel = await panelBox();
  const toggle = cols.locator(`${SHEET} [data-planner-second-column]`);
  check(
    'schmales Panel bietet die zweite Spalte trotzdem an',
    (await toggle.count()) === 1 &&
      (await toggle.getAttribute('data-planner-second-column')) === 'off' &&
      (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 1 &&
      narrowPanel < 681,
    `${narrowPanel} px`
  );

  // The day picker moved onto the column with the park name: with two columns a
  // panel-level picker cannot say which of the two days it means.
  check(
    'Park und Tag stehen an der Spalte, nicht im Panelkopf',
    (await cols
      .locator(`${SHEET} [data-planner-column-head] [data-planner-day-trigger]`)
      .count()) === 1 &&
      (await cols
        .locator(`${SHEET} [data-planner-day-trigger]:not([data-planner-column-head] *)`)
        .count()) === 0
  );

  // The other half of the promise, and the reason the switch may be offered at
  // all: pressing it at 448 px widens the panel to at least the 681 two columns
  // need and draws them. Measured off the DOM rather than off
  // `parkfan_planner_width`, because the stored number is capped against the
  // window on the way out (`fitToViewport`) and a check that believed storage
  // would pass on a panel nobody can see.
  await toggle.click();
  await cols.waitForTimeout(2500);
  const widenedPanel = await panelBox();
  check(
    'ein Klick verbreitert das schmale Panel auf zwei Spalten',
    widenedPanel >= 681 && (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 2,
    `${narrowPanel} → ${widenedPanel} px`
  );

  // And closing it again leaves the width where the press put it. Somebody who
  // has a 681 px panel asked for one; snapping back to 448 would undo a gesture
  // nobody made.
  await toggle.click();
  await cols.waitForTimeout(800);
  const afterClose = await panelBox();
  check(
    'das Schließen setzt die Breite nicht zurück',
    afterClose === widenedPanel &&
      (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 1,
    `${afterClose} px`
  );

  await cols.evaluate(() => window.localStorage.setItem('parkfan_planner_width', '780'));
  await cols.reload({ waitUntil: 'networkidle' });
  await cols.locator(LAUNCHER).click();
  await cols.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cols.waitForTimeout(1500);

  check(
    'breites Panel bietet die zweite Spalte an',
    (await toggle.count()) === 1 &&
      (await toggle.getAttribute('data-planner-second-column')) === 'off'
  );

  const widePanel = await panelBox();
  await toggle.click();
  await cols.waitForTimeout(2500);

  // A panel that is ALREADY wide enough keeps the width it was dragged to. The
  // press only ever raises it to the floor two columns need — somebody who set
  // 780 px does not want to be thrown back to 681 for pressing a switch.
  const wideAfterOpen = await panelBox();
  check(
    'ein schon breites Panel behält seine Breite',
    wideAfterOpen === widePanel && widePanel >= 780,
    `${widePanel} → ${wideAfterOpen} px`
  );

  const columns = cols.locator(`${SHEET} [data-planner-column]`);
  const keys = await columns.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-planner-column'))
  );
  // Same park, the day AFTER — a second column showing the same date twice would
  // open on the one arrangement that says nothing.
  check(
    'die zweite Spalte öffnet auf dem Folgetag desselben Parks',
    keys.length === 2 &&
      keys[0] === `${PARK.slug}:${DATE}` &&
      keys[1] === `${PARK.slug}:${NEXT_DATE}`,
    keys.join(' | ')
  );

  check(
    'genau eine Spalte ist die aktive',
    (await cols.locator(`${SHEET} [data-planner-column-primary]`).count()) === 1
  );
  check(
    'jede Spalte trägt ihren eigenen Kopf',
    (await cols.locator(`${SHEET} [data-planner-column-head]`).count()) === 2 &&
      (await cols.locator(`${SHEET} [data-planner-column-park]`).count()) === 2 &&
      (await cols
        .locator(`${SHEET} [data-planner-column-head] [data-planner-day-trigger]`)
        .count()) === 2
  );

  // Halved, not overflowing: the panel is one box and two columns share it.
  // `PANEL_WIDTH_MIN` is 340, which is exactly what 780 gives each of them once
  // the divider is paid for — so a column here is never narrower than a single
  // one is allowed to be.
  const boxes = await columns.evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().width))
  );
  check(
    'beide Spalten teilen sich das Panel',
    boxes.length === 2 && Math.abs(boxes[0] - boxes[1]) <= 2 && Math.min(...boxes) >= 330,
    boxes.join(' / ')
  );

  // Two grids, not one grid and one empty half: each column runs its own
  // `/plan/day` and draws its own axis.
  const grids = await cols.locator(`${SHEET} [data-planner-grid]`).count();
  check('jede Spalte zeichnet ihre eigene Achse', grids === 2, `${grids} Achsen`);

  // The two axes start on the same pixel, which is what the subgrid is for.
  // Before it, each column stacked its own head and its own context band and the
  // band's height is DATA — Europa-Park on a Sunday in the holidays carries a
  // "Ferien nebenan" chip that Phantasialand does not — so the right column's
  // 09:00 sat 28 px below the left column's 09:00 and every rule after it was
  // out of step.
  const gridTops = await cols
    .locator(`${SHEET} [data-planner-grid]`)
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  check(
    'und beide Achsen fangen auf demselben Pixel an',
    gridTops.length === 2 && Math.abs(gridTops[0] - gridTops[1]) <= 1,
    gridTops.join(' / ')
  );

  // ── The foot belongs to the column, not to the panel ────────────────────────
  // Reported as "die eigener Block Buttons sowie optimieren gehen nur auf die
  // linke Spalte", and it was worse than that: the row said nothing about which
  // day it meant, so the headliner band listed Phantasialand's missing rides
  // under a panel whose right half was Europa-Park.
  const optimizeBars = await cols.locator(`${SHEET} [data-planner-optimize]`).count();
  check('jede Spalte hat ihre eigene Optimier-Leiste', optimizeBars === 2, `${optimizeBars}`);
  const customButtons = await cols.locator(`${SHEET} [data-planner-add-custom]`).count();
  check('und ihren eigenen Eigener-Block-Knopf', customButtons === 2, `${customButtons}`);

  // The headliner bands name DIFFERENT parks' rides, which is the assertion that
  // a second copy of the same component is not the same claim twice.
  const bands = await cols
    .locator(`${SHEET} [data-planner-headliner-hint]`)
    .evaluateAll((els) => els.map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()));
  check(
    'und jede Bande nennt die Bahnen ihres eigenen Parks',
    bands.length === 2 && bands[0] !== bands[1],
    bands.map((b) => b.slice(0, 40)).join('  |  ')
  );

  // The summary counts the COLUMN's day. The second column here is the same
  // park on the next date and holds nothing, so exactly one row is drawn — and
  // it is the primary's. Panel-level, that row said "3 Bahnen" under both
  // halves; the assertion is that it is now inside the column it counts.
  const summaryOwners = await cols.locator(`${SHEET} [data-planner-summary]`).evaluateAll((els) =>
    els.map((el) => ({
      column: el.closest('[data-planner-column]')?.getAttribute('data-planner-column') ?? null,
      text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    }))
  );
  check(
    'die Zusammenfassung sitzt in der Spalte, die sie zählt',
    summaryOwners.length === 1 && summaryOwners[0].column === `${PARK.slug}:${DATE}`,
    summaryOwners.map((row) => `${row.column} → ${row.text}`).join('  |  ')
  );
  check(
    'und die leere zweite Spalte zählt gar nichts',
    (await cols
      .locator(
        `${SHEET} [data-planner-column]:not([data-planner-column-primary]) [data-planner-summary]`
      )
      .count()) === 0
  );

  // What stays panel-level has exactly one of: the push toggle subscribes for
  // the trip rather than for a day, and the drag hint is about the gesture.
  check(
    'der Push-Schalter bleibt einmal im Panel',
    (await cols.locator(`${SHEET} [data-planner-push]`).count()) <= 1
  );

  // ── The column the reader is working in ────────────────────────────────────
  // A fact about the pointer, not about the plan: the primary column IS the
  // plan's active day, so a click that moved THAT would put the same day in both
  // halves. What hangs on the focus is the marker and the park the page behind
  // the panel shows — and this run is on `/de`, which is not a park page, so
  // here it may only move the marker.
  const activeColumn = () =>
    cols.evaluate(
      () =>
        document
          .querySelector('[data-planner-column-active]')
          ?.getAttribute('data-planner-column') ?? null
    );
  const firstActive = await activeColumn();
  check(
    'die erste Spalte ist zuerst die aktive',
    firstActive === `${PARK.slug}:${DATE}`,
    String(firstActive)
  );
  const urlBeforeFocus = cols.url();
  await cols
    .locator(`${SHEET} [data-planner-column]`)
    .nth(1)
    .locator('[data-planner-grid]')
    .first()
    .click({ position: { x: 30, y: 30 } });
  await cols.waitForTimeout(600);
  const secondActive = await activeColumn();
  check(
    'ein Klick in die zweite macht sie zur aktiven',
    secondActive === `${PARK.slug}:${NEXT_DATE}`,
    String(secondActive)
  );
  check(
    'genau eine trägt die Markierung',
    (await cols.locator(`${SHEET} [data-planner-column-active]`).count()) === 1
  );
  check(
    'ohne Parkseite dahinter wird nirgendwohin navigiert',
    cols.url() === urlBeforeFocus,
    cols.url()
  );
  // Back, so the assertions below find the arrangement they were written for.
  await cols
    .locator(`${SHEET} [data-planner-column]`)
    .first()
    .locator('[data-planner-grid]')
    .first()
    .click({ position: { x: 30, y: 30 } });
  await cols.waitForTimeout(400);

  // Only the second column may be closed. The first is the plan's active day and
  // closing it would leave the panel with nothing to be about.
  check(
    'nur die zweite Spalte lässt sich schließen',
    (await cols.locator(`${SHEET} [data-planner-column-close]`).count()) === 1
  );

  // The park chooser lists the plan's OWN parks — this one holds two — and the
  // wizard at the foot is where a new one comes from.
  await cols.locator(`${SHEET} [data-planner-column-park]`).last().click();
  await cols.waitForTimeout(400);
  const popover = cols.locator('[data-slot="popover-content"]');
  const parkList = ((await popover.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ');
  check(
    'die Spalte lässt jeden geplanten Park wählen',
    /Phantasialand/.test(parkList) && /Europa-Park/.test(parkList),
    parkList.slice(0, 120)
  );
  await cols.keyboard.press('Escape');
  await cols.waitForTimeout(300);

  // Remembered across a reload, because the panel unmounts every time somebody
  // looks at the page behind it and an arrangement that vanished then would not
  // be an arrangement.
  await cols.reload({ waitUntil: 'networkidle' });
  await cols.locator(LAUNCHER).click();
  await cols.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cols.waitForTimeout(2000);
  check(
    'die Anordnung überlebt einen Reload',
    (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 2
  );

  // Narrowed below the floor the second column is not DRAWN — and it is not
  // forgotten either, so widening the panel brings the same day back instead of
  // making somebody arrange it again. This used to assert that the switch was
  // gone as well; it is not, because it is gated on the window now, and the
  // press is exactly what makes the room. So the assertion is about the two
  // things that still hold: one column on screen, and the day still in storage.
  await cols.evaluate(() => window.localStorage.setItem('parkfan_planner_width', '448'));
  await cols.reload({ waitUntil: 'networkidle' });
  await cols.locator(LAUNCHER).click();
  await cols.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cols.waitForTimeout(1500);
  const remembered = await cols.evaluate(() =>
    window.localStorage.getItem('parkfan_planner_column2')
  );
  check(
    'zu schmal blendet die zweite Spalte aus, ohne sie zu vergessen',
    (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 1 &&
      (await toggle.getAttribute('data-planner-second-column')) === 'off' &&
      (remembered ?? '').includes(NEXT_DATE),
    remembered ?? '(nichts gemerkt)'
  );

  // Pressed at a narrow panel with something remembered, the switch widens and
  // brings THAT day back — it does not open tomorrow. Opening tomorrow here
  // would quietly discard an arrangement somebody made, and the only sign of it
  // would be a date they did not choose.
  await toggle.click();
  await cols.waitForTimeout(2500);
  const revivedWidth = await panelBox();
  const revived = await cols
    .locator(`${SHEET} [data-planner-column]`)
    .last()
    .getAttribute('data-planner-column');
  check(
    'der Schalter holt am schmalen Panel den gemerkten Tag zurück',
    revived === `${PARK.slug}:${NEXT_DATE}` && revivedWidth >= 681,
    `${revived} @ ${revivedWidth} px`
  );

  // And back. The stored width is what decides it, so the same press that took
  // it away brings it back with the day it had.
  await cols.evaluate(() => window.localStorage.setItem('parkfan_planner_width', '780'));
  await cols.reload({ waitUntil: 'networkidle' });
  await cols.locator(LAUNCHER).click();
  await cols.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cols.waitForTimeout(2000);
  check(
    'wieder breit genug bringt denselben Tag zurück',
    (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 2 &&
      (await cols
        .locator(`${SHEET} [data-planner-column]`)
        .last()
        .getAttribute('data-planner-column')) === `${PARK.slug}:${NEXT_DATE}`
  );

  // Closing it is the toggle's other half, and the switch has to report it.
  await cols.locator(`${SHEET} [data-planner-column-close]`).click();
  await cols.waitForTimeout(600);
  check(
    'die zweite Spalte lässt sich wieder schließen',
    (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 1 &&
      (await cols
        .locator(`${SHEET} [data-planner-second-column]`)
        .getAttribute('data-planner-second-column')) === 'off'
  );

  await cols.close();
}

// The switch is offered on the WINDOW, and this is where that stops. Two columns
// need 681 px of panel and the page keeps 360 of the window whatever the stored
// width says (`fitToViewport` caps at `innerWidth - PAGE_MIN_PX`), so under
// 1041 px the widest panel anybody can have is too narrow: at 900 px it is 540.
// A switch here would promise a width the cap takes back in the same frame.
// Deliberately a desktop viewport and not a phone — `isPhone` stops at 639 px
// and would make this pass for the other reason.
{
  const tight = await browser.newPage({ viewport: { width: 900, height: 900 } });
  noteErrors(tight);
  await tight.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await tight.evaluate((plan) => {
    window.localStorage.setItem('parkfan_planner', JSON.stringify(plan));
    window.localStorage.removeItem('parkfan_planner_column2');
    // Stored wide, so the refusal is the window's and not the number's.
    window.localStorage.setItem('parkfan_planner_width', '780');
  }, PLAN);
  await tight.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await tight.locator(LAUNCHER).click();
  await tight.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await tight.waitForTimeout(1500);
  check(
    'ein Fenster unter 1041 px bietet keine zweite Spalte an',
    (await tight.locator(`${SHEET} [data-planner-second-column]`).count()) === 0 &&
      (await tight.locator(`${SHEET} [data-planner-column]`).count()) === 1
  );
  await tight.close();
}

// A phone has no second column and must not pretend otherwise: the sheet is the
// width of the screen there, no drag makes it wider, and two 195 px columns
// would be two unusable ones. Since the switch moved onto the window, 390 px is
// below the 1041 the check above uses too — so this no longer isolates
// `isPhone`. It is kept because a phone refuses for its own reason, and because
// everything below it (one foot, nothing painting over anything) is only ever
// asserted here.
{
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  noteErrors(phone);
  await phone.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await phone.evaluate(
    ([plan, second]) => {
      window.localStorage.setItem('parkfan_planner', JSON.stringify(plan));
      // Wide enough for two on a desktop, and stored — the phone must refuse on
      // its own account rather than because the number happens to be small.
      window.localStorage.setItem('parkfan_planner_width', '780');
      window.localStorage.setItem(
        'parkfan_planner_column2',
        JSON.stringify({ parkSlug: 'phantasialand', date: second })
      );
    },
    [PLAN, NEXT_DATE]
  );
  await phone.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await settleHydration(phone);
  await phone.locator(LAUNCHER).click();
  await phone.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await phone.waitForTimeout(2000);

  check(
    'das Telefon zeigt genau eine Spalte und keinen Schalter',
    (await phone.locator(`${SHEET} [data-planner-column]`).count()) === 1 &&
      (await phone.locator(`${SHEET} [data-planner-second-column]`).count()) === 0
  );

  // The foot is drawn ONCE, and on a phone it is the panel that draws it — the
  // column's box is 295 px of a 716 px sheet there and this row measures 195, so
  // inside the column it would leave the axis 100 px. Two copies in the DOM
  // would also be two of every selector below.
  check(
    'der Fuß wird auf dem Telefon genau einmal gezeichnet',
    (await phone.locator(`${SHEET} [data-planner-optimize]`).count()) === 1 &&
      (await phone.locator(`${SHEET} [data-planner-summary]`).count()) === 1
  );

  // Nothing in the sheet paints over anything else. It did: with the foot inside
  // the column, the column's content ran 98 px past its box and the headliner
  // band and the totals were drawn across the ride search under them.
  const stack = await phone.locator(SHEET).evaluate((sheet) =>
    [...sheet.children]
      .map((el) => {
        const box = el.getBoundingClientRect();
        return {
          cls: el.className.slice(0, 40),
          top: Math.round(box.top),
          bottom: Math.round(box.bottom),
          // `display: contents` and hidden rows have no box and cannot overlap.
          real: box.height > 0 && getComputedStyle(el).position !== 'absolute',
        };
      })
      .filter((row) => row.real)
  );
  const overlaps = stack
    .slice(1)
    .map((row, i) => ({ a: stack[i], b: row }))
    .filter((pair) => pair.b.top < pair.a.bottom - 1);
  check(
    'und keine Zeile des Telefon-Panels malt über die nächste',
    overlaps.length === 0,
    overlaps.map((pair) => `${pair.a.cls} ${pair.a.bottom} > ${pair.b.top}`).join(' | ') ||
      stack.map((row) => `${row.top}-${row.bottom}`).join(' ')
  );

  // …and the column itself fits its box, which is the same defect one level in:
  // a column whose content is taller than its grid row overflows into the row
  // below rather than shrinking its axis.
  const colFit = await phone
    .locator(`${SHEET} [data-planner-column]`)
    .first()
    .evaluate((el) => ({ h: Math.round(el.getBoundingClientRect().height), sh: el.scrollHeight }));
  check(
    'die Spalte läuft nicht über ihren Kasten hinaus',
    colFit.sh <= colFit.h + 1,
    `${colFit.sh} px Inhalt in ${colFit.h} px`
  );

  // The column head has to fit a 390 px sheet: park name, day picker, nothing
  // running off the edge. The head is `min-w-0` and the name truncates, so this
  // measures the box rather than trusting the classes.
  const head = phone.locator(`${SHEET} [data-planner-column-head]`).first();
  const fits = await head.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return {
      over: Math.round(box.right - window.innerWidth),
      scroll: el.scrollWidth - el.clientWidth,
    };
  });
  check(
    'der Spaltenkopf passt aufs Telefon',
    fits.over <= 0 && fits.scroll <= 1,
    `${fits.over} px über den Rand, ${fits.scroll} px Überlauf`
  );

  await phone.close();
}

// ---------------------------------------------------------------------------
// The park header's button, and the photograph it opens the wizard on.
//
// Two halves of one press. `ParkPlannerLink` cancels its own navigation and
// asks `plannerUi` for the panel AND the wizard; the panel is the only place
// that can answer, because the action reads the page beacon to decide which
// park "this one, unplanned" is. Half of that shipped once with nothing reading
// the request, so the press opened a panel with a second button in it.
//
// The photo is the other report. `parkBackgroundImage` is a property of the
// PARK and rides on a payload keyed by the DATE, so every arrow press in the
// calendar emptied `planDay.data` for as long as the next answer was in flight
// and the band fell back to its no-photo state — a photograph blinking once per
// press, on the screen whose whole job is pressing them. The mock below holds
// each answer for 700 ms on purpose: that window IS the bug, and without it the
// old code would pass.
{
  const wiz = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(wiz);

  const PARK_PHOTO = '/media/phantasialand/taron.jpg?v=04eb2f11';
  /** Days off {@link DATE} by string arithmetic — see the note on `NEXT_DATE`. */
  const dayFrom = (offset) =>
    new Date(new Date(`${DATE}T12:00:00Z`).getTime() + offset * 86_400_000)
      .toISOString()
      .slice(0, 10);

  let planDayCalls = 0;
  await wiz.route('**/plan/day**', async (route) => {
    planDayCalls += 1;
    const date = new URL(route.request().url()).searchParams.get('date') ?? DATE;
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        parkName: PARK.name,
        timezone: 'Europe/Berlin',
        parkBackgroundImage: PARK_PHOTO,
        parkBackgroundPosition: '50% 30%',
        context: {
          date,
          status: 'OPERATING',
          openHour: 9,
          closeHour: 18,
          crowdLevel: 'moderate',
          weather: null,
          isHoliday: false,
          isBridgeDay: false,
          isSchoolVacation: false,
          isWeekend: false,
        },
        tier: 'measured',
        leadDays: 1,
        leadTimeMae: 7,
        rides: [],
      }),
    });
  });

  const parkUrl = `${BASE}/de/parks/${PARK.geo.continent}/${PARK.geo.country}/${PARK.geo.city}/${PARK.slug}`;
  await wiz.goto(parkUrl, { waitUntil: 'networkidle' });

  const link = wiz.locator('[data-park-planner-link]');
  check('der Parkkopf trägt den Planer-Knopf', (await link.count()) === 1);

  await link.first().click();
  await wiz.waitForTimeout(1500);

  check('und der Klick navigiert nicht weg', wiz.url().startsWith(parkUrl), wiz.url());

  // The PANEL is a dialog too. The wizard is the one holding the month grid,
  // which is also the assertion that the press landed on the date step rather
  // than on the park search.
  const wizard = wiz
    .locator('[role="dialog"]')
    .filter({ has: wiz.locator('[data-planner-day]') })
    .first();
  check('er öffnet den Assistenten auf der Tagesauswahl', (await wizard.count()) === 1);

  const heroTitle =
    (await wizard.locator('[data-slot="dialog-title"], h2').first().textContent()) ?? '';
  check('auf dem Park, um den es auf der Seite geht', heroTitle.includes(PARK.name), heroTitle);

  await wizard.locator(`button[data-planner-day="${dayFrom(1)}"]`).click();
  await wizard
    .locator('img')
    .first()
    .waitFor({ state: 'attached', timeout: 8000 })
    .catch(() => {});
  await wiz.waitForTimeout(400);
  const firstSrc = await wizard
    .locator('img')
    .first()
    .getAttribute('src')
    .catch(() => null);
  check(
    'nach der ersten Tageswahl steht das Foto des Parks im Kopf',
    Boolean(firstSrc && firstSrc.includes('taron')),
    String(firstSrc).slice(0, 56)
  );

  // Walk three more days, sampling the band the whole way. The samples fall
  // INSIDE the 700 ms each answer is held for, which is where the picture used
  // to be gone.
  const samples = [];
  const sampler = setInterval(async () => {
    try {
      samples.push(await wizard.locator('img').count());
    } catch {
      /* the dialog is mid-render — not a reading */
    }
  }, 40);
  const before = planDayCalls;
  for (const offset of [2, 3, 4]) {
    await wizard.locator(`button[data-planner-day="${dayFrom(offset)}"]`).click();
    await wiz.waitForTimeout(350);
  }
  await wiz.waitForTimeout(1500);
  clearInterval(sampler);

  check(
    'jeder Tageswechsel fragt den Tag neu an',
    planDayCalls - before >= 3,
    `${before} → ${planDayCalls}`
  );
  const missing = samples.filter((count) => count === 0).length;
  check(
    'und das Foto verschwindet dabei in keiner Messung',
    samples.length > 20 && missing === 0,
    `${samples.length} Messungen, ${missing} ohne Bild`
  );
  const lastSrc = await wizard
    .locator('img')
    .first()
    .getAttribute('src')
    .catch(() => null);
  check('es ist dieselbe Datei geblieben', lastSrc === firstSrc, `${firstSrc} → ${lastSrc}`);

  // A day the park is shut answers 404, which the hook resolves to `null`. That
  // is a statement about the day, never about the park's photograph.
  allowPlanDay404.add(wiz);
  await wiz.route('**/plan/day**', (route) => route.fulfill({ status: 404, body: '' }));
  const shut = [];
  const sampler2 = setInterval(async () => {
    try {
      shut.push(await wizard.locator('img').count());
    } catch {
      /* mid-render */
    }
  }, 40);
  await wizard.locator(`button[data-planner-day="${dayFrom(5)}"]`).click();
  await wiz.waitForTimeout(1200);
  clearInterval(sampler2);
  check(
    'und ein Tag ohne Antwort nimmt es auch nicht weg',
    shut.length > 10 && shut.filter((count) => count === 0).length === 0,
    `${shut.length} Messungen, ${shut.filter((count) => count === 0).length} ohne Bild`
  );

  await wiz.close();
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
