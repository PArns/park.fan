'use client';

import Link from 'next/link';
import { CameraOff, ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '../../_lib/api';
import { Panel, PanelBody, PanelHeader, Chip, LoadingState } from '../../_ui/primitives';
import type { AdminAttractionListItem } from '../../_lib/types';

/**
 * The rides in this park that have no picture, looked up in the media index in one request; the
 * ride list is already on screen, so it costs no API call.
 */
export function PhotoCoverage({
  parkSlug,
  attractions,
}: {
  parkSlug: string;
  attractions: AdminAttractionListItem[];
}) {
  const rideSlugs = attractions.map((attraction) => attraction.slug);
  // Keyed on the whole slug list, the request body: a different set of the same length must not
  // read the previous answer.
  const rideKey = rideSlugs.join(',');

  // `useQuery` rather than `useAdminQuery`: the lookup is a POST because the
  // ride list is the request body, and the shared helper only does GETs.
  const coverage = useQuery({
    queryKey: ['admin', 'photo-coverage', parkSlug, rideKey],
    enabled: rideSlugs.length > 0,
    staleTime: 5 * 60_000,
    queryFn: () =>
      adminFetch<{ withImage: string[]; without: string[] }>('/api/admin/media/coverage', {
        method: 'POST',
        body: { parkSlug, rideSlugs },
      }),
  });

  if (rideSlugs.length === 0) return null;

  const without = coverage.data?.without ?? [];
  const covered = coverage.data?.withImage?.length ?? 0;
  const nameBySlug = new Map(attractions.map((a) => [a.slug, a.name]));

  return (
    <Panel>
      <PanelHeader
        icon={without.length > 0 ? CameraOff : ImageIcon}
        title="Bildabdeckung"
        hint="Fahrgeschäfte dieses Parks, zu denen die Mediendatenbank kein Bild kennt."
        action={
          coverage.data ? (
            <Chip tone={without.length === 0 ? 'success' : 'warning'}>
              {covered}/{rideSlugs.length}
            </Chip>
          ) : undefined
        }
      />
      <PanelBody>
        {coverage.isLoading ? (
          <LoadingState />
        ) : without.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Jede Bahn hat mindestens ein Bild. Das ist selten.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {without.map((slug) => (
              <Link
                key={slug}
                href={`/admin/media?park=${encodeURIComponent(parkSlug)}&ride=${encodeURIComponent(slug)}`}
                className="border-border/60 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-1 text-xs transition-colors"
              >
                {nameBySlug.get(slug) ?? slug}
              </Link>
            ))}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
