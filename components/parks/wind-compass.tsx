'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { convertWindSpeed } from '@/lib/utils/temperature';

interface WindCompassProps {
  /** Direction the wind comes FROM, in degrees (0 = N, 90 = E). Null hides the arrow. */
  directionDeg: number | null;
  /** Wind speed in km/h. Rendered in both unit systems; CSS shows the active one. */
  windKmh: number;
  className?: string;
}

/**
 * Small SVG wind compass. The arrow sits at the bearing the wind comes FROM
 * and points inward, the convention most people read as "wind out of the NW".
 * Cardinal letters are localised; the arrow is hidden when direction is unknown.
 *
 * The speed + unit label are rendered in BOTH metric and imperial (as two SVG
 * groups toggled by the global `.u-metric` / `.u-imperial` CSS) so the compass
 * works on statically cached pages with no unit flash.
 */
export function WindCompass({ directionDeg, windKmh, className }: WindCompassProps) {
  const t = useTranslations('parks.weather.compass');
  const hasDir = directionDeg != null && Number.isFinite(directionDeg);
  const metricSpeed = String(Math.round(windKmh));
  const imperialSpeed = String(Math.round(convertWindSpeed(windKmh, 'F')));

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('h-16 w-16 shrink-0', className)}
      role="img"
      aria-label={hasDir ? t('aria', { deg: Math.round(directionDeg!) }) : undefined}
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        className="fill-foreground/5 stroke-foreground/15"
        strokeWidth="1.5"
      />
      <text x="50" y="15" textAnchor="middle" className="fill-primary text-[11px] font-bold">
        {t('n')}
      </text>
      <text x="88" y="54" textAnchor="middle" className="fill-foreground/40 text-[9px]">
        {t('e')}
      </text>
      <text x="50" y="95" textAnchor="middle" className="fill-foreground/40 text-[9px]">
        {t('s')}
      </text>
      <text x="12" y="54" textAnchor="middle" className="fill-foreground/40 text-[9px]">
        {t('w')}
      </text>
      {hasDir && (
        // Full needle spanning the whole dial: a tail at the bearing the wind
        // comes FROM and a filled arrowhead at the opposite (TO) side, so the
        // direction reads unambiguously instead of as a faint ">" caret. The
        // speed label nests in the centre gap so it stays legible over the
        // glass background.
        <g
          transform={`rotate(${directionDeg!} 50 50)`}
          className="stroke-primary fill-primary"
        >
          <line x1="50" y1="17" x2="50" y2="42" strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="50,83 42,67 58,67" className="stroke-none" />
        </g>
      )}
      {/* Speed + unit label, dual-rendered (CSS picks the active unit) */}
      <g className="u-metric">
        <text x="50" y="53" textAnchor="middle" className="fill-foreground text-[19px] font-bold">
          {metricSpeed}
        </text>
        <text x="50" y="64" textAnchor="middle" className="fill-foreground/55 text-[8px]">
          km/h
        </text>
      </g>
      <g className="u-imperial">
        <text x="50" y="53" textAnchor="middle" className="fill-foreground text-[19px] font-bold">
          {imperialSpeed}
        </text>
        <text x="50" y="64" textAnchor="middle" className="fill-foreground/55 text-[8px]">
          mph
        </text>
      </g>
    </svg>
  );
}
