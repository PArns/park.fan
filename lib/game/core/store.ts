/**
 * The HUD's view of the game: a tiny external store read through `useSyncExternalStore`. The
 * engine writes it from the render loop and from worker messages; React reads it. Nothing in here
 * is simulation state — it is a projection for the UI.
 */

import type { Capabilities, Clock, EnvironmentState, QualityPreset, Speed } from './types';

export interface Notice {
  id: number;
  level: 'info' | 'warning' | 'error';
  text: string;
  /** Deduplication key; a notice with the same key replaces the older one. */
  key?: string;
  at: number;
}

export interface Metrics {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  simTickMs: number;
  guests: number;
  activeMeshes: number;
}

export interface GameState {
  phase: 'booting' | 'ready' | 'reduced' | 'failed';
  bootStep: string;
  progress: number;
  error: string | null;
  engine: 'webgpu' | 'webgl2' | 'none';
  preset: QualityPreset;
  capabilities: Capabilities | null;
  clock: Clock;
  cash: number;
  environment: EnvironmentState | null;
  metrics: Metrics;
  notices: Notice[];
  failedModules: string[];
  /** Module-owned HUD state, keyed by module id (selected tool, open panel, …). */
  ui: Record<string, unknown>;
  selectedEntity: string | null;
}

const initial: GameState = {
  phase: 'booting',
  bootStep: 'init',
  progress: 0,
  error: null,
  engine: 'none',
  preset: 'high',
  capabilities: null,
  clock: { day: 1, minute: 540, speed: 1 },
  cash: 0,
  environment: null,
  metrics: {
    fps: 0,
    frameMs: 0,
    drawCalls: 0,
    triangles: 0,
    simTickMs: 0,
    guests: 0,
    activeMeshes: 0,
  },
  notices: [],
  failedModules: [],
  ui: {},
  selectedEntity: null,
};

export class GameStore {
  private state: GameState = initial;
  private listeners = new Set<() => void>();
  private noticeSeq = 0;

  get = (): GameState => this.state;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  set(patch: Partial<GameState> | ((s: GameState) => Partial<GameState>)): void {
    const p = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...p };
    for (const fn of this.listeners) fn();
  }

  setUi(moduleId: string, value: unknown): void {
    this.set((s) => ({ ui: { ...s.ui, [moduleId]: value } }));
  }

  notify(level: Notice['level'], text: string, key?: string): void {
    const notice: Notice = { id: ++this.noticeSeq, level, text, key, at: Date.now() };
    this.set((s) => ({
      notices: [...s.notices.filter((n) => !key || n.key !== key), notice].slice(-6),
    }));
  }

  dismiss(id: number): void {
    this.set((s) => ({ notices: s.notices.filter((n) => n.id !== id) }));
  }

  setSpeed(speed: Speed): void {
    this.set((s) => ({ clock: { ...s.clock, speed } }));
  }
}
