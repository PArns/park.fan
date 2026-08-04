'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Save, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ADMIN_PASS_HEADER, useAdmin } from '../../_lib/admin-context';
import type { MediaRole } from '@/lib/media/types';
import type { MediaRow, Vocabulary } from '../_lib/types';
import {
  ParkRidePicker,
  type PickerMode,
  type PickerResult,
} from '../../blog-editor/_components/park-ride-picker';
import { FocusEditor } from './focus-editor';

/** Shared field styling — the admin has no form primitives of its own. */
const INPUT =
  'border-border bg-background focus:border-foreground w-full rounded-md border px-2 py-1.5 text-sm outline-none';

/**
 * Edit one image: what it shows, how it is credited, how it is framed, and where
 * it is filed.
 *
 * Everything here writes to the image's sidecar, and saving opens a pull request
 * rather than mutating anything in place — the database is the repository.
 */

const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'] as const;

interface GeoVerdict {
  status: 'no-gps' | 'match' | 'mismatch' | 'suggestion' | 'no-park-nearby';
  assigned?: string;
  match?: { park: { slug: string; name: string }; distanceM: number };
}

interface Props {
  id: string;
  vocabulary: Vocabulary;
  onClose: () => void;
  onSaved: (pullRequestUrl: string | null) => void;
}

