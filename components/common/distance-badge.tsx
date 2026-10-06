import { Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';

interface DistanceBadgeProps {
  /** Distance in meters (number) or pre-formatted string */
  distance: number | string;
  size?: 'sm' | 'md';
  className?: string;
  /**
   * Draw the label through CSS (`content: attr(…)`) instead of as text, for the invisible copy that
   * reserves the badge's width: same box, but no "20000 km away" in the text crawlers and snippets
   * read.
   */
  sizer?: boolean;
}

/**
 * Muted distance label with a navigation icon, formatted from metres or passed as a string. `sizer`
 * draws the label through CSS so an invisible width reserve adds no text.
 */
export function DistanceBadge({ distance, size = 'sm', className, sizer }: DistanceBadgeProps) {
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
      {sizer ? (
        <span className="font-medium before:content-[attr(data-label)]" data-label={label} />
      ) : (
        <span className="font-medium">{label}</span>
      )}
    </div>
  );
}
