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

/**
 * Marks a search field that {@link SEARCH_SHORTCUT_KEY} focuses while it is on screen, rather than
 * opening the palette over it: the homepage hero's.
 */
export const SEARCH_SHORTCUT_TARGET_ATTR = 'data-search-shortcut-target';

/**
 * The marked field, while all of it shows between the sticky header and the screen's bottom edge:
 * one half under the header or scrolled off reads as gone, so the shortcut opens the palette.
 */
export function searchShortcutTarget(): HTMLElement | null {
  const field = document.querySelector<HTMLElement>(`[${SEARCH_SHORTCUT_TARGET_ATTR}]`);
  if (!field) return null;
  const box = field.getBoundingClientRect();
  const headerBottom = document.querySelector('header.sticky')?.getBoundingClientRect().bottom ?? 0;
  return box.width > 0 && box.top >= headerBottom && box.bottom <= window.innerHeight
    ? field
    : null;
}
