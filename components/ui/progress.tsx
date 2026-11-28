/**
 * Progress bar primitive (shadcn/ui on Radix Progress). The fill goes from green to yellow, orange
 * and red as it passes 40, 70 and 85 % of `max`, unless `indicatorClassName` colours it by what the
 * bar measures. `children` are drawn over the track, for a mark such as a reference value.
 */
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  max = 100,
  indicatorClassName,
  children,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  const getIndicatorColor = (percent: number) => {
    if (percent < 40) return 'bg-green-500';
    if (percent < 70) return 'bg-yellow-500';
    if (percent < 85) return 'bg-orange-500';
    return 'bg-red-500';
  };
  // Radix drops a value outside 0…max as invalid, so the bar is clamped here, not by every caller.
  const clamped = value == null ? value : Math.min(max, Math.max(0, value));
  const percent = ((clamped ?? 0) / max) * 100;

  return (
    <ProgressPrimitive.Root
      className={cn('bg-secondary relative h-2 w-full overflow-hidden rounded-full', className)}
      value={clamped}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 transition-all',
          indicatorClassName ?? getIndicatorColor(percent)
        )}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
      {children}
    </ProgressPrimitive.Root>
  );
}

export { Progress };
