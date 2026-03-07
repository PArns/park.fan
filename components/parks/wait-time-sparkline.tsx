'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import type { AttractionStatistics } from '@/lib/api/types';

interface WaitTimeSparklineProps {
  history: AttractionStatistics['history'];
  className?: string;
}

export function WaitTimeSparkline({ history, className }: WaitTimeSparklineProps) {
  const locale = useLocale();
  const [activePoint, setActivePoint] = useState<{
    time: number;
    value: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Use state for current time to avoid hydration mismatch and impure render
  const [now, setNow] = useState<number>(0);

  // Mount effect: set up portal target and update clock
  useEffect(() => {
    const timer = setTimeout(() => {
      setPortalTarget(document.body);
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Process data for charts
  const { points, maxTime, minTime, maxWait } = useMemo(() => {
    if (!history || history.length === 0) return { points: [], maxTime: 0, minTime: 0, maxWait: 0 };

    const processedData = history.map((point) => ({
      time: new Date(point.timestamp).getTime(),
      value: point.waitTime,
    }));

    if (processedData.length > 0 && now > 0) {
      const lastDataPoint = processedData[processedData.length - 1];
      const fifteenMinutesInMs = 15 * 60 * 1000;
      if (now - lastDataPoint.time > fifteenMinutesInMs) {
        processedData.push({ time: now, value: lastDataPoint.value });
      }
    }

    const maxVal = Math.max(...processedData.map((d) => d.value), 10);
    const minT = processedData[0].time;
    const maxT = processedData[processedData.length - 1].time;

    return { points: processedData, maxTime: maxT, minTime: minT, maxWait: maxVal };
  }, [history, now]);

  // Global mouse tracking – bypasses any synthetic event issues with Link wrapper or overflow constraints
  useEffect(() => {
    if (points.length === 0) return;

    const timeRange = maxTime - minTime;
    const _getX = (time: number) => (timeRange === 0 ? 0 : ((time - minTime) / timeRange) * 100);

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
      const hoverTime = minTime + ((e.clientX - rect.left) / rect.width) * timeRange;

      let found = points[0];
      for (let i = 0; i < points.length; i++) {
        if (points[i].time <= hoverTime) {
          found = points[i];
        } else {
          break;
        }
      }

      setActivePoint({
        time: hoverTime,
        value: found.value,
        clientX: e.clientX,
        clientY: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [points, minTime, maxTime]);

  if (points.length === 0) return null;

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
      const prevY = getY(points[i - 1].value);
      pathD += ` L ${x},${prevY}`;
      pathD += ` L ${x},${y}`;
    }
  });

  const formatTime = (ms: number) =>
    new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

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
            <div className="font-medium">{formatTime(activePoint.time)}</div>
            <div className="font-bold">{activePoint.value} min</div>
          </div>,
          portalTarget
        )}
    </div>
  );
}
