import { Skeleton } from '@/components/ui/skeleton';
import { FeaturedParksHeading, type FeaturedParksLabels } from '@/components/home/section-headings';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { cn } from '@/lib/utils';

/**
 * The Suspense fallback of the homepage's one streamed section, the popular parks, also used under
 * blog, news and glossary pages. It mirrors the section's outer structure and the real card
 * heights, so the streamed content swaps in without moving the sections below.
 */

/** `className` is the one `FeaturedParksSlot` gets, so the band's padding is the same box. */
export function FeaturedParksSkeleton({
  className,
  labels,
  heading = 'watermark',
  children,
}: {
  className?: string;
  labels: FeaturedParksLabels;
  heading?: 'watermark' | 'tile';
  /** What `FeaturedParksSlot` gets as `children`, drawn here too, so the section keeps its height. */
  children?: React.ReactNode;
}) {
  return (
    <section className={cn('px-4 py-12', className)}>
      <div className="container mx-auto">
        {/* The real heading, not grey bars shaped like one: it needs no data, and its height
            moves with how title and intro wrap per locale and breakpoint. */}
        <FeaturedParksHeading labels={labels} variant={heading} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ParkCardNearbySkeleton key={i} />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          {/* The live CTA is a `text-sm` link: a 20 px line, not 16. */}
          <Skeleton className="h-5 w-32" />
        </div>
        {children}
      </div>
    </section>
  );
}
