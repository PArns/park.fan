/**
 * Unit tests for the export check on `/admin/system` (`lib/admin/news-export-lag.ts`): which posts
 * of the site the app's export lacks, how long they have waited, counted from the post's date or
 * its arrival on the default branch, whichever is later, and from the deployment where the arrival
 * is unknown, when that turns amber and red, what an unreadable list does, and the verdict's words.
 * Then the arrival lookup (`lib/admin/news-export-arrival.ts`) and the restart
 * (`lib/admin/news-export-run.ts`) against a stand-in for GitHub: the oldest commit and its merge,
 * the cache and the limit per check, the default branch, the answers without a token, for GitHub's
 * refusals and for a start GitHub left open, and a log that never holds the token. Last the routes:
 * the API's two behind `REVALIDATE_SECRET`, the status in the shape the API's schema reads, and the
 * admin's two at their role floors.
 *
 * Run: pnpm test:admin-news-export
 */
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  EXPORT_BEHIND_MINUTES,
  compareExportFeed,
  exportIsLate,
  exportNeedsRun,
  exportRunRefusal,
  exportVerdict,
  parseExportList,
} from '../lib/admin/news-export-lag.ts';
import { ARRIVALS_PER_CHECK, postArrivals } from '../lib/admin/news-export-arrival.ts';
import { startNewsExport } from '../lib/admin/news-export-run.ts';
import { EXPORT_FEEDS, MEDIA_EXPORT_BASE } from '../lib/blog/news-export-feeds.ts';
import { listPosts } from '../lib/blog/listing.ts';
import { withZoneOffset } from '../lib/blog/published-at.ts';
import { POST as runForTheApi } from '../app/api/news-export/run/route.ts';
import { GET as statusForTheApi } from '../app/api/news-export/status/route.ts';
import { GET as reportForTheAdmin } from '../app/api/admin/news-export/route.ts';
import { POST as runForTheAdmin } from '../app/api/admin/news-export/run/route.ts';
import { test, reportPassed } from './lib/run-cases.mjs';

const LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'es'];
const NOW = Date.parse('2026-11-28T12:00:00Z');
const minutesBefore = (minutes) => new Date(NOW - minutes * 60_000).toISOString();
/** Deployed a day ago, so a post's own date decides unless a test says otherwise. */
const DEPLOYED = minutesBefore(24 * 60);

/** One post in every locale: the slug and title carry the locale, as the real files do. */
function post(key, publishedAt) {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      { translationKey: key, slug: `${key}-${locale}`, title: `${key} (${locale})`, publishedAt },
    ])
  );
}

const OLDER = post('winterpause', '2026-11-26T09:00:00+01:00');
const NEWEST = post('hollywood-christmas', '2026-11-28T11:10:00+01:00');

/** The site's posts per locale, newest first. */
function site(...posts) {
  return Object.fromEntries(LOCALES.map((locale) => [locale, posts.map((p) => p[locale])]));
}

/** Every locale's list as one run wrote it, holding these posts. */
function exported(generatedAt, ...posts) {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      {
        state: 'ok',
        generatedAt,
        posts: posts.map(({ [locale]: { slug, title, publishedAt } }) => ({
          slug,
          title,
          publishedAt,
        })),
      },
    ])
  );
}

const compare = (overrides) =>
  compareExportFeed({
    feed: 'news',
    site: site(NEWEST, OLDER),
    exported: exported(minutesBefore(30), NEWEST, OLDER),
    deployedAt: DEPLOYED,
    now: NOW,
    ...overrides,
  });

test('an export holding every post is current', () => {
  const status = compare();
  assert.equal(status.tone, 'ok');
  assert.deepEqual(status.missing, []);
  assert.equal(status.behindMinutes, null);
  assert.equal(status.generatedAt, minutesBefore(30));
  assert.equal(exportVerdict(status), 'aktuell');
  assert.equal(exportNeedsRun([status]), false);
});

