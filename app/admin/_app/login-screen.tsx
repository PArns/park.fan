'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, ShieldCheck, Timer } from 'lucide-react';
import { adminFetch, adminKeys, AdminApiError } from '../_lib/api';
import { heroObjectPosition, pickHeroImage, type HeroImageMeta } from '@/lib/media/hero';
import { cn } from '@/lib/utils';

/** How long one photograph stays. Long enough not to flicker between visits,
 *  short enough that the admin does not become one park's login screen. */
const HERO_WINDOW_MS = 30 * 60 * 1000;

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
 *
 * The photograph behind it is not decoration for its own sake. This is the
 * admin of a site about theme parks, edited by people who go to them, and the
 * media database is right there with a rotation pool of exactly the pictures
 * the homepage uses — through `@/lib/media/hero`, the client-safe 21 KB slice,
 * never the 107 KB catalog. It is picked after mount so the server and the
 * browser cannot disagree about which one, and it fades in over a gradient
 * that carries the screen on its own if the image never arrives.
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
  const [capsLock, setCapsLock] = useState(false);

  // Picked once, after mount, in the deferred shape `useBrowserNow` uses: the
  // choice depends on the clock, so doing it during render would make the
  // server and the browser disagree about which photo — and picking it again
  // on every keystroke would crossfade the wall behind a form somebody is
  // typing into.
  const [hero, setHero] = useState<{ src: string; meta: HeroImageMeta | null } | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setHero(pickHeroImage(HERO_WINDOW_MS)), 0);
    return () => clearTimeout(id);
  }, []);

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

    const wasTotpStep = needsTotp;

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
      // On the code step it is the code that was wrong, not the password. The
      // old version said "E-Mail oder Passwort stimmt nicht" and cleared the
      // password field, so a single mistyped digit sent people back to the
      // start — and each retype counted against the account lockout.
      const message =
        err instanceof AdminApiError && err.status !== 401
          ? err.message
          : wasTotpStep
            ? 'Der Code stimmt nicht. Er wechselt alle 30 Sekunden.'
            : 'E-Mail oder Passwort stimmt nicht.';
      setError(message);
      setTotpCode('');
      if (!wasTotpStep) setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4">
      {/* The base. Renders alone until the photo has loaded, and behind it after
          — so nothing ever sits on bare background. */}
      <div
        aria-hidden="true"
        className="from-background via-background bg-[radial-gradient(120%_120%_at_50%_0%,theme(colors.primary/18%),transparent_60%)] absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="from-background/40 via-background/80 to-background absolute inset-0 bg-gradient-to-b"
      />

      {hero && (
        <>
          <Image
            src={hero.src}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectPosition: heroObjectPosition(hero.src) }}
            className="animate-in fade-in object-cover duration-1000 motion-reduce:animate-none"
          />
          {/* Two scrims, not one. A flat overlay dark enough for the form to
              read leaves the photo looking like a mistake; this keeps the top
              two thirds — where the subject usually is — nearly clear and puts
              the weight at the bottom, under the caption. The radial pass
              darkens only behind the card. */}
          <div
            aria-hidden="true"
            className="from-background via-background/70 absolute inset-0 bg-gradient-to-t to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_52%,rgba(0,0,0,0.6),transparent_75%)]"
          />
        </>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-2 relative w-full max-w-sm space-y-5 duration-500 motion-reduce:animate-none">
        <div className="space-y-3 text-center">
          <div className="border-primary/25 bg-primary/15 text-primary shadow-primary/20 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            {/* Shadowed rather than boxed: the photograph underneath is a
                different brightness every half hour, and a plate behind the
                wordmark would be a second card above the card. */}
            <h1 className="text-2xl font-bold tracking-tight drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
              park<span className="text-primary">.fan</span>
            </h1>
            <p className="mt-0.5 text-[11px] font-medium tracking-[0.25em] text-white/60 uppercase drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
              Verwaltung
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-border/60 bg-card/80 space-y-4 rounded-2xl border p-6 shadow-2xl ring-1 shadow-black/40 ring-white/5 backdrop-blur-xl"
        >
          {!needsTotp ? (
            <>
              <LoginField label="E-Mail" htmlFor="admin-email">
                <input
                  id="admin-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={FIELD_CLASS}
                />
              </LoginField>

              <LoginField label="Passwort" htmlFor="admin-password">
                <div className="relative">
                  <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyUp={(event) => setCapsLock(event.getModifierState?.('CapsLock') ?? false)}
                    required
                    className={cn(FIELD_CLASS, 'pl-9')}
                  />
                </div>
                {capsLock && (
                  <p className="mt-1.5 text-[11px] text-amber-400">Feststelltaste ist an.</p>
                )}
              </LoginField>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs leading-relaxed">
                Zweiter Faktor für <span className="text-foreground font-medium">{email}</span>.
                Sechs Ziffern aus der Authenticator-App.
              </p>
              <input
                id="admin-totp"
                ref={totpRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
                required
                aria-label="Bestätigungscode"
                className={cn(
                  FIELD_CLASS,
                  'h-12 text-center text-xl tracking-[0.5em] tabular-nums'
                )}
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border px-3 py-2 text-xs leading-relaxed"
            >
              {error}
            </p>
          )}

          {lockedFor !== null && (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Timer className="h-3.5 w-3.5" />
              Wieder möglich in {formatCountdown(lockedFor)}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || lockedFor !== null}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {needsTotp ? 'Bestätigen' : 'Anmelden'}
          </button>

          {needsTotp && (
            <button
              type="button"
              onClick={() => {
                setNeedsTotp(false);
                setTotpCode('');
                setError(null);
              }}
              className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 text-xs transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Andere Anmeldung
            </button>
          )}
        </form>
      </div>

      {/* Which park you are looking at. The same line the public hero shows,
          and the reason the photo is worth having: somebody signing in at
          seven in the morning gets Taron at night. */}
      {hero?.meta && (
        <p className="animate-in fade-in absolute right-4 bottom-4 max-w-[60vw] truncate rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-sm duration-1000 motion-reduce:animate-none">
          {[hero.meta.attractionName, hero.meta.parkName].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}

const FIELD_CLASS =
  'border-border/60 bg-background/60 focus:border-primary/60 focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2';

function LoginField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wide uppercase"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}
