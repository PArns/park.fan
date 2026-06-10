import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import type { BlogFrontmatter } from '@/lib/blog/types';
import { buildPostFile } from '@/app/admin/blog-editor/_lib/serialize';
import { requireAdminPass } from '@/lib/admin/verify-pass';

interface SavePayload {
  baseSlug: string;
  sourceLocale: string;
  perLocale: Record<string, { slug: string; frontmatter: BlogFrontmatter; body: string }>;
  /** When present we're updating an existing post — flip PR title to "Update"
   *  and delete any stale per-locale files left behind by a slug rename. */
  editing?: {
    key: string;
    originalSlugs: Record<string, string>;
  };
  /** Brand-new authors created during this session — each becomes a
   *  content/blog/authors/<key>.md file in the same PR. */
  newAuthors?: Array<{
    key: string;
    name: string;
    role?: string;
    location?: string;
    url?: string;
    avatar?: string;
    bio?: string;
  }>;
  /** Brand-new categories — appended to content/blog/categories.json in the
   *  same PR so the post's `category:` field resolves on the live site. */
  newCategories?: Array<{ path: string; labels: Record<string, string> }>;
  /** Edited authors: overwrite the existing author file in place (we pass
   *  the existing SHA to the createOrUpdateFileContents call so GitHub
   *  accepts the update). */
  editedAuthors?: SavePayload['newAuthors'];
  /** Edited categories: merge over the existing categories.json entry. */
  editedCategories?: SavePayload['newCategories'];
  /** Images pasted / dropped / uploaded in the editor. Each lands as
   *  `public<path>` in the same PR so the markdown references resolve the
   *  moment the PR merges. */
  newImages?: Array<{ path: string; contentBase64: string }>;
}

/** /blog/images/… only, no traversal, whitelisted raster/vector extensions. */
const IMAGE_PATH_RE = /^\/blog\/images\/[a-z0-9][a-z0-9/._-]*\.(png|jpe?g|webp|gif|avif|svg)$/i;
/** ~3MB raw ≈ 4MB base64 — matches the client-side cap. */
const MAX_IMAGE_BASE64 = 4 * 1024 * 1024;

const AUTHOR_KEY_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
const CATEGORY_PATH_RE = /^[a-z0-9](?:[a-z0-9-/]*[a-z0-9])?$/i;

function buildAuthorFile(a: NonNullable<SavePayload['newAuthors']>[number]): string {
  const lines = ['---', `name: ${yamlString(a.name)}`];
  if (a.role) lines.push(`role: ${yamlString(a.role)}`);
  if (a.location) lines.push(`location: ${yamlString(a.location)}`);
  if (a.url) lines.push(`url: ${a.url}`);
  if (a.avatar) lines.push(`avatar: ${a.avatar}`);
  if (a.bio) lines.push(`bio: ${yamlString(a.bio)}`);
  lines.push('---', '');
  if (a.bio) lines.push(a.bio, '');
  return lines.join('\n');
}

