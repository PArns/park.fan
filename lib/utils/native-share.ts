/**
 * The system share sheet (`navigator.share`) for the share buttons that offer it. Browser only:
 * call it from an event handler or a client render after hydration.
 */

/** Whether this browser has a system share sheet. */
export function canShareNatively(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * How {@link shareNatively} ended: a target was picked, the visitor closed the sheet, or there is
 * no sheet or the browser refused it, which is the caller's cue to copy the link instead.
 */
export type NativeShareResult = 'shared' | 'dismissed' | 'unavailable';

/** Opens the system share sheet with `data` and says how it ended. */
export async function shareNatively(data: ShareData): Promise<NativeShareResult> {
  if (!canShareNatively()) return 'unavailable';
  try {
    await navigator.share(data);
    return 'shared';
  } catch (error) {
    // An AbortError is the visitor closing the sheet; anything else is the browser refusing.
    return error instanceof DOMException && error.name === 'AbortError'
      ? 'dismissed'
      : 'unavailable';
  }
}
