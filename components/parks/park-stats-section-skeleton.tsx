import { GlassCard } from '@/components/common/glass-card';
import { ParkStatsHeader } from '@/components/parks/park-stats-header';
import { Skeleton } from '@/components/ui/skeleton';

/** The three cards <ParkStatsSection> can render. Declared here because the skeleton has to
 *  mirror the same selection and the section already imports this file. */
export type StatsCard = 'attractions' | 'months' | 'weekdays';
export const ALL_STATS_CARDS = [
  'attractions',
  'months',
  'weekdays',
] as const satisfies readonly StatsCard[];

/**
 * Right-aligned wait-time column placeholders. Two by default ("typical / peak", the narrow
 * layout drops the first); `withCurrent` adds the ranking table's live "now" column, which is
 * there whenever the park is open — the columns are `w-[4.5rem]` with `gap-3` in the real table.
 */
function WaitTimesSkeleton({ withCurrent = false }: { withCurrent?: boolean }) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-3">
      {withCurrent && <Skeleton className="hidden h-3 w-14 sm:block" />}
      <Skeleton className="hidden h-3 w-14 sm:block" />
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

/** Top-attractions ranking row: rank badge · attraction name · wait times. */
function AttractionRowSkeleton({ nameWidth }: { nameWidth: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
      <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
      <Skeleton className={`h-4 ${nameWidth} max-w-[55%] min-w-0`} />
      <WaitTimesSkeleton withCurrent />
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
 *
 * It has to mirror the CALLER's `show`/`hideHeading`, not the full section: the
 * guide page and the blog widgets mount `show={['attractions']} hideHeading`, and
 * a skeleton that always paints a heading plus three cards collapses several
 * hundred pixels the moment the data lands — under everything below it.
 */
export function ParkStatsSectionSkeleton({
  show = ALL_STATS_CARDS,
  hideHeading = false,
}: {
  show?: readonly StatsCard[];
  hideHeading?: boolean;
} = {}) {
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
      <ParkStatsHeader hidden={hideHeading} />

      {show.includes('attractions') && (
        <GlassCard variant="medium" className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="space-y-0.5">
            {/* Column headers of the ranking table (rank · attraction · now / typical / peak). */}
            <div className="flex items-center gap-3 px-2 pb-1">
              <Skeleton className="h-3 w-20" />
              <div className="ml-auto flex shrink-0 items-center gap-3">
                <Skeleton className="hidden h-3 w-12 sm:block" />
                <Skeleton className="hidden h-3 w-12 sm:block" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            {nameWidths.map((w, i) => (
              <AttractionRowSkeleton key={i} nameWidth={w} />
            ))}
          </div>
        </GlassCard>
      )}

      {(show.includes('months') || show.includes('weekdays')) && (
        <div className="grid gap-4 md:grid-cols-2">
          {show.includes('months') && <CrowdCardSkeleton rows={6} />}
          {show.includes('weekdays') && <CrowdCardSkeleton rows={7} />}
        </div>
      )}
    </section>
  );
}
