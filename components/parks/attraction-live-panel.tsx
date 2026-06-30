'use client';

import { Clock, TrendingUp, TrendingDown, Minus, BarChart3, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { LocalTime } from '@/components/ui/local-time';
import { WaitTimeSparkline } from './wait-time-sparkline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AttractionStatus, AccuracyBadge } from '@/lib/api/types';

interface AttractionLivePanelProps {
  waitTime: number | null;
  status: AttractionStatus;
  /** Shown big when the ride isn't operating (no wait number to display). */
  statusIcon: LucideIcon;
  statusLabel: string;
  trend?: string | null;
  minWaitToday?: number | null;
  maxWaitToday?: number | null;
  sparklineHistory?: { timestamp: string; waitTime: number }[];
  timezone?: string;
  lastUpdated?: string | null;
  predictionAccuracy?: { badge: AccuracyBadge; message: string } | null;
  /** Translated accuracy badge label (e.g. "Gut") matching `predictionAccuracy.badge`. */
  accuracyLabel?: string;
  labels: {
    waitTime: string;
    minutes: string;
    status: string;
    updated: string;
    todayMin: string;
    todayMax: string;
    min: string;
    predictionAccuracy: string;
    trendLabel?: string;
  };
}

function TrendIcon({ trend, className }: { trend: string; className?: string }) {
  const t = trend.toLowerCase();
  if (t === 'down' || t === 'decreasing') return <TrendingDown className={className} />;
  if (t === 'up' || t === 'increasing') return <TrendingUp className={className} />;
  return <Minus className={className} />;
}

const ACCURACY_BADGE_CLASS: Record<AccuracyBadge, string> = {
  excellent: 'bg-status-operating/15 text-status-operating',
  good: 'bg-status-operating/15 text-status-operating',
  fair: 'bg-status-down/15 text-status-down',
  poor: 'bg-destructive/15 text-destructive',
  insufficient_data: 'bg-muted text-muted-foreground',
};

/**
 * Compact "live now" hero panel for the attraction page. Collapses the former
 * three-card grid (wait time / status / prediction accuracy) into one cohesive
 * card that visually continues the page header: the standby wait reads as the
 * centerpiece, with status, last-updated and the KI-accuracy chip on the right,
 * and today's wait sparkline as a subtle backdrop.
 *
 * Client Component — the live values come from the React Query poll upstream;
 * it renders during SSR from the trimmed initial park, so the first paint
 * already shows a wait number (no skeleton).
 */
export function AttractionLivePanel({
  waitTime,
  status,
  statusIcon: StatusIcon,
  statusLabel,
  trend,
  minWaitToday,
  maxWaitToday,
  sparklineHistory,
  timezone,
  lastUpdated,
  predictionAccuracy,
  accuracyLabel,
  labels,
}: AttractionLivePanelProps) {
  const isOperating = waitTime !== null;
  const trendKey = trend?.toLowerCase() ?? '';
  const isTrendDown = trendKey === 'down' || trendKey === 'decreasing';
  const isTrendUp = trendKey === 'up' || trendKey === 'increasing';

  const maxVal = maxWaitToday ?? waitTime ?? null;
  const minVal = minWaitToday ?? null;
  const hasSparkline = isOperating && sparklineHistory && sparklineHistory.length > 0;

  return (
    <div className="bg-background/60 relative overflow-hidden rounded-xl border shadow-sm backdrop-blur-md">
      {/* Sparkline backdrop — sits behind the content, anchored to the bottom edge */}
      {hasSparkline && (
        <div className="mask-linear-gradient-to-t pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-[0.18]">
          <WaitTimeSparkline
            history={sparklineHistory!}
            timezone={timezone}
            className="text-primary"
          />
        </div>
      )}

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
        {/* Left: live wait time */}
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 shrink-0 rounded-full p-3">
            <Clock className="text-primary h-7 w-7" />
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
              {labels.waitTime}
            </p>
            {isOperating ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl leading-none font-bold tabular-nums">{waitTime}</span>
                  <span className="text-muted-foreground text-xl">{labels.minutes}</span>
                  {trend && (
                    <span
                      className={cn(
                        'text-muted-foreground ml-1 inline-flex items-center gap-0.5 text-sm font-medium',
                        isTrendDown && 'text-emerald-500',
                        isTrendUp && 'text-rose-500'
                      )}
                    >
                      <TrendIcon trend={trend} className="h-4 w-4" />
                      {labels.trendLabel}
                    </span>
                  )}
                </div>
                {(minVal != null || maxVal != null) && (
                  <p className="mt-1.5 text-xs">
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
              <div className="flex items-center gap-2 py-1.5">
                <StatusIcon className="text-muted-foreground h-7 w-7" />
                <span className="text-2xl font-semibold">{statusLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: status, updated, accuracy chip */}
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <ParkStatusBadge status={status} className="text-sm" />
          {lastUpdated && (
            <p className="text-muted-foreground text-xs">
              {labels.updated} <LocalTime time={lastUpdated} timeZone={timezone} />
            </p>
          )}
          {predictionAccuracy && (
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <Badge className={cn('gap-1.5', ACCURACY_BADGE_CLASS[predictionAccuracy.badge])}>
                  <BarChart3 className="h-3 w-3" />
                  {labels.predictionAccuracy}: {accuracyLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[16rem] text-xs">
                {predictionAccuracy.message}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
