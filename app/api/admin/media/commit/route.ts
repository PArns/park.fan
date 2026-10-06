import 'server-only';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

import { denyUnlessAdmin } from '@/lib/admin/session';
import { adminGithubToken, adminRepo } from '@/lib/admin/github';
import {
  SESSION_PREFIX,
  readSessionJson,
  resolveSession,
  sessionChanges,
  sessionFiles,
  type MediaSession,
} from '@/lib/admin/media-session';
import { postFilePath, postsReferencing, rewriteReferences } from '@/lib/admin/media-references';
import {
  handOverUniqueRoles,
  idOfSidecarPath,
  uniqueClaims,
  type RoleHolder,
} from '@/lib/admin/media-unique-roles';
import { getMediaImage, searchMedia } from '@/lib/media';
import { getMediaText } from '@/lib/media/text';
import { normalizeSidecar, serializeSidecar } from '@/lib/media/sidecar.mjs';

/**
 * The media database's write path: every change lands as a pull request, because the database is
 * the repository (Vercel's filesystem is read-only) and attribution data should be reviewable.
 * Every save joins the open session's pull request (`@/lib/admin/media-session`). The operations
 * are `create`, `update` (sidecar only), `move` and `replace`; a sidecar that claims a unique role
 * takes it from the image that held it (`@/lib/admin/media-unique-roles`).
 */

export const runtime = 'nodejs';
export const maxDuration = 300;

const MEDIA_ROOT = 'public/media';
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const COLLECTION_RE = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;
const EXT_RE = /^(jpg|jpeg|png|webp|avif|svg)$/i;
/**
 * Per-image ceiling, just under what Vercel passes once base64 adds a third: a limit above the
 * real one turns a clear "too large" into an opaque platform error. The client shrinks anything
 * bigger first (`app/admin/_lib/upload-transport.ts`).
 */
const MAX_BYTES = 3.5 * 1024 * 1024;

interface SidecarPayload {
  park?: string | null;
  parkPath?: string | null;
  ride?: string | null;
  alsoRides?: string[];
  collections?: string[];
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
  /** Still needs a proper pass — written by `/admin/capture`, cleared in the browser. */
  review?: boolean;
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
 * Merges a payload over what the image has, then normalizes it through the module the build
 * generator uses, so a sidecar written here is byte-identical to a hand-authored one.
 */
function buildSidecarFile(existingId: string | undefined, payload: SidecarPayload = {}) {
  const current = existingId ? getMediaImage(existingId) : null;
  const currentText = existingId ? getMediaText(existingId) : {};

  const merged = {
    park: payload.park !== undefined ? payload.park : current?.park,
    parkPath: payload.parkPath !== undefined ? payload.parkPath : current?.parkPath,
    ride: payload.ride !== undefined ? payload.ride : current?.ride,
    // Carried through like every other field: omitting it would drop the second ride's only
    // photo (see MediaSidecar.alsoRides).
    alsoRides: payload.alsoRides ?? current?.alsoRides,
    // Sent by the media editor (`[]` clears it); a payload without the field keeps what
    // the image has, so an upload or move from elsewhere cannot drop the image out of
    // its further collections (see MediaSidecar.collections).
    collections: payload.collections ?? current?.collections,
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
    // `!== undefined`, like every other three-state field here: clearing the flag
    // IS the edit the review pass makes, and `?? current` would make it unclearable.
    review: payload.review !== undefined ? payload.review : current?.review,
  };

  const { sidecar, text, issues } = normalizeSidecar(merged);
  return { content: serializeSidecar(sidecar, text), sidecar, issues };
}

export async function POST(req: Request) {
  const unauthorized = await denyUnlessAdmin(req);
  if (unauthorized) return unauthorized;

  let payload: CommitPayload;
  try {
    payload = await req.json();
  } catch {
    return bad('Body is not valid JSON');
  }

  const operations = payload.operations ?? [];
  if (!operations.length) return bad('No operations');

  // Validate everything before touching GitHub: a half-applied batch would surface as a broken
  // build rather than an error.
  const planned: {
    op: Operation;
    from?: { image: string; sidecar: string };
    to: { image: string; sidecar: string };
    /** Collection + name on both sides — what repointing blog references needs. */
    fromRef?: { collection: string; name: string };
    toRef: { collection: string; name: string; ext: string };
    sidecarContent: string;
    /** Unique roles this sidecar claims — what other images may have to give up. */
    claims: string[];
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
      return bad(`"${name}.${ext}" is larger than ${(MAX_BYTES / 1024 / 1024).toFixed(1)} MB`);
    }

    const { content, sidecar, issues } = buildSidecarFile(op.id, op.sidecar);
    planned.push({
      op,
      from: existing
        ? pathsFor(existing.collection, existing.id.split('/').pop()!, existing.format)
        : undefined,
      fromRef: existing
        ? { collection: existing.collection, name: existing.id.split('/').pop()! }
        : undefined,
      to: pathsFor(collection, name, ext),
      toRef: { collection, name, ext },
      sidecarContent: content,
      claims: uniqueClaims(sidecar),
      issues,
    });
  }

