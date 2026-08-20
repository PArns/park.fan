'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  Factory,
  Gauge,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import type { RideProfile } from '../../_lib/types';
import { Chip, EmptyState, Panel, PanelBody, PanelHeader } from '../../_ui/primitives';
import { Field, NumberInput, TextInput } from '../../_ui/controls';
import { useToast } from '../../_ui/toast';

/**
 * The ride's profile: what kind of ride it is, and what its layout does.
 *
 * These rows had no write path at all until now. They were edited with
 * hand-written SQL against production, matched on park slug and ride slug
 * together (park slugs are not globally unique), with a `seeded_at = now()`
 * that had to be remembered — and forgetting it meant the correction was
 * written, was correct, and stayed invisible, because that column is what the
 * publish job reads to decide whose caches to drop.
 *
 * Two things about `elements` are not editorial preferences and must survive
 * any redesign of this component. The order is the ride's layout in ride order,
 * so the list is reorderable and never sorted. And repeats are meaningful — a
 * layout that takes the same figure twice says so twice — so adding a term that
 * is already in the list is allowed, not a no-op.
 */

interface GlossaryTerm {
  id: string;
  name: string;
  category: string;
}

const MEASUREMENTS: Array<{
  key: 'topSpeedKmh' | 'heightM' | 'lengthM' | 'durationSeconds';
  label: string;
  unit: string;
}> = [
  { key: 'topSpeedKmh', label: 'Höchstgeschwindigkeit', unit: 'km/h' },
  { key: 'heightM', label: 'Höhe', unit: 'm' },
  { key: 'lengthM', label: 'Länge', unit: 'm' },
  { key: 'durationSeconds', label: 'Fahrzeit', unit: 's' },
];

