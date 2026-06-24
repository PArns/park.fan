'use client';

/**
 * HeroThreePark
 * -------------
 * Mounts the {@link createParkScene} three.js diorama into a full-bleed canvas
 * for the homepage hero. It owns the WebGL lifecycle only — the scene itself
 * lives in `lib/three/park-scene.ts`.
 *
 * Loading strategy: this component is pulled in via a `ssr:false` dynamic
 * import (see `hero-background.tsx`), so three.js is code-split into its own
 * chunk and never blocks SSR or the hero's LCP. A CSS gradient sky is painted
 * underneath instantly; the canvas fades in once WebGL has its first frame.
 *
 *  - **Theme-aware:** re-applies day/night whenever next-themes resolves.
 *  - **Reduced motion:** renders a single static frame, no animation loop.
 *  - **Resilient:** if WebGL is unavailable the gradient sky simply remains.
 */

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { createParkScene, type ParkSceneHandle, type SceneTheme } from '@/lib/three/park-scene';
import { cn } from '@/lib/utils';

export function HeroThreePark({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ParkSceneHandle | null>(null);
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // next-themes may report `undefined` on the first client render, so read the
    // <html> class the theme script set pre-hydration — the first frame is correct.
    const initialTheme: SceneTheme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

    let handle: ParkSceneHandle | null = null;
    try {
      handle = createParkScene(canvas, { theme: initialTheme, reducedMotion });
    } catch (err) {
      // WebGL unavailable / context-creation failed — leave the gradient sky.
      console.warn('[HeroThreePark] WebGL init failed, keeping gradient fallback', err);
      return;
    }
    handleRef.current = handle;

    const host = canvas.parentElement ?? canvas;
    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0) handle!.resize(w, h);
    });
    ro.observe(host);
    // Size once up front in case the observer's first callback is delayed.
    handle.resize(host.clientWidth || 1280, host.clientHeight || 600);

    // createParkScene already rendered the first frame synchronously, so fading
    // in on the next frame avoids a blank flash. Deferring the setState to a rAF
    // callback also keeps it out of the effect body (no cascading-render warning).
    const raf = requestAnimationFrame(() => setReady(true));

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      handle?.dispose();
      handleRef.current = null;
    };
    // Mount once. Theme changes are pushed imperatively via the effect below.
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
        'absolute inset-0 h-full w-full transition-opacity duration-1000 ease-out',
        ready ? 'opacity-100' : 'opacity-0',
        className
      )}
    />
  );
}

export default HeroThreePark;
