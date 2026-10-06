'use client';

import { useMemo, useState } from 'react';
import { ListChecks, Loader2, Save, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import type { AdminAttractionListItem, AdminParkDetail, CuratedFieldSpec } from '../../_lib/types';
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../../_ui/primitives';
import { NumberInput, Select, TextInput, TriSwitch } from '../../_ui/controls';
import { useToast } from '../../_ui/toast';
import { useCan } from '../../_app/session';

/**
 * The yes/no and pick-one facts about a park's rides, decided across the whole list, because they
 * come from one page of the park's site covering many rides. One column at a time, one save for
 * the batch, and only the changed fields are sent.
 */

interface RowState {
  hasFastPass: boolean | null;
  fastPassPrice: number | null;
  hasVirtualLine: boolean | null;
  hasSingleRider: boolean | null;
  indoorOutdoor: string | null;
  attractionKind: string | null;
}

type FieldKey = keyof RowState;
type Draft = Record<string, RowState>;

const FIELD_KEYS: FieldKey[] = [
  'hasFastPass',
  'fastPassPrice',
  'hasVirtualLine',
  'hasSingleRider',
  'indoorOutdoor',
  'attractionKind',
];

type Column = 'fastPass' | 'virtualLine' | 'singleRider' | 'indoorOutdoor' | 'kind';

const COLUMNS: Array<{ id: Column; label: string; field: FieldKey }> = [
  { id: 'fastPass', label: 'Fast Pass', field: 'hasFastPass' },
  { id: 'virtualLine', label: 'Virtual Line', field: 'hasVirtualLine' },
  { id: 'singleRider', label: 'Single Rider', field: 'hasSingleRider' },
  { id: 'indoorOutdoor', label: 'Indoor/Outdoor', field: 'indoorOutdoor' },
  { id: 'kind', label: 'Typ', field: 'attractionKind' },
];

function rowFrom(row: AdminAttractionListItem): RowState {
  return {
    hasFastPass: row.fastPass?.has ?? null,
    fastPassPrice: row.fastPass?.price ?? null,
    hasVirtualLine: row.hasVirtualLine ?? null,
    hasSingleRider: row.hasSingleRider ?? null,
    indoorOutdoor: row.indoorOutdoor ?? null,
    attractionKind: row.attractionKind ?? null,
  };
}

/**
 * The fields an edit actually changed. Only keys somebody touched are
 * compared: a refetch that brings in another editor's change to a different
 * field of the same ride must not turn into a write of the old value.
 */
function changedFields(edit: Partial<RowState> | undefined, base: RowState): FieldKey[] {
  if (!edit) return [];
  return FIELD_KEYS.filter((key) => key in edit && edit[key] !== base[key]);
}

/** A flag counts when it says yes, a pick-one field when anybody picked. */
function isSet(value: RowState[FieldKey]): boolean {
  return typeof value === 'boolean' ? value : value !== null;
}

/** The park's own fast-pass settings, read off the descriptors it already ships. */
function parkFastPass(park: AdminParkDetail) {
  const value = (key: string) => {
    const field = park.fields.find((entry) => entry.key === key);
    return typeof field?.curatedValue === 'string' ? field.curatedValue : null;
  };
  return {
    name: value('curatedFastPassName'),
    currency: value('curatedCurrency'),
    termId: value('curatedFastPassTermId'),
  };
}

/** The park editor's table for ride features such as fast pass or single rider, ride by ride. */
export function AttractionFeaturesEditor({ park }: { park: AdminParkDetail }) {
  const canEdit = useCan('editor');
  const toast = useToast();
  const invalidate = useInvalidateAdmin();

  // Same key and same query string as the Fahrgeschäfte tab's unfiltered list,
  // so opening both tabs costs one request rather than two.
  const attractions = useAdminQuery<{ total: number; attractions: AdminAttractionListItem[] }>(
    adminKeys.parkAttractions(park.id, { params: '' }),
    `/api/admin/content/parks/${park.id}/attractions?`
  );

  // The options of both selects come from the backend's field list, so a new
  // attraction kind shows up here without a frontend change.
  const specs = useAdminQuery<{ attraction: CuratedFieldSpec[] }>(
    adminKeys.fields,
    '/api/admin/content/fields'
  );
  const optionsFor = (key: FieldKey) =>
    (specs.data?.attraction.find((spec) => spec.key === key)?.options ?? []).map((option) => ({
      value: option,
      label: option,
    }));

  const rows = useMemo(() => attractions.data?.attractions ?? [], [attractions.data]);
  const base = useMemo(() => {
    const draft: Draft = {};
    for (const row of rows) draft[row.id] = rowFrom(row);
    return draft;
  }, [rows]);

  const [column, setColumn] = useState<Column>('fastPass');
  const [overrides, setOverrides] = useState<Record<string, Partial<RowState>>>({});
  const [reason, setReason] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = useMemo(() => {
    const merged: Draft = {};
    for (const [id, row] of Object.entries(base)) merged[id] = { ...row, ...overrides[id] };
    return merged;
  }, [base, overrides]);

  const changes = useMemo(() => {
    const out: Array<{ id: string; fields: FieldKey[] }> = [];
    for (const id of Object.keys(overrides)) {
      if (!base[id]) continue;
      const fields = changedFields(overrides[id], base[id]!);
      if (fields.length > 0) out.push({ id, fields });
    }
    return out;
  }, [overrides, base]);

  const park_ = parkFastPass(park);
  const active = COLUMNS.find((entry) => entry.id === column)!;
  const countSet = (field: FieldKey) =>
    Object.values(draft).filter((row) => isSet(row[field])).length;
  const flagged = countSet('hasFastPass');

  function setRow(id: string, next: Partial<RowState>) {
    setOverrides((current) => ({
      ...current,
      [id]: { ...current[id], ...next },
    }));
  }

  /** Everything already flagged gets the same price. The common case: one page
   *  of the park's site lists one price for a dozen rides. */
  function applyPriceToFlagged() {
    if (bulkPrice === null) return;
    setOverrides((current) => {
      const next = { ...current };
      for (const [id, row] of Object.entries(draft)) {
        if (row.hasFastPass === true) next[id] = { ...next[id], fastPassPrice: bulkPrice };
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const result = await adminFetch<{ changed: Array<{ id: string; changed: string[] }> }>(
        `/api/admin/content/parks/${park.id}/attractions`,
        {
          method: 'PATCH',
          body: {
            entries: changes.map(({ id, fields }) => ({
              id,
              fields: Object.fromEntries(fields.map((key) => [key, draft[id]![key]])),
            })),
            ...(reason ? { reason } : {}),
            ...(sourceUrl ? { sourceUrl } : {}),
          },
        }
      );

      setOverrides({});
      setReason('');
      setSourceUrl('');
      invalidate(adminKeys.park(park.id), ['admin', 'park', park.id], ['admin', 'history']);

      toast.push({
        title: `${result.changed.length} Fahrgeschäft${
          result.changed.length === 1 ? '' : 'e'
        } gespeichert`,
        description: 'Die Caches sind geleert, das Frontend wurde benachrichtigt.',
        tone: 'success',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  function control(row: AdminAttractionListItem, state: RowState) {
    const disabled = !canEdit || saving;
    switch (column) {
      case 'fastPass':
        return (
          <>
            <TriSwitch
              value={state.hasFastPass}
              onValueChange={(hasFastPass) => setRow(row.id, { hasFastPass })}
              disabled={disabled}
            />
            <NumberInput
              value={state.fastPassPrice}
              onValueChange={(fastPassPrice) => setRow(row.id, { fastPassPrice })}
              min={0}
              step={0.5}
              inputMode="decimal"
              placeholder={state.hasFastPass === true ? 'Preis' : '—'}
              className="max-w-24"
              // A price on a ride that sells no pass is a value nothing
              // will ever serve, and it would sit there looking curated.
              disabled={disabled || state.hasFastPass !== true}
            />
          </>
        );
      case 'virtualLine':
        return (
          <TriSwitch
            value={state.hasVirtualLine}
            onValueChange={(hasVirtualLine) => setRow(row.id, { hasVirtualLine })}
            disabled={disabled}
          />
        );
      case 'singleRider':
        return (
          <TriSwitch
            value={state.hasSingleRider}
            onValueChange={(hasSingleRider) => setRow(row.id, { hasSingleRider })}
            disabled={disabled}
          />
        );
      case 'indoorOutdoor':
        return (
          <Select
            value={state.indoorOutdoor}
            onValueChange={(indoorOutdoor) => setRow(row.id, { indoorOutdoor })}
            options={optionsFor('indoorOutdoor')}
            emptyLabel="— nicht geprüft —"
            className="w-40"
            // Without the option list a stored value shows as "—", and the only
            // pick left would clear it.
            disabled={disabled || !specs.isSuccess}
          />
        );
      case 'kind':
        return (
          <Select
            value={state.attractionKind}
            onValueChange={(attractionKind) => setRow(row.id, { attractionKind })}
            options={optionsFor('attractionKind')}
            emptyLabel="— nicht entschieden —"
            className="w-40"
            // Without the option list a stored value shows as "—", and the only
            // pick left would clear it.
            disabled={disabled || !specs.isSuccess}
          />
        );
    }
  }

  return (
    <Panel>
      <PanelHeader
        icon={ListChecks}
        title="Merkmale"
        hint={
          column === 'fastPass'
            ? park_.name
              ? `${park_.name}${park_.currency ? ` · ${park_.currency}` : ''} · ${flagged} von ${rows.length} Bahnen`
              : `Ohne Namen heißt das Produkt überall „Fast Pass" · ${flagged} von ${rows.length} Bahnen`
            : `${active.label} · ${countSet(active.field)} von ${rows.length} Bahnen gesetzt`
        }
      />

      <PanelBody className="space-y-3">
        {!canEdit && (
          <p className="text-muted-foreground text-xs">
            Dein Konto darf lesen, aber nicht kuratieren.
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {COLUMNS.map((entry) => {
            const selected = entry.id === column;
            const pending = changes.some(
              ({ fields }) =>
                fields.includes(entry.field) ||
                (entry.id === 'fastPass' && fields.includes('fastPassPrice'))
            );
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setColumn(entry.id)}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors sm:min-h-0',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {entry.label}
                <span className={cn('tabular-nums', !selected && 'opacity-70')}>
                  {countSet(entry.field)}
                </span>
                {pending && (
                  <span
                    aria-label="ungespeichert"
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      selected ? 'bg-primary-foreground' : 'bg-primary'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {column === 'fastPass' && (
          <>
            {/* The park settings that decide what these rows can publish, said here because this
                is where an unserved price gets noticed. */}
            {!park_.currency && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Diesem Park fehlt die Währung (Stammdaten → Fastpass). Preise über 0 bleiben so
                unveröffentlicht — eine nackte &bdquo;12&ldquo; ist kein Preis. 0 (kostenlos) geht
                ohne.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <NumberInput
                value={bulkPrice}
                onValueChange={setBulkPrice}
                min={0}
                step={0.5}
                inputMode="decimal"
                placeholder="Preis"
                className="max-w-28"
                disabled={!canEdit || saving}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={applyPriceToFlagged}
                disabled={!canEdit || saving || bulkPrice === null || flagged === 0}
              >
                Auf alle {flagged} mit Fastpass
              </Button>
              <span className="text-muted-foreground text-xs">
                0 = kostenlos · leer = unbekannt (tagesabhängige Preise)
              </span>
            </div>
          </>
        )}

        {(column === 'indoorOutdoor' || column === 'kind') && specs.isError && (
          <ErrorState message={`Optionen nicht geladen: ${specs.error.message}`} />
        )}

        {attractions.isError ? (
          <ErrorState message={attractions.error.message} />
        ) : attractions.isLoading ? (
          <SkeletonRows rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Keine Fahrgeschäfte"
            description="Dieser Park hat keine."
          />
        ) : (
          <ul className="divide-border/40 divide-y">
            {rows.map((row) => {
              const state = draft[row.id]!;
              const dirty = changedFields(overrides[row.id], base[row.id]!).length > 0;
              return (
                <li
                  key={row.id}
                  className={cn(
                    'flex flex-wrap items-center gap-3 px-1 py-2',
                    dirty && 'bg-primary/[0.06]'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {row.name}
                      {column === 'fastPass' && row.fastPass?.name && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          heißt hier {row.fastPass.name}
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[row.land, row.attractionType].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>

                  {control(row, state)}
                </li>
              );
            })}
          </ul>
        )}

        <div className="bg-background/90 border-border/60 sticky bottom-0 -mx-4 border-t px-4 py-3 backdrop-blur-md">
          {changes.length === 0 ? (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Save className="h-3.5 w-3.5 shrink-0" />
              Keine ungespeicherten Änderungen.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {changes.length} {changes.length === 1 ? 'Fahrgeschäft' : 'Fahrgeschäfte'} geändert
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Warum? (steht später im Änderungsprotokoll)"
                  disabled={saving}
                />
                <TextInput
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="Quelle: die Seite des Parks, auf der das steht"
                  disabled={saving}
                />
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}

              <div className="flex items-center gap-2">
                <Button onClick={save} disabled={saving || !canEdit} size="sm">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Speichern
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOverrides({})}
                  disabled={saving}
                >
                  Verwerfen
                </Button>
                <p className="text-muted-foreground ml-auto hidden text-xs sm:block">
                  Jede Bahn bekommt ihre eigene Protokollzeile — rückgängig geht einzeln.
                </p>
              </div>
            </div>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}
