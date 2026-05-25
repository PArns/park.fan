import { cn } from '@/lib/utils';

interface MetricBarProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  pct?: number;
  /** Override auto color thresholds [warn%, danger%] — default [60, 80] */
  thresholds?: [number, number];
  className?: string;
}

function getBarColor(pct: number, thresholds: [number, number]) {
  if (pct >= thresholds[1]) return 'bg-red-500';
  if (pct >= thresholds[0]) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getTextColor(pct: number, thresholds: [number, number]) {
  if (pct >= thresholds[1]) return 'text-red-400';
  if (pct >= thresholds[0]) return 'text-amber-400';
  return 'text-emerald-400';
}

/**
 * Horizontal metric row with label, value, and a color-coded progress bar.
 * Color thresholds default to warn at 60% and danger at 80%.
 */
export function MetricBar({
  label,
  value,
  max,
  unit,
  pct,
  thresholds = [60, 80],
  className,
}: MetricBarProps) {
  const percentage = pct ?? (max > 0 ? Math.min((value / max) * 100, 100) : 0);
  const displayPct = Math.round(percentage);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn('font-mono font-medium tabular-nums', getTextColor(percentage, thresholds))}
        >
          {value.toLocaleString('de-DE', { maximumFractionDigits: 1 })}
          {unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
          <span className="text-muted-foreground ml-1">({displayPct}%)</span>
        </span>
      </div>
      <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            getBarColor(percentage, thresholds)
          )}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}
