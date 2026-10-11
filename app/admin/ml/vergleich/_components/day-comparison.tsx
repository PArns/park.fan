'use client';

import { useCallback, useMemo, useState, type PointerEvent } from 'react';
import { ChartLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ModelComparisonDay,
  ModelComparisonDayOptions,
} from '@/lib/api/admin-model-comparison';
import {
  chartTop,
  formatFigure,
  headlinersFirst,
  hourTicks,
  LOW_TRUTH_COVERAGE,
  modelColors,
  resolveDaySelection,
  splitSegments,
  suggestedOptionsDate,
  truthCoverage,
  type DayChoice,
} from '@/lib/admin/model-comparison';
import { FIXTURE_DAY_OPTIONS, fixtureDay } from '@/lib/admin/model-comparison-fixture';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { adminKeys, useAdminQuery } from '../../../_lib/api';
import { Field, SearchSelect, Select, useFieldId } from '../../../_ui/controls';
import { EmptyState, ErrorState, LoadingState, Panel, PanelHeader } from '../../../_ui/primitives';

const OPTIONS_PATH = '/api/admin/model-comparison/day/options';
const DAY_PATH = '/api/admin/model-comparison/day';

/**
 * One stored day replayed: date, park, ride and forecast moment chosen from the options endpoint,
 * every model's curve against the measured wait, and each model's error on that day.
 */
export function DayComparison({ fixture }: { fixture: boolean }) {
  const [choice, setChoice] = useState<DayChoice>({ date: null, parkId: null, rideId: null });
  const [originId, setOriginId] = useState<string>('morning');

  // Unpicked, the options are asked for once without a date; when the backend suggests a day
  // other than the one it answered for, they are asked for again for that day.
  const baseQuery = useAdminQuery<ModelComparisonDayOptions>(
    adminKeys.raw(OPTIONS_PATH),
    fixture ? null : OPTIONS_PATH
  );
  const requestDate = choice.date ?? suggestedOptionsDate(baseQuery.data);
  const datedPath = !fixture && requestDate ? `${OPTIONS_PATH}?date=${requestDate}` : null;
  const datedQuery = useAdminQuery<ModelComparisonDayOptions>(
    adminKeys.raw(datedPath ?? 'day-options-undated'),
    datedPath,
    { placeholderData: (previous) => previous }
  );
  const optionsQuery = datedPath ? datedQuery : baseQuery;
  const options = fixture ? FIXTURE_DAY_OPTIONS : (optionsQuery.data ?? baseQuery.data);

  const selection = options ? resolveDaySelection(options, choice) : null;
  const activeDate = selection?.date ?? null;
  const park = selection?.park ?? null;
  const ride = selection?.ride ?? null;
  const rides = park ? headlinersFirst(park.rides) : [];
  const origin = options?.origins.find((o) => o.id === originId) ?? options?.origins[0] ?? null;

  const dayPath =
    !fixture && park && ride && activeDate && origin
      ? `${DAY_PATH}?${new URLSearchParams({
          parkId: park.id,
          date: activeDate,
          attractionId: ride.id,
          origin: origin.id,
        })}`
      : null;
  const dayQuery = useAdminQuery<ModelComparisonDay>(
    adminKeys.raw(dayPath ?? 'fixture-day'),
    dayPath
  );
  const day = fixture && ride && origin ? fixtureDay(ride.id, origin.id) : dayQuery.data;

  const ids = {
    date: useFieldId('day-date'),
    park: useFieldId('day-park'),
    ride: useFieldId('day-ride'),
    origin: useFieldId('day-origin'),
  };

  return (
    <Panel>
      <PanelHeader
        icon={ChartLine}
        title="Tagesvergleich"
        hint="Ein gespeicherter Tag zum Nachsehen: alle Prognosen gegen die echte Wartezeit."
      />
      {!fixture && !options && optionsQuery.isLoading ? (
        <LoadingState />
      ) : !fixture && optionsQuery.error ? (
        <ErrorState message={optionsQuery.error.message} onRetry={() => optionsQuery.refetch()} />
      ) : !options || options.parks.length === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="Noch kein gespeicherter Tag"
          description="Sobald das Archiv einen Tag mit Prognosen und echten Wartezeiten hat, lässt er sich hier auswählen."
        />
      ) : (
        <>
          <div className="border-border/50 grid gap-3 border-b px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Datum" htmlFor={ids.date}>
              <Select
                id={ids.date}
                value={activeDate}
                allowEmpty={false}
                // A new day keeps the park and ride when it still has them.
                onValueChange={(value) =>
                  value &&
                  setChoice({ date: value, parkId: park?.id ?? null, rideId: ride?.id ?? null })
                }
                options={options.dates.map((value) => ({ value, label: formatLongDate(value) }))}
              />
            </Field>
            <Field label="Park" htmlFor={ids.park}>
              <SearchSelect
                id={ids.park}
                value={park?.id ?? null}
                searchPlaceholder="Park suchen…"
                emptyLabel="Kein Park gefunden"
                onValueChange={(value) =>
                  setChoice({ date: activeDate, parkId: value, rideId: null })
                }
                options={options.parks.map((p) => ({
                  value: p.id,
                  label: p.name,
                  hint: [p.city, p.country].filter(Boolean).join(', ') || undefined,
                  keywords: [p.city, p.country],
                }))}
              />
            </Field>
            <Field label="Fahrgeschäft" htmlFor={ids.ride}>
              <SearchSelect
                id={ids.ride}
                value={ride?.id ?? null}
                searchPlaceholder="Fahrgeschäft suchen…"
                emptyLabel="Kein Fahrgeschäft gefunden"
                onValueChange={(value) =>
                  setChoice({ date: activeDate, parkId: park?.id ?? null, rideId: value })
                }
                options={rides.map((r) => ({
                  value: r.id,
                  label: r.name,
                  badge: r.isHeadliner ? 'Hauptattraktion' : undefined,
                }))}
              />
            </Field>
            <Field label="Prognosezeitpunkt" htmlFor={ids.origin}>
              <Select
                id={ids.origin}
                value={origin?.id ?? null}
                allowEmpty={false}
                onValueChange={(value) => value && setOriginId(value)}
                options={options.origins.map((o) => ({ value: o.id, label: o.label }))}
              />
            </Field>
          </div>
          {!fixture && dayQuery.isLoading ? (
            <LoadingState />
          ) : !fixture && dayQuery.error ? (
            <ErrorState message={dayQuery.error.message} onRetry={() => dayQuery.refetch()} />
          ) : day ? (
            <DayView day={day} />
          ) : null}
        </>
      )}
    </Panel>
  );
}

