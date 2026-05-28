'use client';

import { ListChecks } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { EmptyPanel, ErrorPanel, LoadingPanel, Section } from '../_lib/ui';
import type { QueueEntry, QueueStatusResponse } from '@/lib/api/admin';

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
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${hasActivity ? 'border-border/60 bg-card' : 'border-border/30 bg-card/40'}`}
    >
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
      </div>
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
