'use client';

import { cn } from '@/lib/utils';

/**
 * The editor dialog's shared furniture.
 *
 * Both halves of the image editor — the framing previews on the left, the sidecar
 * fields on the right — are looking at the same photo, so they should not look
 * like two different tools bolted together. These live in one module rather than
 * being redefined per file, which is how the two columns drifted into a bordered
 * card language on one side and bare headings on the other.
 */

/** A titled group of related controls — the editor's unit of "one question". */
export function Section({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-border/70 bg-muted/20 rounded-xl border p-3.5', className)}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold tracking-wider uppercase">{title}</h3>
        {action}
      </div>
      {hint && <p className="text-muted-foreground mb-2.5 text-[11px]">{hint}</p>}
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-1 block text-[11px] font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-visible:ring-foreground/40 rounded-full border px-2.5 py-1 text-[11px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

export function Notice({ tone, children }: { tone: 'info' | 'warn'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border px-3 py-2 text-xs',
        tone === 'warn'
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
          : 'border-border bg-muted/40 text-muted-foreground'
      )}
    >
      {children}
    </div>
  );
}
