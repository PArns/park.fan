#!/usr/bin/env node
/**
 * Assert that every page type says in its markup what each part of it is.
 *
 * Rules: docs/rules/the-markup-says-what-each-part-is.md and
 * docs/rules/the-chrome-is-in-the-first-html-in-reading-order.md. The audit behind them is
 * docs/seo/semantic-html.md: on 2026-10-27 the site header and footer stood after `</main>` in a
 * `<div hidden>`, a blog post's `<h1>` stood outside its `<article>`, every page carried seven to
 * twelve `<nav>` landmarks (two of them "Breadcrumb", in English on every locale) and the
 * footer's 45 links sat in no list. None of it was visible and none of it broke a build.
 *
 * Two passes per page:
 *
 *   1. The HTML as served, read as text, which is what a crawler without JavaScript gets:
 *      - the site `<header>` comes before `<main>`, the site `<footer>` after `</main>`;
 *      - neither sits inside a streamed `<div hidden id="S:…">`.
 *   2. The DOM after hydration:
 *      - exactly one `<h1>`, inside `<main>`;
 *      - no heading in `<main>` skips a level (an `<h2>` followed by an `<h4>`);
 *      - every `<nav>` has a name, and no two share one;
 *      - a `<nav>` with more than one link holds them in a `<ul>` or `<ol>`;
 *      - every `<article>` in `<main>` that holds text has a heading;
 *      - every `<time>` has a `datetime`;
 *      - no `itemscope` without an `itemprop` under it (JSON-LD describes the page);
 *      - no `id` twice;
 *      - every `<img>` has an `alt`, and the skip link's target exists.
 *
 * Exceptions waiting on a decision are listed in `OPEN` and printed, never passed in silence.
 *
 * Needs a running site (`pnpm build && pnpm start`, or `pnpm dev`):
 *
 *     pnpm check:semantic-html
 *     pnpm check:semantic-html --base=http://localhost:3204
 */
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

/** `localhost`, not `127.0.0.1`: see BASE in scripts/measure-cls.mjs. */
const BASE = flag('base', process.env.BASE ?? 'http://localhost:3000').replace(/\/$/, '');
/** Same fallback as scripts/check-landing-pages.mjs. */
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};
const SETTLE_MS = Number(flag('settle', '1500'));

const EP = '/de/parks/europe/germany/rust/europa-park';
const PH = '/de/parks/europe/germany/bruehl/phantasialand';

/** One URL per page type, German, plus the English homepage and post for a second locale. */
const PAGES = [
  '/de',
  '/en',
  '/de/blog',
  '/de/blog/category/guides',
  '/de/blog/tag/wartezeiten',
  '/de/blog/authors/patrick',
  '/de/blog/europa-park-oder-phantasialand',
  '/en/blog/europa-park-or-phantasialand',
  '/de/news',
  '/de/parks',
  '/de/parks/europe',
  '/de/parks/europe/germany',
  EP,
  `${EP}/silver-star`,
  `${EP}/wartezeiten-kalender`,
  `${PH}/durchschnittliche-wartezeiten`,
  `${PH}/mit-kindern`,
  '/de/parks/north-america/united-states/santa-clarita/six-flags-magic-mountain/x2',
  '/de/glossar',
  '/de/glossar/rope-drop',
  '/de/beste-reisezeit',
  '/de/tagesplaner',
  '/de/so-funktioniert-park-fan',
  '/de/fancast',
  '/de/contribute',
  '/de/compare',
];

/**
 * Known exceptions, printed as `open` on every run. `match` is a selector for the element the
 * rule would fail on; `rule` names the rule it is excused from.
 *
 * @type {{ rule: string, match: string, why: string }[]}
 */
const OPEN = [
  {
    rule: 'heading-skip',
    match: '.blog-content :is(article, [data-park-card-row]) h3',
    why: 'a spotlight card (`?full`) in a post’s lead names itself with the card’s <h3> before the first `##`; where the card stands is the author’s call',
  },
  {
    rule: 'nav-list',
    match: 'nav[data-ride-nav-tiles]',
    why: 'the ride page’s section tiles are grid cells whose hairlines are drawn by the cells themselves; a list item between grid and link needs its own design pass',
  },
];

/** The newest news post, so the check does not pin a slug that ages out of the listing. */
async function newestNewsPath(page) {
  await page.goto(`${BASE}/de/news`, { waitUntil: 'load' });
  return page.evaluate(() => {
    const a = [...document.querySelectorAll('main a[href^="/de/news/"]')].find(
      (x) => !/\/news\/(page|category)\//.test(x.getAttribute('href'))
    );
    return a ? a.getAttribute('href') : null;
  });
}

function checkServedHtml(html) {
  const problems = [];
  const header = html.indexOf('<header');
  const main = html.indexOf('<main');
  const mainEnd = html.lastIndexOf('</main>');
  const footer = html.search(/<footer[^>]*role="contentinfo"/);
  const firstHole = html.indexOf('<div hidden id="S:');
  if (header < 0 || main < 0) problems.push('no <header> or no <main> in the served HTML');
  else if (header > main) problems.push('site <header> after <main> in the served HTML');
  if (firstHole >= 0 && header > firstHole) problems.push('site <header> inside a streamed hole');
  if (footer < 0) problems.push('no site <footer> in the served HTML');
  else {
    if (footer < mainEnd) problems.push('site <footer> before </main> in the served HTML');
    if (firstHole >= 0 && footer > firstHole) problems.push('site <footer> inside a streamed hole');
  }
  return problems;
}

