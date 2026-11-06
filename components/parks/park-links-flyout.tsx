'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { cn } from '@/lib/utils';
import { GLASS_BUTTON } from '@/components/common/glass-card';

/**
 * „Mehr ›" beside the planner in the park's title card: the park's outbound links (website,
 * tickets, Wikipedia, socials) slide out to its right when the pointer reaches the button, on focus
 * or on a tap, so the row holds one call to action instead of a dozen buttons. They close when the
 * pointer leaves the whole title card, not the button: a strip that shut as the mouse crossed to it
 * was the annoying part. The links float over the layout rather than joining
 * the row: a hover is no input that excuses a layout shift, and a row that wrapped would be one.
 * They arrive server-rendered as `children`. Each opening is `park_links_opened`, with the park.
 */
export function ParkLinksFlyout({
  label,
  parkId,
  children,
}: {
  label: string;
  parkId?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggle = (next: boolean) => {
    if (next && !open) trackSiteEvent('park_links_opened', {}, parkId);
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

  return (
    <div
      ref={rootRef}
      className="relative"
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
        className={cn(
          'absolute top-1/2 left-full z-20 flex -translate-y-1/2 items-center gap-3 pl-2 whitespace-nowrap transition-[opacity,translate] duration-200 motion-reduce:transition-none',
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
