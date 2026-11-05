'use client';

import { useState } from 'react';
import { DATACENTER_LABEL, serializeTrafficFilters } from '@/lib/admin/site-analytics';
import { csvNamePart } from '@/lib/admin/report-csv';
import { CsvButton } from '../../_ui/csv-button';
import type { TrafficFilters } from '../_lib/use-traffic';

/** Rows shown before the rest of a list waits behind a button. */
export const LIST_SHOWN = 12;

/**
 * The first {@link LIST_SHOWN} rows of a list, or all of them once opened, with the props for its
 * {@link MoreButton} and a way to fold it again when the list changes underneath.
 */
export function useShowMore<T>(rows: readonly T[]) {
  const [open, setOpen] = useState(false);
  return {
    shown: open ? rows : rows.slice(0, LIST_SHOWN),
    more: { total: rows.length, open, onToggle: () => setOpen((value) => !value) },
    collapse: () => setOpen(false),
  };
}

/** A show-more switch for a list that is longer than {@link LIST_SHOWN}. */
export function MoreButton({
  total,
  open,
  onToggle,
}: {
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  if (total <= LIST_SHOWN) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-primary border-border/50 w-full border-t px-4 py-2.5 text-left text-xs hover:underline max-sm:min-h-11"
    >
      {open ? 'weniger zeigen' : `${total - LIST_SHOWN} weitere zeigen`}
    </button>
  );
}

/**
 * The CSV button of a traffic report: `data` is the answer the panel shows, and the file is named
 * by `report` and the window, its first rows the window, language, filters and network scope.
 */
export function TrafficCsvButton({
  report,
  data,
  filters,
}: {
  report: string;
  data: unknown;
  filters: TrafficFilters;
}) {
  const { from, to } = filters.window;
  const filterList = serializeTrafficFilters(filters.filters);
  return (
    <CsvButton
      data={data}
      filename={`parkfan-${csvNamePart(report)}-${from}_${to}`}
      meta={[
        ['Bericht', report],
        ['Von', from],
        ['Bis', to],
        ['Sprache', filters.locale ?? 'alle'],
        ['Filter', filterList.length > 0 ? filterList.join(' | ') : 'keine'],
        ['Rechenzentren', DATACENTER_LABEL[filters.datacenter].label],
      ]}
    />
  );
}
