'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Clock, TrendingUp, ChevronRight, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BackgroundOverlayImage } from '@/components/common/background-overlay-image';
import { FavoriteStar } from '@/components/common/favorite-star';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { formatDistance } from '@/lib/utils/distance-utils';
import { waitTimeBadgeClass } from '@/lib/blog/live-display';
import { cn, stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl, getParkUrlFromAttractionUrl } from '@/lib/utils/url-utils';
import type { AttractionWithDistance, NearbyAttractionsData } from '@/types/nearby';
import type { CrowdLevel } from '@/lib/api/types';

// All headliners are shown (no cap). The "nearest" list below shows the next non-headliner rides so
// the user always sees more than just the marquee attractions.
const NEAREST_LIMIT = 5;

/**
 * A single in-park attraction row (name, distance, live wait/crowd badges). Shared by the
 * headliner list and the "nearest attractions" list so both render identically. When the ride is a
 * headliner and `headlinerLabel` is set, a "Top" badge is shown next to the name in either list.
 */
function InParkAttractionRow({
  attraction,
  awayLabel,
  headlinerLabel,
}: {
  attraction: AttractionWithDistance;
  awayLabel: string;
  headlinerLabel?: string;
}) {
  // Non-operating rides (e.g. whole park closed) get a colored status badge instead of a wait time.
  const showStatusBadge =
    attraction.status === 'DOWN' ||
    attraction.status === 'CLOSED' ||
    attraction.status === 'REFURBISHMENT';
  return (
    <li>
      <Link
        href={convertApiUrlToFrontendUrl(attraction.url)}
        prefetch={false}
        className="group block"
      >
        <div className="bg-background/60 hover:bg-background/80 hover:border-primary/50 relative flex items-center justify-between rounded-lg border p-3 backdrop-blur-md transition-all hover:shadow-sm">
          {/* Favorite Star */}
          {attraction.id && (
            <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
              <FavoriteStar type="attraction" id={attraction.id} />
            </div>
          )}
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2">
              <p className="group-hover:text-primary truncate font-medium transition-colors">
                {stripNewPrefix(attraction.name)}
              </p>
              {attraction.isHeadliner && headlinerLabel && (
                <Badge className="shrink-0 gap-1 border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                  {headlinerLabel}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatDistance(attraction.distance)} {awayLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {attraction.status === 'OPERATING' ? (
              <>
                {typeof attraction.waitTime === 'number' && (
                  <Badge className={waitTimeBadgeClass(attraction.waitTime)}>
                    <span>⏱️</span>
                    {attraction.waitTime} min
                  </Badge>
                )}
                {attraction.crowdLevel && attraction.crowdLevel !== null && (
                  <CrowdLevelBadge level={attraction.crowdLevel} showLabel={false} />
                )}
              </>
            ) : (
              showStatusBadge && <ParkStatusBadge status={attraction.status} />
            )}
            <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 flex-shrink-0 transition-colors" />
          </div>
        </div>
      </Link>
    </li>
  );
}

/**
 * "You are in a park" view: full-bleed park banner with headliners and the nearest attractions.
 * Rendered when the nearby response classifies the user as inside a park.
 */
