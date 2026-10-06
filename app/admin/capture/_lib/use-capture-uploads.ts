'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { adminFetch } from '../../_lib/api';
import { analyzePhoto, commitPhoto } from '../../_lib/media-upload';
import {
  dropQueued,
  listQueued,
  markAttempt,
  queueAvailable,
  queuePhoto,
  type QueuedPhoto,
} from './queue';
import { fieldTags, freeName, parkDate } from './naming';
import type { ActiveUpload, BacklogResponse, CaptureSessionResponse, UploadState } from './types';

/**
 * Taking a photo and getting it into the repository, in a place with no network. A failed upload
 * is queued with everything needed to finish it later. Names are reserved when the shutter closes,
 * not when the upload succeeds, because `commit` writes by path and two photos of one ride taken
 * during an upload would otherwise share a name.
 */

interface Options {
  data: BacklogResponse | null;
  /** Display name of the signed-in account, written into `credit.author`. */
  author: string | null;
}

/**
 * Runs the capture screen's uploads: reserves a free file name per photo, commits it into the open
 * media pull request, and queues it in IndexedDB on failure. Drains the queue on `online` or on
 * request; returns active uploads, the queue, the PR link and the actions.
 */
export function useCaptureUploads({ data, author }: Options) {
  const [active, setActive] = useState<ActiveUpload[]>([]);
  const [queued, setQueued] = useState<QueuedPhoto[]>([]);
  const [pullRequest, setPullRequest] = useState<string | null>(null);
  const [draining, setDraining] = useState(false);

  /**
   * Every file name spoken for, per collection: on `main`, in the open session's pull request, in
   * flight or queued. It only ever grows: replacing it with the server's list on a refetch would
   * drop the names of photos still uploading, and the next photo would take one of them.
   */
  const taken = useRef<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    if (!data) return;
    const names = namesIn(taken.current, data.park.slug);
    for (const name of data.park.takenNames) names.add(name);
  }, [data]);

  useEffect(() => {
    for (const photo of queued) namesIn(taken.current, photo.collection).add(photo.name);
  }, [queued]);

  /**
   * Which pull request the photos are landing in, asked once on mount so a reloaded tab still
   * shows the link to it. A commit that answered while this was in flight wins, being newer.
   */
  useEffect(() => {
    let cancelled = false;
    adminFetch<CaptureSessionResponse>('/api/admin/media/session')
      .then((payload) => {
        const url = payload?.session?.url;
        if (cancelled || !url) return;
        setPullRequest((current) => current ?? url);
      })
      // No session, no token, no network: the bar stays as it was. Uploading
      // reports a real failure with its reason.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshQueue = useCallback(() => {
    if (!queueAvailable()) return;
    listQueued()
      .then(setQueued)
      .catch(() => undefined);
  }, []);

  useEffect(refreshQueue, [refreshQueue]);

  const setState = useCallback((id: string, state: UploadState) => {
    setActive((all) => all.map((entry) => (entry.id === id ? { ...entry, state } : entry)));
  }, []);

  /** Commit one photograph. Throws when anything on the way fails. */
  const send = useCallback(async (photo: QueuedPhoto): Promise<string | null> => {
    const file = new File([photo.blob], photo.fileName, {
      type: photo.blob.type || 'image/jpeg',
    });
    // Best-effort: a failed analysis costs the capture date and the coordinates,
    // not the photograph. The park and the ride were chosen by a person here.
    const exif = await analyzePhoto(file).catch(() => null);

    const result = await commitPhoto({
      file,
      collection: photo.collection,
      name: photo.name,
      exif,
      newSession: false,
      title: `media: ${photo.rideName} (vor Ort)`,
      sidecar: {
        park: photo.parkSlug,
        ride: photo.rideSlug,
        area: photo.area,
        tags: photo.tags,
        // No `ride-card`: the role is a judgement about whether this is the
        // photo that represents the ride, and `getRideImage` falls back to the
        // first candidate anyway, so the picture reaches the page regardless.
        roles: [],
        alt: {},
        caption: {},
        credit: photo.author
          ? {
              author: photo.author,
              license: 'all-rights-reserved',
              source: 'own',
              year: Number((photo.shotAt ?? '').slice(0, 4)) || undefined,
            }
          : undefined,
        shotAt: photo.shotAt,
        gps: photo.gps,
        // Everything that needs the picture on a screen (alt text, caption, what is in frame) is
        // left for the evening, and this flag finds the photo again.
        review: true,
      },
    });

    if (result.pullRequest) setPullRequest(result.pullRequest);
    return result.pullRequest;
  }, []);

  /**
   * Hands a ride, or the park with `slug: null`, one or more files. Sequential, because the first
   * commit opens the session pull request the rest join. `chosenTags` are added to the tags the
   * phone derives, never in place of them.
   */
  const upload = useCallback(
    async (
      files: FileList | File[],
      ride: { slug: string | null; name: string; area: string | null },
      chosenTags: string[] = []
    ) => {
      if (!data) return;
      const list = Array.from(files).filter(
        (file) => file.type.startsWith('image/') || /\.(hei[cf])$/i.test(file.name)
      );
      if (!list.length) return;

      const names = namesIn(taken.current, data.park.slug);
      for (const file of list) {
        const id = crypto.randomUUID();
        const name = freeName(ride.slug, names);
        names.add(name);

        const previewUrl = URL.createObjectURL(file);
        setActive((all) => [
          ...all,
          { id, rideSlug: ride.slug, rideName: ride.name, previewUrl, state: { kind: 'reading' } },
        ]);

        const photo: QueuedPhoto = {
          id,
          blob: file,
          fileName: file.name || `${name}.jpg`,
          parkPath: data.park.path,
          parkSlug: data.park.slug,
          collection: data.park.slug,
          name,
          rideSlug: ride.slug,
          rideName: ride.name,
          area: ride.area,
          // The file's own timestamp beats the clock: a picture chosen from the
          // roll may have been taken last October, and stamping it with today
          // would be a fact invented on the way in.
          shotAt: dateOf(file.lastModified) ?? parkDate(data.park.timezone),
          gps: null,
          author,
          // A `Set`: a pressed chip may already be among the derived tags.
          tags: [
            ...new Set([
              ...fieldTags(data.park.timezone, ride.slug ? 'ride' : 'park'),
              ...chosenTags,
            ]),
          ],
          queuedAt: Date.now(),
          attempts: 0,
          lastError: null,
        };

        setState(id, { kind: 'uploading' });
        try {
          const url = await send(photo);
          setState(id, { kind: 'done', pullRequest: url });
        } catch (e) {
          const reason = (e as Error).message;
          if (queueAvailable()) {
            await queuePhoto({ ...photo, attempts: 1, lastError: reason }).catch(() => undefined);
            refreshQueue();
            setState(id, { kind: 'queued', reason });
          } else {
            // A private window has no IndexedDB, and pretending the photo is safe
            // would be the worst possible answer here.
            setState(id, { kind: 'failed', reason });
          }
        }
      }
    },
    [author, data, refreshQueue, send, setState]
  );

  /** Push everything waiting, oldest first. Stops at the first failure. */
  const drain = useCallback(async () => {
    if (draining || !queueAvailable()) return;
    setDraining(true);
    try {
      for (const photo of await listQueued()) {
        try {
          await send(photo);
          await dropQueued(photo.id);
        } catch (e) {
          // One failure means the network is still down; carrying on would burn
          // battery and produce the same error per row.
          await markAttempt(photo.id, (e as Error).message);
          break;
        }
      }
    } finally {
      setDraining(false);
      refreshQueue();
    }
  }, [draining, refreshQueue, send]);

  // Retried when the browser says the connection is back, and never on a timer:
  // polling in a dead spot is exactly the thing that empties a phone battery
  // before the park closes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', drain);
    return () => window.removeEventListener('online', drain);
  }, [drain]);

  // Revoked on unmount, not on every change of `active`, which would blank the previews of photos
  // still uploading.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(
    () => () => activeRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl)),
    []
  );

  return { active, queued, pullRequest, draining, upload, drain, refreshQueue };
}

/** The names taken in one collection, created empty on first ask. */
function namesIn(taken: Map<string, Set<string>>, collection: string): Set<string> {
  let names = taken.get(collection);
  if (!names) {
    names = new Set();
    taken.set(collection, names);
  }
  return names;
}

/** `1724930000000` → `2026-08-29`, or null when the stamp is missing. */
function dateOf(millis: number | undefined): string | null {
  if (!millis) return null;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