test('the newest posts are shown with their German titles', () => {
  const status = compare({ exported: exported(minutesBefore(300), OLDER) });
  assert.equal(status.newestOnSite?.title, 'hollywood-christmas (de)');
  assert.equal(status.newestExported?.title, 'winterpause (de)');
});

test('a post missing for less than an hour is not yet late', () => {
  // 11:10 Berlin is 10:10 UTC, so 110 minutes before noon UTC; the deployment came 30 minutes ago.
  const status = compare({
    exported: exported(minutesBefore(300), OLDER),
    deployedAt: minutesBefore(30),
  });
  assert.equal(status.missing.length, 1);
  assert.deepEqual(status.missing[0].locales, ['de', 'en', 'fr', 'it', 'nl', 'es']);
  assert.equal(status.missing[0].title, 'hollywood-christmas (de)');
  assert.equal(status.behindMinutes, 30);
  assert.equal(status.tone, 'ok');
  assert.equal(exportIsLate(status), false);
  assert.equal(exportVerdict(status), '1 Meldung noch nicht drin');
  assert.equal(exportNeedsRun([status]), false);
});

test('an hour after its date a missing post is late', () => {
  const status = compare({ exported: exported(minutesBefore(300), OLDER) });
  assert.equal(status.behindMinutes, 110);
  assert.equal(status.tone, 'warn');
  assert.equal(exportIsLate(status), true);
  assert.equal(exportVerdict(status), '1 Meldung fehlt');
  assert.equal(exportNeedsRun([status]), true);
});

test('past the push window it is a fault', () => {
  const status = compare({
    site: site(OLDER),
    exported: exported(minutesBefore(4 * 24 * 60)),
  });
  assert.ok(status.behindMinutes >= EXPORT_BEHIND_MINUTES.bad);
  assert.equal(status.tone, 'bad');
});

test('a backdated post counts from its arrival on the default branch', () => {
  const status = compare({
    exported: exported(minutesBefore(300), NEWEST),
    arrivedAt: { winterpause: NOW - 400 * 60_000 },
    deployedAt: minutesBefore(10),
  });
  assert.equal(status.missing[0].translationKey, 'winterpause');
  assert.equal(status.behindMinutes, 400);
  assert.equal(status.tone, 'bad');
});

test('a later deployment does not set a known arrival back', () => {
  // Dated 09:00 Berlin, the last run at 08:00Z without it; merged 08:20Z, deployed 08:30Z, and an
  // unrelated deployment at 14:30Z.
  const fall = post('fall', '2026-11-28T09:00:00+01:00');
  const at = (time) => Date.parse(`2026-11-28T${time}:00Z`);
  for (const deployedAt of ['2026-11-28T08:30:00Z', '2026-11-28T14:30:00Z']) {
    const status = compare({
      site: site(fall, OLDER),
      exported: exported('2026-11-28T08:00:00Z', OLDER),
      arrivedAt: { fall: at('08:20') },
      deployedAt,
      now: at('14:30'),
    });
    assert.equal(status.behindMinutes, 370);
    assert.equal(status.tone, 'bad');
    assert.equal(exportVerdict(status), '1 Meldung fehlt');
  }
});

test('without an arrival a backdated post counts from the deployment', () => {
  const status = compare({
    exported: exported(minutesBefore(300), NEWEST),
    deployedAt: minutesBefore(10),
  });
  assert.equal(status.behindMinutes, 10);
  assert.equal(status.tone, 'ok');
});

test('a post merged before its date counts from its date', () => {
  const status = compare({
    exported: exported(minutesBefore(300), OLDER),
    arrivedAt: { 'hollywood-christmas': NOW - 600 * 60_000 },
  });
  assert.equal(status.behindMinutes, 110);
});

test('an arrival is the clock of its own post only', () => {
  const status = compare({
    exported: exported(minutesBefore(5 * 24 * 60)),
    arrivedAt: { 'hollywood-christmas': NOW - 30 * 60_000 },
    deployedAt: minutesBefore(20),
  });
  // winterpause has none and counts from the deployment, 20 minutes; the other from its arrival.
  assert.equal(status.behindMinutes, 30);
});

