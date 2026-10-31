'use client';

import { use } from 'react';
import Link from 'next/link';
import { ExternalLink, MessageSquareHeart, MessagesSquare, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminKeys, useAdminQuery } from '../../../_lib/api';
import {
  AdminPage,
  Chip,
  ErrorState,
  LoadingState,
  Meta,
  Panel,
  PanelBody,
  PanelHeader,
} from '../../../_ui/primitives';
import {
  ASSISTANT_API,
  SITE_ORIGIN,
  formatCount,
  formatDateTime,
  formatUsd,
  type ConversationDetail,
  type ConversationMessage,
} from '../../_lib/assistant';

/**
 * One chat as it happened. Every text is rendered as plain text: what a visitor typed and what
 * the model wrote are never parsed as Markdown or HTML here.
 */
export default function AssistantConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const path = `${ASSISTANT_API}/conversations/${id}`;
  const { data, error, refetch } = useAdminQuery<ConversationDetail>(adminKeys.raw(path), path);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return <LoadingState label="Lädt Chat…" />;

  return (
    <AdminPage>
      <Panel>
        <PanelHeader
          icon={MessagesSquare}
          title={`Chat vom ${formatDateTime(data.createdAt)}`}
          action={
            <a
              href={`${SITE_ORIGIN}${data.startPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              Startseite <ExternalLink className="h-3 w-3" />
            </a>
          }
        />
        <PanelBody className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Meta label="Sprache" value={data.locale} />
          <Meta label="Seite" value={data.startPath} />
          <Meta label="Nachrichten" value={formatCount(data.messageCount)} />
          <Meta label="Tokens" value={formatCount(data.totalTokens)} />
          <Meta label="Kosten" value={formatUsd(data.costUsd)} />
        </PanelBody>
      </Panel>

      <div className="space-y-3">
        {data.messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </div>

      {data.feedback.length > 0 && (
        <Panel>
          <PanelHeader icon={MessageSquareHeart} title="Feedback aus diesem Chat" />
          <PanelBody className="space-y-2">
            {data.feedback.map((entry) => (
              <div key={entry.id} className="border-border/60 rounded-lg border p-3 text-sm">
                <p className="whitespace-pre-wrap">{entry.message}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDateTime(entry.createdAt)} ·{' '}
                  <Link href="/admin/assistant/feedback" className="hover:underline">
                    {entry.status}
                  </Link>
                </p>
              </div>
            ))}
          </PanelBody>
        </Panel>
      )}
    </AdminPage>
  );
}

function Message({ message }: { message: ConversationMessage }) {
  const fromVisitor = message.role === 'user';
  return (
    <div
      className={cn(
        'rounded-xl border p-3 text-sm',
        fromVisitor ? 'border-primary/30 bg-primary/5 ml-8' : 'border-border/60 bg-card/60 mr-8'
      )}
    >
      <div className="text-muted-foreground mb-1.5 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium">{fromVisitor ? 'Besucher' : 'Parky'}</span>
        <span>{formatDateTime(message.createdAt)}</span>
        {!fromVisitor && (
          <span className="tabular-nums">
            {formatCount(message.inputTokens)} in · {formatCount(message.outputTokens)} out ·{' '}
            {formatCount(message.cacheReadTokens)} Cache · {formatUsd(message.costUsd)}
          </span>
        )}
        {message.rating === -1 && <Chip tone="danger">👎</Chip>}
        {message.rating === 1 && <Chip tone="success">👍</Chip>}
      </div>
      <p className="break-words whitespace-pre-wrap">{message.text || '–'}</p>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <details className="mt-2">
          <summary className="text-muted-foreground inline-flex cursor-pointer items-center gap-1 text-xs">
            <Wrench className="h-3 w-3" />
            {message.toolCalls.length} Tool-Aufruf{message.toolCalls.length > 1 ? 'e' : ''}
          </summary>
          <ul className="mt-2 space-y-1.5">
            {message.toolCalls.map((call, index) => (
              <li key={index} className="bg-muted/30 rounded-md p-2 text-xs">
                <span className={cn('font-mono font-medium', call.error && 'text-destructive')}>
                  {call.name}
                  {call.error && ' (Fehler)'}
                </span>
                <pre className="text-muted-foreground mt-1 overflow-x-auto">
                  {JSON.stringify(call.input, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
