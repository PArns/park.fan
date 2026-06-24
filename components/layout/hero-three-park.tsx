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
 * blocks SSR or the hero's LCP. A CSS gradient sky shows underneath instantly; a
 * small loader overlay runs until the scene's textures have loaded, then the
 * canvas fades in.
 *
 *  - **Theme-aware:** re-applies day/night whenever next-themes resolves.
 *  - **Reduced motion:** renders a single static frame, no animation loop.
 *  - **Resilient:** if WebGL is unavailable the gradient sky simply remains.
 */

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { createParkScene, type ParkSceneHandle, type SceneTheme } from '@/lib/three/park-scene';
import { cn } from '@/lib/utils';

export function HeroThreePark({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ParkSceneHandle | null>(null);
  // `ready` flips once the scene's textures have loaded (or a safety timeout),
  // fading the canvas in and hiding the loader.
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;
    // setState is never called synchronously in the effect body (that triggers
    // a cascading-render lint error) — always via rAF / timeout / async callback.
    const markReady = () => {
      if (mounted) setReady(true);
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

    return () => {
      mounted = false;
      clearTimeout(safety);
      ro.disconnect();
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
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ease-out',
          ready ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
      {/* Loader: a small chip near the bottom of the hero, clear of the content
          card, that fades out once the 3D park is ready. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-6 flex justify-center transition-opacity duration-500',
          ready ? 'opacity-0' : 'opacity-100'
        )}
      >
        <span className="bg-background/55 text-foreground/80 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading 3D park…
        </span>
      </div>
    </>
  );
}

export default HeroThreePark;
