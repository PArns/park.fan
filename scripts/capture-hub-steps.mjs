/**
 * The screenshots of chapter 01 on each trip-region hub (`hub.howItWorks`), the planner's four
 * steps taken from the real assistant at a desk in each of the six languages: the dates, a question
 * that can be skipped (the hotel, or the route where the region plans across cities), the plan's
 * day cards and Parky's ideas over the plan (the swap mode where the API sends no ideas). Each
 * region walks one trip, so the four shots of a region show the same plan.
 *
 * Needs a running site whose API serves the trip-region routes and the plan's ideas, as
 * api.park.fan does: `pnpm build && pnpm start -p 3506` (with `NODE_USE_ENV_PROXY=1` behind a
 * proxy), then
 *
 *     node --experimental-strip-types --import ./scripts/register-path-alias.mjs \
 *       scripts/capture-hub-steps.mjs --base=http://localhost:3506
 *
 * `--region=japan` and `--locale=de` take one region or language, `--shot=1,3` some of the shots.
 * Writes `public/media/reiseplaner/<image>-assistent-<n>-<locale>.webp`, two device pixels per px;
 * the sidecars beside them are written by hand.
 *
 * `--post` takes the screenshots of the Orlando trip-planner post instead (`POST_SHOTS`, the
 * post's translationKey `orlando-trip-planner`), from the same build; `--shot=tickets-uk` takes one
 * of them.
 */
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { TRIP_CALENDAR_ID, tripRegionPath } from '../lib/trip-regions/paths.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/media/reiseplaner');
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const BASE = (arg('base') ?? 'http://localhost:3000').replace(/\/$/, '');
const LOCALES = arg('locale')?.split(',') ?? ['de', 'en', 'nl', 'fr', 'es', 'it'];
const POST = process.argv.includes('--post');
const SHOTS = (arg('shot') ?? '1,2,3,4').split(',').map(Number);

/**
 * The trip each region's shots show. `image` is the region's word in the media ids (as in
 * `parky-kalifornien-tag`), `question` the step body of shot 2 and `answer` what is pressed on it.
 * Where the trip is free to choose it starts in the month's first two weeks, the rows a frame cut
 * from the top shows under the month chips.
 */
const TRIPS = {
  orlando: {
    image: 'orlando',
    from: '2027-03-01',
    to: '2027-03-10',
    question: '[data-wizard-hotel]',
    answer: '[data-wizard-hotel-kind="disney"]',
  },
  'southern-california': {
    image: 'kalifornien',
    from: '2027-04-05',
    to: '2027-04-11',
    question: '[data-wizard-hotel]',
  },
  japan: { image: 'japan', from: '2027-01-14', to: '2027-01-30', question: '[data-wizard-route]' },
  paris: { image: 'paris', from: '2027-05-06', to: '2027-05-09', question: '[data-wizard-route]' },
};
const REGIONS = arg('region')?.split(',') ?? Object.keys(TRIPS);

/**
 * The desk the shots are taken at. The hub shows every shot in a 4:3 frame. The assistant is a
 * stage 768 px wide and 92svh tall: the dates are shot whole and framed from the top (the month
 * chips and the trip's weeks), the question in a window 626 px high, which makes the stage 4:3
 * with „Skip“ in it. The plan is cut to 4:3 of its column.
 */
const DESK = { width: 1024, height: 900 };
const SHORT_DESK = { width: 1024, height: 626 };
const RATIO = 3 / 4;
/** Where a cut starts under the site's sticky header, in CSS px. */
const BELOW_HEADER = 72;
const WIZARD = '[data-trip-wizard]';
const PLAN_TIMEOUT = 120_000;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

/** The shot as WebP, cut to `clip` in CSS px. */
async function save(page, clip, file) {
  const png = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
  await sharp(png).webp({ quality: 82 }).toFile(file);
  console.log(`  ✓ ${path.relative(ROOT, file)}`);
}

/** Hide what floats over the page: Parky's button and the day planner's edge tab. */
async function hideFixed(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      if (getComputedStyle(el).position === 'fixed') el.style.visibility = 'hidden';
    }
  });
}

/**
 * A 4:3 cut of the plan's column (`frame`) starting `lead` of its height above `top`, scrolled so the cut
 * stands under the header. Parky's button and the day planner's edge tab are hidden first: they
 * float over the column's right edge.
 */
