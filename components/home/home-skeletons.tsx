import { Skeleton } from '@/components/ui/skeleton';
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

/** Icon + title line + intro line — matches every section's `mb-2 / mb-8` header. */
function SectionHeaderSkeleton() {
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-48 max-w-[60%]" />
      </div>
      <Skeleton className="mb-8 h-4 w-72 max-w-full" />
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

/**
 * Park-card placeholder matching the default <ParkCard> footprint
 * (full-bleed photo + top/bottom glass panels, min-h ≈ 360px).
 */
function ParkCardSkeleton() {
  return (
    <article
      className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[20px] border border-black/[0.12] dark:border-white/10"
      style={{ boxShadow: 'var(--pk-card-shadow)' }}
    >
      <div className="absolute inset-0 z-0">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="absolute top-3 right-3 z-[4]">
        <Skeleton className="h-[34px] w-[34px] rounded-full" />
      </div>
      {/* Top panel */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3.5">
        <Skeleton className="h-5 w-36 max-w-[80%] opacity-60" />
        <Skeleton className="mt-2 h-3 w-24 opacity-40" />
        <div className="mt-2.5 flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full opacity-60" />
          <Skeleton className="h-5 w-16 rounded-full opacity-40" />
        </div>
      </div>
      <div className="relative z-[2] flex-1" />
      {/* Bottom panel */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <Skeleton className="h-3 w-20 opacity-40" />
          <Skeleton className="h-9 w-12 opacity-60" />
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2.5">
          <Skeleton className="h-3 w-24 opacity-40" />
          <Skeleton className="h-3 w-16 opacity-40" />
        </div>
      </div>
    </article>
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

export function GlobalStatsSkeleton() {
  return (
    <>
      {/* Global Stats */}
      <section className="bg-muted/30 px-4 py-12">
        <div className="container mx-auto">
          <SectionHeaderSkeleton />
          {/* Row 1: two stat cards */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          {/* Row 2: most/least crowded parks */}
          <div className="mb-3 grid gap-4 sm:grid-cols-2">
            <StatCardRow>
              <ParkCardSkeleton />
            </StatCardRow>
            <StatCardRow>
              <ParkCardSkeleton />
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
      <section className="px-4 py-12">
        <div className="container mx-auto">
          <SectionHeaderSkeleton />
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
        <SectionHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ParkCardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-4 w-32" />
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

export function LiveActivitySkeleton() {
  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <SectionHeaderSkeleton />
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
