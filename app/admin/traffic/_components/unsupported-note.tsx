'use client';

import { Info } from 'lucide-react';
import type { TrafficFilterActions } from '../_lib/use-traffic';

/**
 * What a report says when the filters leave it nothing to count (page views and events under a
 * filter on how a visit began, events under a browser language): the reason in a sentence and the
 * way out, instead of an error from a request the page need not have made.
 */
export function UnsupportedNote({
  reason,
  filters,
}: {
  reason: string;
  filters: Pick<TrafficFilterActions, 'clearFilters'>;
}) {
  return (
    <div role="status" className="flex items-start gap-3 px-4 py-6">
      <Info className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-muted-foreground max-w-prose text-sm">{reason}</p>
        <button
          type="button"
          onClick={filters.clearFilters}
          className="text-primary text-xs underline underline-offset-2 max-sm:min-h-9"
        >
          Alle Filter entfernen
        </button>
      </div>
    </div>
  );
}
