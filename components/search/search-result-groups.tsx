'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { CommandGroup } from '@/components/ui/command';
import { SearchResultRow, GlossaryResultItem } from '@/components/search/search-result-items';
import type { SearchResult, SearchResultItem } from '@/lib/api/types';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';

interface SearchResultGroupsProps {
  results: SearchResult;
  glossaryData: { results: GlossarySearchItem[] } | undefined;
  sortResultsByMatch: (items: SearchResultItem[]) => { item: SearchResultItem; score: number }[];
  onSelect: (result: SearchResultItem, position?: number) => void;
  onGlossarySelect: (item: GlossarySearchItem) => void;
}

/**
 * The category groups of a search result set (parks/attractions/shows/restaurants/locations +
 * glossary), ordered by best match score. Shared by the search palette and the hero's in-place
 * result list so both surfaces group and rank identically.
 */
export function SearchResultGroups({
  results,
  glossaryData,
  sortResultsByMatch,
  onSelect,
  onGlossarySelect,
}: SearchResultGroupsProps) {
  const tSearch = useTranslations('search');

  const groups: { key: string; score: number; node: ReactNode }[] = [];

  const mainTypes = results.results.some((r) => r.type === 'location')
    ? (['location', 'park', 'attraction', 'show', 'restaurant'] as const)
    : (['park', 'attraction', 'show', 'restaurant', 'location'] as const);

  const itemsByType = Object.groupBy(results.results, (r) => r.type);

  mainTypes.forEach((type) => {
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
  });

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