test('without a build time the post date alone counts', () => {
  const status = compare({ exported: exported(minutesBefore(300), OLDER), deployedAt: null });
  assert.equal(status.behindMinutes, 110);
});

test('a post dated after its deployment counts from its date', () => {
  // Scheduled: deployed and exported ten hours ago, out at 11:10 today, and no run since.
  const status = compare({
    exported: exported(minutesBefore(600), OLDER),
    deployedAt: minutesBefore(600),
  });
  assert.equal(status.behindMinutes, 110);
});

test('several missing posts count as one each and wait as long as the oldest', () => {
  const status = compare({ exported: exported(minutesBefore(5 * 24 * 60)) });
  assert.deepEqual(
    status.missing.map((m) => m.translationKey),
    ['hollywood-christmas', 'winterpause']
  );
  assert.equal(exportVerdict(status), '2 Meldungen fehlen');
  assert.equal(exportVerdict({ ...status, feed: 'guides' }), '2 Guides fehlen');
});

test('a run that stopped halfway shows its oldest list and the locales it missed', () => {
  const lists = exported(minutesBefore(20), NEWEST, OLDER);
  lists.it = exported(minutesBefore(3000), OLDER).it;
  const status = compare({ exported: lists });
  assert.equal(status.generatedAt, minutesBefore(3000));
  assert.deepEqual(status.missing[0].locales, ['it']);
  assert.equal(status.tone, 'warn');
});

test('a post without German takes the title of its first locale', () => {
  const status = compare({
    site: { ...site(OLDER), en: [NEWEST.en, OLDER.en] },
    exported: exported(minutesBefore(300), OLDER),
  });
  assert.equal(status.missing[0].title, 'hollywood-christmas (en)');
  assert.deepEqual(status.missing[0].locales, ['en']);
});

test('a post only the export holds is not a problem', () => {
  const status = compare({ site: site(OLDER) });
  assert.equal(status.tone, 'ok');
  assert.deepEqual(status.missing, []);
});

test('an unreadable list is a fault and the others are still compared', () => {
  const lists = exported(minutesBefore(30), NEWEST, OLDER);
  lists.fr = { state: 'failed', message: 'HTTP 404' };
  const status = compare({ exported: lists });
  assert.equal(status.tone, 'bad');
  assert.deepEqual(status.unreadable, [{ locale: 'fr', message: 'HTTP 404' }]);
  assert.deepEqual(status.missing, []);
  assert.equal(exportVerdict(status), '1 Sprache nicht lesbar');
  assert.equal(exportNeedsRun([status]), true);
});

test('a locale without a list counts as unreadable', () => {
  const lists = exported(minutesBefore(30), NEWEST, OLDER);
  delete lists.es;
  assert.deepEqual(compare({ exported: lists }).unreadable, [
    { locale: 'es', message: 'nicht gelesen' },
  ]);
});

test('no list at all says so', () => {
  const failed = Object.fromEntries(
    LOCALES.map((locale) => [locale, { state: 'failed', message: 'keine Antwort' }])
  );
  const status = compare({ exported: failed });
  assert.equal(status.generatedAt, null);
  assert.equal(status.newestExported, null);
  assert.equal(status.tone, 'bad');
  assert.equal(exportVerdict(status), 'nicht lesbar');
});

test('the worst feed decides whether a run is the answer', () => {
  const ok = compare();
  const late = compare({ exported: exported(minutesBefore(300), OLDER) });
  assert.equal(exportNeedsRun([ok, ok]), false);
  assert.equal(exportNeedsRun([ok, late]), true);
});

test('an export list parses to its time and posts', () => {
  const reading = parseExportList({
    schema: 1,
    generatedAt: '2026-11-27T16:36:16.407Z',
    locale: 'de',
    posts: [
      { slug: 'a', title: 'A', publishedAt: '2026-11-27T11:10:00+01:00', cover: null },
      { slug: 'b', title: 'B' },
      null,
    ],
  });
  assert.deepEqual(reading, {
    state: 'ok',
    generatedAt: '2026-11-27T16:36:16.407Z',
    posts: [{ slug: 'a', title: 'A', publishedAt: '2026-11-27T11:10:00+01:00' }],
  });
});

