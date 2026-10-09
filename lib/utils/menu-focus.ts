/**
 * Whether a `blur` raised inside a header menu means the focus really left it.
 *
 * `!root.contains(e.relatedTarget)` is wrong when focus went nowhere (`contains(null)` is false),
 * which happens when the focused element becomes unfocusable, e.g. an alert's remove button
 * disabling itself during its DELETE; the band would close under the click. Focus that leaves
 * says where it went. Escape, the keyboard's way out, still closes the band (see `closingRef` in
 * `useMenuTrigger`). Kept apart from the hook so it can be tested outside Next.
 */
export function focusLeftMenu(
  root: { contains: (node: Node | null) => boolean },
  next: Node | null
): boolean {
  return next !== null && !root.contains(next);
}

/**
 * Whether Escape, after closing a header band, may move the focus back onto its trigger: yes from
 * inside the band or from nowhere (`<body>`, `<html>`, `null`), where removing an alert leaves it;
 * no from a real element elsewhere, or Escape in the ride filter would also pull focus into the
 * header. See docs/rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md.
 */
export function escapeRefocusesTrigger(
  root: { contains: (node: Node | null) => boolean },
  active: Element | null,
  nowhere: ReadonlyArray<Element | null>
): boolean {
  return active === null || nowhere.includes(active) || root.contains(active);
}

/**
 * Whether a header band may stay open when the pointer leaves it for the page: yes while the focus
 * is in a text field inside it, since a pointer drifting off the band mid-word would throw the
 * query away. A click outside, Tab out and Escape still close it.
 */
export function holdsTextEntry(
  root: { contains: (node: Node | null) => boolean },
  active: Element | null
): boolean {
  return (
    active !== null &&
    root.contains(active) &&
    (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
  );
}
