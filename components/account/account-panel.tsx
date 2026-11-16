'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CheckCircle2,
  Heart,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Thermometer,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SelfServiceAuth } from '@/components/common/self-service-auth';
import {
  AUTH_CARD_CLASS,
  AuthCardHairline,
  AuthPasswordField,
} from '@/components/common/auth-card';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { AccountOverview } from '@/lib/account/sync';

type Load =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'error' }
  | { status: 'ready'; overview: AccountOverview };

/** One figure of what the account carries. */
function Figure({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="border-border/60 bg-background/40 flex items-center gap-3 rounded-2xl border p-4">
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/**
 * A visitor's account: sign in or create one, then see what follows them across devices
 * (favorites, ridden rides, the temperature unit), sync now, sign out, or delete the account. Every
 * call goes through the session proxy `/api/account`, and the sync itself is `lib/account/sync.ts`.
 */
export function AccountPanel() {
  const t = useTranslations('account');
  const tAuth = useTranslations('accountAuth');
  const locale = useLocale();
  const number = getNumberFormat(locale);
  const moment = getDateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const { syncAccountNow, startAccountSync, AccountSyncError } =
        await import('@/lib/account/sync');
      try {
        const overview = await syncAccountNow();
        startAccountSync();
        setLoad({ status: 'ready', overview });
      } catch (error) {
        setLoad({
          status:
            error instanceof AccountSyncError && error.status === 401 ? 'signed-out' : 'error',
        });
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  // The first round runs once the page is in the browser; it calls the API, an external system.
  useEffect(() => {
    let cancelled = false;
    void import('@/lib/account/sync').then(async ({ syncAccountNow, AccountSyncError }) => {
      try {
        const overview = await syncAccountNow();
        if (!cancelled) setLoad({ status: 'ready', overview });
      } catch (error) {
        if (cancelled) return;
        setLoad({
          status:
            error instanceof AccountSyncError && error.status === 401 ? 'signed-out' : 'error',
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    const { endAccountSync } = await import('@/lib/account/sync');
    endAccountSync();
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);
    setLoad({ status: 'signed-out' });
  }

  async function deleteAccount() {
    setDeleteError(null);
    const response = await fetch('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (!response?.ok) {
      setDeleteError(response?.status === 401 ? t('delete.wrongPassword') : t('delete.failed'));
      return;
    }
    setPassword('');
    await signOut();
  }

  if (load.status === 'loading') {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label={t('loading')} />
      </div>
    );
  }

  if (load.status === 'signed-out') {
    return (
      <SelfServiceAuth
        registerEndpoint="/api/account/register"
        registerAction={TURNSTILE_ACTIONS.accountRegister}
        copy={{
          registerTitle: t('auth.registerTitle'),
          registerLead: t('auth.registerLead'),
          loginTitle: t('auth.loginTitle'),
          loginLead: t('auth.loginLead'),
        }}
        onSignedIn={() => void sync()}
      />
    );
  }

  if (load.status === 'error') {
    return (
      <div className={cn(AUTH_CARD_CLASS, 'mx-auto max-w-md space-y-4 text-center')}>
        <AuthCardHairline />
        <p>{t('loadFailed')}</p>
        <Button variant="outline" className="gap-1.5" onClick={() => void sync()}>
          <RefreshCw className="size-4" />
          {t('retry')}
        </Button>
      </div>
    );
  }

  const { account, data } = load.overview;
  const favorites = data.favorites;
  const rides =
    favorites.attractions.length + favorites.shows.length + favorites.restaurants.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className={cn(AUTH_CARD_CLASS, 'space-y-6')}>
        <AuthCardHairline />
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{account.displayName}</p>
            <p className="text-muted-foreground truncate text-sm">{account.email}</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void signOut()}>
            <LogOut className="size-4" />
            {t('signOut')}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Figure
            icon={Heart}
            label={t('figures.parks')}
            value={number.format(favorites.parks.length)}
          />
          <Figure icon={Heart} label={t('figures.rides')} value={number.format(rides)} />
          <Figure
            icon={CheckCircle2}
            label={t('figures.ridden')}
            value={number.format(data.riddenRides.length)}
          />
          <Figure
            icon={Thermometer}
            label={t('figures.unit')}
            value={data.temperatureUnit ? `°${data.temperatureUnit}` : t('figures.unitNone')}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {data.updatedAt
              ? t('syncedAt', { when: moment.format(new Date(data.updatedAt)) })
              : t('neverSynced')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={syncing}
            onClick={() => void sync()}
          >
            <RefreshCw className={cn('size-4', syncing && 'animate-spin')} />
            {t('syncNow')}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">{t('whatSyncs')}</p>
      </div>

      <div className="border-destructive/30 rounded-3xl border p-6">
        <h2 className="font-semibold">{t('delete.title')}</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm leading-relaxed">
          {t('delete.body')}
        </p>
        {deleteError && (
          <p role="alert" className="text-destructive mb-3 text-sm">
            {deleteError}
          </p>
        )}
        <Button variant="outline" className="gap-1.5" onClick={() => setDeleting(true)}>
          <Trash2 className="size-4" />
          {t('delete.open')}
        </Button>
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open);
          if (!open) setPassword('');
        }}
        icon={KeyRound}
        tone="destructive"
        title={t('delete.confirmTitle')}
        description={t('delete.confirmBody')}
        confirmLabel={t('delete.confirm')}
        cancelLabel={t('delete.cancel')}
        confirmDisabled={password.length === 0}
        onConfirm={() => void deleteAccount()}
      >
        <AuthPasswordField
          id="account-delete-password"
          label={tAuth('password')}
          labels={{
            show: tAuth('showPassword'),
            hide: tAuth('hidePassword'),
            capsLock: tAuth('capsLock'),
          }}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
