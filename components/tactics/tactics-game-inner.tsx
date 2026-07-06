'use client';

/**
 * The interactive body of Queue Tactics: WebGL canvas (three.js scene) plus
 * the DOM HUD, glued together by GameController. Loaded client-only behind a
 * `ssr:false` dynamic import (see tactics-game.tsx).
 *
 * Exposes a `window.__TACTICS__` hook so the headless render harness can
 * drive deterministic states (seeded games, forced battles, camera/theme
 * switches) for the mandatory all-perspectives visual verification.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { GameController } from '@/lib/tactics/controller';
import {
  createTacticsScene,
  type CameraPreset,
  type SceneTheme,
  type TacticsSceneHandle,
} from '@/lib/three/tactics/scene';
import { Hud } from './hud';

declare global {
  interface Window {
    __TACTICS__?: {
      newGame(seed: number): void;
      buy(slot: number): boolean;
      reroll(): boolean;
      autoPlace(): void;
      fight(): void;
      skip(): void;
      setCamera(c: CameraPreset): void;
      setTheme(t: SceneTheme): void;
      setSpeed(s: number): void;
      state(): unknown;
      uiPhase(): string;
    };
  }
}

export default function TacticsGameInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Lazy state init: exactly one controller per mounted game (client-only).
  const [controller] = useState(() => new GameController());

  const ui = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  );
  const [theme, setTheme] = useState<SceneTheme>('dark');
  const [camera, setCamera] = useState<CameraPreset>('default');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const sceneRef = useRef<TacticsSceneHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: TacticsSceneHandle | null = null;
    try {
      scene = createTacticsScene(canvas, {
        theme: 'dark',
        onReady: () => setReady(true),
        onTapUnit: (uid) => controller.select(uid),
        onTapTarget: (t) => controller.tapTarget(t),
        onTapVoid: () => controller.select(null),
        onDrop: (uid, target) => controller.drop(uid, target),
        onReplayProgress: (t, total) => controller.onReplayProgress(t, total),
        onReplayEnd: () => controller.onReplayEnd(),
      });
    } catch (e) {
      console.warn('[QueueTactics] WebGL init failed', e);
      queueMicrotask(() => setFailed(true));
      return;
    }
    sceneRef.current = scene;
    controller.attachScene(scene);

    const host = canvas.parentElement ?? canvas;
    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0) scene!.resize(w, h);
    });
    ro.observe(host);
    scene.resize(host.clientWidth || 800, host.clientHeight || 600);

    // Harness/test hook.
    window.__TACTICS__ = {
      newGame: (seed) => controller.newGame(seed),
      buy: (slot) => controller.buy(slot),
      reroll: () => controller.reroll(),
      autoPlace: () => controller.autoPlace(),
      fight: () => controller.startBattle(),
      skip: () => controller.skipBattle(),
      setCamera: (c) => {
        setCamera(c);
        scene!.setCamera(c);
      },
      setTheme: (t) => {
        setTheme(t);
        scene!.setTheme(t);
      },
      setSpeed: (s) => controller.setSpeed(s),
      state: () => controller.getSnapshot().game,
      uiPhase: () => controller.getSnapshot().uiPhase,
    };

    return () => {
      delete window.__TACTICS__;
      ro.disconnect();
      controller.detachScene();
      scene!.dispose();
      sceneRef.current = null;
    };
    // controller is a stable ref for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => controller.dispose(), [controller]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#101b33]">
      <canvas ref={canvasRef} className="block h-full w-full touch-none select-none" />
      {!ready && !failed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
          Setting up the arena…
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
          WebGL is not available on this device/browser, so the arena cannot render.
        </div>
      )}
      {ready && !failed && (
        <Hud
          ui={ui}
          theme={theme}
          camera={camera}
          onBuy={(s) => controller.buy(s)}
          onReroll={() => controller.reroll()}
          onBuyXp={() => controller.buyXp()}
          onFight={() => controller.startBattle()}
          onSell={(uid) => controller.sell(uid)}
          onDeselect={() => controller.select(null)}
          onSpeed={(s) => controller.setSpeed(s)}
          onSkip={() => controller.skipBattle()}
          onNewGame={() => controller.newGame()}
          onTheme={(t) => {
            setTheme(t);
            sceneRef.current?.setTheme(t);
          }}
          onCamera={(c) => {
            setCamera(c);
            sceneRef.current?.setCamera(c);
          }}
        />
      )}
    </div>
  );
}
