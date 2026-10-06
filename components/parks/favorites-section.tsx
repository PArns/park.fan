'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import {
  FavoritesEmptyState,
  FavoritesHeading,
  type FavoritesHeadingVariant,
} from '@/components/parks/favorites-empty-state';
import { ParkCard } from '@/components/parks/park-card';
import { FavoriteParkQuietestDay } from '@/components/parks/favorite-park-quietest-day';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { AttractionCard } from '@/components/parks/attraction-card';
import { AttractionCardSkeleton } from '@/components/parks/attraction-card-skeleton';
import { LazyMount } from '@/components/parks/lazy-mount';
import { ShowCard } from '@/components/parks/show-card';
import { RestaurantCard } from '@/components/parks/restaurant-card';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { useMounted } from '@/lib/hooks/use-mounted';
import { cn, stripNewPrefix } from '@/lib/utils';
import {
  countFavorites,
  getFavoritesFromCookies,
  type FavoriteCounts,
} from '@/lib/utils/favorites';
import { parkChapterUrl } from '@/lib/utils/url-utils';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';
import { LAZY_CHUNK_NAMESPACES } from '@/i18n/route-namespaces.generated';

/** A park row on `/favorites`: the card's 200 px, the 16 px grid gap and the line's 28 px. */
const PARK_ROW_WITH_LINE_PX = 244;

/**
 * The visitor's favorites band: parks, rides, shows and restaurants, nearest first, with a
 * skeleton and an empty state that stand in the same box.
 *
 * `standalone` is what `/favorites` passes: the band is the page's whole content there, so the
 * page carries the title (its `<h1>`) and the instructions, and this draws neither. `className`
 * (the band's padding) and `heading` go onto every state, and the homepage must hand the same to
 * the `FavoritesEmptyState` it uses as the dynamic-import fallback. `initialCounts` is the cookie
 * as the server read it, only on `/favorites`, so the first HTML already holds the skeleton at the
 * size of the list.
 */
