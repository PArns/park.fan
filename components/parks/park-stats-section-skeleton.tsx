import { PANEL_FLAT, TILE_GLASS } from '@/components/common/glass-card';
import { PANEL_CELL, PanelGrid } from '@/components/parks/park-panel-cell';
import { cn } from '@/lib/utils';
import { ParkStatsHeader } from '@/components/parks/park-stats-header';
import { Skeleton } from '@/components/ui/skeleton';
import { CHAPTER_GAP_COMPACT } from '@/components/common/chapter-spacing';
import type { ParkStatsShape } from '@/lib/parks/park-stats-derive';

/** The three cards <ParkStatsSection> can render. Declared here because the skeleton has to
 *  mirror the same selection and the section already imports this file. */
export type StatsCard = 'attractions' | 'months' | 'weekdays' | 'extremeDays';
export const ALL_STATS_CARDS = [
  'attractions',
  'months',
  'weekdays',
  'extremeDays',
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

/**
 * Crowd-by-period row, built like `ParkStatsCrowdCard`'s `<li>` and inside the same `@container`,
 * so under 22rem the readings drop to a second line here exactly where they do there.
 */
function CrowdRowSkeleton() {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1.5 text-sm">
      <span className="flex h-5 w-24 shrink-0 items-center">
        <Skeleton className="h-4 w-20" />
      </span>
      <Skeleton className="h-[22px] w-20 rounded-full" />
      <span className="ml-auto flex h-4 shrink-0 items-center @max-[22rem]:w-full @max-[22rem]:pl-26">
        <Skeleton className="h-3 w-24" />
      </span>
    </li>
  );
}

/** A row of the fullest and quietest days, built like `ParkStatsExtremeDaysCard`'s `<li>`. */
function ExtremeDayRowSkeleton() {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1.5 text-sm">
      <span className="flex h-5 min-w-0 flex-1 items-center">
        <Skeleton className="h-4 w-28" />
      </span>
      <Skeleton className="h-[22px] w-20 shrink-0 rounded-full" />
      <Skeleton className="h-3 w-12 shrink-0" />
    </li>
  );
}

function CrowdCardSkeleton({
  rows,
  Row = CrowdRowSkeleton,
}: {
  rows: number;
  Row?: () => React.ReactElement;
}) {
  return (
    <div className="space-y-2">
      {/* The `<h3>`'s line box: text-sm, 20 px. */}
      <div className="flex h-5 items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <ul className="@container max-w-xl space-y-0.5">
        {Array.from({ length: rows }, (_, i) => (
          <Row key={i} />
        ))}
      </ul>
    </div>
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
  flat = false,
  shape,
  subtitle,
  action,
}: {
  show?: readonly StatsCard[];
  hideHeading?: boolean;
  /** See `ParkStatsSection`'s `flat`: {@link PANEL_FLAT} where no park photo sits behind it. */
  flat?: boolean;
  /**
   * The row counts the settled section will draw, from a server that holds the aggregate. `null`
   * means it draws nothing, so neither does this; omitted, the counts are typical ones.
   */
  shape?: ParkStatsShape | null;
  /** The header's data line and link, which a caller with a `shape` already knows. */
  subtitle?: string;
  action?: React.ReactNode;
} = {}) {
  if (shape === null) return null;
  const rows = {
    attractions: shape?.attractions ?? 10,
    months: shape?.months ?? 6,
    weekdays: shape?.weekdays ?? 7,
    busiest: shape?.busiestDays ?? 5,
    quietest: shape?.quietestDays ?? 5,
  };
  const showMonths = show.includes('months') && rows.months > 0;
  const showWeekdays = show.includes('weekdays') && rows.weekdays > 0;
  const columnCount = (showMonths ? 1 : 0) + (showWeekdays ? 1 : 0) || 1;
  const extremeLists = [rows.busiest, rows.quietest].filter((n) => n > 0);

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
    <section className={CHAPTER_GAP_COMPACT} aria-hidden="true">
      <ParkStatsHeader
        hidden={hideHeading}
        subtitle={subtitle}
        action={action}
        className={hideHeading ? undefined : 'mb-0 rounded-b-none'}
      />

      {/* Mirrors the settled panel exactly — same box, same `PANEL_CELL`, same column count, and
        the ranking spanning the row the same way. Anything that differs here is a jump the moment
        the stats land, and on the park page this section has the FAQ and two more chapters under
        it. */}
      <div
        className={cn(
          flat ? PANEL_FLAT : TILE_GLASS,
          'border-border/50 overflow-hidden border',
          hideHeading ? 'rounded-xl' : 'rounded-b-xl border-t-0'
        )}
      >
        <PanelGrid columnCount={columnCount}>
          {show.includes('attractions') && rows.attractions > 0 && (
            <div className={cn(PANEL_CELL, columnCount === 2 && 'sm:col-span-2')}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
                <div className="space-y-0.5">
                  {/* Column headers of the ranking table (rank · attraction · now / typical / peak). */}
                  <div className="flex h-5 items-center gap-3 px-2 pb-1">
                    <Skeleton className="h-3 w-20" />
                    <div className="ml-auto flex shrink-0 items-center gap-3">
                      <Skeleton className="hidden h-3 w-12 sm:block" />
                      <Skeleton className="hidden h-3 w-12 sm:block" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  {Array.from({ length: rows.attractions }, (_, i) => (
                    <AttractionRowSkeleton key={i} nameWidth={nameWidths[i % nameWidths.length]} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {showMonths && (
            <div className={PANEL_CELL}>
              <CrowdCardSkeleton rows={rows.months} />
            </div>
          )}
          {showWeekdays && (
            <div className={PANEL_CELL}>
              <CrowdCardSkeleton rows={rows.weekdays} />
            </div>
          )}
          {show.includes('extremeDays') && extremeLists.length > 0 && (
            <div className={cn(PANEL_CELL, columnCount === 2 && 'sm:col-span-2')}>
              <div
                className={cn(
                  'grid gap-x-6 gap-y-4',
                  extremeLists.length === 2 && 'sm:grid-cols-2'
                )}
              >
                {extremeLists.map((n, i) => (
                  <CrowdCardSkeleton key={i} rows={n} Row={ExtremeDayRowSkeleton} />
                ))}
              </div>
            </div>
          )}
        </PanelGrid>
      </div>
    </section>
  );
}
