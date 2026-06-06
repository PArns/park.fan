'use client';

import { Sparkline, type SparklinePoint } from '@/components/parks/sparkline';
import type { ModelMetricsSnapshot } from '@/lib/api/types';

// Brand blue, resolved hex — the shared Sparkline strokes with `currentColor`.
const BRAND_BLUE = '#2191D3';

interface Props {
  history: ModelMetricsSnapshot[];
  metric: 'mae' | 'rmse' | 'mape' | 'r2Score';
  /** Height in px. Default 140. */
  height?: number;
  unit?: string;
  decimals?: number;
}

/**
 * ML model-metric trend. Reuses the shared parks/rides <Sparkline> for consistency (and
 * to drop the ~100 KB recharts bundle this used to pull onto the homepage). Metrics vary
 * little in absolute terms (e.g. r² ≈ 0.9), so it opts into the `fit` y-domain.
 */
export function MLSparkline({ history, metric, height = 140, unit, decimals = 1 }: Props) {
  const points: SparklinePoint[] = history
    .filter((m) => m[metric] != null)
    .map((m, i) => ({
      x: i,
      label: new Date(m.trainedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      value: m[metric] as number,
    }));

  if (points.length < 2) return null;

  const fmt = (v: number) => `${v.toFixed(decimals)}${unit ? ` ${unit}` : ''}`;

  return (
    <div className="w-full" style={{ height, color: BRAND_BLUE }}>
      <Sparkline
        points={points}
        yDomain="fit"
        formatTooltip={(p) => ({ label: p.label, value: fmt(p.value) })}
      />
    </div>
  );
}
