import 'server-only';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

import { requireAdminPass } from '@/lib/admin/verify-pass';
import { mediaRepo, mediaToken, resolveSession, sessionChanges } from '@/lib/admin/media-session';

/**
 * Is a media session running, where is it, and what is already in it?
 *
 * A "session" is the branch carrying the `media/session-` prefix and the pull
 * request opened for it. Everything saved from the admin joins it, so retagging a
 * shoot is one reviewable PR instead of one per image. The state lives in git
 * rather than in the browser, which is why this is a request and not a
 * `sessionStorage` read: a reload, a second tab or a different machine must all
 * see the same session.
 *
 * It also answers **what changed** — the PR's own log lines plus the files the
 * branch actually touches. Saving into a shared pull request without being able
 * to see what is in it is how the wrong thing gets merged; the file list is the
 * one answer git can give that the log cannot lie about.
 *
 * It ends where it began — merge or close the PR, and the next save opens a new
 * one. The admin's "Start a new pull request" is the early exit.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Enough to show the shape of a session; a bigger one is summarized by the count. */
const MAX_FILES = 100;

export async function GET(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;

  const token = mediaToken();
  if (!token) return NextResponse.json({ session: null, tokenMissing: true });

  const { owner, repo, baseBranch } = mediaRepo();

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
