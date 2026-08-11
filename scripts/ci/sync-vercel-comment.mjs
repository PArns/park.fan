#!/usr/bin/env node
/**
 * Posts a Vercel Preview Comment onto the matching GitHub PR.
 *
 * Run by .github/workflows/vercel-comment-sync.yml on a `vercel-comment`
 * repository_dispatch. The payload is produced by
 * app/api/webhooks/vercel-comments/route.ts — the markdown is already
 * rendered there, so this script only has to:
 *
 *   1. find the PR for the branch,
 *   2. re-host screenshots so they render inline,
 *   3. create one PR comment per Vercel thread, appending replies to it.
 *
 * Env: CLIENT_PAYLOAD, GITHUB_TOKEN, GITHUB_REPOSITORY, [VERCEL_API_TOKEN],
 *      [ASSET_BRANCH].
 */

import crypto from 'node:crypto';

const API = 'https://api.github.com';
const [OWNER, REPO] = (process.env.GITHUB_REPOSITORY || '').split('/');
const TOKEN = process.env.GITHUB_TOKEN;
const ASSET_BRANCH = process.env.ASSET_BRANCH || 'vercel-comment-assets';

const EXTENSION_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function gh(path, options = {}) {
  const response = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(
      `GitHub ${options.method || 'GET'} ${path} → ${response.status}: ${detail}`
    );
    // Carry the status separately: callers must never have to regex it out of
    // the message, where a "422" inside a response body would match too.
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

/** GitHub rejects a comment body over this many characters. */
const COMMENT_BODY_LIMIT = 65_536;

/**
 * A Vercel comment is feedback on the deployment of ONE commit. By the time
 * the webhook arrives the branch may have moved on, and Vercel itself warns
 * that people comment on outdated previews. Say so in the comment rather than
 * letting the feedback read as if it were about the current head.
 */
function stalenessNote(payload, headSha) {
  const commented = payload.commitSha;
  if (!commented || !headSha) return '';
  if (headSha.startsWith(commented) || commented.startsWith(headSha)) return '';
  return (
    `> [!WARNING]\n` +
    `> Left on \`${commented.slice(0, 7)}\`, but the PR head is now ` +
    `\`${headSha.slice(0, 7)}\` — check this still applies before acting on it.`
  );
}

/**
 * Resolve the PR: explicit number wins, otherwise look it up by head branch.
 * Returns the head SHA too, so the comment can be checked against the commit
 * it was actually left on.
 */
async function resolvePullRequest(payload) {
  if (payload.prNumber) {
    const pull = await gh(`/repos/${OWNER}/${REPO}/pulls/${payload.prNumber}`);
    return { number: pull.number, headSha: pull.head?.sha ?? null };
  }
  if (!payload.branch) return null;

  const pulls = await gh(
    `/repos/${OWNER}/${REPO}/pulls?state=open&head=${encodeURIComponent(`${OWNER}:${payload.branch}`)}&per_page=1`
  );
  if (pulls.length > 0) return { number: pulls[0].number, headSha: pulls[0].head?.sha ?? null };

  // Forks push from a different owner, so fall back to scanning open PRs.
  const open = await gh(`/repos/${OWNER}/${REPO}/pulls?state=open&per_page=100`);
  const match = open.find((pull) => pull.head.ref === payload.branch);
  return match ? { number: match.number, headSha: match.head?.sha ?? null } : null;
}

/** Ensure the asset branch exists, branching off the default branch once. */
async function ensureAssetBranch() {
  try {
    await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${ASSET_BRANCH}`);
    return true;
  } catch {
    // Not there yet — create it.
  }

  try {
    const repo = await gh(`/repos/${OWNER}/${REPO}`);
    const base = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${repo.default_branch}`);
    await gh(`/repos/${OWNER}/${REPO}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${ASSET_BRANCH}`, sha: base.object.sha }),
    });
    return true;
  } catch (error) {
    console.warn(`! Could not create ${ASSET_BRANCH}: ${error.message}`);
    return false;
  }
}

/**
 * Vercel serves comment attachments from authenticated URLs, which GitHub
 * cannot render. Download each one and commit it to the asset branch so the
 * PR comment can embed a public raw URL instead.
 */
