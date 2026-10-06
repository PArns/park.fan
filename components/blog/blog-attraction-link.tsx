'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { BlogAttractionCardLive } from './blog-attraction-card-live';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { isNotOperating, waitTimeBadgeClass } from '@/lib/blog/live-display';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { cn } from '@/lib/utils';
import { useLiveBlogRide } from '@/lib/blog/use-blog-live';
import type { ResolvedAttraction, ResolvedPark } from '@/lib/blog/park-resolver';

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
  // The post is statically generated, so the resolved pair is a build-time snapshot; refresh both
  // in the browser (`useLiveBlogRide`). The hover card fetches the fuller payload once it opens.
  const { park, attraction } = useLiveBlogRide(resolvedPark, resolvedAttraction);
  const label = children ?? attraction?.attractionName ?? fallbackLabel;
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
  const liveBadge = attraction.closedPermanently ? (
    <ParkStatusBadge status="RETIRED" className={INLINE_BADGE} />
  ) : closed ? (
    <ParkStatusBadge status={attraction.status ?? 'CLOSED'} className={INLINE_BADGE} />
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
        {/* Row template as in BlogParkLink; the minmax floor keeps the image area open when there
            is no background image. */}
        <BlogAttractionCardLive
          park={park}
          attraction={attraction}
          attractionBackgroundImage={attractionBackgroundImage}
          parkBackgroundImage={parkBackgroundImage}
          objectPosition={objectPosition}
          className="grid [grid-template-rows:auto_0px_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]"
        />
      </HoverCardContent>
    </HoverCard>
  );
}
