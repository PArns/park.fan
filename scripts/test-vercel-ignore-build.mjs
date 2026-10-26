#!/usr/bin/env node

/**
 * Pins `scripts/vercel-ignore-build.sh` — the Ignored Build Step.
 *
 * A false SKIP is the expensive failure and it is silent: the deploy succeeds,
 * Vercel keeps the previous deployment aliased, and a published article stays
 * invisible until somebody happens to push again. Nothing reports it. A false
 * BUILD costs a few minutes of Build CPU and nothing else.
 *
 * So the cases below are weighted accordingly: every input a build step reads
 * gets its own case, and `content/blog/**` gets one per locale plus the mixed
 * commit (a real one, 08764e8, touched CLAUDE.md AND six posts) — because that
 * is the shape a careless allowlist gets wrong. `content/blog/README.md` is in
 * here for the same reason: the root `README.md` is on the allowlist, and an
 * unanchored pattern would swallow the authoring guide's directory-mate.
 *
 * Runs the real script against a real throwaway git repository rather than
 * re-implementing its matching, so the git plumbing (a missing SHA, a shallow
 * clone, an empty diff) is covered too.
 *
 * The last section covers the build a deploy runs after several merges: it
 * must list the files of every merge since the last successful deployment, a
 * leftover `[skip deploy]` in a message must not hold it up, and a previous
 * deployment outside Vercel's shallow checkout must be fetched. That section
 * gets a bare repository standing in for GitHub and runs in a checkout with no
 * `origin` remote, because Vercel's has no usable one; git's
 * `url.<base>.insteadOf` sends the URL that VERCEL_GIT_REPO_OWNER/SLUG name to
 * the bare repository, so nothing leaves the machine.
 *
 * `pnpm test:ignore-build`
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, 'vercel-ignore-build.sh');

const BUILD = 1;
const SKIP = 0;

/**
 * Every case is `[label, expected exit, files touched]`.
 *
 * A path here is written exactly as `git diff --name-only` would print it,
 * repo-root-relative, because that is what the script matches against.
 */
const CASES = [
  // ── Things a build step reads. All of these MUST build. ──────────────────
  ['a German blog post', BUILD, ['content/blog/de/tagesplaner.md']],
  ['an English blog post', BUILD, ['content/blog/en/trip-planner.md']],
  [
    'all six locales of one post',
    BUILD,
    [
      'content/blog/de/x.md',
      'content/blog/en/x.md',
      'content/blog/nl/x.md',
      'content/blog/fr/x.md',
      'content/blog/es/x.md',
      'content/blog/it/x.md',
    ],
  ],
  ['the blog authoring guide', BUILD, ['content/blog/README.md']],
  ['a blog author', BUILD, ['content/blog/authors/patrick.json']],
  ['the blog categories', BUILD, ['content/blog/categories.json']],
  // Served at /.well-known/agent-skills/<name>/SKILL.md with a SHA-256 of the
  // bytes computed at build time, so a change here has to reach a build.
  ['an agent skill', BUILD, ['content/agent-skills/park-wait-times/SKILL.md']],
  ['homepage content', BUILD, ['content/home/intro.md']],
  ['a media photo', BUILD, ['public/media/phantasialand/taron.jpg']],
  ['a media sidecar (a focal point)', BUILD, ['public/media/phantasialand/taron.json']],
  ['a translation file', BUILD, ['messages/de.json']],
  ['a component', BUILD, ['components/common/chapter-heading.tsx']],
  ['the lockfile', BUILD, ['pnpm-lock.yaml']],
  ['the node version', BUILD, ['.nvmrc']],
  // `docs/` is anchored, so a docs directory anywhere else is ordinary source.
  ['a nested docs path that is not the docs tree', BUILD, ['app/[locale]/docs/page.tsx']],
  ['a README that is not the root one', BUILD, ['public/media/README.md']],
  ['documentation AND a blog post together', BUILD, ['CLAUDE.md', 'content/blog/de/winter.md']],
  ['documentation AND a component together', BUILD, ['docs/README.md', 'lib/media/index.ts']],

  // ── Things no build step reads. These may skip. ──────────────────────────
  ['the docs tree', SKIP, ['docs/optimization/decisions.md']],
  ['several docs files', SKIP, ['docs/README.md', 'docs/seo/sitemaps.md']],
  ['the backlog', SKIP, ['todo.md']],
  ['CLAUDE.md', SKIP, ['CLAUDE.md']],
  ['the root README', SKIP, ['README.md']],
  ['a CI workflow', SKIP, ['.github/workflows/impeccable.yml']],
  ['docs and the backlog together', SKIP, ['docs/changelog.md', 'todo.md']],
];

