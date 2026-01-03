import { cn } from '@/lib/utils';

interface OpenStatusProgressProps {
  openCount: number;
  totalCount: number;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function OpenStatusProgress({
  openCount,
  totalCount,
  label,
  className,
  showLabel = true,
}: OpenStatusProgressProps) {
  const percentage = totalCount > 0 ? (openCount / totalCount) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">
            <span className="text-park-primary">{openCount}</span>
            <span className="text-muted-foreground"> / {totalCount}</span>
          </span>
        </div>
      )}
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-park-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
