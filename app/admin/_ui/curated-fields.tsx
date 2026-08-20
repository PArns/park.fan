'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ExternalLink, Loader2, RotateCcw, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CuratedField } from '../_lib/types';
import { Chip } from './primitives';
import {
  clearCuratedDraft,
  loadCuratedDraft,
  saveCuratedDraft,
  type DraftScope,
} from './curated-draft';
import {
  Field,
  MonthPicker,
  NumberInput,
  Select,
  TextArea,
  TextInput,
  TriSwitch,
  useFieldId,
} from './controls';

/**
 * One editor for every curated field there is or ever will be.
 *
 * The backend describes its curatable columns — key, type, the value upstream
 * publishes, the value a human wrote, the value the API actually serves — and
 * this renders whatever it is handed. Adding a curated column to the API makes
 * it appear here with no frontend change at all, which is the point: a form
 * written field by field is a second, drifting copy of which columns are
 * curatable, and the drift shows up as a field somebody cannot edit and cannot
 * see why.
 *
 * The three-value display is the actual work. A curated field is a
 * **disagreement with a machine**, and the only way to judge one is to see both
 * sides at once: upstream's value beside yours, with the effective value
 * implied. Without it the editor is just a form, and a form cannot tell you
 * that the correction you wrote in March is now identical to what the sync
 * publishes and can be removed.
 */

export type FieldValues = Record<string, unknown>;

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
];

