'use client';

import Link from 'next/link';
import { Bot, KeyRound, MessageSquareHeart, MessagesSquare } from 'lucide-react';
import { adminKeys, useAdminQuery } from '../_lib/api';
import {
  AdminPage,
  Chip,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
} from '../_ui/primitives';
import {
  ASSISTANT_API,
  formatCount,
  formatUsd,
  type AssistantSettings,
  type AssistantStats,
} from './_lib/assistant';

const LINKS = [
  { href: '/admin/assistant/conversations', label: 'Chats', icon: MessagesSquare },
  { href: '/admin/assistant/feedback', label: 'Feedback', icon: MessageSquareHeart },
  { href: '/admin/assistant/settings', label: 'Einstellungen', icon: KeyRound },
];

/** Parky at a glance: is he on, what did 30 days cost, how are the answers rated. */
export default function AssistantOverviewPage() {
  const stats = useAdminQuery<AssistantStats>(
    adminKeys.raw(`${ASSISTANT_API}/stats`),
    `${ASSISTANT_API}/stats`
  );
  const settings = useAdminQuery<AssistantSettings>(
    adminKeys.raw(`${ASSISTANT_API}/settings`),
    `${ASSISTANT_API}/settings`
  );

  if (stats.error) return <ErrorState message={stats.error.message} onRetry={stats.refetch} />;
  if (!stats.data) return <LoadingState label="Lädt Parky…" />;

  const { days, ratings, openFeedback, tokensToday } = stats.data;
  const chats = days.reduce((sum, day) => sum + day.chats, 0);
  const cost = days.reduce((sum, day) => sum + day.costUsd, 0);
  const rated = ratings.up + ratings.down;

  return (
    <AdminPage>
      <Panel>
        <PanelHeader
          icon={Bot}
          title="Parky"
          hint={`Chat-Assistent auf park.fan · ${settings.data?.model ?? '…'}`}
          action={
            settings.data && (
              <Chip tone={settings.data.enabled ? 'success' : 'muted'}>
                {settings.data.enabled ? `an · ${settings.data.rolloutPercent} %` : 'aus'}
              </Chip>
            )
          }
        />
        <PanelBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatTile label="Chats 30 Tage" value={formatCount(chats)} />
            <StatTile label="Kosten 30 Tage" value={formatUsd(cost)} />
            <StatTile label="Tokens heute" value={formatCount(tokensToday)} />
            <StatTile
              label="👍 / 👎"
              value={rated ? `${Math.round((ratings.up / rated) * 100)} %` : '–'}
              sub={`${ratings.up} / ${ratings.down}`}
            />
            <StatTile label="Offenes Feedback" value={formatCount(openFeedback)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="border-border/60 hover:border-primary/40 hover:text-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Pro Tag" hint="UTC, die letzten 30 Tage" />
        <PanelBody>
          {days.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Chats.</p>
          ) : (
            <table className="w-full text-sm tabular-nums">
              <thead className="text-muted-foreground text-left text-xs">
                <tr>
                  <th className="py-1 font-medium">Tag</th>
                  <th className="py-1 text-right font-medium">Chats</th>
                  <th className="py-1 text-right font-medium">Nachrichten</th>
                  <th className="py-1 text-right font-medium">Tokens</th>
                  <th className="py-1 text-right font-medium">Kosten</th>
                </tr>
              </thead>
              <tbody>
                {[...days].reverse().map((day) => (
                  <tr key={day.day} className="border-border/40 border-t">
                    <td className="py-1.5">{day.day}</td>
                    <td className="py-1.5 text-right">{formatCount(day.chats)}</td>
                    <td className="py-1.5 text-right">{formatCount(day.messages)}</td>
                    <td className="py-1.5 text-right">{formatCount(day.tokens)}</td>
                    <td className="py-1.5 text-right">{formatUsd(day.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PanelBody>
      </Panel>
    </AdminPage>
  );
}
