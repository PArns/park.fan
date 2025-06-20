import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'purple' | 'pink' | 'indigo' | 'green' | 'blue' | 'amber';
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export default function StatisticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'purple',
  trend,
  className,
}: StatisticsCardProps) {
  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <Card variant="glass" hover="glow" className={cn('group', className)}>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110',
              colorClasses[color]
            )}
          >
            <Icon size={24} />
          </div>
          {trend && !isNaN(trend.value) && (
            <Badge variant={trend.value > 0 ? 'success' : 'error'}>
              {trend.value > 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {typeof value === 'number' ? (isNaN(value) ? '0' : value.toLocaleString()) : value}
          </p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
