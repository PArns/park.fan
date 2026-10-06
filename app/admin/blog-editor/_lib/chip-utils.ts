import type { EditorView } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';

/** Helpers shared by the four chip preview extensions (ref, widget, image, embed). */

/**
 * Re-resolves a chip's doc position right before writing to it, since an edit above the chip
 * shifts the position captured at click time. Returns that position when it still verifies, else
 * the closest verified one, else null (the chip was deleted).
 */
export function reanchorPos(
  doc: PMNode,
  pos: number,
  verify: (node: PMNode) => boolean
): number | null {
  const at = pos >= 0 && pos < doc.content.size ? doc.nodeAt(pos) : null;
  if (at && verify(at)) return pos;
  let best: number | null = null;
  let bestDist = Infinity;
  doc.descendants((node, p) => {
    if (!verify(node)) return;
    const dist = Math.abs(p - pos);
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  });
  return best;
}

/**
 * The element a click landed on: TipTap's target is often a text node, which has no `closest()`.
 */
export function eventToElement(event: MouseEvent): Element | null {
  const raw = event.target as Node | null;
  if (raw instanceof Element) return raw;
  return (raw?.parentElement as Element | null) ?? null;
}

/**
 * Picks, among several plausible spans for a chip (the same park referenced twice), the one whose
 * anchor is closest to the chip's rect in X and Y. Returns `null` only for an empty list.
 */
export function pickClosestByCoords<T>(
  chip: Element,
  candidates: readonly T[],
  view: EditorView,
  getPos: (c: T) => number
): T | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const r = chip.getBoundingClientRect();
  const chipX = (r.left + r.right) / 2;
  const chipY = (r.top + r.bottom) / 2;
  let best: T = candidates[0];
  let bestDist = Infinity;
  for (const c of candidates) {
    try {
      const coords = view.coordsAtPos(getPos(c));
      const dx = coords.left - chipX;
      const dy = (coords.top + coords.bottom) / 2 - chipY;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    } catch {
      /* invalid pos — skip */
    }
  }
  return best;
}

type CacheEntry<T> = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; data: T };

export interface ResolveCache<T> {
  get(refValue: string): CacheEntry<T> | undefined;
  /** Idempotent — repeats are no-ops while one is in flight. */
  ensure(refValue: string, onResolve: () => void): void;
}

/**
 * Creates a cache of `resolve-ref` lookups keyed by ref value, so plugins that see the same ref do
 * not fetch it twice. Entries never revert from ready or failed, and only the first `ensure` for a
 * ref gets its `onResolve` called.
 */
export function createResolveCache<T>(
  parseResponse: (raw: unknown) => T = (raw) => raw as T
): ResolveCache<T> {
  const cache = new Map<string, CacheEntry<T>>();
  return {
    get(refValue) {
      return cache.get(refValue);
    },
    ensure(refValue, onResolve) {
      if (cache.has(refValue)) return;
      cache.set(refValue, { state: 'loading' });
      // No hook needed: the session is an httpOnly cookie the browser attaches to a same-origin
      // fetch by itself.
      fetch(`/api/admin/blog-editor/resolve-ref?ref=${encodeURIComponent(refValue)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((raw) => {
          cache.set(refValue, { state: 'ready', data: parseResponse(raw) });
        })
        .catch(() => {
          cache.set(refValue, { state: 'failed' });
        })
        .finally(onResolve);
    },
  };
}
