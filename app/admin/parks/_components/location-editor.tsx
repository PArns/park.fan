'use client';

import { useState } from 'react';
import { Loader2, MapPinned } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, adminKeys, useInvalidateAdmin } from '../../_lib/api';
import { Field, TextInput } from '../../_ui/controls';
import { useToast } from '../../_ui/toast';

/**
 * Correcting where a park is.
 *
 * The admin has been able to *see* a wrong location since the map view landed
 * — a marker at 0,0 is hard to miss — and the header even warns when the
 * coordinates are missing altogether, then told the operator to go and run a
 * repair job. `POST parks/:id/correct-location` has been sitting there the
 * whole time.
 *
 * Not a curated field, deliberately. The city is part of the park's public
 * address (`/parks/europe/germany/bruehl/phantasialand`), so changing it moves
 * a published URL: the endpoint writes a slug alias for the old path and
 * revalidates. That is a rename, which this codebase keeps as its own
 * operation rather than a column somebody edits by accident.
 */
export function LocationEditor({
  parkId,
  city,
  latitude,
  longitude,
}: {
  parkId: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    city: city ?? '',
    latitude: latitude === null ? '' : String(latitude),
    longitude: longitude === null ? '' : String(longitude),
  });

  async function save() {
    // Both notations, because the field is typed by people who write German.
    const lat = draft.latitude.trim() ? Number(draft.latitude.trim().replace(',', '.')) : null;
    const lon = draft.longitude.trim() ? Number(draft.longitude.trim().replace(',', '.')) : null;

    if ((lat !== null && !Number.isFinite(lat)) || (lon !== null && !Number.isFinite(lon))) {
      setError('Koordinaten müssen Zahlen sein, z. B. 50.7986 und 6.8792.');
      return;
    }
    if (lat !== null && (lat < -90 || lat > 90)) {
      setError('Breitengrad liegt zwischen -90 und 90.');
      return;
    }
    if (lon !== null && (lon < -180 || lon > 180)) {
      setError('Längengrad liegt zwischen -180 und 180.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await adminFetch<{ message: string; pathChanged: boolean }>(
        `/api/admin/parks/${parkId}/correct-location`,
        {
          method: 'POST',
          body: {
            ...(draft.city.trim() ? { city: draft.city.trim() } : {}),
            ...(lat !== null ? { latitude: lat } : {}),
            ...(lon !== null ? { longitude: lon } : {}),
          },
        }
      );
      toast.push({
        title: 'Standort korrigiert',
        description: result.pathChanged
          ? 'Die Adresse hat sich geändert, der alte Pfad leitet weiter.'
          : undefined,
        tone: 'success',
      });
      invalidate(adminKeys.park(parkId), ['admin', 'parks']);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Korrektur fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <MapPinned className="h-4 w-4" /> Standort korrigieren
      </Button>
    );
  }

  return (
    <div className="border-border/60 bg-card space-y-3 rounded-lg border p-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        Eine geänderte Stadt ändert die öffentliche Adresse des Parks. Der bisherige Pfad bleibt als
        Weiterleitung bestehen, damit indexierte Links weiter funktionieren.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Stadt">
          <TextInput
            value={draft.city}
            onChange={(event) => setDraft((d) => ({ ...d, city: event.target.value }))}
          />
        </Field>
        <Field label="Breitengrad">
          <TextInput
            inputMode="decimal"
            value={draft.latitude}
            onChange={(event) => setDraft((d) => ({ ...d, latitude: event.target.value }))}
          />
        </Field>
        <Field label="Längengrad">
          <TextInput
            inputMode="decimal"
            value={draft.longitude}
            onChange={(event) => setDraft((d) => ({ ...d, longitude: event.target.value }))}
          />
        </Field>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Speichern
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
