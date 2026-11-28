import 'server-only';

import { Octokit } from '@octokit/rest';
import { adminGithubToken, adminRepo } from '@/lib/admin/github';

/**
 * When a post's file reached the repository's default branch, for the export check's clock
 * (`lib/admin/news-export-report.ts`): the build time of the deployment that answers moves with
 * every later deploy, this time does not. Background: docs/features/media-database.md#watching-the-export.
 */

/** Files the check asks GitHub about at most per report; the rest wait for the next one. */
export const ARRIVALS_PER_CHECK = 5;

/** Longest GitHub may take for each request of a lookup, which the report waits for. */
const GITHUB_TIMEOUT_MS = 5_000;

/** GitHub's page size for a file's commits; the oldest is the last entry of the last page. */
const COMMITS_PER_PAGE = 100;

/** Arrival times read, in ms, by file. A file reaches the default branch once, so none expires. */
const arrivals = new Map<string, number>();

/** The `page` of the `rel="last"` link GitHub sends with a list that has more than one page. */
function lastPageOf(link: string | undefined): number | null {
  const match = link?.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  return match ? Number(match[1]) : null;
}

/**
 * One file's arrival: the oldest commit on the default branch that touches it, and of that commit
 * the earliest merge into the default branch, since a commit made on a branch carries the branch's
 * time. A commit no merged pull request brought counts with its own time. Null when the default
 * branch has no such commit or GitHub failed.
 */
async function arrivalOf(octokit: Octokit, path: string): Promise<number | null> {
  const { owner, repo } = adminRepo();
  const request = () => ({ signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS) });
  try {
    const first = await octokit.repos.listCommits({
      owner,
      repo,
      path,
      per_page: COMMITS_PER_PAGE,
      request: request(),
    });
    const last = lastPageOf(first.headers.link);
    const commits = last
      ? (
          await octokit.repos.listCommits({
            owner,
            repo,
            path,
            per_page: COMMITS_PER_PAGE,
            page: last,
            request: request(),
          })
        ).data
      : first.data;
    const added = commits.at(-1);
    if (!added) return null;
    const { data: pulls } = await octokit.repos.listPullRequestsAssociatedWithCommit({
      owner,
      repo,
      commit_sha: added.sha,
      request: request(),
    });
    const merges = pulls.flatMap((pull) =>
      pull.merged_at && pull.base.ref === pull.base.repo.default_branch
        ? [Date.parse(pull.merged_at)]
        : []
    );
    const at =
      merges.length > 0 ? Math.min(...merges) : Date.parse(added.commit.committer?.date ?? '');
    return Number.isFinite(at) ? at : null;
  } catch (error) {
    // The status alone, so nothing of the request, its token header included, reaches the log.
    const status = (error as { response?: { status?: unknown } }).response?.status;
    console.error(
      `[news-export arrival] ${path}: ${typeof status === 'number' ? status : 'unreachable'}`
    );
    return null;
  }
}

/**
 * When each of `files` (repository paths, the first the longest waiting) reached the default
 * branch, in ms, read through GitHub with the admin's token and kept in memory. Asks for at most
 * {@link ARRIVALS_PER_CHECK} files not read before; a file left out, a failed read and a deployment
 * without a token have no entry, and their posts count from the deployment.
 */
export async function postArrivals(files: readonly string[]): Promise<Map<string, number>> {
  const known = new Map<string, number>();
  const unread: string[] = [];
  for (const file of new Set(files)) {
    const at = arrivals.get(file);
    if (at === undefined) unread.push(file);
    else known.set(file, at);
  }
  const token = adminGithubToken();
  if (!token || unread.length === 0) return known;

  const octokit = new Octokit({ auth: token });
  const asked = unread.slice(0, ARRIVALS_PER_CHECK);
  const read = await Promise.all(asked.map((file) => arrivalOf(octokit, file)));
  asked.forEach((file, i) => {
    const at = read[i];
    if (at === null) return;
    arrivals.set(file, at);
    known.set(file, at);
  });
  return known;
}
