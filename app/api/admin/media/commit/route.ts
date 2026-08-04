import 'server-only';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

import { requireAdminPass } from '@/lib/admin/verify-pass';
import { getMediaImage } from '@/lib/media';
import { getMediaText } from '@/lib/media/text';
import { normalizeSidecar, serializeSidecar } from '@/lib/media/sidecar.mjs';

/**
 * The media database's write path: everything lands as a pull request.
 *
 * The database IS the repository — images and their sidecars are committed files —
 * so there is no separate store to write to, and on Vercel the filesystem is
 * read-only anyway. This mirrors what the blog editor already does: branch,
 * commit, open a PR, let a human merge. That also means every change to the
 * catalog is reviewable and revertible, which for copyright and attribution data
 * is worth more than the convenience of writing in place.
 *
 * Every save joins the **open session** — the pull request whose branch carries the
 * `media/session-` prefix — so a working session is one reviewable PR rather than
 * one per image. See `SESSION_PREFIX` below.
 *
 * Four operations, all in one PR:
 *   - `create`   a new image + its sidecar
 *   - `update`   sidecar fields only (tags, park/ride, focal point, credit, text)
 *   - `move`     re-file an image into another collection or rename it
 *   - `replace`  swap the bytes, keep the sidecar (the low-res upgrade path)
 */

export const runtime = 'nodejs';
export const maxDuration = 300;

const MEDIA_ROOT = 'public/media';
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const COLLECTION_RE = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;
const EXT_RE = /^(jpg|jpeg|png|webp|avif|svg)$/i;
/** ~6 MB raw per image; a 2048px JPEG is well under this. */
const MAX_BYTES = 8 * 1024 * 1024;

interface SidecarPayload {
  park?: string | null;
  parkPath?: string | null;
  ride?: string | null;
  area?: string | null;
  title?: string | null;
  tags?: string[];
  roles?: string[];
  alt?: Record<string, string>;
  caption?: Record<string, string>;
  credit?: Record<string, unknown>;
  shotAt?: string | null;
  order?: number | null;
  gps?: { lat: number; lon: number } | null;
  focus?: { x: number; y: number } | string | null;
}

interface Operation {
  op: 'create' | 'update' | 'move' | 'replace';
  /** Existing image id, for update / move / replace. */
  id?: string;
  /** Target collection and file name, for create / move. */
  collection?: string;
  name?: string;
  ext?: string;
  /** Base64 image bytes, for create / replace. */
  contentBase64?: string;
  sidecar?: SidecarPayload;
}

interface CommitPayload {
  operations: Operation[];
  /** Optional PR title override — the UI names a batch after what it was. */
  title?: string;
  /**
   * Force a fresh branch and pull request instead of joining the open session.
   * The admin's "Start a new pull request" button.
   */
  newSession?: boolean;
}

/**
 * Branch prefix that marks a session's pull request.
 *
 * A session is not a client-side token: it is **the open pull request carrying
 * this prefix**. Saving looks for one and commits onto its branch, so retagging
 * twelve images is twelve commits in one reviewable PR rather than twelve PRs —
 * and it survives a page reload, another tab, or a different machine, which a
 * `sessionStorage` id would not. It ends the way it began, in git: merge or close
 * the PR and the next save opens a new one. "Start a new pull request" in the
 * admin forces that early.
 */
const SESSION_PREFIX = 'media/session-';

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** The file paths an image occupies: the bytes and its sidecar. */
function pathsFor(collection: string, name: string, ext: string) {
  return {
    image: `${MEDIA_ROOT}/${collection}/${name}.${ext}`,
    sidecar: `${MEDIA_ROOT}/${collection}/${name}.json`,
  };
}

/**
 * Merge a payload over what the image already has, then normalize.
 *
 * Normalizing through the SAME module the build generator uses is the point: a
 * sidecar written here is byte-identical to one a human would hand-author, so the
 * PR diff is readable and the two authoring paths can't drift.
 */
