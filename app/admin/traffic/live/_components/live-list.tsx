'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { placeLiveRows, type PlacedRow } from '@/lib/admin/live-traffic';
import { BarList, type BarRow } from '../../../_ui/charts';

/** The easing of every move in the lists: off quickly, a long settle. */
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';
/** The id of a leaving row's fade, so a row that comes back can drop it. */
const EXIT_ID = 'live-row-exit';

const keyOf = (row: BarRow) => row.key;

/** What a row looked like in the last layout: where it stood, how wide its bar was, its count. */
interface RowMemory {
  top: number;
  width: number;
  value: number;
}

/**
 * A `BarList` whose rows move instead of jumping when an answer re-orders them. A row slides from
 * its old place to its new one (measured before and after, then animated back from the difference),
 * its bar grows or shrinks to the new width, a count that rose lights up briefly, a new row fades
 * in and a row that dropped out fades where it stood, out of the flow. Without `animate` the list
 * is redrawn as it is, which is a plain `BarList`.
 */
export function LiveList({
  rows,
  unit,
  animate,
  empty,
  limit = Infinity,
}: {
  rows: readonly BarRow[];
  unit: string;
  animate: boolean;
  /** The sentence for a list with no row. */
  empty: string;
  /** Rows shown before „weitere zeigen“. */
  limit?: number;
}) {
  const signature = rows.map((row) => `${row.key}\u0000${row.value}`).join('\u0001');
  const [layout, setLayout] = useState(() => ({
    signature,
    placed: placeLiveRows<BarRow>([], rows, keyOf),
  }));
  if (layout.signature !== signature) {
    setLayout({ signature, placed: placeLiveRows(layout.placed, rows, keyOf) });
  }

  // „weitere zeigen“ is the BarList's own state; counting presses here re-runs the measuring, so
  // the rows it uncovers fade in now and are known by the next answer.
  const [presses, setPresses] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const memory = useRef<Map<string, RowMemory> | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const before = memory.current;
    const values = new Map(layout.placed.map((row) => [row.key, row.item.value]));
    const after = new Map<string, RowMemory>();
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-bar-row]'));

    // Rows on their way out leave the flow first, so the rows that stay are measured where they
    // will stand and the panels below do not move while the old rows fade.
    for (const row of elements) {
      if (row.dataset.leaving === undefined || row.style.position === 'absolute') continue;
      const last = before?.get(row.dataset.barRow ?? '');
      if (!last) {
        // It was below the cut last time, so nobody saw it go.
        row.style.display = 'none';
        continue;
      }
      Object.assign(row.style, {
        position: 'absolute',
        top: `${last.top}px`,
        left: '0',
        right: '0',
      });
      row.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 450,
        easing: EASE,
        fill: 'forwards',
        id: EXIT_ID,
      });
    }

    for (const row of elements) {
      if (row.dataset.leaving !== undefined) continue;
      const key = row.dataset.barRow ?? '';
      const fill = row.querySelector<HTMLElement>('[data-bar-fill]');
      const count = row.querySelector<HTMLElement>('[data-bar-value]');

      // A row that comes back reuses the element it left in.
      for (const animation of row.getAnimations()) {
        if (animation.id === EXIT_ID) animation.cancel();
      }
      for (const property of ['position', 'top', 'left', 'right', 'display']) {
        row.style.removeProperty(property);
      }

      const top = row.offsetTop;
      const width = Number.parseFloat(fill?.style.width ?? '0') || 0;
      const value = values.get(key) ?? 0;
      after.set(key, { top, width, value });

      const previous = before?.get(key);
      if (!animate || !before) continue;
      if (!previous) {
        row.animate(
          [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 450, delay: 200, easing: EASE, fill: 'backwards' }
        );
        fill?.animate([{ width: '0%' }, { width: `${width}%` }], {
          duration: 800,
          delay: 200,
          easing: EASE,
          fill: 'backwards',
        });
        continue;
      }
      const shift = previous.top - top;
      if (shift !== 0) {
        // Rows have no background, so two crossing rows print over each other: the one rising stays
        // on top and solid, the one sinking dims on its way down.
        const rising = shift > 0;
        Object.assign(row.style, { position: 'relative', zIndex: rising ? '2' : '1' });
        const move = row.animate(
          rising
            ? [{ transform: `translateY(${shift}px)` }, { transform: 'none' }]
            : [
                { transform: `translateY(${shift}px)`, opacity: 1 },
                { opacity: 0.35, offset: 0.4 },
                { transform: 'none', opacity: 1 },
              ],
          { duration: 650, easing: EASE }
        );
        const settle = () => {
          row.style.removeProperty('position');
          row.style.removeProperty('z-index');
        };
        move.onfinish = settle;
        move.oncancel = settle;
      }
      if (previous.width !== width) {
        fill?.animate([{ width: `${previous.width}%` }, { width: `${width}%` }], {
          duration: 800,
          easing: EASE,
        });
      }
      if (count && value > previous.value) {
        count.animate(
          [{ color: 'var(--color-primary)' }, { color: getComputedStyle(count).color }],
          { duration: 1400, easing: 'ease-out' }
        );
      }
    }
    memory.current = after;
  }, [layout.placed, animate, presses]);

  const current = new Map(rows.map((row) => [row.key, row]));
  const shown = layout.placed
    .filter((row) => animate || !row.leaving)
    .map((row: PlacedRow<BarRow>) =>
      row.leaving ? { ...row.item, leaving: true } : (current.get(row.key) ?? row.item)
    );
  // The leaving rows come first (see `placeLiveRows`), so the cut after the `limit`-th row still in
  // the list keeps every one of them, and „weitere zeigen" counts rows a person can open.
  const leaving = shown.filter((row) => row.leaving).length;
  const cut = Math.min(shown.length, leaving + limit);

  return (
    <div
      ref={ref}
      className="relative"
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest('button')) setPresses((count) => count + 1);
      }}
    >
      {rows.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm transition-opacity duration-300 starting:opacity-0">
          {empty}
        </p>
      ) : (
        <BarList rows={shown} limit={cut} unit={unit} />
      )}
    </div>
  );
}
