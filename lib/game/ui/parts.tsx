'use client';

/**
 * The small pieces every panel is built from.
 *
 * They exist so that a figure looks the same in the top bar, in the park panel and in a foreign
 * module's panel — which is the whole argument for a registry rather than a folder of bespoke
 * panels. A module that registers one of these gets the HUD's typography for free and cannot
 * accidentally invent a fifth shade of grey.
 *
 * Everything here is built on the site's own components (`@/components/ui/button`, `Badge`) and
 * the tokens in `surface.ts`. There is no second button in this file and there must not be one.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HUD_LABEL, HUD_WELL, TONE_DOT, TONE_FILL, TONE_TEXT, type Tone } from './surface';

/** A number with its label under it. The label is the small one; the number is the point. */
export function Figure({
  label,
  value,
  tone = 'neutral',
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)} title={hint}>
      <div className={cn('truncate text-sm font-semibold tabular-nums', TONE_TEXT[tone])}>
        {value}
      </div>
      <div className={cn(HUD_LABEL, 'mt-0.5 truncate')}>{label}</div>
    </div>
  );
}

/** The same, boxed, for a grid of them. */
export function FigureTile(props: Parameters<typeof Figure>[0]) {
  return <Figure {...props} className={cn(HUD_WELL, 'px-2.5 py-2', props.className)} />;
}

/**
 * A labelled bar.
 *
 * The number sits beside the label rather than inside the bar: a value written on a fill that
 * moves is unreadable exactly when the fill is short, which is when the reader most wants it.
 */
export function Meter({
  label,
  value,
  fraction,
  tone = 'neutral',
  className,
}: {
  label?: string;
  value?: ReactNode;
  /** 0..1. */
  fraction: number;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className={cn('min-w-0', className)}>
      {label || value ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {label ? <span className={cn(HUD_LABEL, 'truncate')}>{label}</span> : null}
          {value ? (
            <span className={cn('text-xs font-semibold tabular-nums', TONE_TEXT[tone])}>
              {value}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', TONE_FILL[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatusDot({ tone = 'neutral', className }: { tone?: Tone; className?: string }) {
  return <span className={cn('size-2 shrink-0 rounded-full', TONE_DOT[tone], className)} />;
}

/** A label above a group. `action` is the one control a section header may carry. */
export function Section({
  label,
  action,
  children,
  className,
}: {
  label?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label || action ? (
        <div className="flex items-center justify-between gap-2">
          {label ? <h3 className={HUD_LABEL}>{label}</h3> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Label on the left, value on the right. The workhorse of every inspector. */
export function DataRow({
  label,
  value,
  tone = 'neutral',
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5" title={hint}>
      <span className="min-w-0 truncate text-xs text-white/55">{label}</span>
      <span className={cn('shrink-0 text-xs font-medium tabular-nums', TONE_TEXT[tone])}>
        {value}
      </span>
    </div>
  );
}

/**
 * A muted line where a panel has nothing to say.
 *
 * It says what is missing and, where there is one, what would fill it. An empty box with no words
 * in it is indistinguishable from a panel that failed to load, which is the state this replaces.
 */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="px-1 py-3 text-xs leading-relaxed text-white/45">{children}</p>;
}

/** A small pill. Not `Badge` where the content is a number that changes width. */
export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded-full border border-white/12 bg-white/[0.06] px-1.5 text-[10px] font-medium tabular-nums',
        TONE_TEXT[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * An icon control in the HUD's density.
 *
 * `size="icon-sm"` from the shared scale is 32 px and grows to 44 below `sm`, which is the right
 * default for a page and the wrong one inside a 48 px HUD cluster — the same exception the site
 * header documents for its own three controls. Panel-body controls keep the shared tier, because
 * they sit in a sheet with room; only the chrome clusters cancel it, and they say so here rather
 * than at nine call sites.
 */
export function HudIconButton({
  label,
  active,
  dense,
  onClick,
  children,
  className,
  disabled,
}: {
  label: string;
  active?: boolean;
  /** Cancel the phone tier: for the top-bar and rail clusters only. */
  dense?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={active ? 'default' : 'ghost'}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-lg text-white/70 hover:text-white',
        dense ? 'size-8 max-sm:size-9' : 'size-8',
        active && 'text-primary-foreground shadow-[0_0_0_1px_var(--game-accent)]',
        className
      )}
    >
      {children}
    </Button>
  );
}

/** A text control at the HUD's size. Used for panel actions. */
export function HudButton({
  children,
  onClick,
  variant = 'ghost',
  className,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'ghost' | 'default' | 'outline' | 'destructive' | 'secondary';
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn('h-7 rounded-lg px-2.5 text-xs max-sm:h-9', className)}
    >
      {children}
    </Button>
  );
}

/**
 * A distribution bar: one segment per category, widths in proportion.
 *
 * Used for the crowd breakdown, where the interesting quantity is the *share* queuing rather than
 * the count, and eight numbers in a column do not show a share at all.
 */
export function StackBar({
  segments,
  className,
}: {
  segments: { key: string; value: number; className: string; label: string }[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;
  return (
    <div className={cn('flex h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      {segments.map((s) =>
        s.value > 0 ? (
          <div
            key={s.key}
            className={s.className}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ) : null
      )}
    </div>
  );
}
