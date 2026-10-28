'use client';

import { X } from 'lucide-react';
import { breakdownValueLabel, DIMENSION_LABEL, TRAFFIC_RANGES } from '@/lib/admin/site-analytics';
import { Segmented } from '../../_ui/controls';
import type { TrafficFilterActions, TrafficFilters } from '../_lib/use-traffic';
import { LanguageSwitch } from './language-switch';

/**
 * The switches of every traffic page: the window, the language, and the filters set by pressing
 * a row in a panel, each a chip that takes itself off. The language is a filter on the counter's
 * own figures: a visit in German counts for `de`, whatever the browser says.
 */
export function TrafficFilterBar({
  filters,
  hint = true,
}: {
  filters: TrafficFilters & TrafficFilterActions;
  /** Whether to say how to set a filter; the pages without clickable rows leave it out. */
  hint?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        <LanguageSwitch value={filters.locale} onChange={filters.setLocale} />
        <Segmented
          label="Zeitraum"
          value={filters.days}
          onChange={filters.setDays}
          options={TRAFFIC_RANGES.map((range) => ({ value: range.days, label: range.label }))}
        />
      </div>
      {filters.filters.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Aktive Filter">
          {filters.filters.map((filter) => (
            <li key={filter.dim}>
              <button
                type="button"
                onClick={() => filters.removeFilter(filter.dim)}
                aria-label={`Filter entfernen: ${DIMENSION_LABEL[filter.dim]} ${filter.value}`}
                className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 inline-flex max-w-full items-center gap-1.5 rounded-full border py-1 pr-2 pl-3 text-xs font-medium transition-colors max-sm:min-h-9"
              >
                <span className="text-primary/70">{DIMENSION_LABEL[filter.dim]}</span>
                <span className="truncate">{breakdownValueLabel(filter.dim, filter.value)}</span>
                <X className="h-3 w-3 shrink-0" aria-hidden="true" />
              </button>
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
