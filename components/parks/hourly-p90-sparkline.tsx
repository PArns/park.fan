'use client';

import { useMemo, useState, useRef } from 'react';
import type { AttractionHistoryDay } from '@/lib/api/types';

interface HourlyP90SparklineProps {
  hourlyP90: AttractionHistoryDay['hourlyP90'];
  className?: string;
}

export function HourlyP90Sparkline({ hourlyP90, className }: HourlyP90SparklineProps) {
  const [activePoint, setActivePoint] = useState<{ x: number; hour: string; value: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Process data for charts
  const { points, maxValue, minHour, maxHour } = useMemo(() => {
    if (!hourlyP90 || hourlyP90.length === 0)
      return { points: [], maxValue: 0, minHour: 0, maxHour: 24 };

    // Convert hour strings to numeric positions (0-23)
    const processedData = hourlyP90.map((point) => {
      const [hourStr] = point.hour.split(':');
      const hour = parseInt(hourStr, 10);
      return {
        hour: point.hour,
        hourNum: hour,
        value: point.value,
      };
    });

    // Sort by hour to ensure correct order
    processedData.sort((a, b) => a.hourNum - b.hourNum);

    const maxVal = Math.max(...processedData.map((d) => d.value), 10); // Minimum 10 min scale
    const minH = processedData[0]?.hourNum ?? 0;
    const maxH = processedData[processedData.length - 1]?.hourNum ?? 24;

    return { points: processedData, maxValue: maxVal, minHour: minH, maxHour: maxH };
  }, [hourlyP90]);

  if (points.length === 0) return null;

  // Generate Path Data for StepAfter
  // Normalize X coordinates to use full width (0-100%)
  // Map the actual hour range to 0-100% so the sparkline always uses full width
  const hourRange = maxHour - minHour || 1; // Avoid division by zero
  const getX = (hourNum: number) => {
    // Normalize: (hourNum - minHour) / hourRange * 100
    // This ensures first point is at 0% and last point is at 100%
    return ((hourNum - minHour) / hourRange) * 100;
  };
  const getY = (value: number) => 100 - (value / maxValue) * 100;

  let pathD = '';
  points.forEach((p, i) => {
    const x = getX(p.hourNum);
    const y = getY(p.value);

    if (i === 0) {
      pathD += `M ${x},${y}`;
    } else {
      const prevP = points[i - 1];
      const prevY = getY(prevP.value);
      // Horizontal move to current X with PREVIOUS Y (StepAfter)
      pathD += ` L ${x},${prevY}`;
      // Vertical move to current Y
      pathD += ` L ${x},${y}`;
    }
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    // Convert mouse X position (0-width) to normalized position (0-100%)
    const normalizedX = (x / width) * 100;

    // Convert normalized X back to hour number for finding the closest point
    const hoverHour = minHour + (normalizedX / 100) * hourRange;

    // Find the interval where hoverHour falls
    let found = points[0];
    for (let i = 0; i < points.length; i++) {
      if (points[i].hourNum <= hoverHour) {
        found = points[i];
      } else {
        break;
      }
    }

    setActivePoint({
      x: getX(found.hourNum),
      hour: found.hour,
      value: found.value,
    });
  };

  const handleMouseLeave = () => setActivePoint(null);

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
            left: `${activePoint.x}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="font-medium">{activePoint.hour}</div>
          <div className="font-bold">{activePoint.value} min</div>
        </div>
      )}
    </div>
  );
}
