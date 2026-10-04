#!/usr/bin/env node
/**
 * Assert that every landing page keeps the anatomy of docs/product/landing-pages.md.
 *
 * Rule: docs/rules/a-landing-page-has-one-anatomy.md. Eight hero implementations for twelve
 * pages is what happens when nothing reads the pages after they are built; PAR-677 to PAR-680
 * put them on one head, one action and one closing step, and this is the check that keeps them
 * there. It reads the rendered DOM after hydration, so a client component that adds a second
 * `<h1>` or drops the action counts as much as the server markup does.
 *
 * Per page:
 *
 *   1. exactly one `<h1>`;
 *   2. the head of its kind: one `[data-landing-hero="hub"]` on a hub, one
 *      `[data-landing-hero="compact"]` on a tool page, none on a park audience page (it opens
 *      with the park's own chrome);
 *   3. on a hub, exactly one `[data-landing-action]` inside the hero — none on the blog index,
 *      where the list is the action;
 *   4. a `FAQPage` in the JSON-LD only beside a rendered `FaqList` (`[data-faq-list]`), and a
 *      rendered `FaqList` only with its `FAQPage`;
 *   5. no bare `<h2>`: each one sits inside a `ChapterHeading` (`[data-chapter-heading]`), a card
 *      (`[data-slot="card"]`, `[data-glass-card]`, or `[data-card]` on a card built by hand) or the
 *      `LandingNextSteps` band (`[data-landing-next]`), or is a news day label
 *      (`[data-news-day]`). Only `<main>` is read: header, footer and
 *      dialogs are not the page. The ones listed in `OPEN` are printed, not failed.
 *
 * The German URL of every page in concept §1, plus the English URL of each hub. The kind of each
 * page is written here, not read from the page, so a page that lost its head fails instead of
 * passing as another kind.
 *
 * Needs a running site (`pnpm build && pnpm start`):
 *
 *     pnpm check:landing-pages
 *     pnpm check:landing-pages --base=http://localhost:3204
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

/** `localhost`, not `127.0.0.1`: see BASE in scripts/measure-cls.mjs. */
const BASE = flag('base', process.env.BASE ?? 'http://localhost:3000').replace(/\/$/, '');
/** Same fallback as scripts/check-header-reach.mjs and check-card-framing.mjs. */
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};
/** Hydration, `Reveal` and the deferred client sections settle. */
const SETTLE_MS = Number(flag('settle', '1500'));

const PARK = '/de/parks/europe/germany/bruehl/phantasialand';

/** [path, kind, primary action expected in the hero] — docs/product/landing-pages.md §1 and §4. */
const PAGES = [
  ['/de/beste-reisezeit', 'hub', true],
  ['/de/tagesplaner', 'hub', true],
  ['/de/so-funktioniert-park-fan', 'hub', true],
  ['/de/fancast', 'hub', true],
  ['/de/blog', 'hub', false],
  ['/en/best-time-to-visit', 'hub', true],
  ['/en/trip-planner', 'hub', true],
  ['/en/how-park-fan-works', 'hub', true],
  ['/en/fancast', 'hub', true],
  ['/en/blog', 'hub', false],
  ['/de/contribute', 'tool'],
  ['/de/news', 'tool'],
  ['/de/glossar', 'tool'],
  [`${PARK}/mit-kindern`, 'park'],
  [`${PARK}/durchschnittliche-wartezeiten`, 'park'],
];

/**
 * Where an `<h2>` may stand on a landing page: a `ChapterHeading`, a card (`Card`, `GlassCard`,
 * or a card built by hand whose root says so with `data-card`), the `LandingNextSteps` band, or
 * a day label of the news timeline.
 */
const H2_HOMES = [
  '[data-chapter-heading]',
  '[data-slot="card"]',
  '[data-glass-card]',
  '[data-card]',
  '[data-landing-next]',
  // The news index's day labels (`data-news-day`): date headings structure a timeline; they are
  // not chapters.
  '[data-news-day]',
].join(',');

/**
 * Bare `<h2>`s that wait for a design decision rather than a heading swap. They are printed on
 * every run as `open`, never passed in silence; an entry goes when its headings are decided.
 * Empty since PAR-688 (the bottom sections open with `ChapterHeading`, the news day labels are
 * an allowed home). Each entry is `{ match, why }`; a Playwright selector may use `:has()`, it is
 * not a stylesheet (no-has-selector rule).
 *
 * @type {{ match: string, why: string }[]}
 */
const OPEN = [];

