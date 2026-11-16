import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { del, get, list, put } from '@vercel/blob';
import { resolveDriver } from './driver';

/**
 * JSON documents only the server reads, by pathname (`seo/content-changes.json`,
 * `developer-requests/<id>.json`): a private object in the Blob store, or the same pathname
 * under `.data/` in offline dev (`resolveDriver()`). A private store has no public URL, so every
 * read goes through `get()` with the pathname.
 */

const LOCAL_ROOT = path.join(process.cwd(), '.data');

function localPath(pathname: string): string {
  return path.join(LOCAL_ROOT, pathname);
}

/** The document at `pathname`, or null when there is none or it cannot be read or parsed. */
export async function readPrivateJson<T>(pathname: string): Promise<T | null> {
  try {
    if (resolveDriver() === 'local') {
      return JSON.parse(await fs.readFile(localPath(pathname), 'utf8')) as T;
    }
    const result = await get(pathname, { access: 'private' });
    if (!result?.stream) return null;
    return (await new Response(result.stream).json()) as T;
  } catch {
    return null;
  }
}

/** Writes `value` at `pathname`, replacing what is there. */
export async function writePrivateJson(pathname: string, value: unknown): Promise<void> {
  const body = JSON.stringify(value);
  if (resolveDriver() === 'local') {
    await fs.mkdir(path.dirname(localPath(pathname)), { recursive: true });
    await fs.writeFile(localPath(pathname), body);
    return;
  }
  await put(pathname, body, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

/** The pathnames of the `.json` documents directly under `prefix` (`developer-requests/`). */
export async function listPrivateJson(prefix: string): Promise<string[]> {
  if (resolveDriver() === 'local') {
    try {
      const files = await fs.readdir(localPath(prefix));
      return files.filter((file) => file.endsWith('.json')).map((file) => `${prefix}${file}`);
    } catch {
      return [];
    }
  }
  const pathnames: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    pathnames.push(...page.blobs.map((blob) => blob.pathname).filter((p) => p.endsWith('.json')));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return pathnames;
}

/** Deletes the document at `pathname`; one that is not there is not an error. */
export async function deletePrivateJson(pathname: string): Promise<void> {
  if (resolveDriver() === 'local') {
    await fs.rm(localPath(pathname), { force: true });
    return;
  }
  await del(pathname);
}
