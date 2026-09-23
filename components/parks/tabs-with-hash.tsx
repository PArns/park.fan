'use client';

import { memo, useDeferredValue } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ShowCard } from '@/components/parks/show-card';
import { LandSection } from '@/components/parks/land-section';
import { LazyMount } from '@/components/parks/lazy-mount';
import { RestaurantCard } from '@/components/parks/restaurant-card';
import { WeatherCard } from '@/components/parks/weather-card';
import { RopeDropHeadliners } from '@/components/parks/rope-drop-headliners';
import { ParkTabsList } from '@/components/parks/park-tabs-list';
import { OffSeasonToggle } from '@/components/parks/off-season-toggle';
import { AttractionFilterPanel } from '@/components/parks/attraction-filter-panel';
import { RestaurantCardSkeleton } from '@/components/parks/restaurant-card-skeleton';
import { AttractionCardSkeleton } from '@/components/parks/attraction-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useTabHashRouting } from '@/lib/hooks/use-tab-hash-routing';
import { nextWetMode, useAttractionFilter } from '@/lib/hooks/use-attraction-filter';
import { stripNewPrefix } from '@/lib/utils';
import { ParkHeaderCard } from '@/components/parks/park-header-card';
import { LiveDataFreshness } from '@/components/parks/live-data-freshness';

import type { ParkWithAttractions, ParkAttraction } from '@/lib/api/types';

/** The enter animation of the attractions panel, named because both branches must carry the
 *  same one — see the pre-mount branch below. */
const ATTRACTIONS_PANEL_ENTER = 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200';

// Dynamic import to avoid SSR issues with Leaflet and reduce bundle size
const ParkMap = dynamic(() => import('@/components/parks/park-map').then((mod) => mod.ParkMap), {
  ssr: false,
});

interface TabsWithHashProps {
  defaultValue: string;
  /** Today in the PARK's timezone, `YYYY-MM-DD`, from the server render — see `LiveParkData`. */
  todayIso: string;
  showsAvailable: boolean | undefined;
  restaurantsAvailable: boolean | undefined;
  /** The park has weather data — drives both the tile and the chapter behind it. */
  weatherAvailable: boolean | undefined;
  /** The park has a wait-time record page. Tile only: there is no chapter behind this one, it is
   *  a URL of its own — see `ParkTileSource.statsAvailable`. */
  statsAvailable?: boolean;
  park: ParkWithAttractions;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  landNames: string[];
  attractionsByLand: Record<string, ParkAttraction[]>;
  /** <ParkTodayPanel>, rendered by the page and handed down as a slot. It is the upper half of
   *  the header card whose lower half is the entry-tile row — one card, so one component has to
   *  own its box, and that is this one. */
  todayPanel?: React.ReactNode;
}