let failures = 0;
let checks = 0;
const pass = (msg) => {
  checks += 1;
  console.log(`  ✓ ${msg}`);
};
const fail = (msg) => {
  checks += 1;
  failures += 1;
  console.log(`  ✗ ${msg}`);
};

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ignore-build-'));
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();

/** A bare repository to stand in for GitHub, created by the deploy section. */
let githubRepo = null;

/** A second, shallow checkout for the fetch case, created by the deploy section. */
let shallowRepo = null;

/**
 * What Vercel sets for this repository, and the URL the script builds from it.
 * Every deploy case runs with these, because every production build has them.
 */
const GITHUB_ENV = {
  VERCEL_GIT_PROVIDER: 'github',
  VERCEL_GIT_REPO_OWNER: 'PArns',
  VERCEL_GIT_REPO_SLUG: 'park.fan',
};
const GITHUB_URL = 'https://github.com/PArns/park.fan.git';

/**
 * Run the real script in `repo` with `base` as the previous deployment.
 *
 * `env` adds to the environment. Returns the exit code and what the script printed, because one case asserts
 * the file list and not just the answer. `cwd` is the checkout it runs in.
 */
function runScript(base, env = {}, cwd = repo) {
  const options = {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: base ?? '', ...env },
  };
  try {
    return { status: 0, output: execFileSync('bash', [SCRIPT], options) };
  } catch (err) {
    return { status: err.status ?? -1, output: err.stdout ?? '' };
  }
}

/** The exit code alone, for the cases that only care about build or skip. */
const exitOf = (base, env) => runScript(base, env).status;

