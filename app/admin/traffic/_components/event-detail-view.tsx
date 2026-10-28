'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, ListChecks, MapPin, Search } from 'lucide-react';
import {
  breakdownValueLabel,
  crosstabDimensions,
  defaultCrosstab,
  entityEditorHref,
  entityPublicHref,
  isResolvedEntity,
  mostCommonLabel,
  resultKindLabel,
  eventInfo,
  eventLabel,
  formatCount,
  formatShare,
  isSearchEvent,
  propLabel,
  propValueLabel,
  sortPropValues,
  trafficQuery,
  unsupportedReason,
} from '@/lib/admin/site-analytics';
import { INTERVAL_SENTENCE, rangeLabel } from '@/lib/admin/traffic-range';
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
import { useTrafficData, useTrafficFilters, type TrafficFilters } from '../_lib/use-traffic';
import { BlockEventButton } from './block-event-button';
import { CrosstabView } from './crosstab-view';
import { TrafficFilterBar } from './filter-bar';
import { UnsupportedNote } from './unsupported-note';

/**
 * Two dimensions of one event against each other, in the address (`?row=&col=`) so a view can be
 * sent on. The dimensions are the page type, the device, the language, the day and every
 * property the event was sent with, so "which search field, from which page" is the same question
 * as "which tab, on which device" for any event.
 */
