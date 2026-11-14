/**
 * How an FAQ question says where it stands. `FaqAccordion` is a Server Component of `<details>`
 * rows, so each row carries its place and the delegated listener (`MarkupEventTracker`) counts an
 * opening as `faq_opened`. The page type says which FAQ; the question's text never leaves.
 */

/** The attribute carrying a question's 1-based place in its list. */
export const FAQ_POSITION_ATTRIBUTE = 'data-faq-position';

/**
 * The attribute carrying a question's message key, where a list's questions depend on the data and
 * a place names a different question on another page or day (a trip region's hub).
 */
export const FAQ_KEY_ATTRIBUTE = 'data-faq-key';

/** The attributes to spread onto the `<details>` of the question at 0-based `index`. */
export function faqPositionAttributes(index: number, key?: string): Record<string, string> {
  return {
    [FAQ_POSITION_ATTRIBUTE]: String(index + 1),
    ...(key ? { [FAQ_KEY_ATTRIBUTE]: key } : {}),
  };
}

/**
 * What a `toggle` on `target` reports: the question's place, and its key where it has one, when an
 * FAQ row opened; `null` for a row that closed and for any other `<details>`.
 */
export function faqOpenedOf(target: EventTarget | null): { position: number; key?: string } | null {
  if (!(target instanceof Element) || !(target as HTMLDetailsElement).open) return null;
  const position = Number(target.getAttribute(FAQ_POSITION_ATTRIBUTE));
  if (!Number.isInteger(position) || position < 1) return null;
  const key = target.getAttribute(FAQ_KEY_ATTRIBUTE);
  return key ? { position, key } : { position };
}
