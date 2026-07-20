'use client';

/**
 * HeroThreePark
 * -------------
 * Mounts the {@link createParkScene} three.js park into a full-bleed canvas for
 * the homepage hero. It owns the WebGL lifecycle only — the scene itself lives
 * in `lib/three/park-scene.ts`.
 *
 * Loading strategy: pulled in via a `ssr:false` dynamic import (see
 * `hero-background.tsx`), so three.js is code-split into its own chunk and never
 * blocks SSR or the hero's LCP. A CSS gradient sky shows underneath instantly;
 * the canvas fades in once the scene's textures have loaded. The loader chip
 * itself lives in the (always-mounted) parent so it can show during the chunk
 * download too — this component just reports readiness via `onReady`.
 *
 *  - **Theme-aware:** re-applies day/night whenever next-themes resolves.
 *  - **Reduced motion:** renders a single static frame, no animation loop.
 *  - **Resilient:** if WebGL is unavailable the gradient sky simply remains.
 */

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { createParkScene, type ParkSceneHandle, type SceneTheme } from '@/lib/three/park-scene';
import { cn } from '@/lib/utils';

export function HeroThreePark({
  className,
  onReady,
  onProgress,
}: {
  className?: string;
  onReady?: () => void;
  onProgress?: (progress: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ParkSceneHandle | null>(null);
  // Keep the latest callbacks in refs so the (one-time) scene effect never needs
  // them as dependencies — otherwise an inline parent callback would rebuild the
  // whole scene on every render.
  const onReadyRef = useRef(onReady);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onReadyRef.current = onReady;
    onProgressRef.current = onProgress;
  });
  // `ready` flips once the scene's textures have loaded (or a safety timeout),
  // fading the canvas in.
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;
    // setState is never called synchronously in the effect body (that triggers
    // a cascading-render lint error) — always via rAF / timeout / async callback.
    const markReady = () => {
      if (!mounted) return;
      setReady(true);
      onReadyRef.current?.();
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initialTheme: SceneTheme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

    // Safety net: reveal the scene even if a texture never resolves.
    const safety = setTimeout(markReady, 6000);

    let handle: ParkSceneHandle | null = null;
    try {
      handle = createParkScene(canvas, {
        theme: initialTheme,
        reducedMotion,
        onReady: () => requestAnimationFrame(markReady),
        onProgress: (p) => onProgressRef.current?.(p),
      });
    } catch (err) {
      // WebGL unavailable / context-creation failed — drop the loader, keep the
      // gradient sky behind the hero.
      console.warn('[HeroThreePark] WebGL init failed, keeping gradient fallback', err);
      clearTimeout(safety);
      requestAnimationFrame(markReady);
      return () => {
        mounted = false;
      };
    }
    handleRef.current = handle;

    const host = canvas.parentElement ?? canvas;
    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0) handle.resize(w, h);
    });
    ro.observe(host);
    handle.resize(host.clientWidth || 1280, host.clientHeight || 600);

    // Suspend the render loop while the hero is scrolled out of view — without
    // this the scene keeps rendering at 60fps behind the whole page. (The scene
    // itself already pauses on document.hidden; this adds the scroll case.)
    const io = new IntersectionObserver(([entry]) => {
      handle.setSuspended(!entry.isIntersecting);
    });
    io.observe(host);

    return () => {
      mounted = false;
      clearTimeout(safety);
      ro.disconnect();
      io.disconnect();
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  // Push theme changes into the live scene without rebuilding it.
  useEffect(() => {
    if (!resolvedTheme) return;
    handleRef.current?.setTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        'absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ease-out',
        ready ? 'opacity-100' : 'opacity-0',
        className
      )}
    />
  );
}

export default HeroThreePark;
