'use client';

/**
 * DOM overlay for Queue Tactics: top status bar, trait tracker, selected-unit
 * panel, battle controls, result banner and game-over screen. Everything is
 * absolutely positioned over the WebGL canvas; the canvas itself stays
 * interactive through `pointer-events-none` on wrapper layers.
 */

import { Camera, FastForward, Heart, Moon, RotateCcw, SkipForward, Sun, X } from 'lucide-react';
import { countTraits } from '@/lib/tactics/core/combat';
import { UNITS, TRAITS, STAR_MULT } from '@/lib/tactics/core/data';
import { sellValue } from '@/lib/tactics/core/economy';
import { findUnit } from '@/lib/tactics/core/board';
import { isPveRound } from '@/lib/tactics/core/game';
import type { TraitId } from '@/lib/tactics/core/types';
import type { UiState } from '@/lib/tactics/controller';
import type { CameraPreset, SceneTheme } from '@/lib/three/tactics/scene';
import { cn } from '@/lib/utils';
import { ShopBar } from './shop-bar';
import { TraitChip } from './trait-chip';

interface HudProps {
  ui: UiState;
  theme: SceneTheme;
  camera: CameraPreset;
  onBuy: (slot: number) => void;
  onReroll: () => void;
  onBuyXp: () => void;
  onFight: () => void;
  onSell: (uid: string) => void;
  onDeselect: () => void;
  onSpeed: (s: number) => void;
  onSkip: () => void;
  onNewGame: () => void;
  onTheme: (t: SceneTheme) => void;
  onCamera: (c: CameraPreset) => void;
}

function HpPill({ label, hp, accent }: { label: string; hp: number; accent: 'me' | 'ai' }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 backdrop-blur-md">
      <span className="text-[11px] font-semibold text-white/70">{label}</span>
      <Heart className={cn('h-3.5 w-3.5', accent === 'me' ? 'text-emerald-400' : 'text-red-400')} />
      <span className="min-w-[2ch] text-sm font-bold text-white tabular-nums">
        {Math.max(0, hp)}
      </span>
    </div>
  );
}

