'use client';

import type { ReactNode } from 'react';
import { Field as AdminField } from '../../_ui/controls';
import { cn } from '@/lib/utils';

/** The blog editor's labelled field: the admin's shared one, with `error` as a boolean. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Boolean here, a message in the shared component: when set, the hint is the error text. */
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <AdminField label={label} hint={error ? undefined : hint} error={error ? (hint ?? ' ') : null}>
      {children}
    </AdminField>
  );
}

/** The text field of the editor's create dialogs; a variant adds to it with `cn`. */
export const MODAL_INPUT_CLASS =
  'bg-background/60 border-border/60 focus:border-primary/50 text-foreground rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none';

/** The foot of a create dialog: the two shortcuts, cancel, and the save button under `label`. */
export function ModalFooter({
  valid,
  onClose,
  onSubmit,
  label,
}: {
  valid: boolean;
  onClose: () => void;
  onSubmit: () => void;
  label: string;
}) {
  return (
    <div className="border-border/60 bg-muted/20 flex items-center gap-2 border-t px-4 py-3">
      <span className="text-muted-foreground/70 mr-auto hidden text-[10px] sm:block">
        <kbd className="bg-muted rounded px-1 py-0.5 font-mono">Esc</kbd> cancel ·{' '}
        <kbd className="bg-muted rounded px-1 py-0.5 font-mono">⌘⏎</kbd> save
      </span>
      <button
        type="button"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-xs font-semibold"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={!valid}
        onClick={onSubmit}
        className={cn(
          'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
          valid
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        {label}
      </button>
    </div>
  );
}
