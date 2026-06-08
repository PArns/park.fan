import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import type { BlogFrontmatter } from '@/lib/blog/types';
import { buildPostFile } from '@/app/admin/blog-editor/_lib/serialize';

interface SaveBody {
  locale: string;
  slug: string;
  frontmatter: BlogFrontmatter;
  body: string;
}

const REQUIRED_TOKEN_HINT =
  'Set BLOG_EDITOR_GITHUB_TOKEN (PAT with repo scope) on the deployment to enable saving.';

/**
 * Take the editor's payload, write the .md to `content/blog/<locale>/<slug>.md`
 * on a fresh branch, and open a draft PR back to the base branch. All side
 * effects go through Octokit so the editor works on any deployment as long as
 * the env var holds a token with write access to the repo.
 */
export async function POST(req: Request) {
  const token = process.env.BLOG_EDITOR_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: REQUIRED_TOKEN_HINT }, { status: 500 });
  }

  let payload: SaveBody;
  try {
    payload = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { locale, slug, frontmatter, body } = payload;

  if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug — lowercase letters, digits, hyphens' }, { status: 400 });
  }
  if (!frontmatter?.title || !frontmatter.excerpt || !frontmatter.author || !frontmatter.date) {
    return NextResponse.json({ error: 'Frontmatter missing required fields' }, { status: 400 });
  }
  if (!body?.trim()) {
    return NextResponse.json({ error: 'Body is empty' }, { status: 400 });
  }

  const repoEnv = process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
  const [owner = 'PArns', repo = 'park.fan'] = repoEnv.split('/');
  const baseBranch = process.env.BLOG_EDITOR_BASE_BRANCH ?? 'main';

  const octokit = new Octokit({ auth: token });

  // 1. Resolve the base branch head SHA so we can fork a branch from it.
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

  // 2. Pick a fresh branch name (unique even if the same slug exists already).
  const stamp = new Date().toISOString().slice(0, 10);
  const branch = `blog/${locale}-${slug}-${stamp}`;
  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Could not create branch ${branch}: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  // 3. Write the file on that branch. If a file already exists at that path we
  //    update it; otherwise we create it.
  const filePath = `content/blog/${locale}/${slug}.md`;
  const fileContent = buildPostFile(frontmatter, body);
  const contentBase64 = Buffer.from(fileContent, 'utf8').toString('base64');

  let existingSha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });
    if (!Array.isArray(existing.data) && existing.data.type === 'file') {
      existingSha = existing.data.sha;
    }
  } catch {
    // 404 — file doesn't exist yet, which is the normal "new post" case.
  }

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      branch,
      message: `feat(blog): ${frontmatter.title}`,
      content: contentBase64,
      ...(existingSha ? { sha: existingSha } : {}),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Could not commit file: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  // 4. Open the PR as a draft so it lands in review, not directly mergeable.
  try {
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      head: branch,
      base: baseBranch,
      title: `Blog: ${frontmatter.title}`,
      draft: true,
      body: [
        `Drafted from the **/admin/blog-editor** for \`${locale}/${slug}\`.`,
        '',
        `> ${frontmatter.excerpt}`,
        '',
        '_Review the rendered post, tweak as needed, then mark ready for review._',
      ].join('\n'),
    });
    return NextResponse.json({ url: pr.html_url, branch, number: pr.number });
  } catch (e) {
    return NextResponse.json(
      { error: `File committed on ${branch}, but PR creation failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
