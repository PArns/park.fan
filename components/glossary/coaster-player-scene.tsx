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
import { getCoasterElement } from '@/lib/three/coaster/elements';
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
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<CoasterSceneHandle | null>(null);
  const scrubbingRef = useRef(false);
  // Progress is rendered imperatively (fill width + range value) instead of via React state:
  // onTick fires every animation frame, and a setState there re-rendered the whole transport
  // bar (~60×/s) for the lifetime of the player.
  const fillRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [view, setView] = useState<CoasterView>(
    () => (getCoasterElement(element)?.defaultView as CoasterView | undefined) ?? 'front'
  );
  const [keyPoints, setKeyPoints] = useState<{ t: number; label: string }[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let mounted = true;

    // The canvas is created here per initialisation, not rendered in JSX: `scene.ts` force-loses
    // the WebGL context on teardown (browsers cap live contexts), and a force-lost canvas can never
    // get a fresh one, so a reused canvas would be dead on every element switch and every
    // StrictMode re-run.
    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 h-full w-full';
    canvas.setAttribute('aria-hidden', 'true');
    // First child so the loading/controls overlays keep painting above it.
    host.prepend(canvas);

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
          if (!scrubbingRef.current) {
            if (fillRef.current) fillRef.current.style.width = `${p * 100}%`;
            if (rangeRef.current) rangeRef.current.value = String(p);
          }
          setPlaying(pl); // bails out while unchanged — no per-frame re-render
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
        canvas.remove();
      };
    }
    handleRef.current = handle;

    // A new scene starts at 0, so reset the imperative progress UI: under reduced motion no onTick
    // would overwrite the previous element's position.
    if (fillRef.current) fillRef.current.style.width = '0%';
    if (rangeRef.current) rangeRef.current.value = '0';

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
      // dispose() force-loses this canvas's context, so the node is spent —
      // drop it and let the next run create a fresh one.
      canvas.remove();
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
    if (fillRef.current) fillRef.current.style.width = `${v * 100}%`;
    if (rangeRef.current) rangeRef.current.value = String(v);
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
      {/* The <canvas> is NOT rendered here — the effect creates one per
          initialisation and prepends it. See the effect for why. */}
      <div ref={hostRef} className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
        {!ready && (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center bg-[linear-gradient(to_bottom,#7fc2f3_0%,#cdeeff_100%)] text-sm dark:bg-[linear-gradient(to_bottom,#142150_0%,#33508c_100%)] dark:text-white/80">
            {labels.loading}
          </div>
        )}

        {ready && !failed && (
          // Below `sm` the labels stay hidden (three names would cover the picture on a phone), so
          // each button gets a thumb-sized box and an `aria-label`.
          <div className="absolute top-2 right-2 flex gap-2 rounded-full bg-black/35 p-1 backdrop-blur-sm">
            {VIEW_META.map(({ id, icon: Icon, key }) => (
              <button
                key={id}
                type="button"
                onClick={() => onView(id)}
                aria-pressed={view === id}
                aria-label={labels[key] as string}
                title={labels[key] as string}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors max-sm:min-h-9 max-sm:min-w-9',
                  view === id ? 'bg-white text-gray-900' : 'text-white/85 hover:bg-white/15'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{labels[key] as string}</span>
              </button>
            ))}
          </div>
        )}

        {/* park.fan lockup, bottom-left, light and dark variants with the theme. The artwork is
            ink-tight, so these heights are the mark's own. */}
        {!failed && (
          <div className="pointer-events-none absolute bottom-2.5 left-3 z-10 flex items-center gap-[11px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] select-none">
            <Image
              src="/logo-small-dark.svg"
              width={12}
              height={17}
              alt=""
              aria-hidden="true"
              className="hidden h-[17px] w-auto dark:block"
            />
            <Image
              src="/logo-small.svg"
              width={12}
              height={17}
              alt=""
              aria-hidden="true"
              className="block h-[17px] w-auto dark:hidden"
            />
            <Image
              src="/parkfan-dark.svg"
              width={55}
              height={13}
              alt="park.fan"
              className="hidden h-[13px] w-auto dark:block"
            />
            <Image
              src="/parkfan.svg"
              width={55}
              height={13}
              alt="park.fan"
              className="block h-[13px] w-auto dark:hidden"
            />
          </div>
        )}
      </div>

      {/* Transport bar, 57 px (border, 2×10 px padding, 36 px buttons), rendered in every state
          and disabled until `ready`, so the height holds from the dynamic-import placeholder in
          `coaster-player.tsx` through the scene going live. Not hidden on `failed` either: the
          placeholder already drew the row, so removing it would shift the page. */}
      <div className="bg-background/80 flex items-center gap-3 border-t px-3 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={onToggle}
          disabled={!ready}
          aria-label={playing ? labels.pause : labels.play}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>
        <button
          type="button"
          onClick={onReplay}
          disabled={!ready}
          aria-label={labels.replay}
          title={labels.replay}
          className="text-muted-foreground hover:text-foreground inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Timeline with key-point markers — fixed-height row so the range
            thumb centres exactly on the groove regardless of intrinsic size. */}
        <div className="relative flex-1 self-stretch">
          <div className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2">
            <div className="bg-muted-foreground/20 pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />
            {/* progress fill — width driven imperatively from onTick/onScrub */}
            <div
              ref={fillRef}
              className="bg-primary pointer-events-none absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full"
              style={{ width: '0%' }}
            />
            {/* interactive scrubber — fills the row, thumb sits on the groove */}
            <input
              ref={rangeRef}
              type="range"
              min={0}
              max={1}
              step={0.001}
              defaultValue={0}
              disabled={!ready}
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
                /* Under touch the markers leave the hit path so the slider owns the whole track: a
                   finger cannot hit a 22 px dot, and the dots covered half the track. A mouse keeps
                   them. The axis is the pointer, not the viewport (`pointer-fine:`). */
                className="group pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 p-1.5 pointer-fine:pointer-events-auto"
                style={{ left: `${k.t * 100}%` }}
                aria-label={labels.keys[k.label] ?? k.label}
              >
                <span className="border-background bg-primary/70 group-hover:bg-primary block h-2.5 w-2.5 rounded-full border" />
              </button>
            ))}
          </div>
        </div>
      </div>

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
