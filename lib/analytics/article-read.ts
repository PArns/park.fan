/**
 * How far a post was read, for `article_read`: the depths it counts and the scroll position they
 * are measured against. The reading bar counts them; the admin's overlay draws them on the page.
 */

/** The depths of `article_read`, in percent of the way to the end of the post. */
export const ARTICLE_READ_DEPTHS = [25, 50, 75, 100] as const;

/** The id of the empty element that ends a post's body. */
export const ARTICLE_END_ID = 'blog-progress-end';

/**
 * The scroll position at which a post counts as read to the end: the end of its body at the bottom
 * of the screen, or the bottom of the page on a page without one. A depth is reached at that share
 * of it. Reads layout, so a caller measures it once per change of size, not per scroll.
 */
export function articleReadSpan(): number {
  const end = document.getElementById(ARTICLE_END_ID);
  if (!end) {
    const doc = document.documentElement;
    return doc.scrollHeight - doc.clientHeight;
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  return end.getBoundingClientRect().top + scrollTop - window.innerHeight;
}