test('a list without a time or posts fails', () => {
  const failed = { state: 'failed', message: 'unerwartetes Format' };
  assert.deepEqual(parseExportList(null), failed);
  assert.deepEqual(parseExportList('{}'), failed);
  assert.deepEqual(parseExportList({ generatedAt: 'gestern', posts: [] }), failed);
  assert.deepEqual(parseExportList({ generatedAt: '2026-11-27T16:36:16.407Z' }), failed);
});

test('a refusal GitHub gave no sentence for still names its status', () => {
  assert.deepEqual(exportRunRefusal(500), {
    status: 502,
    answer: { started: false, reason: 'GitHub hat den Start mit Status 500 abgelehnt.' },
  });
});

const TOKEN = 'github_pat_test_only';
const WORKFLOW_PAGE = 'https://github.com/PArns/park.fan/actions/workflows/publish-media.yml';
const GITHUB_API = 'https://api.github.com/repos/PArns/park.fan';

/**
 * Runs `run` against a stand-in for every request it makes, and returns its result, the requests
 * and everything it logged. `answer(url, init)` gives the stand-in's response; `env` replaces the
 * GitHub token, the repository and the bearer secret for the call.
 */
async function against(answer, env, run) {
  const saved = { fetch: globalThis.fetch, env: { ...process.env }, console: { ...console } };
  const requests = [];
  const logged = [];
  for (const key of [
    'BLOG_EDITOR_GITHUB_TOKEN',
    'GITHUB_TOKEN',
    'GITHUB_REPOSITORY',
    'REVALIDATE_SECRET',
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method ?? 'GET', body: init.body ?? null });
    return answer(String(url), init);
  };
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    console[level] = (...args) => logged.push(args.map(String).join(' '));
  }
  try {
    return { result: await run(), requests, logged: logged.join('\n') };
  } finally {
    globalThis.fetch = saved.fetch;
    for (const key of Object.keys(process.env)) if (!(key in saved.env)) delete process.env[key];
    Object.assign(process.env, saved.env);
    Object.assign(console, saved.console);
  }
}

const startAgainst = (answer, env = { BLOG_EDITOR_GITHUB_TOKEN: TOKEN }) =>
  against(answer, env, startNewsExport);

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
/** GitHub's repository answer naming `trunk`, then `dispatch` for the start itself. */
const github = (dispatch) => (url) =>
  url.endsWith('/dispatches') ? dispatch() : json(200, { default_branch: 'trunk' });

/** A commit of a file's history as GitHub lists it. */
const commit = (sha, date) => ({ sha, commit: { committer: { date } } });
/** A pull request as GitHub lists it for a commit. */
const pull = (base, mergedAt) => ({
  merged_at: mergedAt,
  base: { ref: base, repo: { default_branch: 'main' } },
});

/**
 * GitHub for the arrival lookup: per file the commits that touch it, newest first, and per commit
 * the pull requests that brought it.
 */
function arrivalsGithub({ commits = {}, pulls = {}, pages = {} }) {
  return (url) => {
    const { pathname, searchParams } = new URL(url);
    const pulled = pathname.match(/\/commits\/([^/]+)\/pulls$/);
    if (pulled) return json(200, pulls[pulled[1]] ?? []);
    if (pathname.endsWith('/commits')) {
      const file = searchParams.get('path');
      const page = searchParams.get('page');
      if (page) return json(200, pages[file]?.[page] ?? []);
      const link = pages[file]
        ? `<${GITHUB_API}/commits?path=${file}&per_page=100&page=2>; rel="next", <${GITHUB_API}/commits?path=${file}&per_page=100&page=${Object.keys(pages[file]).at(-1)}>; rel="last"`
        : undefined;
      return json(200, commits[file] ?? [], link ? { link } : {});
    }
    return json(404, { message: 'Not Found' });
  };
}

