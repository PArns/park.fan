import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TrendDirection } from '@/lib/api/types';

const trendIconMap: Record<TrendDirection, typeof TrendingUp> = {
  up: TrendingUp,
  stable: Minus,
  down: TrendingDown,
  increasing: TrendingUp,
  decreasing: TrendingDown,
  rising: TrendingUp,
  falling: TrendingDown,
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
  const isUp = trend === 'up' || trend === 'increasing' || trend === 'rising';
  const isDown = trend === 'down' || trend === 'decreasing' || trend === 'falling';
  const iconClass = cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4', 'text-inherit');

  if (variant === 'pill') {
    return (
      <Badge
        className={cn(
          isUp && 'badge-trend-up',
          isDown && 'badge-trend-down',
          trend === 'stable' && 'badge-trend-stable',
          size === 'md' && 'px-3 py-1 text-sm',
          className
        )}
      >
        <Icon className={iconClass} />
        {label && <span>{label}</span>}
      </Badge>
    );
  }

  return (
    <span
      className={cn(
        'flex items-center',
        isUp && 'text-trend-up',
        isDown && 'text-trend-down',
        trend === 'stable' && 'text-trend-stable',
        className
      )}
    >
      <Icon className={iconClass} />
    </span>
  );
}
