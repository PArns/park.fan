'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assistantGate } from '@/lib/assistant/config';
import { openParky } from '@/lib/assistant/open';
import {
  ParkyLogo,
  actLength,
  type ParkyAct,
  type ParkyCue,
} from '@/components/assistant/parky-logo';
import {
  SEASONS,
  showyPool,
  WEATHER_ACT,
  WEATHERS,
  type ParkySeason,
  type ParkyWeather,
} from '@/lib/assistant/parky-look';
import { previewParkyLook, useParkyLook } from '@/lib/assistant/use-parky-look';

/**
 * Whether Parky shows here, inviting this visitor first: Parky's own page shows Parky to everybody
 * while it is switched on, whatever the rollout share says.
 */
function useInvitedGate() {
  useEffect(() => assistantGate.invite(), []);
  return useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getStatus,
    assistantGate.getServerStatus
  );
}

/**
 * The page's one real way into the chat: opens Parky's window, or says Parky is resting when it is
 * switched off. Until the gate has decided it waits, disabled.
 */
export function AskParkyButton({ label, off }: { label: string; off: string }) {
  const status = useInvitedGate();
  if (status === 'off') return <p className="text-muted-foreground text-sm">{off}</p>;
  return (
    <button
      type="button"
      onClick={() => openParky()}
      disabled={status === 'pending'}
      className={cn(
        'from-primary to-status-operating inline-flex items-center gap-2 rounded-full bg-gradient-to-br px-6 py-3 text-base font-semibold text-white shadow-lg',
        'transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none',
        'focus-visible:ring-primary focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:opacity-60'
      )}
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      {label}
    </button>
  );
}

/** Parky in the page itself, at any size, with its life of its own. */
export function ParkyFigure({ className }: { className?: string }) {
  return <ParkyLogo idle className={cn('drop-shadow-[0_12px_28px_rgb(0_0_0/0.35)]', className)} />;
}

/** A pause between two runs of a tile's act, so the stage never moves all at once. */
const TILE_PAUSE_MS = 2_400;

/**
 * Acts on a loop, one after another, played while `tile` is on screen; the cue to hand Parky.
 * Nothing plays under reduced motion.
 */
function useActLoop(tile: HTMLElement | null, acts: readonly ParkyAct[], delay: number) {
  const [cue, setCue] = useState<ParkyCue | null>(null);
  const key = acts.join(' ');
  useEffect(() => {
    const queue = key ? (key.split(' ') as ParkyAct[]) : [];
    if (!tile || !queue.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let turn = 0;
    const run = (wait: number) => {
      timer = setTimeout(() => {
        const act = queue[turn++ % queue.length];
        setCue((last) => ({ act, id: (last?.id ?? 0) + 1 }));
        run(actLength(act) + TILE_PAUSE_MS);
      }, wait);
    };
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (entry.isIntersecting) run(delay);
    });
    observer.observe(tile);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [tile, key, delay]);
  return cue;
}

/**
 * One act on a loop, played while the tile is on screen. The tile clips what a ride takes out of
 * it: the launch runs up out of the top, the airtime hills off to the left and back in.
 */
function StageTile({ act, label, delay }: { act: ParkyAct; label: string; delay: number }) {
  const [tile, setTile] = useState<HTMLElement | null>(null);
  const cue = useActLoop(tile, [act], delay);
  return (
    <figure
      ref={setTile}
      className="from-primary/10 to-status-operating/10 border-border/60 relative flex aspect-square flex-col items-center justify-end overflow-hidden rounded-3xl border bg-gradient-to-b p-3"
    >
      <ParkyLogo idle cue={cue} className="mb-1 size-20 sm:size-24" />
      <figcaption className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </figcaption>
    </figure>
  );
}

/**
 * A few of Parky's acts side by side, each on its own loop and a little apart so they do not move
 * as one, and a last tile that keeps the rest a secret.
 */
export function ParkyStage({
  tiles,
  more,
}: {
  tiles: Array<{ act: ParkyAct; label: string }>;
  /** The secret tile's caption: there is more to find. */
  more: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {tiles.map((tile, i) => (
        <StageTile key={tile.act} act={tile.act} label={tile.label} delay={400 + (i % 3) * 700} />
      ))}
      <figure className="border-border/60 relative flex aspect-square flex-col items-center justify-end overflow-hidden rounded-3xl border border-dashed p-3">
        <span
          aria-hidden="true"
          className="text-primary/60 mb-3 flex size-20 items-center justify-center text-6xl font-black sm:size-24 sm:text-7xl"
        >
          ?
        </span>
        <figcaption className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
          {more}
        </figcaption>
      </figure>
    </div>
  );
}

/** The preview's captions: its title, the two rows, and a name for each season and weather. */
type LookLabels = Record<
  'title' | 'season' | 'weather' | 'none' | ParkySeason | ParkyWeather,
  string
>;

/** A row of outfits to pick from, one pressed. */
function LookRow<T extends string>({
  label,
  none,
  options,
  labels,
  picked,
  onPick,
}: {
  label: string;
  none: string;
  options: readonly T[];
  labels: Record<T, string>;
  picked: T | null;
  onPick: (option: T | null) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground mr-1 text-xs font-semibold tracking-widest uppercase">
        {label}
      </span>
      {[null, ...options].map((option) => (
        <button
          key={option ?? 'none'}
          type="button"
          aria-pressed={picked === option}
          onClick={() => onPick(option)}
          className={cn(
            'rounded-2xl border px-3.5 py-1.5 text-sm transition-colors motion-reduce:transition-none',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none',
            picked === option
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-primary/30 bg-primary/10 text-foreground hover:bg-primary/20'
          )}
        >
          {option ? labels[option] : none}
        </button>
      ))}
    </div>
  );
}

/**
 * Parky's outfits to try on: a season and a weather, worn by every Parky on the page, with a Parky
 * that plays the acts the picked look brings along. Leaving the page hands the look back to the
 * calendar and the park's weather.
 */
export function ParkyLookPicker({ labels }: { labels: LookLabels }) {
  const look = useParkyLook();
  useEffect(() => () => previewParkyLook(null), []);
  const [tile, setTile] = useState<HTMLElement | null>(null);
  const acts = [
    ...new Set<ParkyAct>([
      ...showyPool([], look),
      ...(look.weather ? [WEATHER_ACT[look.weather]] : []),
    ]),
  ];
  const cue = useActLoop(tile, acts, 400);
  return (
    <div className="border-border/60 grid items-center gap-6 rounded-3xl border p-5 sm:grid-cols-[auto_1fr] sm:p-6">
      <figure
        ref={setTile}
        className="from-primary/10 to-status-operating/10 relative mx-auto grid size-40 place-items-center rounded-3xl bg-gradient-to-b"
      >
        <ParkyLogo idle cue={cue} className="size-24" />
      </figure>
      <div className="space-y-4">
        <p className="text-lg font-semibold">{labels.title}</p>
        <LookRow
          label={labels.season}
          none={labels.none}
          options={SEASONS}
          labels={labels}
          picked={look.season}
          onPick={(season) => previewParkyLook({ ...look, season })}
        />
        <LookRow
          label={labels.weather}
          none={labels.none}
          options={WEATHERS}
          labels={labels}
          picked={look.weather}
          onPick={(weather) => previewParkyLook({ ...look, weather })}
        />
      </div>
    </div>
  );
}
