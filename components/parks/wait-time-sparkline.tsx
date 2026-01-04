'use client';

import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import type { AttractionStatistics } from '@/lib/api/types';

interface WaitTimeSparklineProps {
  history: AttractionStatistics['history'];
  className?: string;
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { time: number; value: number } }>;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const time = new Date(data.time);
  const waitTime = data.value;

  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 shadow-md">
      <p className="text-xs font-medium">
        {time.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      <p className="text-sm font-bold">{waitTime} min</p>
    </div>
  );
}

export function WaitTimeSparkline({ history, className }: WaitTimeSparklineProps) {
  // Process data for charts - use useMemo to handle Date.now() safely
  const data = useMemo(() => {
    if (!history || history.length === 0) return [];

    // Ensure we have valid timestamps and numbers
    const processedData = history.map((point) => ({
      time: new Date(point.timestamp).getTime(),
      value: point.waitTime,
    }));

    // Extend sparkline to current time if last data point is stale (>15min old)
    if (processedData.length > 0) {
      const now = Date.now();
      const lastDataPoint = processedData[processedData.length - 1];
      const fifteenMinutesInMs = 15 * 60 * 1000;

      // If last data point is older than 15 minutes, add current time point
      if (now - lastDataPoint.time > fifteenMinutesInMs) {
        processedData.push({
          time: now,
          value: lastDataPoint.value, // Keep same wait time (flat line)
        });
      }
    }

    return processedData;
  }, [history]);

  if (data.length === 0) return null;

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="stepAfter"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} // Disable animation for performance/instant load
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'currentColor', strokeWidth: 1 }}
          />
          {/* 
            Hidden YAxis to auto-scale the sparkline based on values so it uses the full height 
            We set domain to ['auto', 'auto'] or [0, 'auto']
          */}
          <YAxis domain={[0, 'auto']} hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
