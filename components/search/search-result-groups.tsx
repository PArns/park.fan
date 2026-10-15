'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CommandGroup } from '@/components/ui/command';
import {
  SearchResultRow,
  GlossaryResultItem,
  PostResultItem,
} from '@/components/search/search-result-items';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';
import type { GlossarySearchItem, UseSearchResultsReturn } from '@/lib/hooks/use-search-results';
import type { PostSearchEntry } from '@/lib/navigation/blog-menu';

/**
 * Where the guides and the news rank among the groups. A post whose title carries the query ranks
 * with a name that starts with it (50), after the parks and places and before the rides, shows and
 * restaurants: "disneyland" wants the Disneyland Paris guide before the Disneyland Band. A post
 * found only by its tags, parks or teaser ranks below those names ("star wars" wants the rides
 * first), and still above the glossary (40) and a name that merely contains the query (30).
 */
const POST_TITLE_MATCH_SCORE = 50;
const POST_MATCH_SCORE = 45;

interface SearchResultGroupsProps {
  /** The main search's results; `undefined` or empty when only the glossary or posts matched. */
  results: SearchResult | undefined;
  glossaryData: { results: GlossarySearchItem[] } | undefined;
  posts: UseSearchResultsReturn['posts'];
  sortResultsByMatch: (items: SearchResultItem[]) => { item: SearchResultItem; score: number }[];
  onSelect: (result: SearchResultItem, position?: number) => void;
  onGlossarySelect: (item: GlossarySearchItem) => void;
  onPostSelect: (post: PostSearchEntry, position: number) => void;
}

/**
 * The category groups of a search result set (parks/attractions/shows/restaurants/locations,
 * glossary, guides and news), ordered by best match score. Shared by the search palette and the
 * hero's in-place result list so both surfaces group and rank identically.
 */
export function SearchResultGroups({
  results,
  glossaryData,
  posts,
  sortResultsByMatch,
  onSelect,
  onGlossarySelect,
  onPostSelect,
}: SearchResultGroupsProps) {
  const tSearch = useTranslations('search');

  const groups: { key: string; score: number; node: ReactNode }[] = [];
  const mainResults = results?.results ?? [];

  const mainTypes = mainResults.some((r) => r.type === 'location')
    ? (['location', 'park', 'attraction', 'show', 'restaurant'] as const)
    : (['park', 'attraction', 'show', 'restaurant', 'location'] as const);

  const itemsByType = Object.groupBy(mainResults, (r) => r.type);

  const pushMainGroup = (type: (typeof mainTypes)[number]) => {
    const items = itemsByType[type];
    if (!items || items.length === 0) return;
    const scoredSortedItems = sortResultsByMatch(items);
    const bestScore = scoredSortedItems.length > 0 ? scoredSortedItems[0].score : 0;
    groups.push({
      key: type,
      score: bestScore,
      node: (
        <CommandGroup key={type} heading={tSearch(`headings.${type}`, { count: items.length })}>
          {scoredSortedItems.slice(0, 5).map(({ item }, index) => (
            <SearchResultRow key={item.id} result={item} position={index} onSelect={onSelect} />
          ))}
        </CommandGroup>
      ),
    });
  };

  // The sort below is stable, so on equal scores the order these are pushed in decides: parks
  // and places, then the guides and the news, then rides, shows and restaurants.
  const isPlace = (type: (typeof mainTypes)[number]) => type === 'park' || type === 'location';
  mainTypes.filter(isPlace).forEach(pushMainGroup);

  for (const [key, section] of [
    ['guides', posts?.articles],
    ['news', posts?.news],
  ] as const) {
    if (!section || section.total === 0) continue;
    groups.push({
      key,
      score: section.titleMatch ? POST_TITLE_MATCH_SCORE : POST_MATCH_SCORE,
      node: (
        <CommandGroup key={key} heading={tSearch(`headings.${key}`, { count: section.total })}>
          {section.matches.map((post, index) => (
            <PostResultItem key={post.path} post={post} position={index} onSelect={onPostSelect} />
          ))}
        </CommandGroup>
      ),
    });
  }

  mainTypes.filter((type) => !isPlace(type)).forEach(pushMainGroup);

  if (glossaryData && glossaryData.results.length > 0) {
    // Glossary results found by API (which searches English names + aliases)
    // should rank higher than substring matches in other categories
    const glossaryBestScore = 40;
    groups.push({
      key: 'glossary',
      score: glossaryBestScore,
      node: (
        <CommandGroup
          key="glossary"
          heading={tSearch('headings.glossary', { count: glossaryData.results.length })}
        >
          {glossaryData.results.map((item) => (
            <GlossaryResultItem key={item.id} item={item} onSelect={onGlossarySelect} />
          ))}
        </CommandGroup>
      ),
    });
  }

  // Sort all groups: exact matches (score=100) first, then by descending score
  groups.sort((a, b) => b.score - a.score);

  return <>{groups.map((g) => g.node)}</>;
}
