import { Link } from '@/i18n/navigation';
import { Clock, TrendingUp, ChevronRight, DoorOpen, Snowflake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { WaitTimeBadge } from '@/components/parks/wait-time-badge';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { DistanceBadge } from '@/components/common/distance-badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { cn } from '@/lib/utils';
import type { ParkStatus, CrowdLevel } from '@/lib/api/types';
import { useTranslations, useLocale } from 'next-intl';

// Lazily loaded server-side only — avoids bundling `fs` into the client
/* eslint-disable @typescript-eslint/no-require-imports */
const serverAssets =
  typeof window === 'undefined'
    ? (require('@/lib/utils/park-assets') as {
        getParkBackgroundImage: (slug: string) => string | null;
      })
    : null;
/* eslint-enable @typescript-eslint/no-require-imports */
import { getScheduleMessage } from '@/lib/utils/schedule-utils';
import type { ScheduleSummary } from '@/lib/api/types';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';

interface ParkCardProps {
  name: string;
  slug: string;
  city: string;
  country: string;
  /** Direct frontend URL. Optional when `url` is provided. */
  href?: string;
  /** API URL (e.g. /v1/parks/…) — auto-converted to a frontend URL. */
  url?: string;
  status?: ParkStatus;
  crowdLevel?: CrowdLevel;
  averageWaitTime?: number;
  /** Analytics object — alternative to averageWaitTime + crowdLevel as direct props. */
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    occupancy?: number;
  };
  operatingAttractions?: number;
  totalAttractions?: number;
  variant?: 'compact' | 'detailed' | 'hero';
  showBackground?: boolean;
  /** Distance as a number (meters, auto-formatted) or pre-formatted string. */
  distance?: number | string;
  className?: string;
  /** Park UUID for the favorites star. */
  parkId?: string;
  /** Alias for parkId — accepted for callers using the nearby/favorites data shape. */
  id?: string;
  backgroundImage?: string | null;
  timezone?: string;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  hasOperatingSchedule?: boolean;
  /** Show a "Nearest open" badge. Only rendered when the park is OPERATING. */
  highlightAsNearestOpen?: boolean;
  /** Translate the raw country name via geo translations (for nearby/favorites data). */
  translateCountry?: boolean;
  /** Accepted for API-shape compatibility — not used in rendering. */
  continent?: string;
}

