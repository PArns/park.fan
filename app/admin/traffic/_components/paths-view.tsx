'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDownToLine, Route } from 'lucide-react';
import {
  CROSSTAB_FIXED,
  formatCount,
  formatShare,
  pageTypeLabel,
  propValueLabel,
  sectionReach,
  trafficQuery,
  unsupportedReason,
} from '@/lib/admin/site-analytics';
import type { BreakdownResponse, CrosstabResponse } from '@/lib/api/admin-site-analytics';
import {
  AdminPage,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../../_ui/primitives';
import { useTrafficData, useTrafficFilters, type TrafficFilters } from '../_lib/use-traffic';
import { CrosstabView } from './crosstab-view';
import { EventLinks } from './event-links';
import { TrafficFilterBar } from './filter-bar';
import { HourlyNotice } from './hourly-notice';
import { UnsupportedNote } from './unsupported-note';

/** The raw events behind the page, so every number on it can be taken apart. */
const PATHS_EVENT_LINKS = [
  'internal_link_clicked',
  'section_seen',
  'article_read',
  'nav_menu_opened',
  'faq_opened',
] as const;

/** How far down the park pages were read: each place against the page type's views. */
function ReachPanel({ filters }: { filters: TrafficFilters }) {
  const seen = useTrafficData<CrosstabResponse>('events/section_seen/crosstab', filters, {
    row: 'prop:section',
    col: 'page_type',
  });
  const views = useTrafficData<BreakdownResponse>('breakdown', filters, {
    dim: 'page_type',
    limit: 50,
  });
  const reach = seen.data && views.data ? sectionReach(seen.data, views.data) : null;
  const error = seen.error ?? views.error;

  return (
    <Panel>
      <PanelHeader
        icon={ArrowDownToLine}
        title="Wie weit Parkseiten gelesen werden"
        hint="Je Stelle der Seite: wie viele Aufrufe sie ins Bild bekamen, und welcher Anteil aller Aufrufe der Seitenart das ist. Eine Stelle zählt auch dort, wo der Park das Kapitel nicht hat, die Zahl sagt also, wie weit gelesen wurde, nicht, wie oft das Kapitel gesehen wurde."
      />
      <PanelBody>
        {!reach && error ? (
          <ErrorState
            message={`Lesetiefe: ${error.message}`}
            onRetry={() => {
              void seen.refetch();
              void views.refetch();
            }}
          />
        ) : !reach ? (
          <SkeletonRows rows={5} />
        ) : reach.pageTypes.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Noch keine Parkseite gezählt
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm tabular-nums">
                <thead>
                  <tr className="text-muted-foreground text-left text-xs">
                    <th className="py-2 pr-4 font-medium">Stelle</th>
                    {reach.pageTypes.map((type, index) => (
                      <th key={type} className="py-2 pr-4 font-medium">
                        {pageTypeLabel(type)}
                        <span className="block font-normal">
                          {formatCount(reach.views[index])} Aufrufe
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-border/50 divide-y">
                  {reach.rows.map((row) => (
                    <tr key={row.section}>
                      <th scope="row" className="py-2 pr-4 text-left font-normal">
                        {propValueLabel('section', row.section)}
                      </th>
                      {row.cells.map((cell, index) => (
                        <td key={reach.pageTypes[index]} className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-14 text-right">{formatCount(cell.reached)}</span>
                            <span className="bg-muted relative h-1.5 w-20 overflow-hidden rounded-full">
                              <span
                                className="bg-primary absolute inset-y-0 left-0 rounded-full"
                                style={{ width: `${(cell.share ?? 0) * 100}%` }}
                              />
                            </span>
                            <span className="text-muted-foreground w-12 text-xs">
                              {cell.share === null ? '–' : formatShare(cell.share)}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <HourlyNotice data={seen.data} />
          </>
        )}
      </PanelBody>
    </Panel>
  );
}

/** One event's crosstab with its own pickers, opening on the pair the panel is about. */
function EventMatrix({
  name,
  title,
  hint,
  props,
  initial,
  filters,
}: {
  name: string;
  title: string;
  hint: string;
  /** The event's own properties, as `prop:<key>`, offered before the fixed dimensions. */
  props: readonly string[];
  initial: { row: string; col: string };
  filters: TrafficFilters;
}) {
  const [axes, setAxes] = useState(initial);
  return (
    <CrosstabView
      title={title}
      hint={hint}
      endpoint={`events/${name}/crosstab`}
      filters={filters}
      dimensions={[...props, ...CROSSTAB_FIXED]}
      row={axes.row}
      col={axes.col}
      onChange={(next) => setAxes((current) => ({ ...current, ...next }))}
    />
  );
}

/**
 * `/admin/traffic/paths`: where readers go on from a page. How far down the park pages are read,
 * which block's links are followed and to what kind of page, how the header's menus are opened,
 * and which FAQ questions are. Every figure leads back to its event.
 */
export function PathsView() {
  const filters = useTrafficFilters();
  const reason = unsupportedReason('events', filters.filters);

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={Route}
          title="Wege durch die Seite"
          hint="Wohin es von einer Seite weitergeht und wie weit sie gelesen wird. Gezählt werden Blöcke und Seitenarten, nie welcher Link oder welche Frage im Wortlaut."
          action={
            <Link
              href={`/admin/traffic?${trafficQuery(filters)}`}
              className="text-primary flex items-center gap-1 text-xs hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Traffic
            </Link>
          }
        />
        <div className="border-border/50 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <TrafficFilterBar filters={filters} hint={false} />
        </div>
        <p className="text-muted-foreground px-4 pt-3 pb-2 text-xs">Rohdaten:</p>
        <EventLinks names={PATHS_EVENT_LINKS} filters={filters} />
        {reason && <UnsupportedNote reason={reason} filters={filters} />}
      </Panel>
      {!reason && (
        <>
          <ReachPanel filters={filters} />
          <EventMatrix
            name="internal_link_clicked"
            title="Weiter auf park.fan"
            hint="Klicks auf Links zu anderen Seiten von park.fan, nach dem Block, in dem der Link stand, und der Seite, auf der er stand. „Führt zu“ ist die Seitenart des Ziels, „Position“ der Platz unter den Zielen des Blocks."
            props={['prop:block', 'prop:dest', 'prop:position']}
            initial={{ row: 'prop:block', col: 'page_type' }}
            filters={filters}
          />
          <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
            <EventMatrix
              name="nav_menu_opened"
              title="Menüs"
              hint="Wie oft ein Menü des Headers aufklappt, auch beim Darüberfahren mit der Maus, und das Handy-Menü. Was darin angeklickt wird, steht oben unter den Blöcken Header und Handy-Menü."
              props={['prop:menu']}
              initial={{ row: 'prop:menu', col: 'device' }}
              filters={filters}
            />
            <EventMatrix
              name="faq_opened"
              title="FAQ"
              hint="Aufgeklappte Fragen nach ihrem Platz in der Liste und der Seitenart. Der Text der Frage wird nie gesendet."
              props={['prop:position']}
              initial={{ row: 'prop:position', col: 'page_type' }}
              filters={filters}
            />
          </div>
        </>
      )}
    </AdminPage>
  );
}