function EventCrosstab({
  detail,
  filters,
}: {
  detail: EventDetailResponse;
  filters: TrafficFilters;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const dimensions = crosstabDimensions(detail);
  const fallback = defaultCrosstab(detail);
  const pick = (value: string | null, other: string) =>
    value && dimensions.includes(value) && value !== other ? value : null;
  const row = pick(params.get('row'), '') ?? fallback.row;
  const col = pick(params.get('col'), row) ?? (row === fallback.col ? fallback.row : fallback.col);

  const write = useCallback(
    (next: { row?: string; col?: string }) => {
      const query = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) query.set(key, value);
      router.replace(`${pathname}?${query.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return (
    <CrosstabView
      hint="Zwei Merkmale des Ereignisses gegeneinander. Die größten 30 je Achse, der Rest steht unter „Übrige“."
      endpoint={`events/${encodeURIComponent(detail.name)}/crosstab`}
      filters={filters}
      dimensions={dimensions}
      row={row}
      col={col}
      onChange={write}
    />
  );
}

/**
 * One event of the counter taken apart: how often it fired and when, every property it was sent
 * with and the values of each, the combinations of values that came together, a crosstab of any
 * two of them, the page types and device sizes it fired on, and the parks, rides, shows and
 * restaurants behind it, each a way into its editor or its public page. Nothing here is a fixed
 * list: whatever the site sent shows up.
 */
export function EventDetailView({ name }: { name: string }) {
  const filters = useTrafficFilters();
  const reason = unsupportedReason('events', filters.filters);
  const { data, error, refetch } = useTrafficData<EventDetailResponse>(
    `events/${encodeURIComponent(name)}`,
    filters,
    undefined,
    { enabled: !reason }
  );
  const back = `/admin/traffic?${trafficQuery(filters)}`;
  const info = eventInfo(name);
  const windowLabel = rangeLabel(filters.range, filters.today);

  const header = (
    <PanelHeader
      icon={ListChecks}
      title={eventLabel(name)}
      hint={
        info ? (
          <>
            <span className="font-mono">{name}</span>
            <span>{`: ${info.when}`}</span>
          </>
        ) : (
          'Von der Website gesendet, die Verwaltung kennt das Ereignis nicht. Werte und Kreuztabelle kommen aus dem, was ankam.'
        )
      }
      action={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {data && <BlockEventButton name={name} blocked={data.blocked ?? false} />}
          <Link
            href={back}
            className="text-primary flex items-center gap-1 text-xs hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Traffic
          </Link>
        </div>
      }
    />
  );

  const filterRow = (
    <div className="border-border/50 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
      <TrafficFilterBar filters={filters} hint={false} />
    </div>
  );

  if (reason) {
    return (
      <AdminPage width="wide">
        <Panel>
          {header}
          {filterRow}
          <UnsupportedNote reason={reason} filters={filters} />
        </Panel>
      </AdminPage>
    );
  }

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
                  ? `Kein Ereignis namens „${name}“ in den Daten. Die Liste steht unter Traffic.`
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
  const share = (count: number) => (data.total > 0 ? count / data.total : 0);

  return (
    <AdminPage width="wide">
      <Panel>
        {header}
        {filterRow}
        <PanelBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Anzahl" value={formatCount(data.total)} sub={windowLabel} />
          {data.blocked && (
            <div className="border-border/60 bg-muted/20 flex items-center gap-2 rounded-lg border p-3 text-sm sm:col-span-2">
              <Chip tone="warning">gesperrt</Chip>
              <span className="text-muted-foreground text-xs">
                Der Name wird nicht mehr gezählt. Was oben steht, ist von vorher.
              </span>
            </div>
          )}
          {isSearchEvent(name) && (
            <Link
              href={`/admin/traffic/search?${trafficQuery(filters)}`}
              className="border-border/60 bg-muted/20 hover:border-primary/40 flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors sm:col-span-2"
            >
              <Search className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Alle Suchfelder im Vergleich
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
            title={
              data?.blocked
                ? 'Gesperrt, es wird nicht mehr gezählt'
                : 'Im Zeitraum nicht aufgetreten'
            }
            description={
              data?.blocked
                ? 'Was vor der Sperre ankam, bleibt in den älteren Zeiträumen. Mit „Freigeben“ oben wird das Ereignis wieder gezählt.'
                : 'Ein längerer Zeitraum, alle Sprachen oder weniger Filter zeigen mehr, falls das Ereignis überhaupt schon ausgelöst wird.'
            }
          />
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader
              icon={ListChecks}
              title="Verlauf"
              hint={INTERVAL_SENTENCE[data.interval]}
            />
            <PanelBody>
              {data.series.length < 2 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Für einen einzelnen Punkt gibt es keine Kurve.
                </p>
              ) : (
                <SeriesChart
                  label={`${eventLabel(name)} im Verlauf`}
                  days={data.series.map((point) => point.day)}
                  interval={data.interval}
                  partial={data.series.map((point) => point.partial === true)}
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

          <EventCrosstab detail={data} filters={filters} />

          {/* Columns rather than a grid: the number of panels depends on the event, and a grid
              leaves a hole beside the odd one. */}
          <div className="columns-1 gap-5 lg:columns-2 [&>*]:mb-5 [&>*]:break-inside-avoid">
            {data.props.map((prop) => (
              <Panel key={prop.prop}>
                <PanelHeader
                  title={propLabel(prop.prop)}
                  hint={propLabel(prop.prop) === prop.prop ? undefined : prop.prop}
                />
                <PanelBody>
                  <BarList
                    unit="Ereignisse"
                    rows={[
                      ...sortPropValues(prop.prop, prop.values).map((entry) => ({
                        key: entry.value,
                        label: propValueLabel(prop.prop, entry.value),
                        value: entry.count,
                        share: share(entry.count),
                      })),
                      ...(prop.otherCount
                        ? [
                            {
                              key: '\u0000other',
                              label: 'Weitere Werte',
                              value: prop.otherCount,
                              share: share(prop.otherCount),
                            },
                          ]
                        : []),
                    ]}
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
                    share: share(entry.count),
                  }))}
                />
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader
                title="Gerät"
                hint="Telefon, Tablet oder Computer, aus dem User-Agent abgeleitet"
              />
              <PanelBody>
                <BarList
                  unit="Ereignisse"
                  rows={data.byDevice.map((entry) => ({
                    key: entry.value,
                    label: breakdownValueLabel('device', entry.value),
                    value: entry.count,
                    share: share(entry.count),
                  }))}
                />
              </PanelBody>
            </Panel>
          </div>

          {data.combinations.length > 0 && (
            <Panel>
              <PanelHeader
                title="Kombinationen"
                hint={`Welche Werte zusammen gesendet wurden, ${mostCommonLabel(data.combinations.length)}`}
              />
              <PanelBody className="p-0">
                <ul className="divide-border/40 divide-y">
                  {data.combinations.map((combination, index) => (
                    <li key={index} className="flex items-center gap-3 px-4 py-2 text-sm">
                      <span className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1">
                        {Object.entries(combination.props).map(([prop, value]) => (
                          <span key={prop} className="whitespace-nowrap">
                            <span className="text-muted-foreground text-xs">
                              {propLabel(prop)}{' '}
                            </span>
                            {propValueLabel(prop, value)}
                          </span>
                        ))}
                      </span>
                      <span className="text-muted-foreground w-11 shrink-0 text-right text-xs tabular-nums">
                        {formatShare(share(combination.count))}
                      </span>
                      <span className="w-14 shrink-0 text-right font-semibold tabular-nums">
                        {formatCount(combination.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          )}

          {data.entities.length > 0 && (
            <Panel>
              <PanelHeader
                icon={MapPin}
                title="Parks, Fahrgeschäfte und Shows"
                hint={`Wozu das Ereignis gehörte, ${mostCommonLabel(data.entities.length)}. Der Name führt in den Editor, das Symbol auf die Seite.`}
              />
              <PanelBody className="p-0">
                <ul className="divide-border/40 divide-y">
                  {data.entities.map((entity) =>
                    isResolvedEntity(entity) ? (
                      <li key={entity.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="w-28 shrink-0">
                          <Chip tone="muted">{resultKindLabel(entity.kind)}</Chip>
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
                    ) : (
                      <li key={entity.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="w-28 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="text-muted-foreground block">Nicht mehr vorhanden</span>
                          <span className="text-muted-foreground block font-mono text-[11px] break-all">
                            {entity.id}
                          </span>
                        </span>
                        <span className="w-14 shrink-0 text-right font-semibold tabular-nums">
                          {formatCount(entity.count)}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </PanelBody>
            </Panel>
          )}
        </>
      )}
    </AdminPage>
  );
}
