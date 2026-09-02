'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DoorOpen, Droplets, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { OffSeasonToggle } from '@/components/parks/off-season-toggle';
import { FilterToggle } from '@/components/parks/filter-toggle';
import { RiderHeightFilter } from '@/components/parks/rider-height-filter';
import { TILE_GLASS } from '@/components/common/glass-card';
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
  heightStops: number[] | null;
  riderHeight: number | null;
  onRiderHeightChange: (cm: number | null) => void;
  rideableCount: number;
  totalCount: number;
  /** Rides OPERATING right now — 0 hides the toggle rather than offering an empty list. */
  openCount: number;
  onlyOpen: boolean;
  onToggleOnlyOpen: () => void;
  /** Rides with `mayGetWet` — 0 hides the toggle; most of the catalogue has none on file. */
  wetCount: number;
  onlyWet: boolean;
  onToggleOnlyWet: () => void;
}

/**
 * The hairline between two cells.
 *
 * Wide screens only: below `xl` the cells are a stacked grid rather than one row, and
 * a rule across a stack of captioned blocks is a line between things that are already
 * apart. The captions do that job there.
 */
function CellDivider() {
  // `bg-foreground/…` rather than the `--border` token: in the dark theme that token is
  // white at 10 %, so any opacity modifier on it composites to nothing — `border-border/60`
  // resolved to alpha 0.06 and the two hairlines were in the DOM at 1x56 px and invisible
  // on screen. This is the value the slider's own track already uses on this surface.
  return (
    <div
      aria-hidden="true"
      className="bg-foreground/12 dark:bg-foreground/15 hidden w-px self-center xl:block xl:h-14"
    />
  );
}

/**
 * The attractions tab's filter panel: search, rider height, and the switches.
 *
 * These were three controls loose on the page — the search box was
 * `md:absolute md:top-0 md:right-0` inside the grid, so on a desktop it floated
 * over the park photo beside the rope-drop card and on a phone it was a full-width
 * box wedged above the first land; the off-season toggle sat beside it in a bare
 * flex row. Nothing said they were one set of controls over one list, and there was
 * nowhere to put a third.
 *
 * **Three cells, each labelled, separated by a hairline.** The height filter needs
 * three lines (its own value, the track, the scale) and the other two are one control
 * tall, so an uncaptioned row put a 36 px box next to a 60 px block and the toggle
 * ended up floating in the middle of the difference. A caption over each cell costs
 * the row 24 px once and buys controls that start on the same line, end on the same
 * line, and each say what they are.
 *
 * The third cell holds **all** the switches, and that is why the row breaks where it
 * does. It used to hold one, at ~130 px; "geöffnet" and "Nässegefahr" beside it make
 * ~360 px in German, and 220 + 280 + 360 plus dividers and gaps is 925 px of content
 * that used to be asked to fit a 672 px `md` container. So the single row starts at
 * `xl`, `md` puts search and switches on one line with the track under them, and a
 * phone stacks all three — the track cannot share a line with anything at any width,
 * because it is a track and a track needs its width.
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
 * nothing inside appears or disappears as a visitor types or drags. What does change
 * the box is which switches the park earns and the breakpoint, and both are the same
 * on either side of hydration — the counts that gate the switches come off the same
 * payload the server rendered. Which is why the pre-mount branch of `TabsWithHash`
 * renders this same component rather than a spacer shaped like it: a placeholder
 * would have to write every one of those numbers down a second time, and be wrong
 * about one of them.
 */
export function AttractionFilterPanel({
  inputRef,
  searchQuery,
  onSearchChange,
  isSearching,
  offSeasonCount,
  showOffSeason,
  onToggleOffSeason,
  heightStops,
  riderHeight,
  onRiderHeightChange,
  rideableCount,
  totalCount,
  openCount,
  onlyOpen,
  onToggleOnlyOpen,
  wetCount,
  onlyWet,
  onToggleOnlyWet,
}: AttractionFilterPanelProps) {
  const t = useTranslations('parks');
  const [isFocused, setIsFocused] = useState(false);

  // A switch stays on screen while it is ON even once its count drops to zero: the
  // "open now" one loses its rides the moment the park shuts, and a control vanishing
  // out from under the filter it is still applying leaves a visitor with a short list
  // and nothing to undo it with.
  const showOpen = openCount > 0 || onlyOpen;
  const showWet = wetCount > 0 || onlyWet;
  const hasToggles = showOpen || showWet || offSeasonCount > 0;

  return (
    <div className={cn('border-border/50 mb-4 rounded-xl border p-3 shadow-sm sm:p-4', TILE_GLASS)}>
      <ChapterHeading
        icon={SlidersHorizontal}
        as="h3"
        title={t('filterSection.title')}
        hint={t('filterSection.hint')}
        className="mb-3 gap-3 pb-3 sm:gap-3"
      />

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start xl:flex xl:items-center xl:gap-4">
        <div className="md:col-start-1 md:row-start-1 xl:w-[220px]">
          <p className="text-muted-foreground flex h-6 items-center text-xs font-medium">
            {t('filterSection.searchLabel')}
          </p>
          <div className="group relative">
            <Search className="text-muted-foreground group-focus-within:text-primary absolute top-2.5 left-3 z-10 h-4 w-4 transition-colors" />
            <Input
              ref={inputRef}
              placeholder={t('searchAttractions')}
              className={cn(
                // `Input` is a flat `h-9` with no phone tier of its own; this panel stacks
                // below `sm`, so the row it would have to stay level with is not there and
                // it can take the 44 px the switches beside it take.
                'border-primary/20 hover:border-primary/40 focus-visible:border-primary/60 w-full bg-transparent pl-9 shadow-none transition-colors max-sm:h-11 dark:bg-transparent',
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

        {heightStops && (
          <>
            <CellDivider />
            <RiderHeightFilter
              className="md:col-span-2 md:row-start-2 xl:w-[280px]"
              stops={heightStops}
              value={riderHeight}
              onChange={onRiderHeightChange}
              rideableCount={rideableCount}
              totalCount={totalCount}
            />
          </>
        )}

        {hasToggles && (
          <>
            <CellDivider />
            <div className="md:col-start-2 md:row-start-1 xl:shrink-0">
              <p className="text-muted-foreground flex h-6 items-center text-xs font-medium">
                {t('filterSection.showLabel')}
              </p>
              {/* `invisible` rather than unmounted: the search reaches past all three of
                  these, so while it runs they govern nothing — and controls that came and
                  went as somebody types would move the whole list under them. */}
              <div className={cn('flex flex-wrap items-center gap-2', isSearching && 'invisible')}>
                {showOpen && (
                  <FilterToggle
                    size="md"
                    icon={DoorOpen}
                    label={t('filterSection.openNow')}
                    pressed={onlyOpen}
                    onToggle={onToggleOnlyOpen}
                  />
                )}
                {showWet && (
                  <FilterToggle
                    size="md"
                    icon={Droplets}
                    label={t('filterSection.wetOnly')}
                    pressed={onlyWet}
                    onToggle={onToggleOnlyWet}
                  />
                )}
                {offSeasonCount > 0 && (
                  <OffSeasonToggle
                    size="md"
                    count={offSeasonCount}
                    shown={showOffSeason}
                    onToggle={onToggleOffSeason}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
