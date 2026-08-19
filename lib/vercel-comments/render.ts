/**
 * Renders a {@link NormalizedComment} into the markdown that ends up on the
 * GitHub PR.
 *
 * Two audiences read this output, so it carries both:
 *  - humans get a quoted comment, a context table and inline screenshots;
 *  - Claude (and any other automation) gets a `vercel-comment-context` JSON
 *    block plus the raw webhook payload, so nothing has to be parsed out of
 *    prose.
 */

import type { NormalizedComment } from './types';

/**
 * Size budget. Two hard 65,536-character ceilings sit downstream — one on a
 * `repository_dispatch` payload, one on a GitHub comment body — and a single
 * long comment lands in the output three times over (quote, context JSON, raw
 * payload), so per-block caps alone do not bound the total. These are chosen
 * so that even a maximal `body` + `update` stays well inside both.
 */
const QUOTE_LIMIT = 4_000;
const CONTEXT_LIMIT = 6_000;
const RAW_PAYLOAD_LIMIT = 12_000;
/** Belt and braces: the final rendered markdown is never longer than this. */
export const BODY_LIMIT = 60_000;

const MARKER_PREFIX = 'vercel-comment-sync:thread:';

/** Hidden anchor that lets the Action find the PR comment belonging to a thread. */
export function markerFor(threadId: string): string {
  return `<!-- ${MARKER_PREFIX}${threadId} -->`;
}

/**
 * Neutralizes our own anchor inside attacker-controlled text.
 *
 * Comment text is written by anyone who can reach the preview. Left as-is, a
 * comment containing `<!-- vercel-comment-sync:thread:OTHER -->` would make
 * the Action treat that PR comment as the home of a *different* thread, so
 * later replies would be appended to the wrong place.
 */
function sanitize(text: string): string {
  return text.split(MARKER_PREFIX).join('vercel-comment-sync(redacted):');
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n… truncated (${text.length - limit} more characters)`;
}

/** Escapes the pipe characters that would otherwise break a markdown table. */
function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

/** Inline code span. Backticks in the value would break out of it, so drop them. */
function code(value: string): string {
  return `\`${value.replace(/`/g, '').replace(/\n+/g, ' ')}\``;
}

