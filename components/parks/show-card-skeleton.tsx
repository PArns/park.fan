import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ShowCardSkeleton() {
  return (
    <Card className="relative h-full transition-all">
      {/* Favorite Star Position Skeleton */}
      <div className="absolute top-2 right-2 z-20">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />

        {/* Park Name (optional, for favorites) */}
        <Skeleton className="mt-1 h-3 w-1/2" />

        {/* Distance (optional, for favorites) */}
        <div className="mt-2 flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Showtimes */}
        <div className="mt-2 flex flex-wrap gap-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Status Badge (optional) */}
        <div className="mt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
