'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import { Eye, EyeOff, KeyRound, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The look of every sign-in on park.fan, taken from the admin's login: a frosted card, fields with
 * an icon inside, and a password field that can show what was typed and warns about Caps Lock. The
 * admin, the developer dashboard and the visitor account share it, so a sign-in looks the same
 * wherever it is.
 */

/**
 * `text-base` below `sm`: under 16 px iOS Safari zooms in on a focused input and does not zoom
 * back out on blur.
 */
export const AUTH_FIELD_CLASS =
  'border-border/60 bg-background/50 focus:border-primary/60 focus:ring-primary/25 placeholder:text-muted-foreground/50 h-11 w-full rounded-xl border px-3 text-base outline-none transition-[color,box-shadow,border-color] focus:ring-2 sm:text-sm';

/**
 * A class string rather than a wrapper, so a `<form>` can itself be the card and no element stands
 * between a password manager and the inputs.
 */
export const AUTH_CARD_CLASS =
  'border-border/60 bg-card/70 relative overflow-hidden rounded-3xl border p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/5 backdrop-blur-2xl sm:p-7';

/** A highlight along the card's top edge, positioned against the card (see `AUTH_CARD_CLASS`). */
export function AuthCardHairline() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
    />
  );
}

/** The card's title and the line under it. */
export function AuthFormHeading({
  title,
  as: Heading = 'h1',
  children,
}: {
  title: string;
  /** `h2` where the page already has its `h1`. */
  as?: 'h1' | 'h2';
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <Heading className="text-lg font-semibold tracking-tight">{title}</Heading>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{children}</p>
    </div>
  );
}

/** A labelled field with an icon inside it on the left, and an optional hint under it. */
export function AuthField({
  label,
  htmlFor,
  icon: Icon,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: LucideIcon;
  hint?: ReactNode;
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
      {hint && <p className="text-muted-foreground mt-1.5 text-[11px]">{hint}</p>}
    </div>
  );
}

/**
 * The password field: a key icon, a button that shows or hides what was typed, and a warning
 * under it while Caps Lock is on. The labels come from the caller, in the caller's language.
 */
export function AuthPasswordField({
  id,
  label,
  hint,
  labels,
  className,
  ...input
}: Omit<ComponentProps<'input'>, 'type' | 'id'> & {
  id: string;
  label: string;
  hint?: ReactNode;
  labels: { show: string; hide: string; capsLock: string };
}) {
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  return (
    <div className="space-y-2">
      <AuthField label={label} htmlFor={id} icon={KeyRound} hint={hint}>
        <input
          {...input}
          id={id}
          type={shown ? 'text' : 'password'}
          onKeyUp={(event) => {
            setCapsLock(event.getModifierState?.('CapsLock') ?? false);
            input.onKeyUp?.(event);
          }}
          className={cn(AUTH_FIELD_CLASS, 'pr-11 pl-10', className)}
        />
        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? labels.hide : labels.show}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </AuthField>
      {capsLock && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="h-3 w-3" />
          {labels.capsLock}
        </p>
      )}
    </div>
  );
}
