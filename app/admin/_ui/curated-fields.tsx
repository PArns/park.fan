'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ExternalLink,
  Loader2,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminFetch, useInvalidateAdmin } from '../_lib/api';
import type { CuratedField, CurationResponse } from '../_lib/types';

/** ⌘S on a Mac, Strg+S everywhere else. Read once, in the browser. */
function saveShortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Strg+S';
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘S' : 'Strg+S';
}
import { Chip, Panel, PanelBody, PanelHeader } from './primitives';
import { useToast } from './toast';
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
 * One editor for every curated field: the backend describes its curatable columns and this renders
 * whatever it is handed, so a new curated column needs no frontend change. Each row shows
 * upstream's value beside the correction, which is how an editor sees a correction has become
 * redundant.
 */

type FieldValues = Record<string, unknown>;

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

/** A curated field's value as the editor shows it, `—` when empty. */
function formatFieldValue(field: CuratedField, value: unknown): string {
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
    case 'date':
      // Reformatted for reading, not reparsed: the value is already the park's
      // calendar day, and `new Date('2026-01-16')` would drag a UTC midnight
      // into it and print the 15th for anybody west of Greenwich.
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}`
        : String(value);
    default:
      return String(value);
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

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

    case 'date':
      return (
        <TextInput
          id={id}
          type="date"
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value || null)}
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

/** Says what an empty field means, since emptying is how a correction is withdrawn. */
function placeholderFor(field: CuratedField): string {
  if (field.humanOnly) return 'Nicht gesetzt';
  const upstream = formatFieldValue(field, field.syncedValue);
  return upstream === '—' ? 'Upstream sagt nichts' : `Upstream: ${upstream}`;
}

interface CuratedFormState {
  values: FieldValues;
  dirtyKeys: string[];
  setValue: (key: string, value: unknown) => void;
  reset: () => void;
  /**
   * Adopts what the server stored, from a save response. Not `reset()`, which falls back to the
   * pre-save `initial` until the refetch lands, so every input would snap back for a moment.
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
 * The curated form's state in three layers, merged in order: `initial` from the query, `saved`
 * from a save response until the query catches up, and `overrides` the person typed. A fresh
 * `fields` array drops the middle layer and every override the server now agrees with, so the
 * form follows the query again (an undo from the toast included).
 */
function useCuratedForm(fields: CuratedField[], scope?: DraftScope): CuratedFormState {
  const initial = useMemo(() => curatedValues(fields), [fields]);

  // Seeded from the draft (`curated-draft.ts`), lazily so it runs once and never on the server.
  const [restored] = useState(() => (scope ? loadCuratedDraft(scope) : null));
  const [overrides, setOverrides] = useState<FieldValues>(() => restored?.values ?? {});
  const [saved, setSaved] = useState<FieldValues | null>(null);
  const [seenFields, setSeenFields] = useState(fields);

  // Adjusting state during render, React's pattern for resetting state when a prop changes. React
  // Query keeps `fields` stable while the data is deep-equal, so this fires only on real changes.
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

/**
 * Form for a park's or ride's curated fields as the backend describes them: one tab per group,
 * each row showing upstream's value beside the correction, and a sticky save bar asking for reason
 * and source. Binds ⌘S / Strg+S while there is something to save; state comes from
 * `useCuratedForm`.
 */
function CuratedFieldsEditor({
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

  // One group at a time, in the backend's order. A chosen group that disappears from a refetch
  // falls back to the first instead of leaving an empty panel.
  const [chosenGroup, setChosenGroup] = useState<string | null>(null);
  const activeGroup = groups.find(([group]) => group === chosenGroup) ?? groups[0];

  const dirty = form.dirtyKeys.length > 0;
  const dirtyKeySet = new Set(form.dirtyKeys);

  function handleSave() {
    const changed: FieldValues = {};
    for (const key of form.dirtyKeys) changed[key] = form.values[key];
    onSave({ fields: changed, reason: reason.trim(), sourceUrl: sourceUrl.trim() });
    setReason('');
    setSourceUrl('');
  }

  // ⌘S / Strg+S, bound only while there is something to save, so it never swallows the
  // keystroke for nothing.
  useEffect(() => {
    if (!dirty || saving || disabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's') return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      handleSave();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // `handleSave` is re-created on every render and reads the current values;
    // the effect only needs to know whether saving is possible at all.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saving, disabled]);

  return (
    // The marker the shell's `g`-chord looks for: unsaved corrections are not
    // in a dialog and not in a focused input, so nothing else in the DOM says
    // "there is work here to lose".
    <div className="space-y-6" data-admin-dirty={dirty ? 'true' : undefined}>
      {form.restoredAt !== null && dirty && (
        /* Said out loud: silently reinstating yesterday's edits would surprise as much as losing
           them. */
        <p className="border-border/60 bg-muted/40 text-muted-foreground rounded-lg border px-3 py-2 text-xs">
          Nicht gespeicherte Änderungen von{' '}
          {new Date(form.restoredAt).toLocaleString('de-DE', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}{' '}
          wiederhergestellt. Speichern oder verwerfen.
        </p>
      )}
      {/* Each tab carries two counts, so a hidden group does not hide work: corrected fields
          and, in the primary colour, unsaved edits. */}
      {groups.length > 1 && (
        <div className="border-border/50 flex flex-wrap gap-x-1 border-b">
          {groups.map(([group, groupFields]) => {
            const selected = group === activeGroup?.[0];
            const overridden = groupFields.filter((field) => field.overridden).length;
            const edited = groupFields.filter((field) => dirtyKeySet.has(field.key)).length;
            return (
              <button
                key={group}
                type="button"
                aria-pressed={selected}
                onClick={() => setChosenGroup(group)}
                className={cn(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-xs transition-colors',
                  selected
                    ? 'border-primary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                {group}
                {overridden > 0 && (
                  <span
                    className="text-muted-foreground tabular-nums"
                    title={`${overridden} korrigiert`}
                  >
                    {overridden}
                  </span>
                )}
                {edited > 0 && (
                  <span
                    className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] leading-4 font-semibold tabular-nums"
                    title={`${edited} ungespeichert`}
                  >
                    {edited}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {activeGroup && (
        <section>
          {groups.length === 1 && (
            <h3 className="text-muted-foreground mb-1 px-3 text-[11px] font-semibold tracking-widest uppercase">
              {activeGroup[0]}
            </h3>
          )}
          <div className="space-y-1">
            {activeGroup[1].map((field) => (
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
      )}

      {/* A sticky bar rather than a button at the bottom of a long form: the
          field somebody just changed is usually not the last one, and hunting
          for the save button is how an edit gets abandoned. */}
      <div
        className={cn(
          'bg-background/90 border-border/60 sticky bottom-0 -mx-4 mt-2 border-t px-4 py-3 backdrop-blur-md'
        )}
      >
        {/* Idle it says so, rather than going invisible: a blank band the
            height of a control panel reads as something that failed to load,
            and it is also the only place the shortcut is written down. */}
        {!dirty ? (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Save className="h-3.5 w-3.5 shrink-0" />
            Keine ungespeicherten Änderungen. {saveShortcutLabel()} speichert.
          </p>
        ) : (
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
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Speichern
              </Button>
              <Button variant="ghost" size="sm" onClick={form.reset} disabled={saving}>
                Verwerfen
              </Button>
              <p className="text-muted-foreground ml-auto hidden text-xs sm:block">
                {saveShortcutLabel()} speichert · ohne Quelle ist eine Korrektur ein Gerücht.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type QueryPrefix = readonly unknown[];

/** The "Kuratierte Felder" panel of a park or a ride: the editor, its save, and the undo toast. */
export function CuratedFieldsPanel({
  fields,
  endpoint,
  draftScope,
  invalidateKeys,
  undoInvalidateKeys = invalidateKeys,
  emptyHint,
  savedDescription,
  canEdit,
}: {
  fields: CuratedField[];
  endpoint: string;
  draftScope: DraftScope;
  invalidateKeys: ReadonlyArray<QueryPrefix>;
  /** Defaults to `invalidateKeys`. */
  undoInvalidateKeys?: ReadonlyArray<QueryPrefix>;
  emptyHint: string;
  savedDescription?: string;
  canEdit: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const form = useCuratedForm(fields, draftScope);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overridden = fields.filter((field) => field.overridden).length;

  async function save(input: { fields: FieldValues; reason: string; sourceUrl: string }) {
    setSaving(true);
    setError(null);
    try {
      const result = await adminFetch<CurationResponse>(endpoint, {
        method: 'PATCH',
        body: {
          fields: input.fields,
          ...(input.reason ? { reason: input.reason } : {}),
          ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
        },
      });

      invalidate(...invalidateKeys);
      form.applyServerFields(result.fields);

      toast.push({
        title: `${result.changed.length} Feld${result.changed.length === 1 ? '' : 'er'} gespeichert`,
        description: savedDescription,
        tone: 'success',
        // The undo lives here because this is the moment it is wanted. Later it
        // is in the history tab; a minute later nobody looks.
        action: result.auditId
          ? {
              label: 'Rückgängig',
              onClick: async () => {
                await adminFetch(`/api/admin/content/history/${result.auditId}/undo`, {
                  method: 'POST',
                });
                invalidate(...undoInvalidateKeys);
              },
            }
          : undefined,
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
        icon={Sliders}
        title="Kuratierte Felder"
        hint={
          overridden === 0
            ? emptyHint
            : `${overridden} Feld${overridden === 1 ? '' : 'er'} weicht vom Upstream ab.`
        }
        action={
          overridden > 0 ? (
            <Chip tone="primary">
              <Sparkles className="h-3 w-3" />
              {overridden}
            </Chip>
          ) : null
        }
      />
      <PanelBody>
        {!canEdit && (
          <p className="text-muted-foreground mb-3 text-xs">
            Dein Konto darf lesen, aber nicht kuratieren.
          </p>
        )}
        <CuratedFieldsEditor
          fields={fields}
          form={form}
          disabled={!canEdit}
          saving={saving}
          saveError={error}
          onSave={save}
        />
      </PanelBody>
    </Panel>
  );
}
