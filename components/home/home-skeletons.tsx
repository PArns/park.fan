import { Skeleton } from '@/components/ui/skeleton';
import {
  FeaturedParksHeading,
  type FeaturedParksLabels,
  GlobalStatsHeading,
  LiveActivityHeading,
  PlatformStatsHeading,
  type SectionHeadingLabels,
} from '@/components/home/section-headings';
import { STORY_SECTION, STORY_SECTION_TINTED } from '@/components/home/story/section-chrome';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AttractionCardSkeleton } from '@/components/parks/attraction-card-skeleton';
import { cn } from '@/lib/utils';

/**
 * Suspense fallbacks for the homepage's data-dependent sections. Each mirrors its section's outer
 * structure and the real card heights, so the streamed content swaps in without moving the
 * sections below.
 */

/** Mirrors <StatsCard>: title line, large value, description. */
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="mt-1.5 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

/** A park/attraction row: small heading above a card, in the same subgrid the page uses. */
function StatCardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid [grid-template-rows:auto_1fr] gap-4">
      <Skeleton className="h-4 w-28" />
      {children}
    </div>
  );
}

/**
 * Suspense fallback for the homepage's global and platform stats sections: the real headings over
 * stat, park and ride card skeletons sized like the cards they stand in for.
 */
export function GlobalStatsSkeleton({ labels }: { labels: SectionHeadingLabels }) {
  return (
    <>
      <section className={STORY_SECTION_TINTED}>
        <div className="container mx-auto">
          {/* The real heading, not blocks shaped like one: it needs no data, and its height moves
              with how title and hint wrap per locale and breakpoint. */}
          <GlobalStatsHeading labels={labels} />
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          <div className="mb-3 grid gap-4 sm:grid-cols-2">
            {/* No photo row: the parks with a picture never reach either end of a wait-time
                ranking, so the real cards have none. */}
            <StatCardRow>
              <ParkCardNearbySkeleton withPhoto={false} />
            </StatCardRow>
            <StatCardRow>
              <ParkCardNearbySkeleton withPhoto={false} />
            </StatCardRow>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* `stat`: these cards are built from a few stat fields, so the real card is shorter
                than an attractions-tab card; see the skeleton's docblock. */}
            <StatCardRow>
              <AttractionCardSkeleton variant="stat" />
            </StatCardRow>
            <StatCardRow>
              <AttractionCardSkeleton variant="stat" />
            </StatCardRow>
          </div>
        </div>
      </section>

      <section className={STORY_SECTION}>
        <div className="container mx-auto">
          <PlatformStatsHeading labels={labels} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        </div>
      </section>
    </>
  );
}

/** `className` is the one `FeaturedParksSlot` gets, so the band's padding is the same box. */
export function FeaturedParksSkeleton({
  className,
  labels,
  heading = 'watermark',
}: {
  className?: string;
  labels: FeaturedParksLabels;
  heading?: 'watermark' | 'tile';
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
      </div>
    </section>
  );
}

/**
 * Suspense fallback for the homepage's live activity section: the real heading over five continent
 * card skeletons.
 */
export function LiveActivitySkeleton({ labels }: { labels: SectionHeadingLabels }) {
  return (
    <section className={STORY_SECTION_TINTED}>
      <div className="container mx-auto">
        <LiveActivityHeading labels={labels} />
        {/* Five cards, one per continent the discovery endpoint lists; a sixth would reserve a
            card's height the page loses on a phone when the grid lands. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-muted/50">
              <CardHeader className="pb-2">
                {/* h-7 and h-9 are the line boxes of the real `text-lg` title and `text-3xl`
                    count. */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="mt-1 h-3 w-16" />
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-baseline gap-2">
                  <Skeleton className="h-9 w-12" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
