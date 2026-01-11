import { Link } from '@/i18n/navigation';
import { Clock, TrendingUp, ChevronRight, Navigation, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { FavoriteStar } from '@/components/common/favorite-star';
import { cn } from '@/lib/utils';
import type { ParkStatus, CrowdLevel } from '@/lib/api/types';
import { useTranslations } from 'next-intl';

interface ParkCardProps {
  name: string;
  slug: string;
  city: string;
  country: string;
  href: string;
  status?: ParkStatus;
  crowdLevel?: CrowdLevel;
  averageWaitTime?: number;
  operatingAttractions?: number;
  totalAttractions?: number;
  variant?: 'compact' | 'detailed' | 'hero';
  showBackground?: boolean;
  distance?: string; // Optional distance
  className?: string;
  parkId?: string; // UUID for favorites
  backgroundImage?: string | null; // Optional background image URL (to avoid fs in client)
}

export function ParkCard({
  name,
  slug,
  city,
  country,
  href,
  status,
  crowdLevel,
  averageWaitTime,
  operatingAttractions,
  totalAttractions,
  variant = 'detailed',
  showBackground = true,
  distance,
  className,
  parkId,
  backgroundImage: propBackgroundImage,
}: ParkCardProps) {
  const tCommon = useTranslations('common');
  // Use provided backgroundImage or fallback to getParkBackgroundImage (server-side only)
  let backgroundImage: string | null = null;
  if (propBackgroundImage !== undefined) {
    // Use provided backgroundImage (from API/proxy)
    backgroundImage = propBackgroundImage;
  } else if (showBackground) {
    // Only call getParkBackgroundImage on server-side to avoid fs in client bundle
    if (typeof window === 'undefined') {
      // Dynamic import to prevent fs from being bundled in client
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getParkBackgroundImage } = require('@/lib/utils/park-assets');
      backgroundImage = getParkBackgroundImage(slug);
    }
  }
  const isOpen = status === 'OPERATING';

  return (
    <Link href={href as '/europe/germany/rust/europa-park'} className="group h-full">
      <Card className={cn('interactive-card relative h-full overflow-hidden', className)}>
        {/* Background Image */}
        {backgroundImage && <BackgroundOverlay imageSrc={backgroundImage} alt={name} hoverEffect />}

        {/* Favorite Star */}
        {parkId && (
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            <FavoriteStar type="park" id={parkId} />
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
                <span>{city}</span>, <span>{country}</span>
              </address>
            </div>

            {/* Stats section */}
            <div className="mt-3 flex flex-1 flex-col justify-end space-y-2 md:space-y-3">
              {/* Distance + Status Badge (matching NearbyParksCard) */}
              <div className="flex items-center justify-between text-sm">
                {distance ? (
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Navigation className="h-4 w-4" />
                    <span className="font-medium">{distance}</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs">
                    {variant === 'hero' ? 'Featured' : city}
                  </div>
                )}

                {status && (
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
                )}
              </div>

              {/* Wait Time + Crowd Level (matching NearbyParksCard layout) */}
              <div className="min-h-[4.5rem] space-y-2 md:space-y-3">
                {isOpen && (averageWaitTime !== undefined || crowdLevel) ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    {averageWaitTime !== undefined && averageWaitTime > 0 && (
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {averageWaitTime} {tCommon('minute', { count: averageWaitTime })}
                        </span>
                      </div>
                    )}
                    {crowdLevel && <CrowdLevelBadge level={crowdLevel} className="text-xs" />}
                  </div>
                ) : (
                  <div className="h-5" /> /* Spacer for closed parks */
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
                  <div className="h-5" /> /* Spacer for closed parks */
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
