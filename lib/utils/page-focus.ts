/**
 * Whether focus is on the page itself rather than on a control somebody moved to: `<body>`,
 * `<html>` or nothing. A page-wide shortcut acts only then, see
 * docs/rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md.
 */
export function nothingFocused(active: Element | null): boolean {
  return active === null || active === document.body || active === document.documentElement;
}

/** The key that opens the site search from anywhere on a page (`SearchCommand`). */
export const SEARCH_SHORTCUT_KEY = '/';

/**
 * Whether a keydown is a character typed at the page itself, which a type-to-search field may take:
 * nothing focused, no modifier, one printable character, not Space (it scrolls the page) and not
 * {@link SEARCH_SHORTCUT_KEY}, which opens the site search instead.
 */
export function isPageTypedKey(e: KeyboardEvent): boolean {
  if (!nothingFocused(document.activeElement)) return false;
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  return e.key.length === 1 && e.key !== ' ' && e.key !== SEARCH_SHORTCUT_KEY;
}

/**
 * Whether a keydown is {@link SEARCH_SHORTCUT_KEY} pressed at the page itself. Shift is allowed:
 * on a German keyboard the slash is Shift + 7.
 */
export function isSearchShortcut(e: KeyboardEvent): boolean {
  if (e.key !== SEARCH_SHORTCUT_KEY || e.metaKey || e.ctrlKey || e.altKey) return false;
  return nothingFocused(document.activeElement);
}
