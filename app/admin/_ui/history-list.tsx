'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { ExternalLink, Loader2, Undo2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminFetch, useInvalidateAdmin } from '../_lib/api';
import type { AuditEntry } from '../_lib/types';
import { Chip, EmptyState } from './primitives';
import { useToast } from './toast';

/**
 * What has been changed here, and how to put it back.
 *
 * The undo is the reason this is a component and not a table: a curated value
 * is a claim about the world, and the useful question about one is usually not
 * "what does it say" but "who decided that, when, and on what evidence". An
 * audit list that cannot answer the fourth question — "and can I take it back"
 * — leaves the first three as trivia.
 *
 * Only curation entries can be undone. A job trigger has no previous state to
 * restore, and offering an undo that quietly does nothing is worse than not
 * offering one.
 */

const ACTION_LABELS: Record<string, string> = {
  'attraction.curate': 'Fahrgeschäft kuratiert',
  'park.curate': 'Park kuratiert',
  'park.season.create': 'Saison angelegt',
  'park.season.update': 'Saison geändert',
  'park.season.delete': 'Saison gelöscht',
  'ride-profile.write': 'Ride-Profil geschrieben',
  'ride-profile.delete': 'Ride-Profil gelöscht',
  'auth.login': 'Anmeldung',
  'auth.password.change': 'Passwort geändert',
  'auth.totp.enable': 'Zwei-Faktor aktiviert',
  'auth.totp.disable': 'Zwei-Faktor deaktiviert',
  'auth.sessions.revoke-all': 'Alle Sitzungen beendet',
  'user.create': 'Konto angelegt',
  'user.update': 'Konto geändert',
  'user.reset-password': 'Passwort zurückgesetzt',
};

function actionLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  if (action.startsWith('job.')) return `Job: ${action.slice(4)}`;
  return action;
}

const UNDOABLE = new Set(['attraction.curate', 'park.curate']);

export function HistoryList({
  entries,
  invalidateKeys = [],
  compact = false,
  canUndo = false,
  showEntity = false,
}: {
  entries: AuditEntry[];
  invalidateKeys?: ReadonlyArray<readonly unknown[]>;
  compact?: boolean;
  canUndo?: boolean;
  showEntity?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={User}
        title="Noch nichts geändert"
        description="Sobald hier jemand etwas kuratiert, steht es hier, mit Begründung und Quelle."
      />
    );
  }

  return (
    <ol className={cn('space-y-2', compact && 'space-y-1.5')}>
      {entries.map((entry) => (
        <HistoryRow
          key={entry.id}
          entry={entry}
          invalidateKeys={invalidateKeys}
          compact={compact}
          canUndo={canUndo && UNDOABLE.has(entry.action) && !entry.revertedBy && !!entry.before}
          showEntity={showEntity}
        />
      ))}
    </ol>
  );
}

function HistoryRow({
  entry,
  invalidateKeys,
  compact,
  canUndo,
  showEntity,
}: {
  entry: AuditEntry;
  invalidateKeys: ReadonlyArray<readonly unknown[]>;
  compact: boolean;
  canUndo: boolean;
  showEntity: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState(false);

  const changedKeys = Object.keys(entry.after ?? entry.before ?? {});

  async function undo() {
    setBusy(true);
    try {
      await adminFetch(`/api/admin/content/history/${entry.id}/undo`, { method: 'POST' });
      invalidate(['admin'], ...invalidateKeys);
      toast.push({ title: 'Änderung zurückgenommen', tone: 'success' });
    } catch (error) {
      toast.push({
        title: 'Konnte nicht zurückgenommen werden',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className={cn(
        'border-border/50 bg-card/30 rounded-lg border px-3 py-2.5',
        entry.revertedBy && 'opacity-60'
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium">{actionLabel(entry.action)}</span>
        {showEntity && entry.entityLabel && (
          <span className="text-muted-foreground truncate text-xs">{entry.entityLabel}</span>
        )}
        {entry.revertedBy && <Chip>zurückgenommen</Chip>}
        <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">
          {formatDistanceToNow(parseISO(entry.createdAt), { addSuffix: true, locale: de })}
        </span>
      </div>

      <p className="text-muted-foreground mt-0.5 text-xs">
        {entry.actorEmail === 'legacy-pass' ? (
          <span className="text-amber-400">geteiltes Alt-Passwort (kein Konto)</span>
        ) : (
          entry.actorEmail
        )}
      </p>

      {!compact && changedKeys.length > 0 && entry.before && entry.after && (
        <div className="mt-2 space-y-1">
          {changedKeys.map((key) => (
            <div key={key} className="flex flex-wrap items-baseline gap-1.5 text-xs">
              <span className="text-muted-foreground">{key}</span>
              <code className="bg-destructive/10 text-destructive rounded px-1 py-0.5 line-through">
                {formatValue(entry.before?.[key])}
              </code>
              <span className="text-muted-foreground">→</span>
              <code className="rounded bg-emerald-500/10 px-1 py-0.5 text-emerald-400">
                {formatValue(entry.after?.[key])}
              </code>
            </div>
          ))}
        </div>
      )}

      {entry.reason && <p className="mt-1.5 text-xs italic">„{entry.reason}“</p>}

      <div className="mt-1.5 flex items-center gap-3">
        {entry.sourceUrl && (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 truncate text-xs hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{entry.sourceUrl}</span>
          </a>
        )}
        {showEntity && entry.entityId && entry.entityType === 'park' && (
          <Link
            href={`/admin/parks/${entry.entityId}`}
            className="text-primary text-xs hover:underline"
          >
            zum Park
          </Link>
        )}
        {showEntity && entry.entityId && entry.entityType === 'attraction' && (
          <Link
            href={`/admin/attractions/${entry.entityId}`}
            className="text-primary text-xs hover:underline"
          >
            zum Fahrgeschäft
          </Link>
        )}
        {canUndo && (
          <button
            type="button"
            onClick={undo}
            disabled={busy}
            className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1 text-xs disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
            Zurücknehmen
          </button>
        )}
      </div>
    </li>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'object') return JSON.stringify(value);
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}