function buildSidecarFile(existingId: string | undefined, payload: SidecarPayload = {}) {
  const current = existingId ? getMediaImage(existingId) : null;
  const currentText = existingId ? getMediaText(existingId) : {};

  const merged = {
    park: payload.park !== undefined ? payload.park : current?.park,
    parkPath: payload.parkPath !== undefined ? payload.parkPath : current?.parkPath,
    ride: payload.ride !== undefined ? payload.ride : current?.ride,
    area: payload.area !== undefined ? payload.area : current?.area,
    title: payload.title !== undefined ? payload.title : current?.title,
    tags: payload.tags ?? current?.tags,
    roles: payload.roles ?? current?.roles,
    alt: payload.alt ?? currentText.alt,
    caption: payload.caption ?? currentText.caption,
    credit: payload.credit ?? current?.credit,
    shotAt: payload.shotAt !== undefined ? payload.shotAt : current?.shotAt,
    order: payload.order !== undefined ? payload.order : current?.order,
    // An EXIF-derived fix is re-read from the file on every build, so it is never
    // written back — only a manual override belongs on disk.
    gps: payload.gps ?? (current?.gps?.source === 'manual' ? current.gps : null),
    focus: payload.focus !== undefined ? payload.focus : current?.focus,
  };

  const { sidecar, text, issues } = normalizeSidecar(merged);
  return { content: serializeSidecar(sidecar, text), issues };
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;

  let payload: CommitPayload;
  try {
    payload = await req.json();
  } catch {
    return bad('Body is not valid JSON');
  }

  const operations = payload.operations ?? [];
  if (!operations.length) return bad('No operations');

  // ─── validate everything before touching GitHub ───────────────────────────
  // A half-applied batch would leave the repository in a state nobody asked for,
  // and the failure would be discovered as a broken build rather than an error.
  const planned: {
    op: Operation;
    from?: { image: string; sidecar: string };
    to: { image: string; sidecar: string };
    sidecarContent: string;
    issues: string[];
  }[] = [];

  for (const op of operations) {
    const existing = op.id ? getMediaImage(op.id) : null;
    if (op.op !== 'create' && !existing) return bad(`Unknown image "${op.id}"`);

    const collection = op.collection ?? existing?.collection;
    const name = op.name ?? existing?.id.split('/').pop();
    const ext = (op.ext ?? existing?.format ?? '').toLowerCase();

    if (!collection || !COLLECTION_RE.test(collection))
      return bad(`Bad collection "${collection}"`);
    if (!name || !NAME_RE.test(name)) return bad(`Bad file name "${name}"`);
    if (!EXT_RE.test(ext)) return bad(`Bad extension "${ext}"`);

    if ((op.op === 'create' || op.op === 'replace') && !op.contentBase64) {
      return bad(`"${op.op}" needs image bytes`);
    }
    if (op.contentBase64 && Buffer.byteLength(op.contentBase64, 'base64') > MAX_BYTES) {
      return bad(`"${name}.${ext}" is larger than ${Math.round(MAX_BYTES / 1024 / 1024)} MB`);
    }

    const { content, issues } = buildSidecarFile(op.id, op.sidecar);
    planned.push({
      op,
      from: existing
        ? pathsFor(existing.collection, existing.id.split('/').pop()!, existing.format)
        : undefined,
      to: pathsFor(collection, name, ext),
      sidecarContent: content,
      issues,
    });
  }

  // ─── open a branch and commit ─────────────────────────────────────────────

  const token = process.env.BLOG_EDITOR_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) {
    return bad(
      'No GitHub token configured. Set BLOG_EDITOR_GITHUB_TOKEN on the deployment — ' +
        'a fine-grained PAT for this repository with "Contents: read & write" and ' +
        '"Pull requests: read & write". See docs/features/media-database.md.',
      500
    );
  }

  const repoEnv = process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
  const [owner = 'PArns', repo = 'park.fan'] = repoEnv.split('/');
  const baseBranch = process.env.BLOG_EDITOR_BASE_BRANCH ?? 'main';
  const octokit = new Octokit({ auth: token });

  let baseSha: string;
  try {
    const { data } = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
    baseSha = data.object.sha;
  } catch (e) {
    return bad(`Could not read ${baseBranch}: ${(e as Error).message}`, 502);
  }

  // ─── join the open session, or start one ──────────────────────────────────
  // Looked up on the server rather than tracked in the browser, so a reload, a
  // second tab and a different machine all land in the same pull request.
  let session: { number: number; url: string; body: string } | null = null;
  if (!payload.newSession) {
    try {
      const { data: open } = await octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        base: baseBranch,
        per_page: 100,
      });
      const found = open.find((pr) => pr.head.ref.startsWith(SESSION_PREFIX));
      if (found) {
        session = { number: found.number, url: found.html_url, body: found.body ?? '' };
      }
    } catch (e) {
      // Not fatal: worst case this save opens its own PR instead of joining one.
      console.warn(`[media] could not list open pull requests: ${(e as Error).message}`);
    }
  }

  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const branch = session
    ? (await octokit.pulls.get({ owner, repo, pull_number: session.number })).data.head.ref
    : `${SESSION_PREFIX}${stamp}`;

  if (!session) {
    try {
      await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseSha });
    } catch (e) {
      return bad(`Could not create ${branch}: ${(e as Error).message}`, 502);
    }
  }

  /** Current blob SHA on the branch, or undefined when the path is new. */
  async function shaOf(path: string): Promise<string | undefined> {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      return Array.isArray(data) ? undefined : (data as { sha: string }).sha;
    } catch {
      return undefined;
    }
  }

  async function put(path: string, content: string, message: string) {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch,
      message,
      content,
      sha: await shaOf(path),
    });
  }

  async function remove(path: string, message: string) {
    const sha = await shaOf(path);
    if (!sha) return;
    await octokit.repos.deleteFile({ owner, repo, path, branch, message, sha });
  }

  const summary: string[] = [];
  try {
    for (const step of planned) {
      const { op, from, to, sidecarContent } = step;

      if (op.contentBase64) {
        await put(to.image, op.contentBase64, `media: ${op.op} ${to.image}`);
      } else if (from && from.image !== to.image) {
        // A move with no new bytes: re-commit the existing blob at the new path.
        // GitHub's contents API has no rename, so this is copy-then-delete — the
        // blob SHA is identical, so git records it as a rename in the PR anyway.
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: from.image,
          ref: branch,
        });
        const blob = data as { content?: string };
        if (!blob.content) throw new Error(`Could not read ${from.image}`);
        await put(to.image, blob.content.replace(/\n/g, ''), `media: move ${from.image}`);
      }

      // A `replace` carries no sidecar payload, so its content is rebuilt from the
      // BUILD-TIME manifest — which describes the base branch. Rewriting it would
      // undo any sidecar edit made earlier in the same session. Ops that do carry a
      // payload send the complete sidecar, so writing those is always correct.
      const rebuiltFromManifest = !op.sidecar;
      const alreadyOnBranch = rebuiltFromManifest ? await shaOf(to.sidecar) : undefined;
      if (!rebuiltFromManifest || !alreadyOnBranch) {
        await put(
          to.sidecar,
          Buffer.from(sidecarContent).toString('base64'),
          `media: ${to.sidecar}`
        );
      }

      if (from && from.image !== to.image) {
        await remove(from.image, `media: move away ${from.image}`);
        await remove(from.sidecar, `media: move away ${from.sidecar}`);
        summary.push(`moved \`${from.image}\` → \`${to.image}\``);
      } else if (op.op === 'create') {
        summary.push(`added \`${to.image}\``);
      } else if (op.op === 'replace') {
        summary.push(`replaced the bytes of \`${to.image}\``);
      } else {
        summary.push(`updated \`${to.sidecar}\``);
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Commit failed on ${branch}: ${(e as Error).message}`, branch },
      { status: 502 }
    );
  }

  const issues = planned.flatMap((p) => p.issues);

  const lines = [
    ...summary.map((s) => `- ${s}`),
    ...(issues.length
      ? [
          '',
          '**Sidecar warnings** (the values were dropped, not written):',
          ...issues.map((i) => `- ${i}`),
        ]
      : []),
  ];
  const FOOTER = ['', '---', '_Generated by [Claude Code](https://claude.ai/code)_'].join('\n');

  try {
    // Joining a session: append this batch to the running PR's body and count the
    // whole session in its title, so the PR reads as one log rather than being
    // overwritten by whichever save happened last.
    if (session) {
      const kept = session.body.split('\n---\n')[0].trimEnd();
      const body = `${kept}\n${lines.join('\n')}${FOOTER}`;
      const changes = body.split('\n').filter((l) => l.startsWith('- ')).length;
      await octokit.pulls.update({
        owner,
        repo,
        pull_number: session.number,
        title: `media: ${changes} change${changes === 1 ? '' : 's'} (session)`,
        body,
      });
      return NextResponse.json({
        branch,
        pullRequest: session.url,
        joinedSession: true,
        summary,
        issues,
      });
    }

    const title =
      payload.title ?? `media: ${summary.length} change${summary.length === 1 ? '' : 's'}`;
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      head: branch,
      base: baseBranch,
      title,
      draft: true,
      body: [
        'Media database changes from the admin browser.',
        '',
        'Further saves join this pull request until it is merged or closed.',
        '',
        ...lines,
        FOOTER,
      ].join('\n'),
    });
    return NextResponse.json({
      branch,
      pullRequest: pr.html_url,
      joinedSession: false,
      summary,
      issues,
    });
  } catch (e) {
    // The commits landed; only the PR did not. Report the branch so the work is
    // not lost and a PR can be opened by hand.
    return NextResponse.json(
      {
        branch,
        summary,
        issues,
        warning: `Committed, but could not open a PR: ${(e as Error).message}`,
      },
      { status: 207 }
    );
  }
}
