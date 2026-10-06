'use client';

import { cn } from '@/lib/utils';

/** The media editor's own furniture: a chip that is a toggle rather than a label, and a notice box. */

/** A toggle that looks like a chip, unlike the read-only label `Chip` in `_ui/primitives`. */
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

/** An info or warning box in the media editor. */
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
