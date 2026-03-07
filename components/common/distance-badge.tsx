import { Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';

interface DistanceBadgeProps {
  /** Distance in meters (number) or pre-formatted string */
  distance: number | string;
  size?: 'sm' | 'md';
  className?: string;
}

export function DistanceBadge({ distance, size = 'sm', className }: DistanceBadgeProps) {
  const label = typeof distance === 'number' ? formatDistance(distance) : distance;

  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center gap-1.5',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}
    >
      <Navigation className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      <span className="font-medium">{label}</span>
    </div>
  );
}