function formatLongDate(date: string): string {
  return getDateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

const DEFAULT_W = 640;
const MIN_W = 300;
const H = 280;
const PAD = { left: 36, right: 22, top: 24, bottom: 26 };

/**
 * The rendered width of an element, so the chart draws in real pixels: an 11 px label stays
 * 11 px on a phone, and the hour labels are thinned against the width they actually get.
 */
function useRenderedWidth(): [
  (element: HTMLDivElement | null) => (() => void) | void,
  number | null,
] {
  const [width, setWidth] = useState<number | null>(null);
  const ref = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function DayView({ day }: { day: ModelComparisonDay }) {
  const [hover, setHover] = useState<number | null>(null);
  const [chartRef, renderedWidth] = useRenderedWidth();
  const W = Math.max(MIN_W, renderedWidth ?? DEFAULT_W);
  const count = day.slots.length;
  const colors = useMemo(() => modelColors(day.series.map((s) => s.model)), [day.series]);
  const top = chartTop([...day.truth, ...day.series.flatMap((s) => s.values)]);
  const x = (index: number) =>
    PAD.left + (count > 1 ? index / (count - 1) : 0.5) * (W - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + (1 - value / top) * (H - PAD.top - PAD.bottom);
  const ticks = hourTicks(day.slots, W - PAD.left - PAD.right);
  const hasForecast = day.series.some((s) => s.values.some((v) => v !== null));
  const coverage = truthCoverage(day);
  const hasTruth = coverage > 0 && day.truth.some((v) => v !== null);

  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const ratio = (px - PAD.left) / (W - PAD.left - PAD.right);
    setHover(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
  };

  const worst = Math.max(...day.scores.map((s) => s.mae), 1e-6);

  return (
    <>
      <div className="text-muted-foreground space-y-0.5 px-4 pt-3 text-xs">
        <p>
          <span className="text-foreground font-medium">
            {day.park.name}, {day.ride.name}
          </span>
          , {formatLongDate(day.date)}
          {day.openingHours
            ? `, geöffnet ${day.openingHours.open} bis ${day.openingHours.close} Uhr.`
            : '.'}{' '}
          Die dicke Linie ist die echte Wartezeit, Lücken heißen: Fahrgeschäft war gestört.
        </p>
        {day.origin.localLabel && (
          <p>
            Prognosen gespeichert am {day.origin.localLabel} (Ortszeit). Echte Werte: letzter
            Messwert je Viertelstunde.
          </p>
        )}
      </div>

      {!hasTruth ? (
        <EmptyState
          icon={ChartLine}
          title="Keine Messwerte an diesem Tag"
          description="Für dieses Fahrgeschäft gibt es an diesem Tag keine Messwerte. Bitte ein anderes wählen."
        />
      ) : !hasForecast ? (
        <EmptyState
          icon={ChartLine}
          title="Für diesen Zeitpunkt ist keine Prognose gespeichert"
          description="Einen anderen Prognosezeitpunkt oder Tag wählen."
        />
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 px-2 pt-3">
            {coverage < LOW_TRUTH_COVERAGE && (
              <p className="text-muted-foreground mx-2 mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs">
                Nur {Math.round(coverage * 100)} % der Viertelstunden haben einen Messwert. Der
                Vergleich stützt sich an diesem Tag auf wenige Messungen.
              </p>
            )}
            <div ref={chartRef}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                width={W}
                height={H}
                className="block w-full touch-pan-y select-none"
                role="img"
                aria-label={`Wartezeit-Verlauf ${day.ride.name}`}
                onPointerMove={pick}
                onPointerDown={pick}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') setHover(null);
                }}
              >
                {Array.from({ length: top / 20 + 1 }, (_, i) => i * 20).map((value) => (
                  <g key={value}>
                    <line
                      x1={PAD.left}
                      x2={W - PAD.right}
                      y1={y(value)}
                      y2={y(value)}
                      className="stroke-border/60"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD.left - 6}
                      y={y(value) + 4}
                      textAnchor="end"
                      className="fill-muted-foreground font-mono text-[11px]"
                    >
                      {value}
                    </text>
                  </g>
                ))}
                <text x={PAD.left} y={PAD.top - 12} className="fill-muted-foreground text-[11px]">
                  Minuten
                </text>
                {ticks.map((index) => (
                  <text
                    key={index}
                    x={x(index)}
                    y={H - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono text-[11px]"
                  >
                    {day.slots[index]}
                  </text>
                ))}
                {day.series.map((s) =>
                  splitSegments(s.values).map((segment, i) => (
                    <polyline
                      key={`${s.model}-${i}`}
                      fill="none"
                      strokeWidth={2}
                      strokeLinejoin="round"
                      className={colors.get(s.model)?.stroke}
                      points={segment.map(([i2, v]) => `${x(i2)},${y(v)}`).join(' ')}
                    />
                  ))
                )}
                {splitSegments(day.truth).map((segment, i) =>
                  segment.length > 1 ? (
                    <polyline
                      key={`truth-${i}`}
                      fill="none"
                      strokeWidth={3.5}
                      strokeLinejoin="round"
                      className="stroke-foreground"
                      points={segment.map(([i2, v]) => `${x(i2)},${y(v)}`).join(' ')}
                    />
                  ) : (
                    <circle
                      key={`truth-${i}`}
                      cx={x(segment[0][0])}
                      cy={y(segment[0][1])}
                      r={3.5}
                      className="fill-foreground"
                    />
                  )
                )}
                {hover !== null && (
                  <line
                    x1={x(hover)}
                    x2={x(hover)}
                    y1={PAD.top}
                    y2={H - PAD.bottom}
                    className="stroke-muted-foreground"
                    strokeDasharray="3 3"
                  />
                )}
              </svg>
            </div>
            <Readout day={day} index={hover} colors={colors} />
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 px-2 pt-2 pb-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="bg-foreground inline-block h-1 w-5 rounded" />
                echte Wartezeit
              </span>
              {day.series.map((s) => (
                <span key={s.model} className="inline-flex items-center gap-1.5">
                  <span
                    className={cn('inline-block h-0.5 w-5 rounded', colors.get(s.model)?.swatch)}
                  />
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="border-border/50 space-y-3 border-t p-4 lg:border-t-0 lg:border-l">
            <h3 className="text-sm font-semibold">Fehler an diesem Tag</h3>
            <p className="text-muted-foreground text-xs">
              Mittlere Abweichung in Minuten
              {day.scores[0] ? `, über ${day.scores[0].n} Viertelstunden mit echtem Wert` : ''}.
              Kürzer ist besser.
            </p>
            <ul className="space-y-2.5">
              {day.scores.map((score, index) => (
                <li key={score.model} className="space-y-1 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn(index === 0 && 'font-semibold')}>
                      {index === 0 ? 'Am besten: ' : ''}
                      {score.label}
                    </span>
                    <span className="font-mono text-xs tabular-nums">
                      {formatFigure(score.mae)} min
                    </span>
                  </div>
                  <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        colors.get(score.model)?.swatch ?? 'bg-muted-foreground',
                        index === 0 && 'ring-foreground ring-1'
                      )}
                      style={{ width: `${(score.mae / worst) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">
              Ein einzelner Tag entscheidet nichts. Er zeigt, wie die Zahlen in der Matrix zustande
              kommen.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Readout({
  day,
  index,
  colors,
}: {
  day: ModelComparisonDay;
  index: number | null;
  colors: Map<string, { stroke: string; swatch: string }>;
}) {
  return (
    <div
      aria-live="polite"
      className="border-border/60 mx-2 mt-2 flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-xs"
    >
      {index === null ? (
        <span className="text-muted-foreground">
          Mit der Maus über die Kurve fahren oder tippen: Uhrzeit und alle Werte erscheinen hier.
        </span>
      ) : (
        <>
          <span className="font-mono font-semibold">{day.slots[index]} Uhr</span>
          <span>
            echt:{' '}
            {day.truth[index] === null ? (
              <span className="text-muted-foreground">gestört</span>
            ) : (
              <b className="font-mono">{Math.round(day.truth[index] ?? 0)} min</b>
            )}
          </span>
          {day.series.map((s) => (
            <span key={s.model} className="inline-flex items-center gap-1.5">
              <span
                className={cn('inline-block h-2 w-2 rounded-full', colors.get(s.model)?.swatch)}
              />
              {s.label}:{' '}
              <b className="font-mono">
                {s.values[index] === null ? '–' : `${Math.round(s.values[index] ?? 0)} min`}
              </b>
            </span>
          ))}
        </>
      )}
    </div>
  );
}
