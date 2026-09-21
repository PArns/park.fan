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
// The rendered chip heights are asserted below, so the numbers come from the
// module that states them rather than from a copy that can drift (PAR-180).
import { LEG_CHIP_COMPACT_PX, LEG_CHIP_PX } from '../lib/planner/leg-chip.ts';

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

/**
 * The balance, and the number of times the planner was actually opened.
 *
 * It sits up here rather than beside the `process.exit` it feeds, because the
 * guard below calls it from a path that can fire at any line of the file — and
 * it is written to be callable twice, since a throw in the last few statements
 * would otherwise print two balances that disagree.
 *
 * The open count is here and not among the assertions on purpose: it is the
 * figure that says whether the run got as far as the flows it reports on, which
 * a pass/fail row cannot (📚 G-72).
 */
let balanceShown = null;
function printBalance() {
  if (balanceShown !== null) return balanceShown;
  console.log(
    `\nℹ️  Planer ${sheetOpens.opened}× geöffnet` +
      (sheetOpens.retried > 0
        ? `, davon ${sheetOpens.retried}× erst nach einem zweiten Druck`
        : '') +
      (sheetOpens.failed > 0 ? `, ${sheetOpens.failed}× gar nicht` : '')
  );
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} bestanden`);
  if (failed.length > 0) {
    console.log(failed.map((f) => `  · ${f.name}`).join('\n'));
  }
  balanceShown = failed.length;
  return failed.length;
}

/**
 * Leave only once the balance has actually left the process.
 *
 * `process.exit()` does not wait for a pending write, and stdout is a PIPE
 * rather than a terminal whenever this runs from a script or a CI step — so the
 * last lines, which are the ones worth having, can be cut off mid-sentence. The
 * callback of a final empty write fires after everything queued before it has
 * been flushed; the timer is the way out if the reader on the other end has
 * already gone away.
 *
 * It therefore does NOT end the run where it is called, which the two early
 * exits below would otherwise carry on past with a closed browser. So it answers
 * with a promise that never settles: `await exitAfterFlush(1)` is the last thing
 * a caller does, and the exit itself is what ends it.
 */
function exitAfterFlush(code) {
  process.exitCode = code;
  const leave = () => process.exit(code);
  process.stdout.write('', leave);
  setTimeout(leave, 2000);
  return new Promise(() => {});
}

/**
 * A throw anywhere in this file used to take the balance with it.
 *
 * This module is one long top-level `await`, so a rejection it does not catch
 * ends the run where it happened — and what a reader then has is a stack trace
 * over an unknown number of assertions that had already passed. It happened
 * twice on 2026-09-13 with roughly 300 green rows behind it (PAR-186), and both
 * times the interesting question was not the stack but which of the 40 flows had
 * not been measured at all.
 *
 * Measured in Node 24: a rejected top-level `await` arrives as
 * `uncaughtException`, not as `unhandledRejection` — both are registered
 * because the second is what a floating promise elsewhere in the file would
 * produce. The stack is printed first and the balance last, so the balance is
 * what the terminal ends on.
 */
for (const event of ['uncaughtException', 'unhandledRejection']) {
  process.on(event, (error) => {
    console.error(error);
    check(
      'der Lauf kommt bis zur Bilanz',
      false,
      `${event}: ${String(error?.message ?? error)
        .split('\n')[0]
        .slice(0, 200)}`
    );
    printBalance();
    exitAfterFlush(1);
  });
}

/**
 * Go to the planner's OWN page and wait for it to be drawn — never for the
 * network to fall quiet.
 *
 * `waitUntil: 'networkidle'` cannot resolve on `/de/tagesplaner`, and the reason
 * is the page rather than the server. Measured here, 1280×1000, `pnpm dev` on
 * :3112, in-flight count sampled every 1.5 s for 18 s:
 *
 *     /de              2 → 1 → 1 → 1 …   (the one is the HMR client)
 *     /de/tagesplaner  13 → 13 → 13 …    (never moves)
 *
 * The thirteen are `loading="lazy"` images the article's chapters mount with no
 * laid-out box — 22 of the page's 31 images are lazy and 15 of them never
 * complete. Chromium issues the request and then defers the fetch indefinitely,
 * Playwright counts every deferred one as in flight, and `networkidle` wants two
 * or fewer for 500 ms. So the condition is unreachable by construction: it is
 * not the dev server's HMR socket (`/de` holds exactly one of those and settles
 * in 5 s), and `pnpm start` would not help either.
 *
 * `domcontentloaded` plus a wait for the element the next assertion is about is
 * what the rest of this file already does. `attached`, not `visible`: an
 * assertion that COUNTS something must still be allowed to find zero, so the
 * wait is a best effort and the check downstream stays the judge.
 */
async function gotoPlannerPage(page, url, ready) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (ready) {
    await page
      .locator(ready)
      .first()
      .waitFor({ state: 'attached', timeout: 15_000 })
      .catch(() => {});
  }
}

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
 * A call written into one block fixed that block and nothing else, and the run
 * stayed red on what the other blocks produced: 41 warnings on the last run
 * before PAR-328, 37 of them from the homepage at 390 px and 4 from the park
 * page, none from the phone block that already waited. So the wait moved into
 * {@link openSheet}, where it runs for a page whose sheet will be MODAL, and the
 * four calls that stood in front of an `openSheet` went with it. What still
 * calls this directly is the one press that does not go through the launcher:
 * the park header's button, which opens the wizard dialog — modal at every
 * width, unlike the panel.
 *
 * It has a second reader since PAR-186: {@link openSheet} waits here before a
 * REPEATED press, where the reason is the other half of the same fact — a
 * launcher that swallowed the first press was painted but not yet wired, and the
 * main thread going quiet is what says React has caught up. That call cannot
 * waive a hydration error either: it runs before the press, so what it avoids is
 * the mismatch the press itself would have caused, and anything the app logs on
 * its own still fails the run.
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

/** How long the edge tab is waited for before a step gives up on it. */
const LAUNCHER_TIMEOUT_MS = 20_000;
/**
 * How long one press may take, actionability included.
 *
 * Not the old 30 s default and not a short number either: the press waits for a
 * tab that tracks the panel on a 300 ms transform, and the runs this is written
 * for are the ones where the machine is busy — a press that fails on a loaded
 * box would report the planner shut over an animation.
 */
const SHEET_PRESS_MS = 10_000;
/** How long ONE press gets to put the sheet on screen before the next one. */
const SHEET_ARRIVE_MS = 4000;
/** How many presses a step spends before it reports the planner shut. */
const SHEET_ATTEMPTS = 3;

/** Counted rather than asserted — see the last paragraph of {@link openSheet}. */
const sheetOpens = { opened: 0, retried: 0, failed: 0 };

/**
 * The query the flyout draws a MODAL sheet on (`modal={isPhone}`), read out of
 * the module that states it.
 *
 * Read rather than imported, and rather than copied. Imported is what this file
 * does with `leg-chip.ts`, but `use-grid-scale.ts` reaches for `@/lib` and
 * `--experimental-strip-types` resolves no alias, so the import ends the run
 * before the first assertion. Copied would be a second source of truth for a
 * string that decides whether {@link openSheet} waits at all. Missing the
 * constant therefore means waiting on every page rather than on none: slower,
 * and never silently unguarded.
 */
const PLANNER_PHONE_QUERY =
  readFileSync('lib/planner/use-grid-scale.ts', 'utf8').match(
    /PLANNER_PHONE_QUERY\s*=\s*'([^']+)'/
  )?.[1] ?? null;
if (!PLANNER_PHONE_QUERY) {
  console.log(
    'ℹ️  PLANNER_PHONE_QUERY steht nicht mehr in lib/planner/use-grid-scale.ts — es wird vor jedem Druck gewartet'
  );
}

/**
 * Open the planner and answer whether it is on screen. Never throws.
 *
 * Every flow in this file starts with the same two lines — press the edge tab,
 * wait for the sheet — and they were written as a bare `click()` followed by a
 * `waitFor({ timeout: 10_000 })`. Both throw, and a throw here ends the run.
 * The press is the fragile half: `waitUntil: 'domcontentloaded'` resolves before
 * React has wired the tab, so the press lands on a painted button with no
 * handler on it, goes nowhere, and the wait then expires over a sheet nobody
 * asked for. Observed in two of four runs of one commit (PAR-186), both times
 * while the machine was busy with something else — so it is the run with the
 * most behind it that loses everything after.
 *
 * The repeat is the mechanism, not the timeout: a launcher that took the click
 * needs no second one, and a launcher that was not listening yet gets another
 * press once the main thread has gone quiet (`settleHydration`, which measures
 * the thing that is actually busy — a longer single wait would only postpone
 * the same press on a dead button).
 *
 * What it must never do is press a sheet that is already on its way in, because
 * the tab is a TOGGLE: a second press closes the panel the first one opened. And
 * the sheet is the wrong thing to ask, which is what the first version of this
 * got wrong — between the press and the `SheetContent` lies the `planner`
 * namespace's own 15 KB chunk (`planner-launcher.tsx` says so itself: "`open`
 * flips at the press; the panel is drawn when the chunk lands"), so for the whole
 * length of that fetch there is no `[data-slot="sheet-content"]` in the document
 * at all and a guard reading it would press again into a press that had landed.
 *
 * The signal for "landed" is therefore `html[data-planner-open]`, which the
 * launcher's own effect sets off `open` alone, independent of the chunk. Both
 * halves are read: the attribute for the window before the sheet exists, and
 * `data-state="open"` on the content for the one after, since a sheet on its way
 * OUT is still visible for 300 ms while carrying `closed` — which is why the
 * success is waited for on `[data-state="open"]` too and not on visibility.
 *
 * An attribute with no sheet behind it after three waits is its own diagnosis
 * and is reported as one: the press worked and the chunk never arrived, which
 * `useLazyMessages` does not retry.
 *
 * A failure is a named ❌ carrying the number of presses and what the last one
 * said; the caller then leaves its own block (`break step`) so the rest of the
 * run still executes. A success is silent and counted instead: 35 green rows
 * saying "the panel opened" would bury the assertions that are about what is IN
 * the panel, while the count printed with the balance is what says how often the
 * rule was applied at all — and how often a SECOND press earned its keep, which
 * is counted on the presses and never on the attempts: an opening that was
 * merely slow costs no press and may not inflate that figure.
 */
async function openSheet(page, where) {
  const name = `der Planer öffnet sich (${where})`;
  const launcher = page.locator(LAUNCHER).first();
  const arriving = page.locator(`${SHEET}[data-state="open"]`).first();
  const pressed = page.locator('html[data-planner-open]');

  const painted = await launcher
    .waitFor({ state: 'visible', timeout: LAUNCHER_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  if (!painted) {
    sheetOpens.failed += 1;
    check(name, false, `Launcher nach ${LAUNCHER_TIMEOUT_MS / 1000} s nicht sichtbar`);
    return false;
  }

  // Whether THIS page will get a modal sheet, which is the only case that has
  // to wait out the hydration before the first press — see the paragraph on
  // {@link settleHydration}. Asked of the browser rather than derived from the
  // viewport size, because `PLANNER_PHONE_QUERY` has a pointer term and a
  // 844x390 window on a coarse pointer answers yes at 844 px wide.
  const modal = PLANNER_PHONE_QUERY
    ? await page
        .evaluate((q) => window.matchMedia(q).matches, PLANNER_PHONE_QUERY)
        .catch(() => true)
    : true;

  let blame = '';
  let presses = 0;
  for (let attempt = 1; attempt <= SHEET_ATTEMPTS; attempt += 1) {
    const landed = (await pressed.count()) > 0 || (await arriving.count()) > 0;
    if (!landed) {
      // The first press waits only where the sheet is modal; every repeat waits
      // whatever the viewport, because there the reason is the other one — a
      // launcher painted but not yet wired. Waiting on a desktop page buys
      // nothing (the panel marks nothing outside itself, and the run reported no
      // hydration warning from one) and costs the run real time: with the wait
      // on every press the run took 1468 s, and one desktop assertion that reads
      // a URL 1500 ms after a click went red twice in a row.
      if (modal || presses > 0) await settleHydration(page);
      presses += 1;
      const failure = await launcher
        .click({ timeout: SHEET_PRESS_MS })
        .then(() => null)
        .catch((error) => String(error.message).split('\n')[0].trim().slice(0, 160));
      if (failure) blame = failure;
    }
    const open = await arriving
      .waitFor({ state: 'visible', timeout: SHEET_ARRIVE_MS })
      .then(() => true)
      .catch(() => false);
    if (open) {
      sheetOpens.opened += 1;
      if (presses > 1) {
        sheetOpens.retried += 1;
        console.log(`ℹ️  Planer erst nach ${presses} Drücken offen (${where})`);
      }
      return true;
    }
  }
  sheetOpens.failed += 1;
  if (!blame) {
    blame =
      (await pressed.count()) > 0
        ? 'der Druck sitzt (html[data-planner-open] steht), aber kein Sheet — der planner-Chunk ist nicht angekommen'
        : 'das Sheet ist nach dem Druck nicht erschienen';
  }
  check(
    name,
    false,
    `${presses} Druck${presses === 1 ? '' : 'e'}, je ${SHEET_ARRIVE_MS} ms gewartet — ${blame}`
  );
  return false;
}

/** How long a tap waits before it is reported as unreachable. */
const TAP_TIMEOUT_MS = 10_000;

/**
 * Scroll a block to a resting place where the browser says its own click point
 * is the topmost element, and answer with what it took.
 *
 * Two things this deliberately does NOT do. It does not centre in the scroller:
 * measured on the phone sheet with a block selected, the scroller is 205 px, the
 * show band takes 45 of them at the top and the action row 102 at the bottom, so
 * the free strip runs 45…103 and its middle is 74 — a 45 px block centred on the
 * scroller comes to rest at 80…125 with its lower half under the action row,
 * which is exactly the element PAR-175 reported. And it does not go looking for
 * the two bars by style or by selector: a sweep over everything `absolute` or
 * `sticky` in the sheet answered a free strip of −205 px, 53 px, 103 px and
 * −94 px on four runs of the same page, because content inside the scroller
 * touches its edges too and a sticky element's box depends on where it is
 * scrolled at the moment it is asked.
 *
 * So the question is put to the browser instead: offer the block a resting place,
 * ask `elementFromPoint` whether the point that will be clicked belongs to it,
 * and walk outwards from the middle in 6 px steps until one answers yes. That is
 * the same question Playwright's own actionability check asks, so a placement
 * this accepts is one the click accepts — and where nothing answers yes, the
 * caller gets a named ❌ instead of the 30 s timeout that used to end the run.
 *
 * Measured per call site: 1 probe on the desktop panel, 1 on the demo, 3 on the
 * phone sheet with the action row up.
 */
const placeWhereItCanBeTapped = (el, position) => {
  // `overflow-y` as well as the two heights. A clipped box (`overflow-hidden`
  // over content taller than itself) reports scrollHeight > clientHeight and
  // takes a `scrollTop` from script without ever showing the difference, so on
  // the height alone the search can stop at a clip and push the block out of its
  // own box instead of into the room the page has. None of the three surfaces
  // here has one on the path today; the condition is what keeps that true.
  const scrolls = (node) =>
    node.scrollHeight > node.clientHeight + 2 &&
    /auto|scroll|overlay/.test(getComputedStyle(node).overflowY);
  let scroller = el.parentElement;
  while (scroller && !scrolls(scroller)) scroller = scroller.parentElement;
  scroller ??= document.scrollingElement ?? document.documentElement;
  // EVERY ancestor first, the scroller itself second. `elementFromPoint` only
  // answers about the viewport, and on the planner's own page the block sits in
  // a `max-h-[680px] overflow-y-auto` box whose own top is 1857 px down the
  // article: every resting place inside it is off screen until the PAGE has
  // scrolled, so the probe below asked about nothing 110 times before the block
  // drifted into view by accident. `scrollIntoView` moves the whole chain; the
  // loop then places the block inside the box it has just brought into sight.
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  // …and the room to work in is what the scroller and the viewport SHARE. A
  // scroller taller than the window, or one hanging half off its lower edge,
  // otherwise offers a middle that cannot be looked at.
  const scrollerBox = scroller.getBoundingClientRect();
  const top = Math.max(0, scrollerBox.top);
  const bottom = Math.min(window.innerHeight, scrollerBox.bottom);
  const sc = { top, bottom, height: Math.max(0, bottom - top) };
  const limit = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  // The point the click will use: the caller's `position` where it passes one,
  // the block's middle otherwise. Freeing the middle of a block whose click
  // lands 8 px from its top proves nothing about that click. (Playwright reads
  // `position` off the padding box and this reads it off the border box, which
  // is the block's 1 px frame apart — under the 6 px the search steps in.)
  const aim = () => {
    const box = el.getBoundingClientRect();
    return position
      ? { x: box.left + position.x, y: box.top + position.y }
      : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  };
  const free = () => {
    const { x, y } = aim();
    const hit = document.elementFromPoint(Math.round(x), Math.round(y));
    return Boolean(hit && (hit === el || el.contains(hit)));
  };
  const middle = (sc.top + sc.bottom) / 2;
  const reach = Math.max(6, Math.floor((sc.height - 8) / 2));
  const offsets = [0];
  for (let away = 6; away <= reach; away += 6) offsets.push(away, -away);
  let tried = 0;
  for (const away of offsets) {
    tried += 1;
    scroller.scrollTop = Math.max(
      0,
      Math.min(limit, scroller.scrollTop + aim().y - (middle + away))
    );
    if (free()) return { free: true, tried, rest: Math.round(aim().y - sc.top) };
  }
  return { free: false, tried, rest: Math.round(aim().y - sc.top) };
};

/**
 * Tap a day block — after pulling it into the clear part of its own scroller.
 *
 * Playwright scrolls a target in before it clicks, and it scrolls the least it
 * can: a block below the scroller's box comes to rest on its bottom edge, one
 * above it on the top edge. **Both edges of this scroller are spoken for.** The
 * show band is `sticky top-0 z-40` inside it and the action row a selected block
 * raises is `absolute inset-x-0 bottom-0 z-40` over it, so the minimal scroll
 * parks the block under one of the two, the hit test finds that element instead,
 * and every retry scrolls to the same place again until the 30 s default runs
 * out — as an exception, which takes the two hundred assertions after it with it.
 *
 * Where the block comes to rest has nothing to do with the code under test. It
 * follows how tall the scroller is and where it happens to be scrolled, which
 * follows what the rest of the sheet is drawing on the day of the run — which is
 * why the same script was green at ~08:1x UTC and dead at ~08:3x on an unchanged
 * `main` (PAR-175), with the error naming the show band and the action row in
 * the same breath. Measured here against the reported state: with the action row
 * up, a plain tap fails from a scroller parked at the top, in the middle AND at
 * the bottom, and lands from all three once the block is placed itself.
 *
 * The click is then asked with a SHORT timeout and its error caught: a step that
 * cannot reach its target is a named ❌ carrying the element that intercepted
 * it and the room there was, never a stack trace.
 */
async function tapBlock(page, locator, name, options = {}) {
  const target = locator.first();
  const placement = await target
    .evaluate(placeWhereItCanBeTapped, options.position ?? null)
    .catch(() => null);
  // The scroll itself is synchronous, the sticky band's reflow after it is not.
  await page.waitForTimeout(150);
  const failure = await target
    .click({ timeout: TAP_TIMEOUT_MS, ...options })
    .then(() => null)
    .catch((error) => {
      const lines = String(error.message)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      // The interception lines name the element that is in the way, which is the
      // whole diagnosis; the first line is the fallback for every other reason a
      // click can fail (detached, disabled, not stable).
      const blame = lines.filter((line) => /intercepts pointer events/.test(line)).slice(0, 2);
      return (blame.length ? blame : lines.slice(0, 1)).join(' · ').slice(0, 200);
    });
  const room = placement
    ? `${placement.free ? 'freigeräumt' : 'keine freie Stelle'} nach ${placement.tried} ` +
      `Versuch${placement.tried === 1 ? '' : 'en'}, ${placement.rest} px unter der Kante`
    : 'nicht vermessen';
  check(name, failure === null, failure ? `${room} — ${failure}` : room);
  return failure === null;
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
  // Scoped to the JSX, which is where the undo button lives. The file has a
  // SECOND `restoreDay` now — the fit assistant's apply writes the day the
  // choice leaves before the plan is laid over it — and that one is right to
  // use the props: it is writing the day currently on screen, in the same
  // gesture the visitor is looking at. It sits above the return; the undo, the
  // one that fires later and can outlive the day it was taken for, does not.
  const jsx = source.slice(source.indexOf('\n  return ('));
  check(
    'das Rückgängig schreibt in den Tag, aus dem der Schnappschuss stammt',
    /restoreDay\(\s*shownUndo\.parkSlug,\s*shownUndo\.date,\s*shownUndo\.entries\s*\)/.test(
      source
    ) &&
      jsx.length > 0 &&
      !/restoreDay\(\s*parkSlug\s*,\s*date\s*,/.test(jsx),
    (jsx.match(/restoreDay\([^)]*\)/) ?? ['keiner'])[0]
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

// ── The wizard's fit block may not vanish while somebody is using it ─────────
//
// Reported: start unticking rides on the last step and the whole thing — levers,
// list, marks — disappears. It hung on `headlinerConflict`, so the ride that
// fixed the day also removed the screen that had just been used to fix it, with
// no way back to it. Read off the source rather than driven, for the same reason
// the undo check above is: reproducing it needs a park whose forecast happens to
// be tight on the day the run happens, and a check that silently passes because
// the day was quiet would be worse than no check.
{
  const source = readFileSync('components/planner/planner-wizard.tsx', 'utf8');
  const gate = source.match(/\{planHeadliners && [^\n]*&&[^\n]*\(\n/);
  check(
    'der Fit-Block des Assistenten hängt nicht allein am Konflikt',
    Boolean(gate) && /fitChoiceTouched/.test(gate[0]),
    (gate?.[0] ?? 'keine Bedingung gefunden').trim()
  );
  // And when it resolves it says so, in the affirmative, rather than leaving a
  // list whose marks have quietly gone out.
  const resolved = /wizard\.headliners\.resolved/.test(source);
  const green = /border-status-operating\/30 bg-status-operating\/10/.test(source);
  check(
    'und er hat einen grünen Zustand für den gelösten Tag',
    resolved && green,
    `Satz ${resolved ? 'da' : 'fehlt'}, Grün ${green ? 'da' : 'fehlt'}`
  );
}

// ── Is the backend endpoint live? ────────────────────────────────────────────
let planStatus;
try {
  planStatus = (await fetch(`${BASE}${PLAN_PATH}`)).status;
} catch (error) {
  console.error(`Could not reach ${BASE} — is the site running? (${error.message})`);
  // Nine static assertions have already run at this point, so this exit owes a
  // balance too — same reason as the guard above, one flow earlier.
  printBalance();
  await exitAfterFlush(1);
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
  printBalance();
  await exitAfterFlush(1);
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
  printBalance();
  await exitAfterFlush(1);
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

// The one open that is not inside a `step:` block, and therefore the one that
// cannot be skipped: everything down to the phone section reads THIS sheet, so
// a run without it has nothing left to measure. It ends on the balance rather
// than on a stack trace, which is the same courtesy the launcher check above
// already does one exit earlier.
const desktopOpen = await openSheet(page, 'Desktop');
const sheet = page.locator(SHEET);
check('Flyout öffnet', desktopOpen && (await sheet.isVisible()));
if (!desktopOpen) {
  console.error('\nOhne geöffnetes Panel ist der Rest nicht prüfbar.');
  await browser.close();
  printBalance();
  await exitAfterFlush(1);
}

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
  const firstBlock = page.locator('li[data-planner-block]');
  if (await firstBlock.count()) {
    await tapBlock(page, firstBlock, 'der Block lässt sich für das Abhaken auswählen');
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

    // The rail is the step counter, and it must show four marks and no footer
    // on the first step: picking a park IS the advance there, so a `Weiter`
    // button beside it is a control nobody ever presses. Four since the big
    // rides moved off the party step onto one of their own — where they all
    // fit it is a toggle, and where they do not it is the fit assistant.
    check(
      'der Assistent zeigt vier Schritte',
      (await wizard.locator('ol[aria-label] li').count()) === 4,
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

        // The park's own best-days snapshot, which is where the zone below comes
        // from — registered BEFORE the click that starts it. The wizard reads
        // `facts.timezone` when it finishes, so a fixed sleep asserts nothing
        // about the zone and everything about how warm the backend's cache is:
        // a run made while the snapshot was being recomputed took longer than
        // the three seconds of sleeps between here and the finish, and reported
        // a zone that was simply not there yet.
        const snapshot = page
          .waitForResponse(
            (response) =>
              /attractiepark-toverland\/best-days/.test(response.url()) && response.ok(),
            { timeout: 30_000 }
          )
          .then(() => true)
          .catch(() => false);
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
          // See `snapshot` above: the zone has to have ARRIVED before the wizard
          // writes the park into the plan, and waiting for it is the assertion.
          check('der Assistent hat die Tagesdaten des Parks', await snapshot);
          // A response is not yet a render: the zone travels through React
          // Query's cache into the wizard's own state, and the finish reads that
          // state rather than the network.
          await page.waitForTimeout(300);
          // On to the last step. Written as "press Weiter until it is gone"
          // rather than as a count, so a step added or removed in front of the
          // finish does not turn this block into a check that asserts a dialog
          // is open.
          for (let guard = 0; guard < 3; guard++) {
            if ((await wizard.locator('[data-planner-wizard-next]').count()) === 0) break;
            await wizard.locator('[data-planner-wizard-next]').click();
            await page.waitForTimeout(400);
          }
          check(
            'der letzte Schritt fragt nach den großen Bahnen',
            (await wizard.locator('[data-planner-wizard-finish]').count()) === 1
          );
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
// `hasTouch`, and it is the single most load-bearing option in this file.
//
// A viewport of 390×844 on its own is a MOUSE in a narrow window: measured,
// `{coarse:false, fine:true, hover:true, maxTouch:0}`. Everything in the planner
// that decides by pointer type therefore answered the desktop way here — the
// snap step, the block body's `(pointer: fine)` gate, every `hover:` style — and
// the assertions below were written against a phone that did not exist. That is
// not a hypothetical: "der Griff ist auf dem Handy treffbar" was green on `main`
// while a real coarse pointer missed the same grip by 22 px, and a drag with
// `pointerType: 'touch'` moved a block zero minutes on `main` and passed. A
// dispatched touch pointer is not the same thing as being a touch device: the
// event says touch, `matchMedia` and CSS still say mouse.
//
// `isMobile` is deliberately NOT set alongside it. It adds the mobile viewport
// meta and text autosizing, which change layout metrics — and this app's phone
// layout is Tailwind's `max-sm:` against the window, not viewport scaling, so it
// would move the numbers below without making the pointer any coarser. Coarse is
// what `hasTouch` alone already gives: `{coarse:true, fine:false, hover:false}`.
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
noteErrors(phone);
await seed(phone);

// The sheet here is MODAL, unlike the 1280 px panel above: the desktop one
// marks nothing outside itself, which is why the same open on a wide viewport
// reports no hydration error at all. The wait that the modal one needs is inside
// `openSheet` since PAR-328 — see `settleHydration` for what it buys.
if (await openSheet(phone, 'Handy, Hochformat')) {
  await phone.waitForTimeout(2500);

  // The instrument, before anything it measures. Every assertion in this pass
  // is about a phone, and a page that answers `(pointer: fine)` is not one —
  // so this asks the browser what it is rather than trusting the option above.
  // Without it the pass certifies the desktop path under a phone's name, which
  // is how the grip failure survived a green run: see the note on `hasTouch`.
  const pointer = await phone.evaluate(() => ({
    coarse: matchMedia('(pointer: coarse)').matches,
    fine: matchMedia('(pointer: fine)').matches,
    hover: matchMedia('(hover: hover)').matches,
  }));
  check(
    'die Handy-Seite ist ein Grobzeiger',
    pointer.coarse && !pointer.fine && !pointer.hover,
    `coarse ${pointer.coarse} · fine ${pointer.fine} · hover ${pointer.hover}`
  );
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

  // And he is the only way out that is drawn, which is why the line above is
  // not a formality any more. The × went off the phone sheet with PAR-188 —
  // three exits were one too many, and the one that went is the one parked in
  // the corner a thumb reaches worst — so the pair has to be asserted
  // together: no close button, AND a handle that is
  // there. Either one alone would pass over a sheet with no visible exit at
  // all, which is exactly the state at 100svh, where the modal shield sits
  // behind the sheet and tapping beside it does nothing.
  check(
    'und auf dem Handy trägt das Sheet keinen ×-Knopf mehr',
    (await phone.locator(`${SHEET} [data-slot="sheet-close"]`).count()) === 0
  );
  if (await grab.count()) {
    /**
     * How far a drag travels, and it is a DISTANCE rather than a destination.
     *
     * Both pulls used to end at an absolute y — `box.y - 80` going up and
     * `box2.y + 40` coming down — while both started at the handle's MIDDLE. So
     * the distance each covered depended on the handle's own height, in opposite
     * directions, and PR #440 grew that handle from 16 px to 44 px: the upward
     * pull silently became 102 px and the downward one 18 px, which is under the
     * 24 px `SHEET_EXPAND_PX` needs. `herunterziehen senkt sie wieder` then
     * failed for the height of the grip rather than for anything the sheet did.
     *
     * Measured from the same point, in both directions, and therefore immune to
     * the next time somebody changes that height.
     *
     * **80 sits in a window with a ceiling as well as a floor.** Going down,
     * `planner-flyout.tsx` reads three thresholds off the same gesture: under
     * `SHEET_EXPAND_PX` (24) nothing happens, over it the sheet collapses, and
     * over `SHEET_DISMISS_PX` (90) it CLOSES. A downward pull that crossed 90
     * would not fail this assertion — it would take the sheet away, and every
     * strict locator after it would reject on an empty match and end the script.
     * So the number is 24 < 80 < 90, with the narrower margin on the dismissal
     * side, and the assertion below says which end it hit rather than leaving a
     * bare number.
     */
    const DRAG_PX = 80;
    const pullFrom = async (dy) => {
      const box = await grab.boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await phone.mouse.move(x, y);
      await phone.mouse.down();
      await phone.mouse.move(x, y + dy, { steps: 8 });
      await phone.mouse.up();
      await phone.waitForTimeout(500);
    };

    const before = await sheetCap();
    await pullFrom(-DRAG_PX);
    const after = await sheetCap();
    check(
      'hochziehen hebt die Obergrenze',
      after > before + 40,
      `${before} px -> ${after} px (Weg ${DRAG_PX} px)`
    );

    // And back down, so the geometry assertions below measure the sheet in the
    // state they were written for.
    await pullFrom(DRAG_PX);
    // Before the cap is read, and not as an aside: past `SHEET_DISMISS_PX` the
    // pull closes the sheet, and `sheetCap()` would then reject on a locator
    // with nothing to match — taking the remaining two hundred assertions with
    // it. Asked as a count so the answer is a failed check with a name, not a
    // stack trace.
    const stillOpen = (await phone.locator(SHEET).count()) === 1;
    const back = stillOpen ? await sheetCap() : null;
    check(
      'herunterziehen senkt sie wieder',
      stillOpen && back === before,
      !stillOpen
        ? `der Zug von ${DRAG_PX} px hat das Sheet geschlossen — über SHEET_DISMISS_PX`
        : back === before
          ? `${back} px`
          : `${back} px statt ${before} px — Weg ${DRAG_PX} px, Schwelle SHEET_EXPAND_PX`
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

      // The grip's HEIGHT, and it is the half no earlier version of this block
      // measured. The width is a class and a bounding box; the height is a 44 px
      // `after:` pseudo-element that deliberately reaches PAST a block that can
      // legitimately be 20 px tall — so a bounding box cannot see it and the
      // only instrument is `elementFromPoint`, sampled at the two ends of the
      // 44 px the target claims.
      //
      // It failed for one word for as long as it existed: the block's own box
      // carried `overflow-hidden`, which clips a pseudo-element for hit-testing
      // as much as for paint, so the target was 44 × the block's height.
      const gripReach = await grip.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const x = Math.round(box.left + box.width / 2);
        const midY = Math.round(box.top + box.height / 2);
        const at = (y) => {
          const hit = document.elementFromPoint(x, y);
          return hit === el || Boolean(hit && el.contains(hit));
        };
        // 21 rather than 22: half of 44 minus a pixel, so the sample sits inside
        // the target rather than exactly on its edge.
        return { height: Math.round(box.height), top: at(midY - 21), bottom: at(midY + 21) };
      });
      check(
        'die Trefferfläche des Griffs ist 44 px hoch',
        gripReach.top && gripReach.bottom,
        `Blockhöhe ${gripReach.height} px · oben ${gripReach.top ? 'ja' : 'nein'} · unten ${
          gripReach.bottom ? 'ja' : 'nein'
        }`
      );

      // And the gesture itself, with a TOUCH pointer. Every drag assertion in
      // this file before this one ran on `pointerType: 'mouse'`, which is the
      // reason a phone-only failure could sit in the panel through a green run:
      // the block's body gates itself on `(pointer: fine)` and the grip does
      // not, so a mouse pass exercises a path a finger never takes.
      // BY ID, never by position: the store keeps a day's entries sorted by
      // start minute, so a drag that moves a block past its neighbour also moves
      // it in the array and `entries[0]` would then be a different block.
      const entryId = await phoneBlocks.first().getAttribute('data-planner-entry');
      const startOf = (id) =>
        phone.evaluate((wanted) => {
          const plan = JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}');
          const days = plan?.parks?.phantasialand?.days ?? {};
          for (const day of Object.values(days)) {
            const hit = (day?.entries ?? []).find((e) => e.id === wanted);
            if (hit) return hit.startMinute;
          }
          return null;
        }, id);
      const startBefore = await startOf(entryId);
      await grip.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const opts = {
          bubbles: true,
          button: 0,
          pointerId: 7,
          pointerType: 'touch',
          isPrimary: true,
        };
        el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, clientX: x, clientY: y }));
        // Two moves and 90 px, which is more than one coarse snap step at either
        // scale — a gesture shorter than half a step commits nothing, correctly,
        // and would make this assertion measure the step rather than the drag.
        for (const dy of [45, 90]) {
          el.dispatchEvent(
            new PointerEvent('pointermove', { ...opts, clientX: x, clientY: y + dy })
          );
        }
        el.dispatchEvent(new PointerEvent('pointerup', { ...opts, clientX: x, clientY: y + 90 }));
      });
      // Two animation frames plus the store's write: the drag reads its target
      // in a rAF loop, so the value is not there on the next tick.
      await phone.waitForTimeout(600);
      const startAfter = await startOf(entryId);
      check(
        'ein Finger verschiebt den Block',
        startBefore !== null && startAfter !== null && startAfter !== startBefore,
        `${startBefore} -> ${startAfter}`
      );

      // The gesture-free way. It exists because the one above depends on a
      // gesture landing on a 44 px strip of a box whose height is a queue, and a
      // plan may not depend on that. Selecting is a plain tap on the block, which
      // is what docks the action row.
      await tapBlock(
        phone,
        phone.locator(`li[data-planner-entry="${entryId}"]`),
        'der Block nimmt einen einfachen Tap an'
      );
      await phone.waitForTimeout(300);
      const nudge = phone.locator(`${SHEET} button[aria-label="15 Min. später"]`);
      check('die Aktionsleiste bietet einen Verschieben-Knopf', (await nudge.count()) > 0);
      if ((await nudge.count()) > 0) {
        const box = await nudge.first().boundingBox();
        check(
          'der Verschieben-Knopf hält die Touch-Höhe',
          Math.round(box?.height ?? 0) >= 44,
          `${Math.round(box?.height ?? 0)} px`
        );
        const before = await startOf(entryId);
        await nudge.first().click();
        await phone.waitForTimeout(400);
        const after = await startOf(entryId);
        check(
          'und verschiebt um eine Viertelstunde',
          before !== null && after === before + 15,
          `${before} -> ${after}`
        );
      }
    }

    // What is left for the day after the chrome has taken its share. The
    // report this work started from read "von der Achse bleibt etwa eine
    // Stunde übrig", and the arithmetic behind it is in
    // `planner-day-column.tsx`: 467 px of a 716 px sheet were chrome.
    const room = await phone.evaluate((sel) => {
      const sheet = document.querySelector(sel);
      const grid = sheet?.querySelector('[data-planner-grid]');
      const scroller = grid?.closest('.overflow-y-auto');
      if (!sheet || !scroller) return null;
      return {
        sheet: Math.round(sheet.getBoundingClientRect().height),
        axis: Math.round(scroller.getBoundingClientRect().height),
      };
    }, SHEET);
    if (room) {
      check(
        'die Achse bekommt ihren Boden',
        room.axis >= 200,
        `Achse ${room.axis} px in einem ${room.sheet} px hohen Sheet · Chrome ${
          room.sheet - room.axis
        } px`
      );
    } else {
      check('die Achse bekommt ihren Boden', false, 'keine Achse gefunden');
    }

    // ── The 44 px floor, swept rather than listed ────────────────────────────
    //
    // Etappe 4 of PF-86 named seven controls and raised all seven; the sight
    // check then found SEVENTEEN more in the same sheet, which is the argument
    // for a sweep and against a list. A list only ever knows about the controls
    // somebody thought of.
    //
    // Two rules decide what counts, and both were mis-read by the hand count
    // that produced those seventeen:
    //
    //  * A CHECKBOX INSIDE A LABEL IS NOT A TARGET. The label is — that is what
    //    a label is for — so the input is skipped and the label measured in its
    //    place. Nineteen 16×16 boxes were reported in the fit assistant whose
    //    rows are 64 px tall and entirely clickable.
    //  * A BOUNDING BOX IS NOT A TARGET EITHER. The grip, the resize edge, the
    //    sheet handle and the party chip all keep a small box on purpose and
    //    carry a 44 px `after:` pseudo-element, which `getBoundingClientRect`
    //    cannot see. So the height is walked with `elementFromPoint` outward
    //    from the control's own centre, exactly like the grip probe above.
    //
    // A control that is not hittable at its own centre is skipped rather than
    // failed: it is scrolled out of its container or covered, which is a
    // different defect and gets its own named check (see „das letzte
    // Bedienelement der Kopfzeile" below, which is the one this sweep would
    // otherwise have swallowed).
    //
    // **And one exception, which `planner-block.tsx` asked for by name**
    // (PAR-313): a control ANCHORED TO A BLOCK'S OWN EDGE is capped at that
    // block's room rather than at 44 px, because a block's height is a queue
    // and may not grow to fit a target. The resize edge has held that cap since
    // PAR-165 — `h-[min(2.75rem,var(--pl-edge-room))]` — and its comment says
    // outright that whoever adds a second one teaches this sweep the exception
    // instead of lifting the cap. The ✕ that moved onto the card is the second
    // one. So a target inside `[data-planner-block]` passes at
    // `min(44, the block's room)` and fails at anything under it: a 45 px block
    // owes its ✕ 43 px, which is every pixel it has, and a 200 px block still
    // owes it 44. Written as the block's own box less its two border pixels,
    // which is what `--pl-edge-room` is.
    const sweepSmallTargets = (sel) =>
      phone.evaluate((sheetSelector) => {
        // Radix portals every popover and dialog to `<body>`, so a sweep of the
        // sheet's own subtree is blind to the park list and to the day picker's
        // calendar — the two lists the sheet's biggest buttons OPEN, and a door
        // at 44 px onto 28 px rows is half a fix. Whatever popper is up at the
        // time is swept along with the sheet.
        // `null` sweeps the poppers ALONE — used where a popover has just been
        // opened and the sheet behind it was already measured on its own pass.
        const sheet = sheetSelector ? document.querySelector(sheetSelector) : null;
        const roots = [
          ...(sheet ? [sheet] : []),
          ...document.querySelectorAll('[data-radix-popper-content-wrapper]'),
        ];
        if (roots.length === 0) return null;
        const FLOOR = 44;
        const REACH = 30; // Half of 44 is 22; 30 leaves room to see an oversized one.
        const hits = (el, x, y) => {
          const hit = document.elementFromPoint(x, y);
          if (!hit) return false;
          return hit === el || el.contains(hit) || hit.closest('button, label, a[href]') === el;
        };
        const rows = [];
        const nodes = roots.flatMap((root) => [
          ...root.querySelectorAll(
            'button, [role="button"], a[href], summary, label, select, input[type="checkbox"], input[type="radio"]'
          ),
        ]);
        for (const el of nodes) {
          if (el.matches('input, select') && el.closest('label')) continue;
          if (el.matches('label') && !el.querySelector('input, select, textarea') && !el.htmlFor) {
            continue;
          }
          if (el.hasAttribute('aria-hidden') || el.closest('[aria-hidden="true"]')) continue;
          const box = el.getBoundingClientRect();
          if (box.width < 1 || box.height < 1) continue;
          const x = Math.round(box.left + box.width / 2);
          if (!hits(el, x, Math.round(box.top + box.height / 2))) continue;
          // Walked from the BOX EDGES outward and added to the box's own
          // height, never counted outward from a rounded centre: a control
          // whose top lands on .5 would otherwise measure 43 and fail for
          // arithmetic.
          //
          // Both walks start on the first row that is OUTSIDE the box, and
          // `ceil` is what makes that true at either end. `floor(bottom)` is
          // still inside a box that ends on .4, so it counted one row of the
          // control as if it were overhang — which is a floor that passes a
          // 43 px control, i.e. the one number this check exists to refuse.
          let up = 0;
          const firstAbove = Math.ceil(box.top) - 1;
          while (up < REACH && hits(el, x, firstAbove - up)) up += 1;
          let down = 0;
          const firstBelow = Math.ceil(box.bottom);
          while (down < REACH && hits(el, x, firstBelow + down)) down += 1;
          const reach = Math.round(box.height) + up + down;
          // The exception, and it is OPTED INTO rather than inferred from the
          // ancestor. Keying it on `closest('[data-planner-block]')` would
          // excuse the grip too — which also lives in a block, also overhangs,
          // and is the one target in here that reaches its 44 px on every block
          // whatever the block's height. `data-planner-block-edge` is carried by
          // the two controls anchored to an EDGE, and only they trade the floor
          // for the block's room. `BLOCK_BORDER_PX` is 2 in
          // `planner-block.tsx`, the same two pixels `--pl-edge-room` subtracts.
          const block = el.hasAttribute('data-planner-block-edge')
            ? el.closest('[data-planner-block]')
            : null;
          const room = block
            ? Math.max(0, Math.round(block.getBoundingClientRect().height) - 2)
            : null;
          const floor = room === null ? FLOOR : Math.min(FLOOR, room);
          if (reach < floor) {
            rows.push({
              reach,
              floor,
              box: `${Math.round(box.width)}x${Math.round(box.height)}`,
              name: (
                el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                el.textContent ||
                el.tagName
              )
                .trim()
                .replace(/\s+/g, ' ')
                .slice(0, 40),
            });
          }
        }
        return rows;
      }, sel);
    const reportSweep = (label, rows) => {
      if (rows === null) {
        check(label, false, 'nichts zu messen');
        return;
      }
      check(
        label,
        rows.length === 0,
        rows.length === 0
          ? 'alle geprüften Ziele ≥ 44 px'
          : rows
              .map(
                (row) =>
                  `${row.reach} px „${row.name}" (Box ${row.box}${
                    row.floor === 44 ? '' : `, nötig ${row.floor} — die Höhe des Blocks`
                  })`
              )
              .join(' · ')
      );
    };
    reportSweep('jedes Ziel im Sheet ist 44 px hoch', await sweepSmallTargets(SHEET));

    // The one the sweep cannot see, and it is a real bug rather than a
    // measurement: `SheetContent` USED TO draw its close button `max-sm:size-11`
    // at `right-2`, covering the rightmost 52 px of the header while the
    // header's own content stopped 40 px from that edge. "Einen Tag planen" sat
    // 12 px under the ×, which reads from the outside as a button that opens
    // the wrong thing. Asked of Playwright, because "receives events" is the
    // question and `click({ trial: true })` names the intercepting element when
    // the answer is no.
    //
    // The × is gone from this sheet (PAR-188) and the assertion is not: what it
    // guards is that the rightmost control of the header takes a press, and the
    // next thing to cover it will not be a close button. So it is NAMED after
    // the press rather than after the one element that used to swallow it — a
    // name that points at something the phone no longer renders sends the next
    // reader of a red line looking for the wrong culprit.
    //
    // It asks for the control that is LAST in that row rather than for one by
    // name, and that is the lesson of PAR-163 rather than a tidy-up: the
    // assertion named „einen Tag planen", the phone lost that button when the
    // head moved into this header, and `if (await count())` then turned a
    // passing check into no check at all — silently, in the one place where
    // something else had just taken its place at the edge. What is measured is
    // the RIGHTMOST control in the header, whatever it is today.
    const lastInHeader = await phone.evaluate((sel) => {
      const header = document.querySelector(`${sel} [data-slot="sheet-header"]`);
      if (!header) return null;
      // `!disabled` as well as visible: a disabled control cannot receive the
      // press this assertion is about, so a trial click on one times out and
      // reports the overlap defect over a button that is merely off today —
      // the day picker's `›` is exactly that at the best-days horizon (G-56).
      const controls = [...header.querySelectorAll('button')].filter(
        (el) => el.getBoundingClientRect().width > 0 && !el.disabled
      );
      if (controls.length === 0) return null;
      const last = controls.reduce((a, b) =>
        b.getBoundingClientRect().right > a.getBoundingClientRect().right ? b : a
      );
      last.setAttribute('data-check-last-in-header', '');
      // A name for the report, from whatever the element already carries.
      const attr = [...last.attributes].find((a) => a.name.startsWith('data-planner'));
      return attr?.name ?? last.getAttribute('aria-label') ?? last.tagName;
    }, SHEET);
    if (lastInHeader) {
      const free = await phone
        .locator(`${SHEET} [data-check-last-in-header]`)
        .first()
        .click({ trial: true, timeout: 5_000 })
        .then(() => 'erreichbar')
        .catch((error) => String(error.message).split('\n')[0].slice(0, 120));
      check(
        'das letzte Bedienelement der Kopfzeile nimmt einen Druck an',
        free === 'erreichbar',
        `${lastInHeader} — ${free}`
      );
      await phone.evaluate(
        (sel) =>
          document
            .querySelector(`${sel} [data-check-last-in-header]`)
            ?.removeAttribute('data-check-last-in-header'),
        SHEET
      );
    } else {
      check(
        'das letzte Bedienelement der Kopfzeile nimmt einen Druck an',
        false,
        'keine Kopfzeile gefunden'
      );
    }

    // ONE row of chrome above the axis, not two. The panel's header and the
    // column's own head each took 45 px of a 776 px sheet to say two halves of
    // one thing — which park, which day, and the word „Tagesplaner" over both —
    // while the axis under them had 211. The head is drawn inside the header on
    // a phone now (`withHead`), and this asserts it is the SAME element moved
    // rather than a second copy: two would be two of every
    // `[data-planner-column-park]` for the sweep above to pick the wrong one of.
    const heads = await phone.locator(`${SHEET} [data-planner-column-head]`).count();
    check(
      'auf dem Telefon steht der Spaltenkopf in der Kopfzeile des Sheets',
      heads === 1 &&
        (await phone.evaluate((sel) => {
          const sheet = document.querySelector(sel);
          const header = sheet?.querySelector('[data-slot="sheet-header"]');
          const head = sheet?.querySelector('[data-planner-column-head]');
          return Boolean(header && head && header.contains(head));
        }, SHEET)),
      `${heads} Kopfzeile(n)`
    );

    // And the two lists the head's own buttons open, each swept while it is
    // actually up — a popover that is shut is a popover with no DOM, so the
    // sweep above passes over the park list and the month calendar without
    // seeing either. LAST in this pass and closed again with Escape, so a
    // popper left standing cannot intercept anything measured before it.
    //
    // The third entry is what counts as a ROW of each list, and it is named
    // rather than derived: „the first enabled button in the popover" picked
    // the park list's „Anderen Park planen" footer (outside the `<ul>`) and
    // the calendar's „Vorheriger Monat" chevron — the run said so itself,
    // „Vorheriger Monat" von 37. Neither is a row of the thing being tested.
    for (const [label, opener, row] of [
      ['die Parkliste ist antippbar', '[data-planner-column-park]', 'li button'],
      ['der Monatskalender ist antippbar', '[data-planner-day-trigger]', '[data-planner-day]'],
    ]) {
      const trigger = phone.locator(`${SHEET} ${opener}`).first();
      // A missing trigger FAILS rather than skipping the pair of assertions
      // under it. This pass seeds a plan with a park and a date, so both of
      // these controls have to exist — the day picker's `{date && …}` is
      // satisfied by construction here — and „the button is gone" is the
      // loudest version of „the list is not tappable", not an excuse to stop
      // asking. It is the same pass-by-omission the two checks below were
      // rewritten to drop; leaving it here would have kept it one level up.
      const reachName = `${label.replace(' ist antippbar', '')} nimmt den Druck an`;
      if (!(await trigger.count())) {
        check(label, false, `${opener} nicht gefunden`);
        check(reachName, false, 'kein Trigger, also kein Popover');
        continue;
      }
      const opened = await trigger
        .click({ timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (!opened) {
        check(label, false, 'ließ sich nicht öffnen');
        check(reachName, false, 'Popover ließ sich nicht öffnen');
        continue;
      }
      await phone.waitForTimeout(400);
      // Only what the popper itself carries: the sheet behind it was measured
      // on its own pass, and reporting it twice would say a fixed thing twice.
      reportSweep(label, await sweepSmallTargets(null));
      // …and a row of it actually RECEIVES the press, which is a different
      // question from how big it is and is the one that was missing. The park
      // list carried `PopoverContent`'s own `z-50` into a sheet at `z-[70]`, so
      // it opened behind the panel's frosted glass: every row had a box of the
      // right size, `elementFromPoint` over them answered with the sheet, and
      // the sweep above passed. A target that cannot be hit is exactly the
      // failure this pass exists to catch, so it is asked of Playwright —
      // `trial: true` names the intercepting element on a no.
      //
      // The panel is resolved through the trigger's OWN `aria-controls`, not
      // by taking a `[data-radix-popper-content-wrapper]` off the document:
      // a popper the previous iteration left standing would answer that
      // selector just as well, and this assertion must not depend on the
      // Escape below having worked.
      //
      // And it presses the first ENABLED ROW, `row` above — a park in the
      // `<ul>`, a cell of the date grid. Two corrections live in that
      // sentence. Taking the LAST match hit „Anderen Park planen" and the
      // last matrix cell, which is `disabled` past the best-days horizon: red
      // on a date rather than on a defect (G-56). Taking the first enabled
      // BUTTON then hit the calendar's „Vorheriger Monat" chevron, which is in
      // the popover but is not a row of the list under test. Measured: park
      // list 3 buttons of which 1 is the footer; calendar 37 buttons, 24
      // enabled, 13 that a trial click would have hung on.
      //
      // No `if (count())` around the `check`, which is the pattern this whole
      // block is a correction of: an empty popover fails the assertion rather
      // than removing it.
      const pressable = await phone.evaluate(
        ([sel, opener, rowSelector]) => {
          const trigger = document.querySelector(`${sel} ${opener}`);
          const panel = trigger?.getAttribute('aria-controls');
          const content = panel ? document.getElementById(panel) : null;
          if (!content) return null;
          const buttons = [...content.querySelectorAll(rowSelector)];
          const target = buttons.find((el) => !el.disabled);
          if (!target) return { total: buttons.length, name: null };
          target.setAttribute('data-check-popover-row', '');
          return {
            total: buttons.length,
            name:
              target.textContent?.trim().replace(/\s+/g, ' ').slice(0, 30) ||
              target.getAttribute('aria-label') ||
              '(ohne Text)',
          };
        },
        [SHEET, opener, row]
      );
      const reaches = pressable?.name
        ? await phone
            .locator('[data-check-popover-row]')
            .first()
            .click({ trial: true, timeout: 5_000 })
            .then(() => 'erreichbar')
            .catch((error) => String(error.message).split('\n')[0].slice(0, 120))
        : 'kein bedienbarer Eintrag im geöffneten Popover';
      check(
        reachName,
        reaches === 'erreichbar',
        `„${pressable?.name ?? '—'}" von ${pressable?.total ?? 0} — ${reaches}`
      );
      await phone.evaluate(() =>
        document
          .querySelector('[data-check-popover-row]')
          ?.removeAttribute('data-check-popover-row')
      );
      await phone.keyboard.press('Escape');
      await phone.waitForTimeout(300);
    }
  } else {
    // No opening hours (which is what a 404 leaves), so the grid cannot draw and
    // the flat list is the honest fallback. It carries no grip by design: with
    // no axis there is no time to drag onto.
    const fallbackRows = await phone.locator('li[data-planner-entry]').count();
    check('ohne Achse rendert die Liste', fallbackRows > 0, `Zeilen: ${fallbackRows}`);
  }
} else {
  check('mobil als Bottom-Sheet', false, 'Panel nicht geöffnet');
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
// that is OPERATING *and* not in the past — `park-calendar-day-detail.tsx`:
//
//     {planner && day.status === 'OPERATING' && day.date >= todayInPark && (
//
// So the candidates are picked to match that condition instead of being taken
// off the top of the grid. Taking the first eight cells was the same assertion
// for the first eight DAYS of the month, which is green until the 8th and red
// from the 9th on, every month, without a line of the app changing.
//
// Both halves of that condition are read off the page: the „Heute"-pill for
// "not in the past", and the `aria-label` — `"<Wochentag> <Tag>. <Monat> —
// <Status>…"` — for „Geschlossen". The label carries only as much of the
// OPERATING half as it can: `park-calendar-day.tsx` prints the CROWD LEVEL
// there, not the status, so an `UNKNOWN` day and an OPERATING day with no
// forecast both read „Keine Prognose" and the label cannot separate them. That
// is why this stays a loop over several candidates rather than a pick of the
// first one — an `UNKNOWN` day among them costs a click, not the assertion.
const cells = cal.locator('[role="button"][tabindex="0"][aria-label*="—"]');
const planButton = cal.getByRole('button', { name: 'Bahnen für diesen Tag einplanen' });

/**
 * The open days of the rendered month that are not in the past, in grid order.
 *
 * "Not in the past" is read off the page rather than counted here, and the
 * instrument is the „Heute"-pill `park-calendar-day.tsx` prints in exactly one
 * cell. A day number compared against `parkDay(0)` would be a number from one
 * calendar held against a month from another: the hub passes `month={null}`, so
 * `park-calendar-grid.tsx` builds `currentMonth` from the BROWSER's `new Date()`
 * while the pill comes from a `todayStr` formatted in the PARK's zone. They
 * agree on this host and would not have to — and a bare day-of-month cannot
 * tell the two apart, which is the same trap `parkDay` above was written for.
 *
 * Everything from the pill onward is a candidate except „Geschlossen".
 */
async function openDaysFromToday() {
  const cellInfo = await cells.evaluateAll((nodes) =>
    nodes.map((node) => ({
      label: node.getAttribute('aria-label') ?? '',
      // The pill's own element, by its exact text. Searching the cell's
      // `textContent` for it does not work and fails QUIETLY: the cell reads
      // `12Heute55MinHoch09:00–18:00…`, so `\bHeute\b` finds no word boundary on
      // either side, the day looks absent, and the run steps to the next month
      // and passes there — green, for the wrong month.
      today: [...node.querySelectorAll('span')].some(
        (span) => (span.textContent ?? '').trim() === 'Heute'
      ),
    }))
  );
  const todayIndex = cellInfo.findIndex((cell) => cell.today);
  return {
    count: cellInfo.length,
    todayIndex,
    candidates:
      todayIndex === -1
        ? []
        : cellInfo
            .map((cell, index) => ({ ...cell, index }))
            .filter((cell) => cell.index >= todayIndex && !/—\s*Geschlossen/.test(cell.label)),
  };
}

let month = await openDaysFromToday();
// One step forward if the rendered month has nothing to offer — the 31st with
// the park closed on it, or a winter month the park sits out entirely. Without
// it this check is red on a DATE rather than on a change, which is the whole
// failure mode it was rewritten to stop having.
let stepped = false;
if (month.candidates.length === 0) {
  const next = cal.getByRole('link', { name: 'Nächster Monat' });
  if (await next.count()) {
    // The first cell's label BEFORE the step, so the wait below has something
    // to compare against.
    const firstBefore =
      (await cells
        .first()
        .getAttribute('aria-label')
        .catch(() => null)) ?? '';
    await next.first().click();
    // A real route navigation with `keepPreviousData` behind it: for a moment
    // the grid still holds the old month, and a beat later it holds none at all
    // while the new one loads. `evaluateAll` does not auto-wait, so a fixed
    // timeout here reads whichever of the three states it happens to land in —
    // most likely zero cells, and the check fails for the wait rather than for
    // the calendar. Waits for a grid that is both populated AND different.
    await cal
      .waitForFunction(
        ([selector, before]) => {
          const nodes = document.querySelectorAll(selector);
          return nodes.length > 0 && (nodes[0].getAttribute('aria-label') ?? '') !== before;
        },
        ['[role="button"][tabindex="0"][aria-label*="—"]', firstBefore],
        { timeout: 20_000 }
      )
      .catch(() => {});
    await cal.waitForTimeout(1200);
    // The pill only lives in today's month, so from here the whole month counts.
    const after = await cells.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('aria-label') ?? '')
    );
    month = {
      count: after.length,
      todayIndex: 0,
      candidates: after
        .map((label, index) => ({ label, index }))
        .filter((cell) => !/—\s*Geschlossen/.test(cell.label)),
    };
    stepped = true;
  }
}

