'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Crosshair,
  GitPullRequest,
  ImageIcon,
  Plus,
  Search,
  Upload,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Section } from '../_lib/ui';
import { FolderRail } from './_components/folder-rail';
import { MediaDetail } from './_components/media-detail';
import { MediaUpload } from './_components/media-upload';
import type { FolderView } from './_lib/folders';
import type { MediaRow, MediaStats, Vocabulary } from './_lib/types';
import { AdminPage, EmptyState, ErrorState, LoadingState, StatTile } from '../_ui/primitives';
import { fitForCommit } from '../_lib/upload-transport';
import { pickReplacement, replacementExt } from './_lib/replace-drop';

/**
 * The media database browser. Search runs against the same index the public API uses, including
 * the alt and caption text of all six locales, so a photo is found by what it shows; the quick
 * filters are the maintenance backlog.
 */

interface Payload {
  revision: string;
  total: number;
  images: MediaRow[];
  stats: MediaStats;
  vocabulary: Vocabulary;
}

/** The open pull request every save joins — see /api/admin/media/session. */
interface SessionInfo {
  /** Null while the branch exists but no pull request has been opened for it. */
  number: number | null;
  url: string | null;
  branch: string;
  title: string | null;
  draft: boolean;
  changes: number;
  /** The session's log — one line per change, oldest first. */
  log: string[];
  /** The files the branch actually touches. Empty until a PR exists. */
  files: { path: string; status: string; additions: number; deletions: number }[];
}

/** A file dropped on a grid tile, waiting for the one Save that sends them all. */
interface StagedFile {
  file: File;
  url: string;
}

type QuickFilter = 'review' | 'unlicensed' | 'unassigned' | 'lowres' | 'nofocus' | 'noalt';

/**
 * The maintenance backlog as a row of chips. Each id is the query parameter, so a new one needs a
 * matching branch in `/api/admin/media`. `review` sits first because somebody is waiting on it:
 * photos shot in a park this morning, with no alt text, caption or tags yet.
 */
const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'review', label: 'Zu prüfen' },
  { id: 'unlicensed', label: 'Rechte unklar' },
  { id: 'unassigned', label: 'Ohne Park' },
  { id: 'lowres', label: 'Niedrig aufgelöst' },
  { id: 'nofocus', label: 'Ohne Fokuspunkt' },
  { id: 'noalt', label: 'Ohne Alt-Text' },
];

