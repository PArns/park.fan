'use client';

/**
 * The interactive body of the glossary 3-D coaster player: a WebGL canvas
 * driven by {@link createCoasterScene} plus the transport UI (play/pause, a
 * scrubbable timeline with the element's key-points marked, and a Front /
 * Follow / Onboard view switch). Loaded client-only behind a `ssr:false`
 * dynamic import (see coaster-player.tsx) so three.js never hits SSR/LCP.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Play, Pause, RotateCcw, Eye, Video, Armchair } from 'lucide-react';
import {
  createCoasterScene,
  type CoasterSceneHandle,
  type CoasterView,
  type SceneTheme,
} from '@/lib/three/coaster/scene';
import { cn } from '@/lib/utils';

export interface CoasterPlayerLabels {
  play: string;
  pause: string;
  replay: string;
  view: string;
  viewFront: string;
  viewFollow: string;
  viewOnboard: string;
  loading: string;
  keys: Record<string, string>;
}

interface Props {
  element: string;
  labels: CoasterPlayerLabels;
  className?: string;
}

const VIEW_META: { id: CoasterView; icon: typeof Eye; key: keyof CoasterPlayerLabels }[] = [
  { id: 'front', icon: Eye, key: 'viewFront' },
  { id: 'follow', icon: Video, key: 'viewFollow' },
  { id: 'onboard', icon: Armchair, key: 'viewOnboard' },
];

export default function CoasterPlayerScene({ element, labels, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<CoasterSceneHandle | null>(null);
  const scrubbingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState<CoasterView>('front');
  const [keyPoints, setKeyPoints] = useState<{ t: number; label: string }[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mounted = true;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initialTheme: SceneTheme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

    let handle: CoasterSceneHandle | null = null;
    try {
      handle = createCoasterScene(canvas, {
        element,
        theme: initialTheme,
        reducedMotion,
        onReady: () => {
          if (!mounted || !handle) return;
          setReady(true);
          setKeyPoints([...handle.keyPoints]);
          setPlaying(handle.isPlaying());
        },
        onTick: (p, pl) => {
          if (!mounted) return;
          if (!scrubbingRef.current) setProgress(p);
          setPlaying(pl);
        },
      });
    } catch (e) {
      console.warn('[CoasterPlayer] WebGL init failed', e);
      // Defer out of the synchronous effect body to avoid a cascading render.
      queueMicrotask(() => {
        if (mounted) {
          setFailed(true);
          setReady(true);
        }
      });
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
    handle.resize(host.clientWidth || 640, host.clientHeight || 420);

    // Pause when scrolled out of view or the tab is hidden (perf + battery).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (!e.isIntersecting) handle.pause();
      },
      { threshold: 0.05 }
    );
    io.observe(host);
    const onVis = () => {
      if (document.hidden) handle.pause();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      mounted = false;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      handle.dispose();
      handleRef.current = null;
    };
  }, [element]);

  // Push theme changes into the live scene.
  useEffect(() => {
    if (resolvedTheme) handleRef.current?.setTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [resolvedTheme]);

  const onToggle = useCallback(() => {
    const h = handleRef.current;
    if (!h) return;
    if (h.getProgress() >= 0.999) h.seek(0);
    setPlaying(h.toggle());
  }, []);
  const onReplay = useCallback(() => {
    const h = handleRef.current;
    if (!h) return;
    h.seek(0);
    h.play();
    setPlaying(h.isPlaying());
  }, []);
  const onScrub = useCallback((v: number) => {
    scrubbingRef.current = true;
    setProgress(v);
    handleRef.current?.seek(v);
  }, []);
  const endScrub = useCallback(() => {
    scrubbingRef.current = false;
  }, []);
  const onView = useCallback((v: CoasterView) => {
    setView(v);
    handleRef.current?.setView(v);
  }, []);

  return (
    <div
      className={cn(
        'border-primary/15 bg-muted/40 relative w-full overflow-hidden rounded-xl border shadow-sm',
        className
      )}
    >
      {/* Canvas stage */}
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        {/* Loading / fallback overlay */}
        {!ready && (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center bg-[linear-gradient(to_bottom,#7fc2f3_0%,#cdeeff_100%)] text-sm dark:bg-[linear-gradient(to_bottom,#142150_0%,#33508c_100%)] dark:text-white/80">
            {labels.loading}
          </div>
        )}

        {/* View switch — top-right overlay */}
        {ready && !failed && (
          <div className="absolute top-2 right-2 flex gap-1 rounded-full bg-black/35 p-1 backdrop-blur-sm">
            {VIEW_META.map(({ id, icon: Icon, key }) => (
              <button
                key={id}
                type="button"
                onClick={() => onView(id)}
                aria-pressed={view === id}
                title={labels[key] as string}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  view === id ? 'bg-white text-gray-900' : 'text-white/85 hover:bg-white/15'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{labels[key] as string}</span>
              </button>
            ))}
          </div>
        )}

        {/* park.fan logo (pin + wordmark) — embedded branding, bottom-left.
            Light/dark variants toggle with the theme, matching the header. */}
        {!failed && (
          <div className="pointer-events-none absolute bottom-2.5 left-3 z-10 flex items-center gap-1.5 select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            <Image
              src="/logo-small-dark.svg"
              width={26}
              height={30}
              alt=""
              aria-hidden="true"
              className="hidden h-5 w-auto dark:block"
            />
            <Image
              src="/logo-small.svg"
              width={26}
              height={30}
              alt=""
              aria-hidden="true"
              className="block h-5 w-auto dark:hidden"
            />
            <Image
              src="/parkfan-dark.svg"
              width={84}
              height={24}
              alt="park.fan"
              className="hidden h-4 w-auto dark:block"
            />
            <Image
              src="/parkfan.svg"
              width={84}
              height={24}
              alt="park.fan"
              className="block h-4 w-auto dark:hidden"
            />
          </div>
        )}
      </div>

      {/* Transport bar */}
      {ready && !failed && (
        <div className="bg-background/80 flex items-center gap-3 border-t px-3 py-2.5 backdrop-blur">
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? labels.pause : labels.play}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
          </button>
          <button
            type="button"
            onClick={onReplay}
            aria-label={labels.replay}
            title={labels.replay}
            className="text-muted-foreground hover:text-foreground inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Timeline with key-point markers — fixed-height row so the range
              thumb centres exactly on the groove regardless of intrinsic size. */}
          <div className="relative flex-1 self-stretch">
            <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2">
              {/* groove */}
              <div className="bg-muted-foreground/20 pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />
              {/* progress fill */}
              <div
                className="bg-primary pointer-events-none absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
              {/* interactive scrubber — fills the row, thumb sits on the groove */}
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                onChange={(e) => onScrub(parseFloat(e.target.value))}
                onPointerDown={() => {
                  scrubbingRef.current = true;
                }}
                onPointerUp={endScrub}
                onBlur={endScrub}
                aria-label={labels.view}
                className="coaster-scrubber absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent"
              />
              {/* key-point markers — above the scrubber so they stay clickable */}
              {keyPoints.map((k, i) => (
                <button
                  key={i}
                  type="button"
                  title={labels.keys[k.label] ?? k.label}
                  onClick={() => {
                    onScrub(k.t);
                    endScrub();
                  }}
                  className="group absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 p-1.5"
                  style={{ left: `${k.t * 100}%` }}
                  aria-label={labels.keys[k.label] ?? k.label}
                >
                  <span className="border-background bg-primary/70 group-hover:bg-primary block h-2.5 w-2.5 rounded-full border" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .coaster-scrubber::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: var(--primary, #2b6cff);
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
        .coaster-scrubber::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: var(--primary, #2b6cff);
          border: 2px solid #fff;
          cursor: pointer;
        }
        .coaster-scrubber::-webkit-slider-runnable-track,
        .coaster-scrubber::-moz-range-track {
          background: transparent;
          height: 16px;
        }
      `}</style>
    </div>
  );
}
