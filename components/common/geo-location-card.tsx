import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { IconContainer } from '@/components/common/icon-container';
import { cn } from '@/lib/utils';

interface GeoLocationCardProps {
  name: string;
  slug: string;
  href: string;
  openParkCount: number;
  totalParkCount: number;
  subtitle?: string; // e.g., "5 countries" for continents, "3 cities" for countries
  variant?: 'continent' | 'country' | 'city';
  className?: string;
}

export function GeoLocationCard({
  name,
  href,
  openParkCount,
  totalParkCount,
  subtitle,
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
                    {openParkCount} {t('open')}
                  </span>
                  <span className="text-muted-foreground">
                    / {totalParkCount} {tExplore('stats.park', { count: totalParkCount })}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="group-interactive-icon h-5 w-5" />
          </div>

          {/* Progress bar */}
          <OpenStatusProgress
            openCount={openParkCount}
            totalCount={totalParkCount}
            showLabel={false}
            className="mt-4"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