export default function MediaAdminPage() {
  // Links from the park editor (`?park=…&ride=…`), the entity media panel (`?id=…`) and the
  // contribution moderator (`?image=…`) seed the state once. After that the filters are ordinary
  // state, because this browser is a workspace, not a set of addressable views.
  const params = useSearchParams();

  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [park, setPark] = useState(() => params.get('park') ?? '');
  const [tag, setTag] = useState(() => params.get('tag') ?? '');
  // Only ever arrives by link — the photo-coverage panel narrows to one ride.
  // Shown as a removable chip below, because a filter nobody can see is a
  // browser that looks empty for no reason.
  const [ride, setRide] = useState(() => params.get('ride') ?? '');
  // Set only by the folder rail; `searchMedia` matches sub-collections too.
  const [collection, setCollection] = useState(() => params.get('collection') ?? '');
  const [quick, setQuick] = useState<QuickFilter | null>(null);

  const [detailId, setDetailId] = useState<string | null>(
    () => params.get('id') ?? params.get('image') ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  // The running session's pull request, resolved on the server from the open PR
  // carrying the `media/session-` branch prefix — never from browser state, so a
  // reload or a second tab sees the same one.
  const [session, setSession] = useState<SessionInfo | null>(null);
  /** Next save starts a fresh pull request instead of joining the open one. */
  const [newSession, setNewSession] = useState(false);
  const [sessionTick, setSessionTick] = useState(0);
  /** Whether the session bar is expanded to list what is already in the PR. */
  const [showSession, setShowSession] = useState(false);

  // Files dropped on grid tiles, keyed by image id. Staged like the editor's
  // replace bar: nothing is written until "Save", which sends every tile in ONE
  // commit, so swapping twelve low-res photos is one entry in the session's PR.
  const [staged, setStaged] = useState<Record<string, StagedFile>>({});
  /** The tile a file is currently dragged over. */
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [savingStaged, setSavingStaged] = useState(false);
  // Object URLs are revoked when a tile's file is replaced, discarded or the page
  // goes away; minting one per render would leak one per frame of the preview.
  const stagedRef = useRef(staged);
  useEffect(() => {
    stagedRef.current = staged;
  }, [staged]);
  useEffect(
    () => () => Object.values(stagedRef.current).forEach((entry) => URL.revokeObjectURL(entry.url)),
    []
  );

  const query = useMemo(() => {
    const search = new URLSearchParams();
    if (q.trim()) search.set('q', q.trim());
    if (park) search.set('park', park);
    if (ride) search.set('ride', ride);
    if (collection) search.set('collection', collection);
    if (tag) search.set('tag', tag);
    if (quick) search.set(quick, '1');
    return search.toString();
  }, [q, park, ride, collection, tag, quick]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/media?${query}`, {});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData(await response.json());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  // Re-read after every save; `sessionTick` is what a save bumps to ask for it.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/media/session', {})
      .then((r) => r.json())
      .then((data: { session?: SessionInfo | null; tokenMissing?: boolean }) => {
        if (cancelled) return;
        setSession(data.session ?? null);
        setTokenMissing(Boolean(data.tokenMissing));
      })
      // A banner that cannot be drawn is not worth an error — saving reports the
      // real problem, with the reason.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionTick]);

  /** A save landed. The editor keeps its own confirmation; this refreshes around it. */
  const onCommitted = (pullRequestUrl: string | null, joined?: boolean) => {
    setNewSession(false);
    setSessionTick((t) => t + 1);
    setNotice(
      pullRequestUrl
        ? joined
          ? `Added to the open pull request: ${pullRequestUrl}`
          : `Pull request opened: ${pullRequestUrl}`
        : 'Committed to a branch — open the pull request manually.'
    );
  };

  /** The upload dialog reports once for the whole batch and closes itself. */
  const onUploadDone = (pullRequestUrl: string | null, joined?: boolean) => {
    setUploading(false);
    onCommitted(pullRequestUrl, joined);
  };

  /** Take a drop on one tile and stage it, or say why it was refused. */
  const stageOnTile = (id: string, files: FileList | File[] | null) => {
    if (savingStaged) return;
    const picked = pickReplacement(files);
    if (!picked) return;
    if ('error' in picked) {
      setDropError(picked.error);
      return;
    }
    setDropError(null);
    const previous = stagedRef.current[id];
    if (previous) URL.revokeObjectURL(previous.url);
    const url = URL.createObjectURL(picked.file);
    setStaged((current) => ({ ...current, [id]: { file: picked.file, url } }));
  };

  const discardStaged = () => {
    Object.values(staged).forEach((entry) => URL.revokeObjectURL(entry.url));
    setStaged({});
    setDropError(null);
  };

  /**
   * One `replace` request per staged tile, in order, since one body would exceed the host's request
   * limit (`upload-transport.ts`). No sidecar payload, so alt texts, focus and tags stay. A tile
   * leaves staging once its request lands, so a failure keeps exactly the unsent tiles.
   */
  const saveStaged = async () => {
    const entries = Object.entries(staged);
    if (entries.length === 0) return;
    setSavingStaged(true);
    setDropError(null);
    let last: { pullRequest: string | null; joinedSession?: boolean } | null = null;
    try {
      for (const [index, [id, { file: original, url }]] of entries.entries()) {
        const { file } = await fitForCommit(original);
        const contentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
          reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
          reader.readAsDataURL(file);
        });
        const response = await fetch('/api/admin/media/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `media: replace ${id}`,
            // Only the first request may open a new PR; the rest join it.
            newSession: newSession && index === 0,
            operations: [{ op: 'replace', id, ext: replacementExt(file), contentBase64 }],
          }),
        });
        const result = await response.json();
        if (!response.ok && response.status !== 207) {
          throw new Error(`${id}: ${result.error ?? 'Save failed'}`);
        }
        last = { pullRequest: result.pullRequest ?? null, joinedSession: result.joinedSession };
        URL.revokeObjectURL(url);
        setStaged((current) => {
          const { [id]: sent, ...rest } = current;
          void sent;
          return rest;
        });
      }
    } catch (e) {
      setDropError((e as Error).message);
    } finally {
      setSavingStaged(false);
      if (last) {
        onCommitted(last.pullRequest, last.joinedSession);
        void load();
      }
    }
  };

  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading the media database…" />;

  const { stats, vocabulary, images, total } = data;

  const onFolder = (view: FolderView, value: string) => {
    if (view === 'collection') setCollection(value);
    else if (view === 'park') setPark(value);
    else setTag(value);
  };

  return (
    <AdminPage width="wide">
      <div className="space-y-6">
        {notice && (
          <div className="border-border bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span className="break-all">{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs underline">
              dismiss
            </button>
          </div>
        )}

        {/* Which pull request the next save lands in, what is already in it, and the way out;
            without it a save is a coin toss between joining and opening one. */}
        {tokenMissing ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              No GitHub token configured — editing works, saving does not. Set{' '}
              <code className="font-mono text-xs">BLOG_EDITOR_GITHUB_TOKEN</code> on the deployment:
              a fine-grained PAT for this repository with{' '}
              <strong>Contents: read &amp; write</strong> and{' '}
              <strong>Pull requests: read &amp; write</strong>.
            </span>
          </div>
        ) : session && !newSession ? (
          <div className="border-border bg-muted/40 rounded-lg border px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <GitPullRequest className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                Session running —{' '}
                {session.url ? (
                  <a href={session.url} target="_blank" rel="noreferrer" className="underline">
                    #{session.number}
                  </a>
                ) : (
                  <code className="font-mono text-xs">{session.branch}</code>
                )}{' '}
                <span className="text-muted-foreground">
                  ({session.changes} change{session.changes === 1 ? '' : 's'} so far). The next save
                  joins it.
                </span>
              </span>
              {(session.log.length > 0 || session.files.length > 0) && (
                <button
                  type="button"
                  onClick={() => setShowSession((v) => !v)}
                  className="border-border hover:bg-muted rounded-md border px-2 py-1 text-xs"
                >
                  {showSession ? 'Hide' : 'Show'} what changed
                </button>
              )}
              <button
                type="button"
                onClick={() => setNewSession(true)}
                className="border-border hover:bg-muted ml-auto rounded-md border px-2 py-1 text-xs"
              >
                Start a new pull request
              </button>
            </div>

            {/* The log says what each save meant to do; the file list is what git recorded. */}
            {showSession && (
              <div className="border-border/70 mt-2 grid gap-3 border-t pt-2 text-xs sm:grid-cols-2">
                {session.log.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">Saves in this session</p>
                    <ul className="space-y-0.5">
                      {session.log.map((line, i) => (
                        <li key={i} className="text-muted-foreground break-words">
                          {line.replace(/`/g, '')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {session.files.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">
                      Files touched ({session.files.length})
                    </p>
                    <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                      {session.files.map((file) => (
                        <li key={file.path} className="flex items-baseline gap-1.5">
                          <span
                            className={cn(
                              'w-12 shrink-0 text-[10px] uppercase',
                              file.status === 'added'
                                ? 'text-emerald-500'
                                : file.status === 'removed'
                                  ? 'text-red-500'
                                  : 'text-muted-foreground'
                            )}
                          >
                            {file.status}
                          </span>
                          <span className="text-muted-foreground truncate font-mono">
                            {file.path.replace(/^public\/media\//, '')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : newSession ? (
          <div className="border-border bg-muted/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm">
            <GitPullRequest className="h-4 w-4 shrink-0" />
            <span className="text-muted-foreground">
              The next save opens a NEW pull request instead of joining
              {session ? ` #${session.number}` : ' the open one'}.
            </span>
            <button
              type="button"
              onClick={() => setNewSession(false)}
              className="border-border hover:bg-muted ml-auto rounded-md border px-2 py-1 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <StatTile label="Images" value={String(stats.total)} />
          <StatTile label="Collections" value={String(stats.collections)} />
          <StatTile label="Parks" value={String(stats.parks)} />
          <StatTile label="With GPS" value={String(stats.withGps)} />
          <StatTile label="Rights unknown" value={String(stats.unlicensed)} />
          <StatTile label="Low resolution" value={String(stats.lowRes)} />
        </div>

        <Section title="Browse" icon={ImageIcon}>
          <div className="lg:flex lg:items-start lg:gap-4">
            <FolderRail
              vocabulary={vocabulary}
              total={stats.total}
              active={{ collection, park, tag }}
              onSelect={onFolder}
            />
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search park, ride, tag, caption — in any language"
                    className="border-border bg-background focus:border-foreground w-full rounded-md border py-1.5 pr-2 pl-8 text-sm outline-none"
                  />
                </div>

                <select
                  value={park}
                  onChange={(e) => setPark(e.target.value)}
                  className="border-border bg-background rounded-md border px-2 py-1.5 text-sm"
                >
                  <option value="">All parks</option>
                  {vocabulary.parks.map((p) => (
                    <option key={p.park} value={p.park}>
                      {p.park} ({p.count})
                    </option>
                  ))}
                </select>

                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="border-border bg-background rounded-md border px-2 py-1.5 text-sm"
                >
                  <option value="">All tags</option>
                  {vocabulary.tags.map((t) => (
                    <option key={t.tag} value={t.tag}>
                      {t.tag} ({t.count})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setUploading(true)}
                  className="bg-foreground text-background flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add images
                </button>
              </div>

              {(ride || collection) && (
                // Arrived by link and otherwise invisible: without this the browser
                // shows one photo of a hundred and looks broken.
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  {collection && (
                    // The rail highlights it too, but the rail is collapsible and
                    // on a phone it is a select scrolled out of view.
                    <span className="border-primary/40 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5">
                      Ordner: {collection}
                      <button
                        type="button"
                        onClick={() => setCollection('')}
                        className="hover:text-foreground"
                        aria-label="Ordner-Filter entfernen"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {ride && (
                    <span className="border-primary/40 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5">
                      Ride: {ride}
                      <button
                        type="button"
                        onClick={() => setRide('')}
                        className="hover:text-foreground"
                        aria-label="Ride-Filter entfernen"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}

              <div className="mb-4 flex flex-wrap gap-1">
                {QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setQuick(quick === filter.id ? null : filter.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                      quick === filter.id
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border text-muted-foreground hover:border-foreground'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <p className="text-muted-foreground mb-3 text-xs">
                {loading ? 'Searching…' : `${total} image${total === 1 ? '' : 's'}`}
              </p>

              {(Object.keys(staged).length > 0 || dropError) && (
                // Staged tiles are the only unsaved state on this page, so they get
                // the only bar with a Save in it.
                <div className="border-border bg-background/95 sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 text-sm backdrop-blur">
                  {dropError ? (
                    <span className="flex items-start gap-1.5 text-xs text-amber-500">
                      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                      {dropError}
                    </span>
                  ) : null}
                  {dropError && Object.keys(staged).length === 0 && (
                    <button
                      type="button"
                      onClick={() => setDropError(null)}
                      className="border-border hover:bg-muted ml-auto rounded-md border px-2 py-1 text-xs"
                    >
                      Dismiss
                    </button>
                  )}
                  {Object.keys(staged).length > 0 && (
                    <>
                      <span className="text-xs">
                        {Object.keys(staged).length} replacement
                        {Object.keys(staged).length === 1 ? '' : 's'} not saved
                      </span>
                      <button
                        type="button"
                        onClick={saveStaged}
                        disabled={savingStaged}
                        className="bg-foreground text-background ml-auto rounded-md px-3 py-1 text-xs font-medium disabled:opacity-50"
                      >
                        {savingStaged ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={discardStaged}
                        disabled={savingStaged}
                        className="border-border hover:bg-muted rounded-md border px-2 py-1 text-xs"
                      >
                        Discard
                      </button>
                    </>
                  )}
                </div>
              )}

              {images.length === 0 ? (
                <EmptyState title="Nothing matches those filters." />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setDetailId(image.id)}
                      // Only a dragged FILE is a replacement; text or a link dragged
                      // over the grid must not light a tile up.
                      onDragOver={(e) => {
                        if (!e.dataTransfer.types.includes('Files')) return;
                        e.preventDefault();
                        setDropTarget(image.id);
                      }}
                      onDragLeave={(e) => {
                        // Crossing the image or the labels inside the tile fires
                        // dragleave too; only leaving the tile itself counts.
                        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                        setDropTarget((current) => (current === image.id ? null : current));
                      }}
                      onDrop={(e) => {
                        if (!e.dataTransfer.types.includes('Files')) return;
                        e.preventDefault();
                        setDropTarget(null);
                        stageOnTile(image.id, e.dataTransfer.files);
                      }}
                      className={cn(
                        'group overflow-hidden rounded-lg border text-left transition-colors',
                        dropTarget === image.id
                          ? 'border-primary ring-primary/40 bg-primary/10 ring-2'
                          : staged[image.id]
                            ? 'border-amber-500'
                            : 'border-border hover:border-foreground'
                      )}
                    >
                      <div className="bg-muted relative aspect-[4/3]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin grid, the optimizer adds nothing here */}
                        <img
                          src={staged[image.id]?.url ?? image.src}
                          alt={image.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          style={{
                            objectPosition: image.focus
                              ? `${image.focus.x * 100}% ${image.focus.y * 100}%`
                              : '50% 50%',
                          }}
                        />
                        {dropTarget === image.id && (
                          <span className="bg-primary/80 text-primary-foreground absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-medium">
                            <Upload className="h-4 w-4" />
                            Drop to replace
                          </span>
                        )}
                        {staged[image.id] && dropTarget !== image.id && (
                          <span className="absolute inset-x-1 top-1 rounded bg-amber-500/95 px-1.5 py-0.5 text-[10px] font-medium text-black">
                            <span className="truncate">New file · not saved</span>
                          </span>
                        )}
                        <div className="absolute top-1 right-1 flex gap-1">
                          {image.focus && (
                            <span
                              title="Focal point set"
                              className="bg-background/80 rounded p-0.5"
                            >
                              <Crosshair className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        {/* Says what is wrong and what a click does about it: an icon alone
                            gave no clue the fix exists. */}
                        {image.lowRes && (
                          <span className="absolute inset-x-1 bottom-1 flex items-center gap-1 rounded bg-amber-500/95 px-1.5 py-0.5 text-[10px] font-medium text-black">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {image.width}×{image.height} · replace
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-medium">{image.title}</p>
                        <p className="text-muted-foreground truncate text-[11px]">
                          {image.park ?? 'no park'}
                          {image.ride ? ` · ${image.ride}` : ''}
                        </p>
                        <p className="text-muted-foreground truncate font-mono text-[10px]">
                          {image.id}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {detailId && (
          <MediaDetail
            key={detailId}
            id={detailId}
            vocabulary={vocabulary}
            onClose={() => setDetailId(null)}
            newSession={newSession}
            onCommitted={onCommitted}
          />
        )}
        {uploading && (
          <MediaUpload
            vocabulary={vocabulary}
            newSession={newSession}
            onClose={() => setUploading(false)}
            onDone={onUploadDone}
          />
        )}
      </div>
    </AdminPage>
  );
}
