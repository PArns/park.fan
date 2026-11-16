import { PARKY_ELEMENT_KINDS, type ParkyElementName } from '@/lib/analytics/parky-elements';
import type { CrosstabResponse } from '@/lib/api/admin-site-analytics';

/** The events behind `/admin/assistant`'s element table, each by `element` and `kind`. */
export const PARKY_ELEMENT_EVENTS = {
  seen: 'parky_element_seen',
  clicked: 'parky_element_clicked',
} as const;

/** One kind of one element: how often its pressable part was on screen, pressed, and the share. */
export interface ParkyElementRow {
  element: string;
  kind: string;
  seen: number;
  clicked: number;
  /** clicked / seen; null without a view to divide by. */
  rate: number | null;
}

function counts(table: CrosstabResponse | undefined): Map<string, number> {
  const byCell = new Map<string, number>();
  for (const cell of table?.cells ?? []) {
    const key = `${cell.row}\u0000${cell.col}`;
    byCell.set(key, (byCell.get(key) ?? 0) + cell.count);
  }
  return byCell;
}

/**
 * The two crosstabs (rows `prop:element`, columns `prop:kind`) as one table: every kind the site
 * knows in {@link PARKY_ELEMENT_KINDS}' order, zero where nothing was counted, so a kind nobody saw
 * still has its line, then whatever else the API sent (an old kind, `other`) at the end.
 */
export function parkyElementRows(
  seen: CrosstabResponse | undefined,
  clicked: CrosstabResponse | undefined
): ParkyElementRow[] {
  const seenBy = counts(seen);
  const clickedBy = counts(clicked);
  const known: [string, string][] = (
    Object.entries(PARKY_ELEMENT_KINDS) as [ParkyElementName, readonly string[]][]
  ).flatMap(([element, kinds]) => kinds.map((kind): [string, string] => [element, kind]));
  const knownKeys = new Set(known.map(([element, kind]) => `${element}\u0000${kind}`));
  const extra = [...new Set([...seenBy.keys(), ...clickedBy.keys()])]
    .filter((key) => !knownKeys.has(key))
    .map((key) => key.split('\u0000') as [string, string]);
  return [...known, ...extra].map(([element, kind]) => {
    const key = `${element}\u0000${kind}`;
    const seenCount = seenBy.get(key) ?? 0;
    const clickedCount = clickedBy.get(key) ?? 0;
    return {
      element,
      kind,
      seen: seenCount,
      clicked: clickedCount,
      rate: seenCount > 0 ? clickedCount / seenCount : null,
    };
  });
}
