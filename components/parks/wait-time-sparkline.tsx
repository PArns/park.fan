'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import type { AttractionStatistics } from '@/lib/api/types';

interface WaitTimeSparklineProps {
  history: AttractionStatistics['history'];
  className?: string;
}

export function WaitTimeSparkline({ history, className }: WaitTimeSparklineProps) {
  const [activePoint, setActivePoint] = useState<{ x: number; time: number; value: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Use state for current time to avoid hydration mismatch and impure render
  const [now, setNow] = useState<number>(0);

  // Update time on mount
  useEffect(() => {
    setNow(Date.now());
  }, []);
  // Process data for charts
  const { points, maxTime, minTime, maxWait } = useMemo(() => {
    if (!history || history.length === 0) return { points: [], maxTime: 0, minTime: 0, maxWait: 0 };

    // Ensure we have valid timestamps and numbers
    const processedData = history.map((point) => ({
      time: new Date(point.timestamp).getTime(),
      value: point.waitTime,
    }));

    // Extend sparkline to current time if last data point is stale (>15min old)
    // ONLY if we have a valid 'now' (client-side)
    if (processedData.length > 0 && now > 0) {
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

    // ... rest same
    const maxVal = Math.max(...processedData.map((d) => d.value), 10);
    const minT = processedData[0].time;
    const maxT = processedData[processedData.length - 1].time;

    return { points: processedData, maxTime: maxT, minTime: minT, maxWait: maxVal };
  }, [history, now]); // Add now dependency

  if (points.length === 0) return null;

  // Generate Path Data for StepAfter
  // StepAfter: Horizontal from (x_i, y_i) to (x_i+1, y_i), then vertical to (x_i+1, y_i+1)
  // We use 0-100 coordinate space for SVG
  const timeRange = maxTime - minTime;

  const getX = (time: number) => (timeRange === 0 ? 0 : ((time - minTime) / timeRange) * 100);
  const getY = (value: number) => 100 - (value / maxWait) * 100;

  let pathD = '';
  points.forEach((p, i) => {
    const x = getX(p.time);
    const y = getY(p.value);

    if (i === 0) {
      pathD += `M ${x},${y}`;
    } else {
      // Draw horizontal from prev point to current X
      // The value associated with the interval [prev_time, curr_time] is the PREVIOUS value for StepAfter?
      // Recharts "stepAfter":
      // "The y value is constant for the interval [x[i], x[i+1])." -> This is Step (or StepBefore).
      // "The y value is constant for the interval (x[i], x[i+1]]." -> This is StepAfter?
      // Let's look at standard definition. "step-after" usually means: At point i, go horizontal to i+1, then go vertical to value i+1.
      // So the line from i to i+1 represents value i.

      // Wait, Recharts source code or documentation...
      // Recharts "stepAgain" isn't a native SVG command.
      // Usually "step-after" means the transition happens AFTER the interval.
      // So line is horizontal at Y_i from X_i to X_i+1. Then vertical to Y_i+1.

      const prevP = points[i - 1];
      const prevY = getY(prevP.value);
      // Horizontal move to current X with PREVIOUS Y
      pathD += ` L ${x},${prevY}`;
      // Vertical move to current Y
      pathD += ` L ${x},${y}`;
    }
  });

  // Extend to the end (implicit in the loop if the last point is maxTime)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const hoverTime = minTime + (x / width) * timeRange;

    // Find the interval where hoverTime falls: points[i].time <= hoverTime < points[i+1].time
    // Since it's step-after (value lasts until next point), usage of `findLast` or similar.
    // Actually, for StepAfter: "The y value is constant for the interval [x[i], x[i+1])."
    // So we need the point with largest time <= hoverTime.
    let found = points[0];
    for (let i = 0; i < points.length; i++) {
      if (points[i].time <= hoverTime) {
        found = points[i];
      } else {
        break;
      }
    }

    setActivePoint({
      x: getX(found.time), // or cursor position? Usually step charts highlight the interval or the cursor X.
      // Let's stick to cursor X for the tooltip position, but snap Y to the value.
      time: hoverTime, // Show actual mouse time or point time? Recharts shows point time usually, but for continuous axis...
      // Let's use the exact point value
      value: found.value,
    });
  };

  const handleMouseLeave = () => setActivePoint(null);

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {activePoint && (
        <div
          className="bg-popover text-popover-foreground pointer-events-none absolute top-0 z-10 rounded-lg border px-2 py-1 text-xs whitespace-nowrap shadow-md"
          style={{
            left: `${((activePoint.time - minTime) / timeRange) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="font-medium">{formatTime(activePoint.time)}</div>
          <div className="font-bold">{activePoint.value} min</div>
        </div>
      )}
    </div>
  );
}
