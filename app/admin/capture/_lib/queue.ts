'use client';

/**
 * Photographs that have been taken but not yet committed.
 *
 * A park is the worst network the admin will ever run on: guest WLAN behind a
 * captive portal, a cell three thousand people are sharing, and long stretches
 * inside a building where neither works. Every one of those turns an upload into a
 * failure, and without somewhere to put the file the only remaining copy is in the
 * camera roll — findable, in principle, among the two hundred other pictures taken
 * that day, with nothing recording which ride it was of.
 *
 * So a failed commit is not an error message, it is a row in here. IndexedDB rather
 * than `localStorage` because the value is a `Blob` and `localStorage` stores
 * strings: base64 would inflate every photo by a third and blow the ~5 MB quota on
 * the second one. It survives a reload, the screen locking, and Safari discarding
 * the tab to reclaim memory, which is what happens when a phone camera runs beside
 * a web app.
 *
 * Retried on the `online` event and by hand from the footer. Nothing here decides
 * WHEN to retry — that is the screen's job, and it is deliberately not automatic on
 * a timer: a queue that retries in a dead spot burns the battery that has to last
 * until the park closes.
 */

const DB_NAME = 'parkfan-capture';
const DB_VERSION = 1;
const STORE = 'queue';

/** One photograph waiting for a network, with everything needed to commit it later. */
export interface QueuedPhoto {
  id: string;
  /** The bytes. Stored as given — the transcode and shrink happen at commit time. */
  blob: Blob;
  fileName: string;
  /** Geo path of the park, so a queue drained tomorrow still knows where it belongs. */
  parkPath: string;
  parkSlug: string;
  collection: string;
  /** File name without extension, already deduplicated against the park's photos. */
  name: string;
  rideSlug: string | null;
  rideName: string;
  area: string | null;
  shotAt: string | null;
  gps: { lat: number; lon: number } | null;
  /** Who to credit — resolved when the photo was taken, not when it uploads. */
  author: string | null;
  tags: string[];
  queuedAt: number;
  attempts: number;
  lastError: string | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB nicht verfügbar'));
  });
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = work(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Warteschlange nicht lesbar'));
        transaction.oncomplete = () => db.close();
      })
  );
}

export function queuePhoto(photo: QueuedPhoto): Promise<IDBValidKey> {
  return run('readwrite', (store) => store.put(photo));
}

/** Oldest first, so a drained queue commits in the order the photos were taken. */
export async function listQueued(): Promise<QueuedPhoto[]> {
  const all = await run<QueuedPhoto[]>('readonly', (store) => store.getAll());
  return all.sort((a, b) => a.queuedAt - b.queuedAt);
}

export function dropQueued(id: string): Promise<undefined> {
  return run('readwrite', (store) => store.delete(id));
}

/**
 * Record that an attempt failed, so the row shows why instead of just sitting there.
 *
 * Kept separate from `queuePhoto` because the blob must not be rewritten to note an
 * error: on a phone that is a needless copy of several megabytes per retry.
 */
export async function markAttempt(id: string, error: string): Promise<void> {
  const existing = await run<QueuedPhoto | undefined>('readonly', (store) => store.get(id));
  if (!existing) return;
  await queuePhoto({ ...existing, attempts: existing.attempts + 1, lastError: error });
}

/** Whether this browser can hold a queue at all — a private window may not. */
export function queueAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
