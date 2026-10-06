'use client';

import { useEffect, useRef, useState } from 'react';
import { List } from 'lucide-react';
import type { TocEntry } from '@/lib/blog/toc';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

interface BlogTocListProps {
  entries: TocEntry[];
  title: string;
  label: string;
}

/**
 * Renders the table of contents and scroll-spies the headings: the section the
 * reader is currently in is highlighted (bold). The active heading is the last
 * one whose top has scrolled past a fixed offset below the sticky header.
 * Heading positions are measured once (and on layout changes), so the
 * per-scroll path is a plain scrollY comparison without layout reads; state
 * only updates async (scroll/observer callbacks), never inside the effect body.
 */
export function BlogTocList({ entries, title, label }: BlogTocListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  // The list sits in a `hidden lg:block` aside, so below `lg` it does not spy at all. Rem, like
  // Tailwind's own `lg`.
  const visible = useMediaQuery('(min-width: 64rem)');

  useEffect(() => {
    if (!visible) return;
    const ids = entries.map((e) => e.id);
    const offset = 120;

    // Cache each heading's document-space Y once instead of calling
    // getBoundingClientRect for every heading on every scroll frame — the
    // per-scroll path below is then a pure scrollY comparison (no layout reads).
    let tops: { id: string; top: number }[] = [];
    const measureTops = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      tops = [];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) tops.push({ id, top: el.getBoundingClientRect().top + scrollTop });
      }
    };

    const apply = () => {
      const y = (window.scrollY || document.documentElement.scrollTop) + offset;
      let current: string | null = null;
      for (const t of tops) {
        if (t.top <= y) current = t.id;
        else break;
      }
      setActiveId(current); // bails out while the section is unchanged
    };

    // rAF-throttle: scroll can fire more than once per frame.
    let frame: number | null = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        apply();
      });
    };

    // Heading positions only move when layout changes — images/lazy content
    // growing the body, or a viewport resize.
    let measureFrame: number | null = null;
    const scheduleMeasure = () => {
      if (measureFrame !== null) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = null;
        measureTops();
        apply();
      });
    };

    // No sync measure/setState here: ResizeObserver always delivers an initial
    // callback right after observe(), which runs measureTops + apply async —
    // that also highlights the right section on anchor-link loads.
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      if (measureFrame !== null) cancelAnimationFrame(measureFrame);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [entries, visible]);

  // Keep the active entry visible inside the sticky sidebar's own scroll box. Scrolls only the
  // `data-toc-scroll` container, never the window, and does nothing when it does not overflow.
  useEffect(() => {
    if (!activeId) return;
    const link = activeRef.current;
    const container = link?.closest('[data-toc-scroll]');
    if (!link || !(container instanceof HTMLElement)) return;
    if (container.scrollHeight <= container.clientHeight) return;
    const pad = 24;
    const linkRect = link.getBoundingClientRect();
    const boxRect = container.getBoundingClientRect();
    if (linkRect.top < boxRect.top + pad) {
      container.scrollTop -= boxRect.top + pad - linkRect.top;
    } else if (linkRect.bottom > boxRect.bottom - pad) {
      container.scrollTop += linkRect.bottom - (boxRect.bottom - pad);
    }
  }, [activeId]);

  return (
    <nav
      aria-label={label}
      className="border-border/60 bg-background/60 rounded-lg border p-4 text-sm shadow-sm backdrop-blur-md"
    >
      <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
        <List className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      <ol className="space-y-1.5">
        {entries.map((entry, i) => {
          const active = entry.id === activeId;
          return (
            <li key={`${entry.id}-${i}`} className={entry.depth === 3 ? 'ml-4' : ''}>
              <a
                ref={active ? activeRef : undefined}
                href={`#${entry.id}`}
                aria-current={active ? 'location' : undefined}
                className={
                  active
                    ? 'text-foreground font-semibold underline-offset-4'
                    : 'text-foreground/70 hover:text-primary underline-offset-4 transition-colors hover:underline'
                }
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
