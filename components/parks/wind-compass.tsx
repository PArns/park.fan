'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface WindCompassProps {
  /** Direction the wind comes FROM, in degrees (0 = N, 90 = E). Null hides the arrow. */
  directionDeg: number | null;
  /** Pre-formatted speed shown in the dial centre, e.g. "12". */
  speedValue: string;
  /** Unit label shown under the speed, e.g. "km/h". */
  unitLabel: string;
  className?: string;
}

/**
 * Small SVG wind compass. The arrow sits at the bearing the wind comes FROM
 * and points inward, the convention most people read as "wind out of the NW".
 * Cardinal letters are localised; the arrow is hidden when direction is unknown.
 */
export function WindCompass({ directionDeg, speedValue, unitLabel, className }: WindCompassProps) {
  const t = useTranslations('parks.weather.compass');
  const hasDir = directionDeg != null && Number.isFinite(directionDeg);

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
        <polygon
          points="44,18 56,18 50,32"
          className="fill-primary"
          transform={`rotate(${directionDeg!} 50 50)`}
        />
      )}
      <text x="50" y="53" textAnchor="middle" className="fill-foreground text-[19px] font-bold">
        {speedValue}
      </text>
      <text x="50" y="64" textAnchor="middle" className="fill-foreground/55 text-[8px]">
        {unitLabel}
      </text>
    </svg>
  );
}
