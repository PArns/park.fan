import { cn } from '@/lib/utils';

interface TodayWaitRangeProps {
  /** Today's minimum observed wait, or null when unknown. */
  minVal: number | null;
  /** Today's maximum observed wait, or null when unknown. */
  maxVal: number | null;
  labels: { todayMin: string; todayMax: string; min: string };
  className?: string;
}

/**
 * "Today min X min · max Y min" line under a live wait value — shared by the
 * attraction live panel and the wait-time info card so the coloring and
 * separator stay identical. Renders nothing when neither bound is known.
 */
export function TodayWaitRange({ minVal, maxVal, labels, className }: TodayWaitRangeProps) {
  if (minVal == null && maxVal == null) return null;

  return (
    <p className={cn('text-xs', className)}>
      {minVal != null && (
        <span className="text-crowd-low font-medium">
          {labels.todayMin} {minVal} {labels.min}
        </span>
      )}
      {minVal != null && maxVal != null && <span className="text-muted-foreground mx-1.5">·</span>}
      {maxVal != null && (
        <span className="text-crowd-very-high font-medium">
          {labels.todayMax} {maxVal} {labels.min}
        </span>
      )}
    </p>
  );
}
