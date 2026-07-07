'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { AttractionCard } from '@/components/parks/attraction-card';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { isNotOperating, waitTimeBadgeClass } from '@/lib/blog/live-display';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { cn } from '@/lib/utils';
import { buildAttractionPayload } from '@/lib/blog/attraction-payload';
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
  children?: React.ReactNode;
}

/**
 * Inline reference to an attraction inside blog content.
 *
 * Mirrors BlogParkLink but uses the full `AttractionCard` (the same one shown
 * on favorites and on the homepage stats) inside the hover, so the reader
 * gets the background image, live wait time, sparkline, status badge and
 * crowd level.
 */
export function BlogAttractionLink({
  attraction,
  park,
  fallbackLabel,
  refKey: _refKey,
  options,
  attractionBackgroundImage,
  parkBackgroundImage,
  children,
}: BlogAttractionLinkProps) {
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const label = children ?? attraction?.attractionName ?? fallbackLabel;
  const bare = options?.has('bare') ?? false;

  if (!attraction || !park) {
    // Geo data unavailable — render the label as plain text rather than a
    // dead link that would 404 on a bare /parks/<refKey>.
    return <span className="font-medium">{label}</span>;
  }

  // Inline live badge: a wait-time badge while operating, a status badge when
  // the ride isn't running. Real badge components — not recoloured link text.
  const closed = isNotOperating(attraction.status);
  const liveBadge = closed ? (
    <ParkStatusBadge status={attraction.status ?? 'CLOSED'} className={INLINE_BADGE} />
  ) : typeof attraction.currentWaitTime === 'number' ? (
    <Badge className={cn(waitTimeBadgeClass(attraction.currentWaitTime), INLINE_BADGE)}>
      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
      {attraction.currentWaitTime} {tCommon('min')}
    </Badge>
  ) : null;

  // Prefer the live data resolved on the server; falls back to a minimal
  // shape when the API call failed so the hover still renders.
  const attractionPayload = buildAttractionPayload(park, attraction);

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
              <span className="text-muted-foreground text-[0.92em] font-normal">
                ({park.name}, {translateGeoSlug(tGeo, 'countries', park.countrySlug, park.country)})
              </span>
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
        {/* See BlogParkLink for the row-template reasoning. AttractionCard
           uses the same sm:min-h-[220px] photo spacer trick to open the 1fr
           middle row; the minmax floor keeps the image area open even when
           there is no background image to trigger the spacer's min-h. */}
        <div className="grid [grid-template-rows:auto_0px_auto] sm:[grid-template-rows:auto_minmax(220px,1fr)_auto]">
          <AttractionCard
            attraction={attractionPayload}
            parkPath={park.href}
            parkStatus={park.status}
            backgroundImage={attractionBackgroundImage ?? parkBackgroundImage ?? undefined}
            showParkName
            timezone={park.timezone}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
