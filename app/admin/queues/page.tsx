'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ListChecks, Loader2 } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { adminFetch } from '../_lib/api';
import { Section } from '../_lib/ui';
import type { QueueEntry, QueueStatusResponse } from '@/lib/api/admin';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  type ChipTone,
} from '../_ui/primitives';

/**
 * A failed job with the message and stack Bull keeps in Redis, because a failure count alone says
 * something is wrong and nothing about what.
 */
interface QueueFailure {
  id: string | number;
  name: string;
  attemptsMade: number;
  failedReason: string;
  stack: string[];
}

type QueueState = 'active' | 'pending' | 'failed' | 'delayed';

const QUEUE_TONES: Record<QueueState, ChipTone> = {
  active: 'primary',
  pending: 'muted',
  failed: 'danger',
  delayed: 'warning',
};

function QueueBadge({ count, variant }: { count: number; variant: QueueState }) {
  if (count === 0) return null;
  return (
    <Chip tone={QUEUE_TONES[variant]} className="font-mono tabular-nums">
      {count} {variant}
    </Chip>
  );
}

function QueueRow({ q }: { q: QueueEntry }) {
  const hasActivity = q.active + q.pending + q.failed + q.delayed > 0;
  const [open, setOpen] = useState(false);
  const [failures, setFailures] = useState<QueueFailure[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || failures || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch<{ failures?: QueueFailure[]; error?: string }>(
        `/api/admin/queue-failures?queue=${encodeURIComponent(q.name)}&limit=5`
      );
      if (result.error) setError(result.error);
      else setFailures(result.failures ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlerursachen nicht abrufbar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-lg border text-sm transition-colors ${hasActivity ? 'border-border/60 bg-card' : 'border-border/30 bg-card/40'}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span
          className={`font-mono text-xs ${hasActivity ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {q.name}
        </span>
        <div className="flex items-center gap-1">
          {hasActivity ? (
            <>
              <QueueBadge count={q.active} variant="active" />
              <QueueBadge count={q.pending} variant="pending" />
              <QueueBadge count={q.failed} variant="failed" />
              <QueueBadge count={q.delayed} variant="delayed" />
            </>
          ) : (
            <span className="text-muted-foreground text-xs">idle</span>
          )}
          {q.failed > 0 && (
            <button
              onClick={toggle}
              aria-expanded={open}
              className="text-muted-foreground hover:text-foreground ml-1 inline-flex items-center gap-1 text-xs"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Warum
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-border/40 space-y-2 border-t px-3 py-2">
          {loading && (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Wird geladen…
            </p>
          )}
          {error && <p className="text-destructive text-xs">{error}</p>}
          {failures?.length === 0 && (
            <p className="text-muted-foreground text-xs">
              Die Queue meldet Fehlschläge, hält aber keinen mehr vor.
            </p>
          )}
          {failures?.map((failure) => (
            <div key={String(failure.id)} className="space-y-1">
              <p className="text-xs font-medium">
                {failure.name}
                <span className="text-muted-foreground"> · {failure.attemptsMade} Versuche</span>
              </p>
              <p className="text-destructive font-mono text-xs break-words">
                {failure.failedReason}
              </p>
              {failure.stack.length > 0 && (
                <pre className="text-muted-foreground bg-muted/40 overflow-x-auto rounded-md p-2 text-[11px] leading-snug">
                  {failure.stack.slice(0, 4).join('\n')}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QueuesPage() {
  const { data, error } = useAdminFetch<QueueStatusResponse>('/api/admin/queue-status');

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading queues…" />;

  return (
    <AdminPage width="wide">
      <Section icon={ListChecks} title="Queues">
        {data.queues.length === 0 ? (
          <EmptyState title="No queues reported." />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.queues.map((q) => (
              <QueueRow key={q.name} q={q} />
            ))}
          </div>
        )}
      </Section>
    </AdminPage>
  );
}
