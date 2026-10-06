import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Placeholder for one `<ParkCard>`, at the height the real card measures: a 100 px row below `sm`,
 * a 365 px card above it.
 *
 * On desktop the photo row is a bet, so `withPhoto` decides: `ParkCard` takes that `min-h` only
 * with a background image, few parks have one, and one photo in the grid makes every track tall.
 * Default `true`, because for the nearby list the answer is unknown at render time and dropping the
 * row costs most for readers near the parks that do have photos. Re-measure with
 * `pnpm measure:cls --ip=<addr>` before changing it.
 *
 * Pass `withPhoto={false}` only where the data settles it, as in the busiest and quietest park
 * rows, which no photo park reaches.
 */
export function ParkCardNearbySkeleton({ withPhoto = true }: { withPhoto?: boolean }) {
  return (
    <>
      {/* Below `sm` the card is a row (see `ParkCard`) built from the same four lines, 100 px in
          all. No thumbnail: at 40 px it never sets the row's height. */}
      <div className="bg-card border-border/60 rounded-xl border p-2 sm:hidden">
        <Skeleton className="h-[18px] w-40 max-w-[70%]" />
        <Skeleton className="mt-0.5 h-4 w-28 opacity-60" />
        <div className="mt-1 flex gap-1.5">
          <Skeleton className="h-[22px] w-20 rounded-full opacity-60" />
          <Skeleton className="h-[22px] w-16 rounded-full opacity-40" />
        </div>
        <Skeleton className="mt-1 h-4 w-24 opacity-40" />
      </div>
      <ParkCardSkeletonPanels withPhoto={withPhoto} />
    </>
  );
}

function ParkCardSkeletonPanels({ withPhoto }: { withPhoto: boolean }) {
  return (
    <article className="relative hidden flex-col overflow-hidden rounded-[20px] border border-white/10 sm:flex">
      <div className="absolute inset-0 z-0">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <div className="absolute top-3 right-3 z-[4]">
        <Skeleton className="h-[34px] w-[34px] rounded-full" />
      </div>

      {/* Top panel — name, city line, status chips: 28 px padding + 20 + 3 + 18 + 9 + 22 */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3.5">
        <Skeleton className="h-5 w-36 max-w-[80%] opacity-60" />
        <Skeleton className="mt-[3px] h-[18px] w-24 opacity-40" />
        <div className="mt-[9px] flex gap-1.5">
          <Skeleton className="h-[22px] w-20 rounded-full opacity-60" />
          <Skeleton className="h-[22px] w-16 rounded-full opacity-40" />
        </div>
      </div>

      <div className={cn('relative z-[2] flex-1', withPhoto && 'sm:min-h-[220px]')} />

      {/* Bottom panel — one line: 28 px padding + 17 */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3.5">
        <Skeleton className="h-[17px] w-40 max-w-[70%] opacity-50" />
      </div>
    </article>
  );
}