function yamlString(s: string): string {
  // Quote if there's any character YAML would treat as a control structure
  // (colon, quote, hash, dash at start). Doubles up any embedded quote.
  if (/[":#\n]/.test(s) || /^[-?]/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
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
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;
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
  const branch = payload.editing
    ? `blog/edit-${baseSlug}-${stamp}`
    : `blog/${baseSlug}-${stamp}`;
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

  // 3. Sweep up any stale per-locale files left behind by a slug rename. We
  //    delete the original-slug file on the new branch only if the per-locale
  //    draft committed at a different path; otherwise the upsert already
  //    overwrote the same file in-place.
  const removed: string[] = [];
  if (payload.editing) {
    for (const [locale, originalSlug] of Object.entries(payload.editing.originalSlugs)) {
      const draft = perLocale[locale];
      if (!draft || !LOCALE_RE.test(locale) || !SLUG_RE.test(originalSlug)) continue;
      if (draft.slug === originalSlug) continue;
      const stalePath = `content/blog/${locale}/${originalSlug}.md`;
      try {
        const existing = await octokit.repos.getContent({
          owner,
          repo,
          path: stalePath,
          ref: branch,
        });
        if (Array.isArray(existing.data) || existing.data.type !== 'file') continue;
        await octokit.repos.deleteFile({
          owner,
          repo,
          path: stalePath,
          branch,
          message: `chore(blog/${locale}): drop renamed slug ${originalSlug}`,
          sha: existing.data.sha,
        });
        removed.push(`${locale}:${originalSlug}`);
      } catch {
        /* nothing to delete */
      }
    }
  }

  // 3b. Commit any new authors as `content/blog/authors/<key>.md`. New keys
  //     skip silently if the file already exists (mid-air collision); edited
  //     keys deliberately overwrite using the existing SHA.
  const authorsCommitted: string[] = [];
  const authorsUpdated: string[] = [];
  const authorRuns: Array<{ list: NonNullable<typeof payload.newAuthors>; mode: 'create' | 'edit' }> = [
    { list: payload.newAuthors ?? [], mode: 'create' },
    { list: payload.editedAuthors ?? [], mode: 'edit' },
  ];
  for (const { list, mode } of authorRuns) {
    for (const author of list) {
      if (!AUTHOR_KEY_RE.test(author.key) || !author.name?.trim()) continue;
      const path = `content/blog/authors/${author.key}.md`;
      let existingSha: string | undefined;
      try {
        const res = await octokit.repos.getContent({ owner, repo, path, ref: branch });
        if (!Array.isArray(res.data) && res.data.type === 'file') {
          existingSha = res.data.sha;
        }
      } catch {
        /* doesn't exist */
      }
      if (mode === 'create' && existingSha) continue;
      if (mode === 'edit' && !existingSha) continue;
      try {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          branch,
          message:
            mode === 'create'
              ? `feat(blog/authors): add ${author.key}`
              : `chore(blog/authors): update ${author.key}`,
          content: Buffer.from(buildAuthorFile(author), 'utf8').toString('base64'),
          ...(existingSha ? { sha: existingSha } : {}),
        });
        if (mode === 'create') authorsCommitted.push(author.key);
        else authorsUpdated.push(author.key);
      } catch (e) {
        return NextResponse.json(
          { error: `Could not commit author ${author.key}: ${(e as Error).message}` },
          { status: 500 }
        );
      }
    }
  }

  // 3c. Splice new + edited categories into content/blog/categories.json.
  //     Edited entries overwrite labels in place; new entries skip silently
  //     if a path is already taken (mid-air collision).
  const categoriesCommitted: string[] = [];
  const categoriesUpdated: string[] = [];
  const totalCategoryWork =
    (payload.newCategories?.length ?? 0) + (payload.editedCategories?.length ?? 0);
  if (totalCategoryWork) {
    const categoriesPath = 'content/blog/categories.json';
    let existingSha: string | undefined;
    let existing: Record<string, Record<string, string>> = {};
    try {
      const res = await octokit.repos.getContent({
        owner,
        repo,
        path: categoriesPath,
        ref: branch,
      });
      if (!Array.isArray(res.data) && res.data.type === 'file') {
        existingSha = res.data.sha;
        existing = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf8'));
      }
    } catch {
      /* file doesn't exist on this branch — start from empty */
    }
    const merged = { ...existing };
    for (const cat of payload.newCategories ?? []) {
      if (!CATEGORY_PATH_RE.test(cat.path) || merged[cat.path]) continue;
      const labels: Record<string, string> = {};
      for (const [loc, label] of Object.entries(cat.labels)) {
        if (typeof label === 'string' && label.trim()) labels[loc] = label.trim();
      }
      if (!labels.en) continue;
      merged[cat.path] = labels;
      categoriesCommitted.push(cat.path);
    }
    for (const cat of payload.editedCategories ?? []) {
      if (!CATEGORY_PATH_RE.test(cat.path) || !merged[cat.path]) continue;
      const labels: Record<string, string> = {};
      for (const [loc, label] of Object.entries(cat.labels)) {
        if (typeof label === 'string' && label.trim()) labels[loc] = label.trim();
      }
      if (!labels.en) continue;
      merged[cat.path] = labels;
      categoriesUpdated.push(cat.path);
    }
    if (categoriesCommitted.length || categoriesUpdated.length) {
      const content = JSON.stringify(merged, null, 2) + '\n';
      const labelParts = [
        categoriesCommitted.length
          ? `add ${categoriesCommitted.join(', ')}`
          : '',
        categoriesUpdated.length
          ? `update ${categoriesUpdated.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join(' · ');
      try {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: categoriesPath,
          branch,
          message: `chore(blog/categories): ${labelParts}`,
          content: Buffer.from(content, 'utf8').toString('base64'),
          ...(existingSha ? { sha: existingSha } : {}),
        });
      } catch (e) {
        return NextResponse.json(
          { error: `Could not commit categories.json: ${(e as Error).message}` },
          { status: 500 }
        );
      }
    }
  }

  // 3d. Commit uploaded images under public/blog/images/… — one commit per
  //     file so the PR diff stays readable. Hard-validated paths only.
  const imagesCommitted: string[] = [];
  for (const img of payload.newImages ?? []) {
    if (!IMAGE_PATH_RE.test(img.path) || img.path.includes('..')) {
      return NextResponse.json(
        { error: `Invalid image path: ${img.path}` },
        { status: 400 }
      );
    }
    if (!img.contentBase64 || img.contentBase64.length > MAX_IMAGE_BASE64) {
      return NextResponse.json(
        { error: `Image too large or empty: ${img.path}` },
        { status: 400 }
      );
    }
    const filePath = `public${img.path}`;
    // Re-uploading a same-named image (e.g. editing a post and replacing a
    // shot) must overwrite — the contents API needs the existing SHA for
    // that, otherwise it 422s.
    let existingImageSha: string | undefined;
    try {
      const res = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
      if (!Array.isArray(res.data) && res.data.type === 'file') {
        existingImageSha = res.data.sha;
      }
    } catch {
      /* new file */
    }
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        branch,
        message: `feat(blog/images): add ${img.path.split('/').pop()}`,
        content: img.contentBase64,
        ...(existingImageSha ? { sha: existingImageSha } : {}),
      });
      imagesCommitted.push(img.path);
    } catch (e) {
      return NextResponse.json(
        { error: `Could not commit image ${img.path}: ${(e as Error).message}` },
        { status: 500 }
      );
    }
  }

  // 4. Open the PR. Source-locale title is the PR title; the body lists the
  //    locales we wrote so reviewers see at a glance what's included.
  const sourceFm = perLocale[sourceLocale]!.frontmatter;
  const action = payload.editing ? 'Update' : 'Blog';
  const bodyLines = [
    `Drafted from the **/admin/blog-editor**.`,
    '',
    `> ${sourceFm.excerpt}`,
    '',
    '**Locales included:**',
    ...committed.map(
      (l) => `- \`${l}\` — \`content/blog/${l}/${perLocale[l]!.slug}.md\``
    ),
    ...(removed.length
      ? ['', '**Renamed (old files removed):**', ...removed.map((r) => `- \`${r}.md\``)]
      : []),
    ...(authorsCommitted.length
      ? [
          '',
          '**New authors:**',
          ...authorsCommitted.map((k) => `- \`content/blog/authors/${k}.md\``),
        ]
      : []),
    ...(authorsUpdated.length
      ? [
          '',
          '**Edited authors:**',
          ...authorsUpdated.map((k) => `- \`content/blog/authors/${k}.md\``),
        ]
      : []),
    ...(categoriesCommitted.length
      ? [
          '',
          '**New categories:**',
          ...categoriesCommitted.map((p) => `- \`${p}\``),
        ]
      : []),
    ...(categoriesUpdated.length
      ? [
          '',
          '**Edited categories:**',
          ...categoriesUpdated.map((p) => `- \`${p}\``),
        ]
      : []),
    ...(imagesCommitted.length
      ? [
          '',
          '**Uploaded images:**',
          ...imagesCommitted.map((p) => `- \`public${p}\``),
        ]
      : []),
    '',
    '_Review the rendered post, tweak as needed, then mark ready for review._',
  ];

  try {
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      head: branch,
      base: baseBranch,
      title: `${action}: ${sourceFm.title}`,
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
