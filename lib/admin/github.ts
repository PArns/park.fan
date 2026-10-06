import 'server-only';
import type { Octokit } from '@octokit/rest';

/** A repository and the branch the admin's pull requests are opened against. */
export interface RepoRef {
  owner: string;
  repo: string;
  baseBranch: string;
}

/** The repository and base branch every admin write targets, blog posts and media alike. */
export function adminRepo(): RepoRef {
  const repoEnv = process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
  const [owner = 'PArns', repo = 'park.fan'] = repoEnv.split('/');
  return { owner, repo, baseBranch: process.env.BLOG_EDITOR_BASE_BRANCH ?? 'main' };
}

/** The token the admin writes to GitHub with, or null when none is configured. */
export function adminGithubToken(): string | null {
  return process.env.BLOG_EDITOR_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? null;
}

/** What the blog editor's write routes answer when no token is configured. */
export const MISSING_TOKEN_HINT =
  'Set BLOG_EDITOR_GITHUB_TOKEN (PAT with repo scope) on the deployment to enable saving.';

/**
 * Creates `branch` at the head of the base branch, so a write never lands on it directly.
 * Resolves to null, or to the sentence a route reports when GitHub refused.
 */
export async function forkFromBase(
  octokit: Octokit,
  { owner, repo, baseBranch }: RepoRef,
  branch: string
): Promise<string | null> {
  let baseSha: string;
  try {
    const { data: baseRef } = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
    baseSha = baseRef.object.sha;
  } catch (e) {
    return `Could not read base branch ${baseBranch}: ${(e as Error).message}`;
  }
  try {
    await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseSha });
  } catch (e) {
    return `Could not create branch ${branch}: ${(e as Error).message}`;
  }
  return null;
}
