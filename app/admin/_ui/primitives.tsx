'use client';

import type { ComponentProps, ReactNode } from 'react';
import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The admin's shared surfaces.
 *
 * There were three of these before — `_lib/ui.tsx`, `media/_components/panel-ui.tsx`
 * and `blog-editor/_components/form-fields.tsx` each defined their own `Section`
 * and their own field row, with different padding, different heading sizes and
 * different ideas about where a hint goes. That is what the reuse rule in the
 * conventions exists to prevent, and the fix is one file, not a fourth.
 */

// ─── layout ───────────────────────────────────────────────────────────────────

/**
 * One page's rhythm, in one place.
 *
 * Six pages carried their own `mx-auto max-w-Nxl space-y-4 p-4` with three
 * different widths, and the operations pages carried nothing at all — so
 * /admin/system and /admin/queues ran flush to the window edge while the
 * dashboard sat in a centred column. That is most of what made the admin feel
 * like two products stitched together.
 *
 * Three widths, named for what they hold rather than picked per page:
 * `wide` for boards and tables, the default for entity editors, `narrow` for
 * a single column of form. The two full-height list pages (parks, history)
 * own their own layout and stay out of this deliberately — they size
 * themselves against the viewport so the table scrolls inside the page rather
 * than the page scrolling.
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
 * A surface, and the reason it looks like one.
 *
 * A `bg-card` panel on a `bg-background` page is a two-percent difference in
 * lightness, and at that distance a border is the only thing saying "card" —
 * which is why the admin read as one flat sheet with hairlines drawn on it.
 * Three cheap things fix that and cost no layout: a soft drop shadow so the
 * panel sits *above* the page, an inset ring so the edge has thickness, and a
 * one-pixel highlight along the top where the layout's light comes from.
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

export function PanelBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-4', className)} {...props} />;
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

// ─── small parts ──────────────────────────────────────────────────────────────

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
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
      <p className="truncate text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

export function Chip({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode;
  tone?: 'muted' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const tones: Record<string, string> = {
    muted: 'border-border/60 bg-muted/50 text-muted-foreground',
    primary: 'border-primary/30 bg-primary/10 text-primary',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    danger: 'border-destructive/40 bg-destructive/10 text-destructive',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── states ───────────────────────────────────────────────────────────────────

export function LoadingState({ label = 'Lädt…' }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

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
 * Rows shaped like the rows they replace.
 *
 * The height matters: this admin loads lists over a network on every
 * navigation, and a spinner that collapses to nothing pushes the toolbar and
 * the pagination around every time. Same reason the public site reserves the
 * height of a streamed section.
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
