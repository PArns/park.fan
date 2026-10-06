import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Placeholder in the shape of `RestaurantCard`: title, park name, cuisine badge and distance. */
export function RestaurantCardSkeleton() {
  return (
    <Card className="relative h-full overflow-hidden transition-all">
      <div className="absolute top-2 right-2 z-20">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-3/4" />

            <Skeleton className="mt-1 h-3 w-1/2" />

            <div className="mt-2">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="mt-0.5 h-4 w-4 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
