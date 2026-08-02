/**
 * Turns an (undocumented) Vercel `comment.*` webhook payload into a
 * {@link NormalizedComment}.
 *
 * Vercel does not publish the payload shape for comment events, and it may
 * change without notice. So instead of hard-coding a path like
 * `payload.comment.author.name`, we breadth-first scan the whole object and
 * pick fields by key name — shallowest match wins. Anything we fail to
 * recognise still reaches the PR because the raw payload is rendered into a
 * collapsed `<details>` block.
 */

import type { CommentEnvironment, NormalizedComment, VercelWebhookEnvelope } from './types';

const MAX_DEPTH = 12;
const MAX_ENTRIES = 5000;

interface ScanEntry {
  path: string;
  key: string;
  value: unknown;
  depth: number;
}

/**
 * Breadth-first walk over the payload. BFS (not DFS) matters: it means the
 * entries arrive shallowest-first, so "first match wins" naturally prefers
 * `payload.text` over `payload.thread.comments[3].author.profile.text`.
 */
function scan(root: unknown): ScanEntry[] {
  const out: ScanEntry[] = [];
  const seen = new Set<object>();
  const queue: Array<{ node: unknown; path: string; key: string; depth: number }> = [
    { node: root, path: '', key: '', depth: 0 },
  ];

  while (queue.length > 0 && out.length < MAX_ENTRIES) {
    const { node, path, key, depth } = queue.shift()!;
    if (node === null || node === undefined) continue;

    if (typeof node === 'object') {
      if (seen.has(node as object)) continue;
      seen.add(node as object);
      out.push({ path, key, value: node, depth });
      if (depth >= MAX_DEPTH) continue;

      const isArray = Array.isArray(node);
      const children: Array<readonly [string, unknown]> = isArray
        ? (node as unknown[]).map((v, i) => [String(i), v] as const)
        : Object.entries(node as Record<string, unknown>);

      for (const [childKey, childValue] of children) {
        queue.push({
          node: childValue,
          path: path ? `${path}.${childKey}` : childKey,
          // Array items inherit the array's key so `images[0]` still reads as "images".
          key: isArray ? key : childKey,
          depth: depth + 1,
        });
      }
    } else {
      out.push({ path, key, value: node, depth });
    }
  }

  return out;
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** First entry whose key matches, optionally filtered by value shape. */
function pick(
  entries: ScanEntry[],
  keyPattern: RegExp,
  accept: (value: unknown) => boolean = isNonEmptyString
): unknown {
  for (const entry of entries) {
    if (entry.key && keyPattern.test(entry.key) && accept(entry.value)) return entry.value;
  }
  return null;
}

function pickString(entries: ScanEntry[], keyPattern: RegExp): string | null {
  const value = pick(entries, keyPattern);
  return isNonEmptyString(value) ? value.trim() : null;
}

/**
 * Like {@link pickString}, but the entry's *path* must match too.
 *
 * Needed for generic keys: a bare `id` appears on the team, the project, the
 * thread and the comment, so `thread.id` has to be selected by context rather
 * than by "shallowest wins".
 */
function pickScoped(
  entries: ScanEntry[],
  pathPattern: RegExp,
  keyPattern: RegExp,
  accept: (value: unknown) => boolean = isNonEmptyString
): string | null {
  for (const entry of entries) {
    if (!entry.key || !keyPattern.test(entry.key)) continue;
    if (!pathPattern.test(entry.path)) continue;
    if (accept(entry.value)) return String(entry.value).trim();
  }
  return null;
}

/**
 * Coerces a value into an absolute URL. Vercel sends deployment hosts without
 * a scheme (`park-fan-abc.vercel.app`), which would render as a broken
 * markdown link. Returns null for anything that is not a URL at all — a bare
 * path like `/de/park/x` stays a path.
 */
function absolute(value: string | null | undefined): string | null {
  if (!isNonEmptyString(value)) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$|\?)/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function pickNumber(entries: ScanEntry[], keyPattern: RegExp): number | null {
  const value = pick(
    entries,
    keyPattern,
    (v) => typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))
  );
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return Number.parseInt(value, 10);
  return null;
}

/**
 * Pulls readable text out of a value that might be a plain string, a rich-text
 * node tree, or an array of either.
 */
function deepText(value: unknown, depth = 0): string {
  if (depth > 6) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => deepText(item, depth + 1))
      .filter(Boolean)
      .join('');
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (isNonEmptyString(record.text)) return record.text;
    const nested = record.children ?? record.content ?? record.nodes;
    if (nested) return deepText(nested, depth + 1);
  }
  return '';
}

/** Name of a person, given either a string or a user-ish object. */
function readAuthor(value: unknown): string | null {
  if (isNonEmptyString(value)) return value.trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['name', 'username', 'displayName', 'nickname', 'email', 'login']) {
      if (isNonEmptyString(record[key])) return String(record[key]).trim();
    }
  }
  return null;
}

const IMAGE_KEY =
  /^(image|images|screenshot|screenshots|attachment|attachments|thumbnail|photo|media|file|files|asset|assets|src|preview)/i;
const IMAGE_URL = /^https?:\/\/\S+/i;
const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;

/** Collect anything that plausibly points at an uploaded image. */
function collectImages(entries: ScanEntry[]): string[] {
  const found = new Set<string>();

  for (const entry of entries) {
    if (!isNonEmptyString(entry.value)) continue;
    const value = entry.value.trim();
    if (!IMAGE_URL.test(value)) continue;

    const keyLooksLikeImage = IMAGE_KEY.test(entry.key);
    const pathLooksLikeImage = IMAGE_KEY.test(entry.path.split('.').at(-2) ?? '');
    if (keyLooksLikeImage || pathLooksLikeImage || IMAGE_EXTENSION.test(value)) {
      found.add(value);
    }
  }

  return [...found];
}

