'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  ExternalLink,
  GitPullRequest,
  ImageIcon,
  ImagePlus,
  Loader2,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdmin, useAdminFetch } from '../_lib/admin-context';
import { EmptyPanel, ErrorPanel, LoadingPanel, Section } from '../_lib/ui';
import type { SubmissionRecord, SubmissionStatus } from '@/lib/contribute/types';
import { AdoptIntoMedia } from './_components/adopt-into-media';
import { AdminPage } from '../_ui/primitives';
import { useToast } from '../_ui/toast';

interface ListResponse {
  submissions: SubmissionRecord[];
  counts: Partial<Record<SubmissionStatus, number>>;
  total: number;
  inventory: { metaBlobs: number; imageBlobs: number } | null;
}

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const FILTERS: { key: 'all' | SubmissionStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function ContributionsPage() {
  const { triggerRefresh } = useAdmin();
  const { data, error } = useAdminFetch<ListResponse>('/api/admin/contributions');
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');
  const [purging, setPurging] = useState(false);

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel label="Loading contributions…" />;

  const visible =
    filter === 'all' ? data.submissions : data.submissions.filter((s) => s.status === filter);

  const referencedImages = data.submissions.reduce((n, s) => n + s.images.length, 0);
  const orphans = data.inventory ? Math.max(0, data.inventory.imageBlobs - referencedImages) : 0;

  const purgeOrphans = async () => {
    if (!confirm(`Delete ${orphans} orphaned image file(s) from the store?`)) return;
    setPurging(true);
    try {
      const res = await fetch('/api/admin/contributions/orphans', {
        method: 'DELETE',
      });
      if (res.ok) triggerRefresh();
    } finally {
      setPurging(false);
    }
  };

  return (
    <AdminPage width="wide">
      <Section
        icon={ImageIcon}
        title="User photo contributions"
        action={
          <div className="flex gap-1">
            {FILTERS.map((f) => {
              const count = f.key === 'all' ? data.total : (data.counts[f.key] ?? 0);
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    filter === f.key
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label} <span className="tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        }
      >
        {orphans > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="flex-1">
              {orphans} orphaned image file(s) in the store with no submission record — left over
              from uploads that failed before metadata was saved.
            </span>
            <button
              onClick={purgeOrphans}
              disabled={purging}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 px-2.5 py-1 text-xs font-medium hover:bg-amber-500/15 disabled:opacity-50"
            >
              {purging ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Purge orphans
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyPanel label="No contributions in this view." />
        ) : (
          <div className="space-y-4">
            {visible.map((s) => (
              <SubmissionCard key={s.id} submission={s} />
            ))}
          </div>
        )}
      </Section>
    </AdminPage>
  );
}

function SubmissionCard({ submission }: { submission: SubmissionRecord }) {
  const { triggerRefresh } = useAdmin();
  const toast = useToast();
  const [caption, setCaption] = useState(submission.caption);
  const [credit, setCredit] = useState(submission.credit);
  const [busy, setBusy] = useState<null | string>(null);
  const dirty = caption !== submission.caption || credit !== submission.credit;

  // Which photos go into the media database. Every photo not moved yet starts
  // ticked — one photo, one click — and unticking is how a blurred one is left
  // behind. Kept as the keys somebody chose, and narrowed to what is still
  // movable at render, so a photo that has just landed drops out by itself.
  const [selected, setSelected] = useState(
    () => new Set(submission.images.filter((img) => !img.adopted).map((img) => img.key))
  );
  const [adopting, setAdopting] = useState(false);
  const movable = submission.images.filter((img) => !img.adopted);
  const chosen = movable.filter((img) => selected.has(img.key)).map((img) => img.key);

  const toggle = (key: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  async function onAdopted(
    pullRequest: string | null,
    landed: Array<{ key: string; mediaId: string }>
  ) {
    setAdopting(false);
    if (!landed.length) return;
    // Moving a photo into the database is the strongest approval there is, so
    // it says so; and the caption and credit go with it, because those are the
    // values that were just written into the sidecars.
    const res = await fetch(`/api/admin/contributions/${submission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        caption,
        credit,
        adopted: landed.map((photo) => ({ ...photo, pullRequest })),
      }),
    });
    triggerRefresh();
    toast.push({
      title:
        landed.length === 1
          ? 'Foto in der Mediengalerie'
          : `${landed.length} Fotos in der Mediengalerie`,
      description: res.ok
        ? 'Liegt im Media-Pull-Request und erscheint auf der Seite, sobald er gemergt ist.'
        : 'Committet, aber die Einsendung konnte das nicht vermerken. Bitte neu laden.',
      tone: res.ok ? 'success' : 'error',
      ...(pullRequest
        ? {
            action: {
              label: 'Pull Request öffnen',
              icon: GitPullRequest,
              onClick: () => {
                window.open(pullRequest, '_blank', 'noopener');
              },
            },
          }
        : {}),
    });
  }

  // No credential in the URL: the session cookie goes with the image request by itself.
  const imgSrc = (url: string) => url;
  const downloadSrc = (url: string, name: string) =>
    `${imgSrc(url)}&download=1&name=${encodeURIComponent(name)}`;

  async function mutate(action: string, init: RequestInit) {
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/contributions/${submission.id}`, init);
      if (res.ok) triggerRefresh();
    } finally {
      setBusy(null);
    }
  }

  const setStatus = (status: SubmissionStatus) =>
    mutate(status, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

  const saveText = () =>
    mutate('save', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, credit }),
    });

  const remove = () => {
    if (!confirm('Delete this submission and its photos? This cannot be undone.')) return;
    mutate('delete', { method: 'DELETE' });
  };

  return (
    <div className="border-border/60 bg-card/40 rounded-xl border p-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="grid grid-cols-3 gap-2 md:w-72 md:shrink-0">
          {submission.images.map((img) => (
            <figure
              key={img.key}
              className={cn(
                'bg-muted/40 group/thumb relative aspect-square overflow-hidden rounded-lg border',
                !img.adopted && selected.has(img.key) && 'ring-primary ring-2'
              )}
            >
              <a
                href={imgSrc(img.url)}
                target="_blank"
                rel="noreferrer"
                className="block size-full"
                title={`${img.originalName} · ${(img.size / 1024 / 1024).toFixed(1)} MB`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- streamed via our admin route, not a project asset */}
                <img
                  src={imgSrc(img.url)}
                  alt={img.originalName}
                  className="size-full object-cover"
                />
              </a>
              <a
                href={downloadSrc(img.url, img.originalName)}
                download={img.originalName}
                title="Download original"
                className="bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground absolute top-1 right-1 flex size-7 items-center justify-center rounded-md opacity-0 shadow-sm backdrop-blur-sm transition-all group-hover/thumb:opacity-100"
              >
                <Download className="size-3.5" />
              </a>
              {img.adopted ? (
                <a
                  href={img.adopted.pullRequest ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  title={`${img.adopted.mediaId} · übernommen ${new Date(img.adopted.at).toLocaleDateString('de-DE')}`}
                  className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
                >
                  <Check className="size-3" />
                  In Galerie
                </a>
              ) : (
                submission.status !== 'rejected' && (
                  // Always visible, not on hover: picking is the whole job of
                  // this card, and a tablet has no hover to reveal it with.
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected.has(img.key)}
                    aria-label={`${img.originalName} übernehmen`}
                    onClick={() => toggle(img.key)}
                    className={cn(
                      'absolute top-1 left-1 flex size-6 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-colors',
                      selected.has(img.key)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background/80 hover:text-muted-foreground text-transparent'
                    )}
                  >
                    <Check className="size-3.5" />
                  </button>
                )
              )}
            </figure>
          ))}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
                STATUS_STYLES[submission.status]
              )}
            >
              {submission.status}
            </span>
            <span className="border-border/60 text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize">
              {submission.entity.type}
            </span>
            <span className="font-semibold">{submission.entity.name}</span>
            {submission.entity.url && (
              <a
                href={submission.entity.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
              >
                view <ExternalLink className="size-3" />
              </a>
            )}
            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
              {new Date(submission.createdAt).toLocaleString('en-GB')}
            </span>
          </div>

          <div className="text-muted-foreground text-xs">
            {submission.images.length} photo(s)
            {submission.entity.parentParkName ? ` · in ${submission.entity.parentParkName}` : ''}
            {submission.entity.country ? ` · ${submission.entity.country}` : ''}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-muted-foreground text-xs">Caption</span>
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} />
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground text-xs">Credit</span>
              <Input value={credit} onChange={(e) => setCredit(e.target.value)} maxLength={120} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <Button size="sm" variant="secondary" onClick={saveText} disabled={busy !== null}>
                {busy === 'save' ? <Loader2 className="size-3.5 animate-spin" /> : null} Save text
              </Button>
            )}
            {submission.status !== 'approved' && (
              <Button
                size="sm"
                onClick={() => setStatus('approved')}
                disabled={busy !== null}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90"
              >
                {busy === 'approved' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Approve
              </Button>
            )}
            {submission.status !== 'rejected' && movable.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAdopting(true)}
                disabled={busy !== null || chosen.length === 0}
                className="gap-1.5"
              >
                <ImagePlus className="size-3.5" />
                {chosen.length === 0
                  ? 'Foto wählen'
                  : chosen.length === 1
                    ? '1 Foto in die Mediengalerie'
                    : `${chosen.length} Fotos in die Mediengalerie`}
              </Button>
            )}
            {submission.status !== 'rejected' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus('rejected')}
                disabled={busy !== null}
                className="gap-1.5"
              >
                {busy === 'rejected' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                Reject
              </Button>
            )}
            {submission.status !== 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStatus('pending')}
                disabled={busy !== null}
                className="gap-1.5"
              >
                <Undo2 className="size-3.5" /> Reset
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={remove}
              disabled={busy !== null}
              className="text-destructive hover:text-destructive ml-auto gap-1.5"
            >
              {busy === 'delete' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </div>

      {adopting && (
        <AdoptIntoMedia
          submission={submission}
          keys={chosen}
          caption={caption}
          credit={credit}
          onClose={() => setAdopting(false)}
          onAdopted={onAdopted}
        />
      )}
    </div>
  );
}
