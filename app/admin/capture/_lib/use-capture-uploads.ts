'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
import type { ActiveUpload, BacklogResponse, UploadState } from './types';

/**
 * Taking a photograph and getting it into the repository, in a place with no network.
 *
 * The happy path is three calls — analyze the original for its EXIF, commit the
 * bytes, join the open pull request — and the interesting part is what happens when
 * any of them fails. It goes in the queue with everything needed to finish later:
 * the blob, the park, the ride, the name that was reserved for it. Nothing is
 * recomputed at drain time except the analysis, which has to be redone anyway
 * because the answer depends on a server.
 *
 * Names are reserved the moment the shutter closes, not when the upload succeeds.
 * Two photographs of the same ride while the first is still uploading would
 * otherwise both be called `troy` and the second would overwrite the first — the
 * commit endpoint writes by path and does not ask.
 */

interface Options {
  data: BacklogResponse | null;
  /** Display name of the signed-in account, written into `credit.author`. */
  author: string | null;
}

export function useCaptureUploads({ data, author }: Options) {
  const [active, setActive] = useState<ActiveUpload[]>([]);
  const [queued, setQueued] = useState<QueuedPhoto[]>([]);
  const [pullRequest, setPullRequest] = useState<string | null>(null);
  const [draining, setDraining] = useState(false);

  /** Every file name spoken for in this park's collection, on disk or in flight. */
  const taken = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    taken.current = new Set(data.park.takenNames);
  }, [data]);

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
        // The whole point of the field workflow: everything that needs the
        // picture on a screen — alt text, caption, what is actually in frame —
        // is left for the evening, and this is what finds them again.
        review: true,
      },
    });

    if (result.pullRequest) setPullRequest(result.pullRequest);
    return result.pullRequest;
  }, []);

  /**
   * Hand a ride one or more files.
   *
   * Sequential, deliberately: the first commit of a session opens the pull request
   * and the rest look it up and join. Fired in parallel they race to open their own,
   * which is the bug the media browser's batch dialog was rewritten to avoid.
   */
  const upload = useCallback(
    async (
      files: FileList | File[],
      ride: { slug: string | null; name: string; area: string | null }
    ) => {
      if (!data) return;
      const list = Array.from(files).filter(
        (file) => file.type.startsWith('image/') || /\.(hei[cf])$/i.test(file.name)
      );
      if (!list.length) return;

      for (const file of list) {
        const id = crypto.randomUUID();
        const name = freeName(ride.slug, taken.current);
        taken.current.add(name);

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
          tags: fieldTags(data.park.timezone),
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

  // Revoked on unmount and NOT on every change of `active`: with the list in the
  // dependency array this ran after each state transition and revoked the preview
  // of every photo still uploading, so the thumbnails went blank mid-upload.
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

/** `1724930000000` → `2026-08-29`, or null when the stamp is missing. */
function dateOf(millis: number | undefined): string | null {
  if (!millis) return null;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
