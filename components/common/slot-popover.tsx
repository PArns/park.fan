'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ArrowRight } from 'lucide-react';

import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/** A slot under the pointer: its element and the number its data attribute holds. */
interface Slot {
  el: HTMLElement;
  index: number;
}

/**
 * Hover and tap for a row of slots that share one panel, such as the days of the twelve-month
 * outlook or the weekdays of the park header. A mouse shows a slot's panel while it hovers and can
 * move into it to press its link: leaving the row closes only after a short grace, which entering
 * the panel cancels. A tap pins the panel. The panel hangs off whichever slot is
 * active, so moving along the row moves one panel instead of mounting one per slot.
 *
 * Slots are found by event delegation on `data-<slotKey>`: the row can be server-rendered markup,
 * and only the container needs the handlers.
 */
export function useSlotPopover({
  slotKey,
  isEnabled = () => true,
  onMouseClick,
}: {
  /** The dataset key of a slot's index: `'day'` reads `data-day`. */
  slotKey: string;
  /** Whether a slot opens the panel at all. */
  isEnabled?: (index: number) => boolean;
  /**
   * What a mouse click on a slot does instead of pinning the panel. Return `false` to pin after
   * all. A touch always pins: it has no hover that showed the panel first.
   */
  onMouseClick?: (index: number) => boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // A ref rather than state: Radix's anchor reads it on every render, and the render that moves it
  // is the `setActive` in `show`.
  const anchorRef = useRef<HTMLElement | null>(null);
  // Which pointer pressed last, read by the click that follows it.
  const pointerTypeRef = useRef('mouse');

  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  // What the panel shows while it fades out, after `active` has gone back to `null`.
  const [shown, setShown] = useState(0);

  const slotAt = (target: EventTarget | null): Slot | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>(`[data-${slotKey}]`) : null;
    if (!el || !containerRef.current?.contains(el)) return null;
    const index = Number(el.dataset[slotKey]);
    return Number.isInteger(index) && isEnabled(index) ? { el, index } : null;
  };

  const show = (slot: Slot, pin: boolean) => {
    anchorRef.current = slot.el;
    setActive(slot.index);
    setShown(slot.index);
    setPinned(pin);
  };

  const close = () => {
    setActive(null);
    setPinned(false);
  };

  // The way from the row up into the panel crosses a gap and leaves the row: wait that long.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const closeSoon = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || pinned) return;
    cancelClose();
    closeTimer.current = setTimeout(close, CLOSE_GRACE_MS);
  };
  useEffect(() => cancelClose, []);

  const handlers = {
    onPointerDown: (event: React.PointerEvent) => {
      pointerTypeRef.current = event.pointerType;
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (event.pointerType !== 'mouse' || pinned) return;
      cancelClose();
      const slot = slotAt(event.target);
      if (slot && slot.index !== active) show(slot, false);
    },
    onPointerLeave: closeSoon,
    onClick: (event: React.MouseEvent) => {
      const slot = slotAt(event.target);
      if (!slot) return;
      if (pointerTypeRef.current === 'mouse' && onMouseClick?.(slot.index)) return;
      show(slot, true);
    },
  };

  /** For the panel: the pointer inside it keeps it open, leaving it closes like leaving the row. */
  const panelHandlers = { onPointerEnter: cancelClose, onPointerLeave: closeSoon };

  return { containerRef, anchorRef, active, shown, pinned, close, handlers, panelHandlers };
}

/** How long a panel stays after the pointer left the row or the panel, for the way between them. */
const CLOSE_GRACE_MS = 200;

/**
 * The panel of a {@link useSlotPopover} row: above the active slot, glass like the site's other
 * popovers, taking no focus (a hover panel has no trigger to hand it back to). A fixed width, so
 * moving along the row does not make the panel breathe; no padding, so a panel can run an accent
 * across its top edge and a footer link across its bottom. Takes the hook's values one by one:
 * an object holding refs reads as a ref to the React compiler.
 */
export function SlotPopover({
  open,
  anchorRef,
  containerRef,
  onClose,
  panelHandlers,
  className,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  /** The hook's `panelHandlers`. */
  panelHandlers: {
    onPointerEnter: () => void;
    onPointerLeave: (event: React.PointerEvent) => void;
  };
  className?: string;
  children: ReactNode;
}) {
  return (
    <Popover open={open} onOpenChange={(next) => !next && onClose()}>
      <PopoverAnchor virtualRef={anchorRef as RefObject<HTMLElement>} />
      <PopoverContent
        side="top"
        sideOffset={6}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // A tap on another slot moves the panel; only a tap elsewhere closes it.
        onPointerDownOutside={(event) => {
          if (containerRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        {...panelHandlers}
        // `z-[90]`, the tooltip layer: a hover panel must not slide under the sticky header
        // (components/ui/tooltip.tsx).
        className={cn(
          'z-[90] w-64 max-w-[calc(100vw-1rem)] overflow-hidden p-0 text-xs',
          className
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** A {@link SlotPopover}'s way onward, as a footer across the panel's bottom edge. */
export function SlotPopoverLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="border-border/60 text-primary hover:bg-muted/50 flex items-center justify-between gap-2 border-t px-3 py-2 font-medium transition-colors"
    >
      {children}
      <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
    </Link>
  );
}