/** Blockquote of untrusted comment text — sanitized and length-capped. */
function quote(text: string): string {
  return truncate(sanitize(text), QUOTE_LIMIT)
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function stringifyCapped(value: unknown, limit: number): string {
  let json: string;
  try {
    json = JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return '// payload could not be serialized';
  }
  return truncate(sanitize(json), limit);
}

function contextTable(comment: NormalizedComment): string {
  const rows: Array<[string, string]> = [];

  if (comment.pagePath || comment.pageUrl) {
    const label = comment.pagePath ?? comment.pageUrl!;
    rows.push(['Page', comment.pageUrl ? `[${cell(label)}](${comment.pageUrl})` : cell(label)]);
  }
  if (comment.sourceFile) rows.push(['File', code(comment.sourceFile)]);
  if (comment.componentPath) rows.push(['Component', code(comment.componentPath)]);
  if (comment.selector) rows.push(['Element', code(comment.selector)]);
  if (comment.position) rows.push(['Position', cell(comment.position)]);
  if (comment.viewport) rows.push(['Viewport', cell(comment.viewport)]);
  if (comment.mentions.length > 0) {
    // Rendered as plain text — a live @mention would ping an unrelated
    // GitHub user who happens to share the name.
    rows.push(['Mentions', comment.mentions.map((name) => code(`@${name}`)).join(' ')]);
  }
  if (comment.createdAt) rows.push(['Written', cell(comment.createdAt)]);
  if (comment.branch) rows.push(['Branch', code(comment.branch)]);
  if (comment.commitSha) rows.push(['Commit', code(comment.commitSha.slice(0, 7))]);
  if (comment.deploymentUrl) {
    rows.push(['Deployment', `[${cell(comment.deploymentUrl)}](${comment.deploymentUrl})`]);
  }
  if (comment.userAgent) rows.push(['Browser', cell(comment.userAgent)]);
  if (comment.threadUrl) rows.push(['Thread', `[open in Vercel](${comment.threadUrl})`]);

  if (rows.length === 0) return '';
  return ['| | |', '| --- | --- |', ...rows.map(([k, v]) => `| **${k}** | ${v} |`)].join('\n');
}

function screenshots(comment: NormalizedComment): string {
  if (comment.images.length === 0) return '';
  const shots = comment.images
    .map((url, index) => `<img src="${url}" alt="Screenshot ${index + 1}" width="420">`)
    .join('\n');
  return ['**Screenshots**', '', shots].join('\n');
}

/**
 * Compact, stable JSON for automation. Deliberately separate from the raw
 * payload: this shape is ours and will not shift when Vercel changes theirs.
 */
function automationContext(comment: NormalizedComment): string {
  const context = {
    threadId: comment.threadId,
    commentId: comment.commentId,
    event: comment.event,
    author: comment.author,
    mentions: comment.mentions,
    createdAt: comment.createdAt,
    text: comment.text,
    page: comment.pagePath ?? comment.pageUrl,
    pageUrl: comment.pageUrl,
    file: comment.sourceFile,
    component: comment.componentPath,
    selector: comment.selector,
    position: comment.position,
    viewport: comment.viewport,
    branch: comment.branch,
    // The commit this feedback is actually about — not necessarily the PR head.
    commitSha: comment.commitSha,
    deploymentUrl: comment.deploymentUrl,
    images: comment.images,
    resolved: comment.resolved,
  };

  return [
    '<details>',
    '<summary>Context for automation (JSON)</summary>',
    '',
    '```json vercel-comment-context',
    stringifyCapped(context, CONTEXT_LIMIT),
    '```',
    '',
    '</details>',
  ].join('\n');
}

function rawPayload(comment: NormalizedComment): string {
  return [
    '<details>',
    '<summary>Raw Vercel webhook payload</summary>',
    '',
    '```json',
    stringifyCapped(comment.raw, RAW_PAYLOAD_LIMIT),
    '```',
    '',
    '</details>',
  ].join('\n');
}

function byline(comment: NormalizedComment): string {
  const parts = [comment.author ? `**${cell(comment.author)}**` : '**Someone**'];
  if (comment.pagePath) parts.push(`on ${code(comment.pagePath)}`);
  return parts.join(' ');
}

/**
 * Joins sections with a blank line between them, dropping the ones that came
 * back empty. The blank lines are load-bearing: without them GitHub renders
 * the context table as literal pipes.
 */
function joinSections(sections: Array<string>): string {
  const markdown = sections.filter((section) => section.trim() !== '').join('\n\n');
  return `${truncate(markdown, BODY_LIMIT)}\n`;
}

/** Full body for a freshly created PR comment (one per Vercel thread). */
export function renderThreadComment(comment: NormalizedComment): string {
  const heading = comment.resolved
    ? '### ✅ Vercel Preview Comment (resolved)'
    : '### 💬 Vercel Preview Comment';

  return joinSections([
    markerFor(comment.threadId ?? 'unknown'),
    heading,
    byline(comment),
    comment.text ? quote(comment.text) : '_(no text)_',
    contextTable(comment),
    screenshots(comment),
    automationContext(comment),
    rawPayload(comment),
  ]);
}

/** Block appended to the existing PR comment when a thread gets a reply. */
export function renderReply(comment: NormalizedComment): string {
  return joinSections([
    '---',
    `**↩️ Reply** — ${byline(comment)}`,
    comment.text ? quote(comment.text) : '_(no text)_',
    screenshots(comment),
    automationContext(comment),
  ]);
}

/** Block appended when a thread is resolved or reopened. */
export function renderStatusChange(comment: NormalizedComment): string {
  const who = comment.author ? ` by **${cell(comment.author)}**` : '';
  const state = comment.resolved ? '✅ Thread resolved' : '🔄 Thread reopened';
  return `\n---\n\n${state}${who}.\n`;
}