async function rehostImages(images, threadId) {
  const mapping = new Map();
  if (images.length === 0) return mapping;
  if (!(await ensureAssetBranch())) return mapping;

  for (const [index, url] of images.entries()) {
    try {
      const headers = {};
      if (process.env.VERCEL_API_TOKEN && /vercel\.(com|app|sh)/.test(url)) {
        headers.Authorization = `Bearer ${process.env.VERCEL_API_TOKEN}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.warn(`! Skipping image ${index + 1}: HTTP ${response.status}`);
        continue;
      }

      const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
      const extension = EXTENSION_BY_TYPE[contentType];
      if (!extension) {
        console.warn(`! Skipping image ${index + 1}: unexpected type "${contentType}"`);
        continue;
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      const digest = crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 12);
      const safeThread = String(threadId).replace(/[^a-zA-Z0-9_-]/g, '');
      const path = `vercel-comments/${safeThread}/${digest}.${extension}`;

      await gh(`/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `chore(vercel-comments): screenshot for thread ${safeThread}`,
          content: bytes.toString('base64'),
          branch: ASSET_BRANCH,
        }),
      }).catch((error) => {
        // A duplicate screenshot hashes to a path that already exists — fine.
        if (error.status !== 422) throw error;
      });

      mapping.set(
        url,
        `https://raw.githubusercontent.com/${OWNER}/${REPO}/${ASSET_BRANCH}/${path}`
      );
      console.log(`✓ Re-hosted image ${index + 1} → ${path}`);
    } catch (error) {
      console.warn(`! Image ${index + 1} failed: ${error.message}`);
    }
  }

  return mapping;
}

function applyMapping(markdown, mapping) {
  let result = markdown;
  for (const [from, to] of mapping) result = result.split(from).join(to);
  return result;
}

/**
 * Appends without ever exceeding GitHub's comment limit. A long-running thread
 * would otherwise grow past it and every further reply would fail the PATCH.
 * The head is kept (it holds the marker this comment is found by) and the
 * newest addition always lands; the middle is what gives way.
 */
function fitComment(existingBody, addition) {
  const combined = `${existingBody.trimEnd()}\n${addition}`;
  if (combined.length <= COMMENT_BODY_LIMIT) return combined;

  const notice = "\n\n---\n\n_Earlier replies trimmed to stay within GitHub's comment limit._\n";
  const keepHead = COMMENT_BODY_LIMIT - addition.length - notice.length;
  if (keepHead <= 0) return addition.slice(0, COMMENT_BODY_LIMIT);
  return `${existingBody.slice(0, keepHead).trimEnd()}${notice}${addition}`;
}

/** The PR comment that already represents this Vercel thread, if any. */
async function findThreadComment(prNumber, marker) {
  for (let page = 1; page <= 10; page += 1) {
    const comments = await gh(
      `/repos/${OWNER}/${REPO}/issues/${prNumber}/comments?per_page=100&page=${page}`
    );
    const match = comments.find((comment) => comment.body?.includes(marker));
    if (match) return match;
    if (comments.length < 100) return null;
  }
  return null;
}

async function main() {
  if (!TOKEN) fail('GITHUB_TOKEN is not set');
  if (!OWNER || !REPO) fail('GITHUB_REPOSITORY is not set');

  let payload;
  try {
    payload = JSON.parse(process.env.CLIENT_PAYLOAD || '{}');
  } catch (error) {
    fail(`CLIENT_PAYLOAD is not valid JSON: ${error.message}`);
  }
  if (!payload.marker) fail('payload has no marker');

  const pull = await resolvePullRequest(payload);
  if (!pull) {
    console.log(`· No open PR for branch "${payload.branch}" — nothing to sync.`);
    return;
  }
  const prNumber = pull.number;
  const staleness = stalenessNote(payload, pull.headSha);
  if (staleness) console.log(`! Comment is about ${payload.commitSha?.slice(0, 7)}, not the head`);

  // Look the existing comment up first: it decides which markdown we are about
  // to post, and therefore whether any screenshots need re-hosting at all. A
  // "thread resolved" event carries no images and must not create the asset
  // branch for nothing.
  const existing = await findThreadComment(prNumber, payload.marker);
  const markdown = existing ? payload.update : payload.body;
  const mapping = /<img\s|!\[/.test(markdown || '')
    ? await rehostImages(payload.images || [], payload.threadId)
    : new Map();

  if (!existing) {
    const body = [staleness, applyMapping(payload.body, mapping)].filter(Boolean).join('\n\n');
    const created = await gh(`/repos/${OWNER}/${REPO}/issues/${prNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: body.slice(0, COMMENT_BODY_LIMIT) }),
    });
    console.log(`✓ Created comment on PR #${prNumber}: ${created.html_url}`);
    return;
  }

  const addition = [staleness, applyMapping(payload.update, mapping)].filter(Boolean).join('\n\n');
  if (existing.body.includes(addition.trim()) && payload.mode === 'status') {
    console.log('· Status already reflected — nothing to do.');
    return;
  }

  let body = fitComment(existing.body, addition);
  if (payload.mode === 'status') {
    body = payload.resolved
      ? body.replace('### 💬 Vercel Preview Comment', '### ✅ Vercel Preview Comment (resolved)')
      : body.replace('### ✅ Vercel Preview Comment (resolved)', '### 💬 Vercel Preview Comment');
  }

  const updated = await gh(`/repos/${OWNER}/${REPO}/issues/comments/${existing.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
  console.log(`✓ Updated comment on PR #${prNumber}: ${updated.html_url}`);
}

main().catch((error) => fail(error.message));
