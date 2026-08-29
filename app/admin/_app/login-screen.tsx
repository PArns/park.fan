'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react';
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
  RefreshCw,
  ShieldCheck,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { TurnstileWidget, type TurnstileHandle } from '@/components/common/turnstile-widget';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';
import { adminFetch, adminKeys, AdminApiError } from '../_lib/api';
import { heroObjectPosition } from '@/lib/media/hero';
import { useHeroPhoto } from '../_lib/use-hero-photo';
import { cn } from '@/lib/utils';

/** How many digits a TOTP code has. Six, everywhere. */
const CODE_LENGTH = 6;

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
 *
 * Two more things sit in this form and both are about somebody else's software
 * doing the typing.
 *
 * A **Turnstile challenge**, the same one `/contribute` uses, solved before the
 * credentials are sent and re-solved after every attempt because a token may be
 * spent once — see `/api/admin/session` for why the check belongs in front of
 * the backend's limiter rather than behind it.
 *
 * And the code step is **one input**, not six. It looks like six: the boxes are
 * presentational and the real field lies over them, transparent. That is the
 * shape a password manager can fill. The six real inputs it replaces took
 * `value.replace(/\D/g,'').slice(-1)` per box, so 1Password handing "123456" to
 * the first box left a 6 in it and nothing anywhere else — the autofill looked
 * like a typo. One field with `autocomplete="one-time-code"` on it is what
 * every manager, and iOS and Android, actually look for, and the username stays
 * in the DOM on this step so the item they fill from is still the right one.
 */