// Memoized: `LiveParkData` re-renders on every 5-min poll's `isFetching` flip, but all props
// here are shallow-stable when the underlying park data hasn't changed (`park`/`landNames`/
// `attractionsByLand` come through `useMemo` in the parent), so the whole attraction-grid tab
// tree bails on the fetch-start render instead of reconciling.
export const TabsWithHash = memo(function TabsWithHash({
  defaultValue,
  todayIso,
  showsAvailable,
  restaurantsAvailable,
  weatherAvailable,
  statsAvailable,
  park,
  continent,
  country,
  city,
  parkSlug,
  landNames,
  attractionsByLand,
  todayPanel,
}: TabsWithHashProps) {
  const t = useTranslations('parks');

  const { isMounted, activeTab, handleTabChange, tabsRef, mapShowSlug } = useTabHashRouting({
    defaultValue,
    park,
    continent,
    country,
    city,
    parkSlug,
    timezone: park.timezone,
  });

  const {
    inputRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    filteredAttractionsByLand,
    hasSearchResults,
    heightStops,
    riderHeight,
    setRiderHeight,
    totalAttractionCount,
    rideableAttractionCount,
    onlyOpen,
    setOnlyOpen,
    wetMode,
    setWetMode,
    onlyFastPass,
    setOnlyFastPass,
    onlySingleRider,
    setOnlySingleRider,
    appliedPills,
    isNarrowing,
    openAttractionCount,
    wetAttractionCount,
    fastPassAttractionCount,
    singleRiderAttractionCount,
    fastPassLabel,
    headliners,
    offSeasonAttractionCount,
    showOffSeasonAttractions,
    setShowOffSeasonAttractions,
    visibleShows,
    offSeasonShowCount,
    showOffSeasonShows,
    setShowOffSeasonShows,
  } = useAttractionFilter({
    attractionsByLand,
    shows: park.shows,
    activeTab,
    parkStatus: park.status,
  });

  // INP: a tab tap used to mount the ENTIRE incoming panel in the same commit that moved the
  // tab highlight — 50+ glass cards, 55 restaurant cards, or the Leaflet map — so the paint
  // that ends the interaction had to wait for all of it. Measured on a CPU-throttled Pixel 5
  // that was ~300-380 ms per switch, with the handler itself costing 1 ms: the cost is purely
  // the render+paint that follows, which is exactly what INP charges to the tap.
  //
  // The panel SWITCH stays urgent, so the highlight and the new (skeleton) panel paint
  // immediately and the interaction ends there. The heavy body renders off a deferred copy of
  // the tab value, arriving a beat later at lower priority.
  const deferredTab = useDeferredValue(activeTab);

  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;

  // The header card is the same object on both sides of hydration, so it is built once. Written
  // out twice it was 20 lines that had to be kept equal by hand, and everything below it moves
  // when they drift.
  const headerCard = (
    <ParkHeaderCard
      panel={todayPanel}
      tiles={
        <ParkTabsList
          park={park}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          showsAvailable={showsAvailable}
          restaurantsAvailable={restaurantsAvailable}
          weatherAvailable={weatherAvailable}
          statsAvailable={statsAvailable}
        />
      }
    />
  );

  // The REAL filter panel, not a spacer shaped like it.
  //
  // It used to be an `h-9` div, and that only worked while the row was one control tall: the
  // panel has a height row whose size depends on whether the park publishes any rider limits,
  // which is one more number to keep in sync than a comment can hold. Every prop it needs is
  // derived from the park payload, so it renders identically on both sides of hydration and the
  // ride list below cannot move. Its controls are live for the frame between paint and mount,
  // and what they set survives into the mounted tree — the state lives in `useAttractionFilter`,
  // above this branch.
  //
  // No chapter heading above it, and that is deliberate: the tile in the row already says
  // „Attraktionen 40" and is the selected one of six. A band repeating the word 100 px under it
  // is the same chapter opened twice. What is left of that band is the controls it carried, and
  // they are one object now: search, rider height and the off-season toggle over one list.
  const filterPanel = (
    <AttractionFilterPanel
      inputRef={inputRef}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isSearching={isSearching}
      offSeasonCount={offSeasonAttractionCount}
      showOffSeason={showOffSeasonAttractions}
      onToggleOffSeason={() => setShowOffSeasonAttractions((v) => !v)}
      heightStops={heightStops}
      riderHeight={riderHeight}
      onRiderHeightChange={setRiderHeight}
      rideableCount={rideableAttractionCount}
      totalCount={totalAttractionCount}
      openCount={openAttractionCount}
      onlyOpen={onlyOpen}
      onToggleOnlyOpen={() => setOnlyOpen((v) => !v)}
      wetCount={wetAttractionCount}
      wetMode={wetMode}
      onCycleWet={() => setWetMode(nextWetMode)}
      fastPassCount={fastPassAttractionCount}
      fastPassLabel={fastPassLabel}
      onlyFastPass={onlyFastPass}
      onToggleOnlyFastPass={() => setOnlyFastPass((v) => !v)}
      singleRiderCount={singleRiderAttractionCount}
      onlySingleRider={onlySingleRider}
      onToggleOnlySingleRider={() => setOnlySingleRider((v) => !v)}
    />
  );

  // "As of 14:35" between the filters and the rides, on both sides of hydration. It carries its
  // own subscription to the live query, so a poll re-renders this row and not the grid.
  const freshnessLine = (
    <LiveDataFreshness
      park={park}
      todayIso={todayIso}
      continent={continent}
      country={country}
      city={city}
      parkSlug={parkSlug}
    />
  );

  // Attractions grouped by Land — ONE tree, rendered by both branches below.
  //
  // It used to be two: before the mount the tab showed `AttractionWaitOverview`, a compact row
  // list, and the cards took its place afterwards. The two states differed by 3145 px (desktop)
  // to 24919 px (mobile) of document height on the five park pages Cloudflare scores „Poor",
  // and everything under them — nearby parks, blog, statistics, FAQ, footer — moved by that
  // much. A reader who had already scrolled when the mount landed was charged the whole
  // distance: measured 1.0458 on Lotte World Adventure and 0.8480 on Islands of Adventure at
  // y=3000, against 0.0002 at the top of the same page.
  //
  // Reserving the height instead was the obvious repair and is not available here: a card's
  // height depends on live data (93-123 px shut at 390 px, 262-374 px open with a sparkline),
  // so any constant is wrong on one of the two. Rendering the same tree twice needs no
  // constant — the geometry is equal because the markup is the same markup.
  const attractionsPanel = (
    <div className="relative space-y-8">
      {deferredTab !== 'attractions' ? (
        // Switching BACK to this tab remounts the whole grid. EVERYTHING below the search
        // box is deferred — the rope-drop picks and the headliner cards are real cards
        // too, so leaving them out of this branch kept the urgent commit expensive and the
        // tap still paid ~370 ms. Only the (cheap) heading and search box stay urgent.
        <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <AttractionCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Renders nothing when there are neither worth nor evening picks — and
                    nothing while a filter is narrowing the list either. It reads
                    `park.attractions` raw, so with "Nur mit Nässe" on it put a dry
                    rope-drop tip above a grid of four water rides, and with a rider
                    height set it recommended being at the gate for a coaster the child
                    below it cannot board. Hidden for the same reason it is hidden while
                    searching: it is advice about the whole park, and the visitor has
                    just said they are asking about part of it. The off-season toggle is
                    not in this list — it widens the grid rather than narrowing it. */}
          {!isNarrowing && (
            <RopeDropHeadliners
              headliners={park.ropeDropHeadliners ?? []}
              attractions={park.attractions ?? []}
              parkPath={parkPath}
            />
          )}

          {headliners.length > 0 && !isSearching && (
            <LandSection
              landName={t('headlinersSection')}
              attractions={headliners}
              parkPath={parkPath}
              parkSlug={parkSlug}
              parkStatus={park.status}
              timezone={park.timezone}
              todayIso={todayIso}
              parkName={park.name}
            />
          )}

          {hasSearchResults ? (
            landNames.map((landName, index) => {
              const attractions = filteredAttractionsByLand[landName];
              if (!attractions) return null;

              return (
                // Lazy-mount every land below the first so a big park's 100+ glass cards no
                // longer all render at once (excessive DOM + mobile paint/compositing cost).
                // While searching, render every matching land eagerly so no result is hidden
                // behind a placeholder. The reservation follows the grid's column count per
                // breakpoint so the scroll length stays stable on desktop too.
                <LazyMount
                  key={landName}
                  eager={index === 0 || isSearching}
                  grid={{ count: attractions.length, rowHeight: 340, headerHeight: 64 }}
                >
                  <LandSection
                    landName={landName}
                    attractions={attractions}
                    parkPath={parkPath}
                    parkSlug={parkSlug}
                    parkStatus={park.status}
                    timezone={park.timezone}
                    todayIso={todayIso}
                    parkName={park.name}
                  />
                </LazyMount>
              );
            })
          ) : (
            <div className="flex justify-center pt-14">
              <div className="border-border/50 bg-background/60 inline-flex flex-col items-center rounded-xl border px-10 py-8 shadow-md backdrop-blur-md dark:bg-[oklch(0.12_0.025_241_/_0.55)]">
                <p className="text-muted-foreground">{t('noAttractionsFound')}</p>
                {/* Six filters can empty this grid and only one of them is obviously
                          to blame: a search box you just typed into is right there, a rider
                          height or a pill set three scrolls ago is not. So each of them
                          offers its own way out here whenever it is on. */}
                {riderHeight !== null && (
                  <button
                    className="text-primary mt-2 text-sm underline hover:no-underline"
                    onClick={() => setRiderHeight(null)}
                  >
                    {t('heightFilter.reset')}
                  </button>
                )}
                {appliedPills.onlyOpen && (
                  <button
                    className="text-primary mt-2 text-sm underline hover:no-underline"
                    onClick={() => setOnlyOpen(false)}
                  >
                    {t('filterSection.resetOpenNow')}
                  </button>
                )}
                {appliedPills.wetMode !== null && (
                  <button
                    className="text-primary mt-2 text-sm underline hover:no-underline"
                    onClick={() => setWetMode(null)}
                  >
                    {t('filterSection.resetWet')}
                  </button>
                )}
                {appliedPills.onlyFastPass && (
                  <button
                    className="text-primary mt-2 text-sm underline hover:no-underline"
                    onClick={() => setOnlyFastPass(false)}
                  >
                    {t('filterSection.resetFastPass')}
                  </button>
                )}
                {appliedPills.onlySingleRider && (
                  <button
                    className="text-primary mt-2 text-sm underline hover:no-underline"
                    onClick={() => setOnlySingleRider(false)}
                  >
                    {t('filterSection.resetSingleRider')}
                  </button>
                )}
                {isSearching && (
                  <button
                    className="text-primary mt-2 text-sm underline hover:no-underline"
                    onClick={() => setSearchQuery('')}
                  >
                    {t('clearSearch')}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Pre-mount (SSR + first client render): the attractions tab renders the SAME filter panel and
  // the SAME card grid the mounted tree renders — rope-drop strip, headliner section, first land
  // eager, the lands below it as `LazyMount` reservations. `defaultValue` is `attractions` and
  // `activeTab` starts there, so both branches take the same path through `attractionsPanel`
  // with the same (untouched) filter state, and the mount changes no geometry.
  //
  // What a crawler sees changed with it: the row list named every ride in the park, the cards
  // name the headliners and the first land (about 14 of Europa-Park's 120), each with its link,
  // its wait and its status. A crawler that runs the JavaScript reads as far down the lands as
  // its rendering viewport reaches, since each `LazyMount` waits until it is within 1200 px;
  // one that does not run it reads the first land. The full ride list is machine-readable
  // either way through `containsPlace` in the page's structured data.
  if (!isMounted) {
    return (
      <div ref={tabsRef} className="scroll-mt-20">
        <Tabs value={defaultValue}>
          {headerCard}
          {/* Same `className` as the mounted branch, and it has to be: the mount updates this
              node rather than replacing it, so a class added there would start the 200 ms
              enter animation on content that is already painted and has not changed — a fade
              from `opacity: 0` and an 8 px slide over the ride list. CLS does not charge it
              (transform and opacity), a reader sees it. Here it runs once, with the first
              paint, and the mount finds the class already in place. */}
          <TabsContent value={defaultValue} className={ATTRACTIONS_PANEL_ENTER}>
            {filterPanel}
            {freshnessLine}
            {attractionsPanel}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div ref={tabsRef} className="scroll-mt-20">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {headerCard}

        <TabsContent value="attractions" className={ATTRACTIONS_PANEL_ENTER}>
          {filterPanel}
          {freshnessLine}
          {attractionsPanel}
        </TabsContent>

        {showsAvailable && (
          <TabsContent
            value="shows"
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          >
            {/* Same as the attractions panel: the „Shows 4" tile above is this chapter's
                header, so only the control the band used to carry is left. */}
            {offSeasonShowCount > 0 && (
              <div className="mb-4 flex h-9 items-center">
                <OffSeasonToggle
                  count={offSeasonShowCount}
                  shown={showOffSeasonShows}
                  onToggle={() => setShowOffSeasonShows((v) => !v)}
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
              {visibleShows.map((show) => {
                const showHref =
                  `/parks/${continent}/${country}/${city}/${parkSlug}#shows` as '/parks/europe/germany/rust/europa-park';
                return (
                  // The anchor the header panel's "nächste Shows" rows aim at. `:target` rings the
                  // card for as long as the hash names it, so arriving here from a row lands ON
                  // the show rather than merely in the right chapter. `scroll-mt-20` keeps it
                  // clear of the sticky bar when the browser does the scrolling itself.
                  <div
                    key={show.id}
                    id={`shows-${show.slug}`}
                    className="target:ring-primary scroll-mt-20 rounded-xl target:ring-2 target:ring-offset-2 target:ring-offset-transparent"
                  >
                    <ShowCard
                      id={show.id}
                      name={stripNewPrefix(show.name)}
                      slug={show.slug}
                      status={show.status || 'CLOSED'}
                      showtimes={show.showtimes}
                      timezone={park.timezone}
                      href={showHref}
                      isSeasonal={show.isSeasonal}
                      seasonMonths={show.seasonMonths}
                      isCurrentlyInSeason={show.isCurrentlyInSeason}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}

        {restaurantsAvailable && (
          <TabsContent
            value="restaurants"
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          >
            <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
              {deferredTab === 'restaurants'
                ? park.restaurants?.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))
                : Array.from({ length: 6 }, (_, i) => <RestaurantCardSkeleton key={i} />)}
            </div>
          </TabsContent>
        )}

        <TabsContent
          value="map"
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
        >
          {deferredTab === 'map' ? (
            <ParkMap park={park} focusShowSlug={mapShowSlug} />
          ) : (
            <Skeleton className="h-[28rem] w-full rounded-xl" />
          )}
        </TabsContent>

        {/* Weather is a chapter behind a tile now, not a ~360px card wedged between the header
            and the ride list. It answers a real question and almost nobody arrives asking it
            first — the summary a visitor does want on arrival (temperature, the nowcast, an
            official warning) still meets them above the fold in the banners, which stay in the
            page body. Unlike the deferred tabs above this one renders its card as soon as the
            tab is active without a skeleton step: everything it needs to draw is already in
            `park.weather` from the server render, so there is nothing to wait for. */}
        {weatherAvailable && park.weather?.current && (
          <TabsContent
            value="weather"
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          >
            <WeatherCard
              weather={park.weather}
              nowcast={null}
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              latitude={park.latitude}
              longitude={park.longitude}
              timezone={park.timezone}
              schedule={park.schedule}
              className="border-primary/10"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
});
