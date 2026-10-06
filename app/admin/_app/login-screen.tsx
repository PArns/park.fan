'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import {
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
 * The admin login: e-mail, password and code in one form, behind one Turnstile solve.
 *
 * The backend's three answers stay three on screen (wrong credentials, a missing second factor, a
 * lockout), because "invalid credentials" over a locked account invites the retries that locked
 * it. The form sits in a column on the left so the photo survives on the right, and the photo is
 * picked after mount so server and browser cannot disagree about it. See
 * docs/rules/the-admin-holds-no-credential.md.
 */
export function LoginScreen() {
  const client = useQueryClient();
  const emailRef = useRef<HTMLInputElement>(null);
  const totpRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  // Set only by the backend's `totp-required`. It decides a message and a focus, never which
  // form is on screen: there is only one.
  const [totpMissing, setTotpMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedFor, setLockedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // An empty token means not solved yet. `turnstileBroken` means the challenge never arrived (a
  // blocked script, an offline laptop), which the gate says out loud instead of leaving the
  // button greyed out with no reason.
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
  // The code may be empty: most accounts have no second factor, and the ones
  // that do are told so by the backend. Once it has said `totp-required`,
  // sending the same empty field again is a request whose answer is known.
  const canSubmit = !busy && !locked && Boolean(turnstileToken) && (!totpMissing || codeComplete);

  async function attempt() {
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    const code = totpCode.trim();

    try {
      const result = await adminFetch<LoginResponse>('/api/admin/session', {
        method: 'POST',
        body: {
          email: email.trim(),
          password,
          turnstileToken,
          ...(code ? { totpCode: code } : {}),
        },
      });

      if (result.status === 'totp-required') {
        // Not a step: the code field is already on screen, so say what it wants and focus it.
        setTotpMissing(true);
        setError('Dieses Konto ist mit einem zweiten Faktor geschützt. Der Code fehlt noch.');
        totpRef.current?.focus();
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
      // All three fields go in one request, so a 401 cannot say which was wrong. Naming the code
      // too keeps somebody from retyping a password that was right.
      const message =
        err instanceof AdminApiError && err.status !== 401
          ? err.message
          : code
            ? 'E-Mail, Passwort oder Code stimmt nicht. Der Code wechselt alle 30 Sekunden.'
            : 'E-Mail oder Passwort stimmt nicht.';
      setError(message);
      // A code lives thirty seconds, so it is cleared either way. The password is cleared only
      // when no code was in play: with one, the code is the likelier culprit.
      setTotpCode('');
      if (!code) setPassword('');
    } finally {
      setBusy(false);
      // A Turnstile token is single-use, so ask for a fresh one whatever the answer was.
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

  // A complete code submits itself: a manager that fills all three fields and leaves them behind
  // a button saves nobody the typing. It waits for e-mail and password (six digits in an empty
  // form can only fail), fires once per code, and waits for `canSubmit`, so a code that lands
  // before the fresh Turnstile token goes when the token arrives.
  const autoSubmitted = useRef<string | null>(null);
  const credentialsFilled = email.trim().length > 0 && password.length > 0;
  useEffect(() => {
    if (totpCode.length < CODE_LENGTH) {
      autoSubmitted.current = null;
      return;
    }
    if (!credentialsFilled || !canSubmit || autoSubmitted.current === totpCode) return;
    autoSubmitted.current = totpCode;
    void attemptRef.current();
  }, [credentialsFilled, totpCode, canSubmit]);

  // A variable, not a component declared in the render: that would be a new type on every render
  // and remount the Turnstile widget on every keystroke.
  const gateAndSubmit = (
    <>
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
        Anmelden
      </button>
    </>
  );

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

      {/* Masked to the form's side: a blurred blob this size covers the viewport whatever its
          opacity, and unmasked it washes a teal film over the photograph. */}
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

          {/* One form for all three fields from the first paint: a password manager fills a login
              from what is in the document when it looks, so a code field that arrives after a
              round trip is never filled. See docs/rules/the-admin-holds-no-credential.md. */}
          <form onSubmit={handleSubmit} className={CARD_CLASS}>
            <CardHairline />

            <FormHeading title="Anmelden">
              Parks, Bahnen, Saisons und alles, was daran hängt.
            </FormHeading>

            <div className="space-y-4">
              <LoginField label="E-Mail" htmlFor="admin-email" icon={AtSign}>
                <input
                  id="admin-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="username"
                  placeholder="du@park.fan"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    // A different address may be an account without a second factor; without
                    // this, `canSubmit` keeps demanding the six digits a previous account wanted.
                    setTotpMissing(false);
                  }}
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
              <TotpField
                ref={totpRef}
                code={totpCode}
                onChange={setTotpCode}
                disabled={busy || locked}
                wanted={totpMissing}
              />
            </div>

            {gateAndSubmit}
          </form>

          <p className="text-muted-foreground mt-4 flex items-center gap-1.5 px-1 text-[11px]">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            Die Sitzung liegt in einem httpOnly-Cookie. Der Browser hält kein Geheimnis.
          </p>
        </div>
      </div>

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
 * `text-base` below `sm`: under 16 px iOS Safari zooms in on a focused input and does not zoom
 * back out on blur.
 */
const FIELD_CLASS =
  'border-border/60 bg-background/50 focus:border-primary/60 focus:ring-primary/25 placeholder:text-muted-foreground/50 h-11 w-full rounded-xl border px-3 text-base outline-none transition-[color,box-shadow,border-color] focus:ring-2 sm:text-sm';

/**
 * A class string rather than a wrapper, so the `<form>` itself is the card and no element stands
 * between a password manager and the three inputs.
 */
const CARD_CLASS =
  'border-border/60 bg-card/70 relative overflow-hidden rounded-3xl border p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/5 backdrop-blur-2xl sm:p-7';

/** A highlight along the card's top edge, positioned against the `<form>` (see `CARD_CLASS`). */
function CardHairline() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
    />
  );
}

function FormHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{children}</p>
    </div>
  );
}

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
 * The six-digit code: six drawn boxes under one transparent input, because password managers,
 * iOS and Android fill `autocomplete="one-time-code"` on one field, and six real inputs cannot
 * take a code written in one event. It takes no focus on mount, since most accounts leave it
 * empty; `wanted` marks it once the backend has answered `totp-required`.
 */
