'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { AtSign, Loader2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AUTH_FIELD_CLASS, AuthField } from '@/components/common/auth-card';
import { AccountSection, FormNote } from '@/components/account/account-section';
import { ACCOUNT_QUERY_KEY } from '@/lib/account/member';
import { updateDisplayName } from '@/lib/account/manage';
import type { AccountOverview } from '@/lib/account/sync';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';

/** The member's name, which they can change, the address, and since when the account exists. */
export function AccountProfile({ account }: { account: AccountOverview['account'] }) {
  const t = useTranslations('account.profile');
  const locale = useLocale();
  const client = useQueryClient();
  const date = getDateTimeFormat(locale, { dateStyle: 'medium' });
  const moment = getDateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const [name, setName] = useState(account.displayName);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const changed = name.trim().length > 0 && name.trim() !== account.displayName;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!changed || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const { account: saved } = await updateDisplayName(name.trim());
      client.setQueryData<AccountOverview>(ACCOUNT_QUERY_KEY, (current) =>
        current
          ? { ...current, account: { ...current.account, displayName: saved.displayName } }
          : current
      );
      setNote({ tone: 'ok', text: t('saved') });
    } catch {
      setNote({ tone: 'error', text: t('failed') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountSection icon={UserRound} title={t('title')}>
      <form onSubmit={(event) => void save(event)} className="space-y-4">
        <AuthField label={t('name')} htmlFor="account-name" icon={UserRound}>
          <input
            id="account-name"
            autoComplete="name"
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={cn(AUTH_FIELD_CLASS, 'pl-10')}
          />
        </AuthField>
        <AuthField label={t('email')} htmlFor="account-email" icon={AtSign} hint={t('emailHint')}>
          <input
            id="account-email"
            value={account.email}
            readOnly
            className={cn(AUTH_FIELD_CLASS, 'text-muted-foreground pl-10')}
          />
        </AuthField>
        {note && <FormNote tone={note.tone}>{note.text}</FormNote>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {t('memberSince', { date: date.format(new Date(account.createdAt)) })}
            {account.lastLoginAt &&
              ` · ${t('lastLogin', { date: moment.format(new Date(account.lastLoginAt)) })}`}
          </p>
          <Button type="submit" size="sm" disabled={!changed || busy} className="gap-1.5">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </form>
    </AccountSection>
  );
}
