#!/usr/bin/env node
/**
 * Assert that everything park.fan tells machines is still there, still parses, and still says
 * the same thing as the code it describes.
 *
 * These documents have no reader inside the site. Nothing renders `/.well-known/api-catalog`,
 * no page imports `/llms.txt`, and a `Link` header is invisible by construction — so the whole
 * surface can rot through a green build and six passing test suites, and the first thing to
 * notice would be an agent getting a 404. That is what this script is for.
 *
 * What it will not let past:
 *   - a well-known document that 404s, or comes back with the wrong media type;
 *   - a skill whose published SHA-256 no longer matches the bytes served (the index is a supply
 *     chain: an agent is entitled to check the digest and throw the skill away);
 *   - a robots.txt that lost its Content-Signal line, or that stopped disallowing /admin;
 *   - an MCP server card promising a tool the server does not list;
 *   - the MCP endpoint failing its own handshake, or a tool that no longer answers;
 *   - a park with no wait-time source being reported as a park with no queues.
 *
 * Needs a running site (`pnpm dev`, or `pnpm start` after a build):
 *
 *     pnpm check:agent-ready
 *     BASE=http://localhost:3000 pnpm check:agent-ready
 */

import { createHash } from 'node:crypto';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const SITE = 'https://park.fan';

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

/** Published URLs are absolute against the live host; fetch the same path here. */
const local = (url) => url.replace(SITE, BASE);

async function get(path, headers = {}) {
  const response = await fetch(local(`${BASE}${path}`), { headers, redirect: 'manual' });
  return {
    status: response.status,
    type: response.headers.get('content-type') ?? '',
    link: response.headers.get('link') ?? '',
    robotsTag: response.headers.get('x-robots-tag') ?? '',
    text: await response.text(),
  };
}

