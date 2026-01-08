import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RestaurantCardSkeleton() {
  return (
    <Card className="relative h-full overflow-hidden transition-all">
      {/* Favorite Star Position Skeleton */}
      <div className="absolute top-2 right-2 z-20">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <Skeleton className="h-5 w-3/4" />

            {/* Park Name */}
            <Skeleton className="mt-1 h-3 w-1/2" />

            {/* Cuisine Type Badge */}
            <div className="mt-2">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Distance */}
            <div className="mt-2 flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          {/* Chevron */}
          <Skeleton className="mt-0.5 h-4 w-4 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
