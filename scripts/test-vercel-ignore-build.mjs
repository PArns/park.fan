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
 * The last section drives the `[skip deploy]` marker the PO puts on every
 * squash merge of a batch but the last one. It is the one skip that is not
 * about the files in the diff: the marker asks a question and the tip of `main`
 * on GitHub answers it, so that section gets a bare repository standing in for
 * GitHub and drives both answers — the tip already ahead, and the tip still on
 * the marked commit, which must build once the poll times out. The closing
 * build of a batch is checked for the files of the merges it skipped.
 *
 * That section runs in a checkout with no `origin` remote, because Vercel's has
 * no usable one. The first version asked `origin`, passed every case here against a
 * repository that had one, and built every marked merge in production for a
 * week. The script asks the URL that VERCEL_GIT_REPO_OWNER/SLUG name, and git's
 * `url.<base>.insteadOf` sends that URL to the bare repository, so nothing
 * leaves the machine.
 *
 * `pnpm test:ignore-build`
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, spawn } from 'child_process';
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

/** A bare repository to stand in for GitHub, created by the marker section. */
let githubRepo = null;

/** A second, shallow checkout for the fetch case, created by the marker section. */
let shallowRepo = null;

/**
 * What Vercel sets for this repository, and the URL the script builds from it.
 * Every marker case runs with these, because every production build has them.
 */
const GITHUB_ENV = {
  VERCEL_GIT_PROVIDER: 'github',
  VERCEL_GIT_REPO_OWNER: 'PArns',
  VERCEL_GIT_REPO_SLUG: 'park.fan',
};
const GITHUB_URL = 'https://github.com/PArns/park.fan.git';

/**
 * Interval and timeout for the `[skip deploy]` poll, in seconds.
 *
 * The timeout is two whole seconds rather than one because the script builds
 * its deadline from `date +%s`: at one second, a case that starts a hair before
 * a second boundary could reach its deadline on the very first look and never
 * sleep at all. At two, the first look is always inside the window, so the
 * timeout case proves it polled and did not fall straight through.
 */
const POLL = { IGNORE_BUILD_POLL_INTERVAL: '0.2', IGNORE_BUILD_POLL_TIMEOUT: '2' };

