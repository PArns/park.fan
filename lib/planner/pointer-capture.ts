/**
 * Claim a pointer for one gesture, and say where that gesture's events arrive.
 *
 * `setPointerCapture` throws `NotFoundError` for a pointer id that is not
 * currently active. The release side of every gesture in the planner has been
 * wrapped against exactly that since it was written; the claim side was not, so
 * the throw landed uncaught in a React event handler and took the whole gesture
 * with it before its state had been set — a drag that silently does nothing.
 *
 * The return value is the point. Capture is what RETARGETS `pointermove` and
 * `pointerup` to the handle, so without it a handle-bound `pointerup` never
 * fires and the gesture has no end: the loop runs on, the element keeps whatever
 * the gesture was writing to it, and the listeners leak. A failed claim
 * therefore moves the listeners to the document, where the events pass on their
 * way up regardless.
 *
 * It lives here rather than beside one of its two callers because both of them
 * are gestures on the same panel — the grid's grip and resize edge, and the
 * bottom sheet's own handle — and the sheet had its own unguarded copy of the
 * claim for as long as it has existed.
 */
export function capturePointer(handle: Element, pointerId: number): EventTarget {
  try {
    handle.setPointerCapture(pointerId);
    return handle;
  } catch {
    // No such active pointer — a synthesized event, or one already released.
    return document;
  }
}

/**
 * Let go, whatever happened in between.
 *
 * Releasing a capture that is not held throws as readily as claiming one that
 * cannot be had, and a gesture that ends by unmounting its own handle takes that
 * path every time.
 */
export function releasePointer(handle: Element, pointerId: number): void {
  try {
    handle.releasePointerCapture(pointerId);
  } catch {
    // Already released — a cancelled gesture, or the element unmounted mid-drag.
    // Nothing to release and nothing to report.
  }
}

/**
 * Is this event the gesture's own finger?
 *
 * Only meaningful once {@link capturePointer} has fallen back to the document:
 * a real capture retargets one pointer's events and nothing else's, while the
 * document sees every pointer on the screen. Without this a second finger put
 * down anywhere on the page drives — and, on its `pointerup`, COMMITS — a drag
 * the first one is still holding.
 */
export function isSamePointer(event: PointerEvent, pointerId: number): boolean {
  return event.pointerId === pointerId;
}
