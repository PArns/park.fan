import { Skeleton } from '@/components/ui/skeleton';
import {
  GlobalStatsHeading,
  LiveActivityHeading,
  PlatformStatsHeading,
  type SectionHeadingLabels,
} from '@/components/home/section-headings';
import { STORY_SECTION, STORY_SECTION_TINTED } from '@/components/home/story/section-chrome';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AttractionCardSkeleton } from '@/components/parks/attraction-card-skeleton';

/**
 * Suspense fallbacks for the homepage's data-dependent sections.
 *
 * Each skeleton mirrors the real section's outer structure (section padding,
 * heading block, grid columns) and reuses the real card min-heights so the
 * streamed/hydrated content swaps in without shifting the sections below it
 * (minimal CLS). Pure, data-free Server Components rendered into the shell.
 */

/**
 * Icon + title line + intro line — matches the `mb-2 / mb-8` header that the global-stats,
 * platform-stats and ML sections share.
 *
 * The heights are the real ones: a `text-xl` title is a 28 px line, not 24, and the intro is a
 * 20 px `<p>`, not a 16 px block. The tag matters as much as the height — a diff of first paint
 * against settled pairs children by tag, and a `<div>` standing in for a `<p>` makes the two
 * lists line up one place out, which reports the section's grid as a several-hundred-pixel
 * insertion.
 */
function SectionHeaderSkeleton() {
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-7 w-48 max-w-[60%]" />
      </div>
      <p className="mb-8">
        <Skeleton as="span" className="block h-5 w-72 max-w-full" />
      </p>
    </>
  );
}

/** Mirrors <StatsCard>: title line + large value + description. (~116px tall) */
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

export function GlobalStatsSkeleton({ labels }: { labels: SectionHeadingLabels }) {
  return (
    <>
      {/* Global Stats */}
      <section className={STORY_SECTION_TINTED}>
        <div className="container mx-auto">
          {/* The REAL heading, not blocks shaped like one. It needs no data, and
              since it became a `ChapterHeading` tile its height moves with how
              the title and hint wrap — per locale, per breakpoint. A sized
              placeholder cannot follow that; this node follows it by being it. */}
          <GlobalStatsHeading labels={labels} />
          {/* Row 1: two stat cards */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          {/* Row 2: most/least crowded parks */}
          <div className="mb-3 grid gap-4 sm:grid-cols-2">
            {/* No photo row: these two are the ends of a wait-time ranking, and the nine
                parks that have a picture never reach either end (Phantasialand, the best
                placed of them, sits 10th). Reserving it cost 221 px per card against a
                measured 145.64 px. */}
            <StatCardRow>
              <ParkCardNearbySkeleton withPhoto={false} />
            </StatCardRow>
            <StatCardRow>
              <ParkCardNearbySkeleton withPhoto={false} />
            </StatCardRow>
          </div>
          {/* Row 3: longest/shortest wait rides */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCardRow>
              <AttractionCardSkeleton />
            </StatCardRow>
            <StatCardRow>
              <AttractionCardSkeleton />
            </StatCardRow>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
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

export function FeaturedParksSkeleton() {
  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        {/* This one section heads itself with a frosted pill instead of the bare row the
            others use (see FeaturedParksSlot), and the pill is 76 px against the row's 40.
            One child, same nesting, same height. */}
        <div className="bg-background/70 mb-8 w-fit rounded-xl px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-7 w-44 max-w-[60%]" />
          </div>
          <Skeleton className="mt-1 h-5 w-64 max-w-full" />
        </div>
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

export function MLStatsSkeleton() {
  return (
    <section className="bg-muted/30 px-4 py-14">
      <div className="container mx-auto">
        <SectionHeaderSkeleton />
        {/* Featured accuracy card + 2×2 stats grid */}
        <div className="mb-10 grid gap-4 lg:grid-cols-2">
          <Card className="min-h-[340px] py-0">
            <CardContent className="flex flex-col p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-16 w-48" />
              <Skeleton className="mt-2 h-3 w-56 max-w-full" />
              <Skeleton className="mt-4 h-[120px] w-full" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 content-start gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="py-0">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-3 h-8 w-16" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        {/* Bottom: two-column detail block */}
        <div className="grid gap-8 border-t pt-10 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </section>
  );
}

export function LiveActivitySkeleton({ labels }: { labels: SectionHeadingLabels }) {
  return (
    <section className={STORY_SECTION_TINTED}>
      <div className="container mx-auto">
        <LiveActivityHeading labels={labels} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="mt-1 h-3 w-16" />
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-baseline gap-2">
                  <Skeleton className="h-8 w-12" />
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