export function formatFieldValue(field: CuratedField, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  switch (field.type) {
    case 'boolean':
      return value === true ? 'Ja' : value === false ? 'Nein' : '—';
    case 'months':
      return Array.isArray(value)
        ? (value as number[]).map((month) => MONTH_NAMES[month - 1] ?? month).join(', ')
        : '—';
    case 'number':
    case 'decimal':
      return field.unit ? `${String(value)} ${field.unit}` : String(value);
    default:
      return String(value);
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// ─── one field ────────────────────────────────────────────────────────────────

function CuratedFieldRow({
  field,
  value,
  onChange,
  disabled,
}: {
  field: CuratedField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}) {
  const id = useFieldId(field.key);
  const dirty = !sameValue(value, field.curatedValue);
  const hasCorrection = value !== null && value !== undefined && value !== '';
  const agreesWithUpstream =
    hasCorrection && !field.humanOnly && sameValue(value, field.syncedValue);

  return (
    <Field
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      className={cn(
        'rounded-lg px-3 py-3 transition-colors',
        dirty ? 'bg-primary/[0.06] ring-primary/25 ring-1' : 'hover:bg-muted/20'
      )}
      aside={
        <div className="flex items-center gap-1.5">
          {dirty && <Chip tone="primary">geändert</Chip>}
          {!field.humanOnly && (
            <UpstreamChip field={field} onAdopt={() => onChange(field.syncedValue ?? null)} />
          )}
          {hasCorrection && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              title={
                field.humanOnly
                  ? 'Wert löschen'
                  : 'Korrektur entfernen, es gilt wieder, was der Sync sagt'
              }
              className="text-muted-foreground hover:text-foreground rounded p-1 disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      }
    >
      <FieldControl field={field} id={id} value={value} onChange={onChange} disabled={disabled} />

      {agreesWithUpstream && (
        <p className="flex items-center gap-1.5 text-xs text-amber-400">
          <Sparkles className="h-3 w-3 shrink-0" />
          Deckt sich mit dem Upstream-Wert, die Korrektur wird nicht mehr gebraucht.
        </p>
      )}
    </Field>
  );
}

function UpstreamChip({ field, onAdopt }: { field: CuratedField; onAdopt: () => void }) {
  const upstream = formatFieldValue(field, field.syncedValue);
  if (upstream === '—') {
    return (
      <Chip>
        <ArrowLeftRight className="h-3 w-3" />
        Upstream: nichts
      </Chip>
    );
  }
  return (
    <button type="button" onClick={onAdopt} title="Upstream-Wert übernehmen">
      <Chip className="hover:border-primary/40 hover:text-foreground cursor-pointer">
        <ArrowLeftRight className="h-3 w-3" />
        Upstream: {upstream}
      </Chip>
    </button>
  );
}

function FieldControl({
  field,
  id,
  value,
  onChange,
  disabled,
}: {
  field: CuratedField;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}) {
  switch (field.type) {
    case 'longtext':
      return (
        <TextArea
          id={id}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          placeholder={placeholderFor(field)}
          onChange={(event) => onChange(event.target.value || null)}
        />
      );

    case 'number':
    case 'decimal':
      return (
        <div className="flex items-center gap-2">
          <NumberInput
            id={id}
            disabled={disabled}
            min={field.min}
            max={field.max}
            // A park of 28.3 ha must be enterable as 28.3; a height in cm must
            // not accept 172.5, because the column is an int and the backend
            // would reject it after the typing.
            step={field.type === 'decimal' ? 0.1 : 1}
            inputMode={field.type === 'decimal' ? 'decimal' : 'numeric'}
            value={typeof value === 'number' ? value : null}
            onValueChange={onChange}
            placeholder={placeholderFor(field)}
            className="max-w-32"
          />
          {field.unit && <span className="text-muted-foreground text-xs">{field.unit}</span>}
        </div>
      );

    case 'url': {
      const href = typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
      return (
        <div className="flex items-center gap-2">
          <TextInput
            id={id}
            type="url"
            disabled={disabled}
            maxLength={field.maxLength}
            value={typeof value === 'string' ? value : ''}
            placeholder={placeholderFor(field)}
            onChange={(event) => onChange(event.target.value || null)}
          />
          {/* The one check a form cannot do: whether the address is the right
              one. Opening it is one click, and a curated link nobody opened is
              how a park page ends up pointing at a parked domain. */}
          <a
            href={href ?? undefined}
            target="_blank"
            rel="noreferrer noopener"
            aria-disabled={href ? undefined : true}
            className={cn(
              'text-muted-foreground hover:text-foreground shrink-0 rounded-md border p-1.5 transition-colors',
              !href && 'pointer-events-none opacity-30'
            )}
            title="Adresse öffnen"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      );
    }

    case 'boolean':
      return (
        <TriSwitch
          disabled={disabled}
          value={typeof value === 'boolean' ? value : null}
          onValueChange={onChange}
        />
      );

    case 'enum':
      return (
        <Select
          id={id}
          disabled={disabled}
          value={typeof value === 'string' ? value : null}
          onValueChange={onChange}
          placeholder={placeholderFor(field)}
          options={(field.options ?? []).map((option) => ({
            value: option,
            label: option,
          }))}
        />
      );

    case 'months':
      return (
        <MonthPicker
          disabled={disabled}
          value={Array.isArray(value) ? (value as number[]) : null}
          reference={Array.isArray(field.syncedValue) ? (field.syncedValue as number[]) : null}
          onValueChange={onChange}
        />
      );

    default:
      return (
        <TextInput
          id={id}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          placeholder={placeholderFor(field)}
          onChange={(event) => onChange(event.target.value || null)}
        />
      );
  }
}

/**
 * The placeholder says what happens if you leave it empty.
 *
 * "Leer = Upstream" is more useful than repeating the label, because empty is a
 * meaningful state here and not an unfilled one — it is how a correction is
 * withdrawn.
 */
function placeholderFor(field: CuratedField): string {
  if (field.humanOnly) return 'Nicht gesetzt';
  const upstream = formatFieldValue(field, field.syncedValue);
  return upstream === '—' ? 'Upstream sagt nichts' : `Upstream: ${upstream}`;
}

// ─── the form ─────────────────────────────────────────────────────────────────

export interface CuratedFormState {
  values: FieldValues;
  dirtyKeys: string[];
  setValue: (key: string, value: unknown) => void;
  reset: () => void;
  /**
   * Adopt what the server actually stored, from a save response.
   *
   * Not `reset()`. Clearing the overrides makes the form fall back to `initial`,
   * which is still derived from the *pre-save* props until the refetch lands —
   * so every input visibly snaps back to its old value for a moment and then
   * jumps forward again, which reads as "the save was undone". Adopting the
   * response instead shows the stored values immediately, and once the refetch
   * arrives `initial` matches them and nothing is dirty.
   *
   * It also surfaces the server's own coercions — a trimmed string, sorted
   * months — rather than leaving the form showing what was typed.
   */
  applyServerFields: (fields: CuratedField[]) => void;
  /** When this form opened holding edits from an earlier visit. */
  restoredAt: number | null;
}

function curatedValues(fields: CuratedField[]): FieldValues {
  const values: FieldValues = {};
  for (const field of fields) values[field.key] = field.curatedValue ?? null;
  return values;
}

/** Overrides the server has since confirmed are no longer edits. */
function dropConfirmed(overrides: FieldValues, server: FieldValues): FieldValues {
  const remaining: FieldValues = {};
  let dropped = false;
  for (const [key, value] of Object.entries(overrides)) {
    if (sameValue(value, server[key] ?? null)) dropped = true;
    else remaining[key] = value;
  }
  return dropped ? remaining : overrides;
}

/**
 * Three layers, and which one wins is the whole point.
 *
 * `initial` is what the query says, `saved` is what a save response said before
 * the query caught up, `overrides` is what the person typed. They are merged in
 * that order, and the moment a fresh `fields` array arrives — a refetch, a
 * window-focus refresh, another admin's edit — the middle layer is dropped and
 * every override the server now agrees with goes with it.
 *
 * The version this replaced seeded `overrides` with the *whole* save response
 * (the backend returns every descriptor, not just the changed ones), which
 * detached the form from the query for good: no later `initial` could win
 * against a full-coverage override. The visible cost was on the undo in the
 * save toast. Undo reverted the column server-side, the refetch brought the
 * reverted value back, and the form still showed the undone edit and counted it
 * as an unsaved change — pressing save again silently re-applied what had just
 * been taken back.
 */
export function useCuratedForm(fields: CuratedField[], scope?: DraftScope): CuratedFormState {
  const initial = useMemo(() => curatedValues(fields), [fields]);

  // Seeded from the draft, lazily so it runs once and never on the server.
  // Everything the person typed and did not save is in there — see
  // `curated-draft.ts` for the five ways out of this form that used to throw
  // it away.
  const [restored] = useState(() => (scope ? loadCuratedDraft(scope) : null));
  const [overrides, setOverrides] = useState<FieldValues>(() => restored?.values ?? {});
  const [saved, setSaved] = useState<FieldValues | null>(null);
  const [seenFields, setSeenFields] = useState(fields);

  // Adjusting state during render rather than in an effect: this is the
  // documented pattern for "reset some state when a prop changes", it re-renders
  // before anything is painted, and React 19 forbids the effect form outright.
  // React Query keeps the reference stable while the data is deep-equal, so
  // this fires when the data actually changed, not on every render.
  if (fields !== seenFields) {
    setSeenFields(fields);
    setSaved(null);
    setOverrides((current) => dropConfirmed(current, initial));
  }

  const values = useMemo(
    () => ({ ...initial, ...(saved ?? {}), ...overrides }),
    [initial, saved, overrides]
  );

  const dirtyKeys = useMemo(
    () => Object.keys(values).filter((key) => !sameValue(values[key], initial[key])),
    [values, initial]
  );

  // Debounced, and only while something is actually unsaved: a clean form must
  // clear its draft, or a restored one would keep coming back after a save
  // somebody made in another tab.
  useEffect(() => {
    if (!scope) return;
    if (dirtyKeys.length === 0) {
      clearCuratedDraft(scope);
      return;
    }
    const pending: FieldValues = {};
    for (const key of dirtyKeys) pending[key] = values[key];
    const timer = setTimeout(() => saveCuratedDraft(scope, pending), 500);
    return () => clearTimeout(timer);
  }, [scope, dirtyKeys, values]);

  return {
    values,
    dirtyKeys,
    restoredAt: restored?.savedAt ?? null,
    setValue: (key, value) => setOverrides((current) => ({ ...current, [key]: value })),
    reset: () => {
      setOverrides({});
      setSaved(null);
      if (scope) clearCuratedDraft(scope);
    },
    applyServerFields: (next) => {
      const stored = curatedValues(next);
      setSaved(stored);
      // Saved is saved: the row in the database is the durable copy now.
      if (scope) clearCuratedDraft(scope);
      // Anything typed while the save was in flight and still different from
      // what came back stays an edit; everything the server confirmed stops
      // being one.
      setOverrides((current) => dropConfirmed(current, stored));
    },
  };
}

export function CuratedFieldsEditor({
  fields,
  form,
  disabled = false,
  onSave,
  saving = false,
  saveError,
}: {
  fields: CuratedField[];
  form: CuratedFormState;
  disabled?: boolean;
  onSave: (input: { fields: FieldValues; reason: string; sourceUrl: string }) => void;
  saving?: boolean;
  saveError?: string | null;
}) {
  const [reason, setReason] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const groups = useMemo(() => {
    const byGroup = new Map<string, CuratedField[]>();
    for (const field of fields) {
      const list = byGroup.get(field.group) ?? [];
      list.push(field);
      byGroup.set(field.group, list);
    }
    return [...byGroup.entries()];
  }, [fields]);

  const dirty = form.dirtyKeys.length > 0;

  function handleSave() {
    const changed: FieldValues = {};
    for (const key of form.dirtyKeys) changed[key] = form.values[key];
    onSave({ fields: changed, reason: reason.trim(), sourceUrl: sourceUrl.trim() });
    setReason('');
    setSourceUrl('');
  }

  return (
    // The marker the shell's `g`-chord looks for: unsaved corrections are not
    // in a dialog and not in a focused input, so nothing else in the DOM says
    // "there is work here to lose".
    <div className="space-y-6" data-admin-dirty={dirty ? 'true' : undefined}>
      {form.restoredAt !== null && dirty && (
        /* Say it out loud. Silently reinstating yesterday's half-finished
           edits would be the same surprise as losing them, in the other
           direction — and the person who reads this is the one who would
           otherwise save them without noticing. */
        <p className="border-border/60 bg-muted/40 text-muted-foreground rounded-lg border px-3 py-2 text-xs">
          Nicht gespeicherte Änderungen von{' '}
          {new Date(form.restoredAt).toLocaleString('de-DE', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}{' '}
          wiederhergestellt. Speichern oder verwerfen.
        </p>
      )}
      {groups.map(([group, groupFields]) => (
        <section key={group}>
          <h3 className="text-muted-foreground mb-1 px-3 text-[11px] font-semibold tracking-widest uppercase">
            {group}
          </h3>
          <div className="space-y-1">
            {groupFields.map((field) => (
              <CuratedFieldRow
                key={field.key}
                field={field}
                value={form.values[field.key]}
                onChange={(value) => form.setValue(field.key, value)}
                disabled={disabled || saving}
              />
            ))}
          </div>
        </section>
      ))}

      {/* A sticky bar rather than a button at the bottom of a long form: the
          field somebody just changed is usually not the last one, and hunting
          for the save button is how an edit gets abandoned. */}
      <div
        className={cn(
          'bg-background/90 border-border/60 sticky bottom-0 -mx-4 mt-2 border-t px-4 py-3 backdrop-blur-md transition-opacity',
          dirty ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {form.dirtyKeys.length} {form.dirtyKeys.length === 1 ? 'Änderung' : 'Änderungen'}
            </span>
            <div className="flex flex-wrap gap-1">
              {form.dirtyKeys.map((key) => (
                <Chip key={key} tone="primary">
                  {fields.find((field) => field.key === key)?.label ?? key}
                </Chip>
              ))}
            </div>
          </div>

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
              placeholder="Quelle: die Seite, auf der es steht"
              disabled={saving}
            />
          </div>

          {saveError && <p className="text-destructive text-xs">{saveError}</p>}

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving || disabled} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Speichern
            </Button>
            <Button variant="ghost" size="sm" onClick={form.reset} disabled={saving}>
              Verwerfen
            </Button>
            <p className="text-muted-foreground ml-auto hidden text-xs sm:block">
              Ohne Quelle ist eine Korrektur ein Gerücht.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
