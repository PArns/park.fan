'use client';

import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { CommandEmpty, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SearchSkeletonList } from '@/components/search/search-skeleton-list';
import {
  SearchResultGroups,
  buildSearchGroups,
  type SearchTab,
} from '@/components/search/search-result-groups';
import { SearchCategoryTabs } from '@/components/search/search-category-tabs';
import { SearchBrowseGroup } from '@/components/search/search-browse-group';
import {
  HERO_GROUP_HEADING_HIDDEN_CLASS,
  HERO_SEARCH_HINT_CLASS,
} from '@/components/search/hero-search-classes';
import { useBrowseHeading, type NearbySearchItem } from '@/lib/hooks/use-hero-browse-parks';
import { useCmdkActiveDescendant } from '@/lib/hooks/use-cmdk-active-descendant';
import type { UseSearchResultsReturn } from '@/lib/hooks/use-search-results';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { SearchSession } from '@/lib/analytics/search-session';
import type { SearchResultItem } from '@/lib/api/types';
import type { PostSearchEntry } from '@/lib/navigation/blog-menu';

interface SearchResultsPanelProps {
  query: string;
  search: UseSearchResultsReturn;
  /** The surface's session: the panel reports a settled query, no results and "all results". */
  session: SearchSession;
  onSelect: (result: SearchResultItem, position?: number) => void;
  onGlossarySelect: (item: GlossarySearchItem, position: number) => void;
  onPostSelect: (post: PostSearchEntry, position: number) => void;
  onBrowseSelect: (item: NearbySearchItem, index: number) => void;
  /** Called before "all results" navigates — the palette closes itself on it. */
  onNavigate?: () => void;
  /**
   * Cap for the pre-query browse list, and the rows its skeleton draws. The hero passes its
   * resting rows, whose height the layout reserves; the palette leaves it open.
   */
  browseLimit?: number;
  /** The rows to list before a query, where they are not `search.browse.items` (the hero's). */
  browseItems?: NearbySearchItem[];
  /**
   * The hero's heading row above the pre-query list, outside the listbox so it can hold a link.
   * With it the list has no cmdk heading of its own.
   */
  browseHeader?: ReactNode;
  /** The browse rows' reserved height, so a short list keeps its box. */
  browseStyle?: CSSProperties;
  /** The browse rows' own class, the hero's fixed height. */
  browseRowClassName?: string;
  /** Rows listed after the pre-query list (the hero's two posts). */
  browseExtra?: ReactNode;
  /**
   * What stands in for `browseExtra` while the list is pending. The two arrive together, so cmdk
   * highlights the first park on mount and not the first post.
   */
  browseExtraPending?: ReactNode;
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
 * query runs, and the browse list before that. Results from two categories or more get a tab row,
 * "All" and one tab per category. In the hero the list grows and then scrolls, which it can
 * because the dropdown floats over the page rather than moving the centred headline.
 */
export function SearchResultsPanel({
  query,
  search,
  session,
  onSelect,
  onGlossarySelect,
  onPostSelect,
  onBrowseSelect,
  onNavigate,
  browseLimit,
  browseItems,
  browseHeader,
  browseStyle,
  browseRowClassName,
  browseExtra,
  browseExtraPending,
  listClassName,
  skeletonRowClassName,
  restingFooter,
  emptyBrowse,
}: SearchResultsPanelProps) {
  const t = useTranslations('common');
  const tSearch = useTranslations('search');
  const router = useRouter();
  const [tab, setTab] = useState<SearchTab>('all');

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
  const browsing = query.length < 3;
  const heading = useBrowseHeading(browse);
  const rows = (browseItems ?? browse.items).slice(0, browseLimit);

  useEffect(() => {
    if (queryRan) session.typed();
  }, [queryRan, session]);
  useEffect(() => {
    if (nothingFound) session.noResults();
  }, [nothingFound, session]);

  const groups =
    queryRan && !nothingFound
      ? buildSearchGroups({ results, glossaryData, posts, sortResultsByMatch })
      : [];
  const showTabs = groups.length > 1;
  // A cleared field starts the next query on "All". Set during render, so no frame shows the old tab.
  if (!queryIsLive && tab !== 'all') setTab('all');
  // A refined query keeps its tab while that category still finds something.
  const activeTab = showTabs && groups.some((group) => group.key === tab) ? tab : 'all';
  // The tab paints on the press and the list follows, see
  // docs/rules/an-interaction-may-not-rebuild-the-grid-in-its-own-commit.md.
  const listTab = useDeferredValue(activeTab);

  // cmdk keeps its highlight on a row the new tab no longer lists, and Enter would open nothing.
  // Home is cmdk's own "highlight the first row", and it scrolls that row into view.
  const listRef = useRef<HTMLDivElement>(null);
  const listedTab = useRef(listTab);
  useCmdkActiveDescendant(listRef);
  useEffect(() => {
    if (listedTab.current === listTab) return;
    listedTab.current = listTab;
    listRef.current?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  }, [listTab]);

  const resultCount = groups.reduce((sum, group) => sum + group.count, 0);
  const announcement = nothingFound
    ? t('noResults')
    : groups.length > 0
      ? tSearch('resultsCount', { count: resultCount })
      : '';

  const list = (
    <CommandList
      ref={listRef}
      label={browsing ? tSearch('suggestionsLabel') : tSearch('resultsLabel')}
      className={cn(
        'scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-y-contain',
        listClassName
      )}
    >
      {isPending && (
        <SearchSkeletonList
          rows={browseLimit ?? 4}
          rowClassName={skeletonRowClassName}
          headingClassName={browseHeader && browsing ? null : undefined}
        />
      )}

      {nothingFound && <CommandEmpty>{t('noResults')}</CommandEmpty>}

      {groups.length > 0 && (
        <SearchResultGroups
          groups={groups}
          tab={listTab}
          onSelect={onSelect}
          onGlossarySelect={onGlossarySelect}
          onPostSelect={onPostSelect}
        />
      )}

      {!isPending &&
        browsing &&
        (rows.length > 0 ? (
          <SearchBrowseGroup
            items={rows}
            heading={heading}
            className={browseHeader ? HERO_GROUP_HEADING_HIDDEN_CLASS : undefined}
            onSelect={onBrowseSelect}
            style={browseStyle}
            rowClassName={browseRowClassName}
          />
        ) : (
          emptyBrowse
        ))}
      {browsing && (isPending ? browseExtraPending : browseExtra)}
    </CommandList>
  );

  return (
    <>
      {/* The count of a settled query, for a screen reader: the list changes under the caret
          without moving the focus. Always in the document, or the first answer goes unread. */}
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {browsing && browseHeader}
      {showTabs ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setTab(value as SearchTab)}
          className="contents"
        >
          <SearchCategoryTabs groups={groups} onTabChange={setTab} />
          {/* One panel for every tab: it follows the deferred tab and is never hidden, and the
              list inside it is a listbox the field steers, so the panel itself takes no focus. */}
          <TabsContent
            value={listTab}
            forceMount
            tabIndex={-1}
            className="border-primary/10 flex min-h-0 flex-1 flex-col border-t"
          >
            {list}
          </TabsContent>
        </Tabs>
      ) : (
        list
      )}

      {showViewAll ? (
        <div className="border-border/40 shrink-0 border-t p-2">
          <Button
            variant="ghost"
            className="hover:bg-foreground/10 w-full justify-center text-sm"
            onClick={() => {
              // Before `onNavigate`, which ends the palette's opening.
              session.viewAll();
              onNavigate?.();
              router.push(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            {tSearch('viewAllResults', { query })}
          </Button>
        </div>
      ) : restingFooter === undefined ? (
        <div className={HERO_SEARCH_HINT_CLASS}>{tSearch('heroHint')}</div>
      ) : (
        restingFooter
      )}
    </>
  );
}
