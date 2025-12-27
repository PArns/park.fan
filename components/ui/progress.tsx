import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Determine color based on value
  const getIndicatorColor = (val: number = 0) => {
    if (val < 40) return 'bg-green-500';
    if (val < 70) return 'bg-yellow-500';
    if (val < 85) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('bg-secondary relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 transition-all', getIndicatorColor(value ?? 0))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
