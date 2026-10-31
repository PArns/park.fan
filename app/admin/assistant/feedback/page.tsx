'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  Check,
  ExternalLink,
  MessageSquareHeart,
  MessagesSquare,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import { Segmented } from '../../_ui/controls';
import {
  AdminPage,
  Chip,
  type ChipTone,
  EmptyState,
  ErrorState,
  Panel,
  PanelHeader,
  SkeletonRows,
  Toolbar,
} from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import {
  ASSISTANT_API,
  SITE_ORIGIN,
  formatCount,
  formatDateTime,
  type FeedbackEntry,
  type FeedbackStatus,
  type Page,
} from '../_lib/assistant';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Neu' },
  { value: 'done', label: 'Erledigt' },
  { value: 'archived', label: 'Archiv' },
] as const;

const STATUS_TONES: Record<FeedbackStatus, ChipTone> = {
  new: 'warning',
  done: 'success',
  archived: 'muted',
};

/** What visitors sent through the widget's feedback tab, to read and close. */
export default function AssistantFeedbackPage() {
  const [status, setStatus] = useState<FeedbackStatus>('new');
  const [page, setPage] = useState(1);
  const path = `${ASSISTANT_API}/feedback?status=${status}&page=${page}`;
  const { data, error, refetch } = useAdminQuery<Page<FeedbackEntry>>(adminKeys.raw(path), path);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminPage>
      <Panel>
        <PanelHeader
          icon={MessageSquareHeart}
          title="Feedback"
          hint={data ? `${formatCount(data.total)} in dieser Ansicht` : undefined}
        />
        <Toolbar>
          <Segmented
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </Toolbar>
        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : !data ? (
          <SkeletonRows />
        ) : data.items.length === 0 ? (
          <EmptyState title="Kein Feedback in dieser Ansicht." />
        ) : (
          <ul className="divide-border/40 divide-y">
            {data.items.map((entry) => (
              <FeedbackRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
        {data && pages > 1 && (
          <div className="border-border/50 flex items-center justify-end gap-2 border-t px-4 py-2 text-xs">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Zurück
            </Button>
            <span className="tabular-nums">
              {page} / {pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Weiter
            </Button>
          </div>
        )}
      </Panel>
    </AdminPage>
  );
}

function FeedbackRow({ entry }: { entry: FeedbackEntry }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState(false);

  const move = async (status: FeedbackStatus, title: string) => {
    setBusy(true);
    try {
      await adminFetch(`${ASSISTANT_API}/feedback/${entry.id}`, {
        method: 'PATCH',
        body: { status },
      });
      // The open count on the overview moves with it.
      invalidate(['admin', 'raw']);
      toast.push({
        title,
        tone: 'success',
        action: { label: 'Rückgängig', onClick: () => move(entry.status, 'Zurückgesetzt') },
      });
    } catch (error) {
      toast.push({
        title: 'Nicht gespeichert',
        description: (error as Error).message,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="space-y-2 px-4 py-3 text-sm">
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <span className="tabular-nums">{formatDateTime(entry.createdAt)}</span>
        <Chip>{entry.locale}</Chip>
        <Chip tone={STATUS_TONES[entry.status]}>{entry.status}</Chip>
        <a
          href={`${SITE_ORIGIN}${entry.pagePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground inline-flex max-w-64 items-center gap-1 truncate"
        >
          {entry.pagePath} <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
        {entry.conversationId && (
          <Link
            href={`/admin/assistant/conversations/${entry.conversationId}`}
            className="hover:text-foreground inline-flex items-center gap-1"
          >
            <MessagesSquare className="h-3 w-3" /> Chat
          </Link>
        )}
        {entry.email && (
          <a href={`mailto:${entry.email}`} className="hover:text-foreground">
            {entry.email}
          </a>
        )}
      </div>
      <p className="break-words whitespace-pre-wrap">{entry.message}</p>
      <div className="flex flex-wrap gap-2">
        {entry.status !== 'done' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => move('done', 'Erledigt')}
          >
            <Check /> Erledigt
          </Button>
        )}
        {entry.status !== 'archived' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => move('archived', 'Archiviert')}
          >
            <Archive /> Archivieren
          </Button>
        )}
        {entry.status !== 'new' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => move('new', 'Wieder offen')}
          >
            <Undo2 /> Wieder öffnen
          </Button>
        )}
      </div>
    </li>
  );
}
