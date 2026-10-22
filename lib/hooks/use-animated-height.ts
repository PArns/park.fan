'use client';

import { useLayoutEffect, type RefObject } from 'react';

/**
 * What the box {@link useAnimatedHeight} writes onto needs: it clips the content it has not grown
 * to yet, and it eases its height. `box-content`, because the height written is the content's: a
 * border-box element with a border would come out short by the border.
 */
export const ANIMATED_HEIGHT_CLASS =
  'box-content overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none';

/**
 * Eases `outer` to the height of `inner`, its only child, whenever the content grows or shrinks,
 * instead of letting it jump. A CSS transition cannot follow `height: auto`, so `inner` is watched
 * and its height written onto `outer`, which carries {@link ANIMATED_HEIGHT_CLASS}. The first
 * height is written while `outer` is still `auto`, which no transition starts from, so a mount
 * does not animate.
 */
export function useAnimatedHeight(
  outerRef: RefObject<HTMLElement | null>,
  innerRef: RefObject<HTMLElement | null>
): void {
  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    // The observer hands over the size it measured, so writing it reads no layout.
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      outer.style.height = `${height}px`;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, [outerRef, innerRef]);
}
