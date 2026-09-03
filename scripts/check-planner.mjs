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

  // The tick-off is the first store WRITE, and the store rewrites the whole plan
  // — so this is the first moment the migration is observable. The entry was
  // seeded in the old shape (`hour: 15`) on purpose: localStorage is a plan's
  // only copy, and a tab still running the previous build must not empty it.
  const migrated =
    stored?.parks?.[PLAN.activeParkSlug]?.days?.[PLAN.activeDate]?.entries?.find(
      (e) => e.id === 'black-mamba-1'
    )?.startMinute ?? null;
  check('alter Eintrag mit `hour` wird auf Minuten gehoben', migrated === 900, `${migrated}`);
} else {
  check('Abhaken-Knopf vorhanden', false);
}

// On a phone this input is the only way to add anything, so it may never vanish
// — not even when the day payload is missing.
check('Ride-Suche vorhanden', (await sheet.locator('input[type="search"]').count()) === 1);

// The overview: every park and day in one list, reached from the park name.
// NOT `button[aria-expanded]` alone. The phone sheet's grab handle sits earlier
// in the DOM; it is `sm:hidden`, so on this desktop viewport `.first()` resolved
// to an invisible element and the click timed out for thirty seconds. The park
// name is what opens the overview, so say so.
const toggle = sheet.locator('button[aria-expanded]').filter({ hasText: PARK.name }).first();
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

// A park that is NOT in the plan yet. The overview lists parks WITH entries, so
// without a search there was no way to start a second park from inside the
// panel — the visitor had to leave it, navigate to that park, and use a control
// there. Toverland is deliberately neither of the two seeded parks.
const reopen = sheet.locator('button[data-planner-overview-toggle]');
// Asserted, not merely branched on: a block that quietly skips itself when its
// entry point is missing reports the same green as one that passed.
check('die Übersicht hat einen benannten Schalter', (await reopen.count()) === 1);
if (await reopen.count()) {
  await reopen.click();
  await page.waitForTimeout(300);
  const parkSearch = sheet.locator('[data-planner-park-search] input[type="search"]');
  check('Parksuche in der Übersicht', (await parkSearch.count()) === 1);

  if (await parkSearch.count()) {
    await parkSearch.fill('toverland');
    const hit = sheet
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
      // The row carries where the park IS, because two parks share a name often
      // enough — Disneyland Park is Anaheim and Paris.
      const rowText = (await hit.first().textContent()) ?? '';
      check(
        'die Trefferzeile nennt Ort und Land',
        /Sevenum/.test(rowText) && /Netherlands|Niederlande/i.test(rowText),
        rowText.trim()
      );

      await hit.first().click();
      await page.waitForTimeout(600);
      const after = await page.evaluate(() =>
        JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}')
      );
      const picked = after?.parks?.['attractiepark-toverland'];
      check(
        'der gewählte Park landet im Plan',
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
      check(
        'nach der Wahl steht wieder die Zeitleiste',
        (await sheet.locator('input[type="search"]').count()) === 1
      );
    }
  }
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
    const hit = await phone.evaluate(() => {
      const block = document.querySelector('li[data-planner-block]');
      if (!block) return 'no block';
      const box = block.getBoundingClientRect();
      const el = document.elementFromPoint(box.left + 8, box.top + box.height / 2);
      return el?.closest('li[data-planner-block]') ? 'grip' : (el?.tagName ?? 'nothing');
    });
    check('Griff ist auf dem Handy treffbar', hit === 'grip', hit);
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
  document.cookie = 'planner=0; path=/';
});
await cal.reload({ waitUntil: 'networkidle' });
await cal.waitForTimeout(4000);