export function InParkView({
  data,
  className,
}: {
  data: NearbyAttractionsData;
  className?: string;
}) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');

  if (!data || !data.park) {
    return null;
  }

  const park = data.park;
  // Drop rides that are clearly out of their season. The API already hides
  // `isCurrentlyInSeason === false`, but we filter defensively so off-season attractions never
  // leak into the list; seasonal rides with unknown months (null) and in-season ones stay.
  const inSeasonRides = (data.rides || []).filter((a) => a.isCurrentlyInSeason !== false);

  // Headliners (top/marquee attractions, flagged by the API). All of them are shown above the
  // regular list, sorted by distance. Closed ones are kept and carry a status badge — a headliner
  // is worth pointing out even when the park (or just that ride) isn't operating right now.
  const headliners = inSeasonRides
    .filter((a) => a.isHeadliner)
    .sort((a, b) => a.distance - b.distance);
  const headlinerIds = new Set(headliners.map((h) => h.id));

  // The remaining (non-headliner) rides, nearest first. Closed/refurbishment rides are kept (they
  // show a status badge) so the list isn't empty when the park is currently closed — otherwise the
  // user would only ever see headliners. Off-season rides are already dropped via inSeasonRides.
  const attractions = inSeasonRides
    .filter((a) => !headlinerIds.has(a.id))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, NEAREST_LIMIT);

  // Park page URL (for "Go to park page" CTA); fallback from first known ride (headliner or
  // regular attraction) when the park itself doesn't carry a url.
  const fallbackRide = attractions[0] ?? headliners[0] ?? null;
  const rawParkUrl = (park as { url?: string })?.url;
  const parkPageUrl = rawParkUrl
    ? convertApiUrlToFrontendUrl(rawParkUrl)
    : fallbackRide
      ? getParkUrlFromAttractionUrl(fallbackRide.url)
      : null;
  const parkMapUrl = parkPageUrl && fallbackRide ? `${parkPageUrl}#map` : parkPageUrl;

  return (
    <section
      className={cn(
        // Full-bleed banner: the card lives inside a centered container, so break the whole
        // section out to the viewport width (body has `overflow-x: clip` → no h-scrollbar).
        // The content below is re-contained, so its left/right padding stays symmetric.
        'bg-park-primary/5 relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-6',
        className
      )}
    >
      {/* Background image: confined to the header band and faded to the section background
          so it never bleeds through the attractions list — keeping the list readable in
          light mode. */}
      {park.backgroundImage && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 overflow-hidden sm:h-64">
          <BackgroundOverlayImage
            imageSrc={park.backgroundImage}
            alt={stripNewPrefix(park.name)}
            sizes="100vw"
          />
          <div className="from-background/10 via-background/50 to-background absolute inset-0 bg-gradient-to-b" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
          <MapPin className="text-park-primary h-5 w-5" />
          {t('youAreInPark', { parkName: stripNewPrefix(park.name) })}
        </h2>
        <div className="space-y-4">
          {/* Quick navigation: primary CTA to park page when user is in park */}
          {parkPageUrl && (
            <div className="mb-4">
              <Button asChild size="lg" className="w-full justify-center sm:w-auto">
                <Link href={parkPageUrl} prefetch={false}>
                  {t('goToParkPage')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
          {/* Park Info */}
          {parkMapUrl ? (
            <Link
              href={parkMapUrl}
              prefetch={false}
              className="group block transition-opacity hover:opacity-80"
            >
              <article className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{stripNewPrefix(park.name)}</h3>
                    <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t('youAreIn')} · {park.status}
                  </p>
                </div>
                {park.analytics?.crowdLevel &&
                  (park.status === 'OPERATING' || park.status === 'UNKNOWN') && (
                    <CrowdLevelBadge level={park.analytics.crowdLevel as CrowdLevel} />
                  )}
              </article>

              {/* Park Analytics - Inside Link */}
              {park.analytics && (
                <div className="mt-4 flex items-center gap-4 text-sm">
                  {park.analytics.avgWaitTime !== undefined && (
                    <div className="flex items-center gap-1">
                      <Clock className="text-muted-foreground h-4 w-4" />
                      <span>
                        {park.analytics.avgWaitTime} {tCommon('minutes')} Ø
                      </span>
                    </div>
                  )}
                  {park.analytics.operatingAttractions !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="text-muted-foreground h-4 w-4" />
                      <span>
                        {park.analytics.operatingAttractions} {tCommon('operating')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Link>
          ) : (
            <>
              <article className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{stripNewPrefix(park.name)}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('youAreIn')} · {park.status}
                  </p>
                </div>
                {park.analytics?.crowdLevel &&
                  (park.status === 'OPERATING' || park.status === 'UNKNOWN') && (
                    <CrowdLevelBadge level={park.analytics.crowdLevel as CrowdLevel} />
                  )}
              </article>

              {/* Park Analytics */}
              {park.analytics && (
                <div className="flex items-center gap-4 text-sm">
                  {park.analytics.avgWaitTime !== undefined && (
                    <div className="flex items-center gap-1">
                      <Clock className="text-muted-foreground h-4 w-4" />
                      <span>
                        {park.analytics.avgWaitTime} {tCommon('minutes')} Ø
                      </span>
                    </div>
                  )}
                  {park.analytics.operatingAttractions !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="text-muted-foreground h-4 w-4" />
                      <span>
                        {park.analytics.operatingAttractions} {tCommon('operating')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Headliners — always shown above the nearest attractions */}
          {headliners.length > 0 && (
            <div>
              <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {t('headliners')}
              </h4>
              <ul className="space-y-2">
                {headliners.map((attraction) => (
                  <InParkAttractionRow
                    key={attraction.id}
                    attraction={attraction}
                    awayLabel={t('awayFrom')}
                    headlinerLabel={t('headlinerBadge')}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Nearest Attractions */}
          {attractions.length > 0 && (
            <div>
              <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                {t('nearestAttractions')}
              </h4>
              <ul className="space-y-2">
                {attractions.map((attraction) => (
                  <InParkAttractionRow
                    key={attraction.id}
                    attraction={attraction}
                    awayLabel={t('awayFrom')}
                    headlinerLabel={t('headlinerBadge')}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
