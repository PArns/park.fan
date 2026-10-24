'use client';

import { useMemo } from 'react';
import { ChevronDown, List } from 'lucide-react';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { changelogAnchor } from '@/lib/changelog/paths';
import type { ChangelogEntry } from '@/lib/changelog/types';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useScrollSpy } from '@/lib/hooks/use-scroll-spy';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';

/**
 * The changelog's jump list, grouped by year because readers scan by date. From `lg` up a sticky
 * column that marks the release in view; below it a closed `<details>` under the intro, since the
 * open list would be a screen of links before the first release. The list renders twice and CSS
 * shows one, the hidden copy `display: none`.
 */

/** What the index draws of an entry; the page passes this projection, never the release bodies. */
export type ChangelogIndexEntry = Pick<ChangelogEntry, 'version' | 'date'>;

const dayMonth = () =>
  getDateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function groupByYear(entries: ChangelogIndexEntry[]): [string, ChangelogIndexEntry[]][] {
  const years = new Map<string, ChangelogIndexEntry[]>();
  for (const entry of entries) {
    const year = entry.date.slice(0, 4);
    const list = years.get(year) ?? [];
    list.push(entry);
    years.set(year, list);
  }
  return [...years];
}

function VersionList({
  entries,
  activeId = null,
  activeRef,
}: {
  entries: ChangelogIndexEntry[];
  activeId?: string | null;
  activeRef?: React.Ref<HTMLAnchorElement>;
}) {
  return (
    <div className="flex flex-col gap-5">
      {groupByYear(entries).map(([year, list]) => (
        <div key={year}>
          <MenuSectionHeading label={year} count={list.length} />
          <ol className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-0.5">
            {list.map((entry) => {
              const id = changelogAnchor(entry.version);
              const active = id === activeId;
              return (
                <li key={entry.version}>
                  <a
                    ref={active ? activeRef : undefined}
                    href={`#${id}`}
                    aria-current={active ? 'location' : undefined}
                    className={cn(
                      'flex items-baseline justify-between gap-3 rounded-md border-l-2 px-2 py-1.5 transition-colors max-sm:min-h-11 max-sm:items-center',
                      active
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted border-transparent'
                    )}
                  >
                    <span className="font-mono text-sm tabular-nums">{entry.version}</span>
                    <time
                      dateTime={entry.date}
                      className={cn(
                        'text-xs',
                        active ? 'text-primary/80' : 'text-muted-foreground'
                      )}
                    >
                      {dayMonth().format(new Date(`${entry.date}T00:00:00Z`))}
                    </time>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

/**
 * Jump list of every release on the changelog page, grouped by year: a closed `<details>` below
 * `lg`, a sticky side column from `lg` up that highlights the release in view.
 */
export function ChangelogIndex({ entries }: { entries: ChangelogIndexEntry[] }) {
  // Rem, like Tailwind's own `lg`: below it the side column is `display: none` and need not spy.
  const visible = useMediaQuery('(min-width: 64rem)');
  const ids = useMemo(() => entries.map((e) => changelogAnchor(e.version)), [entries]);
  const { activeId, activeRef } = useScrollSpy(ids, visible);

  return (
    <>
      <details className="group bg-background/60 rounded-2xl border shadow-sm backdrop-blur-md lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span>
            Jump to a version{' '}
            <span className="text-muted-foreground font-normal tabular-nums">
              ({entries.length})
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav aria-label="Versions" className="px-4 pt-2 pb-4">
          <VersionList entries={entries} />
        </nav>
      </details>
      <nav
        aria-label="Versions"
        data-toc-scroll
        className="border-border/60 bg-background/60 hidden rounded-2xl border p-4 shadow-sm backdrop-blur-md lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
      >
        <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
          <List className="size-3.5" aria-hidden="true" />
          Versions
        </p>
        <VersionList entries={entries} activeId={activeId} activeRef={activeRef} />
      </nav>
    </>
  );
}
