'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * How hard the confirming button pushes back. The button about to be pressed is the only element
 * that can tell "this saves something" from "this throws something away" at a glance.
 */
export type ConfirmTone = 'default' | 'destructive';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The question, short enough to be read at a glance. */
  title: React.ReactNode;
  /**
   * What actually happens, and what is gone afterwards. Without it the dialog passes
   * `aria-describedby={undefined}`, Radix's documented way to say there is none, rather than
   * repeating the title in an `sr-only` paragraph.
   */
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /**
   * Runs, and then the dialog closes. Synchronous on purpose: an async variant needs a pending
   * flag, a disabled button and an error slot that no caller has needed yet.
   */
  onConfirm: () => void;
  /**
   * Runs when the cancel button is pressed, and only then, for a question whose two buttons are
   * both answers. Escape and the overlay still only close, which is why this is not
   * `onOpenChange(false)`: a reflex away from the dialog must not count as a choice.
   */
  onCancel?: () => void;
  tone?: ConfirmTone;
  /**
   * Greys out the way on, for a question whose answer can be empty. The way out is never disabled.
   */
  confirmDisabled?: boolean;
  /**
   * What the reader has to look at before they can answer (a list to tick, a choice to make), in
   * its own scroll region so a long list does not push the buttons off a phone. Its state stays
   * with the caller.
   */
  children?: React.ReactNode;
  /**
   * A Lucide component, drawn once in a tinted tile beside the title; not again on the button,
   * which already carries the tone.
   */
  icon?: LucideIcon;
  /**
   * Names the dialog for a script: `data-confirm-dialog` on the content, `data-confirm-cancel` and
   * `data-confirm-action` on the buttons, which a browser check cannot find by label in six
   * languages.
   */
  marker?: string;
}

/**
 * Asks before doing something that cannot be taken back, in place of `window.confirm`, which an
 * embedded view or a "prevent additional dialogs" tick turns into a silent `false`. The cancel
 * button takes the focus, never the confirming one, so a first Enter cannot delete; Escape and the
 * overlay cancel. Every label arrives as a prop, so the primitive is not tied to the planner.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'default',
  confirmDisabled = false,
  children,
  icon: Icon,
  marker,
}: ConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const destructive = tone === 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `flex` and `p-0` over the dialog's grid so the footer's rule spans the full width;
          `sm:max-w-md` because this is one sentence and two buttons. */}
      <DialogContent
        data-confirm-dialog={marker}
        showCloseButton={false}
        {...(description ? {} : { 'aria-describedby': undefined })}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <div className="flex items-start gap-3 px-5 py-4 sm:px-6 sm:py-5">
          {Icon && (
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                destructive
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base leading-snug font-semibold sm:text-lg">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1.5 text-xs leading-relaxed sm:text-sm">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>

        {/* Its own scroll region so the footer stays reachable when a list is taller than the
            dialog; `overscroll-contain` keeps a flick from scrolling the page behind. */}
        {children && (
          <div className="max-h-[45vh] overflow-y-auto overscroll-contain px-5 pb-4 sm:px-6">
            {children}
          </div>
        )}

        {/* `px-3` below `sm` so the longest pair of labels in six locales fits at 320 px.
            `max-sm:min-h-11` is a touch-target floor for a caller passing `lg`, which has no phone
            tier, and `flex-wrap` lets a pair of long answers break onto two rows. */}
        <div className="border-border/60 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-3 py-3 sm:px-6">
          <DialogClose asChild>
            <Button
              ref={cancelRef}
              variant="ghost"
              size="sm"
              className="max-sm:min-h-11"
              onClick={onCancel}
              data-confirm-cancel=""
            >
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            className="max-sm:min-h-11"
            disabled={confirmDisabled}
            data-confirm-action=""
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
