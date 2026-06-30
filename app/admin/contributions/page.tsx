'use client';

import { useState } from 'react';
import { Check, ExternalLink, ImageIcon, Loader2, Trash2, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ADMIN_PASS_HEADER, useAdmin, useAdminFetch } from '../_lib/admin-context';
import { EmptyPanel, ErrorPanel, LoadingPanel, Section } from '../_lib/ui';
import type { SubmissionRecord, SubmissionStatus } from '@/lib/contribute/types';

interface ListResponse {
  submissions: SubmissionRecord[];
  counts: Partial<Record<SubmissionStatus, number>>;
  total: number;
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
  const { data, error } = useAdminFetch<ListResponse>('/api/admin/contributions', true);
  const [filter, setFilter] = useState<'all' | SubmissionStatus>('all');

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel label="Loading contributions…" />;

  const visible =
    filter === 'all' ? data.submissions : data.submissions.filter((s) => s.status === filter);

  return (
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
  );
}

function SubmissionCard({ submission }: { submission: SubmissionRecord }) {
  const { pass, triggerRefresh } = useAdmin();
  const [caption, setCaption] = useState(submission.caption);
  const [credit, setCredit] = useState(submission.credit);
  const [busy, setBusy] = useState<null | string>(null);
  const dirty = caption !== submission.caption || credit !== submission.credit;

  const imgSrc = (url: string) =>
    /^https?:/.test(url) ? url : `${url}&pass=${encodeURIComponent(pass)}`;

  async function mutate(action: string, init: RequestInit) {
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/contributions/${submission.id}`, {
        ...init,
        headers: { [ADMIN_PASS_HEADER]: pass, ...(init.headers ?? {}) },
      });
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
        {/* Photos */}
        <div className="grid grid-cols-3 gap-2 md:w-72 md:shrink-0">
          {submission.images.map((img) => (
            <a
              key={img.key}
              href={imgSrc(img.url)}
              target="_blank"
              rel="noreferrer"
              className="bg-muted/40 relative aspect-square overflow-hidden rounded-lg border"
              title={`${img.originalName} · ${(img.size / 1024 / 1024).toFixed(1)} MB`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary blob/host URL, not a project asset */}
              <img
                src={imgSrc(img.url)}
                alt={img.originalName}
                className="size-full object-cover"
              />
            </a>
          ))}
        </div>

        {/* Details */}
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
    </div>
  );
}
