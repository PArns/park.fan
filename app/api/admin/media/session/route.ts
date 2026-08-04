import 'server-only';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

import { requireAdminPass } from '@/lib/admin/verify-pass';

/**
 * Is a media session running, and where is it?
 *
 * A "session" is the open pull request whose branch carries the `media/session-`
 * prefix. Everything saved from the admin joins it, so retagging a shoot is one
 * reviewable PR instead of one per image. The state lives in git rather than in
 * the browser, which is why this is a request and not a `sessionStorage` read: a
 * reload, a second tab or a different machine must all see the same session.
 *
 * It ends where it began — merge or close the PR, and the next save opens a new
 * one. The admin's "Start a new pull request" is the early exit.
 *
 * Answers `{ session: null }` when nothing is open, and also when there is no
 * token: not being able to look is not the same as knowing there is none, but the
 * admin only uses this to decide what banner to draw, and the commit endpoint
 * reports the missing token properly when a save is actually attempted.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_PREFIX = 'media/session-';

export async function GET(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;

  const token = process.env.BLOG_EDITOR_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ session: null, tokenMissing: true });

  const repoEnv = process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
  const [owner = 'PArns', repo = 'park.fan'] = repoEnv.split('/');
  const baseBranch = process.env.BLOG_EDITOR_BASE_BRANCH ?? 'main';

  try {
    const octokit = new Octokit({ auth: token });
    const { data: open } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      base: baseBranch,
      per_page: 100,
    });
    const found = open.find((pr) => pr.head.ref.startsWith(SESSION_PREFIX));
    if (!found) return NextResponse.json({ session: null });

    return NextResponse.json({
      session: {
        number: found.number,
        url: found.html_url,
        branch: found.head.ref,
        title: found.title,
        draft: found.draft ?? false,
        // How much is already in it — the number the banner shows.
        changes: (found.body ?? '').split('\n').filter((l) => l.startsWith('- ')).length,
      },
    });
  } catch (e) {
    return NextResponse.json({ session: null, error: (e as Error).message }, { status: 502 });
  }
}
