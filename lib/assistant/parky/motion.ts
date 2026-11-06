/** Whether the visitor asked for reduced motion, which keeps Parky still. Browser only. */
export function parkyStill(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A web animation on a piece of Parky. Under reduced motion it is held at the end of its first
 * run instead of played, so the piece stands in its finished pose as the stylesheet's own parts
 * do without their `@media (prefers-reduced-motion: no-preference)` motion.
 */
export function animateParky(
  element: Element,
  frames: Keyframe[],
  timing: KeyframeAnimationOptions
): Animation {
  const run = element.animate(frames, timing);
  if (parkyStill()) {
    run.pause();
    run.currentTime = Number(timing.duration ?? 0);
  }
  return run;
}
