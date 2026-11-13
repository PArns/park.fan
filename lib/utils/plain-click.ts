/**
 * Whether a click on a link is the browser's to handle or the page's. Its own module, because the
 * planner links on park pages and the header's planner band ask the same question.
 */

/** The parts of a click event that say whether the browser would open a new tab or window. */
interface ClickLike {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Whether a click on a link is the plain primary click a page may take over. A modified click asks
 * for the link's own `href` in a tab or window of its own and is left alone, and the middle button
 * fires `auxclick`, which never arrives here. One definition for every link whose plain click opens
 * the planner instead of navigating, or does both.
 */
export function isPlainPrimaryClick(event: ClickLike): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}
