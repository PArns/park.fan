'use client';

/**
 * Small trait chip used in the trait tracker and on shop cards.
 * Colours come from the shared 3D/HUD palette so scene + DOM stay in sync.
 */

import { TRAITS } from '@/lib/tactics/core/data';
import type { TraitId } from '@/lib/tactics/core/types';
import { TRAIT_HUD_COLORS } from '@/lib/three/tactics/palette';
import { cn } from '@/lib/utils';

export function TraitChip({
  trait,
  count,
  compact,
}: {
  trait: TraitId;
  count?: number;
  compact?: boolean;
}) {
  const def = TRAITS[trait];
  const color = TRAIT_HUD_COLORS[trait];
  const nextBp = count !== undefined ? def.breakpoints.find((b) => count < b) : undefined;
  const activeLevel = count !== undefined ? def.breakpoints.filter((b) => count >= b).length : 0;
  const active = activeLevel > 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] leading-4 font-medium',
        active
          ? 'border-white/25 bg-white/10 text-white'
          : 'border-white/10 bg-black/30 text-white/50'
      )}
      title={def.effects[Math.max(0, activeLevel - 1)]}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color, opacity: active ? 1 : 0.45 }}
      />
      {compact ? def.name.split(' ')[0] : def.name}
      {count !== undefined && (
        <span className={cn('tabular-nums', active ? 'text-amber-300' : 'text-white/40')}>
          {count}
          {nextBp !== undefined ? `/${nextBp}` : ''}
        </span>
      )}
    </span>
  );
}
