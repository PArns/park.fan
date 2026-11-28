'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleSlash, Loader2, Save, Shapes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { curatedFieldOptions } from '@/lib/admin/attraction-kind';
import type { AttractionsWithoutKind } from '@/lib/api/admin';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import type { CuratedFieldSpec } from '../_lib/types';
import { Chip, ErrorState } from '../_ui/primitives';
import { Select, TextInput } from '../_ui/controls';
import { useToast } from '../_ui/toast';
import { useCan } from '../_app/session';

/**
 * The answer to „Attraktionen ohne Gattung" on `/admin/data-quality`: an editor gives each of a
 * park's unfiled attractions its kind on the card, one audited batch saves them, an attraction no
 * kind fits gets a review mark, and the card shrinks until the park has none left and goes.
 */

/** The audit reason of the batch save, naming the section it came from. */
const KIND_SAVE_REASON = 'Datenqualität „Attraktionen ohne Gattung“';

/**
 * „Passt in keine Gattung“ for one attraction: asks what it is, the reason the next person reads,
 * and writes a `no_kind_fits` review mark, after which the report leaves the attraction out. An API
 * that does not know the mark yet refuses it, and its message is shown.
 */
function NoKindFits({
  row,
  onDone,
  onCancel,
}: {
  row: { id: string; name: string };
  onDone: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mark() {
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/api/admin/review-marks', {
        method: 'POST',
        body: { marks: [{ kind: 'no_kind_fits', attractionId: row.id, reason: reason.trim() }] },
      });
      toast.push({ title: `${row.name}: passt in keine Gattung`, tone: 'success' });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vermerk fehlgeschlagen');
      setSaving(false);
    }
  }

  return (
    <div className="basis-full space-y-2 pt-1">
      <TextInput
        value={reason}
        autoFocus
        aria-label={`Was ist ${row.name}?`}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Was ist es? z. B. ein Pool oder ein Weihnachtsmarkt"
      />
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          Abbrechen
        </Button>
        <Button size="sm" onClick={mark} disabled={saving || !reason.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Vermerken
        </Button>
      </div>
    </div>
  );
}

/**
 * The park's attractions without a kind, each with a select and „Passt in keine Gattung“, and one
 * save for the batch.
 */
function KindPicker({ park, onClose }: { park: AttractionsWithoutKind; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const canEdit = useCan('editor');
  const specs = useAdminQuery<{ attraction: CuratedFieldSpec[] }>(
    adminKeys.fields,
    '/api/admin/content/fields'
  );
  const options = curatedFieldOptions(specs.data?.attraction, 'attractionKind');
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [noFit, setNoFit] = useState<string | null>(null);

  const rows = park.withoutKindRefs;
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
        body: { entries, reason: KIND_SAVE_REASON },
      });
      toast.push({
        title: `${park.parkName}: Gattung für ${entries.length} ${entries.length === 1 ? 'Attraktion' : 'Attraktionen'} gespeichert`,
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

  return (
    <div className="border-border/60 mt-3 space-y-3 rounded-lg border p-3">
      {specs.isError && <ErrorState message={`Gattungen nicht geladen: ${specs.error.message}`} />}
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
            {canEdit && noFit !== row.id && (
              <Button size="sm" variant="ghost" onClick={() => setNoFit(row.id)} disabled={saving}>
                <CircleSlash className="h-4 w-4" /> Passt in keine Gattung
              </Button>
            )}
            {noFit === row.id && (
              <NoKindFits
                row={row}
                onCancel={() => setNoFit(null)}
                onDone={() => {
                  setNoFit(null);
                  pick(row.id, null);
                  invalidate(adminKeys.dataQuality());
                }}
              />
            )}
          </li>
        ))}
      </ul>
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
      </div>
    </div>
  );
}

/**
 * Data-quality card for one park's live attractions that carry no kind, asking what each one is:
 * names them, and opens a select per attraction on the card that saves through the audited bulk
 * endpoint, beside a review mark for an attraction no kind fits.
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
          {park.withoutKind.length} von {park.attractions} ohne Gattung
        </Chip>
      </div>

      <p className="mt-2 text-sm font-medium">
        Fahrgeschäft, Transportsystem, Show, Walkthrough, Halloween-Maze oder Spiel?
      </p>

      {open ? (
        <KindPicker park={park} onClose={() => setOpen(false)} />
      ) : (
        <>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
            {park.withoutKind.join(' · ')}
          </p>
          <div className="mt-3">
            <Button size="sm" onClick={() => setOpen(true)}>
              <Shapes className="h-4 w-4" /> Gattungen zuordnen
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
