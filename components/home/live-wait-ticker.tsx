'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { TickerItem } from '@/lib/api/types';

const crowdBorderColor: Record<string, string> = {
  very_low: 'border-crowd-very-low/60 text-crowd-very-low',
  low: 'border-crowd-low/60 text-crowd-low',
  moderate: 'border-crowd-moderate/60 text-crowd-moderate',
  high: 'border-crowd-high/60 text-crowd-high',
  very_high: 'border-crowd-very-high/60 text-crowd-very-high',
  extreme: 'border-crowd-extreme/60 text-crowd-extreme',
};

function WaitBadge({
  waitTime,
  crowdLevel,
  trend,
}: {
  waitTime: number;
  crowdLevel: string | null;
  trend?: TickerItem['trend'];
}) {
  const colors = crowdLevel
    ? (crowdBorderColor[crowdLevel] ??
      'border-border text-muted-foreground dark:border-white/30 dark:text-white/70')
    : 'border-border text-muted-foreground dark:border-white/30 dark:text-white/70';
  return (
    <span
      className={`flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${colors}`}
    >
      {waitTime} min
      {trend === 'up' || trend === 'increasing' || trend === 'rising' ? (
        <TrendingUp className="text-trend-up h-2.5 w-2.5" />
      ) : trend === 'down' || trend === 'decreasing' || trend === 'falling' ? (
        <TrendingDown className="text-trend-down h-2.5 w-2.5" />
      ) : null}
    </span>
  );
}

function TickerItemLink({ item }: { item: TickerItem }) {
  const href = item.url
    ? convertApiUrlToFrontendUrl(item.url)
    : `/parks/${item.continentSlug}/${item.countrySlug}/${item.citySlug}/${item.parkSlug}/${item.attractionSlug}`;

  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className="flex shrink-0 items-center gap-2 px-5 transition-opacity hover:opacity-70"
    >
      <span className="text-muted-foreground text-xs dark:text-white/50">{item.parkName}</span>
      <span className="text-muted-foreground/40 text-xs dark:text-white/30">›</span>
      <span className="text-foreground text-sm font-semibold dark:text-white">
        {item.attractionName}
      </span>
      <WaitBadge waitTime={item.waitTime} crowdLevel={item.crowdLevel} trend={item.trend} />
    </Link>
  );
}

function Separator() {
  return (
    <span className="text-muted-foreground/30 shrink-0 px-1 text-xs select-none dark:text-white/20">
      •
    </span>
  );
}

interface LiveWaitTickerProps {
  initialItems: TickerItem[];
}

export function LiveWaitTicker({ initialItems }: LiveWaitTickerProps) {
  const t = useTranslations('home.hero');
  const [paused, setPaused] = useState(false);
  // Only the >=md ticker is shown (see page.tsx). Gate data fetching on the same breakpoint
  // so phones don't fetch/poll for a ticker they never see. Starts false on SSR + first client
  // render (initialData still renders), flips to true on desktop after mount.
  const [isDesktop, setIsDesktop] = useState(false);
  const pausedRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const { data } = useQuery({
    queryKey: ['ticker'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/ticker');
      if (!res.ok) throw new Error('ticker fetch failed');
      return res.json() as Promise<{ items: TickerItem[] }>;
    },
    initialData: { items: initialItems },
    // initialItems is baked into the statically cached homepage HTML and may be stale; anchor
    // it to epoch so React Query refetches live ticker data on mount rather than trusting the
    // cached seed for the full staleTime.
    initialDataUpdatedAt: 0,
    enabled: isDesktop,
    refetchInterval: 300_000,
    staleTime: 300_000,
  });

  const items: TickerItem[] = data?.items ?? initialItems;

  const posXRef = useRef(0);
  const singleWidthRef = useRef(0);
  const visibleRef = useRef(true);
  // Lets the IntersectionObserver / hover-pause effects start/stop the rAF loop
  // owned by the main effect below, without re-running that effect.
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current?.();
  }, [paused]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        syncRef.current?.();
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || items.length === 0) return;
    // A marquee is pure motion — under reduced motion leave it static (the same
    // items remain reachable through the park/attraction pages).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Measure the loop width once (and on real size changes) rather than every frame:
    // reading scrollWidth inside the rAF loop — right after the previous frame's transform
    // write — forces a synchronous layout (reflow) on every frame.
    const measure = () => {
      singleWidthRef.current = el.scrollWidth / 2;
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);

    // Duration scales with item count so each item spends ~6s on screen (slow, calm scroll)
    const durationS = Math.max(45, items.length * 6);
    let lastTs: number | null = null;
    let raf = 0;
    let running = false;

    const step = (ts: number) => {
      if (!running) return;
      raf = requestAnimationFrame(step);
      const singleWidth = singleWidthRef.current;
      if (lastTs !== null && singleWidth > 0) {
        // Cap dt so a long rAF gap (background tab, frame hitch) advances one
        // small step instead of jumping the track by the whole gap.
        const dt = Math.min((ts - lastTs) / 1000, 0.1);
        const speed = singleWidth / durationS;
        posXRef.current = (posXRef.current + speed * dt) % singleWidth;
        el.style.transform = `translateX(${-posXRef.current}px)`;
      }
      lastTs = ts;
    };

    // The loop only exists while it should animate — scrolled offscreen or
    // hover-paused it is cancelled outright (the old version kept an idle
    // 60fps rAF chain alive for the lifetime of the page).
    const sync = () => {
      const shouldRun = visibleRef.current && !pausedRef.current;
      if (shouldRun && !running) {
        running = true;
        lastTs = null; // first resumed frame: dt=0, no jump
        raf = requestAnimationFrame(step);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    syncRef.current = sync;
    sync();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      syncRef.current = null;
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div
      className="border-border/60 bg-background/80 flex h-10 items-stretch border-t backdrop-blur-sm dark:border-white/10 dark:bg-black/50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Label — fixed left, never scrolls */}
      <div className="border-border/60 flex shrink-0 items-center gap-1.5 border-r px-3 dark:border-white/10">
        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-green-500" />
        <span className="font-mono text-[10px] font-bold tracking-wide whitespace-nowrap text-green-600 uppercase dark:text-green-400">
          <span className="sm:hidden">LIVE</span>
          <span className="hidden sm:inline">{t('liveWaitTimes')}</span>
        </span>
      </div>

      {/* Scrolling area */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="inline-flex h-full items-center"
          style={{ willChange: 'transform' }}
        >
          {[...items, ...items].map((item, i) => (
            // Stable identity (copy index + slugs) instead of the bare array index: the item
            // list refetches every 5 min, and index keys made React patch reordered entries
            // in place (momentary wrong-content flash) instead of moving them.
            <span
              key={`${i < items.length ? 'a' : 'b'}-${item.parkSlug}-${item.attractionSlug}`}
              className="flex shrink-0 items-center"
            >
              <TickerItemLink item={item} />
              <Separator />
            </span>
          ))}
        </div>
        {/* Right fade */}
        <div className="from-background/80 pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l to-transparent dark:from-black/50" />
      </div>
    </div>
  );
}
