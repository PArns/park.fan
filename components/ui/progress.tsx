import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showValue = false, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variantClasses = {
      default: 'bg-gradient-to-r from-purple-500 to-pink-500',
      success: 'bg-gradient-to-r from-green-500 to-emerald-500',
      warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
      error: 'bg-gradient-to-r from-red-500 to-rose-500',
    };

    return (
      <div className="space-y-2">
        {showValue && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
          {...props}
        >
          <div
            className={cn(
              'h-full w-full flex-1 transition-all duration-500 ease-out',
              variantClasses[variant]
            )}
            style={{
              transform: `translateX(-${100 - percentage}%)`,
            }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
