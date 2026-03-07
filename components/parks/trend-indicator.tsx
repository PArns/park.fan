import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendDirection } from '@/lib/api/types';

const trendIconMap: Record<TrendDirection, typeof TrendingUp> = {
  up: TrendingUp,
  stable: Minus,
  down: TrendingDown,
  increasing: TrendingUp,
  decreasing: TrendingDown,
};

interface TrendIndicatorProps {
  trend: TrendDirection;
  /** 'icon' = colored icon only; 'pill' = rounded pill with icon + optional label */
  variant?: 'icon' | 'pill';
  size?: 'sm' | 'md';
  /** Label text shown inside pill (caller provides translated string) */
  label?: string;
  className?: string;
}

export function TrendIndicator({
  trend,
  variant = 'icon',
  size = 'sm',
  label,
  className,
}: TrendIndicatorProps) {
  const Icon = trendIconMap[trend];
  const isUp = trend === 'up' || trend === 'increasing';
  const isDown = trend === 'down' || trend === 'decreasing';
  const iconClass = cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4');

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          isUp && 'bg-trend-up/10 text-trend-up',
          isDown && 'bg-trend-down/10 text-trend-down',
          trend === 'stable' && 'bg-muted text-muted-foreground',
          className
        )}
      >
        <Icon className={iconClass} />
        {label && <span className="capitalize">{label}</span>}
      </div>
    );
  }

  return (
    <span
      className={cn(
        'flex items-center',
        isUp && 'text-rose-500',
        isDown && 'text-emerald-500',
        trend === 'stable' && 'text-muted-foreground',
        className
      )}
    >
      <Icon className={iconClass} />
    </span>
  );
}
