import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { Clock, CalendarCheck } from 'lucide-react';
import { stripNewPrefix } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { ParkRestaurant, ParkStatus } from '@/lib/api/types';

interface RestaurantCardProps {
  restaurant: ParkRestaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { id, name, cuisineType, status, waitTime, requiresReservation, operatingHours } =
    restaurant;
  const tCommon = useTranslations('common');

  const isOperating = status === 'OPERATING';

  return (
    <Card className="relative">
      <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
        <FavoriteStar type="restaurant" id={id} />
      </div>
      <CardContent className="p-4 pr-10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{stripNewPrefix(name)}</h3>
            {cuisineType && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {cuisineType}
              </Badge>
            )}
          </div>
          {status && <ParkStatusBadge status={status as ParkStatus} className="shrink-0" />}
        </div>

        {(isOperating || requiresReservation) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isOperating && waitTime !== null && waitTime !== undefined && (
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <Clock className="h-3.5 w-3.5" />
                {waitTime} {tCommon('minute', { count: waitTime })}
              </span>
            )}
            {requiresReservation && (
              <Badge variant="outline" className="text-xs">
                <CalendarCheck className="mr-1 h-3 w-3" />
                {tCommon('reservation')}
              </Badge>
            )}
          </div>
        )}

        {operatingHours && operatingHours.length > 0 && (
          <div className="text-muted-foreground mt-2 space-y-0.5 text-xs">
            {operatingHours.map((h, i) => (
              <div key={i}>
                {h.startTime}–{h.endTime}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
