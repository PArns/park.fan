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
const pass = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  ✗ ${msg}`);
};

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ignore-build-'));
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();

/** Run the real script in `repo` with `base` as the previous deployment. */
function runScript(base) {
  try {
    execFileSync('bash', [SCRIPT], {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: base ?? '' },
    });
    return 0;
  } catch (err) {
    return err.status ?? -1;
  }
}

/** Commit `files` on top of the current HEAD and return the two SHAs. */
function commitTouching(files) {
  for (const file of files) {
    const abs = path.join(repo, file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.appendFileSync(abs, `touched at case ${files.join(',')}\n`);
  }
  const base = git('rev-parse', 'HEAD');
  git('add', '-A');
  git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', `touch ${files[0]}`);
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
    const got = runScript(base);
    const want = expected === BUILD ? 'build' : 'skip';
    const actual = got === BUILD ? 'build' : got === SKIP ? 'skip' : `exit ${got}`;
    if (got === expected) pass(`${want.padEnd(5)} — ${label}`);
    else fail(`${label}: expected ${want}, got ${actual}  [${files.join(', ')}]`);
  }

  console.log('\nvercel-ignore-build — when it cannot be sure, it builds\n');

  // No previous deployment: the first build on a branch.
  if (runScript('') === BUILD) pass('build — no VERCEL_GIT_PREVIOUS_SHA');
  else fail('an unset VERCEL_GIT_PREVIOUS_SHA must build');

  // A SHA that is not in this checkout (a shallow clone, a force-pushed base).
  if (runScript('0'.repeat(40)) === BUILD) pass('build — a SHA this checkout does not have');
  else fail('an unknown SHA must build');

  // A redeploy of an unchanged tree: Vercel asked for it, so it is not ours to refuse.
  if (runScript(git('rev-parse', 'HEAD')) === BUILD) pass('build — no file changes at all');
  else fail('an empty diff must build');
} finally {
  fs.rmSync(repo, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n✗ ${failures} case(s) failed.`);
  process.exit(1);
}
console.log(`\n✅ ${CASES.length + 3} cases — nothing a build step reads can be skipped.`);
