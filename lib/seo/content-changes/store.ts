import 'server-only';
import { readPrivateJson, writePrivateJson } from '@/lib/storage/private-json';
import type { ContentChangeSnapshot } from './types';

/**
 * Where the observed content-change dates live between the daily crawl that writes them and the
 * sitemaps that read them: Vercel Blob, or `.data/` in offline dev (`resolveDriver()`), because
 * they must survive a deploy and an ISR regeneration. Every read failure returns null: a sitemap
 * without `<lastmod>` beats one that 500s because a blob was slow.
 */

const BLOB_KEY = 'seo/content-changes.json';

/** The stored content-change snapshot, or null when there is none or it cannot be read. */
export function readContentChangeSnapshot(): Promise<ContentChangeSnapshot | null> {
  return readPrivateJson<ContentChangeSnapshot>(BLOB_KEY);
}

/** Stores the content-change snapshot for the sitemaps to read. */
export function writeContentChangeSnapshot(snapshot: ContentChangeSnapshot): Promise<void> {
  return writePrivateJson(BLOB_KEY, snapshot);
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
