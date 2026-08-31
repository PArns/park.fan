'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Rest on the blog band and it opens the posts behind it.
 *
 * Same gesture the header's country rows use, and for the same reason: this band
 * sits directly under the hero, so the way to everything below it leads across
 * it. Opening on `pointerenter` would drop a panel over the page every time
 * somebody scrolled past. Entering only ARMS the panel, leaving before the dwell
 * is up disarms it. Focus is exempt — a keyboard user landed here on purpose.
 *
 * The panel FLOATS. Growing the band in flow would push the whole page down on
 * hover, which is a layout shift somebody triggers by moving the mouse. And
 * nothing in this subtree may carry `backdrop-filter` or a transform: either
 * makes this element a backdrop root and the panel's glass would have only the
 * band to sample.
 *
 * Touch devices never fire the dwell and never see the panel. That is the
 * intended outcome rather than a gap: on a phone the band is one post and a link
 * to the blog, and the chapter further down the page carries the full list.
 */
const DWELL_MS = 140;

export function BlogTeaserReveal({
  children,
  panel,
}: {
  /** The always-visible band row. */
  children: ReactNode;
  /** The extra posts, rendered on the server and only shown once open. */
  panel: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disarm = () => {
    if (dwell.current !== null) {
      clearTimeout(dwell.current);
      dwell.current = null;
    }
  };

  useEffect(() => disarm, []);

  return (
    <div
      className="relative"
      onPointerEnter={(e) => {
        // Touch fires a pointerenter right before the tap. Arming on it would
        // open the panel under the finger on the way to the link.
        if (e.pointerType !== 'mouse') return;
        disarm();
        dwell.current = setTimeout(() => {
          dwell.current = null;
          setOpen(true);
        }, DWELL_MS);
      }}
      onPointerLeave={() => {
        disarm();
        setOpen(false);
      }}
      onFocus={() => {
        disarm();
        setOpen(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {children}

      <div
        // `hidden` rather than unmounting: the covers are already decoded and
        // remounting them would fetch again on every pass of the mouse.
        hidden={!open}
        className={cn(
          'border-border bg-popover/95 absolute inset-x-0 top-full z-30 border-b shadow-2xl backdrop-blur-xl'
        )}
      >
        <div className="container mx-auto px-4 py-3">{panel}</div>
      </div>
    </div>
  );
}
