'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ListChecks, Loader2 } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { adminFetch } from '../_lib/api';
import { EmptyPanel, ErrorPanel, LoadingPanel, Section } from '../_lib/ui';
import type { QueueEntry, QueueStatusResponse } from '@/lib/api/admin';

/**
 * A failure count is not a reason.
 *
 * Bull keeps the message and the stack of every failed job in Redis, and until
 * this panel the only way to read either was a terminal on the box. The count
 * beside a queue name told an operator that something is wrong and nothing
 * about what — which is the same as telling them to ask somebody with SSH.
 */
interface QueueFailure {
  id: string | number;
  name: string;
  attemptsMade: number;
  failedReason: string;
  stack: string[];
}

function QueueBadge({
  count,
  variant,
}: {
  count: number;
  variant: 'active' | 'pending' | 'failed' | 'delayed';
}) {
  if (count === 0) return null;
  const colors: Record<typeof variant, string> = {
    active: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    pending: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
    delayed: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-xs tabular-nums ${colors[variant]}`}
    >
      {count} {variant}
    </span>
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
  const { data, error } = useAdminFetch<QueueStatusResponse>('/api/admin/queue-status', true);

  if (error) return <ErrorPanel message={error} />;
  if (!data) return <LoadingPanel label="Loading queues…" />;

  return (
    <Section icon={ListChecks} title="Queues">
      {data.queues.length === 0 ? (
        <EmptyPanel label="No queues reported." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.queues.map((q) => (
            <QueueRow key={q.name} q={q} />
          ))}
        </div>
      )}
    </Section>
  );
}
