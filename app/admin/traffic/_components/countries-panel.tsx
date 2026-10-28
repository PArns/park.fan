'use client';

import { BREAKDOWN_PANELS } from '@/lib/admin/site-analytics';
import type { BreakdownResponse } from '@/lib/api/admin-site-analytics';
import { BarList } from '../../_ui/charts';
import { ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from '../../_ui/primitives';
import {
  useTrafficData,
  type TrafficFilterActions,
  type TrafficFilters,
} from '../_lib/use-traffic';
import { MEASURE_UNIT, breakdownRow } from './breakdown-panel';
import { WorldMap } from './world-map';

/**
 * Where the visits come from, as a list and as a map of the same numbers. The country is derived
 * from the visitor's address and dropped; `zz` is a visit the lookup could not place. Pressing a
 * row or a country on the map filters the page.
 */
export function CountriesPanel({ filters }: { filters: TrafficFilters & TrafficFilterActions }) {
  const { data, error, refetch } = useTrafficData<BreakdownResponse>('breakdown', filters, {
    dim: 'country',
    limit: 50,
  });
  const { title, hint } = BREAKDOWN_PANELS.country;
  const held = filters.filters.find((filter) => filter.dim === 'country')?.value;

  return (
    <Panel>
      <PanelHeader title={title} hint={hint} />
      {!data && error ? (
        <ErrorState message={`${title}: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={5} />
      ) : data.items.length === 0 ? (
        <PanelBody>
          <p className="text-muted-foreground py-6 text-center text-sm">Noch keine Daten</p>
        </PanelBody>
      ) : (
        <PanelBody className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center [&>*]:min-w-0">
          <BarList
            rows={data.items.map((item) => breakdownRow('country', item, filters))}
            limit={10}
            unit={MEASURE_UNIT[data.measure]}
          />
          <WorldMap
            items={data.items}
            active={held}
            onSelect={(code) => filters.toggleFilter('country', code)}
          />
        </PanelBody>
      )}
    </Panel>
  );
}