async function planCut(page, frame, top, lead = 0) {
  await hideFixed(page);
  const box = await top.boundingBox();
  const { x, width } = frame;
  const height = width * RATIO;
  const y = box.y - height * lead;
  await page.evaluate((dy) => window.scrollBy(0, dy), y - BELOW_HEADER);
  await page.waitForTimeout(500);
  return { x, y: BELOW_HEADER, width, height };
}

/** One date of the assistant's grid on screen, through the month chips over it. */
async function showDate(wizard, date) {
  const day = wizard.locator(`[data-plan-date="${date}"]:not([disabled])`);
  if (await day.count()) return day.first();
  const chips = wizard.locator('[data-plan-month-chips] button');
  const n = await chips.count();
  for (let i = 0; i < n; i++) {
    await chips.nth(i).click();
    if (await day.count()) return day.first();
  }
  throw new Error(`${date} is not in the date grid`);
}

/** One region's four steps in one language. */
async function walk(browser, region, locale) {
  const trip = TRIPS[region];
  const context = await browser.newContext({
    viewport: DESK,
    deviceScaleFactor: 2,
    colorScheme: 'light',
    locale,
    reducedMotion: 'reduce',
  });
  await context.addInitScript((slug) => {
    try {
      // The result's day cards, not the week, whatever the width picks.
      localStorage.setItem(`parkfan_${slug}_view`, 'agenda');
      // The site is dark unless asked; the hub's other shots are light.
      localStorage.setItem('theme', 'light');
      // Parky's lines would sit over the result.
      sessionStorage.setItem('parkfan:assistant-muted', '1');
    } catch {}
  }, region);
  const page = await context.newPage();
  const file = (n) => path.join(OUT, `${trip.image}-assistent-${n}-${locale}.webp`);
  try {
    await page.goto(`${BASE}/${locale}${tripRegionPath(region, locale)}#planner`, {
      waitUntil: 'domcontentloaded',
    });
    // The Suspense fallback draws the same planner with its buttons off.
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-trip-planner]').length === 1 &&
        !document.querySelector('[data-trip-planner] > button:disabled'),
      null,
      { timeout: 60_000 }
    );
    // The head's „Reise planen“: the planner's own button is hidden while the hub shows chapter 01.
    // Pressed before the head has hydrated it only follows its `#planner`, so press again.
    const wizard = page.locator(WIZARD);
    for (let i = 0; i < 4 && !(await wizard.count()); i++) {
      await page.locator('a[data-landing-action]').first().click();
      await wizard.waitFor({ timeout: 5000 }).catch(() => {});
    }
    await wizard.waitFor();
    const planned = () =>
      wizard
        .locator('[data-plan-ribbon] p .font-semibold')
        .waitFor({ timeout: PLAN_TIMEOUT })
        .then(() => page.waitForTimeout(800));

    // 1 · The dates: the trip picked in the grid, under the month chips.
    await (await showDate(wizard, trip.from)).click();
    await (await showDate(wizard, trip.to)).click();
    await planned();
    await page.mouse.move(0, 0);
    if (SHOTS.includes(1)) await save(page, await wizard.boundingBox(), file(1));

    // 2 · The question with „Skip“ in the footer.
    await page.setViewportSize(SHORT_DESK);
    for (let i = 0; i < 5 && !(await wizard.locator(trip.question).count()); i++) {
      await wizard.locator('[data-wizard-next]').click();
      await page.waitForTimeout(400);
    }
    await wizard.locator(trip.question).waitFor({ timeout: 10_000 });
    if (trip.answer) await wizard.locator(trip.answer).click();
    await planned();
    await page.mouse.move(0, 0);
    if (SHOTS.includes(2)) await save(page, await wizard.boundingBox(), file(2));

    // 3 · The plan, its day cards around the first free day.
    await wizard.locator('[data-wizard-show-plan]').click();
    await wizard.waitFor({ state: 'detached' });
    await page.setViewportSize(DESK);
    await page.locator('[data-plan-day-card]').first().waitFor({ timeout: PLAN_TIMEOUT });
    // Read once: the swap mode takes the day cards' place.
    const frame = await page.locator('[data-plan-view="agenda"]').boundingBox();
    // Parky's ideas are asked once the plan is on screen.
    const ideas = page.locator('[data-plan-ideas]');
    await ideas.waitFor({ timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.mouse.move(0, 0);
    const rest = page.locator('[data-plan-day="rest"]').first();
    if (SHOTS.includes(3)) {
      const clip = (await rest.count())
        ? await planCut(page, frame, rest, 0.35)
        : await planCut(page, frame, page.locator('[data-plan-day-card]').first());
      await save(page, clip, file(3));
    }

    // 4 · Changing it: Parky's ideas over the plan, else a park day's swap mode.
    if (SHOTS.includes(4)) {
      let top = page.locator('[data-plan-head]').first();
      if (!(await ideas.count())) {
        console.log(`  · ${region}/${locale}: no ideas, the swap mode instead`);
        await page
          .locator('[data-plan-day-card="park"]')
          .first()
          .locator('[data-plan-day-actions] button')
          .filter({ has: page.locator('svg.lucide-arrow-left-right') })
          .click();
        top = page.locator('[data-plan-swap-mode]');
        await top.waitFor();
      }
      await page.mouse.move(0, 0);
      await save(page, await planCut(page, frame, top), file(4));
    }
  } finally {
    await context.close();
  }
}

