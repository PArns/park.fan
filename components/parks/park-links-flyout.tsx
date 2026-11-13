'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { cn } from '@/lib/utils';
import { GLASS_BUTTON } from '@/components/common/glass-card';

/** The panel's `pl-2` beside the button. */
const BESIDE_INSET = 8;
/** The panel's `p-2` and border, both sides, over the row. */
const ABOVE_INSET = 18;

/** Over the row: the panel's offset from the button and the width it may wrap to. */
type AbovePlacement = { left: number; maxWidth: number };

/**
 * Where the links stand: beside the button when they fit before the right edge of the row it
 * stands in, else over the row, as close to the button as the row allows and wrapped to its width
 * (`null` is beside). Measured, because the room depends on the park's name in the planner button,
 * the locale and whether a window stands beside the text. The bands do not wrap inside, so their
 * widths are the same whichever side the panel stood on last.
 */
function placeLinks(root: HTMLElement, panel: HTMLElement): AbovePlacement | null {
  const bound = root.parentElement?.getBoundingClientRect();
  if (!bound) return null;
  const button = root.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(panel).columnGap) || 0;
  const widths = [...panel.children].map((band) => band.getBoundingClientRect().width);
  const links = widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, widths.length - 1);
  if (button.right + BESIDE_INSET + links <= bound.right) return null;
  const width = Math.min(links + ABOVE_INSET, bound.width);
  const left = Math.max(bound.left - button.left, Math.min(0, bound.right - button.left - width));
  return { left, maxWidth: bound.width };
}

/**
 * „Mehr ›" beside the planner in the park's title card: the park's outbound links (website,
 * tickets, Wikipedia, socials) slide out to its right when the pointer reaches the button, on focus
 * or on a tap, so the row holds one call to action instead of a dozen buttons. They close when the
 * pointer leaves the whole title card, not the button: a strip that shut as the mouse crossed to it
 * was the annoying part. The links float over the layout rather than joining
 * the row: a hover is no input that excuses a layout shift, and a row that wrapped would be one.
 * Where they do not fit beside the button inside the row it stands in (its parent, as wide as the
 * title card's text), they open over the row on an opaque panel, so they never reach the guide's
 * window beside the text or run off a tablet's screen.
 * They arrive server-rendered as `children`. Each opening is `park_links_opened`, with the park.
 */
export function ParkLinksFlyout({
  label,
  parkId,
  className,
  children,
}: {
  label: string;
  parkId?: string;
  /** On the root, which must be an item of the row itself: its parent is the links' bound. */
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState<AbovePlacement | null>(null);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const place = useCallback(() => {
    if (rootRef.current && panelRef.current) {
      setAbove(placeLinks(rootRef.current, panelRef.current));
    }
  }, []);
  const toggle = (next: boolean) => {
    if (next && !open) {
      trackSiteEvent('park_links_opened', {}, parkId);
      // In the same commit as `open`, so the links never show at the side they do not fit.
      place();
    }
    setOpen(next);
  };

  // The card around the row, the `GlassCard` of `ParkPageShell`; leaving it is what closes.
  useEffect(() => {
    if (!open) return;
    const card = rootRef.current?.closest('[data-glass-card]');
    if (!card) return;
    const close = (event: Event) => {
      if ((event as PointerEvent).pointerType === 'mouse') setOpen(false);
    };
    card.addEventListener('pointerleave', close);
    return () => card.removeEventListener('pointerleave', close);
  }, [open]);

  // A resize while they are open moves the bound under them.
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, place]);

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onFocus={() => toggle(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) toggle(false);
      }}
      onKeyDown={(event) => event.key === 'Escape' && toggle(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        // Mouse only: a tap fires the pointer events too, and the click after it would close again.
        onPointerEnter={(event) => event.pointerType === 'mouse' && toggle(true)}
        onClick={() => toggle(!open)}
        className={cn(GLASS_BUTTON, open && 'bg-background/70')}
      >
        {label}
        <ChevronRight
          className={cn('h-4 w-4 opacity-70 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {/* `pl-2` rather than a margin: the gap belongs to the panel, so the pointer crossing it
          does not leave the box and close it. */}
      <div
        id={panelId}
        ref={panelRef}
        style={above ? { left: above.left, maxWidth: above.maxWidth } : undefined}
        className={cn(
          'absolute z-20 flex items-center gap-3 whitespace-nowrap transition-[opacity,translate] duration-200 motion-reduce:transition-none',
          above
            ? 'bg-popover border-border/60 bottom-full mb-2 w-max flex-wrap rounded-xl border p-2 shadow-lg'
            : 'top-1/2 left-full -translate-y-1/2 pl-2',
          open
            ? 'visible translate-x-0 opacity-100'
            : 'pointer-events-none invisible -translate-x-2 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}
