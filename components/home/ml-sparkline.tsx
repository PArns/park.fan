'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip, ReferenceDot, YAxis } from 'recharts';
import type { ModelMetricsSnapshot } from '@/lib/api/types';

// Use resolved hex — CSS variables don't work in SVG stroke attributes.
const BRAND_BLUE = '#2191D3';

interface Props {
  history: ModelMetricsSnapshot[];
  metric: 'mae' | 'rmse' | 'mape' | 'r2Score';
  /** Height in px. Default 140. */
  height?: number;
  unit?: string;
  decimals?: number;
}

interface DataPoint {
  label: string;
  value: number;
  isActive: boolean;
}

function SparklineTooltip({
  active,
  payload,
  unit,
  decimals = 1,
}: {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
  unit?: string;
  decimals?: number;
}) {
  if (!active || !payload?.length) return null;
  const { label, value } = payload[0].payload;
  return (
    <div
      className="rounded border px-2 py-1 text-xs shadow-md"
      style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <p style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className="font-semibold">
        {value.toFixed(decimals)}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}

export function MLSparkline({ history, metric, height = 140, unit, decimals = 1 }: Props) {
  const validPoints = history.filter((m) => m[metric] != null);
  if (validPoints.length < 2) return null;

  const data: DataPoint[] = validPoints.map((m) => {
    const date = new Date(m.trainedAt);
    const label = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return {
      label,
      value: m[metric] as number,
      isActive: m.isActive,
    };
  });

  const activeDot = data.findLast((d) => d.isActive);
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.2 || 1;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={BRAND_BLUE}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {activeDot && (
            <ReferenceDot
              x={activeDot.label}
              y={activeDot.value}
              r={4}
              fill={BRAND_BLUE}
              stroke="#fff"
              strokeWidth={1.5}
              label={{
                value: `${activeDot.value.toFixed(decimals)}${unit ? ` ${unit}` : ''}`,
                position: 'top',
                fill: BRAND_BLUE,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}
          <Tooltip
            content={<SparklineTooltip unit={unit} decimals={decimals} />}
            cursor={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
