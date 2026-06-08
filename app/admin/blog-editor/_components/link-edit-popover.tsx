'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';

export interface LinkEditTarget {
  from: number;
  to: number;
  href: string;
  rect: { top: number; bottom: number; left: number; right: number };
}

interface Props {
  target: LinkEditTarget | null;
  onClose: () => void;
  onSave: (href: string) => void;
  onRemove: () => void;
}

/**
 * Inline edit affordance for plain http(s)/mailto/internal links. Sits on the
 * same plane as RefEditPopover but with one text field and Save/Remove, since
 * regular links carry far less metadata than ref: chips. The text field is
 * uncontrolled (re-keyed on each target) to keep React 19 happy about not
 * calling setState inside an effect just to mirror props.
 */
export function LinkEditPopover({ target, onClose, onSave, onRemove }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!target) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        onSave(inputRef.current?.value.trim() ?? '');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [target, onClose, onSave]);

  if (!target) return null;

  const POPOVER_WIDTH = 420;
  const POPOVER_HEIGHT = 50;
  const wantsTop = target.rect.top - POPOVER_HEIGHT - 12 > 80;
  const top = wantsTop ? target.rect.top - POPOVER_HEIGHT - 10 : target.rect.bottom + 10;
  const left = Math.max(
    16,
    Math.min(
      window.innerWidth - 16 - POPOVER_WIDTH,
      (target.rect.left + target.rect.right) / 2 - POPOVER_WIDTH / 2
    )
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 60,
        width: POPOVER_WIDTH,
      }}
      className="border-primary/40 bg-popover text-popover-foreground inline-flex animate-in fade-in zoom-in-95 items-center gap-1 rounded-xl border-2 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] duration-150"
    >
      <ExternalLink className="text-muted-foreground ml-1 h-3.5 w-3.5 shrink-0" />
      <input
        key={`${target.from}-${target.to}`}
        ref={inputRef}
        autoFocus
        defaultValue={target.href}
        placeholder="https://…"
        className="text-foreground flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
      {target.href.startsWith('http') && (
        <a
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="hover:bg-accent/40 text-muted-foreground hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-md"
        >
          ↗
        </a>
      )}
      <button
        type="button"
        onClick={() => onSave(inputRef.current?.value.trim() ?? '')}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-2.5 py-1 text-xs font-semibold"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Unlink"
        className="hover:bg-destructive/15 text-muted-foreground hover:text-destructive inline-flex h-7 w-7 items-center justify-center rounded-md"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
