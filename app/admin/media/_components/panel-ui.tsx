'use client';

import { cn } from '@/lib/utils';
import { Field as AdminField } from '../../_ui/controls';

/**
 * The media editor's furniture.
 *
 * `Section` and `Chip` stay here because they are genuinely this editor's:
 * a denser section than the rest of the admin uses (both halves of the image
 * dialog have to fit beside a preview) and a chip that is a toggle rather than
 * a label. `Field` and the notice do NOT stay — they were duplicates of the
 * shared ones, differing only in label size, and three definitions of a
 * labelled input is what the reuse rule exists to prevent.
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

/** The admin's labelled field. Kept re-exported under this name so the media
 *  editor's ~30 call sites did not need touching in the same commit. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <AdminField label={label}>{children}</AdminField>;
}

/**
 * A toggle that looks like a chip.
 *
 * Distinct from `_ui/primitives`' `Chip`, which is a read-only label. Both
 * names are right for what they are; merging them would give one component two
 * behaviours selected by whether `onClick` is set.
 */
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
