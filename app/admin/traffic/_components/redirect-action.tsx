'use client';

import { useState } from 'react';
import { CornerUpRight, Loader2 } from 'lucide-react';
import { useCan } from '../../_app/session';
import { AdminApiError, adminFetch, adminKeys, adminRequest, useAdminQuery } from '../../_lib/api';
import { isRedirectablePath, slugsFromPublicPath } from '../../_lib/public-path';
import type { AdminAttractionListItem, AdminParkListItem } from '../../_lib/types';
import { SearchSelect } from '../../_ui/controls';
import { useToast } from '../../_ui/toast';

/** `POST /v1/admin/redirects` answers with the alias it wrote or found, paths without locale. */
interface RedirectView {
  fromPath: string;
  toPath: string;
}

const CREATE_ERROR: Record<number, string> = {
  400: 'Ziel passt nicht zur Adresse',
  403: 'Nur für Redaktion',
  404: 'Ziel gibt es nicht',
  409: 'Adresse ist schon belegt',
};

const DELETE_ERROR: Record<number, string> = {
  404: 'Weiterleitung gibt es nicht mehr',
  409: 'Weiterleitung stammt aus Umbenennung oder Sync',
};

function errorToast(err: unknown, titles: Record<number, string>, fallback: string) {
  return {
    title: (err instanceof AdminApiError && titles[err.status]) || fallback,
    description: err instanceof Error ? err.message : undefined,
    tone: 'error' as const,
  };
}

/**
 * The redirect answer to a row of the not-found list: a dead park path points at a park, a dead
 * ride path at a ride of the park in the path, since the API takes nothing else. Editors only;
 * `onChange` refetches the list, which drops a path an alias answers.
 */
export function RedirectAction({ path, onChange }: { path: string; onChange: () => void }) {
  const canEdit = useCan('editor');
  const [open, setOpen] = useState(false);
  const slugs = isRedirectablePath(path) ? slugsFromPublicPath(path) : null;
  if (!canEdit || !slugs) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-primary flex items-center gap-1 text-xs hover:underline max-sm:min-h-11"
      >
        <CornerUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        Weiterleiten
      </button>
      {open && (
        <RedirectPicker
          path={path}
          parkSlug={slugs.parkSlug}
          citySlug={slugs.citySlug}
          ride={slugs.rideSlug !== undefined}
          onDone={() => {
            setOpen(false);
            onChange();
          }}
          onUndone={onChange}
        />
      )}
    </>
  );
}

function RedirectPicker({
  path,
  parkSlug,
  citySlug,
  ride,
  onDone,
  onUndone,
}: {
  path: string;
  parkSlug: string;
  citySlug?: string;
  ride: boolean;
  onDone: () => void;
  onUndone: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  // Same key as the parks page, so the catalogue is asked for once.
  const parks = useAdminQuery<{ parks: AdminParkListItem[] }>(
    adminKeys.parks({ params: 'limit=500' }),
    ride ? null : '/api/admin/content/parks?limit=500',
    { staleTime: 10 * 60_000 }
  );
  const resolvePath = `/api/admin/content/resolve?${new URLSearchParams({
    parkSlug,
    ...(citySlug ? { citySlug } : {}),
  })}`;
  const resolved = useAdminQuery<{ park: { id: string; name: string } | null }>(
    adminKeys.raw(resolvePath),
    ride ? resolvePath : null
  );
  const parkId = resolved.data?.park?.id ?? null;
  const rides = useAdminQuery<{ attractions: AdminAttractionListItem[] }>(
    adminKeys.parkAttractions(parkId ?? '', { params: '' }),
    parkId ? `/api/admin/content/parks/${parkId}/attractions` : null
  );

  async function undo(fromPath: string) {
    try {
      await adminFetch(`/api/admin/redirects?${new URLSearchParams({ fromPath })}`, {
        method: 'DELETE',
      });
      toast.push({ title: 'Weiterleitung entfernt', tone: 'success' });
      onUndone();
    } catch (err) {
      toast.push(errorToast(err, DELETE_ERROR, 'Entfernen fehlgeschlagen'));
    }
  }

  async function create(id: string) {
    setBusy(true);
    try {
      const { status, data } = await adminRequest<RedirectView>('/api/admin/redirects', {
        method: 'POST',
        body: { fromPath: path, target: { kind: ride ? 'attraction' : 'park', id } },
      });
      const description = `${data.fromPath} → ${data.toPath}`;
      // A 200 found an alias that was already there: undo would delete someone else's.
      toast.push(
        status === 201
          ? {
              title: 'Weiterleitung angelegt',
              description,
              tone: 'success',
              duration: 10_000,
              action: { label: 'Rückgängig', onClick: () => undo(data.fromPath) },
            }
          : { title: 'Weiterleitung gab es schon', description, tone: 'info' }
      );
      onDone();
    } catch (err) {
      toast.push(errorToast(err, CREATE_ERROR, 'Weiterleitung fehlgeschlagen'));
    } finally {
      setBusy(false);
    }
  }

  const loaded = ride ? rides.data : parks.data;
  const failed = ride ? (resolved.error ?? rides.error) : parks.error;
  const options = ride
    ? (rides.data?.attractions ?? []).map((item) => ({ value: item.id, label: item.name }))
    : (parks.data?.parks ?? []).map((item) => ({
        value: item.id,
        label: item.name,
        hint: [item.city, item.country].filter(Boolean).join(', ') || undefined,
        keywords: [item.city, item.country, item.slug].filter((k): k is string => Boolean(k)),
      }));

  return (
    <div className="flex basis-full items-center gap-2">
      {ride && resolved.data && !parkId ? (
        <p className="text-muted-foreground text-xs">
          Den Park „{parkSlug}“ gibt es unter dieser Adresse nicht, eine Bahn lässt sich hier nicht
          weiterleiten.
        </p>
      ) : (
        <SearchSelect
          value={null}
          onValueChange={(id) => void create(id)}
          options={options}
          fuzzy={ride ? 'attraction' : 'park'}
          disabled={busy || !loaded}
          className="max-w-sm flex-1"
          placeholder={
            failed
              ? `Liste nicht geladen: ${failed.message}`
              : ride
                ? `Bahn in ${resolved.data?.park?.name ?? parkSlug} wählen…`
                : 'Park wählen…'
          }
          searchPlaceholder={ride ? 'Bahn suchen…' : 'Park suchen…'}
          emptyLabel={ride ? 'Keine Bahn gefunden' : 'Kein Park gefunden'}
        />
      )}
      {busy && <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />}
    </div>
  );
}
