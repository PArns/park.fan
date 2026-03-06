'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AttractionHistoryDay } from '@/lib/api/types';

interface HourlyP90SparklineProps {
  hourlyP90: AttractionHistoryDay['hourlyP90'];
  className?: string;
}

export function HourlyP90Sparkline({ hourlyP90, className }: HourlyP90SparklineProps) {
  const [activePoint, setActivePoint] = useState<{
    hour: string;
    value: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Process data for charts
  const { points, maxValue, minHour, maxHour } = useMemo(() => {
    if (!hourlyP90 || hourlyP90.length === 0)
      return { points: [], maxValue: 0, minHour: 0, maxHour: 24 };

    const processedData = hourlyP90.map((point) => {
      const [hourStr] = point.hour.split(':');
      const hour = parseInt(hourStr, 10);
      return { hour: point.hour, hourNum: hour, value: point.value };
    });

    processedData.sort((a, b) => a.hourNum - b.hourNum);

    const maxVal = Math.max(...processedData.map((d) => d.value), 10);
    const minH = processedData[0]?.hourNum ?? 0;
    const maxH = processedData[processedData.length - 1]?.hourNum ?? 24;

    return { points: processedData, maxValue: maxVal, minHour: minH, maxHour: maxH };
  }, [hourlyP90]);

  // Global mouse tracking – bypasses any synthetic event issues with overflow constraints
  useEffect(() => {
    if (points.length === 0) return;

    const hourRange = maxHour - minHour || 1;

    const handleMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        setActivePoint(null);
        return;
      }
      const normalizedX = ((e.clientX - rect.left) / rect.width) * 100;
      const hoverHour = minHour + (normalizedX / 100) * hourRange;

      let found = points[0];
      for (let i = 0; i < points.length; i++) {
        if (points[i].hourNum <= hoverHour) {
          found = points[i];
        } else {
          break;
        }
      }

      setActivePoint({
        hour: found.hour,
        value: found.value,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [points, minHour, maxHour]);

  if (points.length === 0) return null;

  const hourRange = maxHour - minHour || 1;
  const getX = (hourNum: number) => ((hourNum - minHour) / hourRange) * 100;
  const getY = (value: number) => 100 - (value / maxValue) * 100;

  let pathD = '';
  points.forEach((p, i) => {
    const x = getX(p.hourNum);
    const y = getY(p.value);
    if (i === 0) {
      pathD += `M ${x},${y}`;
    } else {
      const prevY = getY(points[i - 1].value);
      pathD += ` L ${x},${prevY}`;
      pathD += ` L ${x},${y}`;
    }
  });

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
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

      {portalTarget &&
        activePoint &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              zIndex: 9999,
              left: activePoint.clientX,
              top: activePoint.clientY,
              transform: 'translate(-50%, calc(-100% - 8px))',
              pointerEvents: 'none',
            }}
            className="bg-popover text-popover-foreground rounded-lg border px-2 py-1 text-xs whitespace-nowrap shadow-md"
          >
            <div className="font-medium">{activePoint.hour}</div>
            <div className="font-bold">{activePoint.value} min</div>
          </div>,
          portalTarget
        )}
    </div>
  );
}