function TotpField({
  code,
  onChange,
  disabled,
  wanted,
  ref,
}: {
  code: string;
  onChange: (next: string) => void;
  disabled: boolean;
  wanted: boolean;
  ref: Ref<HTMLInputElement>;
}) {
  const [focused, setFocused] = useState(false);

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
        <span className="text-muted-foreground/70 ml-1.5 normal-case">
          {wanted ? '— dieses Konto braucht ihn' : '— nur mit zweitem Faktor'}
        </span>
      </label>

      <div className="relative h-14">
        {/* Above the input (`z-10`): a password manager paints the field it filled, and drawn
            below, the boxes would sit under that colour with the digits transparent. They take
            no pointer events, so the input still gets every tap. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex gap-2">
          {Array.from({ length: CODE_LENGTH }, (_, index) => (
            <div
              key={index}
              className={cn(
                // Opaque, unlike the other fields' `/50`: a translucent box lets a password
                // manager's fill colour through as a grey wash.
                'border-border/60 bg-background flex h-14 min-w-0 flex-1 items-center justify-center rounded-xl border text-xl font-semibold tabular-nums transition-[color,box-shadow,border-color]',
                wanted && !code && 'border-amber-400/60',
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
          ref={ref}
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
 * The Turnstile challenge and its status line. A challenge that never loads (an extension, a
 * captive portal, an office proxy) gets a message and a retry, not a silently disabled button.
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
