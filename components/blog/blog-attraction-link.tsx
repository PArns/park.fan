'use client';

import { Clock, Theater } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { BlogAttractionCardLive } from './blog-attraction-card-live';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { PERFORMANCE_BADGE_CLASS } from '@/components/parks/performance-badge';
import {
  inlinePerformanceSlot,
  isNotOperating,
  rideChipClosedStatus,
  waitTimeBadgeClass,
} from '@/lib/blog/live-display';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { parkWallClock } from '@/lib/utils/park-day';
import { formatPerformanceTime } from '@/lib/utils/performance-schedule';
import { worksPeriodsOf } from '@/lib/utils/works-period';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { cn } from '@/lib/utils';
import { useLiveBlogRide } from '@/lib/blog/use-blog-live';
import type { ResolvedAttraction, ResolvedPark } from '@/lib/blog/park-resolver';
import { STANDALONE_CARD_ROWS_CLASS } from '@/components/parks/card-rows';

/** Compact sizing so the live badges sit nicely inside running prose. */
const INLINE_BADGE = 'h-[18px] gap-0.5 px-1.5 py-0 text-[10px] font-semibold no-underline';

interface BlogAttractionLinkProps {
  attraction: ResolvedAttraction | null;
  park: ResolvedPark | null;
  fallbackLabel: string;
  /** Raw "parkSlug/attractionSlug" — used if resolution failed. */
  refKey: string;
  options?: Set<string>;
  /** Pre-computed attraction background image path (looked up server-side). */
  attractionBackgroundImage?: string | null;
  /** Pre-computed park background image, used as a fallback for the attraction card. */
  parkBackgroundImage?: string | null;
  /** Focal point for whichever of the two photos is used, resolved server-side. */
  objectPosition?: string;
  children?: React.ReactNode;
}

/**
 * Inline reference to an attraction inside blog content: a real link whose hover card is the full
 * `AttractionCard`, as `BlogParkLink` does for parks.
 */
export function BlogAttractionLink({
  attraction: resolvedAttraction,
  park: resolvedPark,
  fallbackLabel,
  refKey: _refKey,
  options,
  attractionBackgroundImage,
  parkBackgroundImage,
  objectPosition,
  children,
}: BlogAttractionLinkProps) {
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const tPerformance = useTranslations('attractions.performance');
  const locale = useLocale();
  // A post stands at the edge for up to a day, so the resolved pair is a render-time snapshot;
  // refresh both in the browser (`useLiveBlogRide`). The hover card fetches the fuller payload once it opens.
  const { park, attraction } = useLiveBlogRide(resolvedPark, resolvedAttraction);
  const label = children ?? attraction?.attractionName ?? fallbackLabel;
  // Only a ride with a programme or a closed park reads the clock, so the other chips take no
  // minute tick.
  const schedules = attraction?.detail?.performanceSchedules;
  const nowMs = useMinuteNow(!!schedules?.length || park?.status === 'CLOSED');
  const bare = options?.has('bare') ?? false;
  // `chip`: the live badge without the "(Park, Country)" note, for prose that already names the park.
  const chipOnly = options?.has('chip') ?? false;

  if (!attraction || !park) {
    // Geo data unavailable — render the label as plain text rather than a
    // dead link that would 404 on a bare /parks/<refKey>.
    return <span className="font-medium">{label}</span>;
  }

  // Inline live badge: a wait-time badge while operating, a status badge when
  // the ride isn't running. Real badge components — not recoloured link text.
  // A ride that closed for good says that, whatever the live reading is.
  const closed = isNotOperating(attraction.status);
  // A ride that starts at set times shows its next start: the feed reads it CLOSED between two
  // performances, which is no closure.
  const performanceSlot = inlinePerformanceSlot(
    {
      schedules,
      worksPeriods: worksPeriodsOf(attraction.detail),
      status: attraction.status ?? 'UNKNOWN',
      parkStatus: park.status,
    },
    nowMs === null ? null : parkWallClock(nowMs, park.timezone)
  );
  const liveBadge = attraction.closedPermanently ? (
    <ParkStatusBadge status="RETIRED" className={INLINE_BADGE} />
  ) : performanceSlot ? (
    <Badge title={tPerformance('hint')} className={cn(PERFORMANCE_BADGE_CLASS, INLINE_BADGE)}>
      <Theater className="h-2.5 w-2.5" aria-hidden="true" />
      {performanceSlot === 'pending' ? (
        // Holds the chip's width until the park's clock is read.
        <span className="invisible tabular-nums" aria-hidden="true">
          00:00
        </span>
      ) : (
        <>
          <span className="sr-only">{tPerformance('next')}: </span>
          <span className="tabular-nums">{formatPerformanceTime(performanceSlot, locale)}</span>
        </>
      )}
    </Badge>
  ) : closed ? (
    <ParkStatusBadge
      status={rideChipClosedStatus(
        {
          status: attraction.status,
          isCurrentlyInSeason: attraction.detail?.isCurrentlyInSeason,
        },
        park,
        nowMs
      )}
      className={INLINE_BADGE}
    />
  ) : typeof attraction.currentWaitTime === 'number' ? (
    <Badge className={cn(waitTimeBadgeClass(attraction.currentWaitTime), INLINE_BADGE)}>
      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
      {attraction.currentWaitTime} {tCommon('min')}
    </Badge>
  ) : null;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link
          href={attraction.href as '/'}
          className="text-primary hover:text-primary/80 focus-visible:ring-ring/40 inline rounded-sm font-medium underline decoration-dotted underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2"
        >
          {label}
          {!bare && (
            <span className="ml-1 inline-flex items-baseline gap-1 align-baseline no-underline">
              {!chipOnly && (
                <span className="text-muted-foreground text-[0.92em] font-normal">
                  ({park.name},{' '}
                  {translateGeoSlug(tGeo, 'countries', park.countrySlug, park.country)})
                </span>
              )}
              {liveBadge && (
                <span className="inline-flex translate-y-[1px] align-middle">{liveBadge}</span>
              )}
            </span>
          )}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-[420px] border-none bg-transparent p-0 shadow-none backdrop-blur-none"
      >
        <BlogAttractionCardLive
          park={park}
          attraction={attraction}
          attractionBackgroundImage={attractionBackgroundImage}
          parkBackgroundImage={parkBackgroundImage}
          objectPosition={objectPosition}
          className={STANDALONE_CARD_ROWS_CLASS}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
