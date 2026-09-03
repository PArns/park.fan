/**
 * Receives Vercel Preview-Comment webhooks and forwards them to GitHub.
 *
 * GitHub Actions cannot receive webhooks, so this route is the relay:
 *
 *   Vercel comment.* ──▶ this route (verify + normalize + gate)
 *                    ──▶ repository_dispatch `vercel-comment`
 *                    ──▶ .github/workflows/vercel-comment-sync.yml
 *                    ──▶ comment on the matching PR
 *
 * Only comments left on **preview** deployments are synced — production and
 * localhost comments have no PR to go to and are dropped.
 *
 * Setup: `node scripts/setup-vercel-comment-webhook.mjs` plus the env vars in
 * `.env.example`. See docs/development/vercel-comment-sync.md.
 */

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { normalizeComment } from '@/lib/vercel-comments/normalize';
import {
  markerFor,
  renderReply,
  renderStatusChange,
  renderThreadComment,
} from '@/lib/vercel-comments/render';
import type { CommentDispatchPayload, NormalizedComment } from '@/lib/vercel-comments/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Repo and token follow the conventions the admin routes already established
 * (`lib/admin/media-session.ts`), so a deployment that can already commit from
 * the blog editor needs no second credential for this.
 */
function targetRepo(): string {
  return process.env.VERCEL_COMMENT_SYNC_REPO ?? process.env.GITHUB_REPOSITORY ?? 'PArns/park.fan';
}

function dispatchToken(): string | undefined {
  return (
    process.env.GITHUB_DISPATCH_TOKEN ??
    process.env.BLOG_EDITOR_GITHUB_TOKEN ??
    process.env.GITHUB_TOKEN
  );
}

/** Events that create or change comment text. */
const COMMENT_EVENTS = new Set(['comment.created', 'comment.updated']);
/** Events that only flip a thread's resolved state. */
const STATUS_EVENTS = new Set([
  'comment.resolved',
  'comment.unresolved',
  'thread.resolved',
  'thread.unresolved',
]);

/** Always 200 — a non-2xx makes Vercel retry, and a retry never helps here. */
function ack(reason: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, reason, ...extra });
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Fills in `branch` / `environment` when the comment payload didn't carry
 * them, by looking the deployment up in the Vercel REST API.
 */
async function enrichFromDeployment(comment: NormalizedComment): Promise<NormalizedComment> {
  const token = process.env.VERCEL_API_TOKEN;
  const reference = comment.deploymentId ?? comment.deploymentUrl?.replace(/^https?:\/\//, '');
  if (!token || !reference) return comment;
  if (comment.branch && comment.environment !== 'unknown') return comment;

  const url = new URL(`https://api.vercel.com/v13/deployments/${encodeURIComponent(reference)}`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID);

  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return comment;

    const deployment = (await response.json()) as {
      target?: string | null;
      meta?: Record<string, string | undefined>;
      gitSource?: { ref?: string; prId?: number; sha?: string };
    };

    const branch =
      comment.branch ?? deployment.meta?.githubCommitRef ?? deployment.gitSource?.ref ?? null;
    const prMeta = deployment.meta?.githubPrId ?? deployment.gitSource?.prId;
    const commitSha =
      comment.commitSha ?? deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha ?? null;
    const productionBranch = (process.env.VERCEL_PRODUCTION_BRANCH || 'main').toLowerCase();

    return {
      ...comment,
      branch,
      commitSha,
      prNumber: comment.prNumber ?? (prMeta ? Number(prMeta) : null),
      environment:
        deployment.target === 'production'
          ? 'production'
          : deployment.target === 'preview'
            ? 'preview'
            : branch
              ? branch.toLowerCase() === productionBranch
                ? 'production'
                : 'preview'
              : comment.environment,
    };
  } catch (error) {
    console.error('[vercel-comments] Deployment lookup failed:', error);
    return comment;
  }
}

async function dispatchToGitHub(payload: CommentDispatchPayload): Promise<Response> {
  return fetch(`https://api.github.com/repos/${targetRepo()}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${dispatchToken()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: 'vercel-comment', client_payload: payload }),
  });
}

export async function POST(request: Request) {
  if (process.env.VERCEL_COMMENT_SYNC === 'off') return ack('sync disabled');

  const secret = process.env.VERCEL_COMMENT_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[vercel-comments] VERCEL_COMMENT_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('x-vercel-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let envelope: { type?: string; payload?: unknown };
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = envelope.type ?? '';
  const isComment = COMMENT_EVENTS.has(event);
  const isStatus = STATUS_EVENTS.has(event);
  if (!isComment && !isStatus) return ack('event ignored', { event });

  const comment = await enrichFromDeployment(normalizeComment(envelope));

  // ── Preview gate ────────────────────────────────────────────────────────────
  // Production and localhost comments have no PR. `unknown` is dropped too
  // unless explicitly allowed, so a payload shape we failed to read never
  // leaks production feedback onto a random PR.
  if (comment.environment === 'production') return ack('production comment ignored');
  if (comment.environment === 'unknown' && process.env.VERCEL_COMMENT_SYNC_UNKNOWN !== 'on') {
    return ack('environment could not be determined', { branch: comment.branch });
  }
  if (!comment.branch && !comment.prNumber) return ack('no branch or PR to map to');

  if (!dispatchToken()) {
    console.error('[vercel-comments] No GitHub token set (GITHUB_DISPATCH_TOKEN)');
    return NextResponse.json({ error: 'Dispatch not configured' }, { status: 500 });
  }

  // The thread id anchors one PR comment per thread. When the payload carries
  // none, derive a STABLE one — a timestamp would make every redelivery of the
  // same event open another PR comment.
  const threadId =
    comment.threadId ??
    comment.commentId ??
    crypto.createHash('sha1').update(rawBody).digest('hex').slice(0, 12);

  const dispatchPayload: CommentDispatchPayload = {
    event,
    threadId,
    marker: markerFor(threadId),
    branch: comment.branch,
    prNumber: comment.prNumber,
    commitSha: comment.commitSha,
    resolved: comment.resolved,
    mode: isStatus ? 'status' : 'comment',
    body: renderThreadComment({ ...comment, threadId }),
    update: isStatus ? renderStatusChange(comment) : renderReply(comment),
    images: comment.images,
    pageUrl: comment.pageUrl,
    deploymentUrl: comment.deploymentUrl,
  };

  const response = await dispatchToGitHub(dispatchPayload);
  if (!response.ok) {
    const detail = await response.text();
    console.error('[vercel-comments] Dispatch failed:', response.status, detail);
    return NextResponse.json(
      { error: 'Dispatch failed', status: response.status },
      { status: 502 }
    );
  }

  return ack('dispatched', { threadId, branch: comment.branch, event });
}
