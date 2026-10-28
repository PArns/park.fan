'use client';

import type { ReactNode } from 'react';
import { Grid3x3 } from 'lucide-react';
import { crosstabLabel, crosstabMatrix, crosstabValueLabel } from '@/lib/admin/site-analytics';
import type { CrosstabResponse } from '@/lib/api/admin-site-analytics';
import { HeatMatrix } from '../../_ui/charts';
import { Select } from '../../_ui/controls';
import { ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from '../../_ui/primitives';
import { useTrafficData, type TrafficFilters } from '../_lib/use-traffic';

/**
 * Two dimensions of the counter against each other as a shaded matrix: the rows, the columns, the
 * count in every cell, and the sums. The same panel answers "which search field, from which page"
 * for an event and "which system on which device" for the traffic: the page picks the endpoint and
 * the dimensions, this draws what comes back. The 30 biggest of each axis show and the rest is one
 * "Übrige". The pickers swap the axes when one is chosen for the other, so a pair is never a
 * dimension against itself.
 */
export function CrosstabView({
  title = 'Kreuztabelle',
  hint,
  endpoint,
  filters,
  dimensions,
  row,
  col,
  onChange,
  extra,
  toolbar,
  unsupported,
}: {
  title?: string;
  hint: ReactNode;
  /** The report under `/v1/admin/analytics/`, e.g. `crosstab` or `events/<name>/crosstab`. */
  endpoint: string;
  filters: TrafficFilters;
  /** The dimensions the pickers offer, as the API names them. */
  dimensions: readonly string[];
  row: string;
  col: string;
  onChange: (next: { row?: string; col?: string }) => void;
  /** More query parameters, such as the metric. */
  extra?: Record<string, string>;
  /** Controls above the pickers: a metric switch, shortcuts. */
  toolbar?: ReactNode;
  /** Why the filters rule this report out; it is then not asked for, and the reason shows instead. */
  unsupported?: string | null;
}) {
  const { data, error, refetch } = useTrafficData<CrosstabResponse>(
    endpoint,
    filters,
    { row, col, ...extra },
    { enabled: !unsupported }
  );
  const options = dimensions.map((dim) => ({ value: dim, label: crosstabLabel(dim) }));
  const matrix = data ? crosstabMatrix(data) : null;

  return (
    <Panel>
      <PanelHeader icon={Grid3x3} title={title} hint={hint} />
      <PanelBody>
        {toolbar}
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <label className="text-muted-foreground flex items-center gap-1.5">
            Zeilen
            <Select
              value={row}
              allowEmpty={false}
              options={options}
              onValueChange={(value) =>
                value && onChange({ row: value, ...(value === col ? { col: row } : {}) })
              }
              className="w-44 max-w-full"
            />
          </label>
          <label className="text-muted-foreground flex items-center gap-1.5">
            Spalten
            <Select
              value={col}
              allowEmpty={false}
              options={options}
              onValueChange={(value) =>
                value && onChange({ col: value, ...(value === row ? { row: col } : {}) })
              }
              className="w-44 max-w-full"
            />
          </label>
        </div>
        {unsupported ? (
          <p className="text-muted-foreground py-4 text-sm">{unsupported}</p>
        ) : !data && error ? (
          <ErrorState message={`${title}: ${error.message}`} onRetry={() => void refetch()} />
        ) : !matrix ? (
          <SkeletonRows rows={4} />
        ) : matrix.rows.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Keine Daten für diese Auswahl
          </p>
        ) : (
          <HeatMatrix
            rowHeader={crosstabLabel(row)}
            max={matrix.max}
            columnTotals={matrix.columnTotals}
            columns={matrix.columns.map((key) => ({
              key,
              label: crosstabValueLabel(col, key, data?.interval),
            }))}
            rows={matrix.rows.map((entry) => ({
              key: entry.key,
              label: crosstabValueLabel(row, entry.key, data?.interval),
              cells: entry.cells,
              total: entry.total,
            }))}
          />
        )}
      </PanelBody>
    </Panel>
  );
}
