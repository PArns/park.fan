'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import {
  CHAT_SOURCE_LABEL,
  TOKEN_WINDOWS,
  chatSource,
  tokenSeries,
  type TokenStats,
  type TokenUsage,
} from '@/lib/admin/parky-tokens';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import { BarList, CATEGORICAL, SeriesChart } from '../../_ui/charts';
import { Segmented } from '../../_ui/controls';
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
  Toolbar,
} from '../../_ui/primitives';
import { ASSISTANT_API, formatCount, formatDateTime, formatUsd } from '../_lib/assistant';
import { SourceChip } from '../_components/source-chip';

const WINDOW_OPTIONS = TOKEN_WINDOWS.map((days) => ({ value: days, label: `${days} Tage` }));

/** A consumer's second line: what the tokens cost and over how many chats. */
function sums(row: { chats: number; costUsd: number }): string {
  return `${formatUsd(row.costUsd)} · ${formatCount(row.chats)} ${row.chats === 1 ? 'Chat' : 'Chats'}`;
}

function UsageCells({ usage }: { usage: TokenUsage }) {
  return (
    <>
      <td className="py-1.5 text-right">{formatCount(usage.chats)}</td>
      <td className="py-1.5 text-right">{formatCount(usage.messages)}</td>
      <td className="py-1.5 text-right">{formatCount(usage.inputTokens)}</td>
      <td className="py-1.5 text-right">{formatCount(usage.outputTokens)}</td>
      <td className="py-1.5 text-right">{formatCount(usage.cacheReadTokens)}</td>
      <td className="py-1.5 text-right">{formatCount(usage.totalTokens)}</td>
      <td className="py-1.5 text-right">{formatUsd(usage.costUsd)}</td>
    </>
  );
}

/**
 * Who spends Parky's tokens: per UTC day and source the chats, tokens by kind and cost, then the
 * data keys, visitors and single chats that spent most. An API without the statistic answers 404,
 * and the page says so.
 */