export function MediaDetail({ id, vocabulary, onClose, onSaved }: Props) {
  const { pass } = useAdmin();
  const [row, setRow] = useState<MediaRow | null>(null);
  const [geo, setGeo] = useState<GeoVerdict | null>(null);
  const [draft, setDraft] = useState<Partial<MediaRow> | null>(null);
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('de');
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No state reset here: the page mounts this with `key={id}`, so opening another
  // image gets a fresh state slice. Resetting inside the effect instead would be a
  // cascading render (and React 19 rejects it).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, {
      headers: { [ADMIN_PASS_HEADER]: pass },
    })
      .then((r) => r.json())
      .then((data: { image?: MediaRow; geo?: GeoVerdict; error?: string }) => {
        if (cancelled) return;
        if (!data.image) {
          setError(data.error ?? 'Not found');
          return;
        }
        setRow(data.image);
        setGeo(data.geo ?? null);
        setDraft({ ...data.image });
      })
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [id, pass]);

  if (error) return <Panel onClose={onClose}>{error}</Panel>;
  if (!row || !draft) return <Panel onClose={onClose}>Loading…</Panel>;

  const set = <K extends keyof MediaRow>(key: K, value: MediaRow[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleTag = (tag: string, facet: { exclusive: boolean; tags: string[] }) => {
    const current = draft.tags ?? [];
    if (current.includes(tag)) {
      set(
        'tags',
        current.filter((t) => t !== tag)
      );
      return;
    }
    // An exclusive facet replaces rather than adds — an image cannot be day and night.
    const cleaned = facet.exclusive ? current.filter((t) => !facet.tags.includes(t)) : current;
    set('tags', [...cleaned, tag]);
  };

  // The vocabulary arrives from the API as plain strings; it is generated from
  // MEDIA_ROLES, so narrowing here is a cast at the boundary rather than a guess.
  const toggleRole = (role: MediaRole) => {
    const current = draft.roles ?? [];
    set('roles', current.includes(role) ? current.filter((r) => r !== role) : [...current, role]);
  };

  /**
   * Apply a pick from the shared park/ride picker.
   *
   * The picker hands back the full geo path, which is worth more than the slug:
   * it disambiguates the two parks whose slug is not unique (`disneyland-park` is
   * both Anaheim and Paris), so `parkPath` falls out for free instead of having to
   * be remembered by hand.
   */
  const applyPick = (result: PickerResult) => {
    // `/parks/europe/france/paris/disneyland-park[/attractions/<ride>]`
    const segments = result.refKey
      .replace(/^\/parks\//, '')
      .split('/')
      .filter(Boolean);
    const rideIndex = segments.indexOf('attractions');
    const parkSegments = rideIndex >= 0 ? segments.slice(0, rideIndex) : segments.slice(0, 4);

    if (result.kind === 'park') {
      set('park', parkSegments[3] ?? null);
      set('parkPath', parkSegments.length === 4 ? parkSegments.join('/') : null);
    } else {
      set('ride', segments[segments.length - 1] ?? null);
      // A ride implies its park — filling both saves the second lookup, and the
      // search backend's parent slug is authoritative.
      set('park', result.parentParkSlug ?? parkSegments[3] ?? null);
      set('parkPath', parkSegments.length === 4 ? parkSegments.join('/') : null);
    }
    setPicker(null);
  };

  const currentName = row.id.split('/').pop()!;
  const movedTo = draft.collection !== row.collection ? draft.collection : null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/media/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [ADMIN_PASS_HEADER]: pass },
        body: JSON.stringify({
          title: `media: update ${row!.id}`,
          operations: [
            {
              op: movedTo ? 'move' : 'update',
              id: row!.id,
              collection: draft!.collection,
              name: currentName,
              ext: row!.format,
              sidecar: {
                park: draft!.park ?? null,
                parkPath: draft!.parkPath ?? null,
                ride: draft!.ride ?? null,
                area: draft!.area ?? null,
                title: draft!.title ?? null,
                tags: draft!.tags ?? [],
                roles: draft!.roles ?? [],
                alt: draft!.alt ?? {},
                caption: draft!.caption ?? {},
                credit: draft!.credit,
                shotAt: draft!.shotAt ?? null,
                focus: draft!.focus ?? null,
              },
            },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 207) throw new Error(data.error ?? 'Save failed');
      onSaved(data.pullRequest ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel onClose={onClose} title={row.id}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <FocusEditor
          src={row.src}
          alt={row.title}
          focus={draft.focus ?? null}
          onChange={(focus) => set('focus', focus)}
        />

        <div className="space-y-4 text-sm">
          {row.lowRes && (
            <Notice tone="warn">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {row.width}×{row.height} — below the {vocabulary.lowResLongEdge}px target. Replace
                this source with a higher-resolution original.
              </span>
            </Notice>
          )}

          {geo && geo.status !== 'no-gps' && (
            <Notice tone={geo.status === 'mismatch' ? 'warn' : 'info'}>
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                {geo.status === 'match' && `GPS agrees: ${geo.match?.park.name}`}
                {geo.status === 'mismatch' &&
                  `Assigned to ${geo.assigned}, but shot ${Math.round((geo.match?.distanceM ?? 0) / 1000)} km away at ${geo.match?.park.name}`}
                {geo.status === 'suggestion' && `Shot at ${geo.match?.park.name} — assign it?`}
                {geo.status === 'no-park-nearby' && 'Coordinates are not near any known park'}
              </span>
            </Notice>
          )}

          <Field label="Title">
            <input
              className={INPUT}
              value={draft.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Park">
              <SlugField
                value={draft.park}
                placeholder="park slug"
                onChange={(v) => set('park', v)}
                onPick={() => setPicker('park')}
              />
            </Field>
            <Field label="Ride">
              <SlugField
                value={draft.ride}
                placeholder="attraction slug"
                onChange={(v) => set('ride', v)}
                onPick={() => setPicker('ride')}
              />
            </Field>
          </div>
          {draft.parkPath && (
            <p className="text-muted-foreground -mt-2 font-mono text-[10px]">{draft.parkPath}</p>
          )}

          <Field label="Area">
            <input
              className={INPUT}
              value={draft.area ?? ''}
              onChange={(e) => set('area', e.target.value || null)}
            />
          </Field>

          <Field label={`Collection${movedTo ? ' — will be moved' : ''}`}>
            <input
              className={cn(INPUT, movedTo && 'border-amber-500')}
              list="media-collections"
              value={draft.collection ?? ''}
              onChange={(e) => set('collection', e.target.value)}
            />
            <datalist id="media-collections">
              {vocabulary.collections.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <div>
            <span className="mb-1 block text-xs font-medium">Roles</span>
            <div className="flex flex-wrap gap-1">
              {vocabulary.roles.map((role) => (
                <Chip
                  key={role}
                  active={(draft.roles ?? []).includes(role)}
                  onClick={() => toggleRole(role)}
                >
                  {role}
                </Chip>
              ))}
            </div>
          </div>

          {vocabulary.facets.map((facet) => (
            <div key={facet.id}>
              <span className="mb-1 block text-xs font-medium">
                {facet.label}
                {facet.exclusive && <span className="text-muted-foreground"> · pick one</span>}
              </span>
              <div className="flex flex-wrap gap-1">
                {facet.tags.map((tag) => (
                  <Chip
                    key={tag}
                    active={(draft.tags ?? []).includes(tag)}
                    onClick={() => toggleTag(tag, facet)}
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          ))}

          <div>
            <div className="mb-1 flex items-center gap-1">
              <span className="text-xs font-medium">Text</span>
              {LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={cn(
                    'rounded px-1.5 text-[11px] uppercase',
                    locale === l ? 'bg-foreground text-background' : 'text-muted-foreground'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <textarea
              className={cn(INPUT, 'mb-1 min-h-[52px]')}
              placeholder={`Alt (${locale})`}
              value={draft.alt?.[locale] ?? ''}
              onChange={(e) => set('alt', { ...draft.alt, [locale]: e.target.value })}
            />
            <textarea
              className={cn(INPUT, 'min-h-[52px]')}
              placeholder={`Caption (${locale})`}
              value={draft.caption?.[locale] ?? ''}
              onChange={(e) => set('caption', { ...draft.caption, [locale]: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Author">
              <input
                className={INPUT}
                value={draft.credit?.author ?? ''}
                onChange={(e) =>
                  set('credit', { ...draft.credit!, author: e.target.value || null })
                }
              />
            </Field>
            <Field label="Licence">
              <select
                className={INPUT}
                value={draft.credit?.license ?? 'unknown'}
                onChange={(e) =>
                  set('credit', {
                    ...draft.credit!,
                    license: e.target.value as MediaRow['credit']['license'],
                  })
                }
              >
                {vocabulary.licenses.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {error && <Notice tone="warn">{error}</Notice>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-foreground text-background flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Opening pull request…' : 'Save as pull request'}
          </button>
          <p className="text-muted-foreground text-[11px]">
            Sidecar changes are committed to a branch and opened as a draft PR — nothing changes on
            the live site until it merges.
          </p>
        </div>
      </div>

      {/* The blog editor's picker, reused verbatim — it already searches the live
          catalog and returns the geo path. Typing raw slugs was how a photo ended
          up on a ride that does not exist. */}
      <ParkRidePicker mode={picker} onPick={applyPick} onClose={() => setPicker(null)} />
    </Panel>
  );
}

/** Slug input with a "Pick…" button — typed by hand or chosen from the catalog. */
function SlugField({
  value,
  placeholder,
  onChange,
  onPick,
}: {
  value: string | null | undefined;
  placeholder: string;
  onChange: (value: string | null) => void;
  onPick: () => void;
}) {
  return (
    <div className="flex gap-1">
      <input
        className={INPUT}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      />
      <button
        type="button"
        onClick={onPick}
        className="border-border hover:bg-muted shrink-0 rounded-md border px-2 text-xs"
      >
        Pick…
      </button>
    </div>
  );
}

function Panel({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-background border-border mx-auto max-w-6xl rounded-xl border p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-mono text-sm break-all">{title}</h2>
          <button type="button" onClick={onClose} className="hover:bg-muted rounded p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-muted-foreground hover:border-foreground'
      )}
    >
      {children}
    </button>
  );
}

function Notice({ tone, children }: { tone: 'info' | 'warn'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-xs',
        tone === 'warn'
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          : 'border-border bg-muted/40 text-muted-foreground'
      )}
    >
      {children}
    </div>
  );
}
