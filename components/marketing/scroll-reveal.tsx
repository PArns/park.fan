'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight scroll-reveal: fades + rises its children in the first time they
 * enter the viewport, then stays put (one-shot observer). SSR-safe — the text is
 * always in the DOM (only visually transparent before reveal, so crawlers still
 * read it) and `prefers-reduced-motion` users get the content shown instantly.
 *
 * Shared marketing/editorial primitive (Fancast, best-time hub, …).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  containsGlass = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /**
   * Set this when anything inside carries `backdrop-filter`, and the fade is dropped for it.
   *
   * `opacity` below 1 makes an element a backdrop root, so for the 700 ms this is fading, every
   * frosted panel underneath it blurs an empty backdrop instead of the page — flat glass for the
   * whole reveal, snapping to the real material on the frame `opacity` reaches exactly 1. It is
   * the same constraint `.pk-reveal` in `app/globals.css` states as a flat rule ("this only goes
   * on sections with NO glass in them") and `lib/hooks/use-tile-reveal.ts` designs around
   * ("Nothing touches the glass"); this component predates both.
   *
   * The rise stays. Tailwind v4 compiles `translate-y-*` to the standalone `translate` property,
   * which Chromium does not treat as a backdrop root — measured in `components/parks/card-pointer-fx.tsx`,
   * where a panel's backdrop detail held at 26.96 against 26.84 under one. So a glass section
   * still settles in, it just does not fade, exactly as the entry tiles do not.
   */
  containsGlass?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reduced-motion users are handled purely in CSS (motion-reduce:* below keeps
    // the content visible), so the observer only drives the motion-safe reveal.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out',
        containsGlass
          ? shown
            ? 'translate-y-0'
            : 'translate-y-6 motion-reduce:translate-y-0'
          : shown
            ? 'translate-y-0 opacity-100'
            : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Animated scroll-down chevron for a full-bleed hero. Links to the page's
 *  `#start` anchor. Purely decorative. */
export function ScrollCue({ label }: { label: string }) {
  return (
    <a
      href="#start"
      aria-label={label}
      className="group text-foreground/70 hover:text-foreground absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium tracking-wide uppercase transition-colors"
    >
      <span>{label}</span>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="motion-safe:animate-bounce"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </a>
  );
}
