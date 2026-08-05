import 'server-only';
import type { Octokit } from '@octokit/rest';

/**
 * Which pull request a media save lands in.
 *
 * A session is not a token in the browser — it is **the branch carrying the
 * `media/session-` prefix**, and the pull request opened for it. Resolving it on
 * the server is what makes a reload, a second tab and a different machine all
 * land in the same PR, and it is why this lives in one module instead of being
 * re-derived by both the commit endpoint and the banner that reports it.
 *
 * The resolution deliberately looks in two places, in this order:
 *
 *  1. **The open pull request** with the prefix. The normal case.
 *  2. **A session branch with no open PR.** This is the hole that produced a
 *     pull request per image: if opening the PR failed after the commits landed
 *     (the endpoint answers 207 for exactly that), or somebody closed the PR
 *     without deleting the branch, then looking only at pull requests says "no
 *     session" and the next save forks a second branch. Every further save does
 *     the same, and a twelve-photo batch becomes twelve pull requests.
 *
 * A lookup that FAILS is not a session of zero. `resolveSession` throws in that
 * case rather than answering null, because answering null is what makes the
 * caller open a duplicate PR — the one outcome the whole mechanism exists to
 * prevent.
 */

export const SESSION_PREFIX = 'media/session-';

export interface MediaSession {
  /** Absent when the branch exists but no pull request was ever opened for it. */
  number: number | null;
  url: string | null;
  branch: string;
  title: string | null;
  draft: boolean;
  body: string;
}

interface RepoRef {
  owner: string;
  repo: string;
  baseBranch: string;
}

/** The repository and base branch every media write targets. */
export function mediaRepo(): RepoRef {
  const repoEnv = process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
  const [owner = 'PArns', repo = 'park.fan'] = repoEnv.split('/');
  return { owner, repo, baseBranch: process.env.BLOG_EDITOR_BASE_BRANCH ?? 'main' };
}

/** The token the media admin writes with, or null when none is configured. */
export function mediaToken(): string | null {
  return process.env.BLOG_EDITOR_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? null;
}

/**
 * The running session, or null when there genuinely is none.
 *
 * Throws when GitHub could not be asked — see the module note: a failed lookup
 * must not be reported as "no session running".
 */
export async function resolveSession(
  octokit: Octokit,
  { owner, repo }: RepoRef
): Promise<MediaSession | null> {
  // NOT filtered by base. A session pull request retargeted to another branch is
  // still the session — filtering it out would report "none running" and the next
  // save would open a second one, which is the failure this function exists to
  // prevent.
  const { data: open } = await octokit.pulls.list({
    owner,
    repo,
    state: 'open',
    per_page: 100,
  });
  const found = open.find((pr) => pr.head.ref.startsWith(SESSION_PREFIX));
  if (found) {
    return {
      number: found.number,
      url: found.html_url,
      branch: found.head.ref,
      title: found.title,
      draft: found.draft ?? false,
      body: found.body ?? '',
    };
  }

  // No open pull request. A session branch may still exist, and whether it can be
  // joined depends entirely on WHY it has no PR:
  //
  //   - never had one   → an earlier save committed but could not open it (207).
  //                       Adopt it: the commits are real and belong in the session.
  //   - had one, merged → the work shipped. The branch is behind `main` now, and
  //                       committing onto it would open a pull request whose diff
  //                       is "everything that changed on main since", inverted.
  //   - had one, closed → somebody said no. Reviving it silently is worse than
  //                       starting clean.
  //
  // Only the first is a session. The other two are spent branches that happen to
  // still be there, which is the default on this repository — GitHub only deletes
  // the head branch on merge when the setting is on.
  const { data: refs } = await octokit.git.listMatchingRefs({
    owner,
    repo,
    ref: `heads/${SESSION_PREFIX}`,
  });
  if (!refs.length) return null;

  // Only the newest is a candidate — branch names carry a sortable
  // `YYYYMMDDHHMMSS` stamp. An older branch behind a spent one is not a session
  // somebody lost track of; it is history.
  const branch = refs
    .map((r) => r.ref.replace(/^refs\/heads\//, ''))
    .sort()
    .at(-1)!;

  // Exact lookup by head ref rather than a scan: this answers "does THIS branch
  // have a pull request", including the merged and closed ones the open list
  // above cannot see by definition.
  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    state: 'all',
    head: `${owner}:${branch}`,
    per_page: 10,
  });
  if (prs.length) return null; // spent — merged or closed. Start fresh from base.

  return { number: null, url: null, branch, title: null, draft: true, body: '' };
}

/**
 * The `- ` lines of a session PR body: one per change, in the order they landed.
 *
 * The body is the session's log — every save appends to it — so this is also the
 * answer to "what is already in this pull request", which the admin shows before
 * you add the next thing to it.
 */
export function sessionChanges(body: string): string[] {
  return body
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());
}
