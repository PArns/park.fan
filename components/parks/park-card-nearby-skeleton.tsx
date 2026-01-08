import { Skeleton } from '@/components/ui/skeleton';

export function ParkCardNearbySkeleton() {
  return (
    <article className="bg-card relative h-full overflow-hidden rounded-xl border py-4 md:py-6">
      {/* Background Image Skeleton */}
      <div className="absolute inset-0">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Favorite Star Position Skeleton */}
      <div className="absolute top-2 right-2 z-20">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <div className="relative z-10 flex h-full flex-col p-3 md:p-4">
        <div className="bg-background/20 flex flex-1 flex-col justify-between rounded-xl p-3 shadow-sm backdrop-blur-md md:p-4">
          <div>
            {/* Title and Chevron */}
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-0.5 h-4 w-4 flex-shrink-0" />
            </div>
            {/* City, Country */}
            <Skeleton className="mt-1 h-3 w-2/3" />
          </div>

          <div className="mt-3 flex flex-1 flex-col justify-end space-y-2 md:space-y-3">
            {/* Distance + Status */}
            <div className="flex items-center justify-between text-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <div className="min-h-[4.5rem] space-y-2 md:space-y-3">
              {/* Wait Time + Crowd Level */}
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>

              {/* Attractions */}
              <div className="flex items-center justify-between pt-0.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Schedule (optional, sometimes shown) */}
            <div className="border-border/50 mt-2 flex items-center gap-1.5 border-t pt-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
