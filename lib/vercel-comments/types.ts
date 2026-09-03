/**
 * Types for the Vercel Preview Comment → GitHub PR sync.
 *
 * Vercel's `comment.*` / `thread.*` webhook events are accepted by
 * `POST /v1/webhooks` (they appear in the public OpenAPI schema) but their
 * *payload* shape is not documented anywhere. Everything below is therefore
 * modelled as "best effort": `normalizeComment()` deep-scans whatever arrives
 * and the raw payload is always carried through so nothing is ever lost.
 */

/** Envelope every Vercel webhook shares — documented at /docs/webhooks. */
export interface VercelWebhookEnvelope {
  id?: string;
  type?: string;
  createdAt?: number;
  payload?: unknown;
  region?: string | null;
}

/** Which deployment environment a comment was left on. */
export type CommentEnvironment = 'preview' | 'production' | 'unknown';

/**
 * A comment event flattened into the fields we care about. Every field is
 * nullable — we only render what Vercel actually sent.
 */
export interface NormalizedComment {
  /** Raw event type, e.g. `comment.created`. */
  event: string;
  /** Stable thread id — one PR comment is kept per thread. */
  threadId: string | null;
  /** Id of the individual comment inside the thread. */
  commentId: string | null;
  /** The comment text itself. */
  text: string | null;
  /** Display name of whoever wrote it. */
  author: string | null;
  /** Team members @-mentioned in the comment — usually who is being asked. */
  mentions: string[];
  /** When the comment was written, ISO 8601. */
  createdAt: string | null;
  /** Whether the thread is resolved. */
  resolved: boolean;

  /** Full URL of the page the comment sits on. */
  pageUrl: string | null;
  /** Just the path part of `pageUrl`, e.g. `/de/park/phantasialand`. */
  pagePath: string | null;

  /** Deployment the comment was left on. */
  deploymentUrl: string | null;
  deploymentId: string | null;
  /**
   * Commit the commented-on deployment was built from. Feedback belongs to
   * *that* commit, not to whatever the PR head happens to be by the time the
   * webhook lands — Vercel itself warns that people comment on outdated
   * previews. The Action compares it against the PR head and flags a stale one.
   */
  commitSha: string | null;
  /** Git branch behind that deployment — this is what maps to a PR. */
  branch: string | null;
  /** PR number, when Vercel hands it to us directly. */
  prNumber: number | null;
  environment: CommentEnvironment;
  projectId: string | null;

  /** DOM selector of the element that was clicked. */
  selector: string | null;
  /** Source file / component the element came from, when available. */
  sourceFile: string | null;
  /** React component stack / path, when available. */
  componentPath: string | null;
  /**
   * Where on the page the comment was placed — a point, or the rectangle of a
   * click-and-drag region screenshot.
   */
  position: string | null;

  /** Viewport description, e.g. `1619×1284 @1.8x`. */
  viewport: string | null;
  userAgent: string | null;

  /** Screenshots / pasted images attached to the comment. */
  images: string[];
  /** Deep link back into the Vercel thread. */
  threadUrl: string | null;

  /** The untouched webhook payload. */
  raw: unknown;
}

/** What the webhook route hands to the GitHub Action via `repository_dispatch`. */
export interface CommentDispatchPayload {
  event: string;
  threadId: string;
  marker: string;
  branch: string | null;
  prNumber: number | null;
  /** Commit the comment was left on — the Action flags it when it is stale. */
  commitSha: string | null;
  resolved: boolean;
  /**
   * `comment` = a new comment or reply, `status` = the thread was resolved or
   * reopened. Decides which of `body` / `update` the Action uses.
   */
  mode: 'comment' | 'status';
  /** Rendered markdown for a brand new PR comment. */
  body: string;
  /** Rendered markdown appended to an existing PR comment (replies, status). */
  update: string;
  images: string[];
  pageUrl: string | null;
  deploymentUrl: string | null;
}
