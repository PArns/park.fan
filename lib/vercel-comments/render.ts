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

/** Cap on the raw payload we inline — `repository_dispatch` allows ~64 KB total. */
const RAW_PAYLOAD_LIMIT = 24_000;

/** Hidden anchor that lets the Action find the PR comment belonging to a thread. */
export function markerFor(threadId: string): string {
  return `<!-- vercel-comment-sync:thread:${threadId} -->`;
}

/** Escapes the pipe characters that would otherwise break a markdown table. */
function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

/** Inline code span. Backticks in the value would break out of it, so drop them. */
function code(value: string): string {
  return `\`${value.replace(/`/g, '').replace(/\n+/g, ' ')}\``;
}

function quote(text: string): string {
  return text
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
  if (json.length <= limit) return json;
  return `${json.slice(0, limit)}\n… truncated (${json.length - limit} more characters)`;
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
  if (comment.branch) rows.push(['Branch', code(comment.branch)]);
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
    event: comment.event,
    author: comment.author,
    text: comment.text,
    page: comment.pagePath ?? comment.pageUrl,
    pageUrl: comment.pageUrl,
    file: comment.sourceFile,
    component: comment.componentPath,
    selector: comment.selector,
    position: comment.position,
    viewport: comment.viewport,
    branch: comment.branch,
    deploymentUrl: comment.deploymentUrl,
    images: comment.images,
    resolved: comment.resolved,
  };

  return [
    '<details>',
    '<summary>Context for automation (JSON)</summary>',
    '',
    '```json vercel-comment-context',
    stringifyCapped(context, RAW_PAYLOAD_LIMIT),
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
  return `${sections.filter((section) => section.trim() !== '').join('\n\n')}\n`;
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
