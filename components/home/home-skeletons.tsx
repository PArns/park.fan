/**
 * Suspense fallbacks for the homepage's data-dependent sections.
 *
 * Each skeleton mirrors the rough height/layout of its real section so the
 * streamed content swaps in with minimal layout shift (CLS). They are pure,
 * data-free Server Components rendered into the static shell.
 */

function SectionHeaderSkeleton() {
  return (
    <>
      <div className="bg-muted mb-2 h-6 w-48 animate-pulse rounded" />
      <div className="bg-muted mb-8 h-4 w-72 max-w-full animate-pulse rounded" />
    </>
  );
}

export function GlobalStatsSkeleton() {
  return (
    <section className="bg-muted/30 px-4 py-12">
      <div className="container mx-auto">
        <SectionHeaderSkeleton />
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
        <div className="mb-3 grid gap-4 sm:grid-cols-2">
          <div className="bg-muted h-56 animate-pulse rounded-lg" />
          <div className="bg-muted h-56 animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-muted h-56 animate-pulse rounded-lg" />
          <div className="bg-muted h-56 animate-pulse rounded-lg" />
        </div>
      </div>
    </section>
  );
}

export function FeaturedParksSkeleton() {
  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <SectionHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function MLStatsSkeleton() {
  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <SectionHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-28 animate-pulse rounded-lg" />
          ))}
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
            <div key={i} className="bg-muted h-32 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  );
}
