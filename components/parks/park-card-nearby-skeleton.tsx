import { Skeleton } from '@/components/ui/skeleton';

export function ParkCardNearbySkeleton() {
  return (
    <article className="relative flex min-h-[340px] flex-col overflow-hidden rounded-[20px] border border-white/10">
      {/* Full-bleed photo skeleton */}
      <div className="absolute inset-0 z-0">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Fav button skeleton */}
      <div className="absolute top-3 right-3 z-[4]">
        <Skeleton className="h-[34px] w-[34px] rounded-full" />
      </div>

      {/* Top panel skeleton */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-[15px] w-[15px] rounded opacity-60" />
          <Skeleton className="h-4 w-36 opacity-60" />
        </div>
        <Skeleton className="mt-2 h-3 w-24 opacity-40" />
        <div className="mt-2.5 flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full opacity-60" />
          <Skeleton className="h-5 w-16 rounded-full opacity-40" />
        </div>
      </div>

      {/* Spacer */}
      <div className="relative z-[2] min-h-[60px] flex-1" />

      {/* Footer panel skeleton */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <Skeleton className="h-3 w-20 opacity-40" />
          <div className="text-right">
            <Skeleton className="h-9 w-12 opacity-60" />
            <Skeleton className="mt-1 h-2.5 w-16 opacity-40" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2.5">
          <Skeleton className="h-3 w-24 opacity-40" />
          <Skeleton className="h-3 w-16 opacity-40" />
          <Skeleton className="h-3 w-12 opacity-40" />
        </div>
      </div>
    </article>
  );
}
