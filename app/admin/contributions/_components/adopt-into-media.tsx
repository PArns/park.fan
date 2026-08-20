'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Loader2 } from 'lucide-react';
import { adminFetch } from '../../_lib/api';
import { slugsFromPublicPath } from '../../_lib/public-path';
import { useToast } from '../../_ui/toast';
import type { SubmissionRecord, StoredImageRecord } from '@/lib/contribute/types';

/**
 * The step that was missing between moderation and the media database.
 *
 * Approving a visitor's photo did nothing to it: the bytes stayed in the
 * private submission store, and getting them onto a park page meant
 * downloading the file, renaming it, writing a sidecar and opening a pull
 * request by hand. Both halves already existed — the file route that streams
 * the image behind the session, and the commit endpoint that writes an image
 * plus its sidecar into the open media pull request.
 *
 * So this is glue, and deliberately thin: it fills in what the submission
 * already states (park, ride, caption, credit) and hands over to the media
 * detail page for the part a person has to decide — the focal point, the
 * roles, and whether the photo is good enough to be a card.
 */

interface CommitResult {
  prUrl?: string;
  images?: Array<{ id: string }>;
}

/** A file name from the entity and the submission, not from the camera. */
function nameFor(submission: SubmissionRecord, index: number): string {
  const base = submission.entity.slug || 'foto';
  const suffix = submission.id.slice(0, 6);
  return index === 0 ? `${base}-${suffix}` : `${base}-${suffix}-${index + 1}`;
}

function extensionOf(image: StoredImageRecord): string {
  const fromName = image.originalName.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  if (image.contentType === 'image/png') return 'png';
  if (image.contentType === 'image/webp') return 'webp';
  return 'jpg';
}

export function AdoptIntoMedia({
  submission,
  image,
  index,
}: {
  submission: SubmissionRecord;
  image: StoredImageRecord;
  index: number;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [adopted, setAdopted] = useState<string | null>(null);

  const slugs = submission.entity.url ? slugsFromPublicPath(submission.entity.url) : null;
  const isRide = submission.entity.type === 'attraction';
  const parkSlug = slugs?.parkSlug ?? (isRide ? null : submission.entity.slug);
  const rideSlug = isRide ? (slugs?.rideSlug ?? submission.entity.slug) : null;

  async function adopt() {
    if (!parkSlug) {
      toast.push({
        title: 'Kein Park erkennbar',
        description: 'Der Einsendung fehlt der Pfad des Parks. Im Medienbereich manuell anlegen.',
        tone: 'error',
      });
      return;
    }

    setBusy(true);
    try {
      // Through the same session-authenticated route the thumbnails use; the
      // blob store is private and this is the only way to the bytes.
      const response = await fetch(image.url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Bild nicht lesbar (HTTP ${response.status})`);
      const buffer = await response.arrayBuffer();

      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const contentBase64 = btoa(binary);

      const result = await adminFetch<CommitResult>('/api/admin/media/commit', {
        method: 'POST',
        body: {
          title: `Einsendung ${submission.id.slice(0, 6)} übernommen`,
          operations: [
            {
              op: 'create',
              collection: parkSlug,
              name: nameFor(submission, index),
              ext: extensionOf(image),
              contentBase64,
              sidecar: {
                park: parkSlug,
                ...(rideSlug ? { ride: rideSlug } : {}),
                // German only: the caption is what the visitor wrote, and
                // inventing five translations of somebody else's sentence is
                // worse than leaving the other locales to be filled in.
                ...(submission.caption.trim()
                  ? { caption: { de: submission.caption.trim() } }
                  : {}),
                ...(submission.credit.trim() ? { credit: { name: submission.credit.trim() } } : {}),
              },
            },
          ],
        },
      });

      const id = result.images?.[0]?.id ?? null;
      setAdopted(id);
      toast.push({
        title: 'In die Mediendatenbank übernommen',
        description: 'Fehlt noch: Bildausschnitt und Rollen im Medienbereich setzen.',
        tone: 'success',
      });
    } catch (err) {
      toast.push({
        title: 'Übernahme fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  if (adopted) {
    return (
      <Link
        href={`/admin/media?image=${encodeURIComponent(adopted)}`}
        className="bg-background/80 text-primary hover:bg-primary hover:text-primary-foreground absolute top-1 left-1 flex size-7 items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-all"
        title="Im Medienbereich öffnen"
      >
        <ImagePlus className="size-3.5" />
      </Link>
    );
  }

  return (
    <button
      onClick={adopt}
      disabled={busy}
      title="In die Mediendatenbank übernehmen"
      className="bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground absolute top-1 left-1 flex size-7 items-center justify-center rounded-md opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover/thumb:opacity-100 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
    </button>
  );
}
