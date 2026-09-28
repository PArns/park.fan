'use client';

import { useEffect } from 'react';

/**
 * Copies react-remove-scroll's lock from `<body>` up to `<html>`, where the scrollbar gutter is.
 *
 * A Radix popup (dialog, sheet, popover, the language switcher) locks the page by setting
 * `data-scroll-locked` on `<body>` and hiding its overflow, which takes the scrollbar away and
 * widens the page by its width for as long as the popup is open. `html[data-scroll-locked]`
 * (app/globals.css) reserves that width with `scrollbar-gutter: stable`, and only then — a
 * permanent gutter would be an empty stripe on every short page.
 *
 * It used to be one rule, `html:has(body[data-scroll-locked])`, and that rule was the most
 * expensive line in the stylesheet: with any `:has()` in it, Chrome restyles `<html>` on every DOM
 * change anywhere on the page, and on these pages a restyle of `<html>` is a restyle of all ~2,700
 * elements — 400-700 ms per tap on a throttled phone. See
 * docs/rules/no-has-selector-in-the-stylesheet.md.
 *
 * One observer for the document, filtered to the one attribute. Its callback runs as a microtask
 * after the effect that set the lock, so the gutter lands in the same frame as the lock.
 *
 * Not on a coarse pointer. A phone's scrollbar overlays the page and takes no width, so there is
 * nothing to reserve — and an attribute on `<html>` is a restyle of every element on these pages,
 * which the filter sheet paid twice per open and close for nothing.
 */
export function ScrollLockGutter() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const { body, documentElement: html } = document;
    const sync = () =>
      html.toggleAttribute('data-scroll-locked', body.hasAttribute('data-scroll-locked'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(body, { attributes: true, attributeFilter: ['data-scroll-locked'] });
    return () => {
      observer.disconnect();
      html.removeAttribute('data-scroll-locked');
    };
  }, []);
  return null;
}
