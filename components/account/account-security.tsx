'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, LogOut, Monitor, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AUTH_FIELD_CLASS, AuthField, AuthPasswordField } from '@/components/common/auth-card';
import { MIN_PASSWORD, usePasswordLabels } from '@/components/common/self-service-auth';
import { AccountSection, FormNote } from '@/components/account/account-section';
import { ACCOUNT_QUERY_KEY, useAccountSignOut } from '@/lib/account/member';
import {
  beginTwoFactor,
  changePassword,
  confirmTwoFactor,
  disableTwoFactor,
  endSession,
  listSessions,
  signOutEverywhere,
} from '@/lib/account/manage';
import type { AccountOverview } from '@/lib/account/sync';
import { SessionApiError } from '@/lib/admin/session-client';
import { normalizeTotpCode, TOTP_CODE_LENGTH } from '@/lib/admin/totp';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';

/** What went wrong, in the member's words: a wrong password, too many tries, or anything else. */
function useErrorText() {
  const t = useTranslations('account.security');
  return (error: unknown) => {
    if (error instanceof SessionApiError && error.status === 401) return t('wrongPassword');
    if (error instanceof SessionApiError && error.status === 429) return t('tooMany');
    if (error instanceof SessionApiError && error.status === 400) return t('rejected');
    return t('failed');
  };
}

/** Changes the password: the current one, the new one twice. Other devices are signed out. */
function PasswordForm() {
  const t = useTranslations('account.security');
  const labels = usePasswordLabels();
  const errorText = useErrorText();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const mismatch = repeat.length > 0 && repeat !== next;
  const ready = current.length > 0 && next.length >= MIN_PASSWORD && next === repeat;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setNote(null);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setRepeat('');
      setNote({ tone: 'ok', text: t('passwordChanged') });
    } catch (error) {
      setNote({ tone: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <h3 className="text-sm font-semibold">{t('passwordTitle')}</h3>
      <AuthPasswordField
        id="account-current-password"
        label={t('currentPassword')}
        labels={labels}
        autoComplete="current-password"
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
      />
      <AuthPasswordField
        id="account-new-password"
        label={t('newPassword')}
        hint={t('passwordHint', { min: MIN_PASSWORD })}
        labels={labels}
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        maxLength={256}
        value={next}
        onChange={(event) => setNext(event.target.value)}
      />
      <AuthPasswordField
        id="account-repeat-password"
        label={t('repeatPassword')}
        hint={mismatch ? t('mismatch') : undefined}
        labels={labels}
        autoComplete="new-password"
        value={repeat}
        aria-invalid={mismatch || undefined}
        onChange={(event) => setRepeat(event.target.value)}
      />
      {note && <FormNote tone={note.tone}>{note.text}</FormNote>}
      <Button type="submit" size="sm" disabled={!ready || busy} className="gap-1.5">
        {busy && <Loader2 className="size-4 animate-spin" />}
        {t('changePassword')}
      </Button>
    </form>
  );
}

/** The six-digit code from the authenticator app. */
function CodeField({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const t = useTranslations('account.security');
  return (
    <AuthField label={t('code')} htmlFor="account-totp-code" icon={ShieldCheck}>
      <input
        id="account-totp-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={TOTP_CODE_LENGTH}
        value={value}
        onChange={(event) => onChange(normalizeTotpCode(event.target.value))}
        className={cn(AUTH_FIELD_CLASS, 'pl-10 tracking-[0.3em]')}
      />
    </AuthField>
  );
}

/**
 * The optional second factor: set up with the password, a secret for the app and a first code;
 * turned off with the password and a current code.
 */
function TwoFactor({ enabled }: { enabled: boolean }) {
  const t = useTranslations('account.security');
  const labels = usePasswordLabels();
  const errorText = useErrorText();
  const client = useQueryClient();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [enrolment, setEnrolment] = useState<{ secret: string; uri: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  /** Runs one step, then shows what came of it; `done` is the text for success. */
  async function step(run: () => Promise<unknown>, done?: string) {
    setBusy(true);
    setNote(null);
    try {
      await run();
      if (done) setNote({ tone: 'ok', text: done });
    } catch (error) {
      setNote({
        tone: 'error',
        text:
          error instanceof SessionApiError && error.status === 400
            ? t('codeWrong')
            : errorText(error),
      });
    } finally {
      setBusy(false);
    }
  }

  const setEnabled = (value: boolean) =>
    client.setQueryData<AccountOverview>(ACCOUNT_QUERY_KEY, (current) =>
      current ? { ...current, account: { ...current.account, totpEnabled: value } } : current
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ShieldCheck className="size-4 text-emerald-500" aria-hidden />
        ) : (
          <ShieldOff className="text-muted-foreground size-4" aria-hidden />
        )}
        <h3 className="text-sm font-semibold">{t('twoFactorTitle')}</h3>
        <span className="text-muted-foreground text-xs">
          {enabled ? t('twoFactorOn') : t('twoFactorOff')}
        </span>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{t('twoFactorIntro')}</p>

      {!enabled && !enrolment && (
        <>
          <AuthPasswordField
            id="account-totp-password"
            label={t('currentPassword')}
            labels={labels}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || password.length === 0}
            onClick={() =>
              void step(async () => {
                setEnrolment(await beginTwoFactor(password));
                setPassword('');
              })
            }
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t('setUp')}
          </Button>
        </>
      )}

      {enrolment && (
        <>
          <p className="text-muted-foreground text-sm">{t('secretHint')}</p>
          <code className="border-border/60 bg-muted/40 block rounded-xl border px-3 py-2 font-mono text-sm tracking-wider break-all">
            {enrolment.secret}
          </code>
          <a href={enrolment.uri} className="text-primary text-sm underline underline-offset-2">
            {t('openApp')}
          </a>
          <CodeField value={code} onChange={setCode} />
          <Button
            size="sm"
            disabled={busy || code.length !== TOTP_CODE_LENGTH}
            onClick={() =>
              void step(async () => {
                await confirmTwoFactor(code);
                setEnrolment(null);
                setCode('');
                setEnabled(true);
              }, t('enabled'))
            }
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t('confirmCode')}
          </Button>
        </>
      )}

      {enabled && (
        <>
          <AuthPasswordField
            id="account-totp-off-password"
            label={t('currentPassword')}
            labels={labels}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <CodeField value={code} onChange={setCode} />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || password.length === 0 || code.length !== TOTP_CODE_LENGTH}
            onClick={() =>
              void step(async () => {
                await disableTwoFactor(password, code);
                setPassword('');
                setCode('');
                setEnabled(false);
              }, t('disabled'))
            }
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t('turnOff')}
          </Button>
        </>
      )}

      {note && <FormNote tone={note.tone}>{note.text}</FormNote>}
    </div>
  );
}

