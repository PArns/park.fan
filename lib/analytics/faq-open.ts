/**
 * How an FAQ question says where it stands. `FaqAccordion` is a Server Component of `<details>`
 * rows, so each row carries its place and the delegated listener (`MarkupEventTracker`) counts an
 * opening as `faq_opened`. The page type says which FAQ; the question's text never leaves.
 */

/** The attribute carrying a question's 1-based place in its list. */
export const FAQ_POSITION_ATTRIBUTE = 'data-faq-position';

/** The attribute to spread onto the `<details>` of the question at 0-based `index`. */
export function faqPositionAttributes(index: number): Record<string, string> {
  return { [FAQ_POSITION_ATTRIBUTE]: String(index + 1) };
}

/**
 * The position a `toggle` on `target` reports: the question's place when an FAQ row opened, `null`
 * for a row that closed and for any other `<details>`.
 */
export function faqOpenedPositionOf(target: EventTarget | null): number | null {
  if (!(target instanceof Element) || !(target as HTMLDetailsElement).open) return null;
  const position = Number(target.getAttribute(FAQ_POSITION_ATTRIBUTE));
  return Number.isInteger(position) && position > 0 ? position : null;
}
