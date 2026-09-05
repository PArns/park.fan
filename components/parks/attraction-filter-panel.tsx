'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  DoorOpen,
  Droplet,
  DropletOff,
  Search,
  SlidersHorizontal,
  Ticket,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { OffSeasonToggle } from '@/components/parks/off-season-toggle';
import { FilterToggle } from '@/components/parks/filter-toggle';
import { RiderHeightFilter } from '@/components/parks/rider-height-filter';
import { TILE_GLASS } from '@/components/common/glass-card';
import type { WetMode } from '@/lib/hooks/use-attraction-filter';
import { cn } from '@/lib/utils';

interface AttractionFilterPanelProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Search reaches past the pills, so they govern nothing while it runs. */
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
  /** Rides OPERATING right now — 0 hides the pill rather than offering an empty list. */
  openCount: number;
  onlyOpen: boolean;
  onToggleOnlyOpen: () => void;
  /** Rides with `mayGetWet` — 0 hides the pill; most of the catalogue has none on file. */
  wetCount: number;
  wetMode: WetMode;
  onCycleWet: () => void;
  /** Rides selling a queue-jump product, and the park's own name for it. */
  fastPassCount: number;
  fastPassLabel: string | null;
  onlyFastPass: boolean;
  onToggleOnlyFastPass: () => void;
  /** Rides with a single-rider line. */
  singleRiderCount: number;
  onlySingleRider: boolean;
  onToggleOnlySingleRider: () => void;
}

/**
 * The hairline between the search box and the height slider.
 *
 * Only drawn where the two cells fit beside each other: below that they are
 * stacked, and a rule across a stack of captioned blocks is a line between things
 * that are already apart. The captions do that job there.
 */
function CellDivider() {
  // `bg-foreground/…` rather than the `--border` token: in the dark theme that token is
  // white at 10 %, so any opacity modifier on it composites to nothing — `border-border/60`
  // resolved to alpha 0.06 and the hairline was in the DOM at 1x56 px and invisible on
  // screen. This is the value the slider's own track already uses on this surface.
  return (
    <div
      aria-hidden="true"
      className="bg-foreground/12 dark:bg-foreground/15 hidden w-px self-center @min-[768px]/page:block @min-[768px]/page:h-14"
    />
  );
}

