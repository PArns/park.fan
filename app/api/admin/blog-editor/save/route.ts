import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import type { BlogFrontmatter } from '@/lib/blog/types';
import { buildPostFile } from '@/app/admin/blog-editor/_lib/serialize';

interface SavePayload {
  baseSlug: string;
  sourceLocale: string;
  perLocale: Record<string, { slug: string; frontmatter: BlogFrontmatter; body: string }>;
}

const REQUIRED_TOKEN_HINT =
  'Set BLOG_EDITOR_GITHUB_TOKEN (PAT with repo scope) on the deployment to enable saving.';

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const LOCALE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

/**
 * Commit one .md per filled locale on a single branch + open one PR back to
 * the base branch. Token comes from BLOG_EDITOR_GITHUB_TOKEN (or GITHUB_TOKEN).
 * The PR body summarises which locales landed and which still need work.
 */
export async function POST(req: Request) {
  const token = process.env.BLOG_EDITOR_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: REQUIRED_TOKEN_HINT }, { status: 500 });

  let payload: SavePayload;
  try {
    payload = (await req.json()) as SavePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { baseSlug, sourceLocale, perLocale } = payload;

  if (!SLUG_RE.test(baseSlug)) {
    return NextResponse.json(
      { error: 'Invalid base slug — lowercase letters, digits, hyphens' },
      { status: 400 }
    );
  }
  if (!LOCALE_RE.test(sourceLocale) || !perLocale?.[sourceLocale]) {
    return NextResponse.json(
      { error: 'sourceLocale must be filled and match a locale draft' },
      { status: 400 }
    );
  }
  const entries = Object.entries(perLocale);
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No locales to save' }, { status: 400 });
  }
  for (const [locale, draft] of entries) {
    if (!LOCALE_RE.test(locale)) {
      return NextResponse.json({ error: `Invalid locale: ${locale}` }, { status: 400 });
    }
    if (!SLUG_RE.test(draft.slug)) {
      return NextResponse.json(
        { error: `${locale}: slug "${draft.slug}" is invalid` },
        { status: 400 }
      );
    }
    const fm = draft.frontmatter;
    if (!fm?.title || !fm.excerpt || !fm.author || !fm.date || !draft.body?.trim()) {
      return NextResponse.json(
        { error: `${locale}: missing required fields (title/excerpt/author/date/body)` },
        { status: 400 }
      );
    }
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

  const stamp = new Date().toISOString().slice(0, 10);
  const branch = `blog/${baseSlug}-${stamp}`;
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

  // 2. Commit one file per locale on that branch (each is a separate commit so
  //    the PR diff reads naturally).
  const committed: string[] = [];
  for (const [locale, draft] of entries) {
    const filePath = `content/blog/${locale}/${draft.slug}.md`;
    const content = buildPostFile(draft.frontmatter, draft.body);
    const contentBase64 = Buffer.from(content, 'utf8').toString('base64');

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
      // 404 — file doesn't exist yet, normal for a new post.
    }

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        branch,
        message: `feat(blog/${locale}): ${draft.frontmatter.title}`,
        content: contentBase64,
        ...(existingSha ? { sha: existingSha } : {}),
      });
      committed.push(locale);
    } catch (e) {
      return NextResponse.json(
        { error: `Could not commit ${filePath}: ${(e as Error).message}`, committed },
        { status: 500 }
      );
    }
  }

  // 3. Open the PR. Source-locale title is the PR title; the body lists the
  //    locales we wrote so reviewers see at a glance what's included.
  const sourceFm = perLocale[sourceLocale]!.frontmatter;
  const bodyLines = [
    `Drafted from the **/admin/blog-editor**.`,
    '',
    `> ${sourceFm.excerpt}`,
    '',
    '**Locales included:**',
    ...committed.map(
      (l) => `- \`${l}\` — \`content/blog/${l}/${perLocale[l]!.slug}.md\``
    ),
    '',
    '_Review the rendered post, tweak as needed, then mark ready for review._',
  ];

  try {
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      head: branch,
      base: baseBranch,
      title: `Blog: ${sourceFm.title}`,
      draft: true,
      body: bodyLines.join('\n'),
    });
    return NextResponse.json({ url: pr.html_url, branch, number: pr.number, committed });
  } catch (e) {
    return NextResponse.json(
      {
        error: `Files committed on ${branch} (${committed.join(', ')}) but PR creation failed: ${(e as Error).message}`,
        committed,
      },
      { status: 500 }
    );
  }
}
