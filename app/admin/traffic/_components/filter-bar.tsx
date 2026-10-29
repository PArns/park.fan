'use client';

import { X } from 'lucide-react';
import {
  breakdownValueLabel,
  DATACENTER_LABEL,
  DATACENTER_SCOPES,
  DIMENSION_LABEL,
} from '@/lib/admin/site-analytics';
import {
  INTERVAL_LABEL,
  defaultInterval,
  formatRangeSpan,
  intervalsFor,
} from '@/lib/admin/traffic-range';
import { Segmented } from '../../_ui/controls';
import type { TrafficFilterActions, TrafficFilters } from '../_lib/use-traffic';
import { LanguageSwitch } from './language-switch';
import { RangePicker } from './range-picker';

/** An active filter as a chip that takes itself off when pressed: what is filtered, and by what. */
export function FilterChip({
  label,
  value,
  removeLabel,
  onRemove,
}: {
  label: string;
  value: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel}
      className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 inline-flex max-w-full items-center gap-1.5 rounded-full border py-1 pr-2 pl-3 text-xs font-medium transition-colors max-sm:min-h-9"
    >
      <span className="text-primary/70">{label}</span>
      <span className="truncate">{value}</span>
      <X className="h-3 w-3 shrink-0" aria-hidden="true" />
    </button>
  );
}

/**
 * The switches of every traffic page: the window, the step of the series, the language, and the
 * filters set by pressing a row in a panel, each a chip that takes itself off. The language is a
 * filter on the counter's own figures: a visit in German counts for `de`, whatever the browser
 * says. The step is offered only where the page draws a series, and only the steps that suit the
 * window. Data centres' hits are left out unless the switch says otherwise.
 */
export function TrafficFilterBar({
  filters,
  hint = true,
  interval = true,
}: {
  filters: TrafficFilters & TrafficFilterActions;
  /** Whether to say how to set a filter; the pages without clickable rows leave it out. */
  hint?: boolean;
  /** Whether the page draws a series, and so lets the step be chosen. */
  interval?: boolean;
}) {
  const steps = intervalsFor(filters.window.days);
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        <LanguageSwitch value={filters.locale} onChange={filters.setLocale} />
        <RangePicker range={filters.range} today={filters.today} onChange={filters.setRange} />
        <Segmented
          label="Rechenzentren"
          value={filters.datacenter}
          onChange={filters.setDatacenter}
          options={DATACENTER_SCOPES.map((scope) => ({ value: scope, ...DATACENTER_LABEL[scope] }))}
        />
        {interval && steps.length > 1 && (
          <Segmented
            label="Schritt der Kurve"
            value={filters.activeInterval}
            onChange={(step) =>
              filters.setInterval(step === defaultInterval(filters.window.days) ? null : step)
            }
            options={steps.map((step) => ({ value: step, label: INTERVAL_LABEL[step] }))}
          />
        )}
        <p className="text-muted-foreground self-center text-xs tabular-nums">
          {formatRangeSpan(filters.window)} (UTC)
        </p>
      </div>
      {filters.filters.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Aktive Filter">
          {filters.filters.map((filter) => (
            <li key={filter.dim}>
              <FilterChip
                label={DIMENSION_LABEL[filter.dim]}
                value={breakdownValueLabel(filter.dim, filter.value)}
                removeLabel={`Filter entfernen: ${DIMENSION_LABEL[filter.dim]} ${filter.value}`}
                onRemove={() => filters.removeFilter(filter.dim)}
              />
            </li>
          ))}
          {filters.filters.length > 1 && (
            <li>
              <button
                type="button"
                onClick={filters.clearFilters}
                className="text-muted-foreground hover:text-foreground px-1 text-xs underline underline-offset-2 max-sm:min-h-9"
              >
                Alle entfernen
              </button>
            </li>
          )}
        </ul>
      ) : (
        hint && (
          <p className="text-muted-foreground text-xs">
            Ein Klick auf einen Wert in einer der Listen filtert die ganze Seite danach.
          </p>
        )
      )}
    </div>
  );
}
