import { cn } from '@/lib/utils';

/**
 * The surface of Parky's speech bubble in the planners: the card's ground, a hairline and a soft
 * shadow, above its tail ({@link ParkyBubbleTail}), whose inner half it covers. The trip assistant's
 * question and the planners' way into the chat both speak in it.
 */
export const PARKY_BUBBLE = 'bg-card border-border/70 relative z-10 rounded-2xl border shadow-sm';

/**
 * The tail of {@link PARKY_BUBBLE}: a square turned on its edge, half under the bubble's side at
 * its middle, pointing at Parky on that side. It goes beside the bubble in a `relative` wrapper.
 */
export function ParkyBubbleTail({ side }: { side: 'left' | 'right' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-card border-border/70 absolute top-1/2 size-3 -translate-y-1/2 rotate-45',
        side === 'left' ? '-left-1.5 border-b border-l' : '-right-1.5 border-t border-r'
      )}
    />
  );
}
