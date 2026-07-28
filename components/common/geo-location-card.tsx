import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { IconContainer } from '@/components/common/icon-container';
import { NearestParkDistance } from '@/components/common/park-distance';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Coordinate } from '@/lib/utils/distance-utils';

interface GeoLocationCardProps {
  name: string;
  slug: string;
  href: string;
  /** Live open-park count. `undefined` = not yet loaded (client overlay) → renders a skeleton. */
  openParkCount?: number;
  totalParkCount: number;
  subtitle?: string; // e.g., "5 countries" for continents, "3 cities" for countries
  /** Positions of the parks in this region — renders "X km to the nearest park" once the
   *  visitor's location is known. Omit to leave the card distance-free. */
  parkCoordinates?: readonly Coordinate[];
  variant?: 'continent' | 'country' | 'city';
  className?: string;
}

export function GeoLocationCard({
  name,
  href,
  openParkCount,
  totalParkCount,
  subtitle,
  parkCoordinates,
  className,
}: GeoLocationCardProps) {
  const t = useTranslations('common');
  const tExplore = useTranslations('explore');

  return (
    <Link href={href as '/parks/europe'} prefetch={false} className="interactive-link">
      <Card className={cn('interactive-card h-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <IconContainer icon={MapPin} size="md" variant="primary" />
              <div>
                <h3 className="group-interactive-text font-semibold">{name}</h3>
                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="text-park-primary font-medium">
                    {openParkCount === undefined ? (
                      <Skeleton as="span" className="inline-block h-4 w-5 align-middle" />
                    ) : (
                      openParkCount
                    )}{' '}
                    {t('open')}
                  </span>
                  <span className="text-muted-foreground">
                    / {totalParkCount} {tExplore('stats.park', { count: totalParkCount })}
                  </span>
                </div>
                {/* "X km to the nearest park" — appears once the visitor's position resolves. */}
                <NearestParkDistance coordinates={parkCoordinates} className="mt-1" />
              </div>
            </div>
            <ChevronRight className="group-interactive-icon h-5 w-5" />
          </div>

          {/* Progress bar — muted placeholder until the live count loads */}
          <OpenStatusProgress
            openCount={openParkCount ?? 0}
            totalCount={totalParkCount}
            showLabel={false}
            className={cn('mt-4', openParkCount === undefined && 'opacity-40')}
          />
        </CardContent>
      </Card>
    </Link>
  );
}