const arrivalsOf = (answer, files, env = { BLOG_EDITOR_GITHUB_TOKEN: TOKEN }) =>
  against(answer, env, () => postArrivals(files));

await test('without a token no arrival is asked for', async () => {
  const { result, requests } = await arrivalsOf(() => json(500, {}), ['content/blog/de/a.md'], {});
  assert.equal(result.size, 0);
  assert.deepEqual(requests, []);
});

await test('a post arrives when the pull request with its first commit merged into the default branch', async () => {
  const file = 'content/blog/de/merged.md';
  const { result, requests } = await arrivalsOf(
    arrivalsGithub({
      commits: {
        [file]: [commit('c3', '2026-11-28T07:10:10Z'), commit('c1', '2026-11-28T06:32:02Z')],
      },
      pulls: {
        c1: [
          pull('release/2026-11-28', '2026-11-28T06:50:00Z'),
          pull('main', '2026-11-28T07:17:51Z'),
        ],
      },
    }),
    [file]
  );
  assert.equal(result.get(file), Date.parse('2026-11-28T07:17:51Z'));
  const listed = new URL(requests[0].url);
  assert.equal(listed.pathname, '/repos/PArns/park.fan/commits');
  assert.equal(listed.searchParams.get('path'), file);
  assert.equal(listed.searchParams.has('sha'), false);
  assert.equal(requests[1].url, `${GITHUB_API}/commits/c1/pulls`);
});

await test('a commit pushed to the default branch arrives with its own time', async () => {
  const file = 'content/blog/de/pushed.md';
  const { result } = await arrivalsOf(
    arrivalsGithub({ commits: { [file]: [commit('p1', '2026-11-27T16:00:00Z')] } }),
    [file]
  );
  assert.equal(result.get(file), Date.parse('2026-11-27T16:00:00Z'));
});

await test('a file with more commits than a page reads its first on the last page', async () => {
  const file = 'content/blog/de/long.md';
  const { result, requests } = await arrivalsOf(
    arrivalsGithub({
      commits: { [file]: [commit('new', '2026-11-28T10:00:00Z')] },
      pages: {
        [file]: {
          2: [],
          3: [commit('mid', '2026-11-20T10:00:00Z'), commit('old', '2026-11-01T10:00:00Z')],
        },
      },
    }),
    [file]
  );
  assert.equal(result.get(file), Date.parse('2026-11-01T10:00:00Z'));
  assert.equal(new URL(requests[1].url).searchParams.get('page'), '3');
});

await test('an arrival read once is kept, a failed read is not', async () => {
  const kept = 'content/blog/de/kept.md';
  const failing = 'content/blog/de/failing.md';
  const answer = (url) =>
    new URL(url).searchParams.get('path') === failing
      ? json(502, { message: 'Bad Gateway' })
      : arrivalsGithub({ commits: { [kept]: [commit('k1', '2026-11-26T09:00:00Z')] } })(url);
  const first = await arrivalsOf(answer, [kept, failing]);
  assert.deepEqual([...first.result.keys()], [kept]);
  assert.match(first.logged, /failing\.md: 502/);
  assert.doesNotMatch(first.logged, new RegExp(TOKEN));
  const again = await arrivalsOf(answer, [kept, failing]);
  assert.equal(again.result.get(kept), Date.parse('2026-11-26T09:00:00Z'));
  assert.deepEqual(
    again.requests.map((request) => new URL(request.url).searchParams.get('path')),
    [failing]
  );
});

await test('a check asks GitHub about a handful of files, the oldest first', async () => {
  const files = [...Array(ARRIVALS_PER_CHECK + 3).keys()].map(
    (i) => `content/blog/de/many-${i}.md`
  );
  const commits = Object.fromEntries(
    files.map((file) => [file, [commit(file, '2026-11-25T08:00:00Z')]])
  );
  const { result, requests } = await arrivalsOf(arrivalsGithub({ commits }), files);
  assert.deepEqual([...result.keys()], files.slice(0, ARRIVALS_PER_CHECK));
  const listed = requests.filter((request) => new URL(request.url).pathname.endsWith('/commits'));
  assert.equal(listed.length, ARRIVALS_PER_CHECK);
});

