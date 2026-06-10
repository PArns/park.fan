import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { requireAdminPass } from '@/lib/admin/verify-pass';

interface DeletePayload {
  /** translationKey of the post being deleted (drives the branch name). */
  key: string;
  /** locale → url slug, the per-locale files to remove. */
  slugs: Record<string, string>;
  /** Source-locale title for the PR headline. */
  title?: string;
}

const REQUIRED_TOKEN_HINT =
  'Set BLOG_EDITOR_GITHUB_TOKEN (PAT with repo scope) on the deployment to enable saving.';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const LOCALE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

/**
 * Deletion mirrors the save flow: nothing touches `main` directly. A branch
 * is forked, every per-locale markdown file is removed in its own commit,
 * and a draft PR is opened for review — the post only disappears once a
 * human merges it.
 */
export async function POST(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;
  const token = process.env.BLOG_EDITOR_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: REQUIRED_TOKEN_HINT }, { status: 500 });

  let payload: DeletePayload;
  try {
    payload = (await req.json()) as DeletePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!payload.key || !SLUG_RE.test(payload.key)) {
    return NextResponse.json({ error: 'Invalid post key' }, { status: 400 });
  }
  const entries = Object.entries(payload.slugs ?? {}).filter(
    ([locale, slug]) => LOCALE_RE.test(locale) && SLUG_RE.test(slug)
  );
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No locale files to delete' }, { status: 400 });
  }

  const repoEnv = process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
  const [owner = 'PArns', repo = 'park.fan'] = repoEnv.split('/');
  const baseBranch = process.env.BLOG_EDITOR_BASE_BRANCH ?? 'main';
  const octokit = new Octokit({ auth: token });

  let baseSha: string;
  try {
    const { data: baseRef } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    baseSha = baseRef.object.sha;
  } catch (e) {
    return NextResponse.json(
      { error: `Could not read base branch ${baseBranch}: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const branch = `blog/delete-${payload.key}-${stamp}`;
  try {
    await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseSha });
  } catch (e) {
    return NextResponse.json(
      { error: `Could not create branch ${branch}: ${(e as Error).message}` },
      { status: 500 }
    );
  }

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
