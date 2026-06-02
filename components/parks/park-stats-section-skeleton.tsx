import { GlassCard } from '@/components/common/glass-card';
import { Skeleton } from '@/components/ui/skeleton';

/** A single right-aligned "typical / peak" wait-time pair placeholder. */
function WaitTimesSkeleton() {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-3">
      <Skeleton className="hidden h-3 w-16 sm:block" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/** Top-attractions ranking row: rank badge · attraction name · wait times. */
function AttractionRowSkeleton({ nameWidth }: { nameWidth: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
      <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
      <Skeleton className={`h-4 ${nameWidth} max-w-[55%] min-w-0`} />
      <WaitTimesSkeleton />
    </div>
  );
}

/** Crowd-by-period row: period label · crowd badge · wait times. */
function CrowdRowSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <Skeleton className="h-4 w-20 shrink-0" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <WaitTimesSkeleton />
    </div>
  );
}

function CrowdCardSkeleton({ rows }: { rows: number }) {
  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: rows }).map((_, i) => (
          <CrowdRowSkeleton key={i} />
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Loading placeholder for <ParkStatsSection>. Mirrors the section header, the
 * top-attractions ranking card, and the two crowd-by-period cards (by month ·
 * by weekday) so the layout stays stable while the streamed stats load.
 */
export function ParkStatsSectionSkeleton() {
  const nameWidths = [
    'w-48',
    'w-32',
    'w-40',
    'w-44',
    'w-36',
    'w-44',
    'w-40',
    'w-28',
    'w-32',
    'w-36',
  ];

  return (
    <section className="mt-8 space-y-4" aria-hidden="true">
      <div className="bg-background/70 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-64 max-w-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>

      <GlassCard variant="medium" className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="space-y-0.5">
          {nameWidths.map((w, i) => (
            <AttractionRowSkeleton key={i} nameWidth={w} />
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <CrowdCardSkeleton rows={6} />
        <CrowdCardSkeleton rows={7} />
      </div>
    </section>
  );
}
