'use client';

import { useMemo } from 'react';
import { List } from 'lucide-react';
import type { TocEntry } from '@/lib/blog/toc';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useScrollSpy } from '@/lib/hooks/use-scroll-spy';

interface BlogTocListProps {
  entries: TocEntry[];
  title: string;
  label: string;
}

/**
 * Renders the table of contents and scroll-spies the headings (`useScrollSpy`): the section the
 * reader is currently in is highlighted (bold).
 */
export function BlogTocList({ entries, title, label }: BlogTocListProps) {
  // The list sits in a `hidden lg:block` aside, so below `lg` it does not spy at all. Rem, like
  // Tailwind's own `lg`.
  const visible = useMediaQuery('(min-width: 64rem)');
  const ids = useMemo(() => entries.map((e) => e.id), [entries]);
  const { activeId, activeRef } = useScrollSpy(ids, visible);

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
