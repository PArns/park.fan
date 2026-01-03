'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { AttractionStatistics } from '@/lib/api/types';

interface WaitTimeSparklineProps {
  history: AttractionStatistics['history'];
  className?: string;
}

export function WaitTimeSparkline({ history, className }: WaitTimeSparklineProps) {
  if (!history || history.length === 0) return null;

  // Process data for charts
  // Ensure we have valid timestamps and numbers
  const data = history.map((point) => ({
    time: new Date(point.timestamp).getTime(),
    value: point.waitTime,
  }));

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
