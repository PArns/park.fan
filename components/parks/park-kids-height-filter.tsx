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
 * list, where a phone shows no other height control. The same {@link RiderHeightFilter} over the
 * same state (`ParkHeightFilterContext`), so it filters the list above; its button switches to the
 * ride list and scrolls it into view.
 *
 * The block stays where the finger is: each step changes the height of the list above the thumb,
 * and Safari does no scroll anchoring. So the first change starts a hold that scrolls the block
 * back by what it moved on every `<body>` resize, before paint. The hold ends with the reader's
 * next input elsewhere or a scroll this block did not make.
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