await test('a file the default branch does not hold has no arrival', async () => {
  const { result } = await arrivalsOf(arrivalsGithub({}), ['content/blog/de/branch-only.md']);
  assert.equal(result.size, 0);
});

await test('without a token nothing is asked and the answer is 503', async () => {
  const { result, requests } = await startAgainst(() => json(500, {}), {});
  assert.equal(result.status, 503);
  assert.equal(result.answer.started, false);
  assert.match(result.answer.reason, /kein GitHub-Token/);
  assert.match(result.answer.reason, /BLOG_EDITOR_GITHUB_TOKEN/);
  assert.deepEqual(requests, []);
});

await test('a start runs the workflow on the default branch, not the base branch', async () => {
  const { result, requests } = await startAgainst(
    github(() => new Response(null, { status: 204 })),
    { BLOG_EDITOR_GITHUB_TOKEN: TOKEN, BLOG_EDITOR_BASE_BRANCH: 'staging' }
  );
  assert.deepEqual(result, {
    status: 200,
    answer: { started: true, workflowUrl: WORKFLOW_PAGE },
  });
  const dispatch = requests.at(-1);
  assert.equal(dispatch.method, 'POST');
  assert.equal(dispatch.url, `${GITHUB_API}/actions/workflows/publish-media.yml/dispatches`);
  assert.deepEqual(JSON.parse(dispatch.body), { ref: 'trunk' });
});

await test('a 403 names the missing Actions permission, and no log holds the token', async () => {
  const { result, logged } = await startAgainst(
    github(() => json(403, { message: 'Resource not accessible by personal access token' }))
  );
  assert.equal(result.status, 502);
  assert.match(result.answer.reason, /\(403\)/);
  assert.match(result.answer.reason, /Actions: Read and write/);
  assert.match(logged, /not started: 403/);
  assert.doesNotMatch(logged, new RegExp(TOKEN));
});

await test('a 404 says the token cannot reach the repository or the workflow', async () => {
  const { result } = await startAgainst(github(() => json(404, { message: 'Not Found' })));
  assert.equal(result.status, 502);
  assert.match(result.answer.reason, /\(404\)/);
  assert.match(result.answer.reason, /publish-media\.yml/);
});

await test('no answer from GitHub is a 502 that says so', async () => {
  const { result } = await startAgainst(() => {
    throw new TypeError('fetch failed');
  });
  assert.equal(result.status, 502);
  assert.match(result.answer.reason, /nicht geantwortet/);
});

await test('a 5xx before the dispatch is a 502: nothing was sent', async () => {
  const { result } = await startAgainst(() => json(503, { message: 'Unavailable' }));
  assert.equal(result.status, 502);
  assert.equal(result.answer.maybeStarted, undefined);
});

await test('a dispatch answered with a 5xx may have started: 504', async () => {
  const { result, logged } = await startAgainst(
    github(() => json(502, { message: 'Bad Gateway' }))
  );
  assert.equal(result.status, 504);
  assert.equal(result.answer.started, false);
  assert.equal(result.answer.maybeStarted, true);
  assert.match(result.answer.reason, /Status 502/);
  assert.match(result.answer.reason, /kann trotzdem gestartet sein/);
  assert.match(logged, /maybe started: 502/);
});

await test('a dispatch without an answer in time may have started: 504', async () => {
  const { result } = await startAgainst(
    github(() => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    })
  );
  assert.equal(result.status, 504);
  assert.equal(result.answer.maybeStarted, true);
  assert.match(result.answer.reason, /nicht rechtzeitig geantwortet/);
});

const bearer = (url, method, authorization) =>
  new Request(url, { method, headers: authorization ? { authorization } : {} });

