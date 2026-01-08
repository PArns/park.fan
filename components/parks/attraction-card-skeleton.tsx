import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AttractionCardSkeleton() {
  return (
    <Card className="relative h-full overflow-hidden transition-colors">
      {/* Background Image Skeleton */}
      <div className="absolute inset-0">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Favorite Star Position Skeleton */}
      <div className="absolute top-2 right-2 z-20">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <CardContent className="relative z-10 flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <Skeleton className="h-5 w-3/4" />

            {/* Park Name (optional, for favorites) */}
            <Skeleton className="mt-1 h-3 w-1/2" />

            {/* Wait Time & Trend */}
            <div className="mt-1 flex items-baseline gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>

            {/* Queue Types */}
            <div className="mt-2 flex flex-wrap gap-1">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Peak Wait Time */}
            <Skeleton className="mt-1 h-3 w-32" />
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Status Badge */}
            <Skeleton className="h-6 w-20 rounded-full" />
            {/* Crowd Level Badge */}
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        {/* Distance (for favorites) */}
        <div className="mt-2 flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Sparkline */}
        <div className="mt-auto h-16 w-full pt-4">
          <Skeleton className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
