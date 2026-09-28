'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { CommandEmpty, CommandGroup, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { trackSearchViewAll } from '@/lib/analytics/umami';
import { cn } from '@/lib/utils';
import { GlossaryResultItem } from '@/components/search/search-result-items';
import { SearchSkeletonList } from '@/components/search/search-skeleton-list';
import { SearchResultGroups } from '@/components/search/search-result-groups';
import { SearchBrowseGroup } from '@/components/search/search-browse-group';
import type { UseSearchResultsReturn } from '@/lib/hooks/use-search-results';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { SearchResultItem } from '@/lib/api/types';

interface SearchResultsPanelProps {
  query: string;
  search: UseSearchResultsReturn;
  onSelect: (result: SearchResultItem, position?: number) => void;
  onGlossarySelect: (item: GlossarySearchItem) => void;
  /** Called before "all results" navigates — the palette closes itself on it. */
  onNavigate?: () => void;
  /**
   * Cap for the pre-query browse list. The hero passes 3 because its dropdown is open at rest
   * and the layout reserves exactly that height; the palette leaves it open.
   */
  browseLimit?: number;
  /**
   * Height behaviour of the scrolling list. The palette keeps `CommandList`'s own cap; the hero
   * passes `min-h-0 flex-1` because its card is already capped to the room left below the field.
   */
  listClassName?: string;
  /**
   * Row padding for the pending skeleton, matching this surface's real rows. The hero has to
   * pass its own: its resting height is reserved in the layout, so a skeleton row of the wrong
   * height moves the pills under the dropdown. See `search-skeleton-list.tsx`.
   */
  skeletonRowClassName?: string;
  /**
   * Footer while no query has run. The hero's hint by default; the palette passes `null`, since
   * its own keyboard legend already sits under the list.
   */
  restingFooter?: ReactNode;
  /** What the list shows when the browse lookup came back empty — the hero shows nothing. */
  emptyBrowse?: ReactNode;
}

/**
 * The body of both search surfaces — the hero's floating dropdown and the header's palette:
 * skeleton → results (or glossary-only, or "no results") once a query runs, and the browse list
 * before that. Only the shell around it differs. The palette used to carry its own copy of this
 * tree, and the copy drifted: a skeleton drawn in white on a light dialog, no wait for the browse
 * list, and the last query's results left standing next to the browse list after a reopen.
 *
 * In the hero the list grows with its content and then scrolls. It can grow at all because the
 * dropdown floats over the page instead of sitting in the hero's flow — a list in flow would move
 * the vertically centred headline on every keystroke.
 */
export function SearchResultsPanel({
  query,
  search,
  onSelect,
  onGlossarySelect,
  onNavigate,
  browseLimit,
  listClassName,
  skeletonRowClassName,
  restingFooter,
  emptyBrowse,
}: SearchResultsPanelProps) {
  const t = useTranslations('common');
  const tSearch = useTranslations('search');
  const router = useRouter();

  const { debouncedQuery, results, loading, glossaryData, browse, sortResultsByMatch } = search;

  // Skeleton as soon as the user types ≥3 chars (covers the debounce window + fetch) — and
  // also while the pre-query browse list is still resolving, or focusing the field would open
  // a dropdown containing nothing but its footer hint and then pop the list in.
  const isPending =
    loading ||
    (query.trim().length >= 3 && debouncedQuery.trim().length < 3) ||
    (query.length < 3 && browse.isPending);
  // Both `query` and `debouncedQuery` have to agree before anything query-bound renders. They
  // disagree for the 300 ms debounce window after the field is cleared — `query` is already
  // empty while `debouncedQuery` still holds the old term — and the browse branch below keys off
  // `query`, so for that window the card rendered the full result list AND the browse list at
  // once, ballooned to its cap and snapped back. Pressing Escape hit this every time, and the
  // palette, which is cleared on close, showed the last query's results on every reopen.
  const queryIsLive = query.trim().length >= 3;
  const queryRan = !isPending && queryIsLive && debouncedQuery.length >= 3;
  const hasResults = queryRan && results;
  const showViewAll = hasResults && results.results.length > 0;
  const noMainResults = queryRan && (!results || results.results.length === 0);
  const hasGlossary = Boolean(glossaryData && glossaryData.results.length > 0);

  return (
    <>
      <CommandList
        className={cn(
          'scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-y-contain',
          listClassName
        )}
      >
        {isPending && (
          <SearchSkeletonList rows={browseLimit ?? 4} rowClassName={skeletonRowClassName} />
        )}

        {noMainResults && !hasGlossary && <CommandEmpty>{t('noResults')}</CommandEmpty>}

        {noMainResults && glossaryData && hasGlossary && (
          <CommandGroup
            heading={tSearch('headings.glossary', { count: glossaryData.results.length })}
          >
            {glossaryData.results.map((item) => (
              <GlossaryResultItem key={item.id} item={item} onSelect={onGlossarySelect} />
            ))}
          </CommandGroup>
        )}

        {showViewAll && (
          <SearchResultGroups
            results={results}
            glossaryData={glossaryData}
            sortResultsByMatch={sortResultsByMatch}
            onSelect={onSelect}
            onGlossarySelect={onGlossarySelect}
          />
        )}

        {!isPending &&
          query.length < 3 &&
          (browse.items.length > 0 ? (
            <SearchBrowseGroup browse={browse} onSelect={onSelect} limit={browseLimit} />
          ) : (
            emptyBrowse
          ))}
      </CommandList>

      {/* Footer: hint while browsing, "all results" once a query ran */}
      {showViewAll ? (
        <div className="border-border/40 shrink-0 border-t p-2">
          <Button
            variant="ghost"
            className="hover:bg-foreground/10 w-full justify-center text-sm"
            onClick={() => {
              onNavigate?.();
              trackSearchViewAll();
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            {tSearch('viewAllResults', { query })}
          </Button>
        </div>
      ) : restingFooter === undefined ? (
        <div className="border-border/40 bg-muted/30 text-muted-foreground shrink-0 border-t px-4 py-2.5 text-xs">
          {tSearch('heroHint')}
        </div>
      ) : (
        restingFooter
      )}
    </>
  );
}
