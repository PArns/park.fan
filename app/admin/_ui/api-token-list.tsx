'use client';

import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { KeyRound, Plug, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  apiTokenKey,
  apiTokensPath,
  displayClientName,
  hasPassed,
  type AdminApiToken,
} from '@/lib/admin/mcp';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { SYSTEM_MONO } from './code-block';
import { Chip, EmptyState, ErrorState, SkeletonRows } from './primitives';
import { useToast } from './toast';

function ago(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: de });
}

/**
 * Personal tokens and OAuth connections of one account, each with its revoke button. Without
 * `userId` it is the signed-in account's own list; an owner passes another account's id.
 */
export function ApiTokenList({ userId }: { userId?: string }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const now = useMinuteNow();
  const tokens = useAdminQuery<{ items: AdminApiToken[] }>(
    apiTokenKey(userId),
    apiTokensPath(userId)
  );
  // Kept after the dialog closes, so its text does not change while it fades out.
  const [pending, setPending] = useState<AdminApiToken | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function revoke(token: AdminApiToken) {
    try {
      await adminFetch(`/api/admin/auth/tokens/${encodeURIComponent(token.id)}`, {
        method: 'DELETE',
      });
      invalidate(apiTokenKey(userId));
      toast.push({
        title: token.kind === 'oauth' ? 'Verbindung beendet' : 'Token widerrufen',
        tone: 'success',
      });
    } catch (err) {
      toast.push({
        title: 'Widerrufen fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    }
  }

  if (tokens.isLoading) return <SkeletonRows rows={2} />;
  if (tokens.isError) {
    return <ErrorState message={tokens.error.message} onRetry={() => void tokens.refetch()} />;
  }

  const items = tokens.data?.items ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="Nichts verbunden"
        description="Hier stehen Tokens und die Apps, die über die Anmeldung Zugriff bekommen haben."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((token) => (
          <TokenRow
            key={token.id}
            token={token}
            expired={now !== null && hasPassed(token.expiresAt, now)}
            onRevoke={() => {
              setPending(token);
              setConfirming(true);
            }}
          />
        ))}
      </ul>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        icon={Trash2}
        tone="destructive"
        title={
          pending?.kind === 'oauth'
            ? `Verbindung von ${tokenLabel(pending)} beenden?`
            : `Token „${pending ? tokenLabel(pending) : ''}“ widerrufen?`
        }
        description={
          pending?.kind === 'oauth'
            ? 'Die App verliert den Zugriff sofort und muss sich neu anmelden, wenn sie wieder lesen soll.'
            : 'Wer dieses Token hat, kann damit sofort nichts mehr lesen. Das lässt sich nicht rückgängig machen.'
        }
        confirmLabel={pending?.kind === 'oauth' ? 'Verbindung beenden' : 'Widerrufen'}
        cancelLabel="Abbrechen"
        onConfirm={() => pending && void revoke(pending)}
      />
    </>
  );
}

function tokenLabel(token: AdminApiToken): string {
  return token.kind === 'oauth'
    ? displayClientName(token.clientName)
    : (token.name ?? 'Ohne Namen');
}

function TokenRow({
  token,
  expired,
  onRevoke,
}: {
  token: AdminApiToken;
  expired: boolean;
  onRevoke: () => void;
}) {
  const oauth = token.kind === 'oauth';
  const Icon = oauth ? Plug : KeyRound;

  return (
    <li className="border-border/60 bg-card/40 flex items-start gap-3 rounded-lg border px-3 py-2.5">
      <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="min-w-0 truncate font-medium">{tokenLabel(token)}</span>
          <Chip tone={oauth ? 'primary' : 'muted'}>{oauth ? 'Verbindung' : 'Token'}</Chip>
          {expired && <Chip tone="danger">abgelaufen</Chip>}
        </p>
        <p className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          <code className={SYSTEM_MONO}>{token.prefix}…</code>
          <span>erstellt {ago(token.createdAt)}</span>
          <span>
            {token.lastUsedAt ? `zuletzt genutzt ${ago(token.lastUsedAt)}` : 'nie genutzt'}
          </span>
          <span title={token.expiresAt ?? undefined}>
            {token.expiresAt
              ? `${expired ? 'abgelaufen' : 'läuft ab'} ${ago(token.expiresAt)}`
              : 'läuft nie ab'}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onRevoke}
        aria-label={`${tokenLabel(token)} ${oauth ? 'beenden' : 'widerrufen'}`}
        className="text-muted-foreground hover:text-destructive -mr-1 shrink-0 rounded p-1.5 max-sm:p-3"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
