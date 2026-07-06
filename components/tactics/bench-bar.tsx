'use client';

/**
 * The hero bench as a DOM strip directly above the shop — always reachable
 * on every device (the 3D bench pads used to hide behind the shop sheet on
 * some screens, making bought units untouchable; user-reported blocker).
 *
 * Tap a unit to select it, then tap a highlighted board hex to deploy.
 * Tapping an empty slot while a BOARD unit is selected pulls it back here.
 */

import { Star } from 'lucide-react';
import { UNITS } from '@/lib/tactics/core/data';
import type { OwnedUnit } from '@/lib/tactics/core/types';
import { COST_COLORS, TRAIT_HUD_COLORS } from '@/lib/three/tactics/palette';
import { cn } from '@/lib/utils';

function costHex(cost: number): string {
  return `#${COST_COLORS[cost].toString(16).padStart(6, '0')}`;
}

export function BenchBar({
  bench,
  selectedUid,
  boardSelected,
  onSelect,
  onToBench,
}: {
  bench: (OwnedUnit | null)[];
  selectedUid: string | null;
  /** True when the current selection sits on the board (enables pull-back). */
  boardSelected: boolean;
  onSelect: (uid: string) => void;
  onToBench: (index: number) => void;
}) {
  return (
    <div className="pointer-events-auto mx-auto w-full max-w-3xl px-2">
      <div className="mb-1.5 grid grid-cols-9 gap-1">
        {bench.map((unit, i) => {
          if (!unit) {
            return (
              <button
                key={i}
                onClick={() => boardSelected && onToBench(i)}
                className={cn(
                  'h-12 rounded-md border border-dashed transition',
                  boardSelected
                    ? 'cursor-pointer border-emerald-300/50 bg-emerald-400/10'
                    : 'border-white/10 bg-black/25'
                )}
                aria-label={`Bench slot ${i + 1}`}
              />
            );
          }
          const def = UNITS[unit.defId];
          const selected = selectedUid === unit.uid;
          return (
            <button
              key={unit.uid}
              onClick={() => onSelect(unit.uid)}
              className={cn(
                'relative h-12 overflow-hidden rounded-md border text-left backdrop-blur-sm transition active:scale-95',
                selected
                  ? 'border-sky-300 bg-sky-400/25 shadow-[0_0_10px_rgba(90,180,255,0.45)]'
                  : 'border-white/15 bg-black/45 hover:bg-white/10'
              )}
            >
              <div className="h-1 w-full" style={{ backgroundColor: costHex(def.cost) }} />
              <div className="px-1 pt-0.5">
                <div
                  className="truncate text-[9px] leading-3 font-bold text-white"
                  style={{ color: selected ? '#fff' : undefined }}
                >
                  {def.name}
                </div>
                <div className="flex items-center gap-0.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: TRAIT_HUD_COLORS[def.origin] }}
                  />
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: TRAIT_HUD_COLORS[def.clazz] }}
                  />
                  <span className="ml-auto flex items-center text-[9px] font-bold text-amber-300">
                    {unit.star}
                    <Star className="ml-px h-2 w-2 fill-amber-300" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
