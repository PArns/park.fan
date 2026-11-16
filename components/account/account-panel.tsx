'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Database,
  Heart,
  KeyRound,
  LogOut,
  RefreshCw,
  Thermometer,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { IconFigure } from '@/components/common/icon-figure';
import {
  AUTH_CARD_CLASS,
  AuthCardHairline,
  AuthPasswordField,
} from '@/components/common/auth-card';
import { MemberPage } from '@/components/account/members-only';
import { useRouter } from '@/i18n/navigation';
import { ACCOUNT_QUERY_KEY } from '@/lib/account/member';
import { listAccountKeys } from '@/lib/account/storage';
import { sessionCall, SessionApiError } from '@/lib/admin/session-client';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { AccountOverview } from '@/lib/account/sync';

/**
 * A member's account page: what follows them across devices (favorites, ridden rides, the
 * temperature unit) and what members-only features stored for them, a sync on demand, signing out
 * and deleting the account. A members-only page (`MemberPage`); a guest goes to `/login`.
 */
export function AccountPanel() {
  return <MemberPage>{({ overview }) => <AccountDetails overview={overview} />}</MemberPage>;
}

function AccountDetails({ overview }: { overview: AccountOverview }) {
  const t = useTranslations('account');
  const tAuth = useTranslations('accountAuth');
  const locale = useLocale();
  const router = useRouter();
  const client = useQueryClient();
  const number = getNumberFormat(locale);
  const moment = getDateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const stored = useQuery({ queryKey: ['account', 'storage'], queryFn: listAccountKeys });

  async function syncNow() {
    setSyncing(true);
    try {
      const { syncAccountNow } = await import('@/lib/account/sync');
      client.setQueryData(ACCOUNT_QUERY_KEY, await syncAccountNow());
    } catch {
      // A lost session shows as the sign-in on the next render of a members-only page.
      await client.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY });
    } finally {
      setSyncing(false);
    }
  }

  async function signOut() {
    const { endAccountSync } = await import('@/lib/account/sync');
    endAccountSync();
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);
    client.removeQueries({ queryKey: ['account'] });
    router.replace('/');
  }

  async function deleteAccount() {
    setDeleteError(null);
    try {
      await sessionCall('/api/account', { method: 'DELETE', body: { password } });
    } catch (error) {
      setDeleteError(
        error instanceof SessionApiError && error.signedOut
          ? t('delete.wrongPassword')
          : t('delete.failed')
      );
      return;
    }
    setPassword('');
    await signOut();
  }

  const { account, data } = overview;
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
          <IconFigure
            icon={Heart}
            label={t('figures.parks')}
            value={number.format(favorites.parks.length)}
          />
          <IconFigure icon={Heart} label={t('figures.rides')} value={number.format(rides)} />
          <IconFigure
            icon={CheckCircle2}
            label={t('figures.ridden')}
            value={number.format(data.riddenRides.length)}
          />
          <IconFigure
            icon={Thermometer}
            label={t('figures.unit')}
            value={data.temperatureUnit ? `°${data.temperatureUnit}` : t('figures.unitNone')}
          />
          <IconFigure
            icon={Database}
            label={t('figures.stored')}
            value={stored.data ? number.format(stored.data.items.length) : '–'}
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
            onClick={() => void syncNow()}
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
