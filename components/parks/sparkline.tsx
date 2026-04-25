'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMounted } from '@/lib/hooks/use-mounted';

export interface SparklinePoint {
  x: number;
  label: string;
  value: number;
}

interface SparklineProps {
  points: SparklinePoint[];
  className?: string;
  formatTooltip?: (point: SparklinePoint) => { label: string; value: string };
}

export function Sparkline({ points, className, formatTooltip }: SparklineProps) {
  const [activePoint, setActivePoint] = useState<
    (SparklinePoint & { clientX: number; clientY: number }) | null
  >(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  const { xMin, xMax, yMax } = useMemo(() => {
    if (points.length === 0) return { xMin: 0, xMax: 1, yMax: 10 };
    return {
      xMin: points[0].x,
      xMax: points[points.length - 1].x,
      yMax: Math.max(...points.map((p) => p.value), 10),
    };
  }, [points]);

  useEffect(() => {
    if (points.length === 0) return;
    const xRange = xMax - xMin || 1;

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
      const hoverX = xMin + ((e.clientX - rect.left) / rect.width) * xRange;
      let found = points[0];
      for (let i = 0; i < points.length; i++) {
        if (points[i].x <= hoverX) found = points[i];
        else break;
      }
      setActivePoint({ ...found, clientX: e.clientX, clientY: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [points, xMin, xMax]);

  if (points.length === 0) return null;

  const xRange = xMax - xMin || 1;
  const getX = (x: number) => ((x - xMin) / xRange) * 100;
  const getY = (value: number) => 100 - (value / yMax) * 100;

  let pathD = '';
  points.forEach((p, i) => {
    const x = getX(p.x);
    const y = getY(p.value);
    if (i === 0) {
      pathD += `M ${x},${y}`;
    } else {
      pathD += ` L ${x},${getY(points[i - 1].value)}`;
      pathD += ` L ${x},${y}`;
    }
  });

  const tooltip = activePoint && formatTooltip ? formatTooltip(activePoint) : null;

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

      {mounted &&
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
            <div className="font-medium">{tooltip ? tooltip.label : activePoint.label}</div>
            <div className="font-bold">{tooltip ? tooltip.value : `${activePoint.value} min`}</div>
          </div>,
          document.body
        )}
    </div>
  );
}
