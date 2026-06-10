'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import type { TocEntry } from '@/lib/blog/toc';

interface BlogTocListProps {
  entries: TocEntry[];
  title: string;
  label: string;
}

/**
 * Renders the table of contents and scroll-spies the headings: the section the
 * reader is currently in is highlighted (bold). The active heading is the last
 * one whose top has scrolled past a fixed offset below the sticky header. State
 * only updates from the scroll handler, never synchronously inside the effect.
 */
export function BlogTocList({ entries, title, label }: BlogTocListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const ids = entries.map((e) => e.id);
    const offset = 120;
    const measure = () => {
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 0) current = id;
        else break;
      }
      setActiveId(current);
    };

    // rAF-throttle: measure() queries layout for every heading, so cap it at
    // one pass per frame instead of every scroll event.
    let frame: number | null = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [entries]);

  return (
    <nav
      aria-label={label}
      className="border-border/60 bg-muted/30 rounded-lg border p-4 text-sm"
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
