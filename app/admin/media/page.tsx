'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Crosshair, GitPullRequest, ImageIcon, Plus, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ADMIN_PASS_HEADER, useAdmin } from '../_lib/admin-context';
import { EmptyPanel, ErrorPanel, LoadingPanel, Section, StatCard } from '../_lib/ui';
import { MediaDetail } from './_components/media-detail';
import { MediaUpload } from './_components/media-upload';
import type { MediaRow, MediaStats, Vocabulary } from './_lib/types';

/**
 * The media database browser.
 *
 * Search runs against the same index the public API uses, so what is findable
 * here is exactly what is findable everywhere else — including all six locales of
 * alt and caption text, which is how you find a photo by what it *shows* rather
 * than by what it is called.
 *
 * The quick filters along the top are the maintenance backlog made visible:
 * images with unestablished rights, images with no park, sources below the
 * resolution target, and images nobody has framed yet.
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
  number: number;
  url: string;
  branch: string;
  title: string;
  draft: boolean;
  changes: number;
}

type QuickFilter = 'unlicensed' | 'unassigned' | 'lowres' | 'nofocus' | 'noalt';

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'unlicensed', label: 'Rights unknown' },
  { id: 'unassigned', label: 'No park' },
  { id: 'lowres', label: 'Low resolution' },
  { id: 'nofocus', label: 'No focal point' },
  { id: 'noalt', label: 'No alt text' },
];

export default function MediaAdminPage() {
  const { pass } = useAdmin();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [park, setPark] = useState('');
  const [tag, setTag] = useState('');
  const [quick, setQuick] = useState<QuickFilter | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
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

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (park) params.set('park', park);
    if (tag) params.set('tag', tag);
    if (quick) params.set(quick, '1');
    return params.toString();
  }, [q, park, tag, quick]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/media?${query}`, {
        headers: { [ADMIN_PASS_HEADER]: pass },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setData(await response.json());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query, pass]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  // Re-read after every save; `sessionTick` is what a save bumps to ask for it.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/media/session', { headers: { [ADMIN_PASS_HEADER]: pass } })
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
  }, [pass, sessionTick]);

  const onSaved = (pullRequestUrl: string | null, joined?: boolean) => {
    setDetailId(null);
    setUploading(false);
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

  if (error && !data) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel label="Loading the media database…" />;

  const { stats, vocabulary, images, total } = data;

  return (
    <div className="space-y-6">
      {notice && (
        <div className="border-border bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
          <span className="break-all">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline">
            dismiss
          </button>
        </div>
      )}

      {/* Session bar — which pull request the next save lands in.
          Everything edited here goes into ONE pull request until it is merged or
          closed, so this says which one, how much is already in it, and offers the
          way out. Without it, "save" is a coin toss between joining and opening. */}
      {tokenMissing ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No GitHub token configured — editing works, saving does not. Set{' '}
            <code className="font-mono text-xs">BLOG_EDITOR_GITHUB_TOKEN</code> on the deployment: a
            fine-grained PAT for this repository with <strong>Contents: read &amp; write</strong>{' '}
            and <strong>Pull requests: read &amp; write</strong>.
          </span>
        </div>
      ) : session && !newSession ? (
        <div className="border-border bg-muted/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm">
          <GitPullRequest className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            Session running —{' '}
            <a href={session.url} target="_blank" rel="noreferrer" className="underline">
              #{session.number}
            </a>{' '}
            <span className="text-muted-foreground">
              ({session.changes} change{session.changes === 1 ? '' : 's'} so far). The next save
              joins it.
            </span>
          </span>
          <button
            type="button"
            onClick={() => setNewSession(true)}
            className="border-border hover:bg-muted ml-auto rounded-md border px-2 py-1 text-xs"
          >
            Start a new pull request
          </button>
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
        <StatCard label="Images" value={String(stats.total)} />
        <StatCard label="Collections" value={String(stats.collections)} />
        <StatCard label="Parks" value={String(stats.parks)} />
        <StatCard label="With GPS" value={String(stats.withGps)} />
        <StatCard label="Rights unknown" value={String(stats.unlicensed)} />
        <StatCard label="Low resolution" value={String(stats.lowRes)} />
      </div>

      <Section title="Browse" icon={ImageIcon}>
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

        {images.length === 0 ? (
          <EmptyPanel label="Nothing matches those filters." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setDetailId(image.id)}
                className="border-border hover:border-foreground group overflow-hidden rounded-lg border text-left transition-colors"
              >
                <div className="bg-muted relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin grid, the optimizer adds nothing here */}
                  <img
                    src={image.src}
                    alt={image.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: image.focus
                        ? `${image.focus.x * 100}% ${image.focus.y * 100}%`
                        : '50% 50%',
                    }}
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    {image.focus && (
                      <span title="Focal point set" className="bg-background/80 rounded p-0.5">
                        <Crosshair className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  {/* Low resolution is a to-do, not a footnote — it says what is
                      wrong and what the click will let you do about it, because an
                      icon-only warning here left no clue that the fix exists. */}
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
                  <p className="text-muted-foreground truncate font-mono text-[10px]">{image.id}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>

      {detailId && (
        <MediaDetail
          key={detailId}
          id={detailId}
          vocabulary={vocabulary}
          onClose={() => setDetailId(null)}
          newSession={newSession}
          onSaved={onSaved}
        />
      )}
      {uploading && (
        <MediaUpload
          vocabulary={vocabulary}
          newSession={newSession}
          onClose={() => setUploading(false)}
          onDone={onSaved}
        />
      )}
    </div>
  );
}
