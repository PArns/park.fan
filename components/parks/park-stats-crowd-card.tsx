import { CalendarDays, Clock, Layers, TrendingUp } from 'lucide-react';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { BareFrame, CardFrame } from '@/components/parks/park-stats-frame';
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
  /**
   * Render without the card's own glass and padding, for the stats panel, whose enclosing
   * `PANEL_CELL` already draws the box. The heading stays: it is a real `<h3>` in the document
   * outline.
   */
  bare?: boolean;
}

/**
 * Statistics table of crowd level, typical (P50) and peak (P90) wait per month or per weekday,
 * with the measured days behind each row when `labelDays` is set. Waits are rounded to five.
 */
export function ParkStatsCrowdCard({
  iconType,
  title,
  rows,
  labelP50,
  labelP90,
  labelDays,
  bare = false,
}: ParkStatsCrowdCardProps) {
  const Frame = bare ? BareFrame : CardFrame;
  return (
    <Frame>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {iconType === 'calendar' ? (
          <CalendarDays className="text-primary h-4 w-4" aria-hidden="true" />
        ) : (
          <Layers className="text-primary h-4 w-4" aria-hidden="true" />
        )}
        {title}
      </h3>
      {/* The readings sit at the row's right edge (`ml-auto`), so `max-w-xl` keeps them near their
          label when one table fills a wide blog band. Label, badge and readings are `shrink-0`, and
          the widest locale's row does not fit a phone, so the list is its own container and rows
          follow its width: under 22rem the readings take a second line under the badge, „Typisch"
          joins from 30rem and the day count from 34rem. */}
      <ul className="@container max-w-xl space-y-0.5">
        {rows.map((row) => (
          <li
            key={row.key}
            className="hover:bg-primary/5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-2 py-1.5 text-sm transition-colors"
          >
            <span className="w-24 min-w-0 shrink-0 font-medium capitalize">{row.label}</span>
            <CrowdLevelBadge level={row.crowdLevel} className="text-xs" />
            <div className="ml-auto flex shrink-0 items-center gap-1.5 @max-[22rem]:w-full @max-[22rem]:pl-26">
              <span className="text-muted-foreground/70 hidden items-center gap-1 text-xs tabular-nums @min-[30rem]:flex">
                <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground/50">{labelP50}</span>
                <span className="text-foreground/70 font-medium">{roundWaitTo5(row.p50)} min</span>
              </span>
              <span className="text-border/60 hidden text-xs @min-[30rem]:inline">/</span>
              <span className="text-muted-foreground/70 flex items-center gap-1 text-xs tabular-nums">
                <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground/50">{labelP90}</span>
                <span className="text-foreground/70 font-medium">{roundWaitTo5(row.p90)} min</span>
              </span>
              {labelDays && row.days != null && (
                <span
                  className="text-muted-foreground/50 hidden text-xs tabular-nums @min-[34rem]:inline"
                  title={`${row.days}`}
                >
                  {row.days}&nbsp;{labelDays}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
