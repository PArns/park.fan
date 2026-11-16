'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clipboard, ClipboardCheck, KeyRound, Loader2, RotateCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/input';
import { CodeSample, INLINE_CODE_CLASS } from '@/components/common/code';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { DataApiKey } from '@/lib/admin/api-keys';
import {
  API_PERMISSION_GROUPS,
  API_PERMISSION_GROUP_IDS,
  LEGACY_KEY_PERMISSIONS,
  apiKeyCurlExample,
  sortPermissions,
} from '@/lib/developers/permissions';
import {
  developerKeyState,
  endDeveloperKeyGrace,
  revokeDeveloperKey,
  rotateDeveloperKey,
  type RevealedKey,
} from '@/lib/developers/dashboard';

/** The grace periods a holder may give the old secret, in hours. */
const GRACE_CHOICES = [0, 1, 24, 168] as const;

/** Thirty days of requests as bars, today last; the height is the share of the busiest day. */
function UsageBars({ days, label }: { days: { date: string; requests: number }[]; label: string }) {
  const max = Math.max(1, ...days.map((day) => day.requests));
  return (
    <div role="img" aria-label={label} className="flex h-12 items-end gap-[2px]">
      {days.map((day) => (
        <span
          key={day.date}
          className={cn(
            'flex-1 rounded-sm',
            day.requests > 0 ? 'bg-primary/70' : 'bg-muted-foreground/15'
          )}
          style={{ height: `${Math.max(6, (day.requests / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/** A copy button for a value, which says for two seconds that it copied. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations('developers.dashboard');
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="gap-1.5"
      onClick={() =>
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        })
      }
    >
      {copied ? <ClipboardCheck className="size-4" /> : <Clipboard className="size-4" />}
      {copied ? t('copied') : label}
    </Button>
  );
}

/**
 * One of the developer's keys: its state, what it may read, this hour against its allowance, the
 * last thirty days, and the actions on it. A key nobody has picked up offers the pickup, which
 * shows its secret once; a picked-up one offers a new secret with a grace period for the old one,
 * and revocation.
 */
export function DeveloperKeyCard({
  apiKey,
  nowMs,
  onChanged,
}: {
  apiKey: DataApiKey;
  nowMs: number;
  onChanged: () => void;
}) {
  const t = useTranslations('developers.dashboard');
  const tPerm = useTranslations('developers.permissions');
  const locale = useLocale();
  const number = getNumberFormat(locale);
  const date = getDateTimeFormat(locale, { dateStyle: 'medium' });
  const state = developerKeyState(apiKey, nowMs);
  const permissions = sortPermissions(apiKey.permissions ?? LEGACY_KEY_PERMISSIONS);
  const days = apiKey.stats?.days ?? [];
  const total30 = days.reduce((sum, day) => sum + day.requests, 0);
  const limited30 = days.reduce((sum, day) => sum + day.limited, 0);
  const used = apiKey.requestsThisHour ?? 0;
  const limit = apiKey.requestsPerHour;
  const graceUntil =
    apiKey.previousExpiresAt && Date.parse(apiKey.previousExpiresAt) > nowMs
      ? apiKey.previousExpiresAt
      : null;

  const [revealed, setRevealed] = useState<RevealedKey | null>(null);
  const [rotating, setRotating] = useState(false);
  const [grace, setGrace] = useState<number>(24);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rotate(graceHours: number) {
    setBusy(true);
    setError(null);
    try {
      setRevealed(await rotateDeveloperKey(apiKey.id, graceHours));
      setRotating(false);
      onChanged();
    } catch {
      setError(t('actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function act(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
      onChanged();
    } catch {
      setError(t('actionFailed'));
    }
  }

  return (
    <Card className={cn('gap-4 py-5', state === 'revoked' && 'opacity-60')}>
      <CardContent className="space-y-4 px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <KeyRound className="text-primary size-5 shrink-0" aria-hidden />
          <h3 className="min-w-0 truncate text-lg font-semibold">{apiKey.name}</h3>
          <Badge variant={state === 'active' ? 'default' : 'outline'}>{t(`state.${state}`)}</Badge>
          <code className={cn(INLINE_CODE_CLASS, 'ml-auto text-xs')}>{apiKey.prefix}…</code>
        </div>

        {state === 'pickup' && (
          <div className="border-primary/30 bg-primary/[6%] flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <p className="flex-1 text-sm leading-relaxed">{t('pickupText')}</p>
            <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => void rotate(0)}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {t('pickup')}
            </Button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">{t('thisHour')}</p>
            <p className="text-lg font-semibold tabular-nums">
              {number.format(used)}
              <span className="text-muted-foreground text-sm font-normal">
                {' '}
                / {limit === null ? t('noLimit') : number.format(limit)}
              </span>
            </p>
            {limit !== null && (
              <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn('h-full', used >= limit ? 'bg-destructive' : 'bg-primary')}
                  style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%` }}
                />
              </div>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('last30')}</p>
            <p className="text-lg font-semibold tabular-nums">{number.format(total30)}</p>
            {limited30 > 0 && (
              <p className="text-destructive text-xs">
                {t('limited', { count: number.format(limited30) })}
              </p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('lastUsed')}</p>
            <p className="text-sm font-medium">
              {apiKey.lastUsedAt ? date.format(new Date(apiKey.lastUsedAt)) : t('never')}
            </p>
            <p className="text-muted-foreground text-xs">
              {apiKey.expiresAt
                ? t('validUntil', { date: date.format(new Date(apiKey.expiresAt)) })
                : t('noEnd')}
            </p>
          </div>
        </div>

        {days.length > 0 && <UsageBars days={days} label={t('usageChart')} />}

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t('permissions')}
            {apiKey.permissions === null && ` · ${t('legacy')}`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {API_PERMISSION_GROUP_IDS.flatMap((group) =>
              API_PERMISSION_GROUPS[group]
                .filter((permission) => permissions.includes(permission))
                .map((permission) => (
                  <Badge key={permission} variant="secondary" title={permission}>
                    {tPerm(`items.${permission}.title`)}
                  </Badge>
                ))
            )}
          </div>
          {apiKey.allowedParks && apiKey.allowedParks.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {t('onlyParks', { parks: apiKey.allowedParks.map((p) => p.name).join(', ') })}
            </p>
          )}
        </div>

        {graceUntil && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="flex-1">
              {t('graceRunning', { date: date.format(new Date(graceUntil)) })}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void act(() => endDeveloperKeyGrace(apiKey.id))}
            >
              {t('endGrace')}
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        {state === 'active' && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setRotating(true)}
            >
              <RotateCw className="size-4" />
              {t('rotate')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="hover:text-destructive ml-auto gap-1.5"
              onClick={() => setRevoking(true)}
            >
              <Trash2 className="size-4" />
              {t('revoke')}
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={rotating} onOpenChange={(open) => !busy && setRotating(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rotateTitle', { name: apiKey.name })}</DialogTitle>
            <DialogDescription>{t('rotateText')}</DialogDescription>
          </DialogHeader>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">{t('graceLabel')}</span>
            <NativeSelect value={grace} onChange={(e) => setGrace(Number(e.target.value))}>
              {GRACE_CHOICES.map((hours) => (
                <option key={hours} value={hours}>
                  {t(`grace.${hours}`)}
                </option>
              ))}
            </NativeSelect>
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRotating(false)} disabled={busy}>
              {t('cancel')}
            </Button>
            <Button onClick={() => void rotate(grace)} disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t('rotateConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* The secret lives in this state and nowhere else; only the button closes it. */}
      <Dialog open={revealed !== null}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t('revealedTitle')}</DialogTitle>
            <DialogDescription>{t('revealedText')}</DialogDescription>
          </DialogHeader>
          {revealed && (
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <code
                  className={cn(INLINE_CODE_CLASS, 'min-w-0 flex-1 overflow-x-auto py-2 text-sm')}
                >
                  {revealed.key}
                </code>
                <CopyButton value={revealed.key} label={t('copy')} />
              </div>
              <CodeSample>{apiKeyCurlExample(revealed.key)}</CodeSample>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setRevealed(null)}>{t('revealedDone')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={revoking}
        onOpenChange={setRevoking}
        icon={Trash2}
        tone="destructive"
        title={t('revokeTitle', { name: apiKey.name })}
        description={t('revokeText')}
        confirmLabel={t('revoke')}
        cancelLabel={t('cancel')}
        onConfirm={() => void act(() => revokeDeveloperKey(apiKey.id))}
      />
    </Card>
  );
}
