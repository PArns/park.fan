'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Images, Plus, Target } from 'lucide-react';
import { useAdminQuery } from '../_lib/api';
import {
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from './primitives';

/**
 * The pictures attached to the thing you are editing.
 *
 * The media database is a separate write model — images and their sidecars are
 * committed files, so a change there becomes a pull request rather than a row
 * update — and that difference is exactly why this panel is a *view* with links
 * into the media editor rather than an editor of its own. Pretending the two
 * write the same way would produce a save button that behaves differently from
 * every other save button in the admin.
 *
 * What it is for is the question the media browser cannot answer: does this
 * ride have a picture at all? A ride with none renders a blank card on the
 * public site, and nothing anywhere reports that — which is how the second half
 * of Winja's Fear/Force silently lost its only photo when a byte-identical
 * duplicate was removed.
 */

interface MediaRow {
  id: string;
  collection: string;
  file: string;
  url: string;
  width: number;
  height: number;
  roles?: string[];
  ride?: string | null;
  alsoRides?: string[];
  focus?: { x: number; y: number } | null;
  alt?: Record<string, string>;
}

export function EntityMediaPanel({
  parkSlug,
  rideSlug,
  title,
}: {
  parkSlug: string | null;
  rideSlug?: string | null;
  title: string;
}) {
  const query = new URLSearchParams();
  if (parkSlug) query.set('park', parkSlug);
  if (rideSlug) query.set('ride', rideSlug);

  const media = useAdminQuery<{ total: number; images: MediaRow[] }>(
    ['admin', 'entity-media', parkSlug, rideSlug],
    parkSlug ? `/api/admin/media?${query.toString()}` : null,
    { staleTime: 5 * 60_000 }
  );

  const browseHref = `/admin/media?${query.toString()}`;

  if (!parkSlug) {
    return (
      <Panel>
        <PanelBody>
          <EmptyState
            icon={Images}
            title="Kein Park zugeordnet"
            description="Ohne Park lässt sich in der Mediendatenbank nichts nachschlagen."
          />
        </PanelBody>
      </Panel>
    );
  }

  const images = media.data?.images ?? [];

  return (
    <Panel>
      <PanelHeader
        icon={Images}
        title="Bilder"
        hint={
          media.data
            ? `${media.data.total} ${media.data.total === 1 ? 'Bild' : 'Bilder'} für ${title}`
            : undefined
        }
        action={
          <Link
            href={browseHref}
            className="border-border/60 hover:border-primary/40 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            In der Mediathek öffnen
          </Link>
        }
      />

      {media.isError ? (
        <ErrorState message={media.error.message} />
      ) : media.isLoading ? (
        <SkeletonRows rows={3} />
      ) : images.length === 0 ? (
        <PanelBody>
          <EmptyState
            icon={Images}
            title={rideSlug ? 'Dieses Fahrgeschäft hat kein Bild' : 'Kein Bild für diesen Park'}
            description={
              rideSlug
                ? 'Die Karte auf der Parkseite bleibt dadurch leer. Es gibt keinen Fallback und keine Warnung.'
                : 'Ohne Bild fehlt der Parkseite ihr Hintergrund.'
            }
            action={
              <Link
                href={browseHref}
                className="border-border/60 hover:border-primary/40 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Bild hinzufügen
              </Link>
            }
          />
        </PanelBody>
      ) : (
        <PanelBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Link
                key={image.id}
                href={`/admin/media?id=${encodeURIComponent(image.id)}`}
                className="border-border/60 hover:border-primary/40 group overflow-hidden rounded-lg border"
              >
                <div className="bg-muted/40 relative aspect-[16/10]">
                  <Image
                    src={image.url}
                    alt={image.alt?.de ?? image.file}
                    fill
                    sizes="(min-width: 1024px) 20vw, 45vw"
                    className="object-cover"
                    style={
                      image.focus
                        ? { objectPosition: `${image.focus.x * 100}% ${image.focus.y * 100}%` }
                        : undefined
                    }
                  />
                </div>
                <div className="space-y-1 p-2">
                  <p className="truncate text-xs font-medium">{image.file}</p>
                  <div className="flex flex-wrap gap-1">
                    {(image.roles ?? []).map((role) => (
                      <Chip key={role}>{role}</Chip>
                    ))}
                    {image.focus && (
                      <Chip>
                        <Target className="h-3 w-3" />
                        Fokus
                      </Chip>
                    )}
                    {rideSlug && image.ride !== rideSlug && (
                      // The photo answers for this ride through `alsoRides` —
                      // one structure, two attractions in the feed (Winja's
                      // Fear/Force, YOY Chill/Thrill).
                      <Chip tone="primary">auch für {rideSlug}</Chip>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </PanelBody>
      )}
    </Panel>
  );
}
