'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChapterHeading } from '@/components/common/chapter-heading';
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
  /** `null` when the park publishes no minimum height — the height cell is then not rendered. */
  heightRange: RiderHeightRange | null;
  riderHeight: number | null;
  onRiderHeightChange: (cm: number | null) => void;
  rideableCount: number;
  totalCount: number;
}

/**
 * The hairline between two cells.
 *
 * Desktop only: below `md` the cells are a two-row grid rather than a row, and a rule
 * across a stack of captioned blocks is a line between things that are already apart.
 * The captions do that job there.
 */
function CellDivider() {
  // `bg-foreground/…` rather than the `--border` token: in the dark theme that token is
  // white at 10 %, so any opacity modifier on it composites to nothing — `border-border/60`
  // resolved to alpha 0.06 and the two hairlines were in the DOM at 1x56 px and invisible
  // on screen. This is the value the slider's own track already uses on this surface.
  return (
    <div
      aria-hidden="true"
      className="bg-foreground/12 dark:bg-foreground/15 hidden w-px self-center md:block md:h-14"
    />
  );
}

/**
 * The attractions tab's filter panel: search, rider height, off season.
 *
 * These were three controls loose on the page — the search box was
 * `md:absolute md:top-0 md:right-0` inside the grid, so on a desktop it floated
 * over the park photo beside the rope-drop card and on a phone it was a full-width
 * box wedged above the first land; the off-season toggle sat beside it in a bare
 * flex row. Nothing said they were one set of controls over one list, and there was
 * nowhere to put a third.
 *
 * **Three cells, each labelled, each 60 px, separated by a hairline.** The height
 * filter needs three lines (its own value, the track, the scale) and the other two
 * are one control tall, so an uncaptioned row put a 36 px box next to a 60 px block
 * and the toggle ended up floating in the middle of the difference. A caption over
 * each cell costs the row 24 px once and buys three controls that start on the same
 * line, end on the same line, and each say what they are.
 *
 * They sit **left**, in their own widths, rather than stretching: a 1200 px search
 * box is not a better search box, and the height filter pushed to the far right of a
 * desktop panel reads as a second toolbar rather than the third control of this one.
 *
 * The heading is the site's `ChapterHeading`, inside the box rather than a frosted
 * band above it: the panel already carries the glass, and its own closing rule is
 * the line the cells hang under, so the header and what it heads stay one object.
 * No chapter number — `NearbyParksSection`'s rule, and here the count is 1 of 1.
 *
 * It takes {@link TILE_GLASS}, the material of the entry-tile row directly above it,
 * because that is what it is: another band of the same stack of objects over the same
 * park photograph, not a new kind of thing.
 *
 * **Its height is the ride list's top edge**, so every row inside is fixed — `h-6`
 * for the captions, `h-9` for the controls (the input scale from
 * `components/ui/button.tsx`), `h-5`/`h-4` for the slider's track and scale — and
 * nothing inside appears or disappears as a visitor types or drags. Two things do
 * change the box, and both are the same on either side of hydration: whether the park
 * publishes rider limits at all, which is known on the server, and the breakpoint.
 * Which is why the pre-mount branch of `TabsWithHash` renders this same component
 * rather than a spacer shaped like it — a placeholder would have to write both
 * numbers down a second time, and be wrong about one of them.
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
    <div className={cn('border-border/50 mb-4 rounded-xl border p-3 shadow-sm sm:p-4', TILE_GLASS)}>
      <ChapterHeading
        icon={SlidersHorizontal}
        as="h3"
        title={t('filterSection.title')}
        hint={t('filterSection.hint')}
        className="mb-3 gap-3 pb-3 sm:gap-3"
      />

      {/* Two rows on a phone rather than three, and the season toggle is what moves: it
          is 140 px of a 358 px panel, so parking it under a full-width search box spent
          a phone's first screen on the white space beside it. The height filter cannot
          share a row with anything — it is a track, and a track needs its width. From
          `md` up all three sit in one flex row and the grid placement is inert. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 md:flex md:items-center md:gap-4">
        <div className="col-start-1 row-start-1 md:w-[220px] lg:w-[260px]">
          <p className="text-muted-foreground flex h-6 items-center text-xs font-medium">
            {t('filterSection.searchLabel')}
          </p>
          <div className="group relative">
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
        </div>

        {heightRange && (
          <>
            <CellDivider />
            <RiderHeightFilter
              className="col-span-2 row-start-2 md:w-[280px] lg:w-[320px]"
              range={heightRange}
              value={riderHeight}
              onChange={onRiderHeightChange}
              rideableCount={rideableCount}
              totalCount={totalCount}
            />
          </>
        )}

        {offSeasonCount > 0 && (
          <>
            <CellDivider />
            <div className="col-start-2 row-start-1 md:shrink-0">
              <p className="text-muted-foreground flex h-6 items-center text-xs font-medium">
                {t('filterSection.seasonLabel')}
              </p>
              {/* `invisible` rather than unmounted: the search reaches past the season, so
                  while it runs this governs nothing — and a control that came and went as
                  somebody types would move the whole list under it. */}
              <div className={cn(isSearching && 'invisible')}>
                <OffSeasonToggle
                  size="md"
                  count={offSeasonCount}
                  shown={showOffSeason}
                  onToggle={onToggleOffSeason}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
