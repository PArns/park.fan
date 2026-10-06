'use client';

import { useEffect } from 'react';

/**
 * Copies react-remove-scroll's lock from `<body>` up to `<html>`, where the scrollbar gutter is. A
 * Radix popup locks the page by hiding `<body>`'s overflow, which takes the scrollbar away;
 * `html[data-scroll-locked]` (app/globals.css) reserves its width only while locked. Done here
 * rather than with `html:has(...)`, see docs/rules/no-has-selector-in-the-stylesheet.md. Not on a
 * coarse pointer, where the scrollbar takes no width and the attribute would only cost a restyle.
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