let reachable = false;
for (const cell of month.candidates.slice(0, 8)) {
  if (reachable) break;
  await cells.nth(cell.index).click();
  await cal.waitForTimeout(1200);
  reachable = (await planButton.count()) > 0;
  if (!reachable) await cal.keyboard.press('Escape');
}
const where = stepped ? 'im Folgemonat' : `ab „Heute" (Zelle ${month.todayIndex + 1})`;
check(
  '„Bahnen für diesen Tag einplanen" im Kalendertag',
  reachable,
  reachable
    ? `Zellen: ${month.count}, geprüft ${where}`
    : month.candidates.length === 0
      ? `kein offener Tag ${where} unter ${month.count} Zellen — auch der Folgemonat half nicht`
      : `${Math.min(month.candidates.length, 8)} offene Tage ${where} angeklickt, keiner trug den Knopf (von ${month.count} Zellen)`
);

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
step: {
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
  if (!(await openSheet(grid, 'gestubbtes Raster'))) {
    await grid.close();
    break step;
  }
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

    // …und keiner ihrer Chips wird vom Block darunter angeschnitten. Der Chip
    // liegt auf `zIndex: 5` und die Blöcke auf 10, also verdeckt ein Block sauber,
    // was übersteht — auf dem Schirm ist das ein halber Satz ohne Unterlängen und
    // in keiner Zusicherung (PAR-180).
    //
    // Dafür muss der enge Fall erst hergestellt werden, sonst ist die Prüfung
    // grün gegen genau den Fehler, für den sie geschrieben ist: bei 10:00 und
    // 12:30 liegen 105 Minuten zwischen den beiden, und in so eine Lücke passt
    // jede Pille. F.L.Y. rückt also bis dicht hinter Taron — 11:00 gegen eine
    // Schlange, die um 10:45 endet, eine Lücke von einer Rastereinheit. Dass sie
    // wirklich eng ist, prüft die erste Zusicherung: ohne sie wäre die zweite
    // wieder nur eine Aussage über eine Fixture.
    await flyRange.fill('660');
    await grid.waitForTimeout(400);
    const chipRoom = await grid.evaluate(() => {
      const blocks = [...document.querySelectorAll('li[data-planner-block]')].map((el) =>
        el.getBoundingClientRect()
      );
      return [...document.querySelectorAll('li[data-planner-leg]')].flatMap((leg) => {
        const chip = leg.querySelector('[data-planner-leg-chip], button[title]');
        if (!chip) return [];
        const c = chip.getBoundingClientRect();
        const mid = (c.top + c.bottom) / 2;
        let above = null;
        let below = null;
        let clipped = 0;
        for (const b of blocks) {
          if (b.left >= c.right - 1 || b.right <= c.left + 1) continue;
          if (b.bottom <= mid && (above === null || b.bottom > above)) above = b.bottom;
          if (b.top >= mid && (below === null || b.top < below)) below = b.top;
          clipped = Math.max(clipped, Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top));
        }
        return [
          {
            verdict: leg.dataset.verdict,
            // `full` / `compact` on the informational chip, `null` on the repair
            // button — which keeps its size by design and is therefore not part
            // of the height assertion below.
            kind: chip.dataset.plannerLegChip ?? null,
            height: c.height,
            room: above !== null && below !== null ? below - above : null,
            clipped,
          },
        ];
      });
    });
    await flyRange.fill('750');
    await grid.waitForTimeout(400);

    const tightChips = chipRoom.filter((c) => c.room !== null && c.room < LEG_CHIP_PX);
    check(
      'der enge Fall ist hergestellt',
      tightChips.length >= 1,
      chipRoom.map((c) => `${c.verdict} ${c.room?.toFixed(0)}px`).join(', ')
    );
    const clippedChips = chipRoom.filter((c) => c.clipped > 0.5);
    check(
      'kein Bein-Chip wird von einem Block angeschnitten',
      clippedChips.length === 0,
      clippedChips.map((c) => `${c.verdict}: ${c.clipped.toFixed(1)}px`).join('; ')
    );
    // Und die beiden Konstanten sind wirklich die gerenderten Höhen. Ein Unit-Test
    // kann das nicht: er sieht kein Stylesheet, und `LEG_CHIP_COMPACT_PX === 12`
    // gegen sich selbst zu prüfen ist eine Tautologie. Hier steht der Browser
    // daneben, also fällt ein geändertes `py-0.5` oder `leading-[12px]` auf,
    // statt still die Doku zu widerlegen, die „gemessen statt getippt" behauptet.
    const wrongHeight = chipRoom.filter(
      (c) =>
        c.kind !== null &&
        Math.abs(c.height - (c.kind === 'compact' ? LEG_CHIP_COMPACT_PX : LEG_CHIP_PX)) > 0.5
    );
    check(
      'die Pillenhöhen sind die, die leg-chip.ts nennt',
      wrongHeight.length === 0,
      chipRoom.map((c) => `${c.kind} ${c.height.toFixed(1)}px`).join(', ')
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
    await tapBlock(grid, blocks, 'der Block nimmt einen Klick auf seinen Rumpf an', {
      position: { x: 80, y: 8 },
    });
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
step: {
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
  if (!(await openSheet(hl, 'fehlender Headliner'))) {
    await hl.close();
    break step;
  }
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
step: {
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
  if (!(await openSheet(cpu, 'CPU, erster Aufbau'))) {
    await cpu.close();
    break step;
  }
  await cpu.waitForTimeout(2500);
  await cpu.keyboard.press('Escape');
  await cpu.locator(SHEET).waitFor({ state: 'hidden', timeout: 10_000 });
  await cpu.waitForTimeout(1500);
  const beforeOpen = await liveMinuteClocks();

  if (!(await openSheet(cpu, 'CPU, zweiter Aufbau'))) {
    await cpu.close();
    break step;
  }
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
step: {
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
  if (!(await openSheet(drag, 'Drag von der Parkseite'))) {
    await drag.close();
    break step;
  }
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
step: {
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
    if (!(await openSheet(acc, 'Herkunft der Zahl'))) return false;
    await acc.waitForTimeout(2200);
    return true;
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
  if (!(await reload())) {
    await acc.close();
    break step;
  }

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
  if (!(await reload())) {
    await acc.close();
    break step;
  }
  band = await bandText();
  // The hours themselves are asserted with it: without them this passed on the
  // suffix alone, over a chip reading "undefined bis undefined Uhr".
  check('abgeleitete Zeiten sagen es', /09 bis 18 Uhr \(gemessen\)/.test(band), band.slice(0, 120));

  // Nobody has ever checked how wrong the forecast is this far out.
  body = dayBody({ tier: 'composed', accuracy: { basis: 'unmeasured' } });
  if (!(await reload())) {
    await acc.close();
    break step;
  }
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
  if (!(await reload())) {
    await acc.close();
    break step;
  }
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
    if (!(await openSheet(page, `leerer Tag, ${width} px`))) {
      await page.close();
      return null;
    }
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

  emptyDesk: {
    const desk = await openEmptyDay(1400);
    if (!desk) break emptyDesk;
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
    // The other half of the phone pass's „kein ×-Knopf mehr". `hideClose` is
    // opt-in per call site and keyed on `isPhone`, so the side panel has to be
    // asked separately — it has no grab handle, and its outside press is
    // deliberately swallowed, so losing the × here would leave Escape as the
    // only way out of a panel that is not modal.
    check(
      'am Rechner behält das Panel seinen ×-Knopf',
      (await desk.locator(`${SHEET} [data-slot="sheet-close"]`).count()) === 1
    );
    await desk.close();
  }

  emptyPhone: {
    const phone = await openEmptyDay(390);
    if (!phone) break emptyPhone;
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
    if (!(await openSheet(bare, `ohne Plan, ${width} px`))) {
      await bare.close();
      continue;
    }
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
step: {
  const shot = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  noteErrors(shot);
  await seed(shot);
  await shot.goto(`${BASE}/de/parks/europe/germany/bruehl/phantasialand`, {
    waitUntil: 'networkidle',
  });
  if (!(await openSheet(shot, 'Chrome über dem Foto'))) {
    await shot.close();
    break step;
  }
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
step: {
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

  // Registered on two pages — this one and the phone at the end of the block —
  // so the strip's phone behaviour is asserted against the same five shows
  // rather than against whatever the day happens to hold.
  const stubShows = async (page) =>
    page.route('**/api/parks/**', async (route) => {
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

  await stubShows(shows);

  /** The same one-block Phantasialand day both pages in this block run on. */
  const seedDay = (page) =>
    page.evaluate(
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
        window.localStorage.removeItem('parkfan_planner_shows');
        window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
      },
      [PLAN, todayInPark]
    );

  await shows.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await seedDay(shows);
  await shows.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  if (!(await openSheet(shows, 'Shows am Rechner'))) {
    await shows.close();
    break step;
  }
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

  // The switch says something different on each screen, and only the phone's
  // half is a geometry claim: there the strip IS what is short, so switching the
  // shows off has to give the axis its row back rather than swap the sentence in
  // it. The desktop above keeps its strip in both states, which the two
  // assertions before this one already read off the same element.
  //
  // Asserted on the same stubbed five shows as the desktop, because the strip
  // only collapses where there is a switch on it: over a park the API answered
  // with no shows the strip reads „keine Spielzeiten", carries no switch, and
  // must not collapse — a page without the stub would take that branch and grade
  // nothing (📚 G-72).
  {
    const phoneShows = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    noteErrors(phoneShows);
    await stubShows(phoneShows);
    await phoneShows.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await seedDay(phoneShows);
    await phoneShows.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
    if (!(await openSheet(phoneShows, 'Shows auf dem Handy'))) {
      await phoneShows.close();
      await shows.close();
      break step;
    }
    await phoneShows.waitForTimeout(2500);

    const bandHeight = () =>
      phoneShows
        .locator(`${SHEET} [data-planner-show-band]`)
        .evaluate((el) => Math.round(el.getBoundingClientRect().height));
    const phoneToggle = phoneShows.locator(`${SHEET} [data-planner-shows-toggle]`);

    // The anchor the collapse is measured against: without it a strip that never
    // rendered would pass the assertion below for the wrong reason.
    const shownHeight = await bandHeight();
    check(
      'auf dem Telefon steht der Streifen, solange die Shows an sind',
      shownHeight >= 40,
      `${shownHeight} px`
    );

    await phoneToggle.click();
    await phoneShows.waitForTimeout(500);
    const hiddenHeight = await bandHeight();
    check(
      'ausgeblendet gibt der Streifen dem Telefon seine Zeile zurück',
      hiddenHeight === 0,
      `${shownHeight} px → ${hiddenHeight} px`
    );

    // The corner it claims in exchange. Collapsed, the switch is the only thing
    // left of the strip and it hangs over the grid's own blocks, so the trade is
    // 44 × 44 of cover against the 45 px × full width it gave up — worth pinning
    // as a box AND as ownership, because a control that is drawn there and does
    // not answer there is the worse half of both states.
    const corner = await phoneShows
      .locator(`${SHEET} [data-planner-shows-toggle]`)
      .evaluate((el) => {
        const box = el.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return { w: Math.round(box.width), h: Math.round(box.height), owns: el.contains(hit) };
      });
    check(
      'der freistehende Schalter ist 44 px groß und gehört ihm auch',
      corner.w === 44 && corner.h === 44 && corner.owns,
      `${corner.w}×${corner.h}, Mitte ${corner.owns ? 'trifft ihn' : 'trifft etwas anderes'}`
    );

    // The way back. A `click()` fails on a control something else intercepts, so
    // this is also the assertion that the freestanding switch is reachable where
    // it hangs over the grid.
    check(
      'und der Schalter bleibt der einzige und ist antippbar',
      (await phoneToggle.count()) === 1 &&
        (await phoneShows.locator(`${SHEET} [data-planner-show-band]`).count()) === 1
    );
    await phoneToggle.click();
    await phoneShows.waitForTimeout(500);
    const backHeight = await bandHeight();
    check(
      'und derselbe Schalter holt den Streifen zurück',
      backHeight === shownHeight,
      `${hiddenHeight} px → ${backHeight} px`
    );

    await phoneShows.close();
  }

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
  await gotoPlannerPage(page, `${BASE}/de/tagesplaner`, '[data-planner-page-intro]');
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
  await tapBlock(
    page,
    page.locator('article li[data-planner-block]'),
    'der Block der Demo nimmt einen Klick an'
  );
  await page.waitForTimeout(300);
  check(
    'die Demo schreibt nichts in den Plan',
    (await page.evaluate(() => window.localStorage.getItem('parkfan_planner'))) === null
  );

  // A second language, because the article is six modules and a missing one is
  // a build error only for the locale that lost it.
  await gotoPlannerPage(page, `${BASE}/fr/planificateur`, 'article h2');
  await page.waitForTimeout(1000);
  const frText = (await page.locator('article').innerText()) ?? '';
  check(
    'und auf Französisch genauso',
    (await page.locator('article h2').count()) === CHAPTER_COUNT &&
      (await page.locator('article li[data-planner-block]').count()) === 7 &&
      /Phantasialand/.test(frText),
    frText.slice(0, 60).replace(/\s+/g, ' ')
  );
  await gotoPlannerPage(page, `${BASE}/de/tagesplaner`, 'article');
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
  await gotoPlannerPage(page, `${BASE}/de/tagesplaner`, '[data-planner-page-day]');
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
step: {
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
  if (!(await openSheet(push, 'Benachrichtigungen, an und aus'))) {
    await push.close();
    break step;
  }
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
    if (!(await openSheet(push, 'Benachrichtigungen, zweiter Aufbau'))) {
      await push.close();
      break step;
    }
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
step: {
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
  if (!(await openSheet(past, 'begangene Pläne'))) {
    await past.close();
    break step;
  }
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
step: {
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
  if (!(await openSheet(photos, 'Fotos aus dem Payload'))) {
    await photos.close();
    break step;
  }
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
step: {
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
    if (!(await openSheet(page, 'Benachrichtigungen ohne Schlüssel'))) return false;
    await page.waitForTimeout(1800);
    return true;
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
  if (!(await seedPlan(push))) {
    await push.close();
    break step;
  }
  check(
    'ohne Schlüssel gibt es keinen Schalter',
    (await push.locator('[data-planner-push]').count()) === 0
  );
  await push.close();
}

step: {
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
  if (!(await openSheet(push, 'Benachrichtigungen, konfigurierter Deploy'))) {
    await push.close();
    break step;
  }
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

step: {
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
  if (!(await openSheet(push, 'Benachrichtigungen, verweigerter Browser'))) {
    await context.close();
    break step;
  }
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
step: {
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
  if (!(await openSheet(tint, 'Crowd-Tint'))) {
    await tint.close();
    break step;
  }
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
step: {
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
  if (!(await openSheet(past, 'vergangener Tag'))) {
    await past.close();
    break step;
  }
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

// ── Nothing is planned into a day that has been walked ──────────────────────
// The month calendar lets a past day be opened again as soon as something was
// planned on it (`planner-month-calendar.tsx`, "a past cell is reachable only
// where something was planned"), and `/plan/day` answers 200 for it with a full
// ride set — so until this rule the panel drew the optimise bar and the
// headliner band on yesterday, and pressing either rewrote a record.
//
// What must NOT disappear is the other half: a past day is kept so somebody can
// write down what actually happened, so the hand controls stay. The free-block
// row is the one asserted, because it is the desktop's own and it sits in the
// very component the two hidden ones were taken out of.
step: {
  const gone = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(gone);

  const OPEN = 9;
  const CLOSE = 18;
  // `parkDay(-1)`, not `Date.now() - 86_400_000`: between 22:00 and 24:00 UTC
  // the two name different days, which is the trap `parkDay`'s own docstring
  // was written for.
  const YESTERDAY = parkDay(-1);
  const RIDES = ['taron', 'black-mamba', 'chiapas-die-wasserbahn'];
  const dayFor = (date) => ({
    parkSlug: PARK.slug,
    timezone: 'Europe/Berlin',
    context: {
      date,
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
    tier: date < YESTERDAY ? 'observed' : 'measured',
    leadDays: 1,
    leadTimeMae: null,
    rides: RIDES.map((slug, i) => ({
      attractionSlug: slug,
      attractionName: slug,
      land: 'Mystery',
      latitude: 50.8 + i * 0.002,
      longitude: 6.87,
      hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, h) => ({
        hour: OPEN + h,
        wait: 20 + h * 5,
      })),
      dayPeak: 70,
      uncertaintyMinutes: null,
      sampleDays: 90,
      // The third one is the headliner nobody planned, so the band has
      // something to offer and its absence below means something.
      isHeadliner: i === 2,
    })),
    shows: [],
  });

  await gone.route('**/plan/day**', (route) => {
    const date = new URL(route.request().url()).searchParams.get('date') ?? YESTERDAY;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dayFor(date)),
    });
  });

  /** The same two-ride day, filed under whichever date is asked for. */
  const seedOn = async (date) => {
    await gone.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await gone.evaluate(
      ([plan, on]) => {
        const seeded = JSON.parse(JSON.stringify(plan));
        const park = seeded.parks.phantasialand;
        park.timezone = 'Europe/Berlin';
        park.days = {
          [on]: {
            date: on,
            entries: [
              { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
              {
                id: 'black-mamba-1',
                attractionSlug: 'black-mamba',
                attractionName: 'Black Mamba',
                startMinute: 960,
              },
            ],
          },
        };
        seeded.parks = { phantasialand: park };
        seeded.activeParkSlug = 'phantasialand';
        seeded.activeDate = on;
        window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
        window.localStorage.setItem('parkfan_planner_width', '520');
      },
      [PLAN, date]
    );
    await gone.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
    if (!(await openSheet(gone, `begangener Tag ${date}`))) return false;
    await gone.waitForTimeout(2500);
    return true;
  };

  // The positive control FIRST, so a selector typo cannot pass the two counts
  // below by matching nothing at all.
  if (!(await seedOn(DATE))) {
    await gone.close();
    break step;
  }
  check(
    'auf einem künftigen Tag stehen beide Planer-Angebote',
    (await gone.locator(`${SHEET} [data-planner-optimize]`).count()) === 1 &&
      (await gone.locator(`${SHEET} [data-planner-headliner-hint]`).count()) === 1,
    `Leiste ${await gone.locator(`${SHEET} [data-planner-optimize]`).count()}, Bande ${await gone.locator(`${SHEET} [data-planner-headliner-hint]`).count()}`
  );

  if (!(await seedOn(YESTERDAY))) {
    await gone.close();
    break step;
  }
  check(
    'ein vergangener Tag bietet kein Sortieren an',
    (await gone.locator(`${SHEET} [data-planner-optimize]`).count()) === 0
  );
  check(
    'und keine Headliner-Bande',
    (await gone.locator(`${SHEET} [data-planner-headliner-hint]`).count()) === 0
  );
  // The load-bearing half, and the reason this is not a blanket store guard:
  // a walked day is a record, and writing the record down still has to work.
  check(
    'von Hand eintragen geht auf ihm weiterhin',
    (await gone.locator(`${SHEET} [data-planner-add-custom]`).count()) === 1
  );

  await gone.close();
}

// ── The morning is not planned again at two in the afternoon ────────────────
// Reported against the clock rule that shipped before this one: raising every
// candidate's floor to "now" is exactly what MOVES a 10:00 block into the
// afternoon. A slot the clock has reached leaves the search and joins the fixed
// blocks instead, so `applyPlan` never touches its minute.
//
// Deterministic at any hour, which is the point: `page.clock.setFixedTime` puts
// the browser at 14:00 park-local whatever time the run starts, and the day
// payload is stubbed because today's real one is `tier: composed` with half the
// rides of tomorrow's.
step: {
  const late = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  noteErrors(late);

  const OPEN = 9;
  const CLOSE = 20;
  const TODAY = parkDay(0);
  const ZONE = 'Europe/Berlin';

  /**
   * The epoch of a wall-clock time in the park's zone.
   *
   * Two passes, because the offset has to be read at the instant it applies:
   * the first guess is off by the offset, and reading `longOffset` there is
   * enough to land on the right one everywhere except the hour a DST change
   * skips — which is why the second pass repeats the read.
   */
  const parkInstant = (date, hour, minute) => {
    const [y, m, d] = date.split('-').map(Number);
    const offsetAt = (ms) => {
      const label =
        new Intl.DateTimeFormat('en-US', { timeZone: ZONE, timeZoneName: 'longOffset' })
          .formatToParts(new Date(ms))
          .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
      const [, sign, hh, mm] = /GMT([+-])(\d{2}):(\d{2})/.exec(label) ?? [, '+', '00', '00'];
      return (sign === '-' ? -1 : 1) * (Number(hh) * 60 + Number(mm));
    };
    const naive = Date.UTC(y, m - 1, d, hour, minute);
    let guess = naive - offsetAt(naive) * 60_000;
    guess = naive - offsetAt(guess) * 60_000;
    return guess;
  };

  const NOW = parkInstant(TODAY, 14, 0);
  await late.clock.setFixedTime(NOW);

  await late.route('**/plan/day**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        parkSlug: PARK.slug,
        timezone: ZONE,
        context: {
          date: TODAY,
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
        leadTimeMae: null,
        rides: ['taron', 'black-mamba', 'fly', 'winjas-force'].map((slug, i) => ({
          attractionSlug: slug,
          attractionName: slug,
          land: 'Mystery',
          latitude: 50.8 + i * 0.002,
          longitude: 6.87,
          hours: Array.from({ length: CLOSE - OPEN + 1 }, (_, h) => ({
            hour: OPEN + h,
            wait: 20 + (h % 3) * 10,
          })),
          dayPeak: 40,
          uncertaintyMinutes: null,
          sampleDays: 90,
          isHeadliner: false,
        })),
        shows: [],
      }),
    })
  );

  await late.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await late.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      park.days = {
        [date]: {
          date,
          entries: [
            // Two behind the fixed clock, two ahead of it, and the two ahead are
            // three hours apart so there is something worth sorting.
            { id: 'taron-1', attractionSlug: 'taron', attractionName: 'Taron', startMinute: 600 },
            {
              id: 'black-mamba-1',
              attractionSlug: 'black-mamba',
              attractionName: 'Black Mamba',
              startMinute: 780,
            },
            { id: 'fly-1', attractionSlug: 'fly', attractionName: 'F.L.Y.', startMinute: 1020 },
            {
              id: 'winja-1',
              attractionSlug: 'winjas-force',
              attractionName: "Winja's Force",
              startMinute: 1140,
            },
          ],
        },
      };
      seeded.parks = { phantasialand: park };
      seeded.activeParkSlug = 'phantasialand';
      seeded.activeDate = date;
      window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
      window.localStorage.setItem('parkfan_planner_width', '520');
    },
    [PLAN, TODAY]
  );
  await late.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  if (!(await openSheet(late, 'Vormittag am Nachmittag'))) {
    await late.close();
    break step;
  }
  await late.waitForTimeout(3000);

  const readToday = () =>
    late.evaluate(() => {
      const plan = JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}');
      const day = Object.values(plan.parks?.phantasialand?.days ?? {})[0];
      return Object.fromEntries((day?.entries ?? []).map((e) => [e.id, e.startMinute]));
    });

  const run = late.locator(`${SHEET} [data-planner-optimize-run]`);
  check('die Optimier-Leiste steht auf dem heutigen Tag', (await run.count()) === 1);
  if (await run.count()) {
    const before = await readToday();
    await run.click();
    await late.waitForTimeout(1500);
    const after = await readToday();

    check(
      'der Optimierer lässt die abgelaufenen Bahnen stehen',
      after['taron-1'] === before['taron-1'] && after['black-mamba-1'] === before['black-mamba-1'],
      JSON.stringify(after)
    );
    check(
      'und plant nichts vor der aktuellen Uhrzeit',
      after['fly-1'] >= 840 && after['winja-1'] >= 840,
      JSON.stringify(after)
    );
    // The sentence covers the rides that were re-planned and nothing else, so
    // it has to say something. Two ways it did not: `scoreCurrent` counting the
    // morning made the guard around the saving fail and the status line render
    // empty, and an elapsed test of `<=` made the ride just filed AT 14:00
    // elapsed on the spot, which took `movable` under two and unmounted the
    // whole bar — sentence, undo and all — one render after the press.
    //
    // `count()` before `textContent()`, because a Playwright locator that
    // matches nothing does not return an empty string, it throws after the
    // default timeout and takes the rest of this file's assertions with it.
    const resultLine = late.locator(`${SHEET} [data-planner-optimize-result]`);
    const said = (await resultLine.count()) ? ((await resultLine.textContent()) ?? '') : '';
    check('die Leiste sagt, was sie getan hat', said.trim().length > 0, said.slice(0, 80));

    check(
      'und sie steht nach dem Druck noch da',
      (await late.locator(`${SHEET} [data-planner-optimize-run]`).count()) === 1
    );

    if (await late.locator(`${SHEET} [data-planner-optimize-run]`).count()) {
      await run.click();
      await late.waitForTimeout(1200);
      const twice = (await resultLine.count()) ? ((await resultLine.textContent()) ?? '') : '';
      check(
        'und ein zweiter Druck sagt, dass es passt',
        /Passt schon so/.test(twice),
        twice.slice(0, 80)
      );
    }
  }

  await late.close();
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
    if (!(await openSheet(rail, `Wetterleiste, ${label}`))) {
      await rail.close();
      continue;
    }
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
step: {
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

  if (!(await openSheet(learn, 'Zone aus dem Payload'))) {
    await learn.close();
    break step;
  }
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
    const opened = found && (await openSheet(page, locale));
    if (opened) {
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
      opened && missing.length === 0 && !/planner\.[a-z]/i.test(text),
      `Launcher ${found ? 'da' : 'fehlt'}, Panel ${opened ? 'offen' : 'zu'}, ${missing.length} fehlende Texte`
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
step: {
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
    if (!(await openSheet(opt, 'Tag sortieren'))) return false;
    await opt.waitForTimeout(3000);
    return true;
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

  if (!(await seedOptimize())) {
    await opt.close();
    break step;
  }

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
  if (!(await seedOptimize())) {
    await opt.close();
    break step;
  }
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

  // The park's own gate, out of the payload the panel plans against. Read
  // rather than written down: this park shuts at 18:00 today and the assertion
  // below is about the RULE, not about that number, so a hard-coded 1140 would
  // stop testing anything the season the hours move.
  const context = await fetch(
    `${BASE}/api/parks/europe/germany/bruehl/phantasialand/plan/day?date=${DATE}`
  )
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  // `buildDayGrid`'s own arithmetic: `closeHour` is the hour the closing time
  // FALLS IN, so this IS the gate. It used to read `+ 1` on the opposite
  // reading, which is what handed the optimiser an hour of park that does not
  // exist — and what let this very assertion pass over a plan that queued
  // Winja's Fear at 18:15 on a day ending at 18:00.
  const closeMinute =
    typeof context?.context?.closeHour === 'number' ? context.context.closeHour * 60 : null;
  check('die Öffnungszeiten des Parks sind bekannt', closeMinute !== null, `${closeMinute}`);

  /** Every ride block's start, as the store holds it. The lunch break is not one. */
  const startsOf = (stored) =>
    stored
      .split(' | ')
      .filter((cell) => !cell.startsWith('Mittag@'))
      .map((cell) => Number(cell.split('@')[1]));

  // The headliner button: it adds what the day has room for, and never a ride
  // past the gate.
  if (!(await seedOptimize())) {
    await opt.close();
    break step;
  }
  const rideCountBefore = (await readDay()).split(' | ').length;

  /**
   * Press the crown, and walk the assistant if one opens.
   *
   * Ten headliners do not fit in Phantasialand's nine hours, so which of them
   * is given up is a decision — and the app asks rather than making it. Nothing
   * is unticked here: the point of the default is that pressing on unchanged is
   * the engine's own answer, and that is the path this whole block measures.
   *
   * The walk is `Weiter` until the last step and then `Plan übernehmen`, which
   * is also what checks the rail: a step that failed to advance leaves the
   * apply button missing and every assertion after this one fails loudly rather
   * than passing over an unwritten day.
   */
  const pressHeadliners = async () => {
    await opt.locator(`${SHEET} [data-planner-optimize-headliners]`).click();
    await opt.waitForTimeout(900);
    const asked = await opt.locator('[data-planner-fit-count]').count();
    if (asked) {
      for (let guard = 0; guard < 4; guard++) {
        if ((await opt.locator('[data-planner-fit-next]').count()) === 0) break;
        await opt.locator('[data-planner-fit-next]').click();
        await opt.waitForTimeout(400);
      }
      await opt.locator('[data-planner-fit-apply]').click();
      await opt.waitForTimeout(1200);
    }
    await opt.waitForTimeout(1200);
    return asked > 0;
  };

  const askedFirst = await pressHeadliners();
  /**
   * Whether a headliner is STILL missing after the press, which is the same
   * question the assistant exists to answer, read off the button rather than
   * off the calendar.
   *
   * The check used to be the bare `askedFirst`, and it was a check about the
   * weather: Phantasialand holds all ten headliners on a quiet Tuesday and nine
   * on a busy Saturday, so a run made the day before a `very_low` Tuesday
   * demanded a dialog for a day with nothing to decide. What is actually
   * asserted is the EQUIVALENCE — the assistant opens exactly when something is
   * going to be left out — and that holds on both kinds of day.
   */
  const stillOffered = await opt.locator(`${SHEET} [data-planner-optimize-headliners]`).count();
  check(
    'der Assistent öffnet genau dann, wenn nicht alles passt',
    askedFirst === Boolean(stillOffered),
    `Dialog: ${askedFirst}, Knopf bleibt: ${Boolean(stillOffered)}`
  );
  const withHeadliners = await readDay();
  check(
    'alle Headliner einplanen füllt den Tag',
    withHeadliners.split(' | ').length > rideCountBefore,
    `${rideCountBefore} → ${withHeadliners.split(' | ').length}`
  );
  // The bug this replaced an assertion for, and both halves of it. "Plan every
  // headliner" filed what did not fit BEYOND closing: Black Mamba at 19:00 and
  // Taron at 20:00 in a park that shuts at 18:00 — and those two were the rides
  // the day already held, because overflow was a plain count and the coin toss
  // went against the visitor's own plan. Now an entry keeps its slot and a ride
  // being ADDED that has nowhere to go is left out instead, so nothing at all
  // lands out there.
  check(
    'kein Block liegt nach Feierabend',
    closeMinute !== null && startsOf(withHeadliners).every((minute) => minute < closeMinute),
    `${JSON.stringify(startsOf(withHeadliners))} gegen ${closeMinute}`
  );
  // Specifically: the two the day was seeded with are still in it, and still
  // inside the park's hours. They are the two the screenshot showed out there.
  check(
    'die beiden gesetzten Bahnen stehen noch im Tag',
    /black-mamba@(\d+)/.test(withHeadliners) &&
      /taron@(\d+)/.test(withHeadliners) &&
      Number(withHeadliners.match(/black-mamba@(\d+)/)[1]) < closeMinute &&
      Number(withHeadliners.match(/taron@(\d+)/)[1]) < closeMinute,
    withHeadliners
  );
  // So the button does NOT have to be gone: ten headliners do not fit in a
  // nine-hour day, and the one left over is a real offer — delete a ride and it
  // goes in. What must be true either way is that nothing the day had room for
  // is still missing, and the press that proves it is the second one: it adds
  // nothing, because there is nothing left it can add.
  if (stillOffered) {
    await pressHeadliners();
  }
  const twiceHeadliners = await readDay();
  check(
    'ein zweiter Druck plant keinen Headliner mehr ein',
    twiceHeadliners.split(' | ').length === withHeadliners.split(' | ').length,
    `${withHeadliners.split(' | ').length} → ${twiceHeadliners.split(' | ').length}`
  );
  // And it says so rather than claiming the day is finished: "Passt schon so" is
  // the answer to "there was nothing to do", and a headliner that cannot fit is
  // not nothing. The assistant's own wording after an apply, since that is the
  // path a tight day takes.
  const leftOver =
    (await opt.locator(`${SHEET} [data-planner-optimize-result]`).textContent()) ?? '';
  check(
    'und die Leiste nennt die, für die kein Platz ist',
    !stillOffered || /bleib(t|en) draußen|nicht mehr in den Tag/i.test(leftOver),
    leftOver.slice(0, 80)
  );
  // Drawn as a warning rather than as a grey clause, which is the report this
  // assistant came out of: the information was there and read as decoration.
  check(
    'und zwar sichtbar, mit einem Weg zurück in den Assistenten',
    !stillOffered ||
      ((await opt.locator(`${SHEET} [data-planner-optimize-alert]`).count()) === 1 &&
        (await opt.locator(`${SHEET} [data-planner-optimize-adjust]`).count()) === 1),
    leftOver.slice(0, 80)
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
  // ── The fit assistant, on a day that cannot possibly hold what is in it ────
  //
  // The block above only meets the assistant when the DATE happens to be busy:
  // Phantasialand holds all ten headliners on a quiet Tuesday and nine on a
  // busy Saturday, so a check that waits for a conflict is a check about the
  // weather. This one makes the conflict — every headliner the payload names,
  // plus a five-hour block through the middle of a nine-hour day, which no
  // ordering can absorb — and then walks the three steps the way a visitor
  // does: pull the lever, take a ride out, apply.
  const heads = (context?.rides ?? []).filter((r) => r.isHeadliner);
  check('der Tagesplan nennt Headliner zum Aussäen', heads.length >= 6, `${heads.length}`);
  if (heads.length >= 6 && closeMinute !== null) {
    await opt.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    await opt.evaluate(
      ([plan, date, rides, openHour]) => {
        const seeded = JSON.parse(JSON.stringify(plan));
        const park = seeded.parks.phantasialand;
        park.timezone = 'Europe/Berlin';
        park.days = {
          [date]: {
            date,
            entries: [
              ...rides.map((ride, index) => ({
                id: `seed-${index}`,
                attractionSlug: ride.slug,
                attractionName: ride.name,
                startMinute: openHour * 60 + index * 30,
              })),
              {
                id: 'lange-pause',
                startMinute: 11 * 60,
                custom: { label: 'Lange Pause', durationMinutes: 300, icon: 'break' },
              },
            ].sort((a, b) => a.startMinute - b.startMinute),
          },
        };
        seeded.parks = { phantasialand: park };
        seeded.activeParkSlug = 'phantasialand';
        seeded.activeDate = date;
        window.localStorage.setItem('parkfan_planner', JSON.stringify(seeded));
        window.localStorage.setItem('parkfan_planner_width', '520');
      },
      [
        PLAN,
        DATE,
        heads.map((ride) => ({ slug: ride.attractionSlug, name: ride.attractionName })),
        context.context.openHour,
      ]
    );
    await opt.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
    if (!(await openSheet(opt, 'Tag sortieren, Fit-Assistent'))) {
      await opt.close();
      break step;
    }
    await opt.waitForTimeout(3000);

    await opt.locator(`${SHEET} [data-planner-optimize-run]`).click();
    await opt.waitForTimeout(1200);

    const count = opt.locator('[data-planner-fit-count]');
    check(
      'ein Tag, der nicht aufgeht, öffnet den Assistenten statt still zu planen',
      (await count.count()) === 1
    );

    if ((await count.count()) === 1) {
      const opening = (await count.textContent()) ?? '';
      check(
        'und der Kopf sagt sofort, wie viel Platz da ist',
        /\d+\s*(von|of|van|sur|de|su)\s*\d+/i.test(opening),
        opening.trim()
      );

      // Step one: the measured levers. The five-hour block is the only thing in
      // the day that can give, so one of them has to name it.
      const lever = opt.locator('[data-planner-fit-lever]').first();
      check('der erste Schritt bietet eine Stellschraube an', (await lever.count()) === 1);
      const leverText = (await lever.textContent()) ?? '';
      check(
        'und sie nennt den Block, um den es geht',
        /Lange Pause/.test(leverText),
        leverText.trim().slice(0, 80)
      );
      // What it BUYS, under the label, and in one of the two shapes the model
      // can produce: a count, or the sentence that the whole list fits. Never a
      // piece of advice — every row here is a difference between two plans.
      check(
        'mit dem, was sie bringt, als Ergebnis statt als Rat',
        /passt der ganze Plan|\d+\s*von\s*\d+/.test(leverText.replace(/Lange Pause/g, '')),
        leverText.trim().slice(0, 80)
      );

      await lever.click();
      await opt.waitForTimeout(900);
      const pulled = (await count.textContent()) ?? '';
      check(
        'sie ziehen ändert die Zahl im Kopf',
        pulled.trim() !== opening.trim(),
        `${opening.trim()} → ${pulled.trim()}`
      );

      // Step two: the list, in the order things are given up in. Take the last
      // one out by hand — that is the whole point of the screen.
      await opt.locator('[data-planner-fit-next]').click();
      await opt.waitForTimeout(600);
      const rows = opt.locator('[data-planner-fit-row]');
      const rowCount = await rows.count();
      check('der zweite Schritt listet jede Bahn', rowCount === heads.length, `${rowCount}`);
      // The row's own key, mapped back through the seed. A wish that stands for
      // an entry is keyed `e:<entry id>` and `readDay` prints SLUGS, so
      // asserting the key against that string would be an assertion that passes
      // whatever happens.
      const droppedKey = (await rows.last().getAttribute('data-planner-fit-row')) ?? '';
      const seedIndex = Number(droppedKey.replace(/^e:seed-/, ''));
      const droppedSlug = Number.isInteger(seedIndex) ? heads[seedIndex]?.attractionSlug : null;
      await rows.last().locator('input[type="checkbox"]').click();
      await opt.waitForTimeout(900);

      /**
       * Unticking your way out of the problem, which is the gesture that was
       * reported broken: the list went quiet and, in the wizard, disappeared
       * altogether under the finger that had just pressed a checkbox.
       *
       * Two things have to hold at the end of it. The list is still ALL of the
       * rides, unticked ones included, because taking one out is a decision
       * somebody may want back. And the band at the top has to SAY the problem
       * is gone — the "fällt weg" marks vanishing is the same picture as a
       * screen that stopped working.
       */
      for (let guard = 0; guard < heads.length; guard++) {
        if (await opt.locator('[data-planner-fit-solved]').count()) break;
        const marked = opt.locator('[data-planner-fit-row]:has([data-planner-fit-drops])');
        if ((await marked.count()) === 0) break;
        await marked.last().locator('input[type="checkbox"]').click();
        await opt.waitForTimeout(700);
      }
      check(
        'genug abwählen macht die Meldung grün statt sie verschwinden zu lassen',
        (await opt.locator('[data-planner-fit-solved]').count()) === 1,
        (await opt.locator('[data-planner-fit-count]').textContent()) ?? ''
      );
      check(
        'und die Liste steht danach vollständig da',
        (await opt.locator('[data-planner-fit-row]').count()) === heads.length,
        `${await opt.locator('[data-planner-fit-row]').count()} von ${heads.length}`
      );

      await opt.locator('[data-planner-fit-next]').click();
      await opt.waitForTimeout(600);
      check(
        'der dritte Schritt schließt mit dem Übernehmen ab',
        (await opt.locator('[data-planner-fit-apply]').count()) === 1
      );
      await opt.locator('[data-planner-fit-apply]').click();
      await opt.waitForTimeout(1500);

      const applied = await readDay();
      /**
       * What the pulled lever did to the block, read as MINUTES rather than as
       * its presence.
       *
       * Which lever comes first is a property of the day, not of the fixture:
       * `fitLevers` puts a solving lever at the top, and on a busy forecast
       * that is „ohne Lange Pause" while on a quieter one half an hour is
       * already enough — so the block is gone on some days and 30 minutes long
       * on others. Asserting it is absent was asserting tomorrow's crowd level.
       * Both answers are the lever working; neither leaves the seeded five
       * hours standing.
       */
      const blockMinutes = await opt.evaluate(
        ([date]) => {
          const plan = JSON.parse(window.localStorage.getItem('parkfan_planner') ?? '{}');
          const day = plan.parks?.phantasialand?.days?.[date];
          const block = (day?.entries ?? []).find((entry) => entry.custom?.label === 'Lange Pause');
          return block ? block.custom.durationMinutes : null;
        },
        [DATE]
      );
      check(
        'die gezogene Stellschraube greift den Block an',
        blockMinutes === null || blockMinutes < 300,
        `${blockMinutes === null ? 'gestrichen' : `${blockMinutes} Min.`} · ${applied}`
      );
      check(
        'und die abgewählte Bahn ist nicht mehr drin',
        Boolean(droppedSlug) && !applied.includes(`${droppedSlug}@`),
        `${droppedKey} → ${droppedSlug} | ${applied}`
      );
      check(
        'nichts liegt danach nach Parkschluss',
        applied
          .split(' | ')
          .map((cell) => Number(cell.split('@')[1]))
          .every((minute) => minute < closeMinute),
        applied
      );
      check(
        'und die Leiste sagt, was daraus geworden ist',
        ((await opt.locator(`${SHEET} [data-planner-optimize-result]`).textContent()) ?? '').trim()
          .length > 0
      );
    }
  }

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
step: {
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
  if (!(await openSheet(bare, 'Tag sortieren, leerer Tag'))) {
    await bare.close();
    break step;
  }
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
step: {
  const cols = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  noteErrors(cols);

  await cols.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await cols.evaluate((plan) => {
    window.localStorage.setItem('parkfan_planner', JSON.stringify(plan));
    window.localStorage.removeItem('parkfan_planner_column2');
  }, PLAN);
  await cols.goto(`${BASE}/de`, { waitUntil: 'networkidle' });
  if (!(await openSheet(cols, 'zwei Spalten, erster Aufbau'))) {
    await cols.close();
    break step;
  }
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
  if (!(await openSheet(cols, 'zwei Spalten bei 780 px'))) {
    await cols.close();
    break step;
  }
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
  // the panel shows.
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
  await cols
    .locator(`${SHEET} [data-planner-column]`)
    .nth(1)
    .locator('[data-planner-grid]')
    .first()
    .click({ position: { x: 30, y: 30 } });
  await cols.waitForTimeout(1500);
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
  // …and the page follows. This said the opposite until it was reported from
  // the homepage: the navigation was gated on `plannerPagePark`, which is
  // `null` on every route that is not park-scoped, so on `/de` the click moved
  // the marker and nothing else. That gate asked the wrong question — the
  // columns are the subject and the page is where rides are dragged out of, and
  // a panel about Phantasialand in front of the homepage is a drag gesture with
  // no valid target just as it would be in front of Toverland's page. Both
  // columns here are the SAME park on two dates, so one navigation settles it
  // and a second click is the no-op below.
  check(
    'und die Seite dahinter folgt dem Park der Spalte',
    cols.url().includes(`/${PARK.geo.city}/${PARK.slug}`),
    cols.url()
  );
  check(
    'das Panel überlebt die Navigation',
    (await cols.locator(`${SHEET} [data-planner-column]`).count()) === 2
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
  if (!(await openSheet(cols, 'zwei Spalten nach dem Reload'))) {
    await cols.close();
    break step;
  }
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
  if (!(await openSheet(cols, 'zwei Spalten bei 448 px'))) {
    await cols.close();
    break step;
  }
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
  //
  // `domcontentloaded` and not `networkidle`, unlike the four reloads above it:
  // the assertion before this one navigated the tab to a PARK page, and a park
  // page has a live poll, a weather query and a best-days snapshot on it — so
  // there is no guarantee of 500 ms without a request inside 30 s, and a run
  // made while the backend was recomputing that snapshot died here with 274
  // green checks behind it. Nothing below needs the network to be quiet: the
  // launcher click and the sheet wait already wait for the things this measures.
  await cols.evaluate(() => window.localStorage.setItem('parkfan_planner_width', '780'));
  await cols.reload({ waitUntil: 'domcontentloaded' });
  if (!(await openSheet(cols, 'zwei Spalten, wieder 780 px'))) {
    await cols.close();
    break step;
  }
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
step: {
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
  if (!(await openSheet(tight, 'Fenster unter 1041 px'))) {
    await tight.close();
    break step;
  }
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
step: {
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
  if (!(await openSheet(phone, 'Handy'))) {
    await phone.close();
    break step;
  }
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
  const stack = await phone.locator(SHEET).evaluate((sheet) => {
    // **Through `display: contents`, not past it.** Such an element has no box
    // of its own — `getBoundingClientRect()` answers 0×0 — but its CHILDREN are
    // the rows the sheet actually lays out, and PAR-168 put two of them in
    // exactly this position (the landscape row's two wrappers, which are
    // `contents` at every other size). Reading `sheet.children` and filtering on
    // a height left two rows in the list, no pair to compare, and a guard that
    // could not fail: the one assertion that says the portrait sheet did not
    // move, passing because it had stopped looking.
    const rows = [];
    const collect = (parent) => {
      for (const el of parent.children) {
        const style = getComputedStyle(el);
        if (style.display === 'contents') {
          collect(el);
          continue;
        }
        const box = el.getBoundingClientRect();
        // Hidden rows have no box, and an absolute one is out of the flow.
        if (box.height <= 0 || style.position === 'absolute') continue;
        rows.push({
          cls: el.className.slice(0, 40),
          top: Math.round(box.top),
          bottom: Math.round(box.bottom),
        });
      }
    };
    collect(sheet);
    // Document order, which is what makes "the next row" mean anything. The
    // recursion already yields it, and sorting by `top` would hide the very
    // defect this looks for.
    return rows;
  });
  // The guard on the guard, and it is here because this assertion has already
  // been silently emptied once (see the note above): the portrait sheet draws
  // the handle, its header, the column, the ride search and at least the
  // totals, so anything under five rows means the reading failed rather than
  // the layout passing.
  check(
    'das Telefon-Panel hat überhaupt Zeilen zu vergleichen',
    stack.length >= 5,
    `${stack.length} Zeile(n): ${stack.map((row) => row.cls).join(' | ')}`
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

  // The one press in this file that does not go through {@link openSheet}, so
  // it waits for the main thread itself. The wizard is a MODAL dialog even at
  // 1280 px, and pressing it open while the page hydrates is the mismatch
  // {@link settleHydration} describes. Measured on this page (PAR-328): two
  // warnings when the press follows `networkidle` directly, naming
  // `aria-hidden` and `data-aria-hidden` on `<header>` and on `<footer>`; zero
  // without the press, zero with this line.
  await settleHydration(wiz);

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

// ── A minimum block's resize edge stays inside it ───────────────────────────
//
// Since the block stopped clipping (PF-86, Etappe 1), the grip and the resize
// edge grow 44 px touch targets out of a box that may be 30 px tall. That is
// what makes the shortest block usable — and it put the resize edge, which is
// anchored to the BOTTOM and grows upward, 14 px into whatever sits above it.
// Blocks in the same lane column carry the same `z-index`, so DOM order decides
// and the later — the lower — one wins: pressing the bottom of the upper block
// resized the lower one.
//
// Two free blocks, the lower on the minimum box, and `elementFromPoint` at the
// depths the report measured. A pointer probe rather than a bounding box: the
// target is a pseudo-element, and `getBoundingClientRect` knows nothing about
// one.
//
// **Right of the grip's column, and the name of the second assertion says so.**
// The grip is centred rather than bottom-anchored, so it overhangs a 30 px block
// by 7 px in both directions and still takes the bottom corner of the block
// above — deliberately, because that overhang is the only reason the shortest
// block can be moved at all. That is PAR-165 and not this. Probing the grip's
// column here would fail for a thing this ticket decided to keep.
//
// Behind `live`, like the two passes above it: with a 404 from `/plan/day` there
// are no opening hours, so `buildDayGrid` answers `null`, the axis is never
// drawn and there is no block to measure. Without the guard this pass would
// report "die zwei freien Blöcke fehlen" on the very path the header at the top
// of this file promises to support.
if (live) {
  const tight = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  noteErrors(tight);
  await tight.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  await tight.evaluate(
    ([plan, date]) => {
      const seeded = JSON.parse(JSON.stringify(plan));
      const park = seeded.parks.phantasialand;
      park.timezone = 'Europe/Berlin';
      // 25 minutes then 5, one after the other: the second lands on the minimum
      // box (`MIN_BLOCK_PX` scaled to the coarse axis) with the first ending a
      // pixel or two above it. That adjacency IS the case — with 15 px of gap
      // the overhang reaches nothing.
      park.days = {
        [date]: {
          date,
          entries: [
            {
              id: 'lunch-1',
              startMinute: 600,
              custom: { label: 'Mittag', durationMinutes: 25, icon: 'food' },
            },
            {
              id: 'pause-1',
              startMinute: 626,
              custom: { label: 'Pause', durationMinutes: 5, icon: 'break' },
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
  await tight.goto(`${BASE}/de`, { waitUntil: 'domcontentloaded' });
  if (await openSheet(tight, 'Resize-Kante, schmales Fenster')) {
    await tight.waitForTimeout(2500);
    // Into the scroller's visible area first. A block outside it still reports a
    // rectangle, and `elementFromPoint` would then answer for whatever is
    // painted at those viewport coordinates instead — the ride search, in this
    // layout, which reads as a pass for the wrong reason.
    await tight.evaluate(() => {
      const short = [...document.querySelectorAll('li[data-planner-block]')].find((el) =>
        /Pause/.test(el.textContent ?? '')
      );
      short?.scrollIntoView({ block: 'center' });
    });
    await tight.waitForTimeout(600);

    const tiles = await tight.evaluate(() => {
      const blocks = [...document.querySelectorAll('li[data-planner-block]')].map((el) => ({
        el,
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        box: el.getBoundingClientRect(),
      }));
      const upper = blocks.find((b) => /Mittag/.test(b.text));
      const lower = blocks.find((b) => /Pause/.test(b.text));
      if (!upper || !lower) return null;
      const edge = lower.el.querySelector('button[aria-label="Dauer ziehen"]');
      const reach = edge ? parseFloat(getComputedStyle(edge, '::after').height) : null;
      // Where the target's top edge actually LANDS, not how tall it is. The two
      // differ by the block's border: the edge is absolute inside a `relative`
      // bordered div, so it is laid out against that div's padding box and
      // starts a pixel above the block's own bottom. Comparing heights would
      // call a target that overhangs by exactly that pixel a pass.
      const edgeTop = edge ? edge.getBoundingClientRect().bottom - (reach ?? 0) : null;
      // Right of the grip's 44 px column, and well clear of it, so this measures
      // the resize edge rather than the grip beside it — see the note above.
      const x = Math.round(lower.box.left + Math.min(200, lower.box.width - 60));
      const owns = (depth) => {
        const hit = document.elementFromPoint(x, Math.round(upper.box.bottom - depth));
        return hit?.closest('li[data-planner-block]') === upper.el;
      };
      return {
        shortHeight: Math.round(lower.box.height),
        reach,
        overhang: edgeTop === null ? null : Math.round(lower.box.top - edgeTop),
        gap: Math.round(lower.box.top - upper.box.bottom),
        depths: [1, 2, 5, 8, 11, 14].map((d) => [d, owns(d)]),
      };
    });

    if (!tiles) {
      check(
        'die Resize-Kante bleibt in ihrem Mindestblock',
        false,
        'die zwei freien Blöcke fehlen'
      );
    } else {
      const stolen = tiles.depths.filter(([, mine]) => !mine).map(([d]) => d);
      // Bounded from BELOW as well, and that half is not pedantry: the cap is an
      // arbitrary Tailwind class reading a custom property set in an inline
      // style, and neither end of that is something the type checker can see. A
      // purged class or a renamed property leaves `height: 0px`, which satisfies
      // "does not overhang" perfectly and hands the phone an edge nobody can
      // touch. So the target must be the exact room it is entitled to —
      // `min(44, Blockhöhe − 2)`, the two being the block's own border, which
      // the edge is laid out inside of.
      const entitled = Math.min(44, tiles.shortHeight - 2);
      check(
        'die Resize-Kante ragt nicht über den Mindestblock hinaus',
        tiles.overhang !== null && tiles.overhang <= 0 && Math.round(tiles.reach) === entitled,
        `Blockhöhe ${tiles.shortHeight} px · Trefferfläche ${tiles.reach} px (erwartet ${entitled}) · Überhang ${tiles.overhang} px`
      );
      check(
        'die unteren 14 px des Blocks darüber gehören ihm, rechts vom Griff',
        stolen.length === 0,
        stolen.length === 0
          ? `Lücke ${tiles.gap} px, sechs Tiefen ab 1 px geprüft`
          : `gestohlen bei ${stolen.join(', ')} px über der Unterkante (Lücke ${tiles.gap} px)`
      );
    }
  } else {
    check('die Resize-Kante bleibt in ihrem Mindestblock', false, 'Panel nicht geöffnet');
  }
  await tight.close();
}

// ── Landscape, 844×390 ───────────────────────────────────────────────────────
//
// The same device as the 390×844 pass above, rotated — and until PAR-76 the one
// the panel got wrong, because `sm` asks the WIDTH and 844 is over it. The panel
// therefore drew its desktop arrangement into a 390 px tall window: a 448×390
// side sheet at x=396 whose time axis was 16 px, all sixteen of them under the
// optimize row.
//
// What this pass guarded until PAR-168 was the SWITCH and not the axis' height:
// `planner-phone` (app/globals.css) and `PLANNER_PHONE_QUERY` carry a height
// term since PAR-76, so a flat window gets the bottom sheet, the grab handle and
// the coarse-pointer targets — but the axis was still 16 px, because the sheet
// stacked 343 px of chrome into a 359 px one and `min-h-0 shrink` had nothing to
// take. The number was printed rather than asserted for exactly as long as it
// was somebody else's to move.
//
// **PAR-168 moved it, so the print becomes an assertion.** The sheet is a ROW at
// this size now — the day's chrome in a 320 px column, the axis in the 509 px
// beside it — and the axis gets 269 px of the 270 the row has. Asserted at
// `AXIS_MIN_LANDSCAPE_PX`, i.e. two hours of day, which is what the arrangement
// exists to buy; the rest of the slack is what keeps an honest change from going
// red for a pixel.
//
// NOT behind `live` as a whole, unlike the two passes above — and the split is
// deliberate. What this pass is really about is the SWITCH: the arrangement,
// the grab handle and the coarse-pointer branch are properties of the window
// and the pointer, and they hold whether or not `/plan/day` answered. Only the
// axis needs the day's opening hours, so only the axis' own assertion carries
// the guard, right where it is made.
/**
 * Two hours of day on the landscape axis, in pixels.
 *
 * 120 minutes at `PX_PER_MIN_COARSE` (1.8), which is the scale a coarse pointer
 * gets — so this number and the phone's axis are the same statement about the
 * DAY, written in the unit a browser can be asked about. PAR-168's first
 * acceptance criterion is this number.
 */
const AXIS_MIN_LANDSCAPE_PX = 216;

{
  const land = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
  noteErrors(land);
  await seed(land);
  if (await openSheet(land, 'Querformat')) {
    await land.waitForTimeout(2500);

    // The instrument first, as in the portrait pass: a landscape phone that
    // answers `(pointer: fine)` is a mouse in a short window, and every sentence
    // below is about a thumb.
    const pointer = await land.evaluate(() => ({
      coarse: matchMedia('(pointer: coarse)').matches,
      fine: matchMedia('(pointer: fine)').matches,
    }));
    check(
      'die Querformat-Seite ist ein Grobzeiger',
      pointer.coarse && !pointer.fine,
      `coarse ${pointer.coarse} · fine ${pointer.fine}`
    );

    const room = await land.evaluate((sel) => {
      const sheet = document.querySelector(sel);
      if (!sheet) return null;
      const box = sheet.getBoundingClientRect();
      const grid = sheet.querySelector('[data-planner-grid]');
      const scroller = grid?.closest('.overflow-y-auto') ?? null;
      const axis = scroller?.getBoundingClientRect() ?? null;
      // Whatever is actually painted at the axis' centre. `getBoundingClientRect`
      // cannot answer "is something over this" — two boxes overlap happily and
      // both report their own geometry — so ask the browser what a finger would
      // hit there instead.
      let covers = null;
      if (axis && axis.height > 0) {
        const hit = document.elementFromPoint(
          Math.round(axis.x + axis.width / 2),
          Math.round(axis.y + axis.height / 2)
        );
        // The name of the ROW in the way, not the tag of whatever pixel the
        // point happened to land on: `DIV` names nothing, and which row it is
        // decides whose ticket it is — the optimize bar, the headliner band and
        // the summary are three different sets of pixels. So walk up from the
        // hit to the nearest element that carries a `data-planner-*` name and
        // use that; the tag is only the fallback for a hit that has none above
        // it at all.
        if (hit && !scroller.contains(hit) && hit !== scroller) {
          // `[data-planner-show-band]` is deliberately NOT in this list: the
          // strip is a `sticky` CHILD of the scroller being measured, so the
          // guard above (`!scroller.contains(hit)`) has already excluded it and
          // listing it would only suggest a case this can report. It cannot —
          // a band covering its own axis is invisible to this assertion, and
          // that gap is real rather than closed here (see PAR-168).
          const named = hit.closest(
            '[data-planner-optimize],[data-planner-headliner-hint],[data-planner-summary],[data-planner-add-custom],[data-planner-column-head]'
          );
          covers = named ? Object.keys(named.dataset)[0] : hit.tagName;
        }
      }
      // How much of the axis is INSIDE the sheet, which is not the same as how
      // tall it is: `min-h` on a box whose parent is `min-h-0 flex-1` makes it
      // overflow rather than grow the parent, and an axis reported as 200 px can
      // have 37 of them below the sheet's own bottom edge with four rows painted
      // over the rest. `height - axis` as a stand-in for "chrome" is a lie in
      // exactly that case, so both numbers are measured against the sheet.
      const visible =
        axis && axis.height > 0
          ? Math.max(0, Math.min(axis.bottom, box.bottom) - Math.max(axis.top, box.top))
          : 0;
      // The ride search, because it is what says the sheet is a ROW rather than
      // a stack: it is the one chrome row that is always drawn at this size
      // (`planner-wide:hidden`, asserted on its own below), so "it is left of
      // the axis and level with it" is the arrangement in two numbers. A test on
      // the axis' own left edge alone would be a threshold nobody can derive —
      // this one is a relation between two boxes and holds at any column width.
      const search = document.querySelector('[data-planner-ride-search]');
      const searchBox = search?.getBoundingClientRect() ?? null;
      const beside =
        axis && searchBox && searchBox.height > 0
          ? {
              searchRight: Math.round(searchBox.right),
              searchTop: Math.round(searchBox.top),
              searchBottom: Math.round(searchBox.bottom),
              // Left of it, and overlapping it vertically. Stacked, the second
              // half is false; side by side, both are true.
              leftOfAxis: searchBox.right <= axis.left + 1,
              levelWithAxis: searchBox.top < axis.bottom && searchBox.bottom > axis.top,
            }
          : null;
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        left: Math.round(box.x),
        bottom: Math.round(window.innerHeight - box.bottom),
        axis: axis ? Math.round(axis.height) : null,
        axisLeft: axis ? Math.round(axis.x) : null,
        axisWidth: axis ? Math.round(axis.width) : null,
        axisVisible: Math.round(visible),
        covers,
        beside,
        handle: sheet.querySelector('[data-planner-sheet-handle]'),
      };
    }, SHEET);

    if (room) {
      // A bottom sheet, measured the way the portrait pass measures one: it spans
      // the window's width and sits on its bottom edge. The `left` and `bottom`
      // halves are what separate it from the side panel this used to be — that
      // one reported `left: 396`.
      check(
        'im Querformat liegt das Panel unten und nicht rechts',
        room.left === 0 && room.bottom === 0 && room.width >= 800,
        `Sheet ${room.width}×${room.height} bei (${room.left}, unten ${room.bottom} px)`
      );
      // 92svh of 390, i.e. the phone ceiling doing its job at a size where the
      // width breakpoint never reached it. Bounded on both sides: `h-auto` with
      // no ceiling would grow past the window, and a ceiling that clamps to
      // nothing would collapse the sheet.
      check(
        'das Querformat-Sheet nimmt 92svh statt der ganzen Höhe',
        room.height === 359,
        `${room.height} px von 390 (erwartet 359 = 92svh)`
      );
      // Only where there IS an axis, and the guard is the assertion's own: with
      // a 404 from `/plan/day` there are no opening hours, `buildDayGrid`
      // answers `null` and nothing is drawn — at which point `covers` is `null`
      // because there was nothing to cover, and this would go green on a run
      // that measured no axis at all. That is the failure mode the whole pass
      // exists to catch, so it may not be the one it reports as passing.
      if (live) {
        // **`axisVisible === axis` is part of the assertion, not decoration**,
        // and without it this goes green on the one failure it is here to catch.
        // `elementFromPoint` answers `null` for a point outside the window, so an
        // axis pushed below the sheet's own bottom edge — `min-h` in a
        // `min-h-0 flex-1` parent, which is exactly what the 200 px floor did on
        // PAR-76's branch — left `covers` at `null` and reported "nothing is over
        // the axis" about an axis nobody could see. Measured there: box 200 px,
        // 10 of them inside the sheet, four rows painted over the rest.
        // (PAR-212, first of its four holes.)
        const axisWhole = room.axis !== null && room.axis > 0 && room.axisVisible === room.axis;
        check(
          'nichts liegt über der Achse',
          axisWhole && room.covers === null,
          room.axis === null || room.axis === 0
            ? 'keine Achse gefunden — nichts gemessen'
            : !axisWhole
              ? `die Achse läuft aus dem Sheet: Box ${room.axis} px, davon ${room.axisVisible} px drin`
              : room.covers === null
                ? `Achse ${room.axis} px, an ihrer Mitte liegt die Achse selbst`
                : `${room.covers} liegt über der Achse · Achse ${room.axis} px, davon ${room.axisVisible} px im Sheet ` +
                  `· Chrome ${room.height - room.axisVisible} px von ${room.height} (PAR-168)`
        );
        // Asserted since PAR-168 — see the note above this block. `axisVisible`
        // rather than `axis`, and the difference is the whole finding: an axis
        // can report 200 px with 10 of them in the sheet.
        check(
          'die Achse zeigt im Querformat zwei Stunden des Tages',
          room.axisVisible >= AXIS_MIN_LANDSCAPE_PX,
          `${room.axisVisible} px sichtbar (Box ${room.axis} px) in einem ${room.height} px hohen Sheet ` +
            `· nötig ${AXIS_MIN_LANDSCAPE_PX} px = 2 h bei PX_PER_MIN_COARSE · ` +
            `Chrome daneben ${room.height - room.axisVisible} px`
        );
        // And WHY it has them: the chrome stands beside the axis rather than
        // over it. Two hours could also be bought by taking rows away, and this
        // is the assertion that tells the two apart.
        check(
          'im Querformat steht das Chrome neben der Achse, nicht darüber',
          Boolean(room.beside?.leftOfAxis && room.beside?.levelWithAxis),
          room.beside === null
            ? 'keine Ride-Suche mit Höhe gefunden — nichts gemessen'
            : `Ride-Suche endet bei x=${room.beside.searchRight}, Achse beginnt bei x=${room.axisLeft} ` +
                `(${room.axisWidth} px breit) · Suche y ${room.beside.searchTop}–${room.beside.searchBottom}, ` +
                `Achse ${room.axisVisible} px hoch`
        );
      }
    } else {
      check('im Querformat liegt das Panel unten und nicht rechts', false, 'kein Sheet gefunden');
    }

    // The handle is `planner-wide:hidden` now rather than `sm:hidden`, and this
    // is the assertion that says the rename took: at 844 px wide the old class
    // hid it, because 844 is over `sm`.
    const handle = land.locator('[data-planner-sheet-handle]');
    const handleBox = (await handle.count()) ? await handle.first().boundingBox() : null;
    check(
      'der Griff ist im Querformat da und 44 px hoch',
      handleBox !== null && Math.round(handleBox.height) === 44,
      handleBox ? `${Math.round(handleBox.width)}×${Math.round(handleBox.height)} px` : 'kein Griff'
    );

    // The handle's other half, and the reason it is asserted HERE and not only
    // in the portrait pass: `hideClose` is keyed on `isPhone`, so PAR-76's
    // height term took the × off this window too — 844×390 is over `sm` and
    // would have kept it under the old query. The pair is what AK 3 of PAR-188
    // rests on: the × may only go where the handle is drawn, and
    // `planner-wide:` is the exact complement of `planner-phone:`, so the two
    // switch on the same window or the sheet has no visible way out. Asserted
    // together for the same reason the portrait pass does it — either half
    // alone passes over exactly that state.
    check(
      'und im Querformat trägt es keinen ×-Knopf',
      (await land.locator(`${SHEET} [data-slot="sheet-close"]`).count()) === 0
    );

    // The two PAIRS this change is built on, asserted rather than assumed.
    //
    // Every class the sweep moved has a counterpart that has to move with it,
    // and a pair that disagrees does not look broken — it draws the same offer
    // twice, or names a gesture the reader does not have. Both of these were
    // found by review rather than by this pass, which is the gap being closed:
    // put either file back on `sm:` and the geometry assertions above stay
    // green while the sheet says two contradictory things.
    // `:visible` on every one of these, never `count()`. Both halves of both
    // pairs are always in the DOM — what the variants decide is `display`, and
    // `count()` reads a `display:none` element as present. An assertion built on
    // it cannot fail, which is the trap these two were written into first: the
    // free-block row and the search's copy of it both existed at every size, so
    // the "exactly once" it reported was the DOM's arithmetic and not the
    // sheet's.
    const addCustom = await land
      .locator(
        `${SHEET} [data-planner-add-custom]:visible, ${SHEET} [data-planner-add-custom-search]:visible`
      )
      .count();
    check(
      'der Eigener-Block-Knopf steht im Querformat genau einmal',
      addCustom === 1,
      `${addCustom}× sichtbar (die Fußzeile trägt eine Fassung, die Ride-Suche ihre eigene — ` +
        `oberhalb planner-wide die Fußzeile, darunter die Suche, nie beide)`
    );

    // The ride search is the phone's way in, and on a landscape phone it has to
    // BE there: `planner-wide:hidden` is the class that decides it, and at 844 px
    // wide the `sm:hidden` it replaced took it away. Its visibility is also what
    // the empty day's sentence is paired with — where this list is drawn,
    // "such dir unten eine Bahn" is the true half.
    const searchShown = await land.locator(`${SHEET} [data-planner-ride-search]:visible`).count();
    check(
      'die Ride-Suche ist im Querformat sichtbar',
      searchShown === 1,
      `${searchShown}× sichtbar`
    );

    // The THIRD pair, and it is the one PAR-168 added: the context band is drawn
    // by the panel here and by the column everywhere else, and the two halves
    // are two separate conditions — `isLandscape &&` in `planner-flyout.tsx`,
    // `withBand={!isLandscape}` on `PlannerDayColumn`. Let them drift and the
    // sheet carries the band twice or not at all, while every geometry
    // assertion above stays green: two bands sit left of the axis, and a
    // missing one only makes the axis taller. The same trap the two pairs above
    // were written for, one change later.
    //
    // `:visible` rather than `count()`, for the reason the block above gives at
    // length — but note the difference: here it is React that draws one or the
    // other, so a second band would be a second ELEMENT rather than a hidden
    // one. `:visible` is right either way and says what is meant.
    const bands = await land.locator(`${SHEET} [data-planner-context-band]:visible`).count();
    check(
      'das Kontextband steht im Querformat genau einmal',
      bands === 1,
      `${bands}× sichtbar (das Panel zeichnet es hier, die Spalte überall sonst — nie beide)`
    );

    // And the left column REACHES what it carries. Moving the rows beside the
    // axis only moved the arithmetic: 562 px of content in 269, so the summary
    // and the push toggle sit below the sheet's own bottom edge and are reached
    // by scrolling that column or not at all. `planner-landscape:overflow-y-auto`
    // is the whole of that, and nothing above notices if it goes: the axis is
    // just as tall, nothing covers it, and the search is still left of it —
    // verified by taking the property away and reading the same numbers back.
    //
    // Both halves, because either alone is a half-truth: `overflow-y: auto`
    // without an overflow scrolls nothing, and an overflow without it is
    // content nobody can get to.
    const scrolls = await land.evaluate((sel) => {
      const column = document.querySelector(`${sel} [data-planner-landscape-chrome]`);
      if (!column) return null;
      return {
        overflowY: getComputedStyle(column).overflowY,
        scrollHeight: column.scrollHeight,
        clientHeight: column.clientHeight,
      };
    }, SHEET);
    check(
      'die linke Spalte im Querformat ist erreichbar, nicht abgeschnitten',
      Boolean(
        scrolls &&
        scrolls.overflowY === 'auto' &&
        scrolls.scrollHeight > scrolls.clientHeight &&
        scrolls.clientHeight > 0
      ),
      scrolls === null
        ? 'keine linke Spalte gefunden — nichts gemessen'
        : `overflow-y ${scrolls.overflowY} · ${scrolls.scrollHeight} px Inhalt in ${scrolls.clientHeight} px`
    );

    // The drag coach is NOT asserted here, and the reason is worth a line rather
    // than a silent omission: it renders only where a park page is behind the
    // panel (`pagePark`), and `seed()` opens the planner from `/de`, where there
    // is none — so it is absent at every viewport and an assertion on that would
    // pass without testing anything, exactly like the two above nearly did. Its
    // pairing with the search is covered by the class itself
    // (`planner-wide:flex`) and by the empty grid's two lines.
  } else {
    check('im Querformat liegt das Panel unten und nicht rechts', false, 'Panel nicht geöffnet');
  }
  await land.close();
}

check(
  'keine unerwarteten Konsolenfehler',
  consoleErrors.length === 0,
  consoleErrors.slice(0, 3).join(' | ')
);

await browser.close();

await exitAfterFlush(printBalance() === 0 ? 0 : 1);