/** Where the account is signed in, each device ended on its own, or all at once. */
function Sessions() {
  const t = useTranslations('account.security');
  const locale = useLocale();
  const signOut = useAccountSignOut();
  const moment = getDateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const sessions = useQuery({ queryKey: ['account', 'sessions'], queryFn: listSessions });
  const [failed, setFailed] = useState(false);

  async function end(id: string) {
    setFailed(false);
    try {
      await endSession(id);
      await sessions.refetch();
    } catch {
      setFailed(true);
    }
  }

  async function everywhere() {
    setFailed(false);
    try {
      await signOutEverywhere();
    } catch {
      setFailed(true);
      return;
    }
    await signOut();
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t('sessionsTitle')}</h3>
      {sessions.isPending ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : (
        <ul className="space-y-2">
          {(sessions.data ?? []).map((session) => (
            <li
              key={session.id}
              className="border-border/60 bg-background/40 flex items-center gap-3 rounded-2xl border px-3 py-2.5"
            >
              <Monitor className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {session.userAgent ?? t('unknownDevice')}
                  {session.current && (
                    <span className="text-primary ml-2 text-xs font-medium">{t('thisDevice')}</span>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t('lastActive', { when: moment.format(new Date(session.lastSeenAt)) })}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('endSession')}
                  onClick={() => void end(session.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {failed && <FormNote tone="error">{t('failed')}</FormNote>}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-muted-foreground text-xs leading-relaxed">{t('everywhereHint')}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void everywhere()}>
          <LogOut className="size-4" />
          {t('everywhere')}
        </Button>
      </div>
    </div>
  );
}

/** Password, second factor and sessions, in one area of the account page. */
export function AccountSecurity({ account }: { account: AccountOverview['account'] }) {
  const t = useTranslations('account.security');
  return (
    <AccountSection icon={KeyRound} title={t('title')} lead={t('lead')}>
      <PasswordForm />
      <div className="border-border/60 border-t pt-5">
        <TwoFactor enabled={account.totpEnabled} />
      </div>
      <div className="border-border/60 border-t pt-5">
        <Sessions />
      </div>
    </AccountSection>
  );
}
