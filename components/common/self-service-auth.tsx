'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, AtSign, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TurnstileWidget, type TurnstileHandle } from '@/components/common/turnstile-widget';
import {
  AUTH_CARD_CLASS,
  AUTH_FIELD_CLASS,
  AuthCardHairline,
  AuthField,
  AuthFormHeading,
  AuthPasswordField,
} from '@/components/common/auth-card';
import { TURNSTILE_ACTIONS, type TurnstileAction } from '@/lib/security/turnstile-actions';
import { cn } from '@/lib/utils';

/** The shortest password the API accepts. */
const MIN_PASSWORD = 12;

/** What a sign-in looks like where it is used: the endpoint a new account goes to, and the words. */
export interface SelfServiceAuthProps {
  /** The app's registration route: `/api/developers/register` or `/api/account/register`. */
  registerEndpoint: string;
  /** The Turnstile action that route verifies. */
  registerAction: TurnstileAction;
  /** The card's title and line on each tab, in the caller's words. */
  copy: {
    registerTitle: string;
    registerLead: ReactNode;
    loginTitle: string;
    loginLead: ReactNode;
  };
  onSignedIn: () => void;
}

/** The password field's labels, from the shared namespace. */
function usePasswordLabels() {
  const t = useTranslations('accountAuth');
  return { show: t('showPassword'), hide: t('hidePassword'), capsLock: t('capsLock') };
}

/** The error line under a form, read out when it appears. */
function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-destructive text-sm">
      {children}
    </p>
  );
}

/** The submit button: an arrow at rest, a spinner while the request runs. */
function SubmitButton({
  busy,
  disabled,
  children,
}: {
  busy: boolean;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <Button type="submit" className="h-11 w-full gap-2 rounded-xl" disabled={busy || disabled}>
      {children}
      {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
    </Button>
  );
}

/** Signs in with an existing account, through the admin's session route. */
function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useTranslations('accountAuth');
  const labels = usePasswordLabels();
  const turnstile = useRef<TurnstileHandle>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !token) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          turnstileToken: token,
          ...(needsTotp && totpCode ? { totpCode } : {}),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { status?: string };
      if (response.ok && data.status === 'ok') return onSignedIn();
      if (response.ok && data.status === 'totp-required') setNeedsTotp(true);
      else if (response.ok) setError(t('errorLocked'));
      else setError(response.status === 403 ? t('errorTurnstile') : t('errorCredentials'));
    } catch {
      setError(t('errorNetwork'));
    } finally {
      setBusy(false);
      setToken('');
      turnstile.current?.reset();
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <AuthField label={t('email')} htmlFor="self-login-email" icon={AtSign}>
        <input
          id="self-login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={cn(AUTH_FIELD_CLASS, 'pl-10')}
        />
      </AuthField>
      <AuthPasswordField
        id="self-login-password"
        label={t('password')}
        labels={labels}
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {needsTotp && (
        <AuthField
          label={t('totp')}
          htmlFor="self-login-totp"
          icon={ShieldCheck}
          hint={t('totpHint')}
        >
          <input
            id="self-login-totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className={cn(AUTH_FIELD_CLASS, 'pl-10 tracking-[0.3em]')}
          />
        </AuthField>
      )}
      <TurnstileWidget
        ref={turnstile}
        action={TURNSTILE_ACTIONS.adminLogin}
        onVerify={setToken}
        onExpire={() => setToken('')}
      />
      {error && <FormError>{error}</FormError>}
      <SubmitButton busy={busy} disabled={!token}>
        {t('signIn')}
      </SubmitButton>
    </form>
  );
}

/** Creates an account through the caller's registration route and signs it in. */
function RegisterForm({
  endpoint,
  action,
  onSignedIn,
}: {
  endpoint: string;
  action: TurnstileAction;
  onSignedIn: () => void;
}) {
  const t = useTranslations('accountAuth');
  const labels = usePasswordLabels();
  const turnstile = useRef<TurnstileHandle>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordShort = password.length > 0 && password.length < MIN_PASSWORD;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !token || password.length < MIN_PASSWORD) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password, turnstileToken: token }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.ok) return onSignedIn();
      const code = data.error ?? 'generic';
      setError(t.has(`register.${code}`) ? t(`register.${code}`) : t('register.generic'));
    } catch {
      setError(t('errorNetwork'));
    } finally {
      setBusy(false);
      setToken('');
      turnstile.current?.reset();
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <AuthField label={t('displayName')} htmlFor="self-register-name" icon={UserRound}>
        <input
          id="self-register-name"
          autoComplete="name"
          maxLength={120}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={cn(AUTH_FIELD_CLASS, 'pl-10')}
        />
      </AuthField>
      <AuthField
        label={t('email')}
        htmlFor="self-register-email"
        icon={AtSign}
        hint={t('emailHint')}
      >
        <input
          id="self-register-email"
          type="email"
          autoComplete="email"
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={cn(AUTH_FIELD_CLASS, 'pl-10')}
        />
      </AuthField>
      <AuthPasswordField
        id="self-register-password"
        label={t('password')}
        hint={t('passwordHint', { min: MIN_PASSWORD })}
        labels={labels}
        autoComplete="new-password"
        minLength={MIN_PASSWORD}
        maxLength={256}
        value={password}
        aria-invalid={passwordShort || undefined}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <TurnstileWidget
        ref={turnstile}
        action={action}
        onVerify={setToken}
        onExpire={() => setToken('')}
      />
      {error && <FormError>{error}</FormError>}
      <SubmitButton
        busy={busy}
        disabled={!token || password.length < MIN_PASSWORD || !email.includes('@')}
      >
        {t('register.submit')}
      </SubmitButton>
    </form>
  );
}

/**
 * The door to an account somebody opens for themselves: create one, or sign in. A developer's
 * account sees its own keys and requests, a visitor's its own synced state; neither sees anything
 * of the admin. Styled like the admin's login (`components/common/auth-card.tsx`).
 */
export function SelfServiceAuth({
  registerEndpoint,
  registerAction,
  copy,
  onSignedIn,
}: SelfServiceAuthProps) {
  const t = useTranslations('accountAuth');
  return (
    <div className={cn(AUTH_CARD_CLASS, 'mx-auto w-full max-w-md')}>
      <AuthCardHairline />
      <Tabs defaultValue="register">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="register">{t('registerTab')}</TabsTrigger>
          <TabsTrigger value="login">{t('loginTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="register">
          <AuthFormHeading as="h2" title={copy.registerTitle}>
            {copy.registerLead}
          </AuthFormHeading>
          <RegisterForm
            endpoint={registerEndpoint}
            action={registerAction}
            onSignedIn={onSignedIn}
          />
        </TabsContent>
        <TabsContent value="login">
          <AuthFormHeading as="h2" title={copy.loginTitle}>
            {copy.loginLead}
          </AuthFormHeading>
          <LoginForm onSignedIn={onSignedIn} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