const inspect = (page, open) =>
  page.evaluate((open) => {
    const problems = [];
    const openHits = [];
    const excused = (rule, el) => {
      const i = open.findIndex((o) => o.rule === rule && el.matches(o.match));
      if (i >= 0) openHits.push(i);
      return i >= 0;
    };
    const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);

    const h1 = [...document.querySelectorAll('h1')];
    if (h1.length !== 1) problems.push(`${h1.length} <h1>, want 1`);
    else if (!h1[0].closest('main')) problems.push('the <h1> is outside <main>');

    let prev = 0;
    for (const h of document.querySelectorAll(
      'main h1, main h2, main h3, main h4, main h5, main h6'
    )) {
      const level = Number(h.tagName[1]);
      if (prev && level > prev + 1 && !excused('heading-skip', h)) {
        problems.push(`h${prev} → h${level} "${text(h)}"`);
      }
      prev = level;
    }

    const names = new Map();
    for (const nav of document.querySelectorAll('nav')) {
      const name =
        nav.getAttribute('aria-label') ||
        (nav.getAttribute('aria-labelledby') &&
          text(document.getElementById(nav.getAttribute('aria-labelledby')) ?? nav));
      if (!name) {
        problems.push(`<nav> without a name ("${text(nav)}")`);
        continue;
      }
      names.set(name, (names.get(name) ?? 0) + 1);
      const links = nav.querySelectorAll('a[href]').length;
      if (links > 1 && !nav.querySelector('ul, ol') && !excused('nav-list', nav)) {
        problems.push(`<nav> "${name}" holds ${links} links in no list`);
      }
    }
    for (const [name, n] of names) if (n > 1) problems.push(`${n} <nav> named "${name}"`);

    for (const article of document.querySelectorAll('main article')) {
      if (!text(article)) continue; // a skeleton holding a card's box
      if (!article.querySelector('h1, h2, h3, h4, h5, h6')) {
        problems.push(`<article> without a heading ("${text(article)}")`);
      }
    }

    const undated = document.querySelectorAll('time:not([datetime])').length;
    if (undated) problems.push(`${undated} <time> without datetime`);

    for (const scope of document.querySelectorAll('[itemscope]')) {
      if (!scope.querySelector('[itemprop]')) {
        problems.push(`empty itemscope ${scope.getAttribute('itemtype') ?? ''}`);
      }
    }

    const ids = new Map();
    for (const el of document.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) ?? 0) + 1);
    for (const [id, n] of ids) if (n > 1) problems.push(`id "${id}" ${n} times`);

    const noAlt = document.querySelectorAll('img:not([alt])').length;
    if (noAlt) problems.push(`${noAlt} <img> without alt`);

    const skip = document.querySelector('body a[href^="#"]');
    const target = skip && document.getElementById(skip.getAttribute('href').slice(1));
    if (!target || target.tagName !== 'MAIN') problems.push('no skip link to <main>');

    return { problems, openHits, navs: names.size };
  }, open);

const browser = await chromium.launch(LAUNCH);
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const probe = await ctx.newPage();
const news = await newestNewsPath(probe);
await probe.close();
const pages = news ? [...PAGES, news] : PAGES;

let failures = 0;
const openSeen = OPEN.map(() => 0);
for (const path of pages) {
  const page = await ctx.newPage();
  let problems = [];
  let detail = '';
  try {
    const served = await fetch(`${BASE}${path}`);
    if (served.status !== 200) {
      problems = [`HTTP ${served.status}`];
    } else {
      problems.push(...checkServedHtml(await served.text()));
      await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
      await page.waitForTimeout(SETTLE_MS);
      const s = await inspect(page, OPEN);
      problems.push(...s.problems);
      s.openHits.forEach((i) => openSeen[i]++);
      detail = `${s.navs} nav${s.openHits.length ? `, ${s.openHits.length} open` : ''}`;
    }
  } catch (err) {
    problems = [err.message.split('\n')[0]];
  }
  if (problems.length) failures++;
  console.log(
    `${problems.length ? '✗' : '✓'} ${path}  ${problems.length ? problems.join('; ') : detail}`
  );
  await page.close();
}
await browser.close();

if (openSeen.some(Boolean)) console.log('');
OPEN.forEach((o, i) => {
  if (openSeen[i]) console.log(`open: ${o.rule} on ${openSeen[i]} page(s), ${o.match} — ${o.why}`);
});

if (failures) {
  console.error(
    `\n${failures} of ${pages.length} pages do not say what their parts are.\n` +
      'See docs/rules/the-markup-says-what-each-part-is.md.'
  );
  process.exit(1);
}
console.log(`\n${pages.length} of ${pages.length} pages say what their parts are.`);
