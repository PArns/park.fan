'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight scroll-reveal: fades + rises its children in the first time they
 * enter the viewport, then stays put (one-shot observer). SSR-safe — the text is
 * always in the DOM (only visually transparent before reveal, so crawlers still
 * read it) and `prefers-reduced-motion` users get the content shown instantly.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
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
        shown
          ? 'translate-y-0 opacity-100'
          : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Animated scroll-down chevron for the hero. Purely decorative. */
export function ScrollCue({ label }: { label: string }) {
  return (
    <a
      href="#start"
      aria-label={label}
      className="group text-primary-foreground/70 hover:text-primary-foreground absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium tracking-wide uppercase transition-colors"
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
