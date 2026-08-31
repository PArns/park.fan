'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save, Ticket, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import type { AdminAttractionListItem, AdminParkDetail } from '../../_lib/types';
import {
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../../_ui/primitives';
import { NumberInput, TextInput, TriSwitch } from '../../_ui/controls';
import { useToast } from '../../_ui/toast';
import { useCan } from '../../_app/session';

/**
 * Which of a park's rides sell a queue-jump pass, decided across the whole list.
 *
 * The generic field editor can already write these three columns one ride at a
 * time, and for a single correction that is the right place. This exists
 * because the question is not asked one ride at a time: somebody reads the
 * park's QuickPass page, which lists twelve rides and their prices, and then
 * has to put that into forty rows. Forty page loads and forty saves is how that
 * ends up half-done.
 *
 * So the table is the park's ride list with two controls per row, and one save
 * for the batch — which is also one cache eviction and one revalidation, rather
 * than forty of each.
 */

interface RowState {
  has: boolean | null;
  price: number | null;
}

type Draft = Record<string, RowState>;

function initialDraft(rows: AdminAttractionListItem[]): Draft {
  const draft: Draft = {};
  for (const row of rows) {
    draft[row.id] = { has: row.fastPass?.has ?? null, price: row.fastPass?.price ?? null };
  }
  return draft;
}

function same(a: RowState, b: RowState): boolean {
  return a.has === b.has && a.price === b.price;
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

export function FastPassEditor({ park }: { park: AdminParkDetail }) {
  const canEdit = useCan('editor');
  const toast = useToast();
  const invalidate = useInvalidateAdmin();

  // Same key and same query string as the Fahrgeschäfte tab's unfiltered list,
  // so opening both tabs costs one request rather than two.
  const attractions = useAdminQuery<{ total: number; attractions: AdminAttractionListItem[] }>(
    adminKeys.parkAttractions(park.id, { params: '' }),
    `/api/admin/content/parks/${park.id}/attractions?`
  );

  const rows = useMemo(() => attractions.data?.attractions ?? [], [attractions.data]);
  const base = useMemo(() => initialDraft(rows), [rows]);

  const [overrides, setOverrides] = useState<Draft>({});
  const [reason, setReason] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = useMemo(() => ({ ...base, ...overrides }), [base, overrides]);

  const dirtyIds = useMemo(
    () => Object.keys(draft).filter((id) => base[id] && !same(draft[id]!, base[id]!)),
    [draft, base]
  );

  const park_ = parkFastPass(park);
  const flagged = Object.values(draft).filter((row) => row.has === true).length;

  function setRow(id: string, next: Partial<RowState>) {
    setOverrides((current) => ({
      ...current,
      [id]: { ...(current[id] ?? base[id] ?? { has: null, price: null }), ...next },
    }));
  }

  /** Everything already flagged gets the same price. The common case: one page
   *  of the park's site lists one price for a dozen rides. */
  function applyPriceToFlagged() {
    if (bulkPrice === null) return;
    setOverrides((current) => {
      const next = { ...current };
      for (const [id, row] of Object.entries(draft)) {
        if (row.has === true) next[id] = { ...row, price: bulkPrice };
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
            entries: dirtyIds.map((id) => ({
              id,
              fields: { hasFastPass: draft[id]!.has, fastPassPrice: draft[id]!.price },
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

  return (
    <Panel>
      <PanelHeader
        icon={Ticket}
        title="Fastpass"
        hint={
          park_.name
            ? `${park_.name}${park_.currency ? ` · ${park_.currency}` : ''} · ${flagged} von ${rows.length} Bahnen`
            : `Ohne Namen heißt das Produkt überall „Fast Pass" · ${flagged} von ${rows.length} Bahnen`
        }
        action={flagged > 0 ? <Chip tone="primary">{flagged}</Chip> : null}
      />

      <PanelBody className="space-y-3">
        {!canEdit && (
          <p className="text-muted-foreground text-xs">
            Dein Konto darf lesen, aber nicht kuratieren.
          </p>
        )}

        {/* The two settings that live on the park and decide what these rows can
            even publish. Said here rather than only in the Stammdaten tab,
            because this is where somebody notices the price they just typed is
            not being served. */}
        {!park_.currency && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Diesem Park fehlt die Währung (Stammdaten → Fastpass). Preise über 0 bleiben so
            unveröffentlicht — eine nackte &bdquo;12&ldquo; ist kein Preis. 0 (kostenlos) geht ohne.
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

        {attractions.isError ? (
          <ErrorState message={attractions.error.message} />
        ) : attractions.isLoading ? (
          <SkeletonRows rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="Keine Fahrgeschäfte"
            description="Dieser Park hat keine."
          />
        ) : (
          <ul className="divide-border/40 divide-y">
            {rows.map((row) => {
              const state = draft[row.id]!;
              const dirty = base[row.id] && !same(state, base[row.id]!);
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
                      {row.fastPass?.name && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          heißt hier {row.fastPass.name}
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[row.land, row.attractionType].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>

                  <TriSwitch
                    value={state.has}
                    onValueChange={(has) => setRow(row.id, { has })}
                    disabled={!canEdit || saving}
                  />

                  <NumberInput
                    value={state.price}
                    onValueChange={(price) => setRow(row.id, { price })}
                    min={0}
                    step={0.5}
                    inputMode="decimal"
                    placeholder={state.has === true ? 'Preis' : '—'}
                    className="max-w-24"
                    // A price on a ride that sells no pass is a value nothing
                    // will ever serve, and it would sit there looking curated.
                    disabled={!canEdit || saving || state.has !== true}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <div className="bg-background/90 border-border/60 sticky bottom-0 -mx-4 border-t px-4 py-3 backdrop-blur-md">
          {dirtyIds.length === 0 ? (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Save className="h-3.5 w-3.5 shrink-0" />
              Keine ungespeicherten Änderungen.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {dirtyIds.length} {dirtyIds.length === 1 ? 'Fahrgeschäft' : 'Fahrgeschäfte'}{' '}
                geändert
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
                  placeholder="Quelle: die Seite des Parks, auf der die Preise stehen"
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
