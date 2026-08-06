'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { CommandEmpty, CommandGroup, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { trackSearchViewAll } from '@/lib/analytics/umami';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonItem, GlossaryResultItem } from '@/components/search/search-result-items';
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
  /**
   * Cap for the pre-query browse list. The hero passes 3 because its dropdown is open at rest
   * and the layout reserves exactly that height; the palette leaves it open.
   */
  browseLimit?: number;
  /**
   * Height behaviour of the scrolling list. The palette keeps the default cap; the hero passes
   * `min-h-0 flex-1` because its card is already capped to the room left below the field.
   */
  listClassName?: string;
}

/**
 * The body of the hero's floating search dropdown: skeleton → results (or glossary-only, or
 * "no results") once a query runs, and the browse list before that. Everything inside is shared
 * with the search palette; only the shell around it differs.
 *
 * The list grows with its content and then scrolls. It can grow at all because the dropdown
 * floats over the page instead of sitting in the hero's flow — a list in flow would move the
 * vertically centred headline on every keystroke. The cap is deliberately below what would fit
 * "to the bottom of the screen": the field it hangs from sits in the lower half of a centred
 * hero, so a taller list would spill past the fold and make the visitor scroll the page to see
 * its own results.
 */
export function SearchResultsPanel({
  query,
  search,
  onSelect,
  onGlossarySelect,
  browseLimit,
  listClassName = 'max-h-[min(22rem,42vh)]',
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
  // Both `query` and `debouncedQuery` have to agree before results render. They disagree for
  // the 300 ms debounce window after the field is cleared — `query` is already empty while
  // `debouncedQuery` still holds the old term — and the browse branch below keys off `query`,
  // so for that window the card rendered the full result list AND the browse list at once,
  // ballooned to its cap and snapped back. Pressing Escape hit this every time.
  const queryIsLive = query.trim().length >= 3;
  const hasResults = !isPending && queryIsLive && debouncedQuery.length >= 3 && results;
  const showViewAll = hasResults && results.results.length > 0;

  return (
    <>
      <CommandList
        className={cn(
          'scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-y-contain',
          listClassName
        )}
      >
        {isPending && (
          <div className="p-1">
            <div className="px-3 pt-3.5 pb-1">
              <Skeleton className="h-2 w-16 rounded-full" />
            </div>
            {['55%', '72%', '48%', '65%'].slice(0, browseLimit ?? 4).map((width, i) => (
              <SkeletonItem key={i} width={width} />
            ))}
          </div>
        )}

        {!isPending &&
          debouncedQuery.length >= 3 &&
          (!results || results.results.length === 0) &&
          (!glossaryData || glossaryData.results.length === 0) && (
            <CommandEmpty>{t('noResults')}</CommandEmpty>
          )}

        {!isPending &&
          debouncedQuery.length >= 3 &&
          (!results || results.results.length === 0) &&
          glossaryData &&
          glossaryData.results.length > 0 && (
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

        {!isPending && query.length < 3 && (
          <SearchBrowseGroup browse={browse} onSelect={onSelect} limit={browseLimit} />
        )}
      </CommandList>

      {/* Footer: hint while browsing, "all results" once a query ran */}
      {showViewAll ? (
        <div className="border-border/40 shrink-0 border-t p-2">
          <Button
            variant="ghost"
            className="hover:bg-foreground/10 w-full justify-center text-sm"
            onClick={() => {
              trackSearchViewAll();
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            {tSearch('viewAllResults', { query })}
          </Button>
        </div>
      ) : (
        <div className="border-border/40 bg-muted/30 text-muted-foreground shrink-0 border-t px-4 py-2.5 text-xs">
          {tSearch('heroHint')}
        </div>
      )}
    </>
  );
}
