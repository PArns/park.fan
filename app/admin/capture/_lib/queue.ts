'use client';

/**
 * Photos taken but not yet committed: in a park the network fails often, so a failed commit
 * becomes a row here rather than an error. IndexedDB, not `localStorage`, because the value is a
 * `Blob` that base64 would inflate past the quota. The screen retries on `online` and by hand,
 * never on a timer, which would drain the battery in a dead spot.
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

/** Stores or replaces a photo waiting for network in the capture queue (IndexedDB), keyed by id. */
export function queuePhoto(photo: QueuedPhoto): Promise<IDBValidKey> {
  return run('readwrite', (store) => store.put(photo));
}

/** Oldest first, so a drained queue commits in the order the photos were taken. */
export async function listQueued(): Promise<QueuedPhoto[]> {
  const all = await run<QueuedPhoto[]>('readonly', (store) => store.getAll());
  return all.sort((a, b) => a.queuedAt - b.queuedAt);
}

/** Removes a photo from the capture queue, called once its commit has gone through. */
export function dropQueued(id: string): Promise<undefined> {
  return run('readwrite', (store) => store.delete(id));
}

/**
 * Records a failed attempt so the row shows why. Separate from `queuePhoto` so noting an error
 * never rewrites the blob.
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