export function FavoritesSection({
  standalone = false,
  heading = 'watermark',
  initialCounts = null,
  className,
}: {
  standalone?: boolean;
  heading?: FavoritesHeadingVariant;
  initialCounts?: FavoriteCounts | null;
  className?: string;
}) {
  const t = useTranslations('favorites');
  const mounted = useMounted();

  const { position } = useGeolocation();
  const { data: favoritesData, isLoading: loading, isPending } = useFavorites();

  // Cookie counts, readable only after mount, so a visitor with no favorites never sees a skeleton.
  const cookieCounts = useMemo(
    () => (mounted ? countFavorites(getFavoritesFromCookies()) : null),
    [mounted]
  );

  // `ParkCard`/`AttractionCard` read namespaces the editorial routes keep out of their payload
  // (see `LAZY_MESSAGE_BOUNDARIES` in lib/i18n/route-namespaces.mjs). The fetch starts in the
  // render that enables the favorites query, so the chunk downloads alongside it; routes that ship
  // both namespaces need no request.
  const cardMessages = useLazyMessages(
    LAZY_CHUNK_NAMESPACES,
    cookieCounts !== null && cookieCounts.total > 0
  );

  const sortByDistanceOrName = useCallback(
    <T extends { distance?: number; name: string }>(items: T[]): T[] => {
      return [...items].sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
    },
    []
  );

  const sortedFavorites = useMemo(
    () =>
      favoritesData
        ? {
            parks: sortByDistanceOrName(favoritesData.parks),
            attractions: sortByDistanceOrName(favoritesData.attractions),
            shows: sortByDistanceOrName(favoritesData.shows),
            restaurants: sortByDistanceOrName(favoritesData.restaurants),
          }
        : null,
    [favoritesData, sortByDistanceOrName]
  );

  // One skeleton shape for every wait below, so whatever replaces it lands in the same box. The
  // location hint and the group headings need no data, so they are the real ones. On `/favorites`
  // each park also holds the line under its card that `FavoriteParkQuietestDay` fills.
  const renderSkeleton = (parkCount: number, attractionCount: number) => (
    <section className={cn('bg-muted/30 px-4 py-8', className)}>
      <div className="container mx-auto">
        {!standalone && <FavoritesHeading variant={heading} />}
        {!position && (
          <p className="text-muted-foreground mt-1 mb-6 text-xs">{t('locationHint')}</p>
        )}
        <div className="space-y-6">
          {parkCount > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold">{t('parks')}</h3>
              <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                {Array.from({ length: parkCount }).map((_, i) =>
                  standalone ? (
                    <div key={i} className="flex flex-col gap-4">
                      <ParkCardNearbySkeleton />
                      <div className="h-7" aria-hidden="true" />
                    </div>
                  ) : (
                    <ParkCardNearbySkeleton key={i} />
                  )
                )}
              </div>
            </div>
          )}
          {attractionCount > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold">{t('attractions')}</h3>
              <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                {Array.from({ length: attractionCount }).map((_, i) => (
                  <AttractionCardSkeleton key={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Server and first hydration: cookies are not readable yet. Hold the empty state's box, the
  // outcome for most visitors and the dynamic-import fallback, so it stands from the first paint
  // through hydration. Unless the server read the cookie: then the skeleton is the box.
  if (!mounted && initialCounts && initialCounts.total > 0)
    return renderSkeleton(
      initialCounts.parks,
      initialCounts.attractions + initialCounts.shows + initialCounts.restaurants
    );
  if (!mounted)
    return (
      <FavoritesEmptyState
        textHidden
        standalone={standalone}
        heading={heading}
        className={className}
      />
    );

  // Cookies say no favorites: render the empty state now rather than wait for a query whose
  // result is known (`useFavorites` is gated on geolocation and answers late).
  if (cookieCounts !== null && cookieCounts.total === 0 && !favoritesData) {
    return <FavoritesEmptyState standalone={standalone} heading={heading} className={className} />;
  }

  // Favorites exist in cookies (or count unknown) and API is still loading → show skeleton.
  // isPending covers the case where the query is disabled (geoLoading=true) but hasn't started yet —
  // isLoading alone misses this and would fall through to the empty state.
  if (loading || isPending) {
    const showParkSkeletons = !cookieCounts || cookieCounts.parks > 0;
    const showAttractionSkeletons = !cookieCounts || cookieCounts.attractions > 0;
    // On `/favorites` the list is the page and every card renders, so the skeleton holds them all
    // — the same counts the server-rendered one used.
    if (standalone && cookieCounts) {
      return renderSkeleton(
        cookieCounts.parks,
        cookieCounts.attractions + cookieCounts.shows + cookieCounts.restaurants
      );
    }
    return renderSkeleton(
      showParkSkeletons ? Math.min(cookieCounts?.parks ?? 3, 3) : 0,
      showAttractionSkeletons ? Math.min(cookieCounts?.attractions ?? 3, 3) : 0
    );
  }

  const hasAnyFavorites =
    sortedFavorites &&
    (sortedFavorites.parks.length > 0 ||
      sortedFavorites.attractions.length > 0 ||
      sortedFavorites.shows.length > 0 ||
      sortedFavorites.restaurants.length > 0);

  const totalFavorites =
    (sortedFavorites?.parks.length ?? 0) +
    (sortedFavorites?.attractions.length || 0) +
    (sortedFavorites?.shows.length || 0) +
    (sortedFavorites?.restaurants.length || 0);

  if (!hasAnyFavorites) {
    return <FavoritesEmptyState standalone={standalone} heading={heading} className={className} />;
  }

  // Favorites are here, their translations not yet: hold the skeleton at the REAL counts. Rarely
  // painted, since the chunk started alongside the favorites request, but raw message keys are no
  // fallback.
  if (!cardMessages.ready) {
    return renderSkeleton(
      sortedFavorites.parks.length,
      sortedFavorites.attractions.length +
        sortedFavorites.shows.length +
        sortedFavorites.restaurants.length
    );
  }

  const content = (
    <section className={cn('bg-muted/30 px-4 py-8', className)}>
      <div className="container mx-auto">
        {standalone ? (
          // On `/favorites` the page's own `<h1>` says it, so this one is only here to keep the
          // outline unbroken over the `<h3>` group headings below — and to say the count, which
          // a server-rendered `<h1>` cannot carry.
          <h2 className="sr-only">
            {t('title')} ({totalFavorites})
          </h2>
        ) : (
          // The same heading as the skeleton and the empty state, so the grids under it land
          // where the skeleton's stood. Only the count is new, and it does not wrap the line.
          <FavoritesHeading variant={heading} count={totalFavorites} />
        )}
        {!position && (
          <p className="text-muted-foreground mt-1 mb-6 text-xs">{t('locationHint')}</p>
        )}
        <div className="space-y-6">
          {sortedFavorites.parks.length > 0 && (
            <>
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('parks')}</h3>
                {/* `eager` on `/favorites`: the grid is the top of the page there, and the
                    placeholder's 244 px rows are a frame of the wrong height before it mounts. */}
                <LazyMount
                  eager={standalone}
                  grid={{
                    count: sortedFavorites.parks.length,
                    rowHeight: standalone ? PARK_ROW_WITH_LINE_PX : 200,
                    headerHeight: 64,
                  }}
                >
                  <div
                    className={cn(
                      'grid gap-4 max-sm:auto-rows-auto sm:grid-cols-2 @min-[1024px]/page:grid-cols-3',
                      // `/favorites` adds a fourth row per park for the quietest-day line.
                      standalone
                        ? '[grid-auto-rows:auto_1fr_auto_auto]'
                        : '[grid-auto-rows:auto_1fr_auto]'
                    )}
                  >
                    {sortedFavorites.parks.map((park) => {
                      const card = (
                        <ParkCard
                          key={park.id}
                          id={park.id}
                          slug={park.slug}
                          name={stripNewPrefix(park.name)}
                          city={park.city}
                          country={park.country}
                          distance={park.distance || 0}
                          status={park.status as import('@/lib/api/types').ParkStatus}
                          timezone={park.timezone}
                          totalAttractions={park.totalAttractions}
                          operatingAttractions={park.operatingAttractions}
                          analytics={park.analytics}
                          todaySchedule={park.todaySchedule}
                          nextSchedule={park.nextSchedule}
                          backgroundImage={park.backgroundImage}
                          objectPosition={park.backgroundPosition}
                          url={park.url}
                          hasOperatingSchedule={park.hasOperatingSchedule}
                          translateCountry
                        />
                      );
                      return standalone ? (
                        <div key={park.id} className="row-span-4 grid [grid-template-rows:subgrid]">
                          {card}
                          <FavoriteParkQuietestDay
                            slug={park.slug}
                            url={park.url}
                            timezone={park.timezone}
                          />
                        </div>
                      ) : (
                        card
                      );
                    })}
                  </div>
                </LazyMount>
              </div>
              {(sortedFavorites.attractions.length > 0 ||
                sortedFavorites.shows.length > 0 ||
                sortedFavorites.restaurants.length > 0) && <Separator />}
            </>
          )}

          {sortedFavorites.attractions.length > 0 && (
            <>
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('attractions')}</h3>
                <LazyMount
                  eager={standalone}
                  grid={{
                    count: sortedFavorites.attractions.length,
                    rowHeight: 340,
                    headerHeight: 64,
                  }}
                >
                  <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 max-sm:auto-rows-auto sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                    {sortedFavorites.attractions.map((attraction) => (
                      <AttractionCard
                        key={attraction.id}
                        attraction={attraction}
                        backgroundImage={attraction.backgroundImage}
                        distance={attraction.distance}
                        showParkName={true}
                      />
                    ))}
                  </div>
                </LazyMount>
              </div>
              {(sortedFavorites.shows.length > 0 || sortedFavorites.restaurants.length > 0) && (
                <Separator />
              )}
            </>
          )}

          {sortedFavorites.shows.length > 0 && (
            <>
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('shows')}</h3>
                <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                  {sortedFavorites.shows.map((show) => (
                    <ShowCard
                      key={show.id}
                      id={show.id}
                      name={stripNewPrefix(show.name)}
                      slug={show.slug}
                      status={show.status}
                      showtimes={show.showtimes}
                      timezone={show.park?.timezone || 'UTC'}
                      href={parkChapterUrl(show.url, 'shows') ?? '#'}
                      parkName={show.park?.name ? stripNewPrefix(show.park.name) : undefined}
                      distance={show.distance}
                    />
                  ))}
                </div>
              </div>
              {sortedFavorites.restaurants.length > 0 && <Separator />}
            </>
          )}

          {sortedFavorites.restaurants.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold">{t('restaurants')}</h3>
              <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                {sortedFavorites.restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    href={parkChapterUrl(restaurant.url, 'restaurants') ?? undefined}
                    parkName={
                      restaurant.park?.name ? stripNewPrefix(restaurant.park.name) : undefined
                    }
                    distance={restaurant.distance}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Namespaces that were fetched rather than shipped have to be put into context for the cards
  // below; `messages` is null on routes whose payload already carries them.
  return cardMessages.messages ? (
    <RouteMessagesProvider messages={cardMessages.messages} namespaces={LAZY_CHUNK_NAMESPACES}>
      {content}
    </RouteMessagesProvider>
  ) : (
    content
  );
}