/**
 * Run the real script in `repo` with `base` as the previous deployment.
 *
 * `env` adds to the environment — `VERCEL_ENV` is what the `[skip deploy]`
 * marker reads, and leaving it out is the shape every other case runs in.
 * Returns the exit code and what the script printed, because one case asserts
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

  console.log('\nvercel-ignore-build — the [skip deploy] marker on a merge batch\n');

  // The marker asks a question — "has the batch moved on?" — and the tip of
  // `main` on GitHub answers it, so this section needs a GitHub to ask. It gets
  // a bare repository, and the checkout gets no `origin`, because Vercel's has
  // no usable one: git's `insteadOf` sends the URL the script builds from GITHUB_ENV to
  // the bare repository, and that URL is the only way this checkout reaches it.
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
    fail(`the marker cases must run without a remote, found: ${git('remote')}`);

  // A marked merge in production, and then the next merge of the batch lands on
  // `main` while this build is still being decided. The Vercel checkout stays on
  // the marked commit, so the worktree goes back to it after the push. The file
  // the marked commit touches is a component, so the allowlist would have built
  // it — the marker and the tip are what decide here, nothing else.
  const marked = commitTouching(
    ['components/home/hero.tsx'],
    'PAR-1: the first of a batch [skip deploy]'
  );
  push('main');
  const nextMerge = commitTouching(
    ['components/home/teaser.tsx'],
    'PAR-2: the next merge of the batch'
  );
  push('main');
  git('reset', '-q', '--hard', marked.head);

  // The case production never reached before the tip was asked by URL: with no
  // `origin`, `ls-remote origin` printed nothing and every marked merge built.
  const aheadEnv = {
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_SHA: marked.head,
    ...GITHUB_ENV,
    ...POLL,
  };
  const ahead = runScript(marked.base, aheadEnv);
  if (ahead.status === SKIP && ahead.output.includes(GITHUB_URL))
    pass('skip  — a marked production commit that main has already moved past, asked by URL');
  else fail(`a marked production commit must skip once main is ahead of it:\n${ahead.output}`);

  // The same commit as a preview. A preview belongs to its pull request, and
  // the marker in the eventual squash message is none of its business. The tip
  // is still ahead here, so a preview that consulted it would skip. The log
  // still says it saw the marker, so a build log can tell the two apart.
  const preview = runScript(marked.base, { VERCEL_ENV: 'preview', ...GITHUB_ENV, ...POLL });
  if (preview.status === BUILD && preview.output.includes('only applies to production'))
    pass('build — the same marked commit as a preview (the allowlist decides)');
  else fail(`a marked preview commit must fall through to the normal check:\n${preview.output}`);

  // An ordinary merge in the same shape: main is ahead of it too, and without
  // the marker that means nothing at all.
  const unmarked = commitTouching(['components/home/badge.tsx'], 'PAR-3: an ordinary merge');
  const unmarkedEnv = {
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_SHA: unmarked.head,
    ...GITHUB_ENV,
    ...POLL,
  };
  if (exitOf(unmarked.base, unmarkedEnv) === BUILD)
    pass('build — an unmarked production commit, even with main ahead of it');
  else fail('an unmarked commit must never consult the tip');
  git('reset', '-q', '--hard', marked.head);

  // ...and a marked preview commit that only touches documentation still skips,
  // for the reason it always did. The marker changes nothing either way here.
  const markedDocs = commitTouching(['docs/changelog.md'], 'PAR-4: docs only [skip deploy]');
  if (exitOf(markedDocs.base, { VERCEL_ENV: 'preview', ...GITHUB_ENV, ...POLL }) === SKIP)
    pass('skip  — a marked preview commit that only changed documentation');
  else fail('the marker must not turn a documentation-only preview into a build');
  git('reset', '-q', '--hard', marked.head);

  // The batch that ended early: the last merge conflicted, nothing followed,
  // and the marked commit is still the tip. Nobody is going to build it, so
  // this build has to — after the poll gives the rest of the batch its window.
  push('--force', 'main');
  const startedAt = Date.now();
  const stuck = runScript(marked.base, {
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_SHA: marked.head,
    ...GITHUB_ENV,
    ...POLL,
  });
  const waited = Date.now() - startedAt;
  if (stuck.status === BUILD && stuck.output.includes('still the tip of main'))
    pass('build — a marked commit that stays the tip of main, once the poll times out');
  else fail(`a marked commit that stays the tip must build: exit ${stuck.status}\n${stuck.output}`);
  if (waited >= 900)
    pass(`      — and it polled for ${waited} ms first, rather than falling through`);
  else fail(`the timeout case returned after ${waited} ms, so it never waited`);

  // The case the loop exists for, and the only one that fails if it looks once
  // and stops: the tip is still the marked commit when the script starts, and
  // the next merge of the batch lands a second later. A version that compared
  // only on its first look passes every case above this one.
  //
  // `main` is moved by a child process while the script blocks here, and it is
  // moved to a commit the bare repository already has under another ref, so the
  // object cannot have been pruned by the force-push above.
  push(`${nextMerge.head}:refs/heads/rest-of-batch`);
  const mover = spawn(
    'bash',
    ['-c', `sleep 1 && git --git-dir="${githubRepo}" update-ref refs/heads/main ${nextMerge.head}`],
    { stdio: 'ignore' }
  );
  const pollStartedAt = Date.now();
  const arriving = runScript(marked.base, {
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_SHA: marked.head,
    ...GITHUB_ENV,
    IGNORE_BUILD_POLL_INTERVAL: '0.3',
    IGNORE_BUILD_POLL_TIMEOUT: '20',
  });
  const polled = Date.now() - pollStartedAt;
  mover.kill();
  if (arriving.status === SKIP && arriving.output.includes('has moved on to'))
    pass('skip  — a marked commit that the next merge overtakes while the poll is running');
  else
    fail(`a tip that moves during the poll must skip: exit ${arriving.status}\n${arriving.output}`);
  if (polled >= 900) pass(`      — and it took ${polled} ms, so the answer came from a later look`);
  else fail(`the poll answered after ${polled} ms, before the tip could have moved`);

  // Nothing to ask: no VERCEL_GIT_* to build a URL from, and no `origin` to fall
  // back on. This is what every marked production build did before the URL, and
  // the answer is the same rule as everywhere else in this script: a question
  // that cannot be answered is a reason to build, not to guess.
  const blind = runScript(marked.base, {
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_SHA: marked.head,
    ...POLL,
  });
  if (blind.status === BUILD && blind.output.includes('could not read the tip'))
    pass('build — a marked commit with nothing to ask (no VERCEL_GIT_*, no origin)');
  else
    fail(`a marked commit must build when ls-remote fails: exit ${blind.status}\n${blind.output}`);

  // Outside Vercel, without VERCEL_GIT_*, a checkout that has `origin` still
  // answers through it — a local run of the script behaves as it always did.
  git('remote', 'add', 'origin', githubRepo);
  const local = runScript(marked.base, {
    VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_SHA: marked.head,
    ...POLL,
  });
  git('remote', 'remove', 'origin');
  if (local.status === SKIP && local.output.includes('asking origin'))
    pass('skip  — the same commit outside Vercel, where origin answers instead');
  else fail(`without VERCEL_GIT_*, origin must answer: exit ${local.status}\n${local.output}`);

  // The end of a batch: two marked merges, then an unmarked one. The unmarked
  // commit builds, and because the base is the last successful deployment, that
  // one build carries all three commits' files.
  const batch = commitTouching(['components/a.tsx'], 'PAR-3: batch one [skip deploy]');
  commitTouching(['components/b.tsx'], 'PAR-4: batch two [skip deploy]');
  commitTouching(['components/c.tsx'], 'PAR-5: batch three, the last merge');
  const last = runScript(batch.base, { VERCEL_ENV: 'production', ...GITHUB_ENV });
  if (last.status === BUILD) pass('build — an unmarked commit on top of two marked ones');
  else fail('the unmarked commit that ends a batch must build');

  const carried = ['components/a.tsx', 'components/b.tsx', 'components/c.tsx'].filter((file) =>
    last.output.includes(file)
  );
  if (carried.length === 3) pass('      — and that build sees all three commits of the batch');
  else
    fail(`the closing build must list all three files, listed ${carried.length}: ${last.output}`);

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
