'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { adminFetch } from '../../_lib/api';
import { slugsFromPublicPath } from '../../_lib/public-path';
import {
  MediaUpload,
  type LandedPhoto,
  type UploadSeed,
} from '../../media/_components/media-upload';
import type { Vocabulary } from '../../media/_lib/types';
import type { AssignedEntity, SubmissionRecord, StoredImageRecord } from '@/lib/contribute/types';

/**
 * The step between moderation and the media database.
 *
 * Approving a visitor's photo did nothing to it: the bytes stayed in the
 * private submission store, and getting one onto a ride page meant downloading
 * the file, renaming it, writing a sidecar and opening a pull request by hand.
 * A hover button that did it in one click existed, but it was invisible until
 * you pointed at a thumbnail, wrote the credit under a key the sidecar does not
 * have (`credit.name`, so the photographer's name was dropped), and skipped
 * the part a person has to decide — the focal point, the roles, the alt text.
 *
 * So this hands the chosen photos to the media browser's own upload dialog,
 * the walkthrough every other photo goes through, with what the submission
 * already says filled in: park, ride, caption and who took it. The moderator
 * looks at each picture once, the batch lands in the open media pull request,
 * and the submission records where each photo went.
 */

interface MediaPayload {
  vocabulary: Vocabulary;
}

/** Park and ride slugs of the entity a submission was assigned to. */
function slugsOf(entity: AssignedEntity): { park: string | null; ride: string | null } {
  // The canonical path has no `/attractions/` segment, but a raw API URL does,
  // and `slugsFromPublicPath` would read that segment as the ride.
  const slugs = entity.url ? slugsFromPublicPath(entity.url.replace('/attractions/', '/')) : null;
  if (entity.type === 'park') return { park: slugs?.parkSlug ?? entity.slug, ride: null };
  return { park: slugs?.parkSlug ?? null, ride: entity.slug };
}

/**
 * A file name from the entity and the submission, not from the camera.
 *
 * Deterministic on purpose: the index is the photo's place in the submission,
 * not in the selection, so adopting the same photo again — after a failed
 * commit, say — overwrites the file it wrote the first time instead of adding a
 * copy next to it.
 */
function nameFor(submission: SubmissionRecord, index: number): string {
  const base = submission.entity.slug || 'foto';
  const suffix = submission.id.slice(0, 6);
  return index === 0 ? `${base}-${suffix}` : `${base}-${suffix}-${index + 1}`;
}

/** The private blob, through the session-authenticated route the thumbnails use. */
async function download(image: StoredImageRecord): Promise<File> {
  const response = await fetch(image.url, { cache: 'no-store' });
  if (!response.ok)
    throw new Error(`${image.originalName}: nicht lesbar (HTTP ${response.status})`);
  const blob = await response.blob();
  // The upload dialog drops anything not typed `image/*`, which would shift
  // every index after it and record the wrong photo as adopted.
  const type = blob.type.startsWith('image/') ? blob.type : image.contentType;
  return new File([blob], image.originalName, { type });
}

/**
 * Downloads the chosen photos of a visitor submission and opens the media upload dialog prefilled
 * with park, ride, caption, credit and file names. Reports the pull request and media ids back.
 */
export function AdoptIntoMedia({
  submission,
  keys,
  caption,
  credit,
  onClose,
  onAdopted,
}: {
  submission: SubmissionRecord;
  /** Storage keys of the photos to move. They are walked in submission order. */
  keys: string[];
  /** The card's current fields, saved or not — what the moderator sees is what is written. */
  caption: string;
  credit: string;
  onClose: () => void;
  onAdopted: (pullRequest: string | null, landed: Array<{ key: string; mediaId: string }>) => void;
}) {
  const [prepared, setPrepared] = useState<{ vocabulary: Vocabulary; seed: UploadSeed } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { park, ride } = slugsOf(submission.entity);
    const chosen = submission.images
      .map((image, index) => ({ image, index }))
      .filter(({ image }) => keys.includes(image.key));

    Promise.all([
      adminFetch<MediaPayload>(
        `/api/admin/media?${new URLSearchParams({ park: park ?? '', ride: ride ?? '' })}`
      ),
      Promise.all(chosen.map(({ image }) => download(image))),
    ])
      .then(([media, files]) => {
        if (cancelled) return;
        setPrepared({
          vocabulary: media.vocabulary,
          seed: {
            files,
            assignments: chosen.map(({ index }) => ({
              // Without a page path there is no park to file under; the
              // walkthrough asks for one before it lets the batch commit.
              collection: park ?? '',
              name: nameFor(submission, index),
              park,
              ride,
              caption: caption.trim(),
            })),
            // The visitor's name when they gave one, and nobody's when they did
            // not: an empty author renders no credit line at all, which is the
            // honest answer. It is never filled with our own photographer — the
            // picture is theirs, under the licence they granted on upload.
            credit: {
              ...(credit.trim() ? { author: credit.trim() } : {}),
              license: 'all-rights-reserved',
              source: 'contribution',
            },
            stripMetadata: true,
            title: `media: Einsendung ${submission.id.slice(0, 6)} (${submission.entity.name})`,
          },
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Vorbereitung fehlgeschlagen');
      });

    return () => {
      cancelled = true;
    };
    // Once per opening: the dialog is mounted for one adoption and closed after.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leaves out `submission`, `keys`, `caption`, `credit`: the batch is fixed when the dialog opens
  }, []);

  function onDone(pullRequest: string | null, _joined?: boolean, landed: LandedPhoto[] = []) {
    const chosen = submission.images.filter((image) => keys.includes(image.key));
    onAdopted(
      pullRequest,
      landed.map(({ index, id }) => ({ key: chosen[index].key, mediaId: id }))
    );
  }

  if (prepared) {
    return (
      <MediaUpload
        vocabulary={prepared.vocabulary}
        seed={prepared.seed}
        onClose={onClose}
        onDone={onDone}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="bg-background ring-border flex w-full max-w-md items-start gap-3 rounded-2xl p-4 shadow-2xl ring-1">
        {error ? (
          <p className="flex-1 text-sm text-amber-200">{error}</p>
        ) : (
          <p className="text-muted-foreground flex flex-1 items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {keys.length === 1 ? 'Foto wird geladen…' : `${keys.length} Fotos werden geladen…`}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
