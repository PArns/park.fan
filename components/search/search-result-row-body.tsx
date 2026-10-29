'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { TreePalm, Cog, Utensils, Music, MapPin, Clock, BookOpen, Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CAPS_CENTRED_CLASS } from '@/lib/utils/text-box';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { stripNewPrefix, cn } from '@/lib/utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { formatDistance } from '@/lib/utils/distance-utils';
import { CROWD_OUTLINE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { SEARCH_SECONDARY_TEXT_CLASS } from '@/components/search/hero-search-classes';
import type { SearchResultItem } from '@/lib/api/types';
import type { NearbySearchExtras } from '@/lib/hooks/use-hero-browse-parks';

/**
 * A row's pills that lead with an icon, the icon as far from the left edge as from the top. The
 * command list draws every icon in a row at 16 px, which leaves less room around it than the
 * badge's own 12.
 */
const ROW_ICON_PILL_CLASS = 'pl-0.5 text-[11px]';

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
  location: MapPin,
  glossary: BookOpen,
};

/**
 * A wait as an outline pill in its crowd tier's colour (`waitTimeCrowdTier`), the scale every wait
 * on the site uses. The text is the caller's: „Ø 15 Min." for a park, „25 Min" for a ride, centred
 * on its figures like the status pill beside it (`centreCaps`).
 */
export function WaitBadge({
  minutes,
  className,
  children,
}: {
  minutes: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold tabular-nums',
        CROWD_OUTLINE_CLASS[waitTimeCrowdTier(minutes)],
        className
      )}
    >
      <span className={CAPS_CENTRED_CLASS}>{children}</span>
    </Badge>
  );
}

/**
 * A result's place as a row prints it, „Brühl, Deutschland": the city and the country translated
 * from its slug (`tGeo` is `useTranslations('geo')`).
 */
export function searchResultPlace(
  result: Pick<SearchResultItem, 'city' | 'country'>,
  tGeo: Parameters<typeof translateGeoSlug>[0]
): string {
  return [
    result.city,
    result.country ? translateGeoSlug(tGeo, 'countries', result.country, result.country) : null,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * A result's square thumbnail: the media database's photo where the row has one, else the icon of
 * its kind. 36 px, 44 px from `sm`; `className` overrides the size (the hero's phone rows keep 36).
 */
export function SearchResultThumb({
  result,
  className,
}: {
  result: SearchResultItem;
  className?: string;
}) {
  const Icon = typeIcons[result.type];
  return (
    <div
      className={cn(
        'bg-foreground/10 relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-11 sm:w-11 sm:rounded-xl',
        className
      )}
    >
      {result.imageUrl ? (
        <Image
          src={result.imageUrl}
          alt=""
          fill
          // Default optimizer, NOT backgroundImageLoader: that one is tuned for full-bleed
          // photos under gradient overlays (q50) and turns a 44px thumbnail to mush. `sizes`
          // asks for 96px so a 2× screen gets real pixels instead of an upscaled 48.
          sizes="96px"
          quality={75}
          className="object-cover"
          // The media database's focal point, same as every card/background on the site — a
          // 1:1 crop of a 4:3 photo drops most of its width, so a subject near an edge is
          // exactly what gets cut without it.
          style={result.imagePosition ? { objectPosition: result.imagePosition } : undefined}
        />
      ) : (
        <Icon className="text-foreground/65 h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </div>
  );
}

/**
 * The inside of a park, ride, show, restaurant or place row: thumbnail, name and status, then
 * place, live counts, wait and distance. The palette and the desktop dropdown put it in a
 * `CommandItem` (`SearchResultRow`); its module is free of cmdk, so the hero's phone list can take
 * the thumbnail and the place from it. The row's container sets `flex items-center gap-2.5 sm:gap-4`.
 */
export function SearchResultRowBody({ result }: { result: SearchResultItem & NearbySearchExtras }) {
  const tSearch = useTranslations('search');
  const tGeo = useTranslations('geo');

  const isClosed = result.status && result.status !== 'OPERATING';

  return (
    <>
      <SearchResultThumb result={result} />

      <div className="@container flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm leading-none font-semibold sm:text-[15px]">
            {stripNewPrefix(result.name)}
          </span>
          {result.status && (
            <ParkStatusBadge
              status={result.status}
              label={
                result.statusCountdown ? (
                  <>
                    {result.statusLabel}
                    <span className="hidden @min-[30rem]:inline"> ({result.statusCountdown})</span>
                  </>
                ) : (
                  result.statusLabel
                )
              }
              centreCaps
              className={ROW_ICON_PILL_CLASS}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div
            className={cn(SEARCH_SECONDARY_TEXT_CLASS, 'flex min-w-0 items-center gap-1 text-xs')}
          >
            {(result.city || result.country) && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{searchResultPlace(result, tGeo)}</span>
              </span>
            )}

            {result.attractionCounts && !isClosed && (
              <span className="hidden shrink-0 truncate sm:inline">
                ·{' '}
                {tSearch('attractionsOpen', {
                  open: result.attractionCounts.open,
                  total: result.attractionCounts.total,
                })}
              </span>
            )}

            {result.parentPark && (
              <span className="truncate">
                {tSearch('at', { park: stripNewPrefix(result.parentPark.name) })}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {result.isSeasonal && result.isCurrentlyInSeason === true && (
              <Leaf className="h-3.5 w-3.5 shrink-0 text-violet-400" />
            )}

            {result.type === 'attraction' && result.waitTime != null && (
              <span className="text-foreground/70 flex items-center gap-1 text-xs font-semibold">
                <Clock className="h-3 w-3" />
                {result.waitTime} min
              </span>
            )}

            {result.type === 'park' && result.avgWaitTime != null && !isClosed ? (
              <WaitBadge minutes={result.avgWaitTime} className="text-[11px]">
                {tSearch('avgWait', { minutes: result.avgWaitTime })}
              </WaitBadge>
            ) : (
              result.type === 'park' &&
              result.load &&
              !isClosed && (
                <CrowdLevelBadge level={result.load} centreCaps className={ROW_ICON_PILL_CLASS} />
              )
            )}

            {result.distanceM != null && (
              // Centred like the pill beside it, so the two share a line.
              <span
                className={cn(
                  SEARCH_SECONDARY_TEXT_CLASS,
                  CAPS_CENTRED_CLASS,
                  'text-[11px] font-medium tabular-nums'
                )}
              >
                {formatDistance(result.distanceM)}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
