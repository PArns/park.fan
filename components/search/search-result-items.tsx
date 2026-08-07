'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { TreePalm, Cog, Utensils, Music, MapPin, Clock, BookOpen, Leaf } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { stripNewPrefix, cn } from '@/lib/utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { CROWD_OUTLINE_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import type { SearchResultItem } from '@/lib/api/types';
import type { GlossarySearchItem } from '@/lib/hooks/use-search-results';
import type { NearbySearchExtras } from '@/lib/hooks/use-hero-browse-parks';

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
  location: MapPin,
  glossary: BookOpen,
};

interface SearchResultRowProps {
  result: SearchResultItem & NearbySearchExtras;
  position?: number;
  onSelect: (result: SearchResultItem, position?: number) => void;
}

/** A single park/attraction/show/restaurant/location result row. */
export function SearchResultRow({ result, position, onSelect }: SearchResultRowProps) {
  const tSearch = useTranslations('search');
  const tGeo = useTranslations('geo');

  const Icon = typeIcons[result.type];

  const formatDistance = (m: number) =>
    m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

  const isClosed = result.status && result.status !== 'OPERATING';

  return (
    <CommandItem
      value={`${stripNewPrefix(result.name)} ${result.type} ${result.id}`}
      onSelect={() => onSelect(result, position)}
      className="flex cursor-pointer items-center gap-2.5 sm:gap-4"
    >
      {/* Photo (resolved from the media database) or type icon */}
      <div className="bg-foreground/10 relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-11 sm:w-11 sm:rounded-xl">
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

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
        {/* Row 1: Name + Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm leading-none font-semibold sm:text-[15px]">
            {stripNewPrefix(result.name)}
          </span>
          {result.status && <ParkStatusBadge status={result.status} className="text-[11px]" />}
        </div>

        {/* Row 2: Location (left) + Crowd / Wait / Distance (right) */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-foreground/45 flex min-w-0 items-center gap-1 text-xs">
            {/* Location */}
            {(result.city || result.country) && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {[
                    result.city,
                    result.country
                      ? translateGeoSlug(tGeo, 'countries', result.country, result.country)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </span>
            )}

            {/* Live "open of total" attraction count (nearby feed) */}
            {result.attractionCounts && !isClosed && (
              <span className="hidden shrink-0 truncate sm:inline">
                ·{' '}
                {tSearch('attractionsOpen', {
                  open: result.attractionCounts.open,
                  total: result.attractionCounts.total,
                })}
              </span>
            )}

            {/* Parent Park for attractions */}
            {result.parentPark && (
              <span className="truncate">
                {tSearch('at', { park: stripNewPrefix(result.parentPark.name) })}
              </span>
            )}
          </div>

          {/* Right: Wait Time + Crowd + Distance */}
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

            {/* Park-wide average wait (nearby feed) — colored like every other wait time */}
            {result.type === 'park' && result.avgWaitTime != null && !isClosed ? (
              <Badge
                variant="outline"
                className={cn(
                  'text-[11px] font-semibold tabular-nums',
                  CROWD_OUTLINE_CLASS[waitTimeCrowdTier(result.avgWaitTime)]
                )}
              >
                {tSearch('avgWait', { minutes: result.avgWaitTime })}
              </Badge>
            ) : (
              result.type === 'park' &&
              result.load &&
              !isClosed && <CrowdLevelBadge level={result.load} className="text-[11px]" />
            )}

            {result.distanceM != null && (
              <span className="text-foreground/35 text-[11px] font-medium tabular-nums">
                {formatDistance(result.distanceM)}
              </span>
            )}
          </div>
        </div>
      </div>
    </CommandItem>
  );
}

interface GlossaryResultItemProps {
  item: GlossarySearchItem;
  onSelect: (item: GlossarySearchItem) => void;
}

/** A single glossary term result row (shared by the glossary-only and mixed-results branches). */
export function GlossaryResultItem({ item, onSelect }: GlossaryResultItemProps) {
  return (
    <CommandItem
      value={`${item.name} glossary`}
      onSelect={() => onSelect(item)}
      className="flex cursor-pointer items-center gap-2.5 sm:gap-4"
    >
      <div className="bg-foreground/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl">
        <BookOpen className="text-foreground/65 h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5">
        <span className="truncate text-sm leading-none font-semibold sm:text-[15px]">
          {item.name}
        </span>
        <span className="text-foreground/45 truncate text-xs">{item.shortDefinition}</span>
      </div>
    </CommandItem>
  );
}
