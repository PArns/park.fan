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
 * Whether a keydown is {@link SEARCH_SHORTCUT_KEY} for the site search. Shift is allowed: on a
 * German keyboard the slash is Shift + 7. Unlike the other page-wide keys it also counts on a
 * focused link, button, pill or grid cell, which none uses for `/` (after a click on a filter chip
 * or a menu link the search otherwise needed a click); it still waits where `/` is text or the
 * control's own key: a field, an editable element, a dialog, a menu, a listbox.
 */
export function isSearchShortcut(e: KeyboardEvent): boolean {
  if (e.key !== SEARCH_SHORTCUT_KEY || e.metaKey || e.ctrlKey || e.altKey) return false;
  const active = document.activeElement;
  if (nothingFocused(active)) return true;
  if (!(active instanceof HTMLElement) || active.isContentEditable) return false;
  return !active.closest(SLASH_OWNERS);
}

/** Where `/` is typed text or belongs to the control around the focus. */
const SLASH_OWNERS =
  'input, textarea, select, [role="textbox"], [role="combobox"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

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
