/**
 * GameController — the client-side glue between the pure sim core, the
 * three.js scene and the React HUD. Owns the GameState, exposes a
 * subscribe/snapshot pair for useSyncExternalStore, and auto-saves to
 * localStorage after every mutation so a match survives pocketing the phone
 * in a queue (the whole point of Queue Tactics).
 */

import { aiPlanTurn } from './core/ai';
import { UNITS } from './core/data';
import { unitCap } from './core/economy';
import { boardCount, unitAtHex } from './core/board';
import { HALF_ROWS, rotate180, parseHexKey, type Hex } from './core/hex';
import { applyCommand, createGame, isPveRound, resolveCombat, simulateRound } from './core/game';
import type { Command, CombatReplay, GameState } from './core/types';
import type { PlanningUnitView, TacticsSceneHandle } from '@/lib/three/tactics/scene';

const SAVE_KEY = 'queue-tactics-save-v1';

export type UiPhase = 'planning' | 'battle' | 'banner' | 'gameover';

export interface UiState {
  game: GameState;
  uiPhase: UiPhase;
  selectedUid: string | null;
  replaySpeed: number;
  /** Set while a battle replay is running (0..1). */
  battleProgress: number;
  resumed: boolean;
}

export class GameController {
  private state: GameState;
  private uiPhase: UiPhase = 'planning';
  private selectedUid: string | null = null;
  private replaySpeed = 1;
  private battleProgress = 0;
  private resumed = false;
  private listeners = new Set<() => void>();
  private snapshot: UiState;
  private scene: TacticsSceneHandle | null = null;
  private pendingReplay: CombatReplay | null = null;
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const loaded = this.load();
    if (loaded) {
      this.state = loaded;
      this.resumed = true;
    } else {
      this.state = createGame(newSeed());
      this.aiPlanIfDue();
    }
    this.snapshot = this.buildSnapshot();
  }

  /* ---------------- store plumbing ---------------- */

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): UiState => this.snapshot;

  private notify(): void {
    this.snapshot = this.buildSnapshot();
    for (const fn of this.listeners) fn();
  }

  private buildSnapshot(): UiState {
    return {
      game: this.state,
      uiPhase: this.uiPhase,
      selectedUid: this.selectedUid,
      replaySpeed: this.replaySpeed,
      battleProgress: this.battleProgress,
      resumed: this.resumed,
    };
  }

  /* ---------------- scene wiring ---------------- */

  attachScene(scene: TacticsSceneHandle): void {
    this.scene = scene;
    this.syncScene();
  }

  detachScene(): void {
    this.scene = null;
  }

  syncScene(): void {
    if (!this.scene) return;
    const views: PlanningUnitView[] = [];
    const p1 = this.state.players.p1;
    for (const key of Object.keys(p1.board)) {
      const u = p1.board[key];
      views.push({
        uid: u.uid,
        defId: u.defId,
        star: u.star,
        team: 0,
        where: { kind: 'board', hex: parseHexKey(key) },
      });
    }
    p1.bench.forEach((u, i) => {
      if (u)
        views.push({
          uid: u.uid,
          defId: u.defId,
          star: u.star,
          team: 0,
          where: { kind: 'bench', index: i },
        });
    });
    if (!isPveRound(this.state.round)) {
      const p2 = this.state.players.p2;
      for (const key of Object.keys(p2.board)) {
        const u = p2.board[key];
        views.push({
          uid: `enemy-${u.uid}`,
          defId: u.defId,
          star: u.star,
          team: 1,
          where: { kind: 'board', hex: rotate180(parseHexKey(key)) },
        });
      }
    }
    this.scene.syncPlanning(views);
    this.scene.setSelected(this.selectedUid);
  }

  /* ---------------- player commands ---------------- */

  private cmd(c: Command): boolean {
    const res = applyCommand(this.state, 'p1', c);
    if (res.ok) {
      this.save();
      this.syncScene();
      this.notify();
    }
    return res.ok;
  }

  buy(slot: number): boolean {
    return this.cmd({ type: 'buyUnit', slot });
  }
  reroll(): boolean {
    return this.cmd({ type: 'reroll' });
  }
  buyXp(): boolean {
    return this.cmd({ type: 'buyXp' });
  }
  sell(uid: string): boolean {
    if (this.selectedUid === uid) this.selectedUid = null;
    return this.cmd({ type: 'sellUnit', uid });
  }
  moveTo(
    uid: string,
    dest: { kind: 'bench'; index: number } | { kind: 'board'; hex: Hex }
  ): boolean {
    return this.cmd({ type: 'moveUnit', uid, dest });
  }

  select(uid: string | null): void {
    this.selectedUid = this.selectedUid === uid ? null : uid;
    this.scene?.setSelected(this.selectedUid);
    this.notify();
  }

  /** Scene tap on an empty own-half target while a unit is selected. */
  tapTarget(target: { kind: 'bench'; index: number } | { kind: 'board'; hex: Hex }): void {
    if (!this.selectedUid || this.uiPhase !== 'planning') return;
    const uid = this.selectedUid;
    if (this.cmd({ type: 'moveUnit', uid, dest: target })) {
      this.selectedUid = null;
      this.scene?.setSelected(null);
      this.notify();
    }
  }

  drop(
    uid: string,
    target: { kind: 'bench'; index: number } | { kind: 'board'; hex: Hex } | null
  ): void {
    if (this.uiPhase !== 'planning') return;
    if (target) this.cmd({ type: 'moveUnit', uid, dest: target });
    else this.syncScene(); // cancelled drag — snap back
  }

  /**
   * Auto-place bench units (melee front, ranged back) — used by the render
   * harness and handy as a one-tap arrange while standing in a queue.
   */
  autoPlace(): void {
    const p = this.state.players.p1;
    const cap = unitCap(p.level);
    const cols = [3, 2, 4, 1, 5, 0, 6];
    const roster = p.bench
      .filter((u): u is NonNullable<typeof u> => !!u)
      .sort((a, b) => UNITS[b.defId].cost * b.star - UNITS[a.defId].cost * a.star);
    for (const unit of roster) {
      if (boardCount(p) >= cap) break;
      const def = UNITS[unit.defId];
      const rows =
        def.range <= 1 ? [HALF_ROWS - 1, HALF_ROWS - 2] : def.range >= 4 ? [0, 1] : [1, 0];
      let placed = false;
      for (const row of rows) {
        for (const col of cols) {
          if (!unitAtHex(p, { col, row })) {
            placed = this.cmd({
              type: 'moveUnit',
              uid: unit.uid,
              dest: { kind: 'board', hex: { col, row } },
            });
            break;
          }
        }
        if (placed) break;
      }
    }
  }

  /* ---------------- battle flow ---------------- */

  /** The AI plans as soon as a PvP round starts so you can scout its board
   *  during your own planning (TFT-style). */
  private aiPlanIfDue(): void {
    if (this.state.phase === 'planning' && !isPveRound(this.state.round)) {
      aiPlanTurn(this.state, 'p2');
    }
  }

  startBattle(): void {
    if (this.uiPhase !== 'planning' || this.state.phase !== 'planning') return;
    if (!this.scene) return;
    this.selectedUid = null;
    this.scene.setSelected(null);
    const replay = simulateRound(this.state);
    this.pendingReplay = replay;
    this.uiPhase = 'battle';
    this.battleProgress = 0;
    this.scene.playReplay(replay, this.replaySpeed);
    this.save();
    this.notify();
  }

  onReplayProgress(tick: number, total: number): void {
    this.battleProgress = total > 0 ? tick / total : 0;
    // Progress is cosmetic; avoid re-rendering React every frame.
  }

  onReplayEnd(): void {
    if (!this.pendingReplay) return;
    resolveCombat(this.state, this.pendingReplay);
    this.pendingReplay = null;
    this.aiPlanIfDue();
    this.save();
    this.syncScene();
    this.uiPhase = this.state.phase === 'gameover' ? 'gameover' : 'banner';
    this.notify();
    if (this.uiPhase === 'banner') {
      this.bannerTimer = setTimeout(() => {
        this.uiPhase = 'planning';
        this.notify();
      }, 2600);
    }
  }

  setSpeed(speed: number): void {
    this.replaySpeed = speed;
    this.scene?.setReplaySpeed(speed);
    this.notify();
  }

  skipBattle(): void {
    this.scene?.finishReplay();
  }

  newGame(seed?: number): void {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.state = createGame(seed ?? newSeed());
    this.aiPlanIfDue();
    this.uiPhase = 'planning';
    this.selectedUid = null;
    this.resumed = false;
    this.save();
    this.syncScene();
    this.notify();
  }

  /* ---------------- persistence ---------------- */

  private save(): void {
    try {
      if (this.state.phase === 'gameover') {
        localStorage.removeItem(SAVE_KEY);
      } else {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, state: this.state }));
      }
    } catch {
      // storage full/blocked — a lost save must never break the game
    }
  }

  private load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as { v: number; state: GameState };
      if (data.v !== 1 || !data.state?.players?.p1) return null;
      if (data.state.phase !== 'planning') return null;
      return data.state;
    } catch {
      return null;
    }
  }

  dispose(): void {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.listeners.clear();
  }
}

function newSeed(): number {
  // Seed generation is the ONE place allowed to be non-deterministic —
  // everything downstream of the seed is reproducible.
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}
