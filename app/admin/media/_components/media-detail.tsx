'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, MapPin, Save, Upload, X } from 'lucide-react';

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
import { Chip, Field, Notice, Section } from './panel-ui';
import { fitForCommit } from '../_lib/upload-transport';

/** Shared field styling — the admin has no form primitives of its own. */
const INPUT =
  'border-border bg-background focus:border-foreground focus:ring-foreground/20 w-full rounded-lg border px-2.5 py-1.5 text-sm transition-colors outline-none focus:ring-2';

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
  /** Open a fresh pull request instead of joining the running session. */
  newSession?: boolean;
  onClose: () => void;
  onSaved: (pullRequestUrl: string | null, joinedSession?: boolean) => void;
}

export function MediaDetail({ id, vocabulary, newSession, onClose, onSaved }: Props) {
  const { pass } = useAdmin();
  const [row, setRow] = useState<MediaRow | null>(null);
  const [geo, setGeo] = useState<GeoVerdict | null>(null);
  const [draft, setDraft] = useState<Partial<MediaRow> | null>(null);
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('de');
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const [replacing, setReplacing] = useState(false);
  /** A file is being dragged over the replace bar. */
  const [dropping, setDropping] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
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

  // Only a FAILED LOAD replaces the editor — there is nothing to edit then. Once the
  // row is here, every later error (a rejected drop, a save that did not go through)
  // renders inline instead: swapping the panel out at that point would throw away
  // whatever sidecar edits were on screen, which is a steep price for a typo'd file.
  if (error && !row) return <Panel onClose={onClose}>{error}</Panel>;
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

  // Only the fields this editor writes — `row` also carries derived values the
  // sidecar has no say in (size, version, variants), and comparing those would
  // report every image as edited the moment it loads.
  const editable = (v: Partial<MediaRow>) =>
    JSON.stringify([
      v.title ?? null,
      v.park ?? null,
      v.parkPath ?? null,
      v.ride ?? null,
      v.area ?? null,
      v.collection ?? null,
      [...(v.roles ?? [])].sort(),
      [...(v.tags ?? [])].sort(),
      v.alt ?? {},
      v.caption ?? {},
      v.credit ?? null,
      v.shotAt ?? null,
      v.focus ?? null,
    ]);
  const dirty = editable(draft) !== editable(row);

  /**
   * Closing throws the draft away, so say so first when there is one.
   *
   * Everything here is edited in memory until "Save" opens a pull request; a
   * mis-aimed backdrop click after retagging an image would otherwise silently
   * cost all of it.
   */
  const requestClose = () => {
    if (dirty && !window.confirm('Discard the unsaved changes to this image?')) return;
    onClose();
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/media/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [ADMIN_PASS_HEADER]: pass },
        body: JSON.stringify({
          title: `media: update ${row!.id}`,
          newSession,
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
      onSaved(data.pullRequest ?? null, data.joinedSession);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Swap the bytes of an existing image, keeping its sidecar.
   *
   * This is the upgrade path for the sources below the resolution target: the id,
   * the park/ride assignment, the tags, the credit and the focal point all stay
   * put, only the pixels change. The content hash moves with them, so every cached
   * rendition of the old file is superseded rather than lingering for a year.
   *
   * The extension may change (a JPEG replacing a PNG); the commit endpoint files it
   * under the new one and deletes the old path.
   */
  /**
   * Take one image out of a drop or a file picker, and say why when it is not one.
   *
   * Replacing swaps a single file, so a multi-file drop is rejected rather than
   * silently using the first — picking one for somebody who meant to drop a batch
   * is how the wrong photo ends up on a ride.
   */
  function replaceFrom(files: FileList | File[] | null) {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    if (list.length > 1) {
      setError('Replacing swaps one file — drop a single image. Use “Add images” for a batch.');
      return;
    }
    const [file] = list;
    if (!file.type.startsWith('image/')) {
      setError(`${file.name} is not an image.`);
      return;
    }
    void replaceBytes(file);
  }

  async function replaceBytes(original: File) {
    setReplacing(true);
    setError(null);
    try {
      // A replacement is usually a BIGGER file than the one it supersedes — this is
      // the low-res upgrade path — so it is the most likely thing to run into the
      // request-body limit. Shrunk only when it has to be.
      const { file } = await fitForCommit(original);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
        reader.readAsDataURL(file);
      });
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
      const response = await fetch('/api/admin/media/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [ADMIN_PASS_HEADER]: pass },
        body: JSON.stringify({
          title: `media: replace ${row!.id}`,
          newSession,
          operations: [
            {
              op: 'replace',
              id: row!.id,
              collection: row!.collection,
              name: currentName,
              ext: ext === 'jpeg' ? 'jpg' : ext,
              contentBase64: base64,
            },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 207) throw new Error(data.error ?? 'Replace failed');
      onSaved(data.pullRequest ?? null, data.joinedSession);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReplacing(false);
    }
  }

  return (
    <Panel
      onClose={requestClose}
      // Escape belongs to the topmost thing on screen: with the catalog picker
      // open it dismisses that, not the editor underneath it.
      onEscape={() => (picker ? setPicker(null) : requestClose())}
      title={draft.title || currentName}
      id={row.id}
      thumb={row.src}
      thumbFocus={draft.focus ?? null}
      dirty={dirty}
      footer={
        <>
          <div className="min-w-0 flex-1">
            {error ? (
              <p className="flex items-start gap-1.5 text-xs text-amber-400">
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            ) : (
              <p className="text-muted-foreground text-[11px]">
                {movedTo
                  ? `Moving to “${movedTo}” — the file and its sidecar are renamed.`
                  : 'Committed to a branch and opened as a draft PR — nothing changes on the live site until it merges.'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="bg-foreground text-background focus-visible:ring-foreground/40 flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Opening pull request…' : dirty ? 'Save as pull request' : 'No changes'}
          </button>
        </>
      }
    >
      {/* File bar — the pixels, and the one action that changes them.
          It sits above the two columns and spans both on purpose: the replace
          control used to live at the top of the right-hand column, which on a
          laptop is a full screen below the focal-point previews, and nobody
          found it. Upgrading a low-res original is a routine job, so it gets a
          routine place: next to the resolution it is fixing.

          The whole bar is the drop target, not just the button — a photo being
          upgraded comes from a file manager, so dragging it here is the shortest
          path from "this one is too small" to a pull request. Clicking anywhere on
          it opens the picker for the same reason. */}
      {/* A div plus an explicit click, not a <label> wrapping the input — the same
          shape `media-upload.tsx` uses. A label implicitly activates its control,
          and a drop landing on it forwarded that activation, which tore the panel
          down mid-drop. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => replaceInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            replaceInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDropping(true);
        }}
        // Moving over a child fires dragleave on the bar as well; without the
        // relatedTarget check the highlight flickers off the moment the pointer
        // crosses the icon or the text.
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDropping(false);
          replaceFrom(e.dataTransfer.files);
        }}
        className={cn(
          'focus-visible:ring-foreground/40 mb-4 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-2 border-dashed px-3 py-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none',
          replacing ? 'cursor-progress opacity-60' : 'cursor-pointer',
          dropping
            ? 'border-foreground bg-muted/60'
            : row.lowRes
              ? 'border-amber-500/60 bg-amber-500/10 hover:border-amber-500'
              : 'border-border hover:border-foreground'
        )}
      >
        {row.lowRes ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <Upload className="text-muted-foreground h-4 w-4 shrink-0" />
        )}
        <span className="font-mono">
          {row.width}×{row.height}
        </span>
        <span className="text-muted-foreground">
          {replacing
            ? 'Opening pull request…'
            : dropping
              ? 'Drop it to replace this image'
              : row.lowRes
                ? `below the ${vocabulary.lowResLongEdge}px target — drop a higher-resolution original here, or click to choose. Everything else about this image stays.`
                : 'drop a new file here, or click to choose — the id, the sidecar and every reference to it stay put'}
        </span>
        <span
          className={cn(
            'ml-auto shrink-0 rounded-md px-3 py-1.5 font-medium',
            row.lowRes ? 'bg-amber-500 text-black' : 'bg-foreground text-background'
          )}
        >
          Replace file…
        </span>
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={replacing}
          onChange={(e) => {
            const { files } = e.target;
            replaceFrom(files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Two independently scrolling columns from `lg` up. The framing previews are
          tall, so one shared scroll pushed the metadata a screenful away from the
          picture it describes — which is exactly the pairing this editor is for. */}
      <div className="grid min-h-0 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden">
        <div className="min-h-0 lg:overflow-y-auto lg:pr-1">
          <FocusEditor
            src={row.src}
            alt={row.title}
            focus={draft.focus ?? null}
            onChange={(focus) => set('focus', focus)}
          />
        </div>

        {/* Grouped by the question each answers — what it shows, what it is used
            for, how it reads, who owns it. Twelve fields in one flat stack gave a
            park slug the same weight as a caption. */}
        <div className="min-h-0 space-y-4 text-sm lg:overflow-y-auto lg:pr-1">
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

          <Section title="What it shows">
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
              <p className="text-muted-foreground -mt-1 truncate font-mono text-[10px]">
                {draft.parkPath}
              </p>
            )}

            <Field label="Area">
              <input
                className={INPUT}
                placeholder="themed area"
                value={draft.area ?? ''}
                onChange={(e) => set('area', e.target.value || null)}
              />
            </Field>
          </Section>

          <Section
            title="How it is used"
            hint="Roles are declared, never derived — a unique role can only belong to one image."
          >
            <div className="flex flex-wrap gap-1.5">
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
          </Section>

          <Section title="Tags">
            {vocabulary.facets.map((facet) => (
              <div key={facet.id}>
                <span className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wide uppercase">
                  {facet.label}
                  {facet.exclusive && <span className="normal-case"> · pick one</span>}
                </span>
                <div className="flex flex-wrap gap-1.5">
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
          </Section>

          <Section
            title="Words"
            action={
              <div className="flex gap-0.5">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[11px] uppercase transition-colors',
                      locale === l
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground',
                      // A dot marks the languages that already have text, so it is
                      // visible at a glance which five still need writing.
                      (draft.alt?.[l] || draft.caption?.[l]) && locale !== l && 'font-semibold'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            }
          >
            <textarea
              className={cn(INPUT, 'min-h-[56px] resize-y')}
              placeholder={`Alt text (${locale}) — what a screen reader announces`}
              value={draft.alt?.[locale] ?? ''}
              onChange={(e) => set('alt', { ...draft.alt, [locale]: e.target.value })}
            />
            <textarea
              className={cn(INPUT, 'min-h-[56px] resize-y')}
              placeholder={`Caption (${locale}) — printed under the photo`}
              value={draft.caption?.[locale] ?? ''}
              onChange={(e) => set('caption', { ...draft.caption, [locale]: e.target.value })}
            />
          </Section>

          <Section
            title="Rights"
            hint="“unknown” is a real answer — do not invent an author to clear the warning."
          >
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
          </Section>
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

/**
 * The editor's dialog shell.
 *
 * Header and footer are pinned and only the body scrolls, because the two things
 * you always want reachable — which image am I editing, and Save — were the two
 * furthest apart: the title scrolled away upward while Save sat at the bottom of
 * a twelve-field column, so saving meant scrolling the whole overlay.
 *
 * The header thumbnail is cropped at the image's own focal point. It is the
 * cheapest possible demonstration of what the setting below it does, and it
 * doubles as "yes, this is the photo you clicked".
 */
function Panel({
  children,
  onClose,
  onEscape,
  title,
  id,
  thumb,
  thumbFocus,
  dirty,
  footer,
}: {
  children: React.ReactNode;
  onClose: () => void;
  onEscape?: () => void;
  title?: string;
  id?: string;
  thumb?: string;
  thumbFocus?: MediaRow['focus'] | null;
  dirty?: boolean;
  footer?: React.ReactNode;
}) {
  const escape = onEscape ?? onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') escape();
    };
    document.addEventListener('keydown', onKey);
    // The overlay has its own scroll; leaving the page scrollable behind it means
    // a stray wheel event moves the admin list instead of the dialog.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [escape]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      // mousedown, not click: releasing outside after a drag that STARTED inside
      // (selecting caption text, dragging the focal point) must not count as
      // clicking the backdrop.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Image'}
        className={cn(
          'bg-background ring-border flex max-h-full w-full flex-col overflow-hidden rounded-2xl shadow-2xl ring-1',
          // The loading and failed-to-load states render the same shell with no
          // body to speak of; at the editor's width they came out as a 1150px box
          // holding the word "Loading…".
          footer ? 'max-w-6xl' : 'max-w-md'
        )}
      >
        <header className="border-border/70 flex shrink-0 items-center gap-3 border-b px-4 py-3">
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element -- admin chrome, fixed 40px box
            <img
              src={thumb}
              alt=""
              className="border-border h-10 w-10 shrink-0 rounded-lg border object-cover"
              style={{
                objectPosition: thumbFocus
                  ? `${thumbFocus.x * 100}% ${thumbFocus.y * 100}%`
                  : '50% 50%',
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold">{title}</h2>
              {dirty && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  unsaved
                </span>
              )}
            </div>
            {id && <p className="text-muted-foreground truncate font-mono text-[11px]">{id}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Below `lg` the whole body is one scroll. From `lg` up it becomes a flex
            column so the grid below it gets a DEFINITE height — without that the
            columns have nothing to size their own scroll against, and
            `overflow-hidden` here simply clips whatever does not fit. */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:flex lg:flex-col lg:overflow-hidden">
          {children}
        </div>

        {footer && (
          <footer className="border-border/70 bg-muted/30 flex shrink-0 items-center gap-4 border-t px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
