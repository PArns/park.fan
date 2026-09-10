/**
 * Whether a `blur` raised inside a header menu means the focus really left it.
 *
 * The obvious form of this test — `!root.contains(e.relatedTarget)` — is wrong in one case, and
 * the case is reachable: `contains(null)` is `false`, so a blur that went NOWHERE reads as a blur
 * that went outside. Focus goes nowhere whenever the focused element stops being focusable while
 * it still holds the focus, which is exactly what the remove buttons in the favorites band's
 * alerts group do — they set `disabled` for the duration of their own DELETE. The band closed
 * under the click that had just been made: one alert per opening, and the confirmation that the
 * removal worked (the row disappearing, the rest moving up) went out of view with it.
 *
 * Focus that genuinely leaves says where it went. Losing it to a disabled button, to a node that
 * was just removed, or to another window says nothing, and none of those is somebody leaving. What
 * closes the band in that state is what closed it before the focus ever moved: the pointer leaving
 * it (`onPointerLeave`, measured at 180 ms) and a `pointerdown` landing outside it. Escape is
 * supposed to be the third and is not — it closes none of the three bands today, this one
 * included, because the handler focuses back into the wrapper and the wrapper's own `onFocus`
 * reopens it in the same commit. That is older than this rule and has its own ticket; it is named
 * here so nobody reads a working Escape into the two lines below.
 *
 * Kept apart from the hook so it can be tested: `use-menu-trigger.ts` reaches `next/navigation`
 * through next-intl and does not load outside Next.
 */
export function focusLeftMenu(
  root: { contains: (node: Node | null) => boolean },
  next: Node | null
): boolean {
  return next !== null && !root.contains(next);
}
