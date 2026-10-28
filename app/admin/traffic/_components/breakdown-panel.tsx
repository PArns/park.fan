'use client';

import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import {
  BREAKDOWN_PANELS,
  breakdownValueLabel,
  formatCount,
  formatShare,
  pathEditorHref,
} from '@/lib/admin/site-analytics';
import type { BreakdownDimension, BreakdownResponse } from '@/lib/api/admin-site-analytics';
import { BarList, type BarRow } from '../../_ui/charts';
import { ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from '../../_ui/primitives';
import { useTrafficData, type TrafficFilters } from '../_lib/use-traffic';

/** What a row of a dimension does when it is pressed, so a list is a way into the site and not a dead end. */
function rowFor(
  dim: BreakdownDimension,
  item: BreakdownResponse['items'][number],
  onLocale: (locale: Locale | null) => void
): BarRow {
  const row: BarRow = {
    key: item.value,
    label: breakdownValueLabel(dim, item.value),
    value: item.views,
    share: item.share,
  };
  if (dim === 'path' || dim === 'entry') {
    const editor = pathEditorHref(item.value);
    return {
      ...row,
      externalHref: item.value,
      startTruncate: true,
      detail: dim === 'path' && item.visits > 0 ? `${formatCount(item.visits)} Besuche` : undefined,
      actions: editor && (
        <Link
          href={editor}
          title="Im Editor öffnen"
          aria-label="Im Editor öffnen"
          className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
        >
          <Pencil className="h-3 w-3" />
        </Link>
      ),
    };
  }
  if (dim === 'referrer') {
    return { ...row, externalHref: `https://${item.value}` };
  }
  if (dim === 'locale') {
    return { ...row, onSelect: () => onLocale(item.value as Locale) };
  }
  return row;
}

/**
 * One breakdown of the window: a list of the biggest values of a dimension with bar, count and
 * share. Pages and entry pages open the public page and, for a park or a ride, its editor; a
 * referrer opens the site; a language filters the whole page.
 */
export function BreakdownPanel({
  dim,
  filters,
  onLocale,
  limit = 8,
}: {
  dim: BreakdownDimension;
  filters: TrafficFilters;
  onLocale: (locale: Locale | null) => void;
  limit?: number;
}) {
  const { data, error, refetch } = useTrafficData<BreakdownResponse>('breakdown', filters, {
    dim,
    limit: 50,
  });
  const { title, hint } = BREAKDOWN_PANELS[dim];
  const startsVisits = dim === 'entry' || dim === 'referrer';
  const withoutReferrer = data
    ? Math.max(0, data.total.views - data.items.reduce((sum, item) => sum + item.views, 0))
    : 0;

  return (
    <Panel>
      <PanelHeader
        title={title}
        hint={hint}
        action={
          startsVisits || dim === 'path' ? (
            <span className="text-muted-foreground text-[11px]">
              {startsVisits ? 'Besuche' : 'Aufrufe'}
            </span>
          ) : undefined
        }
      />
      {!data && error ? (
        <ErrorState message={`${title}: ${error.message}`} onRetry={() => void refetch()} />
      ) : !data ? (
        <SkeletonRows rows={5} />
      ) : data.items.length === 0 ? (
        <PanelBody>
          <p className="text-muted-foreground py-6 text-center text-sm">Noch keine Daten</p>
        </PanelBody>
      ) : (
        <PanelBody>
          <BarList
            rows={data.items.map((item) => rowFor(dim, item, onLocale))}
            limit={limit}
            unit={startsVisits ? 'Besuche' : 'Aufrufe'}
          />
          {dim === 'path' && (
            <p className="text-muted-foreground mt-3 flex items-center gap-1 text-[11px]">
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              öffnet die Seite auf park.fan
            </p>
          )}
          {dim === 'referrer' && (
            <p className="text-muted-foreground mt-3 text-[11px]">
              Ohne Herkunft (direkt, aus der eigenen Seite oder darunter):{' '}
              {formatCount(withoutReferrer)} Besuche (
              {formatShare(data.total.views > 0 ? withoutReferrer / data.total.views : 0)})
            </p>
          )}
        </PanelBody>
      )}
    </Panel>
  );
}