export function LoginScreen() {
  const client = useQueryClient();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedFor, setLockedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // The Turnstile token, and the widget that mints it. Empty means "not solved
  // yet"; `turnstileBroken` means the challenge itself never arrived — a
  // blocked script, an offline laptop — which is worth saying out loud rather
  // than leaving a button greyed out with no reason given.
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileBroken, setTurnstileBroken] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

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

  const locked = lockedFor !== null;
  const codeComplete = totpCode.length === CODE_LENGTH;
  const canSubmit = !busy && !locked && Boolean(turnstileToken) && (!needsTotp || codeComplete);

  async function attempt() {
    if (busy || locked || !turnstileToken) return;
    if (needsTotp && !codeComplete) return;

    setBusy(true);
    setError(null);

    const wasTotpStep = needsTotp;

    try {
      const result = await adminFetch<LoginResponse>('/api/admin/session', {
        method: 'POST',
        body: {
          email: email.trim(),
          password,
          turnstileToken,
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
      // The token is spent whatever the answer was — including the successful
      // password step of a two-step login, whose code step is still to come.
      // Ask for a fresh one rather than replaying one Cloudflare has retired.
      setTurnstileToken('');
      turnstileRef.current?.reset();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void attempt();
  }

  // The auto-submit below must call the *current* attempt, not the one captured
  // on the render that armed it.
  const attemptRef = useRef(attempt);
  useEffect(() => {
    attemptRef.current = attempt;
  });

  // A filled code submits itself.
  //
  // Not a convenience: it is the other half of making the field fillable. A
  // manager that pastes six digits and then leaves them sitting behind a button
  // has saved nobody the typing they came to avoid, and on a phone the keyboard
  // is covering the button by then. Guarded against firing twice for one code —
  // and it waits for `canSubmit`, so a code that lands before the fresh
  // Turnstile token does goes as soon as the token arrives.
  const autoSubmitted = useRef<string | null>(null);
  useEffect(() => {
    if (totpCode.length < CODE_LENGTH) {
      autoSubmitted.current = null;
      return;
    }
    if (!needsTotp || !canSubmit || autoSubmitted.current === totpCode) return;
    autoSubmitted.current = totpCode;
    void attemptRef.current();
  }, [needsTotp, totpCode, canSubmit]);

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
              <TotpField
                code={totpCode}
                email={email}
                onChange={setTotpCode}
                disabled={busy || locked}
              />
            )}

            <TurnstileGate
              ref={turnstileRef}
              solved={Boolean(turnstileToken)}
              broken={turnstileBroken}
              onVerify={(token) => {
                setTurnstileToken(token);
                setTurnstileBroken(false);
              }}
              onExpire={() => setTurnstileToken('')}
              onError={() => setTurnstileBroken(true)}
              onRetry={() => {
                setTurnstileBroken(false);
                setTurnstileToken('');
                turnstileRef.current?.reset();
              }}
            />

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
              {busy || (!turnstileToken && !turnstileBroken) ? (
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
                  setTotpCode('');
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

/**
 * The login card keeps its own geometry — `h-11`, `rounded-xl`, a card rather than
 * a form row — but not its own font size. Under 16 px, iOS Safari zooms the page in
 * to meet a focused input and does not zoom back out on blur, so the first tap on
 * the first screen of the admin left somebody at 1.3× with a horizontal scrollbar
 * and a pinch to undo it. `sm:` puts 14 px back where there is a mouse.
 */
const FIELD_CLASS =
  'border-border/60 bg-background/50 focus:border-primary/60 focus:ring-primary/25 placeholder:text-muted-foreground/50 h-11 w-full rounded-xl border px-3 text-base outline-none transition-[color,box-shadow,border-color] focus:ring-2 sm:text-sm';

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
 * The six-digit code. Six boxes, one input.
 *
 * The boxes are drawn, not typed into: a single `<input>` lies over them,
 * transparent, and the cells underneath render what is in it. Everything a
 * password manager, iOS or Android looks for is then on one element —
 * `autocomplete="one-time-code"`, `inputMode="numeric"`, a six-character limit
 * — and everything a person looks for is still there, because six boxes is what
 * makes "which digit am I on" answerable at a glance and a mistyped digit cost
 * one backspace instead of a re-read.
 *
 * It replaces six real inputs, and they were unfillable for a reason worth
 * writing down. Each one took `value.replace(/\D/g,'').slice(-1)` on change,
 * which is correct for a person typing one digit and destroys an autofill:
 * 1Password writes all six characters into the first box in one event, the
 * slice kept the last of them, and the result was a single 6 in box one and
 * five empty boxes. No error, nothing in the console — it looked like the fill
 * had simply missed.
 *
 * The username rides along, hidden. On this step the e-mail field is gone from
 * the DOM, and a manager with nothing to match on offers codes from every item
 * that has one rather than the account being signed in to.
 */
function TotpField({
  code,
  email,
  onChange,
  disabled,
}: {
  code: string;
  email: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Where the next digit goes. -1 once the code is full, so the caret stops
  // blinking over a box that already has something in it.
  const caretAt = focused && code.length < CODE_LENGTH ? code.length : -1;

  return (
    <div>
      <label
        htmlFor="admin-totp"
        className="text-muted-foreground mb-1.5 block text-[11px] font-medium tracking-wide uppercase"
      >
        Bestätigungscode
      </label>

      {/* Not for anybody to read or reach — it is here so the manager filling
          the code knows which saved login it belongs to. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <div className="relative h-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex gap-2">
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <div
              key={index}
              className={cn(
                'border-border/60 bg-background/50 flex h-14 min-w-0 flex-1 items-center justify-center rounded-xl border text-xl font-semibold tabular-nums transition-[color,box-shadow,border-color]',
                code[index] && 'border-primary/40',
                index === caretAt && 'border-primary/60 ring-primary/25 ring-2'
              )}
            >
              {code[index] ?? ''}
              {index === caretAt && (
                <span className="bg-foreground h-6 w-px animate-pulse motion-reduce:animate-none" />
              )}
            </div>
          ))}
        </div>

        {/* The real field. Transparent rather than `opacity-0`, and the full
            size of the row: a manager decides whether a field is fillable by
            looking at whether it is visible, and it hangs its own inline button
            off the box it measures. */}
        <input
          ref={inputRef}
          id="admin-totp"
          name="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          disabled={disabled}
          aria-label={`Bestätigungscode, ${CODE_LENGTH} Ziffern`}
          value={code}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 h-full w-full rounded-xl bg-transparent text-center text-xl tracking-[1em] text-transparent caret-transparent outline-none"
        />
      </div>
    </div>
  );
}

/**
 * The Turnstile challenge, and what to show while it is not solved yet.
 *
 * Three states, because the middle one is most of them: the widget usually
 * settles in well under a second without asking anybody anything, so a line of
 * text is the right amount of interface for it. The third state is the one that
 * matters — a challenge that never loads (an extension, a captive portal, an
 * office proxy) would otherwise be a permanently greyed-out button with no
 * explanation, and the person in front of it has no way to guess what is wrong.
 */
function TurnstileGate({
  solved,
  broken,
  onVerify,
  onExpire,
  onError,
  onRetry,
  ref,
}: {
  solved: boolean;
  broken: boolean;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
  onRetry: () => void;
  ref: Ref<TurnstileHandle>;
}) {
  // Retrying remounts the widget rather than resetting it: when the script
  // itself never loaded there is no widget to reset, and that is exactly the
  // case the button exists for.
  const [attemptKey, setAttemptKey] = useState(0);

  return (
    <div className="mt-4">
      <TurnstileWidget
        key={attemptKey}
        ref={ref}
        action={TURNSTILE_ACTIONS.adminLogin}
        // `/admin` is hardcoded dark and mounts no theme provider, so the
        // widget has to be told rather than asked.
        theme="dark"
        onVerify={onVerify}
        onExpire={onExpire}
        onError={onError}
      />

      {broken ? (
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <TriangleAlert className="h-3 w-3 shrink-0 text-amber-400" />
            Die Sicherheitsprüfung konnte nicht geladen werden.
          </span>
          <button
            type="button"
            onClick={() => {
              onRetry();
              setAttemptKey((key) => key + 1);
            }}
            className="text-foreground hover:text-primary inline-flex items-center gap-1 underline underline-offset-2 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Nochmal
          </button>
        </div>
      ) : (
        !solved && (
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[11px]">
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
            Sicherheitsprüfung läuft.
          </p>
        )
      )}
    </div>
  );
}

function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}