  const token = adminGithubToken();
  if (!token) {
    return bad(
      'No GitHub token configured. Set BLOG_EDITOR_GITHUB_TOKEN on the deployment — ' +
        'a fine-grained PAT for this repository with "Contents: read & write" and ' +
        '"Pull requests: read & write". See docs/features/media-database.md.',
      500
    );
  }

  const { owner, repo, baseBranch } = adminRepo();
  const octokit = new Octokit({ auth: token });

  let baseSha: string;
  try {
    const { data } = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
    baseSha = data.object.sha;
  } catch (e) {
    return bad(`Could not read ${baseBranch}: ${(e as Error).message}`, 502);
  }

  // Join the open session or start one, looked up on the server so a reload, a second tab and
  // another machine land in the same pull request. A failed lookup is an error, not "no session",
  // or every save would open a pull request of its own.
  let session: MediaSession | null = null;
  if (!payload.newSession) {
    try {
      session = await resolveSession(octokit, { owner, repo, baseBranch });
    } catch (e) {
      return bad(
        `Could not tell whether a media session is running, so this save was not made — ` +
          `committing now could open a second pull request beside the open one. ` +
          `GitHub said: ${(e as Error).message}`,
        502
      );
    }
  }

  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const branch = session ? session.branch : `${SESSION_PREFIX}${stamp}`;

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
      const { op, from, fromRef, to, toRef, sidecarContent } = step;

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
        // Only when it is a different file: a sidecar's path has no extension, so replacing a
        // `.png` with a `.jpg` keeps the path of the sidecar just written above.
        if (from.sidecar !== to.sidecar) {
          await remove(from.sidecar, `media: move away ${from.sidecar}`);
        }
        summary.push(
          op.contentBase64
            ? `replaced \`${from.image}\` with \`${to.image}\``
            : `moved \`${from.image}\` → \`${to.image}\``
        );

