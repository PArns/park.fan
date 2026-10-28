'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, ListChecks, MapPin, Search } from 'lucide-react';
import {
  EVENT_INFO,
  breakdownValueLabel,
  entityEditorHref,
  entityPublicHref,
  eventLabel,
  formatCount,
  isSearchEvent,
  propLabel,
  propValueLabel,
  sortPropValues,
  trafficQuery,
  TRAFFIC_RANGES,
} from '@/lib/admin/site-analytics';
import type { EventDetailResponse } from '@/lib/api/admin-site-analytics';
import { BarList, CATEGORICAL, SeriesChart } from '../../_ui/charts';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
} from '../../_ui/primitives';
import { useTrafficData, useTrafficFilters } from '../_lib/use-traffic';
import { TrafficFilterBar } from './filter-bar';

const KIND_LABEL = { park: 'Park', attraction: 'Fahrgeschäft', show: 'Show' } as const;

/**
 * One event of the counter taken apart: how often it fired and when, the values of each
 * property, the page types and device sizes it fired on, and the parks, rides and shows it was
 * about, each a way into its editor or its public page.
 */
export function EventDetailView({ name }: { name: string }) {
  const filters = useTrafficFilters();
  const { data, error, refetch } = useTrafficData<EventDetailResponse>(
    `events/${encodeURIComponent(name)}`,
    filters
  );
  const back = `/admin/traffic?${trafficQuery(filters)}`;
  const info = EVENT_INFO[name as keyof typeof EVENT_INFO];
  const windowLabel = TRAFFIC_RANGES.find((range) => range.days === filters.days)?.label;

  const header = (
    <PanelHeader
      icon={ListChecks}
      title={eventLabel(name)}
      hint={
        <>
          <span className="font-mono">{name}</span>
          {info && <span>{`: ${info.when}`}</span>}
        </>
      }
      action={
        <Link href={back} className="text-primary flex items-center gap-1 text-xs hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Traffic
        </Link>
      }
    />
  );

  const filterRow = (
    <div className="border-border/50 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <TrafficFilterBar filters={filters} />
      <p className="text-muted-foreground text-xs">
        {data ? `${data.from} bis ${data.to} (UTC)` : windowLabel}
      </p>
    </div>
  );

  if (!data) {
    return (
      <AdminPage width="wide">
        <Panel>
          {header}
          {filterRow}
          {error ? (
            <ErrorState
              message={
                error.status === 404
                  ? `Kein Ereignis namens „${name}“. Die Liste steht unter Traffic.`
                  : `Ereignis: ${error.message}`
              }
              onRetry={() => void refetch()}
            />
          ) : (
            <LoadingState label="Lade Ereignis…" />
          )}
        </Panel>
      </AdminPage>
    );
  }

  const empty = data.total === 0;

  return (
    <AdminPage width="wide">
      <Panel>
        {header}
        {filterRow}
        <PanelBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Anzahl" value={formatCount(data.total)} sub={windowLabel} />
          {isSearchEvent(name) && (
            <Link
              href={`/admin/traffic/search?${trafficQuery(filters)}`}
              className="border-border/60 bg-muted/20 hover:border-primary/40 flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors sm:col-span-2"
            >
              <Search className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Alle sieben Suchfelder im Vergleich
                <span className="text-muted-foreground block text-xs">
                  Hero oder Header, von welcher Seite, auf welchem Gerät
                </span>
              </span>
            </Link>
          )}
        </PanelBody>
      </Panel>

      {empty ? (
        <Panel>
          <EmptyState
            icon={ListChecks}
            title="Im Zeitraum nicht aufgetreten"
            description="Ein längerer Zeitraum oder alle Sprachen zeigen mehr, falls das Ereignis überhaupt schon ausgelöst wird."
          />
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader icon={ListChecks} title="Verlauf" hint="Ein Punkt je Tag, UTC" />
            <PanelBody>
              {data.series.length < 2 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Für einen einzelnen Tag gibt es keine Kurve.
                </p>
              ) : (
                <SeriesChart
                  label={`${eventLabel(name)} pro Tag`}
                  days={data.series.map((point) => point.day)}
                  height={180}
                  series={[
                    {
                      key: 'count',
                      label: eventLabel(name),
                      color: CATEGORICAL[0],
                      values: data.series.map((point) => point.count),
                    },
                  ]}
                />
              )}
            </PanelBody>
          </Panel>

          {/* Columns rather than a grid: the number of panels depends on the event, and a grid
              leaves a hole beside the odd one. */}
          <div className="columns-1 gap-5 lg:columns-2 [&>*]:mb-5 [&>*]:break-inside-avoid">
            {data.props.map((prop) => (
              <Panel key={prop.prop}>
                <PanelHeader title={propLabel(prop.prop)} hint={prop.prop} />
                <PanelBody>
                  <BarList
                    unit="Ereignisse"
                    rows={sortPropValues(prop.prop, prop.values).map((entry) => ({
                      key: entry.value,
                      label: propValueLabel(prop.prop, entry.value),
                      value: entry.count,
                      share: data.total > 0 ? entry.count / data.total : 0,
                    }))}
                  />
                </PanelBody>
              </Panel>
            ))}
            <Panel>
              <PanelHeader title="Seitenarten" hint="Auf welcher Art Seite es ausgelöst wurde" />
              <PanelBody>
                <BarList
                  unit="Ereignisse"
                  rows={data.byPageType.map((entry) => ({
                    key: entry.value,
                    label: breakdownValueLabel('page_type', entry.value),
                    value: entry.count,
                    share: data.total > 0 ? entry.count / data.total : 0,
                  }))}
                />
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader title="Gerätegröße" hint="Fensterbreite beim Auslösen" />
              <PanelBody>
                <BarList
                  unit="Ereignisse"
                  rows={data.byViewport.map((entry) => ({
                    key: entry.value,
                    label: breakdownValueLabel('viewport', entry.value),
                    value: entry.count,
                    share: data.total > 0 ? entry.count / data.total : 0,
                  }))}
                />
              </PanelBody>
            </Panel>
          </div>

          {data.entities.length > 0 && (
            <Panel>
              <PanelHeader
                icon={MapPin}
                title="Parks, Fahrgeschäfte und Shows"
                hint={`Wozu das Ereignis gehörte, die ${data.entities.length} häufigsten. Der Name führt in den Editor, das Symbol auf die Seite.`}
              />
              <PanelBody className="p-0">
                <ul className="divide-border/40 divide-y">
                  {data.entities.map((entity) => (
                    <li key={entity.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="w-28 shrink-0">
                        <Chip tone="muted">{KIND_LABEL[entity.kind]}</Chip>
                      </span>
                      <Link
                        href={entityEditorHref(entity)}
                        className="hover:text-primary min-w-0 flex-1 truncate font-medium transition-colors"
                      >
                        {entity.name}
                      </Link>
                      <Link
                        href={entityEditorHref(entity)}
                        className="text-muted-foreground hover:text-primary hidden shrink-0 text-xs sm:block"
                      >
                        Editor
                      </Link>
                      <a
                        href={entityPublicHref(entity)}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`${entity.name} auf park.fan öffnen`}
                        title="Auf park.fan öffnen"
                        className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <span className="w-14 shrink-0 text-right font-semibold tabular-nums">
                        {formatCount(entity.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          )}
        </>
      )}
    </AdminPage>
  );
}