await test("the API's run route is shut without the secret and refuses a wrong one", async () => {
  const call = (authorization) =>
    runForTheApi(bearer('https://park.fan/api/news-export/run', 'POST', authorization));
  const shut = await against(
    () => json(500, {}),
    {},
    () => call('Bearer undefined')
  );
  assert.equal(shut.result.status, 503);
  const { result } = await against(
    () => json(500, {}),
    { REVALIDATE_SECRET: 'mcp-test-secret' },
    async () => {
      assert.equal((await call('Bearer wrong')).status, 401);
      assert.equal((await call(undefined)).status, 401);
      return call('Bearer mcp-test-secret');
    }
  );
  assert.equal(result.status, 503);
  assert.match(result.headers.get('cache-control') ?? '', /^no-store/);
  const body = await result.json();
  assert.equal(body.started, false);
  assert.match(body.reason, /kein GitHub-Token/);
});

await test("the API's run route answers a start GitHub left open with 504", async () => {
  const { result } = await against(
    github(() => json(500, { message: 'Server Error' })),
    { REVALIDATE_SECRET: 'mcp-test-secret', BLOG_EDITOR_GITHUB_TOKEN: TOKEN },
    () =>
      runForTheApi(bearer('https://park.fan/api/news-export/run', 'POST', 'Bearer mcp-test-secret'))
  );
  assert.equal(result.status, 504);
  assert.match(result.headers.get('cache-control') ?? '', /^no-store/);
  const body = await result.json();
  assert.deepEqual(Object.keys(body).sort(), ['maybeStarted', 'reason', 'started']);
  assert.equal(body.maybeStarted, true);
});

/**
 * The report as the API's `news_export_status` tool checks it before a field reaches the model:
 * a copy of `newsExportReport` in v4.api.park.fan's `src/mcp/tools/news-export.tools.ts`. A field
 * renamed here fails that check at run time, so it fails here first; change both together.
 */
const HEALTH_TONES = ['ok', 'warn', 'bad', 'unknown'];
const timestamp = z
  .string()
  .max(40)
  .refine((value) => Number.isFinite(Date.parse(value)), 'a timestamp');
const postRef = z.object({
  slug: z.string().max(300),
  title: z.string().max(500),
  publishedAt: z.string().max(40),
});
const apiReportSchema = z.object({
  checkedAt: timestamp,
  deployedAt: timestamp.nullable(),
  workflowUrl: z.url({ protocol: /^https$/ }).max(500),
  feeds: z
    .array(
      z.object({
        feed: z.string().min(1).max(40),
        tone: z.enum(HEALTH_TONES),
        generatedAt: timestamp.nullable(),
        newestExported: postRef.nullable(),
        newestOnSite: postRef.nullable(),
        missing: z
          .array(
            z.object({
              translationKey: z.string().max(300),
              title: z.string().max(500),
              publishedAt: z.string().max(40),
              locales: z.array(z.string().max(10)).max(20),
            })
          )
          .max(2000),
        behindMinutes: z.number().nonnegative().nullable(),
        unreadable: z
          .array(z.object({ locale: z.string().max(10), message: z.string().max(300) }))
          .max(50),
      })
    )
    .max(10),
});

/**
 * media.park.fan as the status route reads it: every feed's list in every locale holds the site's
 * posts of that feed, except that the German news list lacks the newest news post and the French
 * guides list is not there.
 */
function bucket(url) {
  const { pathname } = new URL(url);
  const match = pathname.match(/^\/(\w+)\/(\w+)\.json$/);
  if (!match || !(match[1] in EXPORT_FEEDS)) return json(404, {});
  const [, feed, locale] = match;
  if (feed === 'guides' && locale === 'fr') return json(404, {});
  let posts = EXPORT_FEEDS[feed](listPosts(locale)).map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    publishedAt: withZoneOffset(post.frontmatter.date, post.frontmatter.time),
  }));
  if (feed === 'news' && locale === 'de') posts = posts.slice(1);
  return json(200, { schema: 1, generatedAt: new Date().toISOString(), locale, posts });
}

