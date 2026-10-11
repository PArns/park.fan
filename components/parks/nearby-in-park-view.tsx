'use client';

import { useTranslations } from 'next-intl';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { MapPin, Clock, TrendingUp, ChevronRight, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BackgroundOverlayImage } from '@/components/common/background-overlay-image';
import { Button } from '@/components/ui/button';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { LiveWaitPill, RIDE_STATUS_TEXT } from '@/components/parks/live-wait-pill';
import { IN_PARK_LIST, InParkRow } from '@/components/parks/in-park-row';
import { NextBestRides } from '@/components/parks/next-best-rides';
import { formatDistance } from '@/lib/utils/distance-utils';
import { cn, stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl, getParkUrlFromAttractionUrl } from '@/lib/utils/url-utils';
import type { AttractionWithDistance, NearbyAttractionsData, NearbyParkInfo } from '@/types/nearby';
import type { CrowdLevel } from '@/lib/api/types';

// All headliners are shown (no cap). The "nearest" list below shows the next non-headliner rides so
// the user always sees more than just the marquee attractions.
const NEAREST_LIMIT = 5;

/**
 * A single in-park attraction row: the name, how far and, without a posted wait, the ride's status
 * as text on the second line, and the wait as the compass's solid pill. Shared by the headliner
 * list, the "nearest attractions" list and the nowcast banner's covered rides
 * (`NowcastCoveredRides`) so all three render identically. With `headlinerLabel` a headliner gets
 * a star before its name, for a list that mixes them with other rides.
 */
export function InParkAttractionRow({
  attraction,
  awayLabel,
  headlinerLabel,
  showDistance = true,
  onOpen,
}: {
  attraction: AttractionWithDistance;
  awayLabel: string;
  headlinerLabel?: string;
  /** False when the fix is too coarse for a per-ride distance to mean anything. */
  showDistance?: boolean;
  /** The row's link was followed. */
  onOpen?: () => void;
}) {
  const tStatus = useTranslations('parks.status');
  const wait =
    attraction.status === 'OPERATING' && typeof attraction.waitTime === 'number'
      ? attraction.waitTime
      : null;
  const status = wait === null && tStatus.has(attraction.status) ? attraction.status : null;
  const distance = showDistance ? `${formatDistance(attraction.distance)} ${awayLabel}` : null;
  return (
    <InParkRow
      href={convertApiUrlToFrontendUrl(attraction.url)}
      onOpen={onOpen}
      title={
        <>
          {attraction.isHeadliner && headlinerLabel && (
            <>
              <Star
                aria-hidden="true"
                className="size-3.5 shrink-0 fill-amber-500 text-amber-500"
              />
              <span className="sr-only">{headlinerLabel}: </span>
            </>
          )}
          <span className="truncate">{stripNewPrefix(attraction.name)}</span>
        </>
      }
      meta={
        (distance || status) && (
          <>
            {distance}
            {distance && status && ' · '}
            {status && <span className={RIDE_STATUS_TEXT[status]}>{tStatus(status)}</span>}
          </>
        )
      }
      trailing={wait !== null && <LiveWaitPill minutes={wait} />}
    />
  );
}

/**
 * The rides an in-park view lists: every in-season headliner, then the nearest other rides.
 * Shared by the homepage's `InParkView` and the park page's "near you" block, so both list the
 * same rides in the same order.
 */
export function splitInParkRides(rides: AttractionWithDistance[] | undefined) {
  // The API already hides `isCurrentlyInSeason === false`; filtered again defensively, and a
  // seasonal ride with unknown months (`null`) stays.
  const inSeasonRides = (rides || []).filter((a) => a.isCurrentlyInSeason !== false);

  // Every headliner, nearest first. Closed ones stay, their status written out: a headliner is worth
  // pointing out even when the park, or just that ride, is not running.
  const headliners = inSeasonRides
    .filter((a) => a.isHeadliner)
    .sort((a, b) => a.distance - b.distance);
  const headlinerIds = new Set(headliners.map((h) => h.id));

  // Closed rides stay (their status written out), so the list is not empty while the park is closed.
  const attractions = inSeasonRides
    .filter((a) => !headlinerIds.has(a.id))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, NEAREST_LIMIT);

  return { headliners, attractions };
}

/**
 * The two ride lists of an in-park view (headliners, then the nearest other rides), from the
 * output of `splitInParkRides`. `showDistance={false}` drops the "120 m away" line on every row.
 */
