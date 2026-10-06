import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { denyUnlessAdmin } from '@/lib/admin/session';
import { BLOG_LOCALE_RE, BLOG_SLUG_RE } from '@/lib/admin/blog-paths';
import { adminGithubToken, adminRepo, forkFromBase, MISSING_TOKEN_HINT } from '@/lib/admin/github';

interface DeletePayload {
  /** translationKey of the post being deleted (drives the branch name). */
  key: string;
  /** locale → url slug, the per-locale files to remove. */
  slugs: Record<string, string>;
  /** Source-locale title for the PR headline. */
  title?: string;
}

/**
 * Deletion mirrors the save flow: nothing touches `main` directly. A branch
 * is forked, every per-locale markdown file is removed in its own commit,
 * and a draft PR is opened for review — the post only disappears once a
 * human merges it.
 */
export async function POST(req: Request) {
  const unauthorized = await denyUnlessAdmin(req);
  if (unauthorized) return unauthorized;
  const token = adminGithubToken();
  if (!token) return NextResponse.json({ error: MISSING_TOKEN_HINT }, { status: 500 });

  let payload: DeletePayload;
  try {
    payload = (await req.json()) as DeletePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!payload.key || !BLOG_SLUG_RE.test(payload.key)) {
    return NextResponse.json({ error: 'Invalid post key' }, { status: 400 });
  }
  const entries = Object.entries(payload.slugs ?? {}).filter(
    ([locale, slug]) => BLOG_LOCALE_RE.test(locale) && BLOG_SLUG_RE.test(slug)
  );
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No locale files to delete' }, { status: 400 });
  }

  const target = adminRepo();
  const { owner, repo, baseBranch } = target;
  const octokit = new Octokit({ auth: token });

  const stamp = new Date().toISOString().slice(0, 10);
  const branch = `blog/delete-${payload.key}-${stamp}`;
  const forkError = await forkFromBase(octokit, target, branch);
  if (forkError) return NextResponse.json({ error: forkError }, { status: 500 });

  const removed: string[] = [];
  for (const [locale, slug] of entries) {
    const path = `content/blog/${locale}/${slug}.md`;
    try {
      const existing = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      if (Array.isArray(existing.data) || existing.data.type !== 'file') continue;
      await octokit.repos.deleteFile({
        owner,
        repo,
        path,
        branch,
        message: `chore(blog/${locale}): delete ${slug}`,
        sha: existing.data.sha,
      });
      removed.push(path);
    } catch {
      /* file absent on this branch — nothing to delete */
    }
  }
  if (removed.length === 0) {
    return NextResponse.json(
      { error: 'None of the post files exist on the base branch.' },
      { status: 404 }
    );
  }

  const title = payload.title?.trim() || payload.key;
  try {
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      head: branch,
      base: baseBranch,
      title: `Delete: ${title}`,
      draft: true,
      body: [
        'Requested from the **/admin/blog-editor**.',
        '',
        '**Files removed:**',
        ...removed.map((p) => `- \`${p}\``),
        '',
        '_Merging this PR permanently removes the post from the site._',
      ].join('\n'),
    });
    return NextResponse.json({ url: pr.html_url, branch, number: pr.number, removed });
  } catch (e) {
    return NextResponse.json(
      {
        error: `Files deleted on ${branch} but PR creation failed: ${(e as Error).message}`,
        removed,
      },
      { status: 500 }
    );
  }
}