        // Repoint every article that named the old path, in this same pull request, so a move
        // never breaks a published page. `postsReferencing` reads the build-time manifest, so
        // only the matches are fetched.
        for (const key of postsReferencing(fromRef!.collection, fromRef!.name)) {
          const postPath = postFilePath(key);
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: postPath,
            ref: branch,
          });
          const file = data as { content?: string; sha?: string };
          if (!file.content || !file.sha) continue;
          const body = Buffer.from(file.content, 'base64').toString('utf8');
          const { body: next, changed } = rewriteReferences(body, fromRef!, toRef);
          if (!changed) continue;
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: postPath,
            branch,
            message: `content(blog): repoint ${key} at ${to.image}`,
            content: Buffer.from(next).toString('base64'),
            sha: file.sha,
          });
          summary.push(`repointed ${changed} reference(s) in \`${postPath}\``);
        }
      } else if (op.op === 'create') {
        summary.push(`added \`${to.image}\``);
      } else if (op.op === 'replace') {
        // A replace may carry sidecar edits made in the same pass; say so, or the PR log reads
        // as if only the pixels moved.
        summary.push(
          op.sidecar
            ? `replaced the file \`${to.image}\` and updated its sidecar`
            : `replaced the file \`${to.image}\``
        );
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

  // Unique roles change hands after the batch, so a failed batch has taken nothing, and in a try
  // of its own, since the photos above have landed. The current holder is looked for in the
  // build-time manifest and on the session branch, and the branch wins.
  let handoverWarning: string | null = null;
  const claims = new Set(planned.flatMap((p) => p.claims));
  if (claims.size) {
    try {
      const written = new Set(
        planned.flatMap((p) => [p.to.sidecar, ...(p.from ? [p.from.sidecar] : [])])
      );
      const holders = new Map<string, RoleHolder>();
      for (const image of searchMedia()) {
        holders.set(`${MEDIA_ROOT}/${image.id}.json`, image);
      }
      if (session) {
        const ref = { owner, repo, baseBranch };
        for (const file of await sessionFiles(octokit, ref, session)) {
          if (!file.filename.startsWith(`${MEDIA_ROOT}/`) || !file.filename.endsWith('.json')) {
            continue;
          }
          if (file.status === 'removed') {
            holders.delete(file.filename);
            continue;
          }
          const raw = await readSessionJson(octokit, ref, session, file.filename);
          if (raw) holders.set(file.filename, normalizeSidecar(raw).sidecar);
        }
      }

      const handovers = await handOverUniqueRoles({
        claimants: planned.map((p) => ({
          id: `${p.toRef.collection}/${p.toRef.name}`,
          claims: p.claims,
        })),
        holders,
        skip: written,
        // The file as it stands on the branch, never the manifest's version.
        read: async (path) => {
          const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
          const file = data as { content?: string };
          return file.content
            ? JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'))
            : null;
        },
        write: (path, content, roles) =>
          put(
            path,
            Buffer.from(content).toString('base64'),
            `media: ${roles.join(', ')} moves from ${idOfSidecarPath(path)}`
          ),
      });
      for (const { from, roles, to } of handovers) {
        summary.push(
          `${roles.map((role) => `\`${role}\``).join(', ')} moved from \`${from}\` to \`${to}\``
        );
      }
    } catch (e) {
      handoverWarning =
        `Saved, but the previous holder of ${[...claims].join(', ')} could not be updated ` +
        `and still claims it: ${(e as Error).message}`;
      summary.push(`**not moved:** ${handoverWarning}`);
    }
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
  const PREAMBLE = [
    'Media database changes from the admin browser.',
    '',
    'Further saves join this pull request until it is merged or closed.',
    '',
  ];

  /** The session log so far, with the footer and anything after it stripped. */
  const kept = session?.body ? session.body.split('\n---\n')[0].trimEnd() : PREAMBLE.join('\n');
  const body = `${kept}\n${lines.join('\n')}${FOOTER}`;
  const changes = sessionChanges(body);

  try {
    // Joining a session that already has its pull request: append this batch to the
    // running body and count the whole session in the title, so the PR reads as one
    // log rather than being overwritten by whichever save happened last.
    if (session?.number) {
      await octokit.pulls.update({
        owner,
        repo,
        pull_number: session.number,
        title: `media: ${changes.length} change${changes.length === 1 ? '' : 's'} (session)`,
        body,
      });
      return NextResponse.json({
        branch,
        pullRequest: session.url,
        joinedSession: true,
        summary,
        issues,
        changes,
        ...(handoverWarning ? { warning: handoverWarning } : {}),
      });
    }

    // Either a brand-new branch, or a session branch that never got a pull request
    // (an earlier save answered 207, or somebody closed the PR and left the branch).
    // Adopting it is what keeps the whole session in ONE pull request.
    const adopted = Boolean(session);
    const title = adopted
      ? `media: ${changes.length} change${changes.length === 1 ? '' : 's'} (session)`
      : (payload.title ?? `media: ${summary.length} change${summary.length === 1 ? '' : 's'}`);
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      head: branch,
      base: baseBranch,
      title,
      draft: true,
      body,
    });
    return NextResponse.json({
      branch,
      pullRequest: pr.html_url,
      joinedSession: adopted,
      summary,
      issues,
      changes,
      ...(handoverWarning ? { warning: handoverWarning } : {}),
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
