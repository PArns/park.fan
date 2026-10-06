'use client';

import type { ComponentProps, ReactNode } from 'react';
import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CROWD_CHIP_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';

/**
 * The admin's shared surfaces: page layout, panels, small parts and the loading, error and empty
 * states. A page adds to this file rather than defining its own.
 */

/**
 * One admin page's column and spacing, in three widths named for what they hold: `wide` for
 * boards and tables, the default for entity editors, `narrow` for a single form column. The
 * full-height list pages (parks, history) size themselves against the viewport and stay out.
 */
export function AdminPage({
  width = 'default',
  className,
  children,
}: {
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full space-y-5 p-4 sm:p-6',
        width === 'narrow' && 'max-w-3xl',
        width === 'default' && 'max-w-5xl',
        width === 'wide' && 'max-w-6xl',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A card surface. `bg-card` on `bg-background` differs by two percent in lightness, so a drop
 * shadow, an inset ring and a top highlight are what make it read as a card.
 */
export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'border-border/60 bg-card/80 relative rounded-xl border shadow-lg ring-1 shadow-black/20 ring-white/[0.03] backdrop-blur-sm',
        'before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/** Header row of a `Panel`: optional icon, a title with a muted hint, an action on the right. */
export function PanelHeader({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('border-border/50 flex items-start gap-3 border-b px-4 py-3', className)}>
      {Icon && (
        <span className="from-primary/20 to-primary/5 ring-primary/20 text-primary mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Padded content area of a `Panel`. */
export function PanelBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-4', className)} {...props} />;
}

/**
 * A bordered box inside a panel or a dialog: one machine, one model, one group of controls, under
 * an optional title row and hint.
 */
export function Tile({
  icon: Icon,
  title,
  hint,
  action,
  className,
  children,
}: {
  icon?: LucideIcon;
  title?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={cn('border-border/60 bg-muted/20 space-y-2.5 rounded-lg border p-3', className)}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-muted-foreground flex min-w-0 items-center gap-2 text-[11px] font-semibold tracking-wider uppercase">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            {title}
          </h3>
          {action}
        </div>
      )}
      {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
      {children}
    </section>
  );
}

/** A `Tile` holding one large tabular figure under its label, with an optional line beneath. */
export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <Tile title={label} className="space-y-1">
      <span className="block text-3xl font-bold tabular-nums">{value}</span>
      {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
    </Tile>
  );
}

/** A horizontal strip of controls above a list: search, filters, view switch. */
export function Toolbar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'border-border/50 bg-background/70 flex flex-wrap items-center gap-2 border-b px-4 py-2.5 backdrop-blur-md',
        className
      )}
      {...props}
    />
  );
}

/** A keyboard hint. Rendered everywhere a shortcut exists, so shortcuts are
 *  discoverable by looking rather than by reading documentation. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border-border/70 bg-muted/60 text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded border px-1.5 font-sans text-[10px] font-semibold">
      {children}
    </kbd>
  );
}

/** Label above a value, the densest way to show a fact. */
export function Meta({
  label,
  value,
  className,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  /** Colours the value when the figure is a verdict (a hit rate, an error). */
  valueClassName?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
      <p className={cn('truncate text-sm font-medium tabular-nums', valueClassName)}>{value}</p>
    </div>
  );
}

/** The five colours a `Chip` comes in, by meaning rather than by hue. */
export type ChipTone = 'muted' | 'primary' | 'success' | 'warning' | 'danger';

const CHIP_TONES: Record<ChipTone, string> = {
  muted: 'border-border/60 bg-muted/50 text-muted-foreground',
  primary: 'border-primary/30 bg-primary/10 text-primary',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive',
};

/** Small rounded label in one of the five `ChipTone`s, the admin's only pill. */
export function Chip({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        CHIP_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const SEVERITY_TONES: Record<string, ChipTone> = {
  low: 'primary',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

/** The chip tone for an alert or anomaly severity (`low` to `critical`); muted for anything else. */
export function severityTone(severity: string): ChipTone {
  return SEVERITY_TONES[severity.toLowerCase()] ?? 'muted';
}

/**
 * The chip tone for a service status word: success for healthy, ok, online and the like, warning
 * for degraded, pending or a warning, danger for anything else.
 */
export function statusTone(status: string): ChipTone {
  const lower = status?.toLowerCase() ?? '';
  if (['warning', 'degraded', 'pending'].some((k) => lower.includes(k))) return 'warning';
  if (
    ['healthy', 'connected', 'operational', 'active', 'good', 'online', 'ok'].some((k) =>
      lower.includes(k)
    )
  ) {
    return 'success';
  }
  return 'danger';
}

/**
 * A `Chip` class in the public site's crowd palette, so `moderate` reads as the green "Normal" it is
 * there; undefined (a muted chip) for a level without a colour.
 */
export function crowdChipClass(level: string): string | undefined {
  const key = level?.toLowerCase() ?? '';
  return isColoredCrowdLevel(key) ? CROWD_CHIP_CLASS[key] : undefined;
}

/** A small round dot, green when `ok` and red otherwise. */
export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', ok ? 'bg-emerald-500' : 'bg-red-500')}
    />
  );
}

/** Centred spinner with a label (`Lädt…` by default), for a panel whose data is loading. */
export function LoadingState({ label = 'Lädt…' }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

/** Red error box showing a message, with an `Erneut` retry button when `onRetry` is given. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border-destructive/30 bg-destructive/10 text-destructive m-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 break-words">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-xs font-semibold underline underline-offset-2"
        >
          Erneut
        </button>
      )}
    </div>
  );
}

/** Centred empty-panel message: optional icon, title, description and an action below. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon && (
        <span className="bg-muted/60 text-muted-foreground flex h-11 w-11 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Skeleton rows shaped like the rows they replace, so a loading list does not push the toolbar
 * and the pagination around.
 */
export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('divide-border/40 divide-y', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <div className="bg-muted/60 h-4 w-4 animate-pulse rounded" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div
              className="bg-muted/60 h-3.5 animate-pulse rounded"
              style={{ width: `${40 + ((index * 13) % 35)}%` }}
            />
            <div
              className="bg-muted/40 h-2.5 animate-pulse rounded"
              style={{ width: `${25 + ((index * 7) % 25)}%` }}
            />
          </div>
          <div className="bg-muted/50 h-5 w-16 animate-pulse rounded-full" />
        </div>
      ))}
    </div>
  );
}
