import { Clock, TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WaitTimeSparkline } from './wait-time-sparkline';

interface WaitTimeInfoCardProps {
  /** Current standby wait time in minutes, or null if not operating */
  waitTime: number | null;
  /** Trend direction string (up / down / stable / increasing / decreasing) */
  trend?: string | null;
  /** Today's minimum observed wait time */
  minWaitToday?: number | null;
  /** Today's maximum observed wait time. Falls back to waitTime if not yet set. */
  maxWaitToday?: number | null;
  /** Raw wait time history for today — precise step jumps */
  sparklineHistory?: { timestamp: string; waitTime: number }[];
  /** Icon and label to show when not operating */
  statusIcon?: LucideIcon;
  statusLabel?: string;
  /** Translated strings */
  labels: {
    title: string;
    minutes: string;
    todayMin: string;
    todayMax: string;
    min: string;
    trendLabel?: string;
  };
  className?: string;
}

function TrendIcon({ trend, className }: { trend: string; className?: string }) {
  const t = trend.toLowerCase();
  if (t === 'down' || t === 'decreasing') return <TrendingDown className={className} />;
  if (t === 'up' || t === 'increasing') return <TrendingUp className={className} />;
  return <Minus className={className} />;
}

export function WaitTimeInfoCard({
  waitTime,
  trend,
  minWaitToday,
  maxWaitToday,
  sparklineHistory,
  statusIcon: StatusIcon,
  statusLabel,
  labels,
  className,
}: WaitTimeInfoCardProps) {
  const isOperating = waitTime !== null;
  const trendKey = trend?.toLowerCase() ?? '';
  const isTrendDown = trendKey === 'down' || trendKey === 'decreasing';
  const isTrendUp = trendKey === 'up' || trendKey === 'increasing';

  // Use current wait time as max fallback when API hasn't seen a peak yet
  const maxVal = maxWaitToday ?? waitTime ?? null;
  const minVal = minWaitToday ?? null;

  const hasSparkline = isOperating && sparklineHistory && sparklineHistory.length > 0;

  return (
    // gap-3 overrides the card's default gap-6 to tighten header↔content spacing
    <Card className={cn('gap-3 overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          {labels.title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between gap-4">
          {/* Left: icon bubble + value */}
          <div className="flex items-center gap-4">
            <div className="bg-muted shrink-0 rounded-full p-3">
              <Clock className="text-primary h-8 w-8" />
            </div>

            <div className="space-y-1">
              {isOperating ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl leading-none font-bold">{waitTime}</span>
                    <span className="text-muted-foreground text-xl">{labels.minutes}</span>
                  </div>

                  {(minVal != null || maxVal != null) && (
                    <p className="text-xs">
                      {minVal != null && (
                        <span className="text-crowd-low font-medium">
                          {labels.todayMin} {minVal} {labels.min}
                        </span>
                      )}
                      {minVal != null && maxVal != null && (
                        <span className="text-muted-foreground mx-1.5">·</span>
                      )}
                      {maxVal != null && (
                        <span className="text-crowd-very-high font-medium">
                          {labels.todayMax} {maxVal} {labels.min}
                        </span>
                      )}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {StatusIcon && <StatusIcon className="text-muted-foreground h-6 w-6" />}
                  <span className="text-lg font-medium">{statusLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: trend indicator */}
          {isOperating && trend && (
            <div
              className={cn(
                'text-muted-foreground flex shrink-0 flex-col items-center gap-0.5 text-xs font-medium',
                isTrendDown && 'text-emerald-500',
                isTrendUp && 'text-rose-500'
              )}
            >
              <TrendIcon trend={trend} className="h-5 w-5" />
              {labels.trendLabel && <span>{labels.trendLabel}</span>}
            </div>
          )}
        </div>
      </CardContent>

      {/* Sparkline as flex child — -mb-6 cancels the card's built-in py-6 bottom padding
          so it sits flush at the card's bottom edge without needing absolute positioning */}
      {hasSparkline && (
        <div className="mask-linear-gradient-to-t -mb-6 h-16 w-full opacity-30">
          <WaitTimeSparkline history={sparklineHistory!} className="text-primary" />
        </div>
      )}
    </Card>
  );
}