/** Commit `files` on top of the current HEAD and return the two SHAs. */
function commitTouching(files, message = `touch ${files[0]}`) {
  for (const file of files) {
    const abs = path.join(repo, file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.appendFileSync(abs, `touched at case ${files.join(',')}\n`);
  }
  const base = git('rev-parse', 'HEAD');
  git('add', '-A');
  git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', message);
  return { base, head: git('rev-parse', 'HEAD') };
}

try {
  git('init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n');
  git('add', '-A');
  git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'seed');

  console.log('vercel-ignore-build — what must reach a build\n');
  for (const [label, expected, files] of CASES) {
    const { base } = commitTouching(files);
    const got = exitOf(base);
    const want = expected === BUILD ? 'build' : 'skip';
    const actual = got === BUILD ? 'build' : got === SKIP ? 'skip' : `exit ${got}`;
    if (got === expected) pass(`${want.padEnd(5)} — ${label}`);
    else fail(`${label}: expected ${want}, got ${actual}  [${files.join(', ')}]`);
  }

  console.log('\nvercel-ignore-build — when it cannot be sure, it builds\n');

  // No previous deployment: the first build on a branch.
  if (exitOf('') === BUILD) pass('build — no VERCEL_GIT_PREVIOUS_SHA');
  else fail('an unset VERCEL_GIT_PREVIOUS_SHA must build');

  // A SHA that is not in this checkout (a shallow clone, a force-pushed base).
  if (exitOf('0'.repeat(40)) === BUILD) pass('build — a SHA this checkout does not have');
  else fail('an unknown SHA must build');

  // A redeploy of an unchanged tree: Vercel asked for it, so it is not ours to refuse.
  if (exitOf(git('rev-parse', 'HEAD')) === BUILD) pass('build — no file changes at all');
  else fail('an empty diff must build');

  console.log('\nvercel-ignore-build — the build a deploy runs after several merges\n');

  githubRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ignore-build-github-'));
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', githubRepo]);
  git('config', `url.${githubRepo}.insteadOf`, GITHUB_URL);
  // A machine with `push.negotiate` on prints "push negotiation failed" for
  // every push over the file protocol. The pushes still land, but the noise
  // reads like a broken test, so this repository does not inherit the setting.
  git('config', 'push.negotiate', 'false');
  const push = (...args) => git('push', '-q', githubRepo, ...args);
  push('main');
  if (git('remote') !== '')
    fail(`the deploy cases must run without a remote, found: ${git('remote')}`);

  // Three merges land while the deploy workflow waits, and one build follows.
  // Its base is the last successful deployment, so it sees all three.
  const burst = commitTouching(['components/a.tsx'], 'PAR-3: first merge of the burst');
  commitTouching(['components/b.tsx'], 'PAR-4: second merge');
  commitTouching(['components/c.tsx'], 'PAR-5: third merge, the tip');
  const last = runScript(burst.base, { VERCEL_ENV: 'production', ...GITHUB_ENV });
  if (last.status === BUILD) pass('build — the tip after three merges since the last deploy');
  else fail('the build after a burst of merges must build');

  const carried = ['components/a.tsx', 'components/b.tsx', 'components/c.tsx'].filter((file) =>
    last.output.includes(file)
  );
  if (carried.length === 3) pass('      — and that build sees all three merges');
  else fail(`the build must list all three files, listed ${carried.length}: ${last.output}`);

  // A `[skip deploy]` in a commit message means nothing to this script. A
  // deploy builds the tip of main, so a marker there could only hold the build
  // container, billed, while nothing else was coming.
  const marked = commitTouching(['components/home/hero.tsx'], 'PAR-6: an old habit [skip deploy]');
  const markedStartedAt = Date.now();
  const markedRun = runScript(marked.base, { VERCEL_ENV: 'production', ...GITHUB_ENV });
  const markedTook = Date.now() - markedStartedAt;
  if (markedRun.status === BUILD && markedTook < 5000)
    pass('build — a [skip deploy] in the message neither skips nor waits');
  else
    fail(
      `a marked commit must build at once: exit ${markedRun.status} after ${markedTook} ms\n${markedRun.output}`
    );

  // A previous deployment older than the checkout is deep. Vercel clones 10
  // commits, and a batch of ten merges puts VERCEL_GIT_PREVIOUS_SHA outside it.
  // The script fetches that SHA — by URL too, since there is no `origin` to
  // fetch from. The commit on top touches only documentation, so a fetch that
  // fails shows up here as a build.
  const deployed = commitTouching(['components/d.tsx'], 'PAR-6: the last deployed commit');
  commitTouching(['docs/changelog.md'], 'PAR-7: documentation on top of it');
  push('--force', 'HEAD:main');
  shallowRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'ignore-build-shallow-'));
  execFileSync('git', ['clone', '-q', '--depth=1', `file://${githubRepo}`, shallowRepo]);
  const inShallow = (...args) =>
    execFileSync('git', args, { cwd: shallowRepo, encoding: 'utf8', stdio: 'pipe' }).trim();
  inShallow('remote', 'remove', 'origin');
  inShallow('config', `url.${githubRepo}.insteadOf`, GITHUB_URL);
  let hadBase = true;
  try {
    inShallow('cat-file', '-e', `${deployed.head}^{commit}`);
  } catch {
    hadBase = false;
  }
  const deep = runScript(deployed.head, { VERCEL_ENV: 'production', ...GITHUB_ENV }, shallowRepo);
  if (!hadBase && deep.status === SKIP)
    pass(
      'skip  — documentation on a shallow checkout that lacks the last deployment, fetched by URL'
    );
  else
    fail(
      `a previous deployment outside the checkout must be fetched by URL (had it: ${hadBase}): exit ${deep.status}\n${deep.output}`
    );
} finally {
  fs.rmSync(repo, { recursive: true, force: true });
  if (githubRepo) fs.rmSync(githubRepo, { recursive: true, force: true });
  if (shallowRepo) fs.rmSync(shallowRepo, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n✗ ${failures} case(s) failed.`);
  process.exit(1);
}
console.log(`\n✅ ${checks} cases — nothing a build step reads can be skipped.`);
