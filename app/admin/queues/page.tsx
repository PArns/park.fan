'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ListChecks, Loader2 } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { ADMIN_PATHS, adminFetch } from '../_lib/api';
import { formatAgo } from '../_lib/format';
import type { QueueEntry, QueueStatusResponse } from '@/lib/api/admin';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelHeader,
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
  /** When the job failed, ISO. */
  failedAt?: string | null;
  /** When a later run of the same job succeeded, ISO; `null` while none has. */
  succeededSince?: string | null;
}

/** The counts every row shows, in this order, with the tone a non-zero count takes. */
const COLUMNS: ReadonlyArray<{ key: string; label: string; tone: string }> = [
  { key: 'active', label: 'Aktiv', tone: 'text-primary-ink' },
  { key: 'pending', label: 'Wartend', tone: 'text-foreground' },
  { key: 'delayed', label: 'Geplant', tone: 'text-foreground' },
  { key: 'failedOpen', label: 'Fehler', tone: 'text-red-400' },
  { key: 'resolved', label: 'Aufgeholt', tone: 'text-muted-foreground' },
  { key: 'completed', label: 'Erledigt', tone: 'text-muted-foreground' },
];

/** From `md`: the queue, one column per count, the fold button. */
const ROW_GRID =
  'md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(6,minmax(0,0.8fr))_5.5rem] md:items-center md:gap-3';

/** A count in its column, quiet at zero; on a phone it carries its own label and a zero is left out. */
function CountCell({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <span
      className={`flex items-baseline gap-1.5 text-sm tabular-nums md:block md:text-right ${value === 0 ? 'max-md:hidden' : ''}`}
    >
      <span className="text-muted-foreground text-xs md:hidden">{label}</span>
      <span className={value > 0 ? tone : 'text-muted-foreground/50'}>{value}</span>
    </span>
  );
}

function QueueRow({ q }: { q: QueueEntry }) {
  const hasActivity = q.active + q.pending + q.failed + q.delayed > 0;
  // A failure a later run of the same job has made up for stays listed, but not in red.
  const openFailed = q.failedOpen ?? q.failed;
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

  const counts: Record<string, number> = {
    active: q.active,
    pending: q.pending,
    delayed: q.delayed,
    failedOpen: openFailed,
    resolved: q.failed - openFailed,
    completed: q.completed,
  };
  const tone = openFailed > 0 ? 'bg-red-500' : hasActivity ? 'bg-emerald-400' : 'bg-white/20';

  return (
    <li>
      <div
        className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 ${ROW_GRID}`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${tone}`} />
          <span
            className={`truncate font-mono text-[13px] ${hasActivity ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {q.name}
          </span>
        </span>
        <div className="col-span-2 row-start-2 flex flex-wrap gap-x-4 gap-y-1 pl-[1.125rem] md:contents">
          {COLUMNS.map((column) => (
            <CountCell
              key={column.key}
              value={counts[column.key]}
              label={column.label}
              tone={column.tone}
            />
          ))}
        </div>
        <span className="col-start-2 row-start-1 flex justify-end md:col-start-auto md:row-start-auto">
          {q.failed > 0 && (
            <button
              onClick={toggle}
              aria-expanded={open}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs hover:bg-white/[0.05]"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Warum
            </button>
          )}
        </span>
      </div>

      {open && (
        <div className="space-y-2 border-t border-white/[0.04] bg-black/15 px-4 py-3 pl-9">
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
                {failure.failedAt && (
                  <span className="text-muted-foreground" title={failure.failedAt}>
                    {' '}
                    · {formatAgo(failure.failedAt)}
                  </span>
                )}
              </p>
              {failure.succeededSince && (
                <p className="text-muted-foreground text-xs" title={failure.succeededSince}>
                  Seitdem erfolgreich, zuletzt {formatAgo(failure.succeededSince)}
                </p>
              )}
              <p
                className={`font-mono text-xs break-words ${failure.succeededSince ? 'text-muted-foreground' : 'text-destructive'}`}
              >
                {failure.failedReason}
              </p>
              {failure.stack.length > 0 && (
                <pre className="text-muted-foreground overflow-x-auto rounded-md bg-black/25 p-2 text-[11px] leading-snug">
                  {failure.stack.slice(0, 4).join('\n')}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export default function QueuesPage() {
  const { data, error } = useAdminFetch<QueueStatusResponse>(ADMIN_PATHS.queueStatus);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Queues werden geladen…" />;

  // The queues with something to look at first, failures before work, in the API's order within.
  const rank = (q: QueueEntry) =>
    (q.failedOpen ?? q.failed) > 0 ? 0 : q.active + q.pending + q.delayed > 0 ? 1 : 2;
  const queues = [...data.queues].sort((a, b) => rank(a) - rank(b));

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={ListChecks}
          title="Queues"
          hint="Bull-Jobs je Queue. Fehler sind offene Fehlschläge; einer, nach dem derselbe Job wieder lief, zählt als aufgeholt."
        />
        {queues.length === 0 ? (
          <EmptyState title="Keine Queue gemeldet." />
        ) : (
          <>
            <div
              aria-hidden="true"
              className={`text-muted-foreground hidden border-b border-white/[0.06] px-4 py-2 text-xs ${ROW_GRID}`}
            >
              <span className="pl-[1.125rem]">Queue</span>
              {COLUMNS.map((column) => (
                <span key={column.key} className="text-right">
                  {column.label}
                </span>
              ))}
              <span />
            </div>
            <ul className="divide-y divide-white/[0.05]">
              {queues.map((q) => (
                <QueueRow key={q.name} q={q} />
              ))}
            </ul>
          </>
        )}
      </Panel>
    </AdminPage>
  );
}
