'use client';

/**
 * Sheet primitives (shadcn/ui on Radix Dialog): a panel that slides in from any side, with overlay,
 * a close button that `hideClose` drops, header, footer, title and description. Draws the header's
 * burger menu and the trip planner.
 */
import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * `z-[70]` on both halves, matching `dialog.tsx`: a modal outranks the `z-[60]` language banner.
 */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[70] bg-black/50',
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  modal,
  hideClose = false,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Mirrors the root's `modal`; a non-modal sheet renders no overlay. */
  modal?: boolean;
  /**
   * Drops the ×. Opt-in per call site, since the burger menu has nothing else to close it with.
   * Pass it only where the sheet draws its own close control, as the planner's bottom sheet does in
   * its grab-handle row: a sheet with no × and no way out is a trap.
   */
  hideClose?: boolean;
}) {
  return (
    <SheetPortal>
      {/* No shield on a non-modal sheet: it would cover the page it is
          deliberately leaving interactive, and swallow the very drag a side
          panel exists to receive. */}
      {modal !== false && <SheetOverlay />}
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          // 300 ms both ways, matching `--planner-inset-ms` (`app/[locale]/layout.tsx`): the page
          // beside an open planner reflows on its own padding transition, and a slower panel leaves
          // a strip of bare background between the two. `animate-in` reads `--tw-ease`, so
          // `ease-in-out` sets the easing of both the animation and the transition.
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-[70] flex flex-col gap-4 shadow-lg transition duration-300 ease-in-out',
          side === 'right' &&
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
          side === 'left' &&
            'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
          side === 'top' &&
            'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
          side === 'bottom' &&
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
          className
        )}
        {...props}
      >
        {children}
        {/* A 16 px glyph whose target grows to 44 on a phone (`planner-phone:`), centred on the
            glyph. `SheetPrimitive.Content` is its positioned ancestor, so an `overflow-y-auto` on
            the content scrolls it away: give the scroll to a child (see the burger sheet in
            components/layout/header.tsx). */}
        {!hideClose && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary planner-phone:top-2 planner-phone:right-2 planner-phone:size-11 planner-phone:rounded-md absolute top-4 right-4 flex items-center justify-center rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
