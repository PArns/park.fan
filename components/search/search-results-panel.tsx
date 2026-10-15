'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { CommandEmpty, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { trackSearchViewAll } from '@/lib/analytics/umami';
import { cn } from '@/lib/utils';
import { SearchSkeletonList } from '@/components/search/search-skeleton-list';
import { SearchResultGroups } from '@/components/search/search-result-groups';
import { SearchBrowseGroup } from '@/components/search/search-browse-group';
import type { UseSearchResultsReturn } from '@/lib/hooks/use-search-results';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { SearchResultItem } from '@/lib/api/types';
import type { PostSearchEntry } from '@/lib/navigation/blog-menu';

interface SearchResultsPanelProps {
  query: string;
  search: UseSearchResultsReturn;
  onSelect: (result: SearchResultItem, position?: number) => void;
  onGlossarySelect: (item: GlossarySearchItem) => void;
  onPostSelect: (post: PostSearchEntry, position: number) => void;
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
 * The body of both search surfaces, the hero's floating dropdown and the header's palette:
 * skeleton, then results (parks and rides, glossary, guides and news, or "no results") once a
 * query runs, and the browse list before that. In the hero the list grows and then scrolls, which
 * it can because the dropdown floats over the page rather than moving the centred headline.
 */
export function SearchResultsPanel({
  query,
  search,
  onSelect,
  onGlossarySelect,
  onPostSelect,
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

  const {
    debouncedQuery,
    results,
    loading,
    glossaryData,
    posts,
    postsPending,
    browse,
    sortResultsByMatch,
  } = search;

  // `query` and `debouncedQuery` must agree before anything query-bound renders: for the debounce
  // window after the field is cleared they differ, and the card would show the old results and
  // the browse list at once (on every Escape, and on every palette reopen).
  const queryIsLive = query.trim().length >= 3;
  // Skeleton as soon as the user types ≥3 chars (covers the debounce window + fetch, and the post
  // list's first fetch, so its groups do not pop in under the rest) — and also while the
  // pre-query browse list is still resolving, or focusing the field would open a dropdown
  // containing nothing but its footer hint and then pop the list in.
  const isPending =
    loading ||
    (queryIsLive && (debouncedQuery.trim().length < 3 || postsPending)) ||
    (query.length < 3 && browse.isPending);
  const queryRan = !isPending && queryIsLive && debouncedQuery.length >= 3;
  const hasMainResults = Boolean(queryRan && results && results.results.length > 0);
  const hasGlossary = Boolean(glossaryData && glossaryData.results.length > 0);
  const hasPosts = Boolean(posts && posts.articles.total + posts.news.total > 0);
  // `/search` lists the parks and rides and the posts, not the glossary.
  const showViewAll = queryRan && (hasMainResults || hasPosts);
  const nothingFound = queryRan && !hasMainResults && !hasGlossary && !hasPosts;

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

        {nothingFound && <CommandEmpty>{t('noResults')}</CommandEmpty>}

        {queryRan && !nothingFound && (
          <SearchResultGroups
            results={results}
            glossaryData={glossaryData}
            posts={posts}
            sortResultsByMatch={sortResultsByMatch}
            onSelect={onSelect}
            onGlossarySelect={onGlossarySelect}
            onPostSelect={onPostSelect}
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
