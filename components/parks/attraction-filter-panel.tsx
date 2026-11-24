'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownUp,
  CalendarClock,
  DoorOpen,
  Droplet,
  DropletOff,
  RotateCcw,
  Ruler,
  Search,
  SlidersHorizontal,
  Tags,
  Ticket,
  Umbrella,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { DialogHero } from '@/components/common/dialog-hero';
import { OffSeasonToggle } from '@/components/parks/off-season-toggle';
import { FilterToggle } from '@/components/parks/filter-toggle';
import { AttractionSortToggle } from '@/components/parks/attraction-sort-toggle';
import { RiderHeightFilter } from '@/components/parks/rider-height-filter';
import { TILE_GLASS } from '@/components/common/glass-card';
import type { AttractionSort, WetMode } from '@/lib/hooks/use-attraction-filter';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { formatRiderHeight } from '@/lib/utils/temperature';
import { cn } from '@/lib/utils';
import { PHONE_HIT_AREA } from '@/lib/utils/touch-target';
import { trackSiteEvent, type AttractionFilterName } from '@/lib/analytics/site-analytics';
import type { searchFieldFocusProps } from '@/lib/hooks/use-search-session';

interface AttractionFilterPanelProps {
  /** The park's UUID, the entity of the `attraction_filter_used` and `attraction_filters_opened` events. */
  parkId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** The search session's focus handlers (`searchFieldFocusProps`), stable across renders. */
  searchFocus: ReturnType<typeof searchFieldFocusProps>;
  /** Search reaches past the pills, so they govern nothing while it runs. */
  isSearching: boolean;
  offSeasonCount: number;
  showOffSeason: boolean;
  onToggleOffSeason: () => void;
  /** `null` when the park publishes no minimum height — the height section is then not rendered. */
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
  /** Turns the wet filter off from either state — the chip's ×, where a cycle would flip it. */
  onClearWet: () => void;
  /** Rides selling a queue-jump product, and the park's own name for it. */
  fastPassCount: number;
  fastPassLabel: string | null;
  onlyFastPass: boolean;
  onToggleOnlyFastPass: () => void;
  /** Rides with a single-rider line. */
  singleRiderCount: number;
  onlySingleRider: boolean;
  onToggleOnlySingleRider: () => void;
  /** Rides indoors or behind a roofed queue — 0 also when the park has curated too few to say. */
  coveredCount: number;
  onlyCovered: boolean;
  onToggleOnlyCovered: () => void;
  sortMode: AttractionSort;
  onSortChange: (sort: AttractionSort) => void;
  /** The rides the grid lists with every filter applied, the number on the dialog's button. */
  shownCount: number;
  /** Every filter but the search back to how the page opened. */
  onResetFilters: () => void;
  /** The ride list's „Stand", at the right end of the bar from `sm` up (`LiveDataFreshness`). */
  status?: React.ReactNode;
  /**
   * Controls for the whole list after the status, the wait-time alerts (`RideAlertsEntryButton`).
   * Memoise it at the call site, or every render of the parent re-renders the bar.
   */
  actions?: React.ReactNode;
}

/** One block of the filter dialog: a caption with its glyph over the controls it names. */
function DialogSection({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('px-5 py-4 max-sm:px-4 max-sm:py-3', className)}>
      <h3 className="text-muted-foreground mb-2 flex h-6 items-center gap-1.5 text-xs font-medium">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </h3>
      {children}
    </section>
  );
}

/**
 * The attractions tab's filter bar: the search, a „Filter" button, and one chip per filter that
 * is set.
 *
 * About one park page view in a hundred sets a filter, so the controls do not stand on the page:
 * the bar is one 50 px row on every width, the height of the land headings under it, and the
 * slider, the pills and the sort live in a dialog the button opens. The list's other controls
 * (`actions`, the wait-time alerts) close the row. The button carries the number
 * of set filters, and each set filter stands in the bar as the lit pill of its filter with an ×,
 * so what is narrowing the list is visible without opening anything. The pre-mount branch of
 * `TabsWithHash` renders this same component; the dialog is closed there and renders nothing.
 */
