import 'server-only';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

import { denyUnlessAdmin } from '@/lib/admin/session';
import { adminGithubToken, adminRepo } from '@/lib/admin/github';
import { resolveSession, sessionChanges } from '@/lib/admin/media-session';

/**
 * Whether a media session is running, where, and what is in it. A session is the branch with the
 * `media/session-` prefix and its pull request; the state lives in git, so a reload, a second tab
 * or another machine see the same one. The file list is what the branch touches, which the log
 * cannot get wrong.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Enough to show the shape of a session; a bigger one is summarized by the count. */
const MAX_FILES = 100;

export async function GET(req: Request) {
  const unauthorized = await denyUnlessAdmin(req);
  if (unauthorized) return unauthorized;

  const token = adminGithubToken();
  if (!token) return NextResponse.json({ session: null, tokenMissing: true });

  const { owner, repo, baseBranch } = adminRepo();

  try {
    const octokit = new Octokit({ auth: token });
    const session = await resolveSession(octokit, { owner, repo, baseBranch });
    if (!session) return NextResponse.json({ session: null });

    const changes = sessionChanges(session.body);

    // The diff itself. Only available once a pull request exists — an adopted
    // branch that never got one reports its log lines and nothing else, which is
    // still better than claiming it is empty.
    let files: { path: string; status: string; additions: number; deletions: number }[] = [];
    if (session.number) {
      try {
        const { data } = await octokit.pulls.listFiles({
          owner,
          repo,
          pull_number: session.number,
          per_page: MAX_FILES,
        });
        files = data.map((f) => ({
          path: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
        }));
      } catch {
        // A file list that cannot be drawn is not worth failing the banner over.
      }
    }

    return NextResponse.json({
      session: {
        number: session.number,
        url: session.url,
        branch: session.branch,
        title: session.title,
        draft: session.draft,
        changes: changes.length,
        log: changes,
        files,
      },
    });
  } catch (e) {
    return NextResponse.json({ session: null, error: (e as Error).message }, { status: 502 });
  }
}
