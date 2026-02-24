import { Link } from '@/i18n/navigation';
import { Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { useTranslations } from 'next-intl';
import type { CrowdLevel } from '@/lib/api/types';

interface ParkStatCardProps {
  label: string;
  park: {
    id?: string;
    name: string;
    city: string;
    countryName: string;
    url: string;
    averageWaitTime?: number | null;
    crowdLevel?: CrowdLevel | null;
    operatingAttractions?: number | null;
    totalAttractions?: number | null;
  };
}

export function ParkStatCard({ label, park }: ParkStatCardProps) {
  const tCommon = useTranslations('common');

  return (
    <Link href={park.url} prefetch={false} className="group block min-w-0">
      <Card className="hover:border-primary/50 relative h-full pt-5 transition-all hover:shadow-lg">
        {park.id && (
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            <FavoriteStar type="park" id={park.id} />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="group-hover:text-primary mb-1 truncate text-lg font-semibold transition-colors">
            {park.name}
          </div>
          <p className="text-muted-foreground mb-2 truncate text-xs">
            {park.city}, {park.countryName}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {park.averageWaitTime != null && park.averageWaitTime > 0 && (
                <>
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <Badge variant="secondary">
                    {park.averageWaitTime} {tCommon('minutes')}
                  </Badge>
                </>
              )}
              {park.crowdLevel && (
                <CrowdLevelBadge level={park.crowdLevel} className="h-5 px-1.5 text-[10px]" />
              )}
            </div>
            {park.operatingAttractions != null && park.totalAttractions != null && (
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3" />
                <span>
                  {park.operatingAttractions}/{park.totalAttractions} {tCommon('operating')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
