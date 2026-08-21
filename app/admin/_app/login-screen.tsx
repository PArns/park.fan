'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MapPin,
  ShieldCheck,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { adminFetch, adminKeys, AdminApiError } from '../_lib/api';
import { heroObjectPosition } from '@/lib/media/hero';
import { useHeroPhoto } from '../_lib/use-hero-photo';
import { cn } from '@/lib/utils';

/** Six empty slots. Never mutated in place — every writer copies first. */
const EMPTY_CODE: readonly string[] = ['', '', '', '', '', ''];

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
 * The photograph is the page, not a wallpaper behind a box. Centring a card on
 * a picture means scrimming the picture until it is mud exactly where the
 * subject is, and the result was a grey rectangle floating on a smear. So the
 * form sits in a column on the left with the scrim as a horizontal gradient,
 * and the right two thirds of the photo stay untouched. It is the admin of a
 * site about theme parks, edited by people who go to them, and the media
 * database is right there with the rotation pool the homepage uses — through
 * `@/lib/media/hero`, the client-safe 21 KB slice, never the 107 KB catalog.
 *
 * The photo is picked after mount so the server and the browser cannot
 * disagree about which one, and everything under it — the gradient, the two
 * drifting aurora blobs the maintenance page already uses — carries the screen
 * on its own if the image never arrives.
 */
