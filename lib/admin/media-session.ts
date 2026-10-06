import 'server-only';
import type { Octokit } from '@octokit/rest';

import type { SessionFile } from '@/lib/media/session-photos';
import type { RepoRef } from './github';

/**
 * Which pull request a media save lands in. A session is the branch with the `media/session-`
 * prefix and its pull request, resolved on the server so a reload, a second tab or another
 * machine all land in the same PR. A session branch whose PR could not be opened (the 207 case)
 * still counts, or every further save would fork a branch of its own. A failed lookup throws
 * instead of answering null, because null makes the caller open a duplicate PR.
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

/** The running session, or null when there is none. Throws when GitHub could not be asked. */
export async function resolveSession(
  octokit: Octokit,
  { owner, repo }: RepoRef
): Promise<MediaSession | null> {
  // Not filtered by base: a session PR retargeted to another branch is still the session.
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

  // No open pull request. A session branch that never had one (an earlier save could not open
  // it, 207) is adopted. One whose PR was merged or closed is spent: committing onto a merged
  // branch would open an inverted diff of main, and a closed one was a no. This repository keeps
  // head branches after merge, so spent ones are the normal case.
  const { data: refs } = await octokit.git.listMatchingRefs({
    owner,
    repo,
    ref: `heads/${SESSION_PREFIX}`,
  });
  if (!refs.length) return null;

  // Only the newest is a candidate: branch names carry a sortable `YYYYMMDDHHMMSS` stamp.
  const branch = refs
    .map((r) => r.ref.replace(/^refs\/heads\//, ''))
    .sort()
    .at(-1)!;

  // By head ref, so this branch's merged and closed PRs count too.
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
 * The files a session changes against its base: the PR's file list, or a compare with the base
 * for a session branch that never got its PR.
 */
export async function sessionFiles(
  octokit: Octokit,
  { owner, repo, baseBranch }: RepoRef,
  session: MediaSession
): Promise<SessionFile[]> {
  const files = session.number
    ? await octokit.paginate(octokit.pulls.listFiles, {
        owner,
        repo,
        pull_number: session.number,
        per_page: 100,
      })
    : ((
        await octokit.repos.compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${baseBranch}...${session.branch}`,
        })
      ).data.files ?? []);
  return files.map(({ filename, status, patch }) => ({ filename, status, patch }));
}

/** A JSON file as it stands on the session branch, or null when it cannot be read. */
export async function readSessionJson(
  octokit: Octokit,
  { owner, repo }: RepoRef,
  session: MediaSession,
  path: string
): Promise<unknown> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref: session.branch });
    const content = Array.isArray(data) ? undefined : (data as { content?: string }).content;
    return content ? JSON.parse(Buffer.from(content, 'base64').toString('utf8')) : null;
  } catch {
    return null;
  }
}

/**
 * The `- ` lines of a session PR body, one per change in the order they landed: the body is the
 * session's log, which the admin shows before the next save.
 */
export function sessionChanges(body: string): string[] {
  return body
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());
}
