'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, History, Loader2, RefreshCw, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEARCH_CONSOLE_REINDEX_PATH, formatSearchConsole } from '@/lib/admin/search-console';
import { formatCount } from '@/lib/admin/site-analytics';
import type {
  SearchConsoleReindexItem,
  SearchConsoleReindexQueue,
} from '@/lib/api/admin-search-console';
import { useCan } from '../../_app/session';
import { adminFetch, useAdminQuery } from '../../_lib/api';
import { formatAgo } from '../../_lib/format';
import {
  Chip,
  EmptyState,
  ErrorState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
  StartTruncated,
} from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import { REINDEX_STATE_CHIP, reindexReason, requestReindex } from '../_lib/reindex';
import { PublicLink } from './list-parts';

const reindexKey = ['admin', 'search-console', 'reindex'] as const;

/** Clicks, impressions, CTR and position over 28 days, as one line. */
function Figures({ item }: { item: SearchConsoleReindexItem }) {
  if (item.impressions === 0) {
    return <span className="text-muted-foreground text-xs">keine Impressionen in 28 Tagen</span>;
  }
  return (
    <span className="text-muted-foreground text-xs tabular-nums">
      {formatCount(item.impressions)} Impr. · {formatCount(item.clicks)} Klicks · CTR{' '}
      {formatSearchConsole('ctr', item.ctr)} · Pos. {formatSearchConsole('position', item.position)}
    </span>
  );
}

/**
 * The pages Google has not crawled since they changed, to request indexing for in Search Console,
 * and the record of every request, so a page is requested once per change even while Search
 * Console still shows the old crawl.
 */
export function ReindexPanel({ siteUrl }: { siteUrl: string }) {
  const canRequest = useCan('editor');
  const toast = useToast();
  const queryClient = useQueryClient();
  const queue = useAdminQuery<SearchConsoleReindexQueue>(reindexKey, SEARCH_CONSOLE_REINDEX_PATH, {
    staleTime: 60_000,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  async function request(item: SearchConsoleReindexItem) {
    setBusy(item.path);
    toast.push(await requestReindex(siteUrl, item));
    await queryClient.invalidateQueries({ queryKey: reindexKey });
    setBusy(null);
  }

  async function scan() {
    setScanning(true);
    try {
      await adminFetch(`${SEARCH_CONSOLE_REINDEX_PATH}/scan`, { method: 'POST' });
      toast.push({
        title: 'Prüfung angestoßen',
        description: 'Die Liste füllt sich in einigen Minuten neu.',
        tone: 'success',
      });
    } catch (err) {
      toast.push({
        title: 'Prüfung nicht gestartet',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setScanning(false);
    }
  }

  const data = queue.data;
  const atLimit = data ? data.requestsLast24h >= data.dailyLimit : false;

  return (
    <Panel>
      <PanelHeader
        icon={SearchCheck}
        title="Nachindizieren"
        hint={
          data?.lastInspectedAt
            ? `Seiten, die sich in den letzten 30 Tagen geändert haben und die Google seitdem nicht gecrawlt hat. Geprüft ${formatAgo(data.lastInspectedAt)}, ${formatCount(data.inspected)} von ${formatCount(data.candidates)} geänderten Seiten.`
            : 'Seiten, die sich in den letzten 30 Tagen geändert haben und die Google seitdem nicht gecrawlt hat.'
        }
        action={
          <div className="flex items-center gap-2">
            {data && (
              <Chip tone={atLimit ? 'danger' : 'muted'}>
                {data.requestsLast24h}/{data.dailyLimit} in 24 h
              </Chip>
            )}
            {canRequest && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void scan()}
                disabled={scanning}
                title="URL-Inspection jetzt für die geänderten Seiten abfragen"
              >
                {scanning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Prüfen
              </Button>
            )}
          </div>
        }
      />
      <PanelBody className="space-y-4">
        {queue.isError ? (
          <ErrorState message={queue.error.message} onRetry={() => void queue.refetch()} />
        ) : !data ? (
          <SkeletonRows rows={5} />
        ) : (
          <>
            {atLimit && (
              <Notice role="alert">
                Schon {data.requestsLast24h} Anträge in den letzten 24 Stunden. Google nimmt etwa{' '}
                {data.dailyLimit} am Tag an, weitere werden meist abgelehnt. Morgen weitermachen.
              </Notice>
            )}
            {data.open.length === 0 ? (
              <EmptyState
                icon={SearchCheck}
                title="Nichts nachzuindizieren"
                description="Google hat jede geänderte Seite seit der Änderung gecrawlt, oder sie ist schon beantragt."
              />
            ) : (
              <ul className="divide-border/50 divide-y">
                {data.open.map((item) => (
                  <li key={item.path} className="flex items-start gap-3 py-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Chip tone={REINDEX_STATE_CHIP[item.state].tone}>
                          {REINDEX_STATE_CHIP[item.state].label}
                        </Chip>
                        <span className="min-w-0 text-sm">
                          <StartTruncated>{item.url}</StartTruncated>
                        </span>
                        <PublicLink href={item.url} />
                      </div>
                      <p className="text-xs">{reindexReason(item)}</p>
                      <Figures item={item} />
                    </div>
                    {canRequest && (
                      <Button
                        size="sm"
                        variant={atLimit ? 'outline' : 'default'}
                        onClick={() => void request(item)}
                        disabled={busy !== null}
                        title="Kopiert die URL, öffnet die Search Console und merkt sich den Antrag"
                      >
                        {busy === item.path ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5" />
                        )}
                        Beantragen
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {data.requested.length > 0 && (
              <section className="space-y-1">
                <h3 className="text-muted-foreground text-xs font-semibold uppercase">
                  Beantragt, wartet auf Google ({data.requested.length})
                </h3>
                <ul className="divide-border/50 divide-y">
                  {data.requested.map((item) => (
                    <li key={item.path} className="space-y-0.5 py-2">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 text-sm">
                          <StartTruncated>{item.url}</StartTruncated>
                        </span>
                        <PublicLink href={item.url} />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Beantragt {formatAgo(item.requestedAt!)}
                        {item.requestedBy ? ` von ${item.requestedBy}` : ''}. {reindexReason(item)}
                      </p>
                      <Figures item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.history.length > 0 && (
              <details>
                <summary className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
                  <History className="h-3.5 w-3.5" />
                  Alle Anträge ({data.history.length})
                </summary>
                <ul className="mt-2 space-y-1 text-xs">
                  {data.history.map((row) => (
                    <li key={`${row.path}-${row.requestedAt}`} className="flex gap-2">
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {new Date(row.requestedAt).toLocaleString('de-DE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className="min-w-0 flex-1">
                        <StartTruncated>{row.path}</StartTruncated>
                      </span>
                      <span className="text-muted-foreground shrink-0">{row.actor}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </PanelBody>
    </Panel>
  );
}
