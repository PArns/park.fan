import type { EditorView } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';
import { ADMIN_PASS_HEADER, SESSION_KEY } from '../../_lib/admin-context';

/**
 * Helpers shared across the four chip preview extensions
 * (ref / widget / image / embed). The plugins themselves stay tiny — anything
 * that drifted into copy-paste between them lives here instead.
 */

/**
 * Re-resolve a chip's doc position right before writing to it. Positions are
 * captured at click time; any edit above the chip shifts them, so a write at
 * the captured pos could hit the wrong node (or out-of-bounds). The verifier
 * decides whether the node at a position is "the one we meant" (usually by
 * type + a stable attr like the image src or the widget's fence language).
 *
 * Returns the captured pos when it still verifies, otherwise the verified
 * position closest to it, otherwise null (chip was deleted).
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
 * Click targets in TipTap are often the deepest DOM node a click landed on —
 * frequently a text node. `closest()` only exists on Elements, so plugins
 * have to walk up one step before they can query. This pattern was repeated
 * verbatim in every chip plugin.
 */
export function eventToElement(event: MouseEvent): Element | null {
  const raw = event.target as Node | null;
  if (raw instanceof Element) return raw;
  return (raw?.parentElement as Element | null) ?? null;
}

/**
 * When a chip has multiple plausible spans in the doc (same park referenced
 * twice, two attraction widgets sharing a slug, the same image used twice),
 * pick the one whose anchor coordinate is closest to the chip rect. hypot
 * combines X and Y so two chips on the same line still disambiguate.
 *
 * Returns `null` only when the candidates list is empty.
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

/**
 * Module-level resolution cache shared between ref-preview and widget-preview
 * (and anything else that wants to call `/api/admin/blog-editor/resolve-ref`
 * without paying for duplicate fetches when both plugins see the same park
 * within a session).
 *
 * Each entry transitions loading → ready | failed and never reverts. Callers
 * register an `onResolve` callback that fires once the network round-trip
 * completes; the plugin then dispatches its own refresh transaction.
 */

type CacheEntry<T> = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; data: T };

export interface ResolveCache<T> {
  get(refValue: string): CacheEntry<T> | undefined;
  /** Idempotent — repeats are no-ops while one is in flight. */
  ensure(refValue: string, onResolve: () => void): void;
}

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
      // Plain module (no hook access) — read the admin pass straight from the
      // session, same store the AdminShell login writes to.
      const pass =
        typeof window !== 'undefined' ? (sessionStorage.getItem(SESSION_KEY) ?? '') : '';
      fetch(`/api/admin/blog-editor/resolve-ref?ref=${encodeURIComponent(refValue)}`, {
        headers: { [ADMIN_PASS_HEADER]: pass },
      })
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
