import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Placeholder in the shape of `ShowCard`: title, park name, distance, three showtime chips and a status badge. */
export function ShowCardSkeleton() {
  return (
    <Card className="relative h-full transition-all">
      <div className="absolute top-2 right-2 z-20">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4" />

        <Skeleton className="mt-1 h-3 w-1/2" />

        <div className="mt-2 flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5" />
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <div className="mt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