export default function AssistantTokensPage() {
  const [days, setDays] = useState<(typeof TOKEN_WINDOWS)[number]>(30);
  const path = `${ASSISTANT_API}/stats/tokens?days=${days}`;
  const { data, error, refetch } = useAdminQuery<TokenStats>(adminKeys.raw(path), path, {
    // A missing endpoint is an answer, not a hiccup.
    retry: false,
    placeholderData: keepPreviousData,
  });

  const picker = (
    <Toolbar>
      <Segmented label="Zeitraum" options={WINDOW_OPTIONS} value={days} onChange={setDays} />
    </Toolbar>
  );

  if (error?.status === 404) {
    return (
      <AdminPage>
        <Notice>
          Die API liefert die Token-Statistik noch nicht. Sie kommt mit dem nächsten Deploy der API.
        </Notice>
      </AdminPage>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return <LoadingState label="Lädt Token-Statistik…" />;

  const series = tokenSeries(data);
  const { totals } = data;

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={Coins}
          title="Tokens"
          hint={`UTC, ${data.from} bis ${data.to}. Chats vor der Unterscheidung zählen als Website.`}
        />
        {picker}
        <PanelBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Tokens"
              value={formatCount(totals.all.totalTokens)}
              sub={`${formatCount(totals.all.chats)} Chats`}
            />
            <StatTile label="Kosten" value={formatUsd(totals.all.costUsd)} />
            <StatTile
              label="Website"
              value={formatCount(totals.web.totalTokens)}
              sub={sums(totals.web)}
            />
            <StatTile
              label="App"
              value={formatCount(totals.app.totalTokens)}
              sub={sums(totals.app)}
            />
          </div>
          <SeriesChart
            days={series.days}
            label={`Tokens je Tag nach Quelle, ${data.from} bis ${data.to}`}
            series={[
              {
                key: 'web',
                label: CHAT_SOURCE_LABEL.web,
                color: CATEGORICAL[0],
                values: series.web,
              },
              {
                key: 'app',
                label: CHAT_SOURCE_LABEL.app,
                color: CATEGORICAL[1],
                values: series.app,
              },
            ]}
          />
        </PanelBody>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="API-Keys" hint="Tokens je Datenschlüssel im ganzen Zeitraum" />
          <PanelBody>
            {data.topApiKeys.length === 0 ? (
              <p className="text-muted-foreground text-sm">Kein Chat über einen Datenschlüssel.</p>
            ) : (
              <BarList
                unit="Tokens"
                rows={data.topApiKeys.map((key) => ({
                  key: key.apiKeyId,
                  label: key.name ?? `gelöschter Key ${key.apiKeyId.slice(0, 8)}`,
                  value: key.totalTokens,
                  detail: sums(key),
                  href: '/admin/api-keys',
                }))}
              />
            )}
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader
            title="Besucher"
            hint={`Aus den gespeicherten Chats der letzten ${data.keptDays} Tage. Ein Besucher ist eine Adresse an einem Tag, hier nur als Kürzel.`}
          />
          <PanelBody>
            {data.topVisitors.length === 0 ? (
              <p className="text-muted-foreground text-sm">Keine gespeicherten Chats.</p>
            ) : (
              <BarList
                unit="Tokens"
                rows={data.topVisitors.map((visitor) => ({
                  key: `${visitor.visitorKey}:${visitor.source}`,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      <code>{visitor.visitorKey.slice(0, 8)}</code>
                      <SourceChip source={visitor.source} />
                    </span>
                  ),
                  value: visitor.totalTokens,
                  detail: `${visitor.day} · ${sums(visitor)}`,
                }))}
              />
            )}
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader
            title="Teuerste Chats"
            hint={`Aus den gespeicherten Chats der letzten ${data.keptDays} Tage`}
          />
          <PanelBody>
            {data.topConversations.length === 0 ? (
              <p className="text-muted-foreground text-sm">Keine gespeicherten Chats.</p>
            ) : (
              <BarList
                unit="Tokens"
                rows={data.topConversations.map((chat) => ({
                  key: chat.id,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      {formatDateTime(chat.createdAt)}
                      <SourceChip source={chat.source} />
                    </span>
                  ),
                  value: chat.totalTokens,
                  detail: `${formatUsd(chat.costUsd)} · ${formatCount(chat.messages)} Nachrichten`,
                  href: `/admin/assistant/conversations/${chat.id}`,
                }))}
              />
            )}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Pro Tag und Quelle"
          hint="Input enthält Cache-Schreiben. Für Tage, die vor der Aufschlüsselung gelöscht wurden, ist nur die Summe bekannt."
        />
        <PanelBody>
          {data.days.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine Chats in diesem Zeitraum.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-sm tabular-nums">
                <thead className="text-muted-foreground text-left text-xs">
                  <tr>
                    <th className="py-1 font-medium">Tag</th>
                    <th className="py-1 font-medium">Quelle</th>
                    <th className="py-1 text-right font-medium">Chats</th>
                    <th className="py-1 text-right font-medium">Nachrichten</th>
                    <th className="py-1 text-right font-medium">Input</th>
                    <th className="py-1 text-right font-medium">Output</th>
                    <th className="py-1 text-right font-medium">Cache gelesen</th>
                    <th className="py-1 text-right font-medium">Tokens</th>
                    <th className="py-1 text-right font-medium">Kosten</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.days].reverse().map((row) => (
                    <tr
                      key={`${row.day}:${chatSource(row.source)}`}
                      className="border-border/40 border-t"
                    >
                      <td className="py-1.5">{row.day}</td>
                      <td className="py-1.5">
                        <SourceChip source={row.source} />
                      </td>
                      <UsageCells usage={row} />
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-medium">
                  {(['web', 'app', 'all'] as const).map((key) => (
                    <tr key={key} className="border-border/60 border-t">
                      <td className="py-1.5">Summe</td>
                      <td className="py-1.5">
                        {key === 'all' ? 'Gesamt' : CHAT_SOURCE_LABEL[key]}
                      </td>
                      <UsageCells usage={totals[key]} />
                    </tr>
                  ))}
                </tfoot>
              </table>
            </div>
          )}
        </PanelBody>
      </Panel>
    </AdminPage>
  );
}