async function rpc(method, params) {
  const response = await fetch(`${BASE}/api/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  return response.status === 202 ? null : await response.json();
}

console.log(`\nagent-readiness of ${BASE}\n`);

// ── robots.txt ───────────────────────────────────────────────────────────────
const robots = await get('/robots.txt');
check('robots.txt serves', robots.status === 200 && robots.type.startsWith('text/plain'));
check(
  'robots.txt declares content signals',
  /^Content-Signal:.*ai-train=/m.test(robots.text),
  robots.text.match(/^Content-Signal:.*$/m)?.[0]
);
check('robots.txt names AI crawlers explicitly', /^User-agent: GPTBot$/m.test(robots.text));
check('robots.txt disallows the back office', /^Disallow: \/admin$/m.test(robots.text));
check('robots.txt points at the capability manifest', /^Agentmap: /m.test(robots.text));
check('robots.txt points at the licence', /^License: .*license\.xml$/m.test(robots.text));
check(
  'robots.txt carries the Content Signals Policy preamble',
  /ARTICLE 4 OF THE EUROPEAN/.test(robots.text)
);

// ── the licence ─────────────────────────────────────────────────────────────
const license = await get('/license.xml');
check('license.xml serves as RSL', license.status === 200 && license.type.includes('rsl+xml'));
check(
  'the licence says what the Content-Signal says',
  /<permits type="usage">search ai-input<\/permits>/.test(license.text) &&
    /<prohibits type="usage">ai-train<\/prohibits>/.test(license.text)
);

// ── the well-known documents ────────────────────────────────────────────────
const catalog = await get('/.well-known/api-catalog');
check(
  'api-catalog serves as a linkset',
  catalog.status === 200 && catalog.type.includes('linkset+json')
);
check('api-catalog names one API', JSON.parse(catalog.text).linkset?.length === 1);

const skillsIndex = await get('/.well-known/agent-skills/index.json');
check('agent-skills index serves', skillsIndex.status === 200);
const skills = JSON.parse(skillsIndex.text).skills ?? [];
check('agent-skills index lists skills', skills.length > 0, `${skills.length} skill(s)`);
for (const skill of skills) {
  const artifact = await fetch(local(skill.url));
  const body = await artifact.text();
  const digest = `sha256:${createHash('sha256').update(body, 'utf8').digest('hex')}`;
  check(
    `skill ${skill.name} serves and matches its digest`,
    artifact.ok && digest === skill.digest
  );
}

const ard = await get('/.well-known/ai-catalog.json');
const ardDoc = ard.status === 200 ? JSON.parse(ard.text) : {};
check('ai-catalog serves', ard.status === 200 && ard.type.includes('application/json'));
check(
  'ai-catalog entries each carry exactly one of url/data',
  (ardDoc.entries ?? []).length > 0 &&
    ardDoc.entries.every((e) => Boolean(e.url) !== Boolean(e.data) && e.identifier && e.type)
);

const llms = await get('/llms.txt');
check('llms.txt serves as text', llms.status === 200 && llms.type.startsWith('text/plain'));
check('llms.txt opens with an H1', llms.text.startsWith('# park.fan'));
check('llms.txt keeps the admin out of bounds', /\/admin/.test(llms.text));

const auth = await get('/auth.md');
check('auth.md serves as markdown', auth.status === 200 && auth.type.includes('text/markdown'));
check('auth.md heading names itself', /^# .*auth\.md/im.test(auth.text));

// ── the homepage Link header ────────────────────────────────────────────────
const home = await get('/en');
check('the homepage advertises the catalog', /rel="api-catalog"/.test(home.link));
const ride = await get('/en/parks');
check('a deeper page does not', !/api-catalog/.test(ride.link));
// A licence is for the crawler that skipped robots.txt, so it rides on every page — including
// the homepage, where a second rule sets the same header key and Next keeps only one value.
check('every page carries the licence link', /rel="license"/.test(ride.link), ride.link);
check('the homepage carries it too', /rel="license"/.test(home.link));

// ── markdown negotiation (edge, not this app) ───────────────────────────────
// Nothing in this repository renders markdown for a page: park.fan answers
// `Accept: text/markdown` because Cloudflare converts the HTML on the way out. So this is
// reported rather than asserted — it is false on localhost by design, and a failure of it in
// production is a dashboard setting, not a commit.
const markdown = await get('/en', { Accept: 'text/markdown' });
console.log(
  `${markdown.type.includes('markdown') ? '✅' : 'ℹ️ '} markdown negotiation — ${markdown.type}` +
    (markdown.type.includes('markdown')
      ? ''
      : ' (added by Cloudflare in production, never locally)')
);

// ── the back office ─────────────────────────────────────────────────────────
const admin = await get('/admin');
check('/admin answers noindex', /noindex/.test(admin.robotsTag), admin.robotsTag);

// ── MCP ─────────────────────────────────────────────────────────────────────
const card = await get('/.well-known/mcp/server-card.json');
const cardDoc = card.status === 200 ? JSON.parse(card.text) : {};
check('mcp server card serves', card.status === 200);
check(
  'server card names the server and a transport',
  Boolean(cardDoc.serverInfo?.name && cardDoc.endpoint)
);

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {} });
check('mcp initialize answers', init?.result?.serverInfo?.name === cardDoc.serverInfo?.name);
const listed = (await rpc('tools/list'))?.result?.tools ?? [];
check('mcp lists tools', listed.length > 0, listed.map((t) => t.name).join(', '));
check(
  'the card promises exactly what the server lists',
  JSON.stringify([...(cardDoc.tools ?? [])].sort()) ===
    JSON.stringify(listed.map((t) => t.name).sort())
);

const call = async (name, args) =>
  (await rpc('tools/call', { name, arguments: args }))?.result?.structuredContent;

const found = await call('search_theme_parks', { query: 'Europa-Park' });
check(
  'search_theme_parks resolves a park to its page',
  (found?.results ?? []).some((r) => /\/parks\/.*europa-park$/.test(r.url ?? ''))
);

const waits = await call('get_park_wait_times', { park: 'Europa-Park' });
check(
  'get_park_wait_times returns rides',
  (waits?.rides ?? []).length > 0,
  `${waits?.ridesOpen}/${waits?.ridesTotal} open`
);

// Hansa-Park publishes wait times only in its own app on the park WLAN. The payload for it is
// indistinguishable from a park shut for the night — every aggregate zero — so a tool that
// reports numbers for it is reporting a park with no queues, which is the one wrong answer this
// whole surface must never give.
const unreadable = await call('get_park_wait_times', { park: 'Hansa-Park' });
check(
  'a park with no wait-time source says so instead of reporting zero',
  unreadable?.waitTimesAvailable === false &&
    unreadable.averageWaitMinutes === undefined &&
    /no numbers exist/i.test(unreadable.note ?? ''),
  unreadable?.note
);

const bestDays = await call('get_park_best_days', { park: 'Europa-Park', days: 5 });
check(
  'get_park_best_days returns a dated forecast',
  (bestDays?.days ?? []).length === 5 &&
    bestDays.days.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date))
);

console.log(
  failures === 0 ? '\nAll agent-readiness checks passed.' : `\n${failures} check(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
