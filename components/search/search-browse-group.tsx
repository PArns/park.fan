'use client';

import { CommandGroup } from '@/components/ui/command';
import { SearchResultRow } from '@/components/search/search-result-items';
import { useBrowseHeading, type HeroBrowseParks } from '@/lib/hooks/use-hero-browse-parks';
import type { SearchResultItem } from '@/lib/api/types';

/**
 * The pre-query list: nearby parks, the rides of the park the visitor is standing in, or the
 * popular parks when neither is available. Rendered identically by the search palette and the
 * hero's in-place list — the two surfaces must never offer different starting points.
 */
export function SearchBrowseGroup({
  browse,
  onSelect,
}: {
  browse: HeroBrowseParks;
  onSelect: (result: SearchResultItem, position?: number) => void;
}) {
  const heading = useBrowseHeading(browse);

  if (browse.items.length === 0) return null;

  return (
    <CommandGroup heading={heading}>
      {browse.items.map((item, index) => (
        <SearchResultRow key={item.id} result={item} position={index} onSelect={onSelect} />
      ))}
    </CommandGroup>
  );
}
