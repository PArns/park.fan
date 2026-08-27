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
   * Render without the card's own glass and padding — for the stats panel, where the enclosing
   * `PANEL_CELL` already draws the box and the hairline rules and a card inside a card is one
   * frame too many. The heading stays: it is a real `<h3>` in the document outline, not a metric
   * label, and the table under it needs one.
   */
  bare?: boolean;
}

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
      {/* The readings are pushed to the row's right edge (`ml-auto`), which is right while the
        cell is about as wide as the row needs: on the park page two of these share the panel, so a
        cell holds 584 px of content against the row's natural 426 and „Sonntag" sits a thumb away
        from „15 min". A blog post asks for ONE of the tables (`stats-widget show=weekdays`), that
        cell is then the whole 960 px band, and the same rule strands the numbers half a screen
        from the weekday they belong to. 36rem leaves 150 px of headroom over the German row for
        the longer locales and trims 8 px off a park-page column at 1280 (more at 1920, where the
        stranding had started there too). */}
      <ul className="max-w-xl space-y-0.5">
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
    </Frame>
  );
}
