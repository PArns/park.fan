'use client';

import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { adminKeys, useAdminQuery } from '../_lib/api';
import type { AuditEntry } from '../_lib/types';
import { EmptyState, ErrorState, SkeletonRows, Toolbar } from '../_ui/primitives';
import { Select, TextInput } from '../_ui/controls';
import { HistoryList } from '../_ui/history-list';
import { useCan } from '../_app/session';

/**
 * Everything administrators have done, newest first.
 *
 * The filter that matters most is by entity type, and the second is the action
 * prefix: `park.` selects the whole family, which is almost always the question
 * ("what happened to parks lately") rather than the specific one ("what
 * happened via park.season.update").
 */

const ENTITY_TYPES = [
  { value: 'park', label: 'Parks' },
  { value: 'attraction', label: 'Fahrgeschäfte' },
  { value: 'park_season', label: 'Saisons' },
  { value: 'admin_user', label: 'Konten' },
  { value: 'system', label: 'Jobs & System' },
];

const ACTION_PREFIXES = [
  { value: 'park.curate', label: 'Park kuratiert' },
  { value: 'attraction.curate', label: 'Fahrgeschäft kuratiert' },
  { value: 'park.season', label: 'Saison' },
  { value: 'ride-profile', label: 'Ride-Profil' },
  { value: 'job.', label: 'Jobs' },
  { value: 'auth.', label: 'Anmeldungen' },
  { value: 'user.', label: 'Kontoverwaltung' },
];

const PAGE_SIZE = 40;

export default function HistoryPage() {
  const canUndo = useCan('editor');
  const [entityType, setEntityType] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [entityId, setEntityId] = useState('');
  const [page, setPage] = useState(0);

  const params = useMemo(() => {
    const search = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (entityType) search.set('entityType', entityType);
    if (action) search.set('action', action);
    if (entityId.trim()) search.set('entityId', entityId.trim());
    return search.toString();
  }, [entityType, action, entityId, page]);

  const history = useAdminQuery<{ entries: AuditEntry[]; total: number }>(
    adminKeys.history({ params }),
    `/api/admin/content/history?${params}`
  );

  const total = history.data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div>
      <Toolbar>
        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value);
            setPage(0);
          }}
          options={ENTITY_TYPES}
          placeholder="Alles"
          emptyLabel="Alles"
          className="h-8 w-44 text-xs"
        />
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value);
            setPage(0);
          }}
          options={ACTION_PREFIXES}
          placeholder="Alle Aktionen"
          emptyLabel="Alle Aktionen"
          className="h-8 w-48 text-xs"
        />
        <TextInput
          value={entityId}
          onChange={(event) => {
            setEntityId(event.target.value);
            setPage(0);
          }}
          placeholder="Entity-ID…"
          className="h-8 w-56 text-xs"
        />
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {history.data ? `${total} Einträge` : '…'}
        </span>
      </Toolbar>

      <div className="mx-auto max-w-4xl space-y-4 p-4">
        {history.isError ? (
          <ErrorState message={history.error.message} onRetry={() => void history.refetch()} />
        ) : history.isLoading ? (
          <SkeletonRows rows={10} />
        ) : (history.data?.entries?.length ?? 0) === 0 ? (
          <EmptyState
            icon={History}
            title="Nichts gefunden"
            description="Für diesen Filter gibt es keine Einträge."
          />
        ) : (
          <>
            <HistoryList
              entries={history.data?.entries ?? []}
              showEntity
              canUndo={canUndo}
              invalidateKeys={[['admin', 'history']]}
            />

            {lastPage > 0 && (
              <div className="flex items-center justify-center gap-3 text-xs">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  className="border-border/60 rounded-lg border px-3 py-1.5 disabled:opacity-40"
                >
                  Zurück
                </button>
                <span className="text-muted-foreground tabular-nums">
                  {page + 1} / {lastPage + 1}
                </span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                  className="border-border/60 rounded-lg border px-3 py-1.5 disabled:opacity-40"
                >
                  Weiter
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