await test("the API's status route is shut without the secret and refuses a wrong one", async () => {
  const call = (authorization) =>
    statusForTheApi(bearer('https://park.fan/api/news-export/status', 'GET', authorization));
  const shut = await against(bucket, {}, () => call('Bearer undefined'));
  assert.equal(shut.result.status, 503);
  const { result, requests } = await against(
    bucket,
    { REVALIDATE_SECRET: 'mcp-test-secret' },
    async () => [await call('Bearer wrong'), await call(undefined)]
  );
  assert.deepEqual(
    result.map((response) => response.status),
    [401, 401]
  );
  assert.deepEqual(requests, []);
});

await test("the status route answers the report in the shape the API's tool reads", async () => {
  const { result, requests } = await against(bucket, { REVALIDATE_SECRET: 'mcp-test-secret' }, () =>
    statusForTheApi(
      bearer('https://park.fan/api/news-export/status', 'GET', 'Bearer mcp-test-secret')
    )
  );
  assert.equal(result.status, 200);
  assert.match(result.headers.get('cache-control') ?? '', /^no-store/);
  const report = await result.json();
  const parsed = apiReportSchema.safeParse(report);
  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  // A field the API's schema does not name reaches no model; add it there when it is meant to.
  assert.deepEqual(Object.keys(report).sort(), Object.keys(apiReportSchema.shape).sort());
  const feedKeys = Object.keys(apiReportSchema.shape.feeds.element.shape).sort();
  for (const feed of report.feeds) assert.deepEqual(Object.keys(feed).sort(), feedKeys);
  assert.deepEqual(
    report.feeds.map((feed) => feed.feed),
    Object.keys(EXPORT_FEEDS)
  );
  const news = report.feeds.find((feed) => feed.feed === 'news');
  const guides = report.feeds.find((feed) => feed.feed === 'guides');
  assert.deepEqual(news.missing[0].locales, ['de']);
  assert.ok(HEALTH_TONES.includes(news.tone));
  assert.equal(guides.tone, 'bad');
  assert.deepEqual(guides.unreadable, [{ locale: 'fr', message: 'HTTP 404' }]);
  // Twelve lists and no GitHub: this deployment has no token.
  assert.equal(requests.length, 12);
  assert.ok(requests.every((request) => request.url.startsWith(MEDIA_EXPORT_BASE)));
});

/** The admin API's `auth/me` for a session token `role:<role>`, and the bucket for the rest. */
function adminBackend(url, init) {
  if (new URL(url).pathname.endsWith('/v1/admin/auth/me')) {
    const role = new Headers(init.headers).get('authorization')?.replace('Bearer role:', '');
    return json(200, {
      id: role,
      email: `${role}@park.fan`,
      displayName: role,
      role,
      legacy: false,
      mustChangePassword: false,
      totpEnabled: true,
    });
  }
  return bucket(url);
}

const asRole = (url, method, role) =>
  new Request(url, {
    method,
    headers: role ? { cookie: `parkfan_admin_session=role:${role}` } : {},
  });

await test('the admin report needs the viewer role', async () => {
  const { result } = await against(adminBackend, {}, async () => {
    const statuses = [];
    for (const role of [null, 'user', 'developer', 'viewer']) {
      statuses.push(
        (await reportForTheAdmin(asRole('https://park.fan/api/admin/news-export', 'GET', role)))
          .status
      );
    }
    return statuses;
  });
  assert.deepEqual(result, [401, 403, 403, 200]);
});

await test('the admin restart needs the editor role', async () => {
  const { result, requests } = await against(adminBackend, {}, async () => {
    const statuses = [];
    for (const role of [null, 'viewer', 'author', 'editor']) {
      statuses.push(
        (await runForTheAdmin(asRole('https://park.fan/api/admin/news-export/run', 'POST', role)))
          .status
      );
    }
    return statuses;
  });
  // The editor gets through to the start, which answers 503 on a deployment without a token.
  assert.deepEqual(result, [401, 403, 403, 503]);
  assert.ok(requests.every((request) => !request.url.startsWith('https://api.github.com')));
});

reportPassed();
