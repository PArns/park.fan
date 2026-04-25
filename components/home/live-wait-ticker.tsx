'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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

function WaitBadge({ waitTime, crowdLevel }: { waitTime: number; crowdLevel: string | null }) {
  const colors = crowdLevel
    ? (crowdBorderColor[crowdLevel] ??
      'border-border text-muted-foreground dark:border-white/30 dark:text-white/70')
    : 'border-border text-muted-foreground dark:border-white/30 dark:text-white/70';
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${colors}`}
    >
      {waitTime} min
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
      <WaitBadge waitTime={item.waitTime} crowdLevel={item.crowdLevel} />
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

  const { data } = useQuery({
    queryKey: ['ticker'],
    queryFn: async () => {
      const res = await fetch('/v1/analytics/ticker');
      if (!res.ok) throw new Error('ticker fetch failed');
      return res.json() as Promise<{ items: TickerItem[] }>;
    },
    initialData: { items: initialItems },
    refetchInterval: 300_000,
    staleTime: 300_000,
  });

  const items: TickerItem[] = data?.items ?? initialItems;
  if (items.length === 0) return null;

  // Duration scales with item count so each item spends ~4s on screen
  const durationS = Math.max(30, items.length * 4);

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
          {t('liveWaitTimes')}
        </span>
      </div>

      {/* Scrolling area */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          className="ticker-animate inline-flex h-full items-center"
          style={
            {
              '--ticker-dur': `${durationS}s`,
              animationPlayState: paused ? 'paused' : 'running',
            } as React.CSSProperties
          }
        >
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex shrink-0 items-center">
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