// The cell is a `div[role="button"]`, and the plan control only renders on a day
// the park is OPERATING — so try a few until one is open rather than assuming
// the first of the month is.
const cells = cal.locator('[role="button"][tabindex="0"][aria-label*="—"]');
const planButton = cal.getByRole('button', { name: 'Diesen Tag planen' });
const cellCount = await cells.count();
let reachable = false;
for (let i = 0; i < Math.min(cellCount, 8) && !reachable; i++) {
  await cells.nth(i).click();
  await cal.waitForTimeout(1200);
  reachable = (await planButton.count()) > 0;
  if (!reachable) await cal.keyboard.press('Escape');
}
check('„Diesen Tag planen" im Kalendertag', reachable, `Zellen: ${cellCount}`);

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
    // F.L.Y. to 09:00 puts a WARNED ride in a 48 px box, which is the one shape
    // the fixture above never produces on its own — without this the assertion
    // is green against the bug it exists to catch, which is worth less than no
    // assertion at all.
    // By id, never by position: a locator resolves when it is used, and moving a
    // block re-sorts the list — `nth(1)` after the move is a different ride than
    // `nth(1)` before it, so the restore below would put the WRONG block back.
    const flyBlock = grid.locator('li[data-planner-entry="fly-1"]');
    const flyRange = flyBlock.locator('input[type="range"]');
    await flyRange.fill('540');
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

    // Requirement 2: the drag may not go earlier than the park opens.
    const range = blocks.first().locator('input[type="range"]');
    const min = await range.getAttribute('min');
    check('die Untergrenze ist die Parköffnung', Number(min) === OPEN_HOUR * 60, `min=${min}`);

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

    // Shows: three states, never two. Which of them applies depends on whether
    // the seeded date is today IN THE PARK'S ZONE — and it is not the same
    // question as whether it is today in UTC. Run late enough in the evening and
    // Berlin has already rolled over while the test's own `Date.now() + 1 day`
    // has not, so the honest answer flips. Derive it the way the code does.
    const parkToday = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const bandText = await grid.locator(`${SHEET} .sticky`).first().textContent();
    const expected = DATE === parkToday ? /Vorstellungen|·/ : /erst am Tag selbst/;
    check(
      'Show-Band sagt, was es über Vorstellungen weiß',
      expected.test(bandText ?? ''),
      `${DATE === parkToday ? 'heute' : 'künftig'}: ${(bandText ?? '').slice(0, 50)}`
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
      document.cookie = 'planner=1; path=/';
    },
    [PLAN, DATE]
  );
  await hl.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  await hl.locator(LAUNCHER).click();
  await hl.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await hl.waitForTimeout(2500);

  const hint = hl.locator(`${SHEET} button`).filter({ hasText: 'F.L.Y.' });
  check('der fehlende Headliner wird angeboten', (await hint.count()) > 0, `${await hint.count()}`);

  // Scoped to the hint itself. Reading the whole sheet catches the ride search
  // below it, which lists every ride by design — the first version of this
  // assertion failed on the panel's own header.
  const hintText = (await hl.locator(`${SHEET} [data-planner-headliner-hint]`).textContent()) ?? '';
  check(
    'nur der FEHLENDE Headliner steht drin',
    /F\.L\.Y\./.test(hintText) && !/Taron/.test(hintText),
    hintText.slice(0, 60)
  );
  check(
    'eine gewöhnliche Bahn steht nicht im Hinweis',
    !/Black Mamba/.test(hintText),
    hintText.slice(0, 60)
  );

  // And it goes quiet once the plan is complete.
  if (await hint.count()) {
    await hint.first().click();
    await hl.waitForTimeout(600);
    const left = await hl.locator(`${SHEET} [data-planner-headliner-hint]`).count();
    check('der Hinweis verschwindet, sobald er erledigt ist', left === 0, `${left}`);
  }

  await hl.close();
}

