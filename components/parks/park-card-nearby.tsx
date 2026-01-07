import { Link } from '@/i18n/navigation';
import { Clock, TrendingUp, ChevronRight, Navigation, DoorOpen, Snowflake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { FavoriteStar } from '@/components/common/favorite-star';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { formatDistance } from '@/lib/utils/distance-utils';
import { useTranslations, useLocale } from 'next-intl';
import type { CrowdLevel } from '@/lib/api/types';

interface ParkCardNearbyProps {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
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
  todaySchedule?: {
    openingTime: string;
    closingTime: string;
    scheduleType: string;
  };
  nextSchedule?: {
    openingTime: string;
    closingTime: string;
    scheduleType: string;
  };
  backgroundImage?: string | null;
  url: string;
}

function getScheduleMessage(
  todaySchedule: ParkCardNearbyProps['todaySchedule'],
  nextSchedule: ParkCardNearbyProps['nextSchedule'],
  timezone: string,
  status: string,
  isInMaintenance: boolean,
  locale: string,
  t: ReturnType<typeof useTranslations<'nearby'>>,
  tCommon: ReturnType<typeof useTranslations<'common'>>
): { message: string; icon: 'opening' | 'closing' | 'offseason' } | null {
  // Don't show schedule for parks in maintenance
  if (isInMaintenance) {
    return null;
  }

  try {
    const now = new Date();

    // If today is OPERATING, show closing time
    if (status === 'OPERATING' && todaySchedule?.scheduleType === 'OPERATING') {
      const closing = new Date(todaySchedule.closingTime);
      const diff = closing.getTime() - now.getTime();
      if (diff <= 0) return null;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return {
          message: `${t('closesIn')} ${hours} ${tCommon('hours')}. ${minutes} Min.`,
          icon: 'closing',
        };
      }
      return { message: `${t('closesIn')} ${minutes} Min.`, icon: 'closing' };
    }

    // If park is closed today, check if we have today's opening time or next schedule
    if (status === 'CLOSED') {
      // Try today's opening time first
      if (todaySchedule?.scheduleType === 'OPERATING' && todaySchedule.openingTime) {
        const opening = new Date(todaySchedule.openingTime);
        const diff = opening.getTime() - now.getTime();

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          // < 24 hours: Show time with hours and minutes
          if (hours < 24) {
            const openingTimeFormatted = opening.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: timezone,
            });
            if (hours > 0) {
              return {
                message: `${openingTimeFormatted}${locale === 'de' ? ' Uhr' : ''} (in ${hours} ${tCommon('hours')}. ${minutes} Min.)`,
                icon: 'opening',
              };
            }
            return {
              message: `${openingTimeFormatted}${locale === 'de' ? ' Uhr' : ''} (in ${minutes} Min.)`,
              icon: 'opening',
            };
          }
        }
      }

      // Use nextSchedule if available and OPERATING
      if (nextSchedule?.scheduleType === 'OPERATING' && nextSchedule.openingTime) {
        const nextOpening = new Date(nextSchedule.openingTime);
        const diff = nextOpening.getTime() - now.getTime();

        if (diff > 0) {
          const totalHours = diff / (1000 * 60 * 60);
          const totalDays = diff / (1000 * 60 * 60 * 24);
          const totalWeeks = totalDays / 7;

          const openingTimeFormatted = nextOpening.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone,
          });

          // < 24 hours: "10:00 Uhr (in 2 Std. 10 Min.)"
          if (totalHours < 24) {
            const hours = Math.floor(totalHours);
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
              return {
                message: `${openingTimeFormatted}${locale === 'de' ? ' Uhr' : ''} (in ${hours} ${tCommon('hours')}. ${minutes} Min.)`,
                icon: 'opening',
              };
            }
            return {
              message: `${openingTimeFormatted}${locale === 'de' ? ' Uhr' : ''} (in ${minutes} Min.)`,
              icon: 'opening',
            };
          }
          // > 24 hours but < 7 days: "Mittwoch, 11:00 Uhr (in 1 Tag, 16 Std.)"
          else if (totalDays < 7) {
            const weekday = nextOpening.toLocaleDateString(locale, {
              weekday: 'long',
              timeZone: timezone,
            });
            const days = Math.floor(totalDays);
            const remainingHours = Math.floor(totalHours % 24);

            return {
              message: `${weekday}, ${openingTimeFormatted}${locale === 'de' ? ' Uhr' : ''} (in ${days} ${t('day', { count: days })}, ${remainingHours} ${tCommon('hours')}.)`,
              icon: 'opening',
            };
          }
          // > 7 days: "2. Mai - OffSeason (in 6 Wochen)"
          else {
            const dateFormatted = nextOpening.toLocaleDateString(locale, {
              day: 'numeric',
              month: 'long',
              timeZone: timezone,
            });
            const weeks = Math.ceil(totalWeeks);
            const scheduleLabel = nextSchedule.scheduleType || 'OffSeason';

            return {
              message: `${dateFormatted} - ${scheduleLabel} (in ${weeks} ${t('week', { count: weeks })})`,
              icon: 'opening',
            };
          }
        }
      }

      // If park is closed and no next schedule is available, show OffSeason
      if (!nextSchedule || nextSchedule.scheduleType !== 'OPERATING') {
        return {
          message: t('offseason'),
          icon: 'offseason',
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[ParkCardNearby] Error calculating schedule:', error);
    return null;
  }
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
    <Link href={url.replace('/v1/parks/', '/parks/')} className="group h-full">
      <article className="hover:border-primary/50 bg-card relative h-full overflow-hidden rounded-xl border py-4 transition-all hover:shadow-md md:py-6">
        {/* Background Image */}
        {backgroundImage && (
          <BackgroundOverlay imageSrc={backgroundImage} alt={name} intensity="medium" hoverEffect />
        )}

        {/* Favorite Star */}
        <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
          <FavoriteStar type="park" id={id} />
        </div>

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
                  className={`border-0 text-xs font-medium ${
                    isOpen
                      ? 'bg-green-600 text-white dark:bg-green-400 dark:text-slate-900'
                      : 'bg-red-600 text-white dark:bg-red-400 dark:text-slate-900'
                  }`}
                >
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
