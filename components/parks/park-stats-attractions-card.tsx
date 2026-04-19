import { GlassCard } from '@/components/common/glass-card';
import { Clock, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { TopAttractionStat } from '@/lib/api/types';

interface ParkStatsAttractionsCardProps {
  attractions: TopAttractionStat[];
  title: string;
  labelP50: string;
  labelP90: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/30',
  2: 'bg-zinc-400/20 text-zinc-400 ring-1 ring-zinc-400/30',
  3: 'bg-orange-600/20 text-orange-500 ring-1 ring-orange-500/30',
};

export function ParkStatsAttractionsCard({
  attractions,
  title,
  labelP50,
  labelP90,
  continent,
  country,
  city,
  parkSlug,
}: ParkStatsAttractionsCardProps) {
  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="text-primary h-4 w-4" aria-hidden="true" />
        {title}
      </h3>
      <ul className="space-y-0.5">
        {attractions.map((a, i) => {
          const rank = i + 1;
          const rankStyle = RANK_STYLES[rank] ?? 'bg-muted/40 text-muted-foreground';
          return (
            <li
              key={a.attractionSlug}
              className="hover:bg-primary/5 flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors"
            >
              <span
                className={cn(
                  'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                  rankStyle
                )}
              >
                {rank}
              </span>
              <Link
                href={`/parks/${continent}/${country}/${city}/${parkSlug}/${a.attractionSlug}`}
                className="hover:text-primary min-w-0 flex-1 truncate font-medium transition-colors"
              >
                {a.attractionName}
              </Link>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-muted-foreground/70 hidden items-center gap-1 text-xs tabular-nums sm:flex">
                  <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground/50">{labelP50}</span>
                  <span className="text-foreground/70 font-medium">{a.avgWaitP50} min</span>
                </span>
                <span className="text-border/60 hidden text-xs sm:inline">/</span>
                <span className="text-muted-foreground/70 flex items-center gap-1 text-xs tabular-nums">
                  <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground/50">{labelP90}</span>
                  <span className="text-foreground/70 font-medium">{a.avgWaitP90} min</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
