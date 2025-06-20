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
      default: 'bg-gradient-to-r from-purple-600 to-pink-600',
      success: 'bg-gradient-to-r from-green-600 to-emerald-600',
      warning: 'bg-gradient-to-r from-orange-500 to-amber-600',
      error: 'bg-gradient-to-r from-red-600 to-rose-600',
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
          className={cn('relative h-2 w-full overflow-hidden rounded-full progress-bg', className)}
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
