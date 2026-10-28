'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Keeps the `aria-activedescendant` of a cmdk field on its highlighted row. cmdk writes it when
 * the highlight moves by key or pointer, but not when it highlights the first row of a list that
 * has just appeared, on focus and after every query, so a screen reader heard a row marked
 * selected and no active one. Pass a ref to any element inside the cmdk root, the list will do.
 */
export function useCmdkActiveDescendant(inside: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = inside.current?.closest('[cmdk-root]');
    const input = root?.querySelector<HTMLInputElement>('[cmdk-input]');
    if (!root || !input) return;
    const sync = () => {
      const id = root.querySelector('[cmdk-item][aria-selected="true"]')?.id;
      if (!id) input.removeAttribute('aria-activedescendant');
      else if (input.getAttribute('aria-activedescendant') !== id) {
        input.setAttribute('aria-activedescendant', id);
      }
    };
    sync();
    // The field's own attribute too: React drops it whenever cmdk's value for it falls back to
    // nothing.
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-selected', 'aria-activedescendant'],
    });
    return () => observer.disconnect();
  }, [inside]);
}
