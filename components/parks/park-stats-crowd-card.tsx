import { CalendarDays, Clock, Layers, TrendingUp } from 'lucide-react';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { GlassCard } from '@/components/common/glass-card';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import type { CrowdLevel } from '@/lib/api/types';

interface CrowdStatRow {
  key: number;
  label: string;
  crowdLevel: CrowdLevel;
  p50: number;
  p90: number;
  /** Measured operating days behind this row. Three days in March and 31 in May read very
   *  differently, and without the count the thin rows look as solid as the fat ones. */
  days?: number;
}

interface ParkStatsCrowdCardProps {
  iconType: 'calendar' | 'layers';
  title: string;
  rows: CrowdStatRow[];
  labelP50: string;
  labelP90: string;
  /** Short unit for the measured-days count, e.g. "d". Omit to hide the column. */
  labelDays?: string;
}

export function ParkStatsCrowdCard({
  iconType,
  title,
  rows,
  labelP50,
  labelP90,
  labelDays,
}: ParkStatsCrowdCardProps) {
  return (
    <GlassCard variant="medium" className="space-y-2 p-4">
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
              <span className="text-muted-foreground/70 hidden items-center gap-1 text-xs tabular-nums sm:flex">
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground/50">{labelP50}</span>
                <span className="text-foreground/70 font-medium">{roundWaitTo5(row.p50)} min</span>
              </span>
              <span className="text-border/60 hidden text-xs sm:inline">/</span>
              <span className="text-muted-foreground/70 flex items-center gap-1 text-xs tabular-nums">
                <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground/50">{labelP90}</span>
                <span className="text-foreground/70 font-medium">{roundWaitTo5(row.p90)} min</span>
              </span>
              {labelDays && row.days != null && (
                <span
                  className="text-muted-foreground/50 hidden text-xs tabular-nums md:inline"
                  title={`${row.days}`}
                >
                  {row.days}&nbsp;{labelDays}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
