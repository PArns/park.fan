'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Database,
  Download,
  Heart,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Thermometer,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { IconFigure } from '@/components/common/icon-figure';
import { AuthPasswordField } from '@/components/common/auth-card';
import { usePasswordLabels } from '@/components/common/self-service-auth';
import { MemberPage } from '@/components/account/members-only';
import { AccountSection, FormNote } from '@/components/account/account-section';
import { AccountProfile } from '@/components/account/account-profile';
import { AccountSecurity } from '@/components/account/account-security';
import { ACCOUNT_QUERY_KEY, useAccountSignOut } from '@/lib/account/member';
import { downloadAccountExport } from '@/lib/account/manage';
import { listAccountKeys } from '@/lib/account/storage';
import { sessionCall, SessionApiError } from '@/lib/admin/session-client';
import { getDateTimeFormat, getNumberFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import type { AccountOverview } from '@/lib/account/sync';

/**
 * A member's account page, a members-only page (`MemberPage`; a guest goes to `/login`): the
 * profile, what follows the member across devices, password, second factor and sessions, the
 * export of everything stored, signing out and deleting the account.
 */
export function AccountPanel() {
  return <MemberPage>{({ overview }) => <AccountDetails overview={overview} />}</MemberPage>;
}

function AccountDetails({ overview }: { overview: AccountOverview }) {
  const t = useTranslations('account');
  const signOut = useAccountSignOut();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void signOut()}>
          <LogOut className="size-4" />
          {t('signOut')}
        </Button>
      </div>
      <AccountProfile account={overview.account} />
      <AccountSync data={overview.data} />
      <AccountSecurity account={overview.account} />
      <AccountData />
      <AccountDeletion onDeleted={signOut} />
    </div>
  );
}

/** What follows the member across devices, and a sync on demand. */
function AccountSync({ data }: { data: AccountOverview['data'] }) {
  const t = useTranslations('account');
  const locale = useLocale();
  const client = useQueryClient();
  const number = getNumberFormat(locale);
  const moment = getDateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const [syncing, setSyncing] = useState(false);
  const favorites = data.favorites;
  const rides =
    favorites.attractions.length + favorites.shows.length + favorites.restaurants.length;

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

  return (
    <AccountSection icon={RefreshCw} title={t('syncTitle')} lead={t('whatSyncs')}>
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
    </AccountSection>
  );
}

/** What members-only features stored, and the export of everything. */
function AccountData() {
  const t = useTranslations('account.data');
  const locale = useLocale();
  const number = getNumberFormat(locale);
  const stored = useQuery({ queryKey: ['account', 'storage'], queryFn: listAccountKeys });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function exportAll() {
    setBusy(true);
    setFailed(false);
    try {
      await downloadAccountExport();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountSection icon={Database} title={t('title')} lead={t('lead')}>
      <IconFigure
        icon={Database}
        label={t('stored')}
        value={stored.data ? number.format(stored.data.items.length) : '–'}
      />
      {failed && <FormNote tone="error">{t('failed')}</FormNote>}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={busy}
        onClick={() => void exportAll()}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        {t('export')}
      </Button>
    </AccountSection>
  );
}

/** Deleting the account for good, confirmed with the password. */
function AccountDeletion({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const t = useTranslations('account.delete');
  const tAuth = useTranslations('accountAuth');
  const passwordLabels = usePasswordLabels();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setError(null);
    try {
      await sessionCall('/api/account', { method: 'DELETE', body: { password } });
    } catch (failure) {
      setError(
        failure instanceof SessionApiError && failure.signedOut ? t('wrongPassword') : t('failed')
      );
      return;
    }
    setPassword('');
    await onDeleted();
  }

  return (
    <AccountSection icon={Trash2} title={t('title')} lead={t('body')} tone="danger">
      {error && <FormNote tone="error">{error}</FormNote>}
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
        {t('open')}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPassword('');
        }}
        icon={KeyRound}
        tone="destructive"
        title={t('confirmTitle')}
        description={t('confirmBody')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        confirmDisabled={password.length === 0}
        onConfirm={() => void remove()}
      >
        <AuthPasswordField
          id="account-delete-password"
          label={tAuth('password')}
          labels={passwordLabels}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </ConfirmDialog>
    </AccountSection>
  );
}
