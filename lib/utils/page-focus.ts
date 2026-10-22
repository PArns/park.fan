/**
 * Whether focus is on the page itself rather than on a control somebody moved to: `<body>`,
 * `<html>` or nothing. A page-wide shortcut acts only then, see
 * docs/rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md.
 */
export function nothingFocused(active: Element | null): boolean {
  return active === null || active === document.body || active === document.documentElement;
}