function toPath(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.startsWith('/') ? url : null;
  }
}

function readViewport(entries: ScanEntry[]): string | null {
  const width = pickNumber(entries, /^(screenWidth|viewportWidth|windowWidth|width)$/i);
  const height = pickNumber(entries, /^(screenHeight|viewportHeight|windowHeight|height)$/i);
  const ratio = pickNumber(entries, /^(devicePixelRatio|dpr|pixelRatio)$/i);

  if (width === null && height === null) {
    return pickString(entries, /^(viewport|screen|resolution)$/i);
  }

  const size = `${width ?? '?'}×${height ?? '?'}`;
  return ratio ? `${size} @${Number(ratio.toFixed(2))}x` : size;
}

function readEnvironment(entries: ScanEntry[], branch: string | null): CommentEnvironment {
  const raw = pickString(entries, /^(target|environment|deploymentTarget|env)$/i)?.toLowerCase();
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'preview' || raw === 'staging') return 'preview';

  // No explicit target — a non-default branch still tells us it is a preview.
  const productionBranch = (process.env.VERCEL_PRODUCTION_BRANCH || 'main').toLowerCase();
  if (branch) return branch.toLowerCase() === productionBranch ? 'production' : 'preview';
  return 'unknown';
}

/** Whether an event should be treated as "this thread is now resolved". */
function readResolved(entries: ScanEntry[], event: string): boolean {
  if (event === 'comment.resolved' || event === 'thread.resolved') return true;
  if (event === 'comment.unresolved' || event === 'thread.unresolved') return false;
  const flag = pick(entries, /^(resolved|isResolved)$/i, (v) => typeof v === 'boolean');
  return flag === true;
}

export function normalizeComment(envelope: VercelWebhookEnvelope): NormalizedComment {
  const event = envelope.type ?? 'comment.unknown';
  const payload = envelope.payload ?? envelope;
  const entries = scan(payload);

  const textCandidate = pick(
    entries,
    /^(text|body|content|message|comment|plainText)$/i,
    (v) => deepText(v).trim().length > 0
  );
  const text = deepText(textCandidate).trim() || null;

  const branch =
    pickString(entries, /^(branch|githubCommitRef|gitBranch|ref|gitRef|headRef)$/i) ?? null;

  const deploymentUrl =
    absolute(pickString(entries, /^(deploymentUrl|previewUrl|deploymentHost)$/i)) ??
    absolute(pickScoped(entries, /deployment/i, /^(url|host|alias)$/i)) ??
    absolute(
      entries.find(
        (entry) => isNonEmptyString(entry.value) && /\.vercel\.(app|sh)\b/.test(entry.value)
      )?.value as string | undefined
    );

  // The page the comment sits on — prefer a URL that lives next to location /
  // page / anchor data over the deployment's own root URL.
  const pageUrl =
    absolute(pickScoped(entries, /(location|page|anchor|context)/i, /^(url|href|pageUrl)$/i)) ??
    absolute(pickString(entries, /^(pageUrl|href|location)$/i)) ??
    deploymentUrl;

  const environment = readEnvironment(entries, branch);

  return {
    event,
    // A bare `id` sits on the team, the project, the thread and the comment
    // alike, so it is only ever read from a path that says which one it is.
    threadId:
      pickString(entries, /^(threadId|thread_id|threadID)$/i) ??
      pickScoped(entries, /thread/i, /^id$/i) ??
      pickScoped(entries, /comment/i, /^id$/i),
    commentId:
      pickString(entries, /^(commentId|comment_id|commentID)$/i) ??
      pickScoped(entries, /comment/i, /^id$/i),
    text,
    author: readAuthor(pick(entries, /^(author|user|createdBy|owner|member)$/i, () => true)),
    resolved: readResolved(entries, event),

    pageUrl,
    pagePath: toPath(pickString(entries, /^(pagePath|pathname|route)$/i) ?? pageUrl),

    deploymentUrl,
    deploymentId: pickString(entries, /^(deploymentId|deployment_id|dpl)$/i),
    branch,
    prNumber: pickNumber(entries, /^(prNumber|pullRequestNumber|githubPrId|prId)$/i),
    environment,
    projectId: pickString(entries, /^(projectId|project_id)$/i),

    selector: pickString(entries, /^(selector|cssSelector|elementSelector|xpath|domPath)$/i),
    sourceFile: pickString(entries, /^(sourceFile|fileName|filePath|file|source)$/i),
    componentPath: pickString(entries, /^(componentPath|componentStack|component|componentName)$/i),
    position: (() => {
      const x = pickNumber(entries, /^(x|left|offsetX|clientX)$/i);
      const y = pickNumber(entries, /^(y|top|offsetY|clientY)$/i);
      return x !== null && y !== null ? `x: ${x}, y: ${y}` : null;
    })(),

    viewport: readViewport(entries),
    userAgent: pickString(entries, /^(ua|userAgent)$/i),

    images: collectImages(entries),
    // Deep link into the Vercel dashboard. Restricted to vercel.com so this
    // never accidentally picks up the deployment URL again.
    threadUrl:
      absolute(pickString(entries, /^(threadUrl|permalink|vercelUrl|dashboardUrl)$/i)) ??
      pickScoped(
        entries,
        /thread|comment/i,
        /^(url|link)$/i,
        (value) => isNonEmptyString(value) && /^https?:\/\/(\w+\.)*vercel\.com\//i.test(value)
      ),

    raw: payload,
  };
}
