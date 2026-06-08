'use client';

import { useEffect, useRef } from 'react';
import { Replace, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RefVariant = 'info' | 'bare' | 'full';

export interface RefEditTarget {
  from: number;
  to: number;
  href: string;
  rect: { top: number; bottom: number; left: number; right: number };
}

interface RefEditPopoverProps {
  target: RefEditTarget | null;
  onClose: () => void;
  onVariant: (variant: RefVariant) => void;
  onReplace: () => void;
  onRemove: () => void;
}

function parseRef(href: string): { value: string; opt: RefVariant | null } | null {
  if (!href.startsWith('ref:')) return null;
  const rest = href.slice(4);
  const q = rest.indexOf('?');
  if (q === -1) return { value: rest, opt: null };
  const flag = rest.slice(q + 1).split(/[&=]/)[0]?.toLowerCase() ?? '';
  return {
    value: rest.slice(0, q),
    opt:
      flag === 'info' || flag === 'bare' || flag === 'full'
        ? (flag as RefVariant)
        : // ?long is a legacy no-op in the renderer — surface it as Info so
          // the popover stays in sync with reality.
          flag === 'long'
          ? 'info'
          : null,
  };
}

/**
 * Small floating menu that appears next to a clicked ref-preview chip with
 * one-click variant switching, Replace (re-open the park picker) and Remove.
 * Position is computed from the chip's bounding rect so it follows the chip
 * across the page; closes on click-outside and Escape.
 */
export function RefEditPopover({
  target,
  onClose,
  onVariant,
  onReplace,
  onRemove,
}: RefEditPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [target, onClose]);

  if (!target) return null;
  const parsed = parseRef(target.href);
  const current = parsed?.opt ?? 'info';

  // Position just above the chip; if it'd run off the top, drop below it.
  const POPOVER_HEIGHT = 56;
  const above = target.rect.top - POPOVER_HEIGHT > 16;
  const top = above ? target.rect.top - POPOVER_HEIGHT - 8 : target.rect.bottom + 8;
  const left = Math.max(
    16,
    Math.min(
      window.innerWidth - 16 - 360,
      (target.rect.left + target.rect.right) / 2 - 180
    )
  );

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top, left, zIndex: 60 }}
      className="border-border/60 bg-popover text-popover-foreground inline-flex items-center gap-1 rounded-xl border p-1 shadow-2xl"
    >
      <span className="text-muted-foreground px-1.5 text-[10px] font-semibold uppercase tracking-wider">
        Variant
      </span>
      {(['info', 'bare', 'full'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onVariant(v)}
            className={cn(
              'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
              current === v
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent/40 text-foreground/80'
            )}
          >
            {v}
          </button>
        ))}
      <div className="bg-border/60 mx-1 h-5 w-px" />
      <button
        type="button"
        onClick={onReplace}
        title="Replace (open picker)"
        className="hover:bg-accent/40 text-foreground/80 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors"
      >
        <Replace className="h-3 w-3" />
        Replace
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Unlink"
        className="hover:bg-destructive/15 text-foreground/80 hover:text-destructive inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors"
      >
        <Trash2 className="h-3 w-3" />
        Remove
      </button>
    </div>
  );
}
