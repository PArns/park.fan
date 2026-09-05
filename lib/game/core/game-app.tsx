'use client';

/**
 * The client root of `/game`: owns the canvas, the store and the engine lifecycle. Boots the host
 * through a dynamic import so Babylon and every module land in their own chunks, disposes on
 * unmount (route change, back navigation) so no WebGL/WebGPU context leaks, and renders the shell
 * until `world:ready`.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { GameStore } from './store';
import { useGameStore } from './use-game-store';
import { GameShell } from './game-shell';
import { GameErrorBoundary } from './error-boundary';
import { createTranslator, type GameLocale, type GameStringKey } from '../i18n';
import type { GameHandle } from './host';
import { GameHud } from '../ui/hud';

interface GameAppProps {
  locale: GameLocale;
}

export function GameApp({ locale }: GameAppProps) {
  const store = useMemo(() => new GameStore(), []);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const [attempt, setAttempt] = useState(0);
  const phase = useGameStore(store, (s) => s.phase);
  const bootStep = useGameStore(store, (s) => s.bootStep);
  const progress = useGameStore(store, (s) => s.progress);
  const error = useGameStore(store, (s) => s.error);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    const abort = new AbortController();
    store.set({ phase: 'booting', bootStep: 'init', progress: 0, error: null });
    import('./host')
      .then(({ boot }) =>
        boot({ canvas, store, locale, search: window.location.search, signal: abort.signal })
      )
      .then((handle) => {
        if (disposed) {
          handle.dispose();
          return;
        }
        handleRef.current = handle;
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'BootAbortedError') return;
        console.error('[game] boot failed', err);
        if (!disposed)
          store.set({ phase: 'failed', error: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      disposed = true;
      abort.abort();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [store, locale, attempt]);

  const stepLabel =
    bootStep.startsWith('module:') || bootStep.startsWith('showcase:')
      ? `${t('boot.modules')} · ${bootStep.split(':')[1]}`
      : t(`boot.${bootStep}` as GameStringKey);

  return (
    <div className="relative h-full w-full bg-[oklch(0.11_0.02_241)]" data-game-root="">
      <canvas ref={canvasRef} className="game-canvas" tabIndex={0} aria-label={t('app.title')} />
      {phase === 'booting' || phase === 'failed' ? (
        <GameShell
          title={t('app.title')}
          tagline={t('app.tagline')}
          step={stepLabel}
          progress={progress}
          error={phase === 'failed' ? t('boot.failed') : null}
          errorHint={
            phase === 'failed' ? `${t('boot.failed.hint')}${error ? ` (${error})` : ''}` : undefined
          }
          retryLabel={t('boot.retry')}
          onRetry={() => setAttempt((a) => a + 1)}
        />
      ) : null}
      <GameErrorBoundary
        fallback={(err) => (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-3">
            <p className="pointer-events-auto rounded-md border border-white/10 bg-(--game-hud) px-3 py-1.5 text-xs text-(--game-danger) backdrop-blur-xl">
              {t('module.failed', { id: 'hud' })} {err.message}
            </p>
          </div>
        )}
      >
        <GameHud store={store} t={t} locale={locale} getHandle={() => handleRef.current} />
      </GameErrorBoundary>
    </div>
  );
}