export function RideProfileEditor({
  attractionId,
  parkId,
  profile,
  canEdit,
}: {
  attractionId: string;
  parkId: string | null;
  profile: RideProfile | null;
  canEdit: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();

  const [elements, setElements] = useState<string[]>(profile?.elements ?? []);
  const [types, setTypes] = useState<string[]>(profile?.types ?? []);
  const [manufacturerName, setManufacturerName] = useState(profile?.manufacturerName ?? '');
  const [manufacturerTermId, setManufacturerTermId] = useState(profile?.manufacturerTermId ?? '');
  const [model, setModel] = useState(profile?.model ?? '');
  const [openedYear, setOpenedYear] = useState<number | null>(profile?.openedYear ?? null);
  const [inversions, setInversions] = useState<number | null>(profile?.inversions ?? null);
  const [stats, setStats] = useState(() => ({
    topSpeedKmh: profile?.curatedStats?.topSpeedKmh ?? null,
    heightM: profile?.curatedStats?.heightM ?? null,
    lengthM: profile?.curatedStats?.lengthM ?? null,
    durationSeconds: profile?.curatedStats?.durationSeconds ?? null,
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const glossary = useAdminQuery<{ terms: GlossaryTerm[] }>(
    ['admin', 'glossary-terms'],
    '/api/admin/glossary-terms',
    { staleTime: 30 * 60_000 }
  );
  // Memoised so the identity is stable: `?? []` builds a fresh array on every
  // render, which would rebuild the lookup map on every keystroke below.
  const terms = useMemo(() => glossary.data?.terms ?? [], [glossary.data]);
  const termById = useMemo(() => new Map(terms.map((term) => [term.id, term])), [terms]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/content/attractions/${attractionId}/ride-profile`, {
        method: 'PUT',
        body: {
          elements,
          types,
          manufacturerName: manufacturerName.trim() || null,
          manufacturerTermId: manufacturerTermId.trim() || null,
          model: model.trim() || null,
          openedYear,
          inversions,
          curatedStats: Object.values(stats).every((value) => value === null) ? null : stats,
        },
      });
      invalidate(adminKeys.attraction(attractionId), parkId ? adminKeys.park(parkId) : ['admin']);
      toast.push({
        title: 'Ride-Profil gespeichert',
        description: 'Die Caches sind geleert und das Glossar verlinkt die Bahn.',
        tone: 'success',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/content/attractions/${attractionId}/ride-profile`, {
        method: 'DELETE',
      });
      invalidate(adminKeys.attraction(attractionId));
      toast.push({ title: 'Ride-Profil entfernt', tone: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        icon={Blocks}
        title="Ride-Profil"
        hint={
          profile
            ? `Zuletzt kuratiert ${new Date(profile.seededAt).toLocaleDateString('de-DE')}`
            : 'Noch kein Profil — die Bahn taucht im Glossar nicht auf.'
        }
      />
      <PanelBody className="space-y-5">
        <TermList
          label="Layout"
          hint="Die Streckenelemente in Fahrreihenfolge. Wiederholungen sind gewollt, die Reihenfolge ist die Fahrt — deshalb wird hier nie sortiert."
          value={elements}
          onChange={setElements}
          terms={terms}
          termById={termById}
          categories={['elements']}
          ordered
          disabled={!canEdit}
        />

        <TermList
          label="Art der Bahn"
          hint="Ungeordnet: Launch-Coaster, Terrain-Coaster, Dark Ride."
          value={types}
          onChange={setTypes}
          terms={terms}
          termById={termById}
          categories={['coasters', 'attractions']}
          disabled={!canEdit}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Hersteller"
            hint="Anzeigename, auch wenn es dafür keinen Glossar-Eintrag gibt."
          >
            <TextInput
              value={manufacturerName}
              onChange={(event) => setManufacturerName(event.target.value)}
              placeholder="Bolliger & Mabillard"
              disabled={!canEdit}
            />
          </Field>
          <Field label="Hersteller im Glossar" hint="Leer = Name als Text ohne Link.">
            <TermPicker
              terms={terms.filter((term) => term.category === 'manufacturers')}
              value={manufacturerTermId || null}
              onSelect={(id) => setManufacturerTermId(id ?? '')}
              disabled={!canEdit}
              placeholder="Kein Glossar-Eintrag"
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Modell">
            <TextInput
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="Blitz Coaster"
              disabled={!canEdit}
            />
          </Field>
          <Field label="Eröffnet">
            <NumberInput
              value={openedYear}
              onValueChange={setOpenedYear}
              min={1800}
              max={2100}
              disabled={!canEdit}
            />
          </Field>
          <Field
            label="Inversionen"
            hint="Wie der Park sie zählt — das kann vom Layout oben abweichen."
          >
            <NumberInput
              value={inversions}
              onValueChange={setInversions}
              min={0}
              max={20}
              disabled={!canEdit}
            />
          </Field>
        </div>

        <div>
          <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase">
            <Gauge className="h-3 w-3" /> Maße
          </p>
          <p className="text-muted-foreground mb-2 text-xs">
            Handgeschrieben. Jeder Wert schlägt den aus Wikidata importierten — leer lassen heißt
            „nimm den Import“.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {MEASUREMENTS.map((measurement) => {
              const imported = profile?.stats?.[measurement.key] ?? null;
              return (
                <Field
                  key={measurement.key}
                  label={measurement.label}
                  hint={imported !== null ? `Wikidata: ${imported} ${measurement.unit}` : undefined}
                >
                  <NumberInput
                    value={stats[measurement.key]}
                    onValueChange={(value) =>
                      setStats((current) => ({ ...current, [measurement.key]: value }))
                    }
                    disabled={!canEdit}
                    placeholder={imported !== null ? String(imported) : measurement.unit}
                  />
                </Field>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border px-3 py-2 text-xs">
            {error}
          </p>
        )}

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Profil speichern
            </Button>
            {profile && (
              <Button
                size="sm"
                variant="ghost"
                onClick={remove}
                disabled={saving}
                className="text-destructive hover:text-destructive ml-auto"
              >
                <Trash2 className="h-4 w-4" /> Profil löschen
              </Button>
            )}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

// ─── term list ────────────────────────────────────────────────────────────────

function TermList({
  label,
  hint,
  value,
  onChange,
  terms,
  termById,
  categories,
  ordered = false,
  disabled,
}: {
  label: string;
  hint: string;
  value: string[];
  onChange: (value: string[]) => void;
  terms: GlossaryTerm[];
  termById: Map<string, GlossaryTerm>;
  categories: string[];
  ordered?: boolean;
  disabled?: boolean;
}) {
  const candidates = useMemo(
    () => terms.filter((term) => categories.includes(term.category)),
    [terms, categories]
  );

  function move(index: number, delta: number) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-foreground/80 text-xs font-medium tracking-wide">{label}</p>
      <p className="text-muted-foreground text-xs leading-snug">{hint}</p>

      {value.length === 0 ? (
        <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-3 py-3 text-center text-xs">
          Noch nichts eingetragen.
        </p>
      ) : (
        <ol className="space-y-1">
          {value.map((id, index) => {
            const term = termById.get(id);
            return (
              <li
                key={`${id}-${index}`}
                className="border-border/60 bg-card/40 flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
              >
                {ordered && (
                  <span className="text-muted-foreground w-5 shrink-0 text-center text-xs tabular-nums">
                    {index + 1}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {term ? term.name : id}
                  {!term && (
                    <span className="ml-1.5 text-xs text-amber-400">— kein Glossar-Eintrag</span>
                  )}
                </span>
                {ordered && !disabled && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Nach oben"
                      className="text-muted-foreground hover:text-foreground rounded p-1 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === value.length - 1}
                      aria-label="Nach unten"
                      className="text-muted-foreground hover:text-foreground rounded p-1 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, position) => position !== index))}
                    aria-label="Entfernen"
                    className="text-muted-foreground hover:text-destructive rounded p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {!disabled && (
        <TermPicker
          terms={candidates}
          value={null}
          onSelect={(id) => {
            // Appending an id that is already present is deliberate: a layout
            // that takes the same figure twice must be able to say so.
            if (id) onChange([...value, id]);
          }}
          placeholder="Element hinzufügen…"
          trigger={
            <span className="border-border/60 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-xs">
              <Plus className="h-3 w-3" /> Hinzufügen
            </span>
          }
        />
      )}
    </div>
  );
}

function TermPicker({
  terms,
  value,
  onSelect,
  placeholder,
  disabled,
  trigger,
}: {
  terms: GlossaryTerm[];
  value: string | null;
  onSelect: (id: string | null) => void;
  placeholder: string;
  disabled?: boolean;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list =
      term.length === 0
        ? terms
        : terms.filter(
            (candidate) =>
              candidate.name.toLowerCase().includes(term) ||
              candidate.id.toLowerCase().includes(term)
          );
    return list.slice(0, 60);
  }, [terms, query]);

  const selected = value ? terms.find((term) => term.id === value) : null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery('');
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        {trigger ? (
          <button type="button" disabled={disabled}>
            {trigger}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'border-border/70 bg-background/60 flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm disabled:opacity-50'
            )}
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected ? selected.name : placeholder}
            </span>
            <Factory className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-border/50 border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Begriff suchen…"
              className="border-border/60 bg-background/60 h-8 w-full rounded-lg border pr-2 pl-8 text-sm outline-none"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {value !== null && (
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
              className="hover:bg-accent text-muted-foreground w-full rounded-md px-2 py-1.5 text-left text-sm"
            >
              — entfernen —
            </button>
          )}
          {filtered.length === 0 ? (
            <EmptyState title="Kein Begriff gefunden" />
          ) : (
            filtered.map((term) => (
              <button
                key={term.id}
                type="button"
                onClick={() => {
                  onSelect(term.id);
                  setOpen(false);
                  setQuery('');
                }}
                className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{term.name}</span>
                <Chip>{term.category}</Chip>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
