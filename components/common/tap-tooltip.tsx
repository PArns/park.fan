'use client';

import { useRef, useState, type ReactNode, type Ref } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';

/**
 * The trigger's box. Exported because a stand-in button that mounts the real tooltip on first
 * contact (`RideCrowdScaleTooltip`) has to be the same box, or the badge would shift by a pixel the
 * moment the real tooltip replaces it.
 *
 * `w-fit` because the trigger is a flex item wherever these badges sit, and a stretched flex child
 * would put cursor-help and the tooltip's anchor over empty space beside the badge.
 */
export const TAP_TOOLTIP_TRIGGER_CLASS =
  'focus-visible:ring-ring/60 inline-flex w-fit cursor-help rounded-full focus-visible:ring-2 focus-visible:outline-none';

interface TapTooltipProps {
  /** The badge or icon that opens it. */
  children: ReactNode;
  /** The panel. Rendered inside `TooltipContent`'s glass. */
  content: ReactNode;
  /** Width and padding of the panel; the default suits a short list. */
  contentClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** The trigger's accessible name, where its children are an icon. */
  label?: string;
  /** Mount already open — for a trigger that replaces a stand-in the pointer is already on. */
  defaultOpen?: boolean;
  triggerRef?: Ref<HTMLButtonElement>;
  triggerClassName?: string;
  /**
   * The trigger sits inside a link, and a click on it must not follow that link.
   *
   * Every click is then swallowed: `preventDefault()` stops the anchor's navigation and
   * `stopPropagation()` keeps it from the `<Link>`'s own handler, the same pair `FavoriteStar`
   * uses on the ride card.
   */
  insideLink?: boolean;
}

/**
 * A tooltip that a tap opens too: the crowd scale behind a badge, the works windows behind the
 * „Umbaupause" marker.
 *
 * **Opened by tap, not only by hover.** Radix's tooltip ignores touch moves, suppresses the
 * focus-open a tap would produce and closes on click, so on a phone nothing could open it. The
 * open state is controlled here and a non-mouse pointer toggles it; `preventDefault()` keeps
 * Radix's own handler from running. Closing again (second tap, tap outside, scroll) is Radix's.
 */
export function TapTooltip({
  children,
  content,
  contentClassName = 'w-60 max-w-[calc(100vw-2rem)] p-3',
  side = 'bottom',
  label,
  defaultOpen = false,
  triggerRef,
  triggerClassName,
  insideLink = false,
}: TapTooltipProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Which pointer opened it, remembered across the pointerdown → click pair.
  const tappedRef = useRef(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        ref={triggerRef}
        type="button"
        aria-label={label}
        className={cn(
          TAP_TOOLTIP_TRIGGER_CLASS,
          // A badge is 22 px high. Outside a card the 44 px target can grow around it; inside a
          // ride card it cannot: the badge row there is `overflow-hidden` and clips the
          // pseudo-element to the row.
          !insideLink && PHONE_HIT_AREA,
          triggerClassName
        )}
        onPointerDown={(event) => {
          tappedRef.current = event.pointerType !== 'mouse';
          // Only the opening half is ours. Radix's own pointerdown handler must still run: it
          // closes an open tooltip (so the second tap closes) and sets the `isPointerDownRef`
          // that stops the focus a tap leaves behind from reopening it.
          if (tappedRef.current && !open) setOpen(true);
        }}
        onFocus={(event) => {
          // That guard does not survive a tap in Chrome on Android: pointerup (which clears
          // `isPointerDownRef`) fires BEFORE the compatibility mousedown that moves the focus.
          // The tap flag is still set then (the click clears it), so a focus under it is the
          // tap's, and Radix's focus-open is skipped.
          if (tappedRef.current) event.preventDefault();
        }}
        onClick={(event) => {
          if (insideLink) {
            event.preventDefault();
            event.stopPropagation();
          }
          // Radix closes on click, which would undo the tap that just opened it. Only a tap
          // is swallowed, and the flag is cleared here rather than on the next pointerdown:
          // a keyboard Enter is a click with no pointer event before it, and it would
          // otherwise inherit the last tap and never reach Radix.
          if (!tappedRef.current) return;
          tappedRef.current = false;
          event.preventDefault();
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={contentClassName}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