/** The hub calendar's desk grid, drawn from `lg`. */
const CALENDAR_GRID = `section#${TRIP_CALENDAR_ID} table[role="grid"]`;

/**
 * The Orlando trip-planner post's screenshots (`--post`), keyed by media id, each from the trip the
 * post's text walks through: the ten days of 5 to 14 December 2026 with the big seven, the UK
 * family's Combo Ticket from 6 February 2027, and the hub's calendar as it stands on the day.
 * `query` is the plan's `/orlando` query (the one the page writes after the clicks the post
 * describes), `width` the window the shot is taken at, `anchor` the chapter it opens on (the
 * planner's by default) and `ready` what it waits for.
 */
const POST_SHOTS = {
  // „Noch keine Tickets“: the plan's ticket card under the days. Below `lg` the result is one
  // column and the card is wide enough for its tickets side by side; from `lg` it is the 340 px
  // column on the left.
  'tickets-vorschlag': {
    query: 'from=2026-12-05&to=2026-12-14',
    width: 1000,
    shoot: shootSuggestion,
  },
  // „Tickets, die du schon hast“: the assistant's Tickets step with both 14-day tickets in it.
  'tickets-uk': {
    query:
      'from=2027-02-06&to=2027-02-23&tickets=wdw-uk-14-day-magic@2027-02-06,uor-uk-three-park-adventure@2027-02-06',
    width: 1024,
    shoot: shootTicketStep,
  },
  // „Disney-Tag 2 von 4“: the week with both suggestions taken and the hopper on Disney's, at a
  // desk whose day column fits „Universal-Tag 1 von 3“ on one line.
  // „Alle Parks von Orlando in einem Kalender“: chapter 02 of the hub without a plan, the first
  // week from today with the week chips, the „Bester Park“ row and every park's tiles. At `lg` the
  // grid's seven columns fit without scrolling sideways.
  'orlando-kalender': {
    anchor: TRIP_CALENDAR_ID,
    ready: CALENDAR_GRID,
    width: 1024,
    shoot: shootCalendar,
  },
  wochenansicht: {
    query:
      'from=2026-12-05&to=2026-12-14&blocks=1&tickets=uor-date-based.3@2026-12-06,wdw-date-based.4.h@2026-12-10',
    width: 1536,
    view: 'week',
    shoot: shootWeek,
  },
};
const POST_IDS = arg('shot')?.split(',') ?? Object.keys(POST_SHOTS);
/** The margin a post shot keeps around what it frames, in CSS px: the page's own gutter. */
const GUTTER = 16;

/** Every image in the window decoded, so a block's photo is not caught half drawn. */
async function imagesLoaded(page) {
  await page.waitForFunction(
    () =>
      [...document.images].every((img) => {
        const box = img.getBoundingClientRect();
        const shown = box.bottom > 0 && box.top < innerHeight && box.width > 0;
        return !shown || (img.complete && img.naturalWidth > 0);
      }),
    null,
    { timeout: 30_000 }
  );
  await page.waitForTimeout(800);
}

/**
 * `from` to `to` of the plan's column, scrolled so the cut stands under the header, in a window
 * tall enough for it, `lead` px above `from`, with nothing floating over it.
 */
