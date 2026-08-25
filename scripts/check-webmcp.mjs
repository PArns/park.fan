#!/usr/bin/env node
/**
 * Assert that park.fan's WebMCP tools register in a browser, answer, and refuse what they
 * should refuse.
 *
 * The API this exercises (`navigator.modelContext`) ships in no browser yet — it is behind an
 * origin trial in Chrome — so the tools would otherwise be code that nothing on the way to
 * production ever runs. A typo in a tool name, a schema the page never validates, a `fetch`
 * against a route that moved: all of it would sit there green until an agent found it. So this
 * installs the stub the page is written against, before any script runs, and then does what an
 * agent would do.
 *
 * What it checks, per tool:
 *   1. it registered at all, with a description and an input schema;
 *   2. calling it comes back with the shape the description promises;
 *   3. the navigation tool refuses `/admin` and refuses another origin.
 *
 * The third one is the reason this file gates a release rather than being a manual look. The
 * back office is fenced off in four places (robots.txt, an X-Robots-Tag, the layout's noindex,
 * and this tool's own guard) and this is the only one of them an agent can walk into.
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:webmcp
 *     BASE=http://localhost:3000 pnpm check:webmcp
 */

import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
// Same rule as the other browser scripts: prefer a Chromium the image already ships.
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

/** The slice of the WebMCP surface the page uses, recorded so the test can call back into it. */
const STUB = () => {
  const registered = new Map();
  Object.defineProperty(navigator, 'modelContext', {
    configurable: true,
    value: {
      registerTool(tool) {
        registered.set(tool.name, tool);
        return Promise.resolve();
      },
    },
  });
  window.__webmcp = {
    list: () =>
      [...registered.values()].map((t) => ({
        name: t.name,
        description: t.description,
        schema: t.inputSchema,
        readOnly: t.annotations?.readOnlyHint === true,
      })),
    call: (name, input) =>
      registered.get(name).execute(input, { signal: new AbortController().signal }),
  };
};

const browser = await chromium.launch(
  existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
);
const page = await browser.newPage();
await page.addInitScript(STUB);

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

await page.goto(`${BASE}/en`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.waitForFunction(() => (window.__webmcp?.list() ?? []).length > 0, null, {
  timeout: 60_000,
});

const tools = await page.evaluate(() => window.__webmcp.list());
const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
console.log(`\n${tools.length} tool(s) registered on ${BASE}/en\n`);

for (const name of ['search_theme_parks', 'get_park_wait_times', 'open_park_fan_page']) {
  const tool = byName[name];
  check(`${name} registered`, !!tool);
  if (!tool) continue;
  check(`${name} describes itself`, tool.description.length > 40);
  check(`${name} has an object input schema`, tool.schema?.type === 'object');
}

// A read-only annotation is what lets an agent run a tool without asking a person first.
check(
  'the two data tools are annotated read-only',
  byName.search_theme_parks?.readOnly === true && byName.get_park_wait_times?.readOnly === true
);

const search = await page.evaluate(() =>
  window.__webmcp.call('search_theme_parks', { query: 'Europa-Park' })
);
check(
  'search_theme_parks finds Europa-Park',
  search.results?.some((r) => /europa-park/.test(r.url ?? '')),
  `${search.results?.length ?? 0} result(s)`
);

const waits = await page.evaluate(() =>
  window.__webmcp.call('get_park_wait_times', { park: 'Europa-Park' })
);
check('get_park_wait_times names the park', /Europa-Park/i.test(waits.park ?? ''), waits.error);
check(
  'get_park_wait_times returns rides with a status',
  Array.isArray(waits.rides) && waits.rides.length > 0 && waits.rides.every((r) => r.status),
  `${waits.rides?.length ?? 0} rides, ${waits.ridesOpen} open`
);
check(
  'get_park_wait_times sorts the longest queue first',
  (waits.rides ?? []).every(
    (ride, i, all) => i === 0 || (all[i - 1].waitMinutes ?? -1) >= (ride.waitMinutes ?? -1)
  )
);

const admin = await page.evaluate(() =>
  window.__webmcp.call('open_park_fan_page', { url: '/admin/parks' })
);
check('open_park_fan_page refuses /admin', !!admin.error && !admin.navigatedTo, admin.error);

const offsite = await page.evaluate(() =>
  window.__webmcp.call('open_park_fan_page', { url: 'https://example.com/' })
);
check('open_park_fan_page refuses another origin', !!offsite.error && !offsite.navigatedTo);

const opened = await page.evaluate(() =>
  window.__webmcp.call('open_park_fan_page', { url: '/en/parks' })
);
check('open_park_fan_page navigates', !!opened.navigatedTo, opened.navigatedTo ?? opened.error);
await page.waitForURL(/\/parks$/, { timeout: 30_000 }).catch(() => {});
check('the tab actually moved', /\/parks$/.test(page.url()), page.url());

await browser.close();
console.log(failures === 0 ? '\nAll WebMCP checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
