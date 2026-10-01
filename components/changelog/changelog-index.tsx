import { ChevronDown } from 'lucide-react';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { changelogAnchor } from '@/lib/changelog/paths';
import type { ChangelogEntry } from '@/lib/changelog/types';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

/**
 * The jump list at the head of the changelog: every release by version and date.
 *
 * Grouped by year, because the dates are what a reader scans for ("what changed in March?") and a
 * year heading turns thirty full dates into thirty short ones. From `lg` up it is a column of its
 * own that stays in view while the releases scroll past. Below that it is a `<details>` under the
 * intro, shut: with 31 entries the open grid was about 700 px of links on a phone before the first
 * release, and a sticky block there would cover the text it indexes.
 *
 * Plain fragment links and no client code: the browser already scrolls to an `id`, and each
 * release carries `scroll-mt-20` so its heading lands below the 48 px header. The list is rendered
 * twice, once per layout, and CSS shows one; the hidden copy is `display: none`, so neither a
 * screen reader nor the tab order meets it.
 */

const dayMonth = () =>
  getDateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function groupByYear(entries: ChangelogEntry[]): [string, ChangelogEntry[]][] {
  const years = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const year = entry.date.slice(0, 4);
    const list = years.get(year) ?? [];
    list.push(entry);
    years.set(year, list);
  }
  return [...years];
}

function VersionList({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <div className="flex flex-col gap-6">
      {groupByYear(entries).map(([year, list]) => (
        <div key={year}>
          <MenuSectionHeading label={year} count={list.length} />
          <ol className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-1">
            {list.map((entry) => (
              <li key={entry.version}>
                <a
                  href={`#${changelogAnchor(entry.version)}`}
                  className="hover:bg-muted flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 transition-colors max-sm:min-h-11 max-sm:items-center"
                >
                  <span className="font-mono text-sm tabular-nums">{entry.version}</span>
                  <time dateTime={entry.date} className="text-muted-foreground text-xs">
                    {dayMonth().format(new Date(`${entry.date}T00:00:00Z`))}
                  </time>
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function ChangelogIndex({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <>
      <details className="group rounded-2xl border lg:hidden">
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
        className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
      >
        <VersionList entries={entries} />
      </nav>
    </>
  );
}
