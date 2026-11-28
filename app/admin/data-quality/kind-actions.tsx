'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Save, Shapes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { curatedFieldOptions, rowsWithoutKind } from '@/lib/admin/attraction-kind';
import type { AttractionsWithoutKind } from '@/lib/api/admin';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import type { AdminAttractionListItem, CuratedFieldSpec } from '../_lib/types';
import { Chip, ErrorState, SkeletonRows } from '../_ui/primitives';
import { Select } from '../_ui/controls';
import { useToast } from '../_ui/toast';
import { useCan } from '../_app/session';

/**
 * The answer to „Attraktionen ohne Art" on `/admin/data-quality`: an editor gives each of a park's
 * unfiled attractions its kind on the card, one audited batch saves them, and the card shrinks
 * until the park has none left and goes.
 */

/** The park's attractions without a kind, each with a select, and one save for the batch. */
function KindPicker({ park, onClose }: { park: AttractionsWithoutKind; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const canEdit = useCan('editor');
  // The report names attractions without ids; the park's list, under the key the park editor
  // reads it with, supplies them.
  const list = useAdminQuery<{ total: number; attractions: AdminAttractionListItem[] }>(
    adminKeys.parkAttractions(park.parkId, { params: '' }),
    `/api/admin/content/parks/${park.parkId}/attractions?`
  );
  const specs = useAdminQuery<{ attraction: CuratedFieldSpec[] }>(
    adminKeys.fields,
    '/api/admin/content/fields'
  );
  const options = curatedFieldOptions(specs.data?.attraction, 'attractionKind');
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rows = rowsWithoutKind(park.withoutKind, list.data?.attractions ?? []);
  const entries = rows.flatMap((row) =>
    picked[row.id] ? [{ id: row.id, fields: { attractionKind: picked[row.id] } }] : []
  );

  function pick(id: string, kind: string | null) {
    setPicked((current) => {
      const next = { ...current };
      if (kind) next[id] = kind;
      else delete next[id];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/content/parks/${park.parkId}/attractions`, {
        method: 'PATCH',
        body: { entries, reason: 'Datenqualität „Attraktionen ohne Art“' },
      });
      toast.push({
        title: `${park.parkName}: ${entries.length} ${entries.length === 1 ? 'Art' : 'Arten'} gespeichert`,
        tone: 'success',
      });
      setPicked({});
      invalidate(adminKeys.dataQuality(), adminKeys.park(park.parkId), ['admin', 'history']);
    } catch (err) {
      toast.push({
        title: 'Speichern fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  if (list.isError) return <ErrorState message={list.error.message} />;
  if (list.isLoading) return <SkeletonRows rows={3} />;

  return (
    <div className="border-border/60 mt-3 space-y-3 rounded-lg border p-3">
      {specs.isError && <ErrorState message={`Arten nicht geladen: ${specs.error.message}`} />}
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Keiner dieser Namen steht so in der Liste des Parks, vermutlich wurden sie umbenannt. Im{' '}
          <Link
            href={`/admin/parks/${park.parkId}?tab=features`}
            className="text-primary hover:underline"
          >
            Merkmale-Tab
          </Link>{' '}
          lässt sich die Art unter dem neuen Namen setzen.
        </p>
      ) : (
        <ul className="divide-border/40 divide-y">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-2 py-1.5">
              <Link
                href={`/admin/attractions/${row.id}`}
                className="hover:text-primary min-w-0 flex-1 truncate text-sm transition-colors"
              >
                {row.name}
              </Link>
              <Select
                value={picked[row.id] ?? null}
                onValueChange={(kind) => pick(row.id, kind)}
                options={options}
                emptyLabel="— offen —"
                className="w-48"
                disabled={!canEdit || saving || !specs.isSuccess}
              />
            </li>
          ))}
        </ul>
      )}
      {!canEdit && (
        <p className="text-muted-foreground text-xs">
          Dein Konto darf lesen, aber nicht kuratieren.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
          Schließen
        </Button>
        <Button size="sm" onClick={save} disabled={!canEdit || saving || entries.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {entries.length > 0 ? `${entries.length} speichern` : 'Speichern'}
        </Button>
        <span className="text-muted-foreground text-xs">
          Was in keine Art passt, bleibt auf „offen“.
        </span>
      </div>
    </div>
  );
}

/**
 * Data-quality card for one park's live attractions that carry no kind, asking what each one is:
 * names them, and opens a select per attraction on the card that saves through the audited bulk
 * endpoint.
 */
export function WithoutKindParkCard({ park }: { park: AttractionsWithoutKind }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-border/60 bg-card rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/parks/${park.parkId}?tab=features`}
          className="hover:text-primary font-medium transition-colors"
        >
          {park.parkName}
        </Link>
        <Chip tone="warning">
          {park.withoutKind.length} von {park.attractions} ohne Art
        </Chip>
      </div>

      <p className="mt-2 text-sm font-medium">Fahrgeschäft, Show, Transport oder Spiel?</p>

      {open ? (
        <KindPicker park={park} onClose={() => setOpen(false)} />
      ) : (
        <>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
            {park.withoutKind.join(' · ')}
          </p>
          <div className="mt-3">
            <Button size="sm" onClick={() => setOpen(true)}>
              <Shapes className="h-4 w-4" /> Arten zuordnen
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
