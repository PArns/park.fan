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
 * How hard the confirming button pushes back.
 *
 * `destructive` is not decoration. The two cases a reader has to tell apart in
 * half a second are "this saves something" and "this throws something away",
 * and the only element that can carry that distinction is the button they are
 * about to press: the rest of the dialog is prose, and prose is what somebody
 * skips once they already know which row they clicked.
 */
export type ConfirmTone = 'default' | 'destructive';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The question, short enough to be read at a glance. */
  title: React.ReactNode;
  /**
   * What actually happens, and what is gone afterwards.
   *
   * Optional, and where it is omitted the dialog tells Radix there is no
   * description (`aria-describedby={undefined}`) instead of repeating the title
   * into an `sr-only` paragraph. A screen reader that hears the same sentence
   * twice learns nothing the second time, and the explicit `undefined` is
   * Radix's own documented way of saying "there is none" — without it the
   * primitive logs a missing-description warning on every open.
   */
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /**
   * Runs, and then the dialog closes.
   *
   * Synchronous on purpose. Both callers change local state, and an async
   * variant needs a pending flag, a disabled button and somewhere to put an
   * error — three decisions no call site has had to make yet, and three guesses
   * if they were made here first.
   */
  onConfirm: () => void;
  tone?: ConfirmTone;
  /**
   * A Lucide component, drawn in a tinted tile beside the title.
   *
   * Same tile as the planner wizard's answer cards (`size-8 rounded-lg` around
   * a `size-4` glyph), so a delete dialog opening out of a row with a bin in it
   * shows that bin again at the same weight. Drawn **once**: repeating it on the
   * confirming button puts the same glyph twice in a box this small, and the
   * button already carries the tone.
   */
  icon?: LucideIcon;
}

/**
 * Ask before doing something that cannot be taken back.
 *
 * It replaces `window.confirm`, which is not a question the browser has to ask.
 * An embedded view, a preview pane, or a visitor who once ticked "prevent this
 * page from creating additional dialogs" all make it return `false` without
 * showing anything, and `false` reads as "no" — so the action silently never
 * happens and nothing on screen says why. The same trap was found and fixed
 * twice under `/admin` (`media-detail`, `season-editor`); the planner was the
 * last place on the public site still asking the browser.
 *
 * The second reason is plainer. A native box is drawn by the operating system,
 * in the operating system's font, with the origin printed above it. It is the
 * one element on the page that cannot be styled, carries no icon, and reads as
 * a security prompt rather than as part of the panel it came out of.
 *
 * **The cancelling button takes the focus, never the confirming one.** Radix
 * otherwise focuses the first tabbable child of the content, and a dialog that
 * opens with "Löschen" under the caret deletes on the first Enter, pressed by
 * somebody who had not finished reading. So `onOpenAutoFocus` is prevented and
 * the cancel button is focused by hand, which is deterministic in a way "put
 * cancel first in the DOM" is not: the footer's order is a layout decision and
 * the next caller is free to change it.
 *
 * Escape and a click on the overlay both cancel. That is Radix's default and is
 * deliberately left alone: a confirmation nobody can back out of by reflex is a
 * confirmation people learn to click through.
 *
 * It carries **no translation keys**. A primitive under `components/ui/` that
 * calls `useTranslations('planner')` is a primitive only the planner can use,
 * and the second caller would have to move the strings or copy the file. Every
 * label arrives as a prop.
 *
 * The visual language is the planner wizard's, since that is where the first two
 * callers live: `p-0` on the content so the footer's rule reaches both edges,
 * the body at `px-5 py-4 sm:px-6`, and the wizard's own footer — a `border-t` at
 * `border-border/60`, a `ghost` button for the way out, a full-weight one for
 * the way on.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = 'default',
  icon: Icon,
}: ConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const destructive = tone === 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `flex` over the grid the dialog ships with, plus `p-0`, which is the
          same pair of overrides the wizard makes and for the same reason: the
          footer's rule has to span the full width.

          Narrower than the wizard at `sm:max-w-md`. This is one sentence and two
          buttons, and 512 px around them reads as a dialog somebody forgot to
          fill in. */}
      <DialogContent
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

        {/* `px-3` below `sm` rather than the body's `px-5`, for the wizard's own
            reason: this row is the one place a label decides the width, and the
            longest pair of labels in six locales has to fit at 320 px without
            either button being squeezed.

            `max-sm:min-h-11` on both, although the button scale already resolves
            `sm` and `default` to 44 px below `sm`. It is a floor rather than a
            second copy of that height, so a caller reaching for `lg` — the one
            size with no phone tier — still clears the touch target. */}
        <div className="border-border/60 flex shrink-0 items-center justify-end gap-2 border-t px-3 py-3 sm:px-6">
          <DialogClose asChild>
            <Button ref={cancelRef} variant="ghost" size="sm" className="max-sm:min-h-11">
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            className="max-sm:min-h-11"
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