export function ParkCard({
  name,
  slug,
  city,
  country,
  href,
  url,
  status,
  crowdLevel,
  averageWaitTime,
  analytics,
  operatingAttractions,
  totalAttractions,
  variant = 'detailed',
  showBackground = true,
  distance,
  className,
  parkId,
  id,
  backgroundImage: propBackgroundImage,
  timezone,
  todaySchedule,
  nextSchedule,
  hasOperatingSchedule = true,
  highlightAsNearestOpen = false,
  translateCountry = false,
  continent: _continent,
}: ParkCardProps) {
  const tCommon = useTranslations('common');
  const tNearby = useTranslations('nearby');
  const tGeo = useTranslations('geo');
  const locale = useLocale();

  // Resolve href: use direct href, or convert API url, falling back to root
  const effectiveHref = href ?? (url ? convertApiUrlToFrontendUrl(url) : '/');

  // Resolve park UUID for favorites star
  const effectiveParkId = parkId ?? id;

  // Resolve wait time + crowd level — accept both direct props and analytics object
  const effectiveWaitTime = averageWaitTime ?? analytics?.avgWaitTime;
  const effectiveCrowdLevel = crowdLevel ?? (analytics?.crowdLevel as CrowdLevel | undefined);

  // Optionally translate raw country name (e.g. "Germany" → locale-specific label)
  const displayCountry = translateCountry
    ? (() => {
        const normalized = country.toLowerCase().replace(/\s+/g, '-');
        const translated = tGeo(`countries.${normalized}` as string);
        return translated !== `countries.${normalized}` ? translated : country;
      })()
    : country;

  // Use provided backgroundImage or fallback to getParkBackgroundImage (server-side only)
  let backgroundImage: string | null = null;
  if (propBackgroundImage !== undefined) {
    backgroundImage = propBackgroundImage;
  } else if (showBackground && serverAssets) {
    backgroundImage = serverAssets.getParkBackgroundImage(slug);
  }

  const isOpen = status === 'OPERATING';
  const isOperatingOrUnknown = status === 'OPERATING' || status === 'UNKNOWN';
  const isInMaintenance =
    !!status && status !== 'OPERATING' && status !== 'CLOSED' && status !== 'UNKNOWN';
  const scheduleInfo = getScheduleMessage(
    todaySchedule,
    nextSchedule,
    timezone,
    status,
    isInMaintenance,
    locale,
    tNearby,
    tCommon,
    hasOperatingSchedule
  );

  return (
    <Link
      href={effectiveHref as '/europe/germany/rust/europa-park'}
      prefetch={isOperatingOrUnknown}
      className="group h-full"
    >
      <Card className={cn('interactive-card relative h-full overflow-hidden', className)}>
        {/* Background Image */}
        {backgroundImage && <BackgroundOverlay imageSrc={backgroundImage} alt={name} hoverEffect />}

        {/* Nearest open park badge */}
        {highlightAsNearestOpen && isOpen && (
          <div className="absolute top-2 left-2 z-20">
            <Badge className="bg-primary text-primary-foreground border-0 text-xs font-medium shadow-md">
              {tNearby('nearestOpenBadge')}
            </Badge>
          </div>
        )}

        {/* Favorite Star */}
        {effectiveParkId && (
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            <FavoriteStar type="park" id={effectiveParkId} name={name} />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-3 md:p-4">
          <div className="bg-background/20 flex flex-1 flex-col justify-between rounded-xl p-3 shadow-sm backdrop-blur-md md:p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="group-interactive-text line-clamp-2 text-base font-semibold">
                  {name}
                </h3>
                <ChevronRight className="group-interactive-icon mt-0.5 h-4 w-4 flex-shrink-0" />
              </div>
              <address className="text-muted-foreground mt-1 truncate text-xs not-italic">
                <span>{city}</span>, <span>{displayCountry}</span>
              </address>
            </div>

            {/* Stats section */}
            <div className="mt-3 flex flex-1 flex-col justify-end space-y-2 md:space-y-3">
              {/* Distance + Status Badge */}
              <div className="flex items-center justify-between text-sm">
                {distance != null ? (
                  <DistanceBadge distance={distance} size="md" />
                ) : (
                  <div className="text-muted-foreground text-xs">
                    {variant === 'hero' ? 'Featured' : city}
                  </div>
                )}

                {status && <ParkStatusBadge status={status} />}
              </div>

              {/* Wait Time + Crowd Level */}
              <div className="min-h-[4.5rem] space-y-2 md:space-y-3">
                {isOperatingOrUnknown && (effectiveWaitTime !== undefined || effectiveCrowdLevel) ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    {effectiveWaitTime !== undefined && effectiveWaitTime > 0 && (
                      <WaitTimeBadge waitTime={effectiveWaitTime} size="sm" />
                    )}
                    {effectiveCrowdLevel && (
                      <CrowdLevelBadge level={effectiveCrowdLevel} className="text-xs" />
                    )}
                  </div>
                ) : (
                  <div className="h-5" />
                )}

                {/* Operating Attractions */}
                {isOpen && operatingAttractions !== undefined && totalAttractions !== undefined ? (
                  <div className="flex items-center justify-between pt-0.5 text-sm">
                    <div className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        {operatingAttractions}/{totalAttractions}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">{tCommon('operating')}</span>
                  </div>
                ) : (
                  <div className="h-5" />
                )}
              </div>

              {/* Park Schedule */}
              {scheduleInfo && (
                <div className="text-muted-foreground border-border/50 mt-2 flex items-center gap-1.5 border-t pt-2 text-xs">
                  {scheduleInfo.icon === 'opening' ? (
                    <DoorOpen className="h-3.5 w-3.5" />
                  ) : scheduleInfo.icon === 'offseason' ? (
                    <Snowflake className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {scheduleInfo.icon === 'opening' ? `${tNearby('opens')}: ` : ''}
                    {scheduleInfo.icon === 'offseason' ? (
                      <>
                        <GlossaryTermLink termId="offseason" tooltipOnly>
                          {tNearby('offseason')}
                        </GlossaryTermLink>
                        {scheduleInfo.offseasonDetails}
                      </>
                    ) : (
                      scheduleInfo.message
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