// ── CPU: no clock where there is no now line ────────────────────────────────
// The minute tick was subscribed unconditionally, so on any date that is not
// today — nearly every date somebody plans — the panel installed a 60-second
// interval and re-rendered the whole grid once a minute for a line it never
// draws. Counted rather than reasoned about: the page records every
// `setInterval` before the panel opens.
{
  const cpu = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(cpu);
  await cpu.addInitScript(() => {
    const w = window;
    w.__intervals = [];
    const original = w.setInterval;
    w.setInterval = function (handler, delay, ...rest) {
      w.__intervals.push(delay);
      return original.call(this, handler, delay, ...rest);
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
  const beforeOpen = await cpu.evaluate(
    () => (window.__intervals ?? []).filter((d) => d === 60_000).length
  );
  await cpu.locator(LAUNCHER).click();
  await cpu.locator(SHEET).waitFor({ state: 'visible', timeout: 10_000 });
  await cpu.waitForTimeout(2500);

  // The DELTA across opening the panel, not the page's total: the app already
  // runs a 60-second interval of its own before the planner exists, so counting
  // every timer on the page would have failed this for somebody else's clock.
  const after = await cpu.evaluate(
    () => (window.__intervals ?? []).filter((d) => d === 60_000).length
  );
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
        rides: ['taron', 'black-mamba'].map((slug) => ({
          attractionSlug: slug,
          attractionName: slug === 'taron' ? 'Taron' : 'Black Mamba',
          land: 'Mystery',
          hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, i) => ({ hour: OPEN + i, wait: 40 })),
          dayPeak: 40,
          uncertaintyMinutes: 10,
          sampleDays: 400,
        })),
        shows: [],
      }),
    })
  );

  await seed(drag);
  await drag.goto(`${BASE}/de/parks/europe/germany/bruehl/phantasialand`, {
    waitUntil: 'domcontentloaded',
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

  await drag.close();
}

// ── Shows, on a day that HAS them ───────────────────────────────────────────
// The run above deliberately seeds tomorrow, "so the run is stable" — and
// showtimes exist for today and no other date, so every pass so far has watched
// the band say "not knowable yet" and has never once seen a show line. That gap
// is why the lines could be a dashed rule with a bare time in the hour column,
// indistinguishable from the grid they sit in, through every green check.
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
    { slug: 'a', name: 'Miji African Dancers', at: '11:30' },
    { slug: 'b', name: 'Nobis Vol. 2', at: '15:00' },
    { slug: 'c', name: 'BATTLE of the BEST', at: '15:00' },
    { slug: 'd', name: 'Rock on Ice', at: '15:05' },
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
          shows: [],
        }),
      });
    }
    // The live park payload, which is where showtimes actually come from.
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
        shows: SHOWS.map((show) => ({
          slug: show.slug,
          name: show.name,
          isCurrentlyInSeason: true,
          showtimes: [{ startTime: `${todayInPark}T${show.at}:00+02:00` }],
        })),
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
      document.cookie = 'planner=1; path=/';
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

  await shows.close();
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
      document.cookie = 'planner=1; path=/';
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
        document.cookie = 'planner=1; path=/';
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

    // Only where it turns: overcast → rain → storm → showers → overcast, plus
    // the hour the axis opens in. A figure at every hour is a table.
    const titles = await band
      .locator('[title]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('title') ?? ''));
    check(`${label}: nur die Wechsel tragen ein Label`, titles.length === 5, titles.join(' | '));
    check(
      `${label}: ein nasser Wechsel nennt die Menge`,
      titles.some((title) => /Gewitter/.test(title) && /mm/.test(title)),
      titles.join(' | ')
    );
    // German decimals. `toFixed(1)` writes "3.6 mm", which is a different
    // number to everybody reading a German sentence.
    check(
      `${label}: die Menge ist deutsch geschrieben`,
      titles.some((title) => /\d,\d\s*mm/.test(title)),
      titles.join(' | ')
    );

    // The geometric one. The rail is a guest in the hour gutter, so nothing it
    // draws may hang off either edge of that column — the first version gave the
    // container no width, and every label sat OUTSIDE the panel entirely.
    const escaped = await rail.evaluate(() => {
      const rail = document.querySelector('[data-planner-weather-rail]');
      if (!rail) return 'no rail';
      const column = rail.getBoundingClientRect();
      const bad = [];
      for (const el of rail.querySelectorAll('[title], div[class*="bg-"]')) {
        const box = el.getBoundingClientRect();
        if (box.width === 0) continue;
        if (box.left < column.left - 0.5 || box.right > column.right + 0.5) {
          bad.push(
            `${el.getAttribute('title') ?? el.className} @ ${Math.round(box.left)}..${Math.round(box.right)} vs ${Math.round(column.left)}..${Math.round(column.right)}`
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
      document.cookie = 'planner=1; path=/';
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
  const LOCALE_OPEN = {
    de: 'Planer öffnen',
    en: 'Open planner',
    nl: 'Planner openen',
    fr: 'Ouvrir le planificateur',
    es: 'Abrir el planificador',
    it: 'Apri il pianificatore',
  };

  for (const [locale, label] of Object.entries(LOCALE_OPEN)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const missing = [];
    page.on('console', (msg) => {
      if (/MISSING_MESSAGE/.test(msg.text())) missing.push(msg.text());
    });

    await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((plan) => {
      window.localStorage.setItem('parkfan_planner', JSON.stringify(plan));
      document.cookie = 'planner=1; path=/';
    }, PLAN);
    await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle' });

    const launcher = page.locator(`button[aria-label="${label}"]`);
    const found = (await launcher.count()) === 1;
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
