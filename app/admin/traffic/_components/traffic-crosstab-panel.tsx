'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  TRAFFIC_CROSSTAB_PRESETS,
  trafficCrosstabDimensions,
  type CrosstabMetric,
} from '@/lib/admin/site-analytics';
import { cn } from '@/lib/utils';
import { Segmented } from '../../_ui/controls';
import type { TrafficFilters } from '../_lib/use-traffic';
import { CrosstabView } from './crosstab-view';

/** The pair the panel opens on: the system against the device. */
const DEFAULT_PAIR = { metric: 'pageviews' as CrosstabMetric, row: 'os', col: 'viewport' };

/**
 * Two dimensions of the traffic against each other: the system on each device, the channel in each
 * country, the entry page against the exit page. It counts page views, or visits where the question
 * is about how a visit began and ended (entry, exit, referrer, channel, campaign); a visit's
 * device, system and country are those of its first page. The pair is in the address
 * (`?row=&col=&metric=`), with the page's window and filters, so a view can be sent on.
 */
export function TrafficCrosstabPanel({ filters }: { filters: TrafficFilters }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const asked = params.get('metric');
  const metric: CrosstabMetric = asked === 'visits' ? 'visits' : DEFAULT_PAIR.metric;
  const dimensions = trafficCrosstabDimensions(metric);
  const valid = (value: string | null) => (value && dimensions.includes(value) ? value : null);
  const askedRow = valid(params.get('row'));
  const askedCol = valid(params.get('col'));
  // A pair that does not exist for the metric (a channel against page views) falls back to the default.
  const usable = askedRow && askedCol && askedRow !== askedCol;
  const row = usable ? askedRow : DEFAULT_PAIR.row;
  const col = usable ? askedCol : DEFAULT_PAIR.col;

  const write = useCallback(
    (next: Record<string, string>) => {
      const query = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) query.set(key, value);
      router.replace(`${pathname}?${query.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return (
    <CrosstabView
      hint="Zwei Merkmale gegeneinander, zum Beispiel das System auf jedem Gerät oder der Kanal je Land. Die größten 30 je Achse, der Rest steht unter „Übrige“."
      endpoint="crosstab"
      filters={filters}
      dimensions={dimensions}
      row={row}
      col={col}
      extra={{ metric }}
      onChange={write}
      toolbar={
        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Gezählt wird"
              value={metric}
              onChange={(value) =>
                // Visit-level dimensions exist only for visits, so the other metric starts over.
                write(
                  value === 'visits'
                    ? { metric: value, row, col }
                    : { metric: value, row: DEFAULT_PAIR.row, col: DEFAULT_PAIR.col }
                )
              }
              options={[
                { value: 'pageviews' as CrosstabMetric, label: 'Aufrufe' },
                { value: 'visits' as CrosstabMetric, label: 'Besuche' },
              ]}
            />
            <ul className="flex flex-wrap gap-1.5" aria-label="Vorschläge">
              {TRAFFIC_CROSSTAB_PRESETS.map((preset) => {
                const on = preset.metric === metric && preset.row === row && preset.col === col;
                return (
                  <li key={preset.label}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        write({ metric: preset.metric, row: preset.row, col: preset.col })
                      }
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs transition-colors max-sm:min-h-9',
                        on
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {preset.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {metric === 'visits' && (
            <p className="text-muted-foreground text-xs">
              Gerät, System und Land eines Besuchs sind die seiner ersten Seite.
            </p>
          )}
        </div>
      }
    />
  );
}