export function InParkRideLists({
  headliners,
  attractions,
  showDistance = true,
  headingAs: Heading = 'h4',
}: {
  headliners: AttractionWithDistance[];
  attractions: AttractionWithDistance[];
  showDistance?: boolean;
  /** The labels' level: `h4` under the homepage's in-park heading, `h3` on the park page. */
  headingAs?: 'h3' | 'h4';
}) {
  const t = useTranslations('nearby');
  return (
    <>
      {headliners.length > 0 && (
        <div>
          <Heading className="text-muted-foreground mb-1 flex items-center gap-1.5 text-sm font-medium">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
            {t('headliners')}
          </Heading>
          <ul className={IN_PARK_LIST}>
            {headliners.map((attraction) => (
              <InParkAttractionRow
                key={attraction.id}
                attraction={attraction}
                awayLabel={t('awayFrom')}
                showDistance={showDistance}
              />
            ))}
          </ul>
        </div>
      )}

      {attractions.length > 0 && (
        <div>
          <Heading className="text-muted-foreground mb-1 text-sm font-medium">
            {t('nearestAttractions')}
          </Heading>
          <ul className={IN_PARK_LIST}>
            {attractions.map((attraction) => (
              <InParkAttractionRow
                key={attraction.id}
                attraction={attraction}
                awayLabel={t('awayFrom')}
                showDistance={showDistance}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ParkAnalyticsRow({
  analytics,
  className,
}: {
  analytics: NonNullable<NearbyParkInfo['analytics']>;
  className?: string;
}) {
  const tCommon = useTranslations('common');
  return (
    <div className={cn(className, 'flex items-center gap-4 text-sm')}>
      {analytics.avgWaitTime !== undefined && (
        <div className="flex items-center gap-1">
          <Clock className="text-muted-foreground h-4 w-4" />
          <span>
            {analytics.avgWaitTime} {tCommon('minutes')} Ø
          </span>
        </div>
      )}
      {analytics.operatingAttractions !== undefined && (
        <div className="flex items-center gap-1">
          <TrendingUp className="text-muted-foreground h-4 w-4" />
          <span>
            {analytics.operatingAttractions} {tCommon('operating')}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * "You are in a park" view: full-bleed park banner with headliners and the nearest attractions.
 * Rendered when the nearby response classifies the user as inside a park.
 */
export function InParkView({
  data,
  className,
  nested = false,
}: {
  data: NearbyAttractionsData;
  className?: string;
  /** See `NearbyParksCard`: on the homepage `NearbyChapter` holds the chapter's `<h2>`. */
  nested?: boolean;
}) {
  const t = useTranslations('nearby');
  const tStatus = useTranslations('parks.status');

  if (!data || !data.park) {
    return null;
  }

  const park = data.park;
  const { headliners, attractions } = splitInParkRides(data.rides);

  // `park.status` is the raw API enum (OPERATING, CLOSED, …); show its translated label, and drop
  // it rather than print an enum value the status labels do not cover.
  const statusLabel = tStatus.has(park.status) ? tStatus(park.status) : null;
  const youAreHere = statusLabel ? `${t('youAreIn')} · ${statusLabel}` : t('youAreIn');

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
      {/* Confined to the header band and faded to the section background, so it never bleeds
          through the list in light mode. */}
      {park.backgroundImage && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 overflow-hidden sm:h-64">
          <BackgroundOverlayImage
            imageSrc={park.backgroundImage}
            alt={stripNewPrefix(park.name)}
            sizes="100vw"
            objectPosition={park.backgroundPosition}
          />
          <div className="from-background/10 via-background/50 to-background absolute inset-0 bg-gradient-to-b" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4">
        {nested ? (
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <MapPin className="text-park-primary h-5 w-5" />
            {t('youAreInPark', { parkName: stripNewPrefix(park.name) })}
          </h3>
        ) : (
          // A chapter of its own under editorial pages, and `frosted` because it stands over the
          // park's photo, where a bare watermark is unreadable — the park page's reason.
          <ChapterHeading
            frosted
            icon={MapPin}
            title={t('youAreInPark', { parkName: stripNewPrefix(park.name) })}
          />
        )}
        <div className="space-y-4">
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
                  <p className="text-muted-foreground text-sm">{youAreHere}</p>
                </div>
                {park.analytics?.crowdLevel &&
                  (park.status === 'OPERATING' || park.status === 'UNKNOWN') && (
                    <CrowdLevelBadge level={park.analytics.crowdLevel as CrowdLevel} />
                  )}
              </article>

              {park.analytics && <ParkAnalyticsRow analytics={park.analytics} className="mt-4" />}
            </Link>
          ) : (
            <>
              <article className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{stripNewPrefix(park.name)}</h3>
                  <p className="text-muted-foreground text-sm">{youAreHere}</p>
                </div>
                {park.analytics?.crowdLevel &&
                  (park.status === 'OPERATING' || park.status === 'UNKNOWN') && (
                    <CrowdLevelBadge level={park.analytics.crowdLevel as CrowdLevel} />
                  )}
              </article>

              {park.analytics && <ParkAnalyticsRow analytics={park.analytics} />}
            </>
          )}

          <NextBestRides
            park={{ slug: park.slug, timezone: park.timezone }}
            rides={data.rides}
            showDistance
          />
          <InParkRideLists headliners={headliners} attractions={attractions} />
        </div>
      </div>
    </section>
  );
}
