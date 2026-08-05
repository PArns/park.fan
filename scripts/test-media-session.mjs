/**
 * Tests for media session resolution (`lib/admin/media-session`).
 *
 * Run: pnpm test:media-session
 *
 * This is the function that decides whether a save joins the running pull request
 * or opens a new one, and every way it can be wrong produces the same visible
 * symptom: a pull request per image, discovered only after a batch has already
 * scattered across a dozen of them. GitHub is stubbed, so the four states it has
 * to tell apart can actually be exercised.
 */

import { resolveSession, sessionChanges } from '../lib/admin/media-session.ts';

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`✅ ${name}`);
  } else {
    failed += 1;
    console.log(
      `❌ ${name}\n   expected ${JSON.stringify(expected)}\n   actual   ${JSON.stringify(actual)}`
    );
  }
}

const REPO = { owner: 'PArns', repo: 'park.fan', baseBranch: 'main' };

/**
 * A stub shaped like the calls `resolveSession` makes.
 *
 * `pulls.list` answers two different questions depending on its arguments — the
 * open scan, and the exact by-head lookup — so the stub branches the same way
 * rather than returning one canned list for both.
 */
function github({ openPulls = [], branches = [], pullsByHead = {} } = {}) {
  const calls = [];
  return {
    calls,
    octokit: {
      pulls: {
        list: async (params) => {
          calls.push(params);
          if (params.head) return { data: pullsByHead[params.head.split(':')[1]] ?? [] };
          return { data: openPulls };
        },
      },
      git: {
        listMatchingRefs: async () => ({
          data: branches.map((b) => ({ ref: `refs/heads/${b}` })),
        }),
      },
    },
  };
}

const openPr = (number, ref, extra = {}) => ({
  number,
  html_url: `https://github.com/PArns/park.fan/pull/${number}`,
  head: { ref },
  title: `media: ${number}`,
  draft: true,
  body: '- added `a.jpg`\n- added `b.jpg`',
  ...extra,
});

console.log('\n🔎 Session resolution\n');

{
  const { octokit } = github();
  check('nothing open and no branches → no session', await resolveSession(octokit, REPO), null);
}

{
  const { octokit } = github({ openPulls: [openPr(7, 'media/session-20260805120000')] });
  const session = await resolveSession(octokit, REPO);
  check(
    'an open session PR is the session',
    [session.number, session.branch],
    [7, 'media/session-20260805120000']
  );
}

{
  // A pull request that is not a media session must never be mistaken for one.
  const { octokit } = github({ openPulls: [openPr(9, 'claude/some-feature')] });
  check('an unrelated open PR is not a session', await resolveSession(octokit, REPO), null);
}

{
  // The scan must not filter by base: a session PR retargeted at a release branch
  // is still the session, and missing it opens a second one.
  const { octokit, calls } = github({
    openPulls: [openPr(11, 'media/session-20260805120000', { base: { ref: 'release' } })],
  });
  const session = await resolveSession(octokit, REPO);
  check('a session PR on another base is still found', session?.number, 11);
  check('the open scan sends no base filter', calls[0].base, undefined);
}

{
  // The 207 case: commits landed, the pull request did not. The branch holds real
  // work and must be adopted rather than forked past.
  const { octokit } = github({ branches: ['media/session-20260805120000'] });
  const session = await resolveSession(octokit, REPO);
  check(
    'a branch that never got a PR is adopted',
    [session.number, session.branch],
    [null, 'media/session-20260805120000']
  );
}

{
  // Merged and left behind. Committing onto it would open a pull request against a
  // branch that is already behind main.
  const { octokit } = github({
    branches: ['media/session-20260805120000'],
    pullsByHead: {
      'media/session-20260805120000': [
        { number: 3, state: 'closed', merged_at: '2026-08-05T10:00:00Z' },
      ],
    },
  });
  check('a merged session branch is spent', await resolveSession(octokit, REPO), null);
}

{
  // Closed without merging — somebody said no. Reviving it silently is worse than
  // starting clean.
  const { octokit } = github({
    branches: ['media/session-20260805120000'],
    pullsByHead: {
      'media/session-20260805120000': [{ number: 4, state: 'closed', merged_at: null }],
    },
  });
  check('a closed session branch is spent', await resolveSession(octokit, REPO), null);
}

{
  // Several branches lying around: the newest is the only candidate.
  const { octokit } = github({
    branches: [
      'media/session-20260801090000',
      'media/session-20260805120000',
      'media/session-20260803110000',
    ],
  });
  const session = await resolveSession(octokit, REPO);
  check('the newest session branch wins', session.branch, 'media/session-20260805120000');
}

{
  // A lookup that fails is NOT "no session" — answering null there is what makes
  // the caller open a duplicate.
  const octokit = {
    pulls: {
      list: async () => {
        throw new Error('Bad credentials');
      },
    },
    git: { listMatchingRefs: async () => ({ data: [] }) },
  };
  let threw = false;
  try {
    await resolveSession(octokit, REPO);
  } catch {
    threw = true;
  }
  check('a failed lookup throws rather than answering null', threw, true);
}

console.log('\n🔎 Session log\n');

check(
  'the body log is the list of changes',
  sessionChanges('Media database changes.\n\n- added `a.jpg`\n- updated `b.json`\n\n---\n_footer_'),
  ['added `a.jpg`', 'updated `b.json`']
);
check('a body with no log is empty', sessionChanges('Nothing here yet.'), []);

console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
console.log('🎉 Sessions resolve.');
