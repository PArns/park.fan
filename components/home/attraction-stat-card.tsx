import { Link } from '@/i18n/navigation';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CrowdLevel } from '@/lib/api/types';

interface AttractionStatCardProps {
  label: string;
  /** 'high' renders a red wait-time badge, 'low' renders a green one */
  variant: 'high' | 'low';
  attraction: {
    id?: string;
    name: string;
    parkName: string;
    parkCity: string;
    countryName: string;
    url: string;
    waitTime: number;
    crowdLevel: CrowdLevel | null;
  };
}

export function AttractionStatCard({ label, variant, attraction }: AttractionStatCardProps) {
  const tCommon = useTranslations('common');

  return (
    <Link href={attraction.url} prefetch={false} className="group block min-w-0">
      <Card className="hover:border-primary/50 relative h-full pt-5 transition-all hover:shadow-lg">
        {attraction.id && (
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            <FavoriteStar type="attraction" id={attraction.id} />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="group-hover:text-primary mb-1 truncate text-lg font-semibold transition-colors">
            {attraction.name}
          </div>
          <p className="text-muted-foreground mb-2 truncate text-xs">
            {attraction.parkName} · {attraction.parkCity}, {attraction.countryName}
          </p>
          <div className="flex items-center gap-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <Badge
              variant="secondary"
              className={cn(
                variant === 'high'
                  ? 'bg-status-down/20 text-status-down'
                  : 'bg-status-operating/20 text-status-operating'
              )}
            >
              {attraction.waitTime} {tCommon('minutes')}
            </Badge>
            {attraction.crowdLevel && (
              <CrowdLevelBadge level={attraction.crowdLevel} className="h-5 px-1.5 text-[10px]" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
