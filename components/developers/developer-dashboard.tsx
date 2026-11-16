'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  FileText,
  Gauge,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { cn } from '@/lib/utils';
import {
  DeveloperApiError,
  fetchDeveloperOverview,
  usageTotals,
  withdrawKeyRequest,
  type DeveloperOverview,
} from '@/lib/developers/dashboard';
import { requestedPermissions, type KeyRequestRecord } from '@/lib/developers/key-request';
import { DeveloperAuth } from './developer-auth';
import { DeveloperKeyCard } from './developer-key-card';
import { KeyRequestForm } from './key-request-form';

type Load =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'error' }
  | { status: 'ready'; data: DeveloperOverview };

/** One figure of the dashboard's head. */
function Tile({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** One of the developer's requests: its project, state, tier, and the owner's answer. */
function RequestRow({
  request,
  onWithdraw,
}: {
  request: KeyRequestRecord;
  onWithdraw: () => void;
}) {
  const t = useTranslations('developers.dashboard');
  const tPerm = useTranslations('developers.permissions');
  const locale = useLocale();
  const date = getDateTimeFormat(locale, { dateStyle: 'medium' });
  return (
    <li className="border-border/70 space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{request.projectName}</span>
        <Badge variant={request.status === 'approved' ? 'default' : 'outline'}>
          {t(`requestState.${request.status}`)}
        </Badge>
        <Badge variant="secondary">{t(`tier.${request.tier}`)}</Badge>
        <span className="text-muted-foreground ml-auto text-xs">
          {date.format(new Date(request.createdAt))}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        {requestedPermissions(request)
          .map((permission) => tPerm(`items.${permission}.title`))
          .join(' · ')}
      </p>
      {request.decisionNote && (
        <p className="bg-muted/60 rounded-md p-3 text-sm leading-relaxed whitespace-pre-line">
          {request.decisionNote}
        </p>
      )}
      {request.status === 'pending' && (
        <Button size="sm" variant="ghost" onClick={onWithdraw}>
          {t('withdraw')}
        </Button>
      )}
    </li>
  );
}

/**
 * The developer dashboard: sign-in or registration, then the account's keys with their figures
 * and actions, its requests, and the form for a new one. Everything comes from the session proxy
 * `/api/developer/*`; a 401 there means nobody is signed in.
 */
export function DeveloperDashboard() {
  const t = useTranslations('developers.dashboard');
  const locale = useLocale();
  const number = getNumberFormat(locale);
  const now = useMinuteNow();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [requesting, setRequesting] = useState(false);
  const [filed, setFiled] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoad({ status: 'ready', data: await fetchDeveloperOverview() });
    } catch (err) {
      setLoad({
        status: err instanceof DeveloperApiError && err.status === 401 ? 'signed-out' : 'error',
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);
    setLoad({ status: 'signed-out' });
  }

  if (load.status === 'loading') {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label={t('loading')} />
      </div>
    );
  }

  if (load.status === 'signed-out') {
    return <DeveloperAuth onSignedIn={() => void refresh()} />;
  }

  if (load.status === 'error') {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="space-y-4 text-center">
          <p>{t('loadFailed')}</p>
          <Button variant="outline" className="gap-1.5" onClick={() => void refresh()}>
            <RefreshCw className="size-4" />
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { account, keys, requests } = load.data;
  const totals = usageTotals(keys);
  const activeKeys = keys.filter((key) => !key.revokedAt);
  const pending = requests.filter((request) => request.status === 'pending');

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">{t('signedInAs', { email: account.email })}</p>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto gap-1.5"
          onClick={() => void signOut()}
        >
          <LogOut className="size-4" />
          {t('signOut')}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={KeyRound} label={t('tiles.keys')} value={number.format(activeKeys.length)} />
        <Tile icon={Timer} label={t('tiles.thisHour')} value={number.format(totals.thisHour)} />
        <Tile icon={Activity} label={t('tiles.today')} value={number.format(totals.today)} />
        <Tile icon={Gauge} label={t('tiles.last30')} value={number.format(totals.last30Days)} />
      </div>

      <section aria-labelledby="dev-keys" className="space-y-4">
        <ChapterHeading id="dev-keys" icon={KeyRound} title={t('keysTitle')} />
        {keys.length === 0 ? (
          <p className="text-muted-foreground">{t('noKeys')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {keys.map((key) => (
              <DeveloperKeyCard
                key={key.id}
                apiKey={key}
                nowMs={now ?? Date.parse(key.createdAt)}
                onChanged={() => void refresh()}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="dev-requests" className="space-y-4">
        <ChapterHeading
          id="dev-requests"
          icon={FileText}
          title={t('requestsTitle')}
          action={
            !requesting && (
              <Button size="sm" className="gap-1.5" onClick={() => setRequesting(true)}>
                <Plus className="size-4" />
                {t('newRequest')}
              </Button>
            )
          }
        />
        {filed && (
          <p
            role="status"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm"
          >
            {t('filed')}
          </p>
        )}
        {requesting && (
          <KeyRequestForm
            onFiled={() => {
              setRequesting(false);
              setFiled(true);
              void refresh();
            }}
          />
        )}
        {requests.length === 0 && !requesting ? (
          <p className="text-muted-foreground">{t('noRequests')}</p>
        ) : (
          <ul className={cn('space-y-3', requesting && 'pt-4')}>
            {requests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                onWithdraw={() => void withdrawKeyRequest(request.id).then(refresh)}
              />
            ))}
          </ul>
        )}
        {pending.length > 0 && <p className="text-muted-foreground text-xs">{t('pendingHint')}</p>}
      </section>
    </div>
  );
}
