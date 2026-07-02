'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { TrendDirection } from '@/lib/api/types';

function normalizeDirection(direction: TrendDirection): 'up' | 'down' | 'stable' {
  if (direction === 'up' || direction === 'increasing' || direction === 'rising') return 'up';
  if (direction === 'down' || direction === 'decreasing' || direction === 'falling') return 'down';
  return 'stable';
}

interface TrendPillProps {
  direction: TrendDirection;
  /** Signed change in minutes (e.g. +10 / -5). Ignored when the direction is stable. */
  delta: number;
  className?: string;
}

/**
 * Small colored pill showing a short-term wait-time trend: an up/down/stable arrow
 * plus the signed delta ("+10 min") or a "stable" label. Shared by the attraction
 * card (standby) and the ride overview's single-rider queue card.
 */
export function TrendPill({ direction, delta, className }: TrendPillProps) {
  const tCommon = useTranslations('common');
  const dir = normalizeDirection(direction);

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-0.5 rounded-full border px-1.5 py-[2px] text-[10.5px] leading-none font-semibold text-white',
        dir === 'up' && 'bg-badge-trend-up/60 border-trend-up/25',
        dir === 'down' && 'bg-badge-trend-down/60 border-trend-down/25',
        dir === 'stable' && 'bg-badge-trend-stable/60 border-trend-stable/25',
        className
      )}
    >
      {dir === 'up' && <TrendingUp className="h-[11px] w-[11px]" />}
      {dir === 'down' && <TrendingDown className="h-[11px] w-[11px]" />}
      {dir === 'stable' && <Minus className="h-[11px] w-[11px]" />}
      {dir === 'stable' ? tCommon('stable') : `${delta > 0 ? '+' : ''}${delta} min`}
    </span>
  );
}
