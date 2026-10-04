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
import { getFavoritesFromCookies } from '@/lib/utils/favorites';
import { parkChapterUrl } from '@/lib/utils/url-utils';
import { useLazyMessages } from '@/i18n/use-lazy-messages';
import { RouteMessagesProvider } from '@/i18n/route-messages-provider';
import { LAZY_CHUNK_NAMESPACES } from '@/i18n/route-namespaces.generated';

/**
 * `standalone` is what `/favorites` passes: there the band is the page's whole content, so the
 * page carries the title (as its `<h1>`) and the instructions (under the band, in every state)
 * and this component draws neither. Everywhere else — homepage, blog, glossary — it is one band
 * among several and needs its own heading to be one.
 *
 * `className` goes onto the band in every state, the empty one included, and is for its padding:
 * the homepage hands it the story's rhythm (`STORY_SECTION_Y`), and must hand the same to the
 * `FavoritesEmptyState` it uses as the dynamic-import fallback. `heading` likewise: `tile` on the
 * homepage, `watermark` (the default) everywhere else — see `FavoritesHeading`.
 */
export function FavoritesSection({
  standalone = false,
  heading = 'watermark',
  className,
}: {
  standalone?: boolean;
  heading?: FavoritesHeadingVariant;
  className?: string;
}) {
  const t = useTranslations('favorites');
  const mounted = useMounted();

  const { position } = useGeolocation();
  const { data: favoritesData, isLoading: loading, isPending } = useFavorites();

  // Read cookie counts once after mount — avoids showing a skeleton for users with no favorites.
  // Returns -1 on the server (cookies not readable); after mount the real count is used.
  const cookieCounts = useMemo(() => {
    if (!mounted) return null;
    const f = getFavoritesFromCookies();
    return {
      parks: f.parks.length,
      attractions: f.attractions.length,
      shows: f.shows.length,
      restaurants: f.restaurants.length,
      total: f.parks.length + f.attractions.length + f.shows.length + f.restaurants.length,
    };
  }, [mounted]);

  // `ParkCard`/`AttractionCard` read the `parks` + `attractions` namespaces, which the editorial
  // routes deliberately keep out of their payload — this section is empty for almost everyone who
  // lands there (see `LAZY_MESSAGE_BOUNDARIES` in lib/i18n/route-namespaces.mjs). Kick the fetch
  // off from the same render that enables the favorites query below, so the chunk downloads
  // ALONGSIDE that request instead of after it; on routes that already ship both namespaces
  // (homepage, park pages) this resolves without a request at all.
  const cardMessages = useLazyMessages(
    LAZY_CHUNK_NAMESPACES,
    cookieCounts !== null && cookieCounts.total > 0
  );

  // Sort by distance (nearest first) or alphabetically if no distance available
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

  // Memoize sorted list to avoid recalculating when parent re-renders
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

  // Server / first hydration: cookies aren't readable, so we don't know yet which of the
  // three outcomes below this is. Hold the empty state's box anyway — it is the outcome
  // for the overwhelming majority, and the same box is this component's dynamic-import
  // fallback, so it stands from the first paint through hydration without moving.
  if (!mounted)
    return (
      <FavoritesEmptyState
        textHidden
        standalone={standalone}
        heading={heading}
        className={className}
      />
    );

  // Cookies say no favorites, so the answer is already settled: render the empty state now
  // instead of waiting for a query whose result we can predict. It used to return null here
  // and let the resolved query paint the same box a moment later — but `useFavorites` is
  // gated on geolocation and answers `{parks: [], …}`, a TRUTHY empty result, so the guard
  // never held for long and the box arrived late instead of never.
  if (cookieCounts !== null && cookieCounts.total === 0 && !favoritesData) {
    return <FavoritesEmptyState standalone={standalone} heading={heading} className={className} />;
  }

  // One skeleton shape for both waits below, so whatever replaces it lands in the same box.
  const renderSkeleton = (parkCount: number, attractionCount: number) => (
    <section className={cn('bg-muted/30 px-4 py-8', className)}>
      <div className="container mx-auto">
        {!standalone && <FavoritesHeading variant={heading} />}
        <div className="space-y-6">
          {parkCount > 0 && (
            <div>
              <div className="bg-muted mb-4 h-6 w-24 rounded" />
              <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                {Array.from({ length: parkCount }).map((_, i) => (
                  <ParkCardNearbySkeleton key={i} />
                ))}
              </div>
            </div>
          )}
          {attractionCount > 0 && (
            <div>
              <div className="bg-muted mb-4 h-6 w-24 rounded" />
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

  // Favorites exist in cookies (or count unknown) and API is still loading → show skeleton.
  // isPending covers the case where the query is disabled (geoLoading=true) but hasn't started yet —
  // isLoading alone misses this and would fall through to the empty state.
  if (loading || isPending) {
    const showParkSkeletons = !cookieCounts || cookieCounts.parks > 0;
    const showAttractionSkeletons = !cookieCounts || cookieCounts.attractions > 0;
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

  // Favorites are here, their translations are not (yet). Hold the skeleton at the REAL counts so
  // the cards drop into an identically sized box. In practice this branch is never painted: the
  // chunk is a same-origin JS module that started downloading alongside the favorites request and
  // resolves long before it — but rendering raw message keys is not an acceptable fallback.
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
          {/* Parks */}
          {sortedFavorites.parks.length > 0 && (
            <>
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('parks')}</h3>
                <LazyMount
                  grid={{ count: sortedFavorites.parks.length, rowHeight: 200, headerHeight: 64 }}
                >
                  <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 max-sm:auto-rows-auto sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
                    {sortedFavorites.parks.map((park) => (
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
                    ))}
                  </div>
                </LazyMount>
              </div>
              {(sortedFavorites.attractions.length > 0 ||
                sortedFavorites.shows.length > 0 ||
                sortedFavorites.restaurants.length > 0) && <Separator />}
            </>
          )}

          {/* Attractions */}
          {sortedFavorites.attractions.length > 0 && (
            <>
              <div>
                <h3 className="mb-4 text-lg font-semibold">{t('attractions')}</h3>
                <LazyMount
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

          {/* Shows */}
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

          {/* Restaurants */}
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
