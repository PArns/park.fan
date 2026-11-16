'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TurnstileWidget, type TurnstileHandle } from '@/components/common/turnstile-widget';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';

/** The shortest password the API accepts. */
const MIN_PASSWORD = 12;

/** A labelled input row. */
function Row({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

/** Signs in with an existing account, through the admin's session route. */
function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useTranslations('developers.auth');
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
      <Row id="dev-login-email" label={t('email')}>
        <Input
          id="dev-login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Row>
      <Row id="dev-login-password" label={t('password')}>
        <Input
          id="dev-login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Row>
      {needsTotp && (
        <Row id="dev-login-totp" label={t('totp')} hint={t('totpHint')}>
          <Input
            id="dev-login-totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </Row>
      )}
      <TurnstileWidget
        ref={turnstile}
        action={TURNSTILE_ACTIONS.adminLogin}
        onVerify={setToken}
        onExpire={() => setToken('')}
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full gap-2" disabled={busy || !token}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        {t('signIn')}
      </Button>
    </form>
  );
}

/** Creates a developer account and signs it in. */
function RegisterForm({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useTranslations('developers.auth');
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
      const response = await fetch('/api/developers/register', {
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
      <Row id="dev-register-name" label={t('displayName')}>
        <Input
          id="dev-register-name"
          autoComplete="name"
          maxLength={120}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Row>
      <Row id="dev-register-email" label={t('email')} hint={t('emailHint')}>
        <Input
          id="dev-register-email"
          type="email"
          autoComplete="email"
          maxLength={320}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Row>
      <Row
        id="dev-register-password"
        label={t('password')}
        hint={t('passwordHint', { min: MIN_PASSWORD })}
      >
        <Input
          id="dev-register-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          maxLength={256}
          value={password}
          aria-invalid={passwordShort || undefined}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Row>
      <TurnstileWidget
        ref={turnstile}
        action={TURNSTILE_ACTIONS.developerRegister}
        onVerify={setToken}
        onExpire={() => setToken('')}
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full gap-2"
        disabled={busy || !token || password.length < MIN_PASSWORD || !email.includes('@')}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {t('register.submit')}
      </Button>
    </form>
  );
}

/**
 * The dashboard's door: sign in with an account, or create one. A new account is a developer
 * account, which sees its own keys and requests and nothing of the admin.
 */
export function DeveloperAuth({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useTranslations('developers.auth');
  return (
    <Card className="mx-auto max-w-md">
      <CardContent>
        <Tabs defaultValue="register">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="register">{t('registerTab')}</TabsTrigger>
            <TabsTrigger value="login">{t('loginTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="register">
            <RegisterForm onSignedIn={onSignedIn} />
          </TabsContent>
          <TabsContent value="login">
            <LoginForm onSignedIn={onSignedIn} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
