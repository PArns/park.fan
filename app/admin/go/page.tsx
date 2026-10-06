'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, MapPin } from 'lucide-react';
import { adminFetch } from '../_lib/api';
import { slugsFromPublicPath } from '../_lib/public-path';
import { Section } from '../_lib/ui';
import { AdminPage, EmptyState, ErrorState, LoadingState } from '../_ui/primitives';

/**
 * From a public address to the editor that owns it. Takes a full public path
 * (`?path=/de/parks/…`, a copied URL) or the slugs alone (`?park=phantasialand&ride=taron`).
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

  // Derived during render: whether the address makes sense is a property of the query string.
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
        description="Ohne Stadt lässt sich das nicht entscheiden. Welcher ist gemeint?"
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
    <AdminPage width="narrow">
      <Section icon={Compass} title="Zur Bearbeitung springen">
        <Suspense fallback={<LoadingState />}>
          <GoResolver />
        </Suspense>
      </Section>
    </AdminPage>
  );
}