export function Hud(props: HudProps) {
  const { ui } = props;
  const game = ui.game;
  const p1 = game.players.p1;
  const pve = isPveRound(game.round);

  // No memo here on purpose: the sim core mutates GameState in place, so a
  // dependency on p1.board would never invalidate. The list is ≤10 entries.
  const defIds = Object.values(p1.board).map((u) => u.defId);
  const { counts } = countTraits(defIds);
  const traitEntries = [...counts.entries()] as [TraitId, number][];
  traitEntries.sort((a, b) => {
    const la = TRAITS[a[0]].breakpoints.filter((bp) => a[1] >= bp).length;
    const lb = TRAITS[b[0]].breakpoints.filter((bp) => b[1] >= bp).length;
    return lb - la || b[1] - a[1];
  });

  const selected = ui.selectedUid ? findUnit(p1, ui.selectedUid) : null;
  const selectedDef = selected ? UNITS[selected.unit.defId] : null;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      {/* ---------------- top bar ---------------- */}
      <div className="flex items-start justify-between gap-2 p-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
              Round {game.round}
              <span className="ml-1 font-medium text-white/50">
                {pve ? '· Minions' : '· vs AI'}
              </span>
            </span>
            <HpPill label="You" hp={p1.hp} accent="me" />
            <HpPill label="AI" hp={game.players.p2.hp} accent="ai" />
          </div>
          {/* trait tracker */}
          {traitEntries.length > 0 && ui.uiPhase === 'planning' && (
            <div className="flex max-w-[240px] flex-wrap gap-1">
              {traitEntries.map(([t, c]) => (
                <TraitChip key={t} trait={t} count={c} />
              ))}
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1">
          <button
            onClick={() => props.onCamera(nextCamera(props.camera))}
            className="rounded-full border border-white/10 bg-black/45 p-2 text-white/80 backdrop-blur-md transition hover:text-white"
            title={`Camera: ${props.camera}`}
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            onClick={() => props.onTheme(props.theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full border border-white/10 bg-black/45 p-2 text-white/80 backdrop-blur-md transition hover:text-white"
            title="Toggle day/night"
          >
            {props.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={props.onNewGame}
            className="rounded-full border border-white/10 bg-black/45 p-2 text-white/80 backdrop-blur-md transition hover:text-white"
            title="New game"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ---------------- centre banner ---------------- */}
      {ui.uiPhase === 'banner' && game.lastCombat && (
        <div className="flex justify-center">
          <div className="pointer-events-auto rounded-2xl border border-white/15 bg-black/70 px-8 py-5 text-center shadow-2xl backdrop-blur-lg">
            <div
              className={cn(
                'text-3xl font-black tracking-wide',
                game.lastCombat.winner === 'p1'
                  ? 'text-emerald-400'
                  : game.lastCombat.winner === 'draw'
                    ? 'text-white/80'
                    : 'text-red-400'
              )}
            >
              {game.lastCombat.winner === 'p1'
                ? 'Victory!'
                : game.lastCombat.winner === 'draw'
                  ? 'Draw'
                  : 'Defeat'}
            </div>
            <div className="mt-1 text-sm text-white/60">
              {game.lastCombat.winner === 'p1'
                ? `The AI takes ${game.lastCombat.damage} damage`
                : game.lastCombat.winner === 'draw'
                  ? `Both take ${game.lastCombat.damage} damage`
                  : `You take ${game.lastCombat.damage} damage`}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- game over ---------------- */}
      {ui.uiPhase === 'gameover' && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl border border-white/15 bg-black/80 px-10 py-8 text-center shadow-2xl">
            <div
              className={cn(
                'text-4xl font-black',
                game.winner === 'p1' ? 'text-amber-300' : 'text-red-400'
              )}
            >
              {game.winner === 'p1' ? '🏆 You win!' : 'Defeated'}
            </div>
            <div className="mt-2 text-sm text-white/60">
              {game.winner === 'p1'
                ? `The AI ran out of HP in round ${game.round}.`
                : `You ran out of HP in round ${game.round}. The queue moved anyway.`}
            </div>
            <button
              onClick={props.onNewGame}
              className="mt-6 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 active:scale-95"
            >
              Play again
            </button>
          </div>
        </div>
      )}

      {/* ---------------- bottom area ---------------- */}
      <div>
        {/* selected unit panel */}
        {ui.uiPhase === 'planning' && selected && selectedDef && (
          <div className="pointer-events-auto mx-auto mb-1.5 w-full max-w-3xl px-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-white">{selectedDef.name}</span>
                  <span className="text-[11px] font-bold text-amber-300">
                    {'★'.repeat(selected.unit.star)}
                  </span>
                  <TraitChip trait={selectedDef.origin} compact />
                  <TraitChip trait={selectedDef.clazz} compact />
                </div>
                <div className="mt-0.5 truncate text-[11px] text-white/55">
                  {Math.round(selectedDef.hp * STAR_MULT[selected.unit.star])} HP ·{' '}
                  {Math.round(selectedDef.ad * STAR_MULT[selected.unit.star])} AD ·{' '}
                  {selectedDef.range > 1 ? `range ${selectedDef.range}` : 'melee'} ·{' '}
                  {selectedDef.ability.name}: {selectedDef.ability.description}
                </div>
                <div className="text-[10px] text-white/40">
                  Tap a highlighted hex or bench slot to move · drag also works
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => props.onSell(selected.unit.uid)}
                  className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/25 active:scale-95"
                >
                  Sell ({sellValue(selectedDef.cost, selected.unit.star)}g)
                </button>
                <button
                  onClick={props.onDeselect}
                  className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/60 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* battle controls */}
        {ui.uiPhase === 'battle' && (
          <div className="pointer-events-auto mx-auto mb-3 flex w-full max-w-3xl items-center justify-center gap-2 px-2">
            <button
              onClick={() => props.onSpeed(ui.replaySpeed >= 2 ? 1 : 2)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition active:scale-95',
                ui.replaySpeed >= 2
                  ? 'border-amber-400/40 bg-amber-400/20 text-amber-200'
                  : 'border-white/15 bg-black/55 text-white/80'
              )}
            >
              <FastForward className="h-4 w-4" />
              {ui.replaySpeed >= 2 ? '2×' : '1×'}
            </button>
            <button
              onClick={props.onSkip}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/55 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md transition hover:text-white active:scale-95"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </button>
          </div>
        )}

        {/* shop */}
        {ui.uiPhase === 'planning' && (
          <ShopBar
            player={p1}
            round={game.round}
            onBuy={props.onBuy}
            onReroll={props.onReroll}
            onBuyXp={props.onBuyXp}
            onFight={props.onFight}
          />
        )}
      </div>
    </div>
  );
}

function nextCamera(c: CameraPreset): CameraPreset {
  return c === 'default' ? 'top' : c === 'top' ? 'side' : 'default';
}
