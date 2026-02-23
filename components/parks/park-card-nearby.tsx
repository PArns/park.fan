import { Link } from '@/i18n/navigation';
import {
  Clock,
  TrendingUp,
  ChevronRight,
  Navigation,
  DoorOpen,
  Snowflake,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { FavoriteStar } from '@/components/common/favorite-star';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { formatDistance } from '@/lib/utils/distance-utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { useTranslations, useLocale } from 'next-intl';
import { getScheduleMessage } from '@/lib/utils/schedule-utils';
import type { CrowdLevel, ScheduleSummary } from '@/lib/api/types';

interface ParkCardNearbyProps {
  id: string;
  name: string;
  city: string;
  country: string;
  continent?: string; // For robust URL building
  distance: number;
  status: string;
  timezone: string;
  totalAttractions: number;
  operatingAttractions: number;
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    occupancy?: number;
  };
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  backgroundImage?: string | null;
  url: string;
  /** Show a "Nearest open" badge (homepage focus). */
  highlightAsNearestOpen?: boolean;
}

export function ParkCardNearby({
  id,
  name,
  city,
  country,
  distance,
  status,
  timezone,
  totalAttractions,
  operatingAttractions,
  analytics,
  todaySchedule,
  nextSchedule,
  backgroundImage,
  url,
  highlightAsNearestOpen = false,
}: ParkCardNearbyProps) {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const locale = useLocale();

  const isOpen = status === 'OPERATING';
  const isInMaintenance = status !== 'OPERATING' && status !== 'CLOSED';
  const scheduleInfo = getScheduleMessage(
    todaySchedule,
    nextSchedule,
    timezone,
    status,
    isInMaintenance,
    locale,
    t,
    tCommon
  );

  return (
    <Link
      href={convertApiUrlToFrontendUrl(url)}
      prefetch={status === 'OPERATING'} // Only prefetch open parks
      className="group h-full"
    >
      <article className="hover:border-primary/50 bg-card relative h-full overflow-hidden rounded-xl border py-4 transition-all hover:shadow-md md:py-6">
        {/* Background Image */}
        {backgroundImage && (
          <BackgroundOverlay imageSrc={backgroundImage} alt={name} intensity="medium" hoverEffect />
        )}

        {/* Favorite Star */}
        <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
          <FavoriteStar type="park" id={id} />
        </div>
        {/* Nearest open park badge (homepage focus) */}
        {highlightAsNearestOpen && isOpen && (
          <div className="absolute top-2 left-2 z-20">
            <Badge className="bg-primary text-primary-foreground border-0 text-xs font-medium shadow-md">
              {t('nearestOpenBadge')}
            </Badge>
          </div>
        )}

        <div className="relative z-10 flex h-full flex-col p-3 md:p-4">
          <div className="bg-background/20 flex flex-1 flex-col justify-between rounded-xl p-3 shadow-sm backdrop-blur-md md:p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="group-hover:text-primary line-clamp-2 text-base font-semibold transition-colors">
                  {name}
                </h3>
                <ChevronRight className="text-muted-foreground group-hover:text-primary mt-0.5 h-4 w-4 flex-shrink-0 transition-colors" />
              </div>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {city},{' '}
                {(() => {
                  // Normalize country name: lowercase and replace spaces with hyphens
                  const normalizedCountry = country.toLowerCase().replace(/\s+/g, '-');
                  const translated = tGeo(`countries.${normalizedCountry}` as string);
                  // If translation key doesn't exist, return original country name
                  return translated !== `countries.${normalizedCountry}` ? translated : country;
                })()}
              </p>
            </div>

            <div className="mt-3 flex flex-1 flex-col justify-end space-y-2 md:space-y-3">
              {/* Distance + Status */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Navigation className="h-4 w-4" />
                  <span className="font-medium">{formatDistance(distance)}</span>
                </div>
                <Badge
                  className={cn(
                    'border-0 text-xs font-medium text-white dark:text-slate-900',
                    isOpen
                      ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-400'
                      : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-400'
                  )}
                >
                  {isOpen ? (
                    <Clock className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {isOpen ? tCommon('open') : tCommon('closed')}
                </Badge>
              </div>

              <div className="min-h-[4.5rem] space-y-2 md:space-y-3">
                {/* Wait Time + Crowd Level (only for open parks) */}
                {isOpen && analytics ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    {analytics.avgWaitTime !== undefined && analytics.avgWaitTime > 0 && (
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {analytics.avgWaitTime}{' '}
                          {tCommon('minute', { count: analytics.avgWaitTime })}
                        </span>
                      </div>
                    )}
                    {analytics.crowdLevel && (
                      <CrowdLevelBadge
                        level={analytics.crowdLevel as CrowdLevel}
                        className="text-xs"
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-5" /> /* Spacer for closed parks */
                )}

                {/* Attractions (only for open parks) */}
                {isOpen ? (
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
                  <div className="h-5" /> /* Spacer for closed parks */
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
                    {scheduleInfo.icon === 'opening' ? `${t('opens')}: ` : ''}
                    {scheduleInfo.message}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
