import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { put, get } from '@vercel/blob';
import { resolveDriver } from '@/lib/contribute/driver';
import type { ContentChangeSnapshot } from './types';

/**
 * Where the observed content-change dates live between the daily crawl that writes them and the
 * sitemaps that read them: Vercel Blob, or `.data/` in offline dev (`resolveDriver()`), because
 * they must survive a deploy and an ISR regeneration. Every read failure returns null: a sitemap
 * without `<lastmod>` beats one that 500s because a blob was slow.
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

/** The stored content-change snapshot, or null when there is none or it cannot be read. */
export function readContentChangeSnapshot(): Promise<ContentChangeSnapshot | null> {
  return resolveDriver() === 'vercel-blob' ? readBlob() : readLocal();
}

/** Stores the content-change snapshot for the sitemaps to read. */
export function writeContentChangeSnapshot(snapshot: ContentChangeSnapshot): Promise<void> {
  return resolveDriver() === 'vercel-blob' ? writeBlob(snapshot) : writeLocal(snapshot);
}

/**
 * Not about freshness (the snapshot changes once a day): the sitemap routes revalidate on the
 * same clock and regenerate together, and would each re-read a multi-megabyte object.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; index: ReadonlyMap<string, string> } | null = null;

/** Path → `YYYY-MM-DD` of the last content change, for the sitemaps; empty without a snapshot. */
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

/** Its own cache: the lastmod index is keyed by content path and read by other routes. */
let coverageCached: { at: number; index: ReadonlyMap<string, string | null> } | null = null;

/**
 * Park path → the last date that park's schedule reaches, for the calendar sitemap. Empty means
 * "no answer", never "no coverage": truncating the catalogue on a cold blob would drop thousands
 * of live URLs.
 */
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
