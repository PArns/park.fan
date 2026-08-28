import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { put, get } from '@vercel/blob';
import { resolveDriver } from '@/lib/contribute/driver';
import type { ContentChangeSnapshot } from './types';

/**
 * Where the observed content-change dates live between the daily crawl that
 * writes them and the sitemaps that read them.
 *
 * It has to survive a deploy, so it cannot be a file in the repo, and it has to
 * survive an ISR regeneration, so it cannot be module state. `resolveDriver()` is
 * borrowed from the contributions module rather than re-deciding the same
 * `BLOB_READ_WRITE_TOKEN` question a second time — the driver picks Vercel Blob
 * wherever a store is linked and the local filesystem for offline dev, where
 * `.data/` is already ignored.
 *
 * **Every read failure is silent and returns null.** A missing snapshot means the
 * sitemaps emit no `<lastmod>`, which is exactly what they did before this
 * existed; a sitemap that 500s because a blob was slow would be a much worse
 * trade than one that is briefly less informative.
 */

const BLOB_KEY = 'seo/content-changes.json';
const LOCAL_PATH = path.join(process.cwd(), '.data', 'seo', 'content-changes.json');

async function readLocal(): Promise<ContentChangeSnapshot | null> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_PATH, 'utf8')) as ContentChangeSnapshot;
  } catch {
    return null;
  }
}

async function writeLocal(snapshot: ContentChangeSnapshot): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(snapshot));
}

async function readBlob(): Promise<ContentChangeSnapshot | null> {
  try {
    const result = await get(BLOB_KEY, { access: 'private' });
    if (!result?.stream) return null;
    return (await new Response(result.stream).json()) as ContentChangeSnapshot;
  } catch {
    return null;
  }
}

async function writeBlob(snapshot: ContentChangeSnapshot): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(snapshot), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export function readContentChangeSnapshot(): Promise<ContentChangeSnapshot | null> {
  return resolveDriver() === 'vercel-blob' ? readBlob() : readLocal();
}

export function writeContentChangeSnapshot(snapshot: ContentChangeSnapshot): Promise<void> {
  return resolveDriver() === 'vercel-blob' ? writeBlob(snapshot) : writeLocal(snapshot);
}

/**
 * Path → `YYYY-MM-DD`, for the sitemaps. Empty when there is no snapshot yet.
 *
 * The TTL is not about freshness — the snapshot changes once a day — it is about
 * the seven sitemap routes, which revalidate on the same 24 h clock and therefore
 * tend to regenerate together. Without it, one expiry re-reads a multi-megabyte
 * object seven times inside a few seconds.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; index: ReadonlyMap<string, string> } | null = null;

export async function getContentLastmodIndex(): Promise<ReadonlyMap<string, string>> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.index;

  const snapshot = await readContentChangeSnapshot();
  const index = new Map<string, string>();
  for (const [contentPath, entry] of Object.entries(snapshot?.entries ?? {})) {
    index.set(contentPath, entry.changedAt);
  }

  cached = { at: Date.now(), index };
  return index;
}

/**
 * Park path → the last date that park's schedule reaches, for the calendar sitemap.
 *
 * Empty when there is no snapshot yet, or when the one on disk predates the field — and empty has
 * to mean "no answer", not "no coverage": a reader that truncated the catalogue on a cold blob
 * would drop thousands of live URLs the first morning the store came back slow.
 *
 * Shares `getContentLastmodIndex`'s TTL reasoning and its cache entry would have been the obvious
 * place to put it, except that index is keyed by *content* path and includes every ride; this one
 * answers only for parks and is read by a different route. One extra parse every five minutes is
 * cheaper than making either of them carry the other's shape.
 */
let coverageCached: { at: number; index: ReadonlyMap<string, string | null> } | null = null;

export async function getScheduleCoverageIndex(): Promise<ReadonlyMap<string, string | null>> {
  if (coverageCached && Date.now() - coverageCached.at < CACHE_TTL_MS) return coverageCached.index;

  const snapshot = await readContentChangeSnapshot();
  const index = new Map<string, string | null>();
  for (const [parkPath, to] of Object.entries(snapshot?.scheduleCoverage ?? {})) {
    index.set(parkPath, to);
  }

  coverageCached = { at: Date.now(), index };
  return index;
}
