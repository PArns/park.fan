'use client';

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

type EntityType = SearchResultItem['type'];

/** A category of results: one group under "All", and one tab of its own. */
export type SearchCategory = EntityType | 'guides' | 'news' | 'glossary';

/** What the result list shows: every group, or one category in full. */
export type SearchTab = 'all' | SearchCategory;

/** One category's results, with the score that places it among the others under "All". */
export type SearchGroup = { score: number; count: number } & (
  | { kind: 'entity'; key: EntityType; items: SearchResultItem[] }
  | { kind: 'post'; key: 'guides' | 'news'; posts: PostSearchEntry[] }
  | { kind: 'glossary'; key: 'glossary'; terms: GlossarySearchItem[] }
);

/**
 * A post whose title carries the query scores like a name that starts with it, a post found by its
 * tags, parks or teaser a little less, and the glossary less again. These only order the guides,
 * the news and the glossary among themselves: every park, place, ride, show and restaurant group
 * comes first, whatever its score.
 */
const POST_TITLE_MATCH_SCORE = 50;
const POST_MATCH_SCORE = 45;
const GLOSSARY_SCORE = 40;

/** Rows a group lists under "All"; its tab lists the rest. */
const ENTITY_ROWS_IN_ALL = 5;
const POST_ROWS_IN_ALL = 3;

interface BuildSearchGroupsInput {
  /** The main search's results; `undefined` or empty when only the glossary or posts matched. */
  results: SearchResult | undefined;
  glossaryData: { results: GlossarySearchItem[] } | undefined;
  posts: UseSearchResultsReturn['posts'];
  sortResultsByMatch: UseSearchResultsReturn['sortResultsByMatch'];
}

/** Places lead: "orlando" is the city before it is SeaWorld Orlando. */
const ENTITY_ORDER: readonly EntityType[] = [
  'location',
  'park',
  'attraction',
  'show',
  'restaurant',
];

/**
 * Every category that found something, in tab order: places and parks, rides, shows and
 * restaurants, then the guides, the news and the glossary.
 */
export function buildSearchGroups({
  results,
  glossaryData,
  posts,
  sortResultsByMatch,
}: BuildSearchGroupsInput): SearchGroup[] {
  const groups: SearchGroup[] = [];
  const mainResults = results?.results ?? [];
  const itemsByType = Object.groupBy(mainResults, (r) => r.type);

  for (const type of ENTITY_ORDER) {
    const items = itemsByType[type];
    if (!items || items.length === 0) continue;
    const scored = sortResultsByMatch(items);
    groups.push({
      kind: 'entity',
      key: type,
      score: scored[0].score,
      count: items.length,
      items: scored.map(({ item }) => item),
    });
  }

  for (const [key, section] of [
    ['guides', posts?.articles],
    ['news', posts?.news],
  ] as const) {
    if (!section || section.total === 0) continue;
    groups.push({
      kind: 'post',
      key,
      score: section.titleMatch ? POST_TITLE_MATCH_SCORE : POST_MATCH_SCORE,
      count: section.total,
      posts: section.matches,
    });
  }

  if (glossaryData && glossaryData.results.length > 0) {
    groups.push({
      kind: 'glossary',
      key: 'glossary',
      score: GLOSSARY_SCORE,
      count: glossaryData.results.length,
      terms: glossaryData.results,
    });
  }

  return groups;
}

/**
 * The order "All" lists the groups in: what the query names before what was written about it. A
 * guide with "epic universe" in its title scores 50 and Universal Epic Universe, whose name only
 * contains it, 30, yet whoever typed it wants the park; the guides are one tab away. Within each
 * half the best match leads, and the stable sort keeps the tab order on a tie.
 */
function rankForAll(groups: SearchGroup[]): SearchGroup[] {
  const half = (group: SearchGroup) => (group.kind === 'entity' ? 0 : 1);
  return groups.toSorted((a, b) => half(a) - half(b) || b.score - a.score);
}

interface SearchResultGroupsProps {
  groups: SearchGroup[];
  /** One category: all its rows, no heading, since its tab names it. `all`: every group, cut short. */
  tab: SearchTab;
  onSelect: (result: SearchResultItem, position?: number) => void;
  onGlossarySelect: (item: GlossarySearchItem, position: number) => void;
  onPostSelect: (post: PostSearchEntry, position: number) => void;
}

/**
 * The groups of a search result set (parks/attractions/shows/restaurants/locations, glossary,
 * guides and news), all of them or one category's. Shared by the search palette and the hero's
 * in-place result list so both surfaces group and rank identically.
 */
export function SearchResultGroups({
  groups,
  tab,
  onSelect,
  onGlossarySelect,
  onPostSelect,
}: SearchResultGroupsProps) {
  const tSearch = useTranslations('search');

  const single = tab === 'all' ? undefined : groups.find((group) => group.key === tab);
  const shown = single ? [single] : rankForAll(groups);

  return shown.map((group) => {
    const heading = single ? undefined : tSearch(`headings.${group.key}`, { count: group.count });
    return (
      <CommandGroup key={group.key} heading={heading}>
        {group.kind === 'entity' &&
          (single ? group.items : group.items.slice(0, ENTITY_ROWS_IN_ALL)).map((item, index) => (
            <SearchResultRow key={item.id} result={item} position={index} onSelect={onSelect} />
          ))}
        {group.kind === 'post' &&
          (single ? group.posts : group.posts.slice(0, POST_ROWS_IN_ALL)).map((post, index) => (
            <PostResultItem key={post.path} post={post} position={index} onSelect={onPostSelect} />
          ))}
        {group.kind === 'glossary' &&
          group.terms.map((item, index) => (
            <GlossaryResultItem
              key={item.id}
              item={item}
              position={index}
              onSelect={onGlossarySelect}
            />
          ))}
      </CommandGroup>
    );
  });
}
