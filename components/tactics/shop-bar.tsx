'use client';

/**
 * Bottom shop sheet: 5 unit cards, gold, level/XP, reroll & XP buttons and
 * the big FIGHT button. Thumb-reachable by design — Queue Tactics is played
 * one-handed while standing in a ride queue.
 */

import { Coins, Dices, RefreshCw, Swords } from 'lucide-react';
import { UNITS } from '@/lib/tactics/core/data';
import { REROLL_COST, XP_COST, XP_TABLE, unitCap } from '@/lib/tactics/core/economy';
import { boardCount } from '@/lib/tactics/core/board';
import type { PlayerState } from '@/lib/tactics/core/types';
import { COST_COLORS } from '@/lib/three/tactics/palette';
import { cn } from '@/lib/utils';
import { TraitChip } from './trait-chip';

function costHex(cost: number): string {
  return `#${COST_COLORS[cost].toString(16).padStart(6, '0')}`;
}

export function ShopBar({
  player,
  round,
  onBuy,
  onReroll,
  onBuyXp,
  onFight,
}: {
  player: PlayerState;
  round: number;
  onBuy: (slot: number) => void;
  onReroll: () => void;
  onBuyXp: () => void;
  onFight: () => void;
}) {
  const xpNeed = XP_TABLE[player.level];
  const onBoard = boardCount(player);
  const cap = unitCap(player.level);

  return (
    <div className="pointer-events-auto mx-auto w-full max-w-3xl px-2 pb-2">
      <div className="rounded-2xl border border-white/10 bg-black/55 p-2 shadow-2xl backdrop-blur-md">
        {/* econ row */}
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-bold text-amber-300">
              <Coins className="h-4 w-4" />
              {player.gold}
            </span>
            <span className="text-xs text-white/70">
              Lv {player.level}
              <span className="text-white/40">
                {' '}
                · {Number.isFinite(xpNeed) ? `${player.xp}/${xpNeed} XP` : 'max'}
              </span>
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                onBoard > cap ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/70'
              )}
            >
              {onBoard}/{cap} on board
            </span>
          </div>
          <button
            onClick={onFight}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black shadow-lg transition hover:bg-amber-400 active:scale-95"
          >
            <Swords className="h-4 w-4" />
            Fight
            <span className="text-[10px] font-semibold opacity-70">R{round}</span>
          </button>
        </div>

        {/* shop cards */}
        <div className="grid grid-cols-5 gap-1.5">
          {player.shop.map((defId, i) => {
            if (!defId) {
              return (
                <div
                  key={i}
                  className="h-[92px] rounded-lg border border-dashed border-white/10 bg-white/[0.03]"
                />
              );
            }
            const def = UNITS[defId];
            const affordable = player.gold >= def.cost;
            return (
              <button
                key={i}
                onClick={() => onBuy(i)}
                disabled={!affordable}
                className={cn(
                  'group relative h-[92px] overflow-hidden rounded-lg border text-left transition active:scale-95',
                  affordable
                    ? 'border-white/15 bg-white/[0.07] hover:bg-white/[0.14]'
                    : 'cursor-not-allowed border-white/5 bg-white/[0.03] opacity-50'
                )}
                style={{ boxShadow: `inset 0 3px 0 ${costHex(def.cost)}` }}
              >
                <div className="flex h-full flex-col justify-between p-1.5">
                  <div className="truncate text-[12px] leading-tight font-semibold text-white">
                    {def.name}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <TraitChip trait={def.origin} compact />
                    <TraitChip trait={def.clazz} compact />
                  </div>
                  <div className="flex items-center justify-end gap-0.5 text-[11px] font-bold text-amber-300">
                    <Coins className="h-3 w-3" />
                    {def.cost}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* action row */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            onClick={onReroll}
            disabled={player.gold < REROLL_COST}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.14] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reroll ({REROLL_COST}g)
          </button>
          <button
            onClick={onBuyXp}
            disabled={player.gold < XP_COST || !Number.isFinite(xpNeed)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.14] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Dices className="h-3.5 w-3.5" />
            Buy XP ({XP_COST}g)
          </button>
        </div>
      </div>
    </div>
  );
}
