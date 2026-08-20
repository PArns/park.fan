'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, Lock, ShieldCheck, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, adminKeys, AdminApiError } from '../_lib/api';
import { Field, TextInput } from '../_ui/controls';

type LoginResponse =
  | { status: 'ok' }
  | { status: 'totp-required' }
  | { status: 'locked' | 'rate-limited'; retryAfterSeconds: number };

/**
 * The way in.
 *
 * Three states rather than the usual two, because the backend distinguishes
 * three and flattening them would cost the person at the keyboard the only
 * clue they get: a wrong password, a second factor that is simply not supplied
 * yet, and a lockout that waiting will fix. The third is the one worth the
 * extra branch — a form that answers "invalid credentials" to a locked account
 * invites the exact behaviour that locked it.
 */
export function LoginScreen() {
  const client = useQueryClient();
  const emailRef = useRef<HTMLInputElement>(null);
  const totpRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedFor, setLockedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (needsTotp) totpRef.current?.focus();
  }, [needsTotp]);

  // Counts the lockout down rather than showing a static number: a page that
  // says "try again in 900 seconds" and never changes reads as broken.
  useEffect(() => {
    if (lockedFor === null || lockedFor <= 0) return;
    const timer = setInterval(() => {
      setLockedFor((seconds) => (seconds === null || seconds <= 1 ? null : seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedFor]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || lockedFor !== null) return;

    setBusy(true);
    setError(null);

    try {
      const result = await adminFetch<LoginResponse>('/api/admin/session', {
        method: 'POST',
        body: {
          email: email.trim(),
          password,
          ...(needsTotp && totpCode ? { totpCode: totpCode.trim() } : {}),
        },
      });

      if (result.status === 'totp-required') {
        setNeedsTotp(true);
        return;
      }
      if (result.status === 'locked' || result.status === 'rate-limited') {
        setLockedFor(result.retryAfterSeconds);
        setError(
          result.status === 'locked'
            ? 'Dieses Konto ist nach mehreren Fehlversuchen vorübergehend gesperrt.'
            : 'Zu viele Versuche. Bitte kurz warten.'
        );
        return;
      }

      await client.invalidateQueries({ queryKey: adminKeys.session });
    } catch (err) {
      const message =
        err instanceof AdminApiError && err.status !== 401
          ? err.message
          : 'E-Mail oder Passwort stimmt nicht.';
      setError(message);
      setPassword('');
      setTotpCode('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-primary/15 border-primary/20 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
            <ShieldCheck className="text-primary h-7 w-7" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              park.fan
            </p>
            <h1 className="text-2xl font-bold">Admin</h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-border/60 bg-card/70 space-y-4 rounded-xl border p-5 backdrop-blur-sm"
        >
          {!needsTotp ? (
            <>
              <Field label="E-Mail" htmlFor="admin-email">
                <TextInput
                  id="admin-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field label="Passwort" htmlFor="admin-password">
                <div className="relative">
                  <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <TextInput
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    className="pl-9"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </Field>
            </>
          ) : (
            <Field
              label="Bestätigungscode"
              htmlFor="admin-totp"
              hint="Sechs Ziffern aus deiner Authenticator-App."
            >
              <TextInput
                id="admin-totp"
                ref={totpRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="text-center text-lg tracking-[0.4em] tabular-nums"
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
                required
              />
            </Field>
          )}

          {error && (
            <p className="bg-destructive/10 border-destructive/30 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {lockedFor !== null && (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Timer className="h-3.5 w-3.5" />
              Wieder möglich in {formatCountdown(lockedFor)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy || lockedFor !== null}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {needsTotp ? 'Bestätigen' : 'Anmelden'}
          </Button>

          {needsTotp && (
            <button
              type="button"
              onClick={() => {
                setNeedsTotp(false);
                setTotpCode('');
                setError(null);
              }}
              className="text-muted-foreground hover:text-foreground w-full text-center text-xs"
            >
              Zurück
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}
