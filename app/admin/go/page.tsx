'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, MapPin } from 'lucide-react';
import { adminFetch } from '../_lib/api';
import { slugsFromPublicPath } from '../_lib/public-path';
import { Section } from '../_lib/ui';
import { EmptyState, ErrorState, LoadingState } from '../_ui/primitives';

/**
 * From a public address to the editor that owns it.
 *
 * Everything else in this admin points outward — the park editor links to the
 * live page, the media panel links to both. The way back did not exist in
 * code at all, so noticing something wrong while browsing park.fan meant
 * searching for the park again by name in the palette.
 *
 * Takes either a full public path (`?path=/de/parks/europe/germany/bruehl/
 * phantasialand/taron`, which is what a copied browser URL looks like) or the
 * slugs on their own (`?park=phantasialand&ride=taron`, which is the shape the
 * term audit and the media database hold). Both end at the same resolver the
 * media panel already uses.
 */

interface Resolved {
  park: { id: string; name: string } | null;
  attraction: { id: string; name: string } | null;
  ambiguous?: boolean;
  candidates?: Array<{ id: string; name: string; citySlug: string | null }>;
}

function GoResolver() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Resolved['candidates']>();

  const path = params.get('path');
  const parkParam = params.get('park');
  const rideParam = params.get('ride');
  const cityParam = params.get('city');

  // Derived during render rather than set from the effect: "this address makes
  // no sense" is a property of the query string, not something that happens
  // later, and React 19 forbids the setState-in-effect form outright.
  const target = useMemo(
    () =>
      path
        ? slugsFromPublicPath(path)
        : parkParam
          ? {
              parkSlug: parkParam,
              ...(cityParam ? { citySlug: cityParam } : {}),
              ...(rideParam ? { rideSlug: rideParam } : {}),
            }
          : null,
    [path, parkParam, rideParam, cityParam]
  );

  useEffect(() => {
    if (!target) return;

    let cancelled = false;
    const query = new URLSearchParams({ parkSlug: target.parkSlug });
    if (target.citySlug) query.set('citySlug', target.citySlug);
    if (target.rideSlug) query.set('rideSlug', target.rideSlug);

    adminFetch<Resolved>(`/api/admin/content/resolve?${query.toString()}`)
      .then((result) => {
        if (cancelled) return;
        if (result.ambiguous) {
          setCandidates(result.candidates ?? []);
          return;
        }
        if (result.attraction) {
          router.replace(`/admin/attractions/${result.attraction.id}`);
          return;
        }
        if (result.park) {
          router.replace(`/admin/parks/${result.park.id}`);
          return;
        }
        setError(
          target.rideSlug
            ? `Keine Bahn "${target.rideSlug}" in "${target.parkSlug}".`
            : `Kein Park "${target.parkSlug}".`
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Auflösen fehlgeschlagen');
      });

    return () => {
      cancelled = true;
    };
  }, [target, router]);

  if (!target) {
    return (
      <ErrorState message="Kein Park in dieser Adresse. Erwartet wird ein Pfad wie /parks/europe/germany/bruehl/phantasialand." />
    );
  }
  if (error) return <ErrorState message={error} />;

  if (candidates) {
    return (
      <EmptyState
        icon={MapPin}
        title="Mehrere Parks tragen diesen Slug"
        description="Ohne Stadt lässt sich das nicht entscheiden — welcher ist gemeint?"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {candidates.map((candidate) => (
              <Link
                key={candidate.id}
                href={`/admin/parks/${candidate.id}`}
                className="border-border/60 hover:border-primary/50 hover:text-primary rounded-lg border px-3 py-1.5 text-sm transition-colors"
              >
                {candidate.name}
                {candidate.citySlug && (
                  <span className="text-muted-foreground"> · {candidate.citySlug}</span>
                )}
              </Link>
            ))}
          </div>
        }
      />
    );
  }

  return <LoadingState label="Adresse wird aufgelöst…" />;
}

export default function GoPage() {
  return (
    <Section icon={Compass} title="Zur Bearbeitung springen">
      <Suspense fallback={<LoadingState />}>
        <GoResolver />
      </Suspense>
    </Section>
  );
}
