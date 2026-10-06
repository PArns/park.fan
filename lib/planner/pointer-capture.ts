/**
 * Claim a pointer for one gesture, and say where that gesture's events arrive.
 *
 * `setPointerCapture` throws `NotFoundError` for a pointer id that is no longer active, which would
 * abort the gesture before its state is set. Capture also retargets `pointermove` and `pointerup`,
 * so without it a handle-bound gesture would never end; a failed claim therefore returns the
 * document, where the events pass anyway. Shared by the grid's gestures and the sheet's handle.
 */
export function capturePointer(handle: Element, pointerId: number): EventTarget {
  try {
    handle.setPointerCapture(pointerId);
    return handle;
  } catch {
    // No such active pointer: a synthesized event, or one already released.
    return document;
  }
}

/**
 * Let go, whatever happened in between: releasing a capture that is not held throws too, and a
 * gesture that unmounts its own handle always takes that path.
 */
export function releasePointer(handle: Element, pointerId: number): void {
  try {
    handle.releasePointerCapture(pointerId);
  } catch {
    // Already released, or the element unmounted mid-drag.
  }
}

/**
 * Is this event the gesture's own pointer? Only matters after {@link capturePointer} fell back to
 * the document, which sees every pointer: otherwise a second finger would drive, and on `pointerup`
 * commit, a drag the first is still holding.
 */
export function isSamePointer(event: PointerEvent, pointerId: number): boolean {
  return event.pointerId === pointerId;
}
