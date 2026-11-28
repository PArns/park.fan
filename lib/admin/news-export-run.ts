import 'server-only';

import { Octokit } from '@octokit/rest';
import { adminGithubToken, adminRepo } from '@/lib/admin/github';
import {
  NEWS_EXPORT_WORKFLOW,
  exportRunRefusal,
  exportRunUnclear,
  type NewsExportRunAnswer,
} from '@/lib/admin/news-export-lag';

/** Longest GitHub may take for each of the two requests a start makes. */
const GITHUB_TIMEOUT_MS = 10_000;

/** The workflow's page on GitHub, which lists its runs and has „Run workflow“. */
export function newsExportWorkflowUrl(): string {
  const { owner, repo } = adminRepo();
  return `https://github.com/${owner}/${repo}/actions/workflows/${NEWS_EXPORT_WORKFLOW}`;
}

/** What a start answers, with the HTTP status the routes send it with. */
export interface NewsExportRunResult {
  status: 200 | 502 | 503 | 504;
  answer: NewsExportRunAnswer;
}

/**
 * Starts the export workflow by `workflow_dispatch` with the admin's GitHub token, on the
 * repository's default branch rather than the admin's base branch: a run publishes to the bucket
 * the app reads, and only the default branch is live. The admin's route and the API's server route
 * both start it here. A run already in progress keeps going; the workflow's concurrency group
 * queues the new one behind it.
 */
export async function startNewsExport(): Promise<NewsExportRunResult> {
  const token = adminGithubToken();
  if (!token) return exportRunRefusal('no-token');

  const { owner, repo } = adminRepo();
  const octokit = new Octokit({ auth: token });
  let dispatching = false;
  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
      request: { signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS) },
    });
    dispatching = true;
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: NEWS_EXPORT_WORKFLOW,
      ref: data.default_branch,
      request: { signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS) },
    });
  } catch (error) {
    // The status alone, so nothing of the request, its token header included, reaches the log.
    const status = (error as { response?: { status?: unknown } }).response?.status;
    const failure = typeof status === 'number' ? status : 'unreachable';
    // No answer to the dispatch, or a 5xx, says nothing about whether GitHub queued the run.
    if (dispatching && (failure === 'unreachable' || failure >= 500)) {
      console.error(`[news-export run] maybe started: ${failure}`);
      return exportRunUnclear(failure);
    }
    console.error(`[news-export run] not started: ${failure}`);
    return exportRunRefusal(failure);
  }
  return { status: 200, answer: { started: true, workflowUrl: newsExportWorkflowUrl() } };
}
