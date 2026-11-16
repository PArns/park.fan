'use client';

import Link from 'next/link';
import { MousePointerClick } from 'lucide-react';
import {
  formatCount,
  formatShare,
  pageTypeLabel,
  propValueLabel,
} from '@/lib/admin/site-analytics';
import { PARKY_ELEMENT_EVENTS, parkyElementRows } from '@/lib/admin/parky-elements';
import type { CrosstabResponse } from '@/lib/api/admin-site-analytics';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import { analyticsPath } from '../../traffic/_lib/use-traffic';
import { ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from '../../_ui/primitives';

const DAYS = 30;
const WINDOW = { range: { kind: 'days', days: DAYS }, locale: null } as const;
const BY_KIND = { row: 'prop:element', col: 'prop:kind' };

function useCrosstab(event: string, axes: Record<string, string>) {
  const path = analyticsPath(`events/${event}/crosstab`, WINDOW, axes);
  return useAdminQuery<CrosstabResponse>(adminKeys.raw(path), path, { staleTime: 60_000 });
}

/** Where a traffic page takes one event of this panel apart, by the same axes. */
function eventHref(event: string, axes: Record<string, string>): string {
  return `/admin/traffic/events/${event}?days=${DAYS}&${new URLSearchParams(axes).toString()}`;
}

/** The links in Parky's answers that were followed, by the page type they lead to. */
function linkTargets(table: CrosstabResponse | undefined): { target: string; count: number }[] {
  const byTarget = new Map<string, number>();
  for (const cell of table?.cells ?? []) {
    byTarget.set(cell.row, (byTarget.get(cell.row) ?? 0) + cell.count);
  }
  return [...byTarget]
    .map(([target, count]) => ({ target, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Parky's elements on the site over 30 days: per element and kind, how often the pressable part
 * was on screen for a visitor Parky shows for, how often it was pressed, and the share; then which
 * links in his answers were followed. From the site statistic's own counter, so every number opens
 * as its event under Traffic.
 */
export function ParkyElementsPanel() {
  const seen = useCrosstab(PARKY_ELEMENT_EVENTS.seen, BY_KIND);
  const clicked = useCrosstab(PARKY_ELEMENT_EVENTS.clicked, BY_KIND);
  const links = useCrosstab('assistant_link_clicked', { row: 'prop:target', col: 'page_type' });
  const error = seen.error ?? clicked.error;
  const rows = seen.data && clicked.data ? parkyElementRows(seen.data, clicked.data) : null;
  const targets = linkTargets(links.data);

  return (
    <Panel>
      <PanelHeader
        icon={MousePointerClick}
        title="Parkys Elemente"
        hint={`Die letzten ${DAYS} Tage. „Im Bild“ zählt einmal je Seitenaufruf und Art, nur wo Parky für den Besucher an ist; die Quote ist gedrückt durch im Bild.`}
      />
      <PanelBody className="space-y-6">
        {!rows && error ? (
          <ErrorState
            message={`Parkys Elemente: ${error.message}`}
            onRetry={() => {
              void seen.refetch();
              void clicked.refetch();
            }}
          />
        ) : !rows ? (
          <SkeletonRows rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm tabular-nums">
              <thead className="text-muted-foreground text-left text-xs">
                <tr>
                  <th className="py-1 font-medium">Element</th>
                  <th className="py-1 font-medium">Art</th>
                  <th className="py-1 text-right font-medium">
                    <Link
                      href={eventHref(PARKY_ELEMENT_EVENTS.seen, BY_KIND)}
                      className="hover:text-primary"
                    >
                      Im Bild
                    </Link>
                  </th>
                  <th className="py-1 text-right font-medium">
                    <Link
                      href={eventHref(PARKY_ELEMENT_EVENTS.clicked, BY_KIND)}
                      className="hover:text-primary"
                    >
                      Gedrückt
                    </Link>
                  </th>
                  <th className="py-1 text-right font-medium">Quote</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.element}:${row.kind}`} className="border-border/40 border-t">
                    <td className="py-1.5">{propValueLabel('element', row.element)}</td>
                    <td className="py-1.5">{propValueLabel('kind', row.kind)}</td>
                    <td className="py-1.5 text-right">{formatCount(row.seen)}</td>
                    <td className="py-1.5 text-right">{formatCount(row.clicked)}</td>
                    <td className="py-1.5 text-right">
                      {row.rate === null ? '–' : formatShare(row.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            <Link
              href={eventHref('assistant_link_clicked', { row: 'prop:target', col: 'page_type' })}
              className="hover:text-primary"
            >
              Links in Parkys Antworten
            </Link>
          </h3>
          {links.error ? (
            <ErrorState message={`Links: ${links.error.message}`} onRetry={links.refetch} />
          ) : !links.data ? (
            <SkeletonRows rows={3} />
          ) : targets.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch kein Link gefolgt.</p>
          ) : (
            <ul className="flex flex-wrap gap-2 text-sm">
              {targets.map(({ target, count }) => (
                <li
                  key={target}
                  className="border-border/60 rounded-lg border px-2.5 py-1 tabular-nums"
                >
                  {target === 'directions' ? 'Route' : pageTypeLabel(target)}{' '}
                  <span className="text-muted-foreground">{formatCount(count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}
