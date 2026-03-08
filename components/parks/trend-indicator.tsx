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
  const iconClass = cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4', 'text-inherit');

  if (variant === 'pill') {
    return (
      <Badge
        className={cn(
          'font-bold tracking-wide uppercase backdrop-blur-md',
          isUp &&
            'bg-trend-up/65 border-trend-up/80 dark:bg-trend-up/25 dark:border-trend-up/40 border text-white',
          isDown &&
            'bg-trend-down/65 border-trend-down/80 dark:bg-trend-down/25 dark:border-trend-down/40 border text-white',
          trend === 'stable' &&
            'bg-trend-stable/65 border-trend-stable/80 dark:bg-trend-stable/25 dark:border-trend-stable/40 border text-white',
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