export function AttractionFilterPanel({
  parkId,
  inputRef,
  searchQuery,
  onSearchChange,
  searchFocus,
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
  onClearWet,
  fastPassCount,
  fastPassLabel,
  onlyFastPass,
  onToggleOnlyFastPass,
  singleRiderCount,
  onlySingleRider,
  onToggleOnlySingleRider,
  coveredCount,
  onlyCovered,
  onToggleOnlyCovered,
  sortMode,
  onSortChange,
  shownCount,
  onResetFilters,
  status,
  actions,
}: AttractionFilterPanelProps) {
  const t = useTranslations('parks');
  const trackFilter = (filter: AttractionFilterName) =>
    trackSiteEvent('attraction_filter_used', { filter }, parkId);
  /** A pill's handler that reports the press only when it switches the filter ON. */
  const counted = (filter: AttractionFilterName, on: boolean, handler: () => void) => () => {
    if (!on) trackFilter(filter);
    handler();
  };
  const { unit } = useTemperatureUnit();
  const [isFocused, setIsFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // A pill stays on screen while it is doing something even once its count drops to
  // zero: the "open now" one loses its rides the moment the park shuts, and a control
  // vanishing out from under the filter it is still applying leaves a visitor with a
  // short list and nothing to undo it with.
  const showOpen = openCount > 0 || onlyOpen;
  const showWet = wetCount > 0 || wetMode !== null;
  const showFastPass = fastPassCount > 0 || onlyFastPass;
  const showSingleRider = singleRiderCount > 0 || onlySingleRider;
  const showCovered = coveredCount > 0 || onlyCovered;
  /**
   * The pills are two groups, split as the attraction cards split their badges: "open" and
   * "off season" are about TODAY; the water, the queue-jump product, the single-rider line and
   * the roof are what the ride IS, all year.
   */
  const hasToday = showOpen || offSeasonCount > 0;
  const hasTraits = showWet || showFastPass || showSingleRider || showCovered;
  const showSort = totalCount > 1;

  // All three in the order they are cycled, so the pill reserves the width of the
  // longest and cannot resize under the finger that pressed it.
  const wetLabels = [
    t('filterSection.wetAny'),
    t('filterSection.wetOnly'),
    t('filterSection.wetHide'),
  ];
  const wetLabel = wetLabels[wetMode === null ? 0 : wetMode === 'only' ? 1 : 2];
  const fastPassName = fastPassLabel ?? t('filterSection.fastPass');

  /** Whether the dialog would hold anything; without it the bar is the search alone. */
  const hasDialog = heightStops !== null || hasToday || hasTraits || showSort;
  /** Set filters, the number on the button and one chip each. The search is not one: it is in the bar. */
  const activeCount =
    (riderHeight !== null ? 1 : 0) +
    (onlyOpen ? 1 : 0) +
    (showOffSeason ? 1 : 0) +
    (wetMode !== null ? 1 : 0) +
    (onlyFastPass ? 1 : 0) +
    (onlySingleRider ? 1 : 0) +
    (onlyCovered ? 1 : 0) +
    (sortMode === 'wait' ? 1 : 0);

  const openDialog = () => {
    trackSiteEvent('attraction_filters_opened', {}, parkId);
    setDialogOpen(true);
  };

  // `p-1.5`: the box is the 36 px row plus 6 px each side and the border, 50 px like the land
  // headings below it, and 6 px is what keeps the controls' 6 px corners concentric with the
  // panel's 12 px ones.
  return (
    <div
      className={cn(
        'border-border/50 mb-4 rounded-xl border p-1.5 shadow-sm max-sm:mb-2',
        TILE_GLASS
      )}
    >
      {/* One row from `sm` up, chips and all; below it the chips take a line of their own, after
          everything else in the row. */}
      <div className="flex items-center gap-2 max-sm:flex-wrap">
        <div className="group relative min-w-0 flex-1 sm:w-[260px] sm:flex-none">
          <Search className="text-muted-foreground group-focus-within:text-primary absolute top-2.5 left-3 z-10 h-4 w-4 transition-colors" />
          <Input
            ref={inputRef}
            placeholder={t('searchAttractions')}
            className={cn(
              'border-primary/20 hover:border-primary/40 focus-visible:border-primary/60 w-full bg-transparent pl-9 text-ellipsis shadow-none transition-colors dark:bg-transparent',
              isFocused && searchQuery ? 'pr-16' : 'pr-4'
            )}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              searchFocus.onFocus();
            }}
            onBlur={(event) => {
              setIsFocused(false);
              searchFocus.onBlur(event);
            }}
          />
          {isFocused && searchQuery && (
            <div className="animate-in fade-in zoom-in pointer-events-none absolute top-1/2 right-3 -translate-y-[0.85rem] duration-200">
              <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                ESC
              </kbd>
            </div>
          )}
        </div>

        {hasDialog && (
          <Button
            type="button"
            variant="outline"
            // `max-sm:h-9` takes the button off the scale's 44 px phone tier to stand level with
            // the field in the bar's 50 px line; `PHONE_HIT_AREA` keeps the reach at 44.
            className={cn('shrink-0 bg-transparent max-sm:h-9 dark:bg-transparent', PHONE_HIT_AREA)}
            aria-haspopup="dialog"
            aria-expanded={dialogOpen}
            onClick={openDialog}
          >
            <SlidersHorizontal aria-hidden="true" />
            {t('filterSection.openFilters')}
            {activeCount > 0 && (
              <>
                <Badge variant="default" aria-hidden="true" className="tabular-nums">
                  {activeCount}
                </Badge>
                <span className="sr-only">
                  {t('filterSection.activeCount', { count: activeCount })}
                </span>
              </>
            )}
          </Button>
        )}

        {/* What is set, one chip each. Each chip is the lit pill of its filter with an ×, and
            pressing it turns the filter off, which is what a lit pill does in the dialog too. */}
        {activeCount > 0 && (
          <div className="flex min-w-0 flex-wrap gap-2 max-sm:order-last max-sm:basis-full sm:flex-1">
            {riderHeight !== null && (
              <FilterToggle
                size="md"
                icon={X}
                label={`${t('heightFilter.label')}: ${formatRiderHeight(riderHeight, unit)}`}
                pressed
                onToggle={() => onRiderHeightChange(null)}
              />
            )}
            {onlyOpen && (
              <FilterToggle
                size="md"
                icon={X}
                label={t('filterSection.openNow')}
                pressed
                onToggle={onToggleOnlyOpen}
                className={cn(isSearching && 'invisible')}
              />
            )}
            {showOffSeason && (
              <FilterToggle
                size="md"
                icon={X}
                label={t('offSeasonCount', { count: offSeasonCount })}
                pressed
                onToggle={onToggleOffSeason}
                className={cn(isSearching && 'invisible')}
              />
            )}
            {wetMode !== null && (
              <FilterToggle
                size="md"
                icon={X}
                label={wetLabel}
                pressed
                // Straight to off: cycling from „Nur mit Nässe" would land on „Ohne Nässe",
                // a chip that turned into the opposite filter rather than going away.
                onToggle={onClearWet}
                className={cn(isSearching && 'invisible')}
              />
            )}
            {onlyFastPass && (
              <FilterToggle
                size="md"
                icon={X}
                label={fastPassName}
                pressed
                onToggle={onToggleOnlyFastPass}
                className={cn(isSearching && 'invisible')}
              />
            )}
            {onlySingleRider && (
              <FilterToggle
                size="md"
                icon={X}
                label={t('filterSection.singleRider')}
                pressed
                onToggle={onToggleOnlySingleRider}
                className={cn(isSearching && 'invisible')}
              />
            )}
            {onlyCovered && (
              <FilterToggle
                size="md"
                icon={X}
                label={t('filterSection.covered')}
                pressed
                onToggle={onToggleOnlyCovered}
                className={cn(isSearching && 'invisible')}
              />
            )}
            {sortMode === 'wait' && (
              <FilterToggle
                size="md"
                icon={X}
                label={t('filterSection.sortWait')}
                pressed
                onToggle={() => onSortChange('land')}
              />
            )}
          </div>
        )}

        {(status || actions) && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {status && <div className="pr-1.5 max-sm:hidden">{status}</div>}
            {actions}
          </div>
        )}
      </div>

      {hasDialog && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {/* Three rows, of which only the body scrolls, so the title and the button that closes
              hold still on a phone that cannot show everything. `svh` keeps the foot above a
              mobile browser's toolbar. */}
          <DialogContent
            showCloseButton={false}
            className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
          >
            <DialogHero
              icon={SlidersHorizontal}
              title={t('filterSection.title')}
              description={t('filterSection.hint')}
              describesDialog
            />

            <div className="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
              {heightStops && (
                <div className="px-5 py-4 max-sm:px-4 max-sm:py-3">
                  <RiderHeightFilter
                    icon={Ruler}
                    stops={heightStops}
                    value={riderHeight}
                    onChange={(cm) => {
                      if (riderHeight === null && cm !== null) trackFilter('height');
                      onRiderHeightChange(cm);
                    }}
                    rideableCount={rideableCount}
                    totalCount={totalCount}
                  />
                </div>
              )}

              {/* Dimmed rather than hidden while the search runs: it reaches past the pills, so
                  they govern nothing until the field is cleared, and a section that vanished
                  would make the dialog jump under the finger. */}
              {hasToday && (
                <DialogSection
                  icon={CalendarClock}
                  label={t('filterSection.todayLabel')}
                  className={cn(isSearching && 'opacity-50')}
                >
                  <div className="flex flex-wrap gap-2">
                    {showOpen && (
                      <FilterToggle
                        size="md"
                        icon={DoorOpen}
                        label={t('filterSection.openNow')}
                        pressed={onlyOpen}
                        onToggle={counted('open', onlyOpen, onToggleOnlyOpen)}
                      />
                    )}
                    {offSeasonCount > 0 && (
                      <OffSeasonToggle
                        size="md"
                        count={offSeasonCount}
                        shown={showOffSeason}
                        onToggle={counted('off_season', showOffSeason, onToggleOffSeason)}
                      />
                    )}
                  </div>
                </DialogSection>
              )}

              {hasTraits && (
                <DialogSection
                  icon={Tags}
                  label={t('filterSection.traitsLabel')}
                  className={cn(isSearching && 'opacity-50')}
                >
                  <div className="flex flex-wrap gap-2">
                    {showWet && (
                      <FilterToggle
                        size="md"
                        icon={wetMode === 'hide' ? DropletOff : Droplet}
                        label={wetLabel}
                        labels={wetLabels}
                        pressed={wetMode !== null}
                        onToggle={counted('wet', wetMode !== null, onCycleWet)}
                      />
                    )}
                    {showFastPass && (
                      <FilterToggle
                        size="md"
                        icon={Ticket}
                        label={fastPassName}
                        pressed={onlyFastPass}
                        onToggle={counted('fast_pass', onlyFastPass, onToggleOnlyFastPass)}
                      />
                    )}
                    {showSingleRider && (
                      <FilterToggle
                        size="md"
                        icon={Users}
                        label={t('filterSection.singleRider')}
                        pressed={onlySingleRider}
                        onToggle={counted('single_rider', onlySingleRider, onToggleOnlySingleRider)}
                      />
                    )}
                    {showCovered && (
                      <FilterToggle
                        size="md"
                        icon={Umbrella}
                        label={t('filterSection.covered')}
                        pressed={onlyCovered}
                        onToggle={counted('covered', onlyCovered, onToggleOnlyCovered)}
                      />
                    )}
                  </div>
                </DialogSection>
              )}

              {showSort && (
                <DialogSection
                  icon={ArrowDownUp}
                  label={t('filterSection.sortLabel')}
                  className={cn(isSearching && 'opacity-50')}
                >
                  <AttractionSortToggle
                    value={sortMode}
                    onChange={(sort) => {
                      if (sort === 'wait') trackFilter('sort_wait');
                      onSortChange(sort);
                    }}
                    labels={{
                      land: t('filterSection.sortLand'),
                      wait: t('filterSection.sortWait'),
                    }}
                  />
                </DialogSection>
              )}
            </div>

            {/* The filters apply as they are pressed, so the button only closes; it carries the
                count so the visitor sees what a press did without closing the dialog. */}
            <div className="border-border flex items-center gap-2 border-t px-5 py-4 max-sm:px-4 max-sm:py-3">
              {/* A glyph alone on a phone, where the two labels side by side are wider than the
                  dialog; its name stays for a screen reader and as the tooltip. */}
              <Button
                type="button"
                variant="ghost"
                disabled={activeCount === 0}
                onClick={onResetFilters}
                title={t('filterSection.resetAll')}
                className="max-sm:w-11"
              >
                <RotateCcw aria-hidden="true" />
                <span className="max-sm:sr-only">{t('filterSection.resetAll')}</span>
              </Button>
              <DialogClose asChild>
                <Button type="button" className="ml-auto tabular-nums max-sm:flex-1">
                  {t('filterSection.showResults', { count: shownCount })}
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
