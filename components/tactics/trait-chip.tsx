'use client';

/**
 * Small trait chip used in the trait tracker and on shop cards.
 * Colours + icons come from a shared mapping so scene + DOM stay in sync;
 * active chips glow in their trait colour, maxed traits get the gold rim.
 */

import {
  Anchor,
  Bot,
  Crown,
  Ghost,
  HeartPulse,
  PawPrint,
  Shield,
  Sparkles,
  Swords,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { TRAITS } from '@/lib/tactics/core/data';
import type { TraitId } from '@/lib/tactics/core/types';
import { TRAIT_HUD_COLORS } from '@/lib/three/tactics/palette';
import { cn } from '@/lib/utils';

const TRAIT_ICONS: Record<TraitId, LucideIcon> = {
  pirates: Anchor,
  royals: Crown,
  robots: Bot,
  spirits: Ghost,
  beasts: PawPrint,
  guardian: Shield,
  duelist: Swords,
  ranger: Target,
  mystic: Sparkles,
  support: HeartPulse,
};

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
  const Icon = TRAIT_ICONS[trait];
  const nextBp = count !== undefined ? def.breakpoints.find((b) => count < b) : undefined;
  const activeLevel = count !== undefined ? def.breakpoints.filter((b) => count >= b).length : 0;
  const active = activeLevel > 0;
  const maxed = active && activeLevel >= def.breakpoints.length;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-4 font-medium',
        active ? 'text-white' : 'border-white/10 bg-black/30 text-white/50'
      )}
      style={
        active
          ? {
              borderColor: maxed ? '#e8c35a' : `${color}88`,
              backgroundColor: `${color}26`,
              boxShadow: maxed ? '0 0 8px rgba(232,195,90,0.35)' : undefined,
            }
          : undefined
      }
      title={def.effects[Math.max(0, activeLevel - 1)]}
    >
      <Icon className="h-3 w-3" style={{ color: active ? color : `${color}77` }} />
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