/**
 * The attractions tab's filter panel: search, rider height, and the pills.
 *
 * These were three controls loose on the page — the search box was
 * `md:absolute md:top-0 md:right-0` inside the grid, so on a desktop it floated
 * over the park photo beside the rope-drop card and on a phone it was a full-width
 * box wedged above the first land; the off-season toggle sat beside it in a bare
 * flex row. Nothing said they were one set of controls over one list, and there was
 * nowhere to put a third.
 *
 * **Two bands, not one row.** The first holds the two controls that carry a VALUE
 * you set — a query and a height — and they sit side by side from 768 px of page with a
 * hairline between them. The second is the pills, which carry no value: each is on
 * or off (the wet one has a third state) and any of them may be missing entirely,
 * so they are a wrapping row rather than a cell of fixed width.
 *
 * It used to be one row of three cells, and the fifth pill is what ended that: in
 * German the pills alone measure ~600 px, and 220 + 280 + 600 plus the dividers and
 * gaps is ~1140 px against the ~1180 px an `xl` container has to give — a park with
 * "12 außer Saison" would have pushed it over, on the widest screen there is. Two
 * bands cost one row of height and stop the panel depending on a word's length.
 *
 * The controls sit **left**, in their own widths, rather than stretching: a 1200 px
 * search box is not a better search box.
 *
 * The heading is the site's `ChapterHeading`, inside the box rather than a frosted
 * band above it: the panel already carries the glass, and its own closing rule is
 * the line the bands hang under, so the header and what it heads stay one object.
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
 * the box is which pills the park earns and the breakpoint, and both are the same on
 * either side of hydration — the counts that gate the pills come off the same payload
 * the server rendered. Which is why the pre-mount branch of `TabsWithHash` renders
 * this same component rather than a spacer shaped like it: a placeholder would have
 * to write every one of those numbers down a second time, and be wrong about one.
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
  wetMode,
  onCycleWet,
  fastPassCount,
  fastPassLabel,
  onlyFastPass,
  onToggleOnlyFastPass,
  singleRiderCount,
  onlySingleRider,
  onToggleOnlySingleRider,
}: AttractionFilterPanelProps) {
  const t = useTranslations('parks');
  const [isFocused, setIsFocused] = useState(false);

  // A pill stays on screen while it is doing something even once its count drops to
  // zero: the "open now" one loses its rides the moment the park shuts, and a control
  // vanishing out from under the filter it is still applying leaves a visitor with a
  // short list and nothing to undo it with.
  const showOpen = openCount > 0 || onlyOpen;
  const showWet = wetCount > 0 || wetMode !== null;
  const showFastPass = fastPassCount > 0 || onlyFastPass;
  const showSingleRider = singleRiderCount > 0 || onlySingleRider;
  /**
   * The pills are two groups, and the split is the one the attraction cards already
   * make: a status badge over the photo, the restriction badges under it. "Geöffnet"
   * and "N außer Saison" are statements about TODAY; the water, the queue-jump product
   * and the single-rider line are what the ride IS, all year. Five pills of equal
   * weight in one row are a block that says none of that, and it was five that made it
   * matter — with one it was a detail.
   */
  const hasToday = showOpen || offSeasonCount > 0;
  const hasTraits = showWet || showFastPass || showSingleRider;
  const hasPills = hasToday || hasTraits;

  // All three in the order they are cycled, so the pill reserves the width of the
  // longest and cannot resize under the finger that pressed it.
  const wetLabels = [
    t('filterSection.wetAny'),
    t('filterSection.wetOnly'),
    t('filterSection.wetHide'),
  ];
  const wetLabel = wetLabels[wetMode === null ? 0 : wetMode === 'only' ? 1 : 2];

  return (
    <div className={cn('border-border/50 mb-4 rounded-xl border p-3 shadow-sm sm:p-4', TILE_GLASS)}>
      <ChapterHeading
        icon={SlidersHorizontal}
        as="h3"
        title={t('filterSection.title')}
        hint={t('filterSection.hint')}
        className="mb-3 gap-3 pb-3 sm:gap-3"
      />

      <div className="flex flex-col gap-3 @min-[768px]/page:flex-row @min-[768px]/page:items-start @min-[768px]/page:gap-4">
        <div className="@min-[768px]/page:w-[220px] @min-[1024px]/page:w-[260px]">
          <p className="text-muted-foreground flex h-6 items-center text-xs font-medium">
            {t('filterSection.searchLabel')}
          </p>
          <div className="group relative">
            <Search className="text-muted-foreground group-focus-within:text-primary absolute top-2.5 left-3 z-10 h-4 w-4 transition-colors max-sm:top-3.5" />
            <Input
              ref={inputRef}
              placeholder={t('searchAttractions')}
              className={cn(
                // `Input` is a flat `h-9` with no phone tier of its own; this panel stacks
                // below `sm`, so the row it would have to stay level with is not there and
                // it can take the 44 px the pills beside it take.
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
              className="@min-[768px]/page:w-[280px] @min-[1024px]/page:w-[320px]"
              stops={heightStops}
              value={riderHeight}
              onChange={onRiderHeightChange}
              rideableCount={rideableCount}
              totalCount={totalCount}
            />
          </>
        )}
      </div>

      {hasPills && (
        <div className="mt-3 flex flex-wrap gap-x-7 gap-y-3">
          {/* `invisible` rather than unmounted: the search reaches past every one of
              these, so while it runs they govern nothing — and controls that came and
              went as somebody types would move the whole list under them. */}
          {hasToday && (
            <div className={cn(isSearching && 'invisible')}>
              <p className="text-muted-foreground flex h-6 items-center text-xs font-medium">
                {t('filterSection.todayLabel')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {showOpen && (
                  <FilterToggle
                    size="md"
                    icon={DoorOpen}
                    label={t('filterSection.openNow')}
                    pressed={onlyOpen}
                    onToggle={onToggleOnlyOpen}
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
          )}

          {hasToday && hasTraits && (
            <div
              aria-hidden="true"
              className="bg-foreground/12 dark:bg-foreground/15 mt-6 hidden w-px self-stretch sm:block"
            />
          )}

          {hasTraits && (
            <div className={cn(isSearching && 'invisible')}>
              <p className="text-muted-foreground flex h-6 items-center text-xs font-medium">
                {t('filterSection.traitsLabel')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {showWet && (
                  <FilterToggle
                    size="md"
                    icon={wetMode === 'hide' ? DropletOff : Droplet}
                    label={wetLabel}
                    labels={wetLabels}
                    pressed={wetMode !== null}
                    onToggle={onCycleWet}
                  />
                )}
                {showFastPass && (
                  <FilterToggle
                    size="md"
                    icon={Ticket}
                    label={fastPassLabel ?? t('filterSection.fastPass')}
                    pressed={onlyFastPass}
                    onToggle={onToggleOnlyFastPass}
                  />
                )}
                {showSingleRider && (
                  <FilterToggle
                    size="md"
                    icon={Users}
                    label={t('filterSection.singleRider')}
                    pressed={onlySingleRider}
                    onToggle={onToggleOnlySingleRider}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
