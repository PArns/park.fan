'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OffSeasonToggle } from '@/components/parks/off-season-toggle';
import { RiderHeightFilter } from '@/components/parks/rider-height-filter';
import { TILE_GLASS } from '@/components/common/glass-card';
import type { RiderHeightRange } from '@/lib/utils/rider-height';
import { cn } from '@/lib/utils';

interface AttractionFilterPanelProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Search reaches past the season, so the off-season toggle governs nothing while it runs. */
  isSearching: boolean;
  offSeasonCount: number;
  showOffSeason: boolean;
  onToggleOffSeason: () => void;
  /** `null` when the park publishes no minimum height — the height row is then not rendered. */
  heightRange: RiderHeightRange | null;
  riderHeight: number | null;
  onRiderHeightChange: (cm: number | null) => void;
  rideableCount: number;
  totalCount: number;
}

/**
 * The attractions tab's filter panel: search, rider height, off-season.
 *
 * These were three controls loose on the page — the search box was
 * `md:absolute md:top-0 md:right-0` inside the grid below, so on a desktop it floated
 * over the park photo beside the rope-drop card and on a phone it was a full-width box
 * wedged above the first land; the off-season toggle sat beside it in a bare flex row.
 * Nothing said they were one set of controls over one list, and there was nowhere to
 * put a third.
 *
 * It takes {@link TILE_GLASS}, the material of the entry-tile row directly above it,
 * because that is what it is: another band of the same stack of objects over the same
 * park photograph, not a new kind of thing.
 *
 * **Its height is the ride list's top edge**, so every row inside is fixed — `h-9` for
 * the controls (the input scale from `components/ui/button.tsx`) and `h-6`/`h-5`/`h-4`
 * for the height filter's three lines — and nothing inside appears or disappears as a
 * visitor types or drags. Two things do change the box, and both are the same on either
 * side of hydration: whether the park publishes rider limits at all, which is known on
 * the server, and the breakpoint, because from `md` up the two halves sit side by side
 * rather than stacked. Which is why the pre-mount branch of `TabsWithHash` renders this
 * same component rather than a spacer shaped like it — a placeholder would have to
 * write both numbers down a second time, and be wrong about one of them.
 */
export function AttractionFilterPanel({
  inputRef,
  searchQuery,
  onSearchChange,
  isSearching,
  offSeasonCount,
  showOffSeason,
  onToggleOffSeason,
  heightRange,
  riderHeight,
  onRiderHeightChange,
  rideableCount,
  totalCount,
}: AttractionFilterPanelProps) {
  const t = useTranslations('parks');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={cn(
        'border-border/50 mb-4 rounded-xl border p-3 shadow-sm',
        TILE_GLASS,
        // Side by side from `md`: a 1200 px slider is a precision instrument for a
        // measurement that moves in 5 cm steps, and the search box next to it was
        // reading as the panel's only real content.
        heightRange && 'space-y-3 md:flex md:items-center md:gap-4 md:space-y-0'
      )}
    >
      <div className="flex h-9 items-center gap-3 md:min-w-0 md:flex-1">
        <div className="group relative min-w-0 flex-1">
          <Search className="text-muted-foreground group-focus-within:text-primary absolute top-2.5 left-3 z-10 h-4 w-4 transition-colors" />
          <Input
            ref={inputRef}
            placeholder={t('searchAttractions')}
            className={cn(
              'border-primary/20 hover:border-primary/40 focus-visible:border-primary/60 w-full bg-transparent pl-9 shadow-none transition-colors dark:bg-transparent',
              isFocused && searchQuery ? 'pr-16' : 'pr-4'
            )}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {isFocused && searchQuery && (
            <div className="animate-in fade-in zoom-in pointer-events-none absolute top-1/2 right-3 -translate-y-[0.85rem] duration-200">
              <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                ESC
              </kbd>
            </div>
          )}
        </div>
        {offSeasonCount > 0 && (
          /* `invisible` rather than unmounted: a control that came and went as somebody
             types would move the whole list under it. */
          <div className={cn('shrink-0', isSearching && 'invisible')}>
            <OffSeasonToggle
              count={offSeasonCount}
              shown={showOffSeason}
              onToggle={onToggleOffSeason}
            />
          </div>
        )}
      </div>

      {heightRange && (
        <>
          <div className="border-border/40 border-t md:h-11 md:self-center md:border-t-0 md:border-l" />
          <RiderHeightFilter
            className="md:w-[300px] md:shrink-0 lg:w-[340px]"
            range={heightRange}
            value={riderHeight}
            onChange={onRiderHeightChange}
            rideableCount={rideableCount}
            totalCount={totalCount}
          />
        </>
      )}
    </div>
  );
}
