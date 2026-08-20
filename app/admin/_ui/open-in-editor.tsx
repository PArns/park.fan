'use client';

import Link from 'next/link';
import { MapPin, RollerCoaster } from 'lucide-react';
import { useAdminQuery } from '../_lib/api';

/**
 * The link from a slug to the thing it names.
 *
 * The media database and the blog identify parks and rides by slug; the editor
 * identifies them by id. Without a translation between the two, the admin is
 * one-directional — you can get from a ride to its photos and never back, which
 * is exactly the seam that makes three tools feel like three tools.
 *
 * Renders nothing while it resolves and nothing if it cannot. A dead link into
 * an editor is worse than no link: it reads as "this ride is gone" when it
 * usually means the slug in the sidecar has a typo.
 */

interface ResolveResult {
  park: { id: string; name: string; slug: string } | null;
  attraction: { id: string; name: string; slug: string } | null;
  ambiguous: boolean;
}

export function OpenInEditor({
  parkSlug,
  rideSlug,
  citySlug,
}: {
  parkSlug: string | null | undefined;
  rideSlug?: string | null;
  citySlug?: string | null;
}) {
  const query = new URLSearchParams();
  if (parkSlug) query.set('parkSlug', parkSlug);
  if (rideSlug) query.set('rideSlug', rideSlug);
  if (citySlug) query.set('citySlug', citySlug);

  const resolved = useAdminQuery<ResolveResult>(
    ['admin', 'resolve', parkSlug, rideSlug, citySlug],
    parkSlug ? `/api/admin/content/resolve?${query.toString()}` : null,
    { staleTime: 30 * 60_000, retry: false }
  );

  if (!resolved.data || resolved.data.ambiguous) return null;
  const { park, attraction } = resolved.data;
  if (!park) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/admin/parks/${park.id}`}
        className="border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
      >
        <MapPin className="h-3 w-3" />
        {park.name}
      </Link>
      {attraction && (
        <Link
          href={`/admin/attractions/${attraction.id}`}
          className="border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
        >
          <RollerCoaster className="h-3 w-3" />
          {attraction.name}
        </Link>
      )}
    </div>
  );
}
