import { CalendarDays, Clock, Layers, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/common/glass-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import type { CrowdLevel } from '@/lib/api/types';

interface CrowdStatRow {
  key: number;
  label: string;
  crowdLevel: CrowdLevel;
  p50: number;
  p90: number;
}

interface ParkStatsCrowdCardProps {
  iconType: 'calendar' | 'layers';
  title: string;
  rows: CrowdStatRow[];
  labelP50: string;
  labelP90: string;
}

export function ParkStatsCrowdCard({
  iconType,
  title,
  rows,
  labelP50,
  labelP90,
}: ParkStatsCrowdCardProps) {
  return (
    <GlassCard variant="strong" className="space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {iconType === 'calendar' ? (
          <CalendarDays className="text-primary h-4 w-4" aria-hidden="true" />
        ) : (
          <Layers className="text-primary h-4 w-4" aria-hidden="true" />
        )}
        {title}
      </h3>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li
            key={row.key}
            className="hover:bg-primary/5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
          >
            <span className="w-24 min-w-0 shrink-0 font-medium capitalize">{row.label}</span>
            <CrowdLevelBadge level={row.crowdLevel} className="text-xs" />
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <span className="text-muted-foreground/70 flex items-center gap-1 text-xs tabular-nums">
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground/50">{labelP50}</span>
                <span className="text-foreground/70 font-medium">{row.p50} min</span>
              </span>
              <span className="text-border/60 text-xs">/</span>
              <span className="text-muted-foreground/70 flex items-center gap-1 text-xs tabular-nums">
                <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground/50">{labelP90}</span>
                <span className="text-foreground/70 font-medium">{row.p90} min</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