export function LoginScreen() {
  const client = useQueryClient();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpDigits, setTotpDigits] = useState<readonly string[]>(EMPTY_CODE);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedFor, setLockedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Same window as the dashboard, so the park somebody signs in on is the park
  // that greets them once they are in.
  const hero = useHeroPhoto();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Counts the lockout down rather than showing a static number: a page that
  // says "try again in 900 seconds" and never changes reads as broken.
  useEffect(() => {
    if (lockedFor === null || lockedFor <= 0) return;
    const timer = setInterval(() => {
      setLockedFor((seconds) => (seconds === null || seconds <= 1 ? null : seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedFor]);

  const totpCode = totpDigits.join('');
  const locked = lockedFor !== null;
  const canSubmit = !busy && !locked && (!needsTotp || totpCode.length === 6);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

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
      setTotpDigits(EMPTY_CODE);
      if (!wasTotpStep) setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* The base. Renders alone until the photo has loaded, and behind it
          after — so nothing ever sits on bare background. */}
      <div aria-hidden="true" className="bg-background absolute inset-0" />

      {hero && (
        <Image
          src={hero.src}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectPosition: heroObjectPosition(hero.src) }}
          className="animate-in fade-in object-cover duration-1000 motion-reduce:animate-none"
        />
      )}

      {/* The scrim runs sideways on a desktop, because the form is on the left
          and the picture should survive on the right. Downwards on a phone,
          where the column is the whole width and there is nothing to save. */}
      <div
        aria-hidden="true"
        className={cn(
          'from-background via-background/85 to-background/40 absolute inset-0 bg-gradient-to-b',
          'lg:from-background lg:via-background/90 lg:bg-gradient-to-r lg:to-transparent'
        )}
      />
      <div
        aria-hidden="true"
        className="from-background/90 absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
      />

      {/* Same two drifting blobs as the maintenance page, dimmed: they give the
          column its own light, and they are the whole background on the half
          second before the image lands.

          Masked to the side the form is on, or they wash a teal film across the
          photograph and undo the reason it is there. A blurred blob at this
          size covers the viewport whatever its opacity, so the fix is the mask
          and not a smaller number. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden',
          '[mask-image:linear-gradient(to_bottom,black,transparent_70%)]',
          'lg:[mask-image:linear-gradient(to_right,black_15%,transparent_55%)]'
        )}
      >
        <div className="bg-primary/25 absolute -top-40 -left-40 h-[40rem] w-[40rem] animate-[maintenance-drift-1_20s_ease-in-out_infinite] rounded-full blur-3xl motion-reduce:animate-none" />
        <div className="bg-primary/15 absolute -bottom-56 left-1/4 h-[34rem] w-[34rem] animate-[maintenance-drift-2_26s_ease-in-out_infinite] rounded-full blur-3xl motion-reduce:animate-none" />
      </div>

      <div className="relative flex min-h-[100dvh] flex-col justify-center px-4 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="animate-in fade-in slide-in-from-bottom-3 w-full max-w-md duration-700 motion-reduce:animate-none">
          <div className="mb-7 flex items-center gap-3">
            <span className="from-primary/30 to-primary/5 border-primary/30 text-primary shadow-primary/20 flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-lg backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xl leading-none font-bold tracking-tight drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)]">
                park<span className="text-primary">.fan</span>
              </p>
              <p className="mt-1.5 text-[10px] leading-none font-semibold tracking-[0.3em] text-white/55 uppercase drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
                Verwaltung
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-border/60 bg-card/70 relative overflow-hidden rounded-3xl border p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/5 backdrop-blur-2xl sm:p-7"
          >
            {/* A hairline where the light would hit. One pixel, and it is the
                difference between a glass panel and a grey rectangle. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />

            <div className="mb-5">
              <h1 className="text-lg font-semibold tracking-tight">
                {needsTotp ? 'Zweiter Faktor' : 'Anmelden'}
              </h1>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {needsTotp ? (
                  <>
                    Sechs Ziffern aus der Authenticator-App für{' '}
                    <span className="text-foreground font-medium">{email}</span>.
                  </>
                ) : (
                  'Parks, Bahnen, Saisons und alles, was daran hängt.'
                )}
              </p>
            </div>

            {!needsTotp ? (
              <div className="space-y-4">
                <LoginField label="E-Mail" htmlFor="admin-email" icon={AtSign}>
                  <input
                    id="admin-email"
                    ref={emailRef}
                    type="email"
                    autoComplete="username"
                    placeholder="du@park.fan"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className={cn(FIELD_CLASS, 'pl-10')}
                  />
                </LoginField>

                <LoginField label="Passwort" htmlFor="admin-password" icon={KeyRound}>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyUp={(event) => setCapsLock(event.getModifierState?.('CapsLock') ?? false)}
                    required
                    className={cn(FIELD_CLASS, 'pr-11 pl-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </LoginField>

                {capsLock && (
                  <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
                    <TriangleAlert className="h-3 w-3" />
                    Feststelltaste ist an.
                  </p>
                )}
              </div>
            ) : (
              <TotpDigits digits={totpDigits} onChange={setTotpDigits} disabled={busy || locked} />
            )}

            {error && (
              <p
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed"
              >
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            {lockedFor !== null && (
              <p className="text-muted-foreground border-border/50 bg-muted/30 mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs tabular-nums">
                <Timer className="h-3.5 w-3.5 shrink-0" />
                Wieder möglich in {formatCountdown(lockedFor)}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'group from-primary to-primary/85 text-primary-foreground shadow-primary/25 focus-visible:ring-primary/50 mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b text-sm font-semibold shadow-lg transition-all',
                'hover:brightness-110 active:scale-[0.99]',
                'focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100'
              )}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              )}
              {needsTotp ? 'Bestätigen' : 'Anmelden'}
            </button>

            {needsTotp && (
              <button
                type="button"
                onClick={() => {
                  setNeedsTotp(false);
                  setTotpDigits(EMPTY_CODE);
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground mt-3 flex w-full items-center justify-center gap-1.5 text-xs transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Andere Anmeldung
              </button>
            )}
          </form>

          {/* Not a badge for its own sake: it is the one property of this login
              worth knowing, and the reason the whole thing was rebuilt. */}
          <p className="text-muted-foreground mt-4 flex items-center gap-1.5 px-1 text-[11px]">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            Die Sitzung liegt in einem httpOnly-Cookie. Der Browser hält kein Geheimnis.
          </p>
        </div>
      </div>

      {/* Which park you are looking at. The same line the public hero shows,
          and the reason the photo is worth having: somebody signing in at
          seven in the morning gets Taron at night. */}
      {hero?.meta && (
        <p className="animate-in fade-in absolute right-4 bottom-4 flex max-w-[70vw] items-center gap-1.5 truncate rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] text-white/75 backdrop-blur-md duration-1000 motion-reduce:animate-none">
          <MapPin className="h-3 w-3 shrink-0 opacity-70" />
          <span className="truncate">
            {[hero.meta.attractionName, hero.meta.parkName].filter(Boolean).join(' · ')}
          </span>
        </p>
      )}
    </div>
  );
}

