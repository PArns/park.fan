'use client';

import type { CSSProperties } from 'react';
import { CommandGroup } from '@/components/ui/command';
import { SearchResultRow } from '@/components/search/search-result-items';
import type { NearbySearchItem } from '@/lib/hooks/use-hero-browse-parks';

/**
 * The pre-query list: nearby parks, the rides of the park the visitor is standing in, or the
 * popular parks when neither is available. Rendered by the search palette and the hero's
 * in-place list from the same `useHeroBrowseParks` data, so the two surfaces never offer different
 * starting points. The palette heads it with cmdk's own heading; the hero draws its heading above
 * the list, where it can carry a link, and passes a class that hides cmdk's.
 */
export function SearchBrowseGroup({
  items,
  heading,
  onSelect,
  style,
  rowClassName,
  className,
}: {
  items: NearbySearchItem[];
  heading: string;
  onSelect: (item: NearbySearchItem, index: number) => void;
  /** The hero reserves its rows' height here, so a short list keeps the box. */
  style?: CSSProperties;
  /** The hero's fixed row height. */
  rowClassName?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <CommandGroup heading={heading} style={style} className={className}>
      {items.map((item, index) => (
        <SearchResultRow
          key={item.id}
          result={item}
          position={index}
          onSelect={() => onSelect(item, index)}
          className={rowClassName}
        />
      ))}
    </CommandGroup>
  );
}