async function columnCut(page, from, to, lead = GUTTER) {
  await hideFixed(page);
  const span = async () => {
    const top = await from.boundingBox();
    const bottom = await to.boundingBox();
    const x = Math.min(top.x, bottom.x) - GUTTER;
    const right = Math.max(top.x + top.width, bottom.x + bottom.width) + GUTTER;
    const y = top.y - lead;
    return { x, y, width: right - x, height: bottom.y + bottom.height + GUTTER - y };
  };
  const first = await span();
  const { width } = page.viewportSize();
  await page.setViewportSize({ width, height: Math.ceil(first.height) + BELOW_HEADER + GUTTER });
  await page.waitForTimeout(300);
  await page.evaluate((dy) => window.scrollBy(0, dy), (await span()).y - BELOW_HEADER);
  await page.waitForTimeout(500);
  return span();
}

/**
 * The suggested tickets, from the departure under the last day to the card's foot; the lead stops
 * short of the last day card's edge.
 */
async function shootSuggestion(page) {
  const card = page.locator('[data-plan-tickets-card]').filter({ visible: true }).first();
  await card.waitFor({ timeout: PLAN_TIMEOUT });
  return columnCut(
    page,
    page.locator('[data-plan-view="agenda"] [data-plan-day]').last(),
    card,
    10
  );
}

/** The assistant opened on its Tickets step from the answers over the plan, the step's body. */
async function shootTicketStep(page) {
  await page.locator('[data-plan-tickets-card]').filter({ visible: true }).first().waitFor();
  // Tickets is the last of Orlando's answers.
  await page.locator('[data-plan-answers] button').last().click();
  const wizard = page.locator(WIZARD);
  await wizard.locator('[data-plan-tickets] [data-ticket-window]').nth(1).waitFor();
  await page.waitForTimeout(1500);
  const stage = await wizard.boundingBox();
  const answers = await wizard.locator('[data-wizard-tickets]').first().boundingBox();
  const step = await wizard.locator('[data-plan-tickets]').boundingBox();
  const y = answers.y - GUTTER;
  // Inside the stage's border.
  return { x: stage.x + 1, y, width: stage.width - 2, height: step.y + step.height + GUTTER - y };
}

/** The hub's calendar chapter, from its heading to the foot of the desk grid. */
async function shootCalendar(page) {
  const chapter = page.locator(`section#${TRIP_CALENDAR_ID}`);
  return columnCut(page, chapter, page.locator(CALENDAR_GRID));
}

/** The week view with its switch, the first page of the trip. */
async function shootWeek(page) {
  const week = page.locator('[data-plan-view="week"]');
  await week.locator('[data-plan-ticket-day]').first().waitFor({ timeout: PLAN_TIMEOUT });
  const views = week.locator('xpath=..');
  return columnCut(page, views, views);
}

/** One of the post's shots in one language. */
async function shootPost(browser, id, locale) {
  const shot = POST_SHOTS[id];
  const context = await browser.newContext({
    viewport: { width: shot.width, height: 2000 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    locale,
    reducedMotion: 'reduce',
  });
  await context.addInitScript((view) => {
    try {
      localStorage.setItem('parkfan_orlando_view', view);
      localStorage.setItem('theme', 'light');
      sessionStorage.setItem('parkfan:assistant-muted', '1');
    } catch {}
  }, shot.view ?? 'agenda');
  const page = await context.newPage();
  try {
    const query = shot.query ? `?${shot.query}` : '';
    const anchor = shot.anchor ?? 'planner';
    await page.goto(`${BASE}/${locale}${tripRegionPath('orlando', locale)}${query}#${anchor}`, {
      waitUntil: 'domcontentloaded',
    });
    await page
      .locator(shot.ready ?? '[data-plan-head]')
      .first()
      .waitFor({ timeout: PLAN_TIMEOUT });
    const clip = await shot.shoot(page);
    await imagesLoaded(page);
    // Parky's button can mount after the cut was set.
    await hideFixed(page);
    await page.mouse.move(0, 0);
    await save(page, clip, path.join(OUT, `${id}-${locale}.webp`));
  } finally {
    await context.close();
  }
}

const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);
let failed = 0;
const jobs = POST
  ? POST_IDS.flatMap((id) =>
      LOCALES.map((locale) => [id, locale, () => shootPost(browser, id, locale)])
    )
  : REGIONS.flatMap((region) =>
      LOCALES.map((locale) => [region, locale, () => walk(browser, region, locale)])
    );
for (const [what, locale, run] of jobs) {
  console.log(`${what} · ${locale}`);
  try {
    await run();
  } catch (error) {
    failed++;
    console.error(`  ✗ ${what}/${locale}: ${error.message.split('\n')[0]}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