const FIELD_CLASS =
  'border-border/60 bg-background/50 focus:border-primary/60 focus:ring-primary/25 placeholder:text-muted-foreground/50 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-[color,box-shadow,border-color] focus:ring-2';

function LoginField({
  label,
  htmlFor,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: typeof KeyRound;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wide uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
        {children}
      </div>
    </div>
  );
}

/**
 * Six boxes rather than one field with wide letter-spacing.
 *
 * The code is six digits read off a phone and typed without looking back, and
 * separate boxes are what makes "which one am I on" answerable at a glance —
 * plus a mistyped digit costs one backspace instead of a re-read. Paste still
 * works: an authenticator's copy button hands over all six at once, so a paste
 * anywhere in the row fills the row.
 *
 * `one-time-code` sits on the first box only. That is what iOS and Android
 * autofill look for, and repeating it would offer the same suggestion six
 * times.
 */
function TotpDigits({
  digits,
  onChange,
  disabled,
}: {
  digits: readonly string[];
  onChange: (next: readonly string[]) => void;
  disabled: boolean;
}) {
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    boxes.current[0]?.focus();
  }, []);

  function focusBox(index: number) {
    boxes.current[Math.max(0, Math.min(5, index))]?.focus();
  }

  // Positional, which is the whole reason the six slots live in an array
  // rather than in a string: clearing the third digit of a full code has to
  // leave a hole, not slide the last two along one box each.
  function setDigit(index: number, digit: string) {
    if (index < 0 || index > 5) return;
    const next = [...digits];
    next[index] = digit;
    onChange(next);
  }

  return (
    <div>
      <label
        htmlFor="admin-totp-0"
        className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wide uppercase"
      >
        Bestätigungscode
      </label>
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <input
            key={index}
            id={`admin-totp-${index}`}
            ref={(node) => {
              boxes.current[index] = node;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            aria-label={`Ziffer ${index + 1} von 6`}
            value={digits[index] ?? ''}
            onChange={(event) => {
              const digit = event.target.value.replace(/\D/g, '').slice(-1);
              if (!digit) return;
              setDigit(index, digit);
              focusBox(index + 1);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace') {
                event.preventDefault();
                if (digits[index]) {
                  setDigit(index, '');
                } else {
                  setDigit(index - 1, '');
                  focusBox(index - 1);
                }
                return;
              }
              if (event.key === 'ArrowLeft') focusBox(index - 1);
              if (event.key === 'ArrowRight') focusBox(index + 1);
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
              if (!pasted) return;
              event.preventDefault();
              onChange(EMPTY_CODE.map((_, slot) => pasted[slot] ?? ''));
              focusBox(pasted.length);
            }}
            className={cn(
              // `min-w-0` is load-bearing: an <input> resolves `min-width: auto`
              // to the width of its `size` attribute, roughly twenty characters,
              // which outranks the zero basis `flex-1` sets. Without it two of
              // the six boxes filled the row and the rest hung off the panel.
              'border-border/60 bg-background/50 focus:border-primary/60 focus:ring-primary/25 h-14 min-w-0 flex-1 rounded-xl border text-center text-xl font-semibold tabular-nums transition-[color,box-shadow,border-color] outline-none focus:ring-2',
              digits[index] && 'border-primary/40'
            )}
          />
        ))}
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
