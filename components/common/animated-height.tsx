'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ANIMATED_HEIGHT_CLASS, useAnimatedHeight } from '@/lib/hooks/use-animated-height';

interface AnimatedHeightProps {
  children: ReactNode;
  /** Classes for the inner box, the one whose height is followed. */
  className?: string;
}

/**
 * A box that eases to the height of its content instead of jumping to it, for a list that grows
 * when results arrive. The two boxes {@link useAnimatedHeight} needs, for a call site that has no
 * box of its own to animate.
 */
export function AnimatedHeight({ children, className }: AnimatedHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  useAnimatedHeight(outerRef, innerRef);

  return (
    <div ref={outerRef} className={cn('shrink-0', ANIMATED_HEIGHT_CLASS)}>
      <div ref={innerRef} className={cn('flex flex-col', className)}>
        {children}
      </div>
    </div>
  );
}
