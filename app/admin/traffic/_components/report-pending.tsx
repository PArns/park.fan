'use client';

import type { ReactNode } from 'react';
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  SkeletonRows,
} from '../../_ui/primitives';
import type { TrafficFilterActions } from '../_lib/use-traffic';
import { UnsupportedNote } from './unsupported-note';

/**
 * A traffic report that has nothing to draw yet: its head over the reason the filters leave it
 * nothing to count, the error with a retry, or the loading line. One frame, so every report says
 * the three the same way.
 */
export function TrafficReportPending({
  header,
  name,
  reason,
  error,
  onRetry,
  filters,
}: {
  header: ReactNode;
  /** The report's name as the reader knows it, `Suche`. */
  name: string;
  reason: string | null | undefined;
  error: Error | null | undefined;
  onRetry: () => void;
  filters: Pick<TrafficFilterActions, 'clearFilters'>;
}) {
  return (
    <AdminPage width="wide">
      <Panel>
        {header}
        {reason ? (
          <UnsupportedNote reason={reason} filters={filters} />
        ) : error ? (
          <ErrorState message={`${name}: ${error.message}`} onRetry={onRetry} />
        ) : (
          <LoadingState label={`Lade ${name}…`} />
        )}
      </Panel>
    </AdminPage>
  );
}

/**
 * What a ranked panel shows in place of its rows: the error with a retry, the skeleton while it
 * loads, and "Noch keine Daten" for an empty window. The rows themselves are the caller's.
 */
export function RankedPanelState<T extends { items: readonly unknown[] }>({
  title,
  data,
  error,
  onRetry,
  children,
}: {
  title: string;
  data: T | undefined;
  error: Error | null | undefined;
  onRetry: () => void;
  children: (data: T) => ReactNode;
}) {
  if (!data) {
    return error ? (
      <ErrorState message={`${title}: ${error.message}`} onRetry={onRetry} />
    ) : (
      <SkeletonRows rows={5} />
    );
  }
  if (data.items.length === 0) {
    return (
      <PanelBody>
        <p className="text-muted-foreground py-6 text-center text-sm">Noch keine Daten</p>
      </PanelBody>
    );
  }
  return <>{children(data)}</>;
}
