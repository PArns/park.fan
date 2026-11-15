'use client';

import {
  MARKED_ROW_KINDS,
  MARKED_ROW_LABEL,
  MARKED_ROW_SCOPES,
  type MarkedRowKind,
  type MarkedRowScope,
  type MarkedRows,
} from '@/lib/admin/site-analytics';
import { Segmented } from '../../_ui/controls';

/**
 * One switch for each kind of row the API marks and keeps, the data centres' and the automated
 * visits': left out, counted with the rest, or shown alone. The traffic pages and the live view
 * carry the same pair.
 */
export function MarkedRowSwitches({
  value,
  onChange,
}: {
  value: MarkedRows;
  onChange: (kind: MarkedRowKind, scope: MarkedRowScope) => void;
}) {
  return MARKED_ROW_KINDS.map((kind) => (
    <Segmented
      key={kind}
      label={MARKED_ROW_LABEL[kind].name}
      value={value[kind]}
      onChange={(scope) => onChange(kind, scope)}
      options={MARKED_ROW_SCOPES.map((scope) => ({
        value: scope,
        ...MARKED_ROW_LABEL[kind].scopes[scope],
      }))}
    />
  ));
}
