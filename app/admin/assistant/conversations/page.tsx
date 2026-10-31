'use client';

import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import { Segmented, TextInput } from '../../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelHeader,
  SkeletonRows,
  Toolbar,
} from '../../_ui/primitives';
import {
  ASSISTANT_API,
  formatCount,
  formatDateTime,
  formatUsd,
  type ConversationRow,
  type Page,
} from '../_lib/assistant';

type RatingFilter = 'all' | 'down' | 'up';

const RATING_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'down', label: '👎' },
  { value: 'up', label: '👍' },
] as const;

/** Every stored chat, newest first, with the 👎 ones a click away. */
export default function AssistantConversationsPage() {
  const [rating, setRating] = useState<RatingFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDeferredValue(search.trim());

  const params = new URLSearchParams({ page: String(page) });
  if (rating !== 'all') params.set('rating', rating === 'down' ? '-1' : '1');
  if (q.length >= 2) params.set('q', q);
  const path = `${ASSISTANT_API}/conversations?${params}`;
  const { data, error, refetch } = useAdminQuery<Page<ConversationRow>>(adminKeys.raw(path), path);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={MessagesSquare}
          title="Chats"
          hint={data ? `${formatCount(data.total)} gespeichert, 90 Tage lang` : undefined}
        />
        <Toolbar>
          <Segmented
            label="Bewertung"
            options={RATING_OPTIONS}
            value={rating}
            onChange={(value) => {
              setRating(value);
              setPage(1);
            }}
          />
          <TextInput
            type="search"
            placeholder="In Fragen und Antworten suchen…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
        </Toolbar>
        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : !data ? (
          <SkeletonRows />
        ) : data.items.length === 0 ? (
          <EmptyState title="Keine Chats in dieser Ansicht." />
        ) : (
          <ul className="divide-border/40 divide-y">
            {data.items.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/admin/assistant/conversations/${chat.id}`}
                  className="hover:bg-muted/30 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground w-28 shrink-0 tabular-nums">
                    {formatDateTime(chat.createdAt)}
                  </span>
                  <Chip>{chat.locale}</Chip>
                  <span className="min-w-0 flex-1 truncate">{chat.firstQuestion ?? '–'}</span>
                  <span className="text-muted-foreground max-w-56 truncate text-xs">
                    {chat.startPath}
                  </span>
                  <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
                    {chat.messageCount} ✉
                  </span>
                  <span className="w-20 text-right text-xs tabular-nums">
                    {formatUsd(chat.costUsd)}
                  </span>
                  <span className="w-5 text-center">
                    {chat.rating < 0 ? '👎' : chat.rating > 0 ? '👍' : ''}
                  </span>
                </Link>
              </li>
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