const inspect = (page, homes, open) =>
  page.evaluate(
    ({ homes, open }) => {
      const types = new Set();
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        const t = node['@type'];
        for (const v of Array.isArray(t) ? t : [t]) if (typeof v === 'string') types.add(v);
        for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
      };
      let badJson = 0;
      for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          walk(JSON.parse(s.textContent));
        } catch {
          badJson++;
        }
      }

      // Only `<main>`: the site header, the footer and dialog portals are the chrome every page
      // shares, not the page.
      const text = (h) => (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const bareH2 = [];
      const openH2 = open.map(() => 0);
      for (const h of document.querySelectorAll('main h2')) {
        if (h.closest(homes)) continue;
        const known = open.findIndex((o) => h.matches(o.match));
        if (known >= 0) openH2[known]++;
        else bareH2.push(text(h));
      }

      const heroes = [...document.querySelectorAll('[data-landing-hero]')];
      return {
        h1: document.querySelectorAll('h1').length,
        hub: document.querySelectorAll('[data-landing-hero="hub"]').length,
        compact: document.querySelectorAll('[data-landing-hero="compact"]').length,
        actions: heroes.reduce((n, h) => n + h.querySelectorAll('[data-landing-action]').length, 0),
        faqPage: types.has('FAQPage'),
        faqList: document.querySelectorAll('[data-faq-list]').length,
        badJson,
        bareH2,
        openH2,
      };
    },
    { homes, open }
  );

function verdict(kind, wantsAction, s) {
  const problems = [];
  if (s.h1 !== 1) problems.push(`${s.h1} <h1>, want 1`);

  const want = { hub: [1, 0], tool: [0, 1], park: [0, 0] }[kind];
  if (s.hub !== want[0] || s.compact !== want[1]) {
    problems.push(
      `head: ${s.hub} hub + ${s.compact} compact, want ${want[0]} hub + ${want[1]} compact (${kind} page)`
    );
  }
  if (kind === 'hub') {
    const n = wantsAction ? 1 : 0;
    if (s.actions !== n) problems.push(`${s.actions} [data-landing-action] in the hero, want ${n}`);
  }

  if (s.faqPage && s.faqList === 0) problems.push('FAQPage in the JSON-LD but no FaqList rendered');
  if (!s.faqPage && s.faqList > 0) problems.push('FaqList rendered but no FAQPage in the JSON-LD');
  if (s.badJson) problems.push(`${s.badJson} JSON-LD block(s) that do not parse`);

  for (const text of s.bareH2) problems.push(`bare <h2> "${text}"`);
  return problems;
}

const browser = await chromium.launch(LAUNCH);
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
let failures = 0;
const openSeen = OPEN.map(() => 0);

for (const [path, kind, wantsAction = false] of PAGES) {
  const page = await ctx.newPage();
  let problems;
  let detail = '';
  try {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    if (!res || res.status() !== 200) {
      problems = [`HTTP ${res?.status() ?? 'no response'}`];
    } else {
      await page.waitForTimeout(SETTLE_MS);
      const s = await inspect(page, H2_HOMES, OPEN);
      problems = verdict(kind, wantsAction, s);
      const open = s.openH2.reduce((a, b) => a + b, 0);
      s.openH2.forEach((n, i) => (openSeen[i] += n));
      detail = `h1 ${s.h1}, ${kind === 'park' ? 'park chrome' : `${s.hub ? 'hub' : 'compact'} head`}${
        kind === 'hub' ? `, ${s.actions} action` : ''
      }${s.faqPage ? ', FAQPage + FaqList' : ''}${open ? `, ${open} open <h2>` : ''}`;
    }
  } catch (err) {
    problems = [err.message.split('\n')[0]];
  }
  if (problems.length) failures++;
  const mark = problems.length ? '✗' : '✓';
  console.log(
    `${mark} ${kind.padEnd(4)} ${path}  ${problems.length ? problems.join('; ') : detail}`
  );
  await page.close();
}

await browser.close();

if (openSeen.some(Boolean)) console.log('');
OPEN.forEach((o, i) => {
  if (openSeen[i]) console.log(`open: ${openSeen[i]} <h2> in ${o.match} — ${o.why}`);
});

if (failures) {
  console.error(
    `\n${failures} of ${PAGES.length} landing pages break the anatomy.\n` +
      'See docs/rules/a-landing-page-has-one-anatomy.md.'
  );
  process.exit(1);
}
console.log(`\n${PAGES.length} of ${PAGES.length} landing pages keep the anatomy.`);
