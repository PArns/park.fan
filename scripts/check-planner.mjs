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

// The way in is a tab on the window's edge, not a floating pill in the corner,
// and it is drawn on every page whether or not anything is planned — so this
// selector is a data attribute rather than an aria-label: the tab's accessible
// name is its own visible word, which differs per locale.
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
    document.cookie = 'planner=1; path=/';
  }, PLAN);
  await page.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
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
  document.cookie = 'planner=0; path=/';
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
    document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
  // The floor still exists and still means something: below it the block is one
  // line of text and a picture would be a band a few pixels tall behind a name.
  check(
    'ein sehr kurzer Block trägt keins',
    winja?.photo === false,
    `${winja?.height} px, Foto: ${winja?.photo}`
  );

  // The ride search rows and the headliner the plan is missing both carry one.
  const searchThumbs = await photos
    .locator(`${SHEET} img[src*="taron"], ${SHEET} img[src*="black-mamba"]`)
    .count();
  check('die Suchzeilen tragen ihre Fotos', searchThumbs >= 2, `${searchThumbs}`);

  const hint = photos.locator('[data-planner-headliner-hint]');
  check('der Headliner-Hinweis ist da', (await hint.count()) === 1);
  if (await hint.count()) {
    check(
      'und der verpasste Headliner zeigt sich',
      (await hint.first().locator('img').count()) >= 1
    );
  }

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
        document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
      document.cookie = 'planner=1; path=/';
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
