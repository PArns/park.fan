'use client';

import { useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { RiderHeightFilter } from '@/components/parks/rider-height-filter';
import { useParkHeightFilter } from '@/components/parks/park-height-filter-context';
import { trackAttractionFilterUsed } from '@/lib/analytics/umami';
import { cn } from '@/lib/utils';

/** What ends a hold when it lands anywhere but on the slider itself. */
const READER_INPUTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * The rider-height slider a second time, in the park page's „Mit Kindern“ block under the ride
 * list.
 *
 * On a phone the panel's slider is behind the „Filter“ button (PAR-430), and a parent who has
 * scrolled through the rides to the block about children found a link and no control. This is the
 * same {@link RiderHeightFilter} over the same state (`ParkHeightFilterContext`): moving it filters
 * the list above, lights the phone's chip and moves the panel's thumb, and its readout is the
 * panel's count. The button under it switches to the ride list and scrolls it into view, because
 * from down here the filtered list is out of sight.
 *
 * **The block stays where the finger is.** The list it filters lies above it, so every step of
 * the slider changes the height of what is above the thumb: the phone's chip row appears in the
 * slider's own commit, the grid shrinks or grows in the deferred one, and a land whose
 * reservation came within reach mounts a frame after that. Safari does no scroll anchoring, and
 * there the block went 4,180 px up the page on the first step at 390 px (Phantasialand, measured
 * in Chromium with `overflow-anchor: none`). So the first change starts a hold: the block notes
 * where it stands on screen, and every resize of `<body>` after that scrolls it back by what it
 * moved, before the frame is painted. Where the browser has already anchored, it moved 0 and
 * nothing is scrolled.
 *
 * The hold ends with the reader's next input anywhere else (a tap, a key, a wheel) or a scroll
 * this block did not make, so it never pulls against somebody reading on. Layout is read once per
 * change and once per resize.
 */
export function ParkKidsHeightFilter({
  toListLabel,
  className,
}: {
  /** The button's label, resolved on the server. */
  toListLabel: string;
  className?: string;
}) {
  const filter = useParkHeightFilter();
  const rootRef = useRef<HTMLDivElement>(null);
  /** Ends the running hold; `null` while there is none. */
  const releaseRef = useRef<(() => void) | null>(null);

  useEffect(() => () => releaseRef.current?.(), []);

  if (!filter) return null;

  const hold = () => {
    const root = rootRef.current;
    if (releaseRef.current || !root) return;
    const input = root.querySelector('input[type="range"]');
    const top = root.getBoundingClientRect().top;
    /** `scrollY` after this block's own last scroll; any other value is the reader's. */
    let ownScrollY = window.scrollY;

    const resized = new ResizeObserver(() => {
      const moved = root.getBoundingClientRect().top - top;
      if (Math.abs(moved) >= 1) window.scrollBy(0, moved);
      ownScrollY = window.scrollY;
    });
    const onScroll = () => {
      if (Math.abs(window.scrollY - ownScrollY) > 1) release();
    };
    const onInput = (event: Event) => {
      if (event.target !== input) release();
    };
    function release() {
      resized.disconnect();
      window.removeEventListener('scroll', onScroll);
      for (const type of READER_INPUTS) window.removeEventListener(type, onInput, true);
      releaseRef.current = null;
    }

    resized.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    for (const type of READER_INPUTS)
      window.addEventListener(type, onInput, { capture: true, passive: true });
    releaseRef.current = release;
  };

  return (
    <div
      ref={rootRef}
      className={cn('border-foreground/12 dark:border-foreground/15 border-t pt-3', className)}
    >
      <RiderHeightFilter
        className="sm:max-w-80"
        stops={filter.stops}
        value={filter.value}
        onChange={(cm) => {
          if (filter.value === null && cm !== null) trackAttractionFilterUsed('height');
          hold();
          filter.onChange(cm);
        }}
        rideableCount={filter.rideableCount}
        totalCount={filter.totalCount}
      />
      <button
        type="button"
        onClick={filter.showList}
        className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline max-sm:min-h-11"
      >
        <ArrowUp className="h-4 w-4 shrink-0" aria-hidden="true" />
        {toListLabel}
      </button>
    </div>
  );
}
