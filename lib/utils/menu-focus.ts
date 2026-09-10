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
 * Focus that genuinely leaves says where it went. The two ways of leaving that name nothing are
 * both already handled in `useMenuTrigger`: a click landing outside closes on `pointerdown`, and
 * Escape closes on `keydown`. Losing the focus to a disabled button, to a node that was just
 * removed, or to another window is none of those, and closing on them is what this rules out.
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
